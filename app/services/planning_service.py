from datetime import timedelta
from app.models.db import db
from app.models.task import Task
from app.services import schedule_service, report_service
from app.services.schedule_service import to_hhmm
from app.services.activity_service import log_event

from app.utils.current_user import CURRENT_USER_ID
PRIORITY_RANK = {"urgente": 3, "alta": 2, "media": 1, "baixa": 0}
DEFAULT_TASK_MINUTES = 30


def _pending_tasks_for_date(date):
    return Task.query.filter(
        Task.user_id == CURRENT_USER_ID,
        Task.date == date,
        Task.status.in_(["pendente", "pausada"]),
    ).all()


def _to_minutes(hhmm):
    if not hhmm:
        return None
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


# ---------- Linha do tempo do dia ----------

def day_timeline(date):
    window = schedule_service.work_window_for_date(date)
    fixed_blocks = []
    for start, end, label, kind in schedule_service.busy_blocks_for_date(date):
        fixed_blocks.append({"type": kind, "label": label, "start": to_hhmm(start), "end": to_hhmm(end), "start_min": start, "end_min": end})

    all_tasks_today = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.date == date, Task.status != "cancelada"
    ).all()

    scheduled_tasks, unscheduled_tasks = [], []
    for task in all_tasks_today:
        if task.time:
            start = _to_minutes(task.time)
            duration = task.estimated_minutes or DEFAULT_TASK_MINUTES
            scheduled_tasks.append({
                "type": "tarefa", "task_id": task.id, "label": task.name,
                "start": task.time, "end": to_hhmm(start + duration),
                "start_min": start, "end_min": start + duration,
                "priority": task.priority, "status": task.status,
                "is_running": task.is_running,
            })
        else:
            unscheduled_tasks.append(task)

    blocks = sorted(fixed_blocks + scheduled_tasks, key=lambda b: b["start_min"])

    free_slots = []
    if window:
        cursor = window[0]
        for b in blocks:
            if b["start_min"] > cursor:
                free_slots.append({"start": to_hhmm(cursor), "end": to_hhmm(b["start_min"]), "duration_minutes": b["start_min"] - cursor})
            cursor = max(cursor, b["end_min"])
        if cursor < window[1]:
            free_slots.append({"start": to_hhmm(cursor), "end": to_hhmm(window[1]), "duration_minutes": window[1] - cursor})

    return {
        "date": date.isoformat(),
        "is_working_day": window is not None,
        "work_start": to_hhmm(window[0]) if window else None,
        "work_end": to_hhmm(window[1]) if window else None,
        "blocks": blocks,
        "free_slots": free_slots,
        "unscheduled_tasks": [t.to_dict() for t in unscheduled_tasks],
    }


def day_slots(date, slot_minutes=30):
    """Divide a jornada do dia em blocos fixos (padrão 30min) já preenchidos
    com o que ocupa cada intervalo — usado para desenhar a timeline visual."""
    timeline = day_timeline(date)
    if not timeline["is_working_day"]:
        return []

    start = _to_minutes(timeline["work_start"])
    end = _to_minutes(timeline["work_end"])

    occupied = []
    for b in timeline["blocks"]:
        occupied.append(b)

    slots = []
    cursor = start
    while cursor < end:
        slot_end = min(cursor + slot_minutes, end)
        match = next((b for b in occupied if b["start_min"] <= cursor < b["end_min"]), None)
        if match:
            slots.append({
                "start": to_hhmm(cursor), "end": to_hhmm(slot_end),
                "type": match["type"], "label": match["label"],
                "task_id": match.get("task_id"), "priority": match.get("priority"),
                "status": match.get("status"), "is_running": match.get("is_running"),
                "is_start": match["start_min"] == cursor,
            })
        else:
            slots.append({"start": to_hhmm(cursor), "end": to_hhmm(slot_end), "type": "livre", "label": None})
        cursor = slot_end

    return slots


# ---------- Organização automática do dia ----------

def _priority_sort_key(task):
    return (
        -PRIORITY_RANK.get(task.priority, 1),
        _to_minutes(task.deadline_time) if task.deadline_time else 9999,
        task.estimated_minutes or DEFAULT_TASK_MINUTES,
    )


def organize_day(date, apply=False):
    window = schedule_service.work_window_for_date(date)
    if not window:
        return {"error": "Este dia não é um dia útil na sua jornada configurada."}

    busy = [(s, e) for s, e, _, _ in schedule_service.busy_blocks_for_date(date)]
    fixed_tasks = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.date == date,
        Task.time.isnot(None), Task.status.notin_(["concluida", "cancelada"]),
    ).all()
    for t in fixed_tasks:
        start = _to_minutes(t.time)
        busy.append((start, start + (t.estimated_minutes or DEFAULT_TASK_MINUTES)))

    busy.sort(key=lambda b: b[0])
    free = []
    cursor = window[0]
    for s, e in busy:
        if s > cursor:
            free.append([cursor, s])
        cursor = max(cursor, e)
    if cursor < window[1]:
        free.append([cursor, window[1]])

    flexible = sorted(_pending_tasks_for_date(date), key=_priority_sort_key)

    suggestions, unfit = [], []
    for task in flexible:
        duration = task.estimated_minutes or DEFAULT_TASK_MINUTES
        placed = False
        for slot in free:
            if slot[1] - slot[0] >= duration:
                suggestions.append({
                    "task_id": task.id, "name": task.name, "priority": task.priority,
                    "estimated_minutes": duration, "suggested_time": to_hhmm(slot[0]),
                })
                slot[0] += duration
                placed = True
                break
        if not placed:
            unfit.append({"task_id": task.id, "name": task.name, "estimated_minutes": duration})

    if apply:
        for s in suggestions:
            task = db.session.get(Task, s["task_id"])
            task.time = s["suggested_time"]
        if suggestions:
            log_event("day_organized", f"{len(suggestions)} tarefa(s) organizadas automaticamente em {date.isoformat()}.")
        db.session.commit()

    return {"suggestions": suggestions, "unfit": unfit, "applied": bool(apply)}


# ---------- Sobrecarga do dia ----------

def overload_detail(date):
    capacity = schedule_service.capacity_minutes_for_date(date)
    pending = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.date == date,
        Task.status.notin_(["concluida", "cancelada"]),
    ).all()
    remaining_needed = sum(t.estimated_minutes or DEFAULT_TASK_MINUTES for t in pending)
    worked_already = report_service.daily_summary(date)["worked_minutes"]
    available = max(capacity - worked_already, 0)
    overload_minutes = max(remaining_needed - available, 0)

    suggestions = []
    if overload_minutes > 0:
        candidates = sorted(
            pending,
            key=lambda t: (PRIORITY_RANK.get(t.priority, 1), -(t.estimated_minutes or DEFAULT_TASK_MINUTES)),
        )
        covered = 0
        for t in candidates:
            if covered >= overload_minutes:
                break
            suggestions.append({
                "task_id": t.id, "name": t.name, "priority": t.priority,
                "estimated_minutes": t.estimated_minutes or DEFAULT_TASK_MINUTES,
            })
            covered += t.estimated_minutes or DEFAULT_TASK_MINUTES

    return {
        "date": date.isoformat(),
        "capacity_minutes": capacity,
        "remaining_needed_minutes": remaining_needed,
        "available_minutes": available,
        "overload_minutes": overload_minutes,
        "postpone_suggestions": suggestions,
    }


def postpone_task(task_id):
    task = db.get_or_404(Task, task_id)
    if task.date:
        task.date = task.date + timedelta(days=1)
    task.time = None
    log_event("task_postponed", f'Tarefa "{task.name}" adiada para amanhã.', task_id=task.id)
    db.session.commit()
    return task


# ---------- Semana ----------

WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


def week_overview(start_date):
    days = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        capacity = schedule_service.capacity_minutes_for_date(day)
        tasks = Task.query.filter(
            Task.user_id == CURRENT_USER_ID, Task.date == day, Task.status != "cancelada"
        ).all()
        planned = sum(t.estimated_minutes or DEFAULT_TASK_MINUTES for t in tasks)
        percent = round((planned / capacity) * 100) if capacity else (100 if planned else 0)
        days.append({
            "date": day.isoformat(),
            "weekday_label": WEEKDAY_SHORT[i],
            "task_count": len(tasks),
            "planned_minutes": planned,
            "capacity_minutes": capacity,
            "percent": percent,
        })
    return days


def balance_week(start_date, apply=False):
    from datetime import date as date_cls
    days = week_overview(start_date)
    overloaded = [d for d in days if d["percent"] > 100]
    underloaded = [d for d in days if d["percent"] < 70]

    suggestions = []
    for over in overloaded:
        over_date = date_cls.fromisoformat(over["date"])
        excess = round(over["planned_minutes"] - over["capacity_minutes"])
        if excess <= 0:
            continue
        movable = sorted(
            _pending_tasks_for_date(over_date),
            key=lambda t: PRIORITY_RANK.get(t.priority, 1),
        )
        for task in movable:
            if excess <= 0:
                break
            for under in underloaded:
                under_date = date_cls.fromisoformat(under["date"])
                spare = under["capacity_minutes"] - under["planned_minutes"]
                duration = task.estimated_minutes or DEFAULT_TASK_MINUTES
                if spare >= duration:
                    suggestions.append({
                        "task_id": task.id, "name": task.name,
                        "from_date": over_date.isoformat(), "to_date": under_date.isoformat(),
                        "reason": f"{over['weekday_label']} está acima da capacidade; {under['weekday_label']} tem espaço livre.",
                    })
                    under["planned_minutes"] += duration
                    excess -= duration
                    break

    if apply:
        for s in suggestions:
            task = db.session.get(Task, s["task_id"])
            task.date = date_cls.fromisoformat(s["to_date"])
            task.time = None
        if suggestions:
            log_event("week_balanced", f"{len(suggestions)} tarefa(s) redistribuídas para equilibrar a semana.")
        db.session.commit()

    return {"days": days, "suggestions": suggestions, "applied": bool(apply)}
