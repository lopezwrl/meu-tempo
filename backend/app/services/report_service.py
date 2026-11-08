from datetime import date, timedelta
from collections import defaultdict
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.services.estimate_service import estimation_precision

from app.utils.current_user import CURRENT_USER_ID


def _entries_between(start_date, end_date):
    """TimeEntries fechados cujo início cai no intervalo [start_date, end_date]."""
    return (
        TimeEntry.query.join(Task, Task.id == TimeEntry.task_id)
        .filter(
            Task.user_id == CURRENT_USER_ID,
            TimeEntry.duration_seconds.isnot(None),
            TimeEntry.start_time >= start_date,
            TimeEntry.start_time < end_date + timedelta(days=1),
        )
        .all()
    )


def daily_summary(day=None):
    day = day or date.today()
    entries = _entries_between(day, day)
    worked_minutes = round(sum(e.duration_seconds for e in entries) / 60)

    day_tasks = Task.query.filter_by(user_id=CURRENT_USER_ID, date=day).all()
    planned_minutes = sum(t.estimated_minutes or 0 for t in day_tasks if t.status != "cancelada")
    completed = [t for t in day_tasks if t.status == "concluida"]

    return {
        "date": day.isoformat(),
        "worked_minutes": worked_minutes,
        "planned_minutes": planned_minutes,
        "difference_minutes": worked_minutes - planned_minutes,
        "completed_tasks": len(completed),
        "session_count": len(entries),
    }


def weekly_summary(reference_day=None):
    reference_day = reference_day or date.today()
    start = reference_day - timedelta(days=reference_day.weekday())  # segunda-feira
    end = start + timedelta(days=6)

    entries = _entries_between(start, end)
    worked_minutes = round(sum(e.duration_seconds for e in entries) / 60)

    week_tasks = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.date >= start, Task.date <= end
    ).all()
    planned_minutes = sum(t.estimated_minutes or 0 for t in week_tasks if t.status != "cancelada")
    completed = [t for t in week_tasks if t.status == "concluida"]
    project_ids = {t.project_id for t in week_tasks if t.project_id}

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "worked_minutes": worked_minutes,
        "planned_minutes": planned_minutes,
        "completed_tasks": len(completed),
        "precision_percent": estimation_precision(completed),
        "projects_touched": len(project_ids),
    }


def time_by_category(start=None, end=None):
    query = Task.query.filter(Task.user_id == CURRENT_USER_ID)
    if start:
        query = query.filter(Task.date >= start)
    if end:
        query = query.filter(Task.date <= end)

    totals = defaultdict(lambda: {"minutes": 0, "icon": "🗂"})
    for task in query.all():
        minutes = task.worked_minutes
        if not minutes:
            continue
        label = task.category.name if task.category else "Sem categoria"
        totals[label]["minutes"] += minutes
        if task.category:
            totals[label]["icon"] = task.category.icon

    return sorted(
        [{"label": k, "minutes": v["minutes"], "icon": v["icon"]} for k, v in totals.items()],
        key=lambda x: x["minutes"],
        reverse=True,
    )


def time_by_project():
    from app.models.project import Project
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    result = []
    for p in projects:
        minutes = sum(t.worked_minutes for t in p.tasks)
        if minutes:
            result.append({"label": p.name, "minutes": minutes})
    return sorted(result, key=lambda x: x["minutes"], reverse=True)


def history(start=None, end=None, project_id=None, category_id=None, task_id=None):
    query = (
        TimeEntry.query.join(Task, Task.id == TimeEntry.task_id)
        .filter(Task.user_id == CURRENT_USER_ID, TimeEntry.duration_seconds.isnot(None))
    )
    if start:
        query = query.filter(TimeEntry.start_time >= start)
    if end:
        query = query.filter(TimeEntry.start_time < end + timedelta(days=1))
    if project_id:
        query = query.filter(Task.project_id == int(project_id))
    if category_id:
        query = query.filter(Task.category_id == int(category_id))
    if task_id:
        query = query.filter(Task.id == int(task_id))

    entries = query.order_by(TimeEntry.start_time.desc()).all()
    return [
        {
            "id": e.id,
            "task_id": e.task_id,
            "task_name": e.task.name,
            "project_name": e.task.project.name if e.task.project else None,
            "category_name": e.task.category.name if e.task.category else None,
            "date": e.start_time.strftime("%d/%m/%Y"),
            "start": e.start_time.strftime("%H:%M"),
            "end": e.end_time.strftime("%H:%M") if e.end_time else None,
            "duration_minutes": round(e.duration_seconds / 60) if e.duration_seconds else 0,
        }
        for e in entries
    ]


# ==================== Fase 4: gráficos e análises ====================

def hours_per_day(days=30):
    """Minutos trabalhados por dia nos últimos `days` dias (incluindo hoje)."""
    end = date.today()
    start = end - timedelta(days=days - 1)
    entries = _entries_between(start, end)

    totals = defaultdict(int)
    for e in entries:
        totals[e.start_time.date()] += e.duration_seconds

    result = []
    cursor = start
    while cursor <= end:
        result.append({"date": cursor.isoformat(), "minutes": round(totals.get(cursor, 0) / 60)})
        cursor += timedelta(days=1)
    return result


def _week_bounds(reference_day):
    start = reference_day - timedelta(days=reference_day.weekday())
    return start, start + timedelta(days=6)


def tasks_per_week(weeks=8):
    """Para cada uma das últimas `weeks` semanas: tarefas concluídas no prazo
    x concluídas com atraso (finalizadas depois da data planejada)."""
    today = date.today()
    this_week_start, _ = _week_bounds(today)
    result = []
    for i in range(weeks - 1, -1, -1):
        start = this_week_start - timedelta(weeks=i)
        end = start + timedelta(days=6)
        completed = Task.query.filter(
            Task.user_id == CURRENT_USER_ID, Task.status == "concluida",
            Task.completed_at.isnot(None),
            Task.completed_at >= start, Task.completed_at < end + timedelta(days=1),
        ).all()
        late = [t for t in completed if t.date and t.completed_at.date() > t.date]
        result.append({
            "start": start.isoformat(),
            "label": f"{start.day:02d}/{start.month:02d}",
            "completed_on_time": len(completed) - len(late),
            "completed_late": len(late),
        })
    return result


def estimated_vs_real_by_category():
    """Média estimado x média real por categoria, com base em tarefas concluídas."""
    from app.services.estimate_service import accuracy_bias
    from app.models.category import Category

    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    result = []
    for cat in categories:
        tasks = [
            t for t in cat.tasks
            if t.status == "concluida" and t.estimated_minutes and t.real_minutes
        ]
        if not tasks:
            continue
        avg_est = round(sum(t.estimated_minutes for t in tasks) / len(tasks))
        avg_real = round(sum(t.real_minutes for t in tasks) / len(tasks))
        result.append({
            "label": cat.name,
            "icon": cat.icon,
            "avg_estimated": avg_est,
            "avg_real": avg_real,
            "deviation_percent": accuracy_bias(cat.id),
            "sample_size": len(tasks),
        })
    return sorted(result, key=lambda x: x["sample_size"], reverse=True)


def estimated_vs_real_by_project():
    """Média estimado x média real por projeto, com base em tarefas concluídas."""
    from app.models.project import Project

    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    result = []
    for p in projects:
        tasks = [
            t for t in p.tasks
            if t.status == "concluida" and t.estimated_minutes and t.real_minutes
        ]
        if not tasks:
            continue
        avg_est = round(sum(t.estimated_minutes for t in tasks) / len(tasks))
        avg_real = round(sum(t.real_minutes for t in tasks) / len(tasks))
        diffs = [(t.real_minutes - t.estimated_minutes) / t.estimated_minutes for t in tasks]
        result.append({
            "label": p.name,
            "avg_estimated": avg_est,
            "avg_real": avg_real,
            "deviation_percent": round((sum(diffs) / len(diffs)) * 100),
            "sample_size": len(tasks),
        })
    return sorted(result, key=lambda x: x["sample_size"], reverse=True)


def precision_trend(weeks=8):
    """Precisão das estimativas (%) semana a semana, nas últimas `weeks` semanas."""
    today = date.today()
    this_week_start, _ = _week_bounds(today)
    result = []
    for i in range(weeks - 1, -1, -1):
        start = this_week_start - timedelta(weeks=i)
        end = start + timedelta(days=6)
        completed = Task.query.filter(
            Task.user_id == CURRENT_USER_ID, Task.status == "concluida",
            Task.completed_at.isnot(None),
            Task.completed_at >= start, Task.completed_at < end + timedelta(days=1),
        ).all()
        result.append({
            "start": start.isoformat(),
            "label": f"{start.day:02d}/{start.month:02d}",
            "precision_percent": estimation_precision(completed),
            "sample_size": len(completed),
        })
    return result


def precision_trend_message(trend):
    """Frase simples comparando a precisão mais recente com a de ~4 semanas atrás."""
    with_data = [p for p in trend if p["precision_percent"] is not None]
    if len(with_data) < 2:
        return "Ainda não há semanas suficientes com tarefas concluídas para mostrar uma tendência."

    latest = with_data[-1]
    earliest_comparable = with_data[max(0, len(with_data) - 5)]
    if latest is earliest_comparable:
        return "Ainda não há semanas suficientes com tarefas concluídas para mostrar uma tendência."

    diff = latest["precision_percent"] - earliest_comparable["precision_percent"]
    if abs(diff) < 3:
        return "Sua precisão de estimativas está estável nas últimas semanas."
    direction = "mais precisas" if diff > 0 else "menos precisas"
    return f"Suas estimativas desta semana estão, em média, {abs(diff)}% {direction} do que há cerca de um mês."


def productivity_by_hour():
    """Em quais horas do dia o usuário mais trabalha, e em quais horas as
    tarefas concluídas tiveram menor desvio entre estimado e real."""
    entries = (
        TimeEntry.query.join(Task, Task.id == TimeEntry.task_id)
        .filter(Task.user_id == CURRENT_USER_ID, TimeEntry.duration_seconds.isnot(None))
        .all()
    )

    minutes_by_hour = defaultdict(int)
    for e in entries:
        minutes_by_hour[e.start_time.hour] += round(e.duration_seconds / 60)

    hours_chart = [{"hour": h, "minutes": minutes_by_hour.get(h, 0)} for h in range(24)]

    if len(entries) < 10:
        return {
            "hours_chart": hours_chart,
            "peak_message": "Ainda não há sessões suficientes para identificar seus horários mais produtivos.",
            "precision_message": None,
        }

    top_hours = sorted(minutes_by_hour.items(), key=lambda x: x[1], reverse=True)[:3]
    top_hours = sorted(h for h, _ in top_hours)

    def fmt_range(hours):
        return f"{hours[0]:02d}:00" if len(hours) == 1 else f"{hours[0]:02d}:00 e {hours[-1]:02d}:59"

    peak_message = f"Você costuma trabalhar mais entre {fmt_range(top_hours)}."

    # Desvio médio (real vs estimado) das tarefas, atribuído à hora de início
    # da primeira sessão de cada tarefa concluída.
    dev_by_hour = defaultdict(list)
    tasks_seen = {}
    for e in sorted(entries, key=lambda x: x.start_time):
        task = e.task
        if task.id in tasks_seen or task.status != "concluida" or not task.estimated_minutes or not task.real_minutes:
            continue
        tasks_seen[task.id] = True
        deviation = abs(task.real_minutes - task.estimated_minutes) / task.estimated_minutes
        dev_by_hour[e.start_time.hour].append(deviation)

    precision_message = None
    qualifying = {h: v for h, v in dev_by_hour.items() if len(v) >= 3}
    if qualifying:
        best_hour = min(qualifying, key=lambda h: sum(qualifying[h]) / len(qualifying[h]))
        precision_message = f"Suas estimativas costumam ser mais precisas em tarefas iniciadas por volta das {best_hour:02d}:00."

    return {"hours_chart": hours_chart, "peak_message": peak_message, "precision_message": precision_message}


def week_executive_summary(reference_day=None):
    """Resumo executivo da semana: criadas, concluídas, atrasadas, canceladas,
    horas, precisão, maior projeto e categoria que mais consumiu tempo."""
    reference_day = reference_day or date.today()
    start, end = _week_bounds(reference_day)

    created = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.created_at >= start, Task.created_at < end + timedelta(days=1)
    ).count()

    week_tasks = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.date >= start, Task.date <= end
    ).all()
    completed = [t for t in week_tasks if t.status == "concluida"]
    cancelled = [t for t in week_tasks if t.status == "cancelada"]
    overdue = [t for t in week_tasks if t.is_overdue]

    entries = _entries_between(start, end)
    worked_minutes = round(sum(e.duration_seconds for e in entries) / 60)
    planned_minutes = sum(t.estimated_minutes or 0 for t in week_tasks if t.status != "cancelada")

    by_project = defaultdict(int)
    by_category = defaultdict(int)
    for t in week_tasks:
        if not t.worked_minutes:
            continue
        if t.project:
            by_project[t.project.name] += t.worked_minutes
        if t.category:
            by_category[t.category.name] += t.worked_minutes

    top_project = max(by_project.items(), key=lambda x: x[1])[0] if by_project else None
    top_category = max(by_category.items(), key=lambda x: x[1])[0] if by_category else None

    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "created": created,
        "completed": len(completed),
        "overdue": len(overdue),
        "cancelled": len(cancelled),
        "worked_minutes": worked_minutes,
        "planned_minutes": planned_minutes,
        "precision_percent": estimation_precision(completed),
        "top_project": top_project,
        "top_category": top_category,
    }
