from datetime import date, timedelta
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.activity_log import ActivityLog

from app.utils.current_user import CURRENT_USER_ID

TASK_MILESTONES = [10, 50, 100, 250, 500]
HOUR_MILESTONES = [10, 50, 100, 250, 500]
STREAK_MILESTONES = [3, 7, 14, 30]


def _total_tasks_completed():
    return Task.query.filter_by(user_id=CURRENT_USER_ID, status="concluida").count()


def _total_hours_logged():
    entries = TimeEntry.query.join(Task, Task.id == TimeEntry.task_id).filter(
        Task.user_id == CURRENT_USER_ID, TimeEntry.duration_seconds.isnot(None)
    ).all()
    return sum(e.duration_seconds for e in entries) / 3600


def current_organize_streak():
    """Dias consecutivos (terminando hoje ou ontem) em que 'Organizar meu dia' foi usado."""
    events = ActivityLog.query.filter_by(user_id=CURRENT_USER_ID, event_type="day_organized").all()
    day_set = {e.created_at.date() for e in events}
    if not day_set:
        return 0

    today = date.today()
    cursor = today if today in day_set else today - timedelta(days=1)
    if cursor not in day_set:
        return 0

    streak = 0
    while cursor in day_set:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def has_clean_week():
    """Nenhuma tarefa atrasada (pendente vencida ou concluída fora do prazo)
    nos últimos 7 dias, e ao menos uma tarefa concluída no período."""
    today = date.today()
    week_ago = today - timedelta(days=6)

    still_overdue = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.status.notin_(["concluida", "cancelada"]),
        Task.date < today, Task.date >= week_ago,
    ).count()

    completed = Task.query.filter(
        Task.user_id == CURRENT_USER_ID, Task.status == "concluida",
        Task.completed_at >= week_ago,
    ).all()
    if not completed:
        return False
    late = [t for t in completed if t.date and t.completed_at.date() > t.date]

    return still_overdue == 0 and len(late) == 0


def _milestone_progress(current, milestones):
    achieved = [m for m in milestones if current >= m]
    next_target = next((m for m in milestones if current < m), None)
    return achieved, next_target


def get_achievements():
    """Retorna as conquistas já alcançadas e a próxima em progresso em cada
    categoria — pensado para uma exibição discreta, sem pop-ups."""
    tasks_done = _total_tasks_completed()
    hours_done = _total_hours_logged()
    streak = current_organize_streak()

    tasks_achieved, tasks_next = _milestone_progress(tasks_done, TASK_MILESTONES)
    hours_achieved, hours_next = _milestone_progress(int(hours_done), HOUR_MILESTONES)
    streak_achieved, streak_next = _milestone_progress(streak, STREAK_MILESTONES)

    achievements = []
    if tasks_achieved:
        achievements.append({
            "key": "tasks",
            "title": f"{tasks_achieved[-1]} tarefas concluídas",
            "progress": tasks_done, "next_target": tasks_next,
        })
    if hours_achieved:
        achievements.append({
            "key": "hours",
            "title": f"{hours_achieved[-1]} horas registradas",
            "progress": round(hours_done), "next_target": hours_next,
        })
    if streak_achieved:
        achievements.append({
            "key": "streak",
            "title": f"{streak_achieved[-1]} dias seguidos organizando o dia",
            "progress": streak, "next_target": streak_next,
        })
    if has_clean_week():
        achievements.append({"key": "clean_week", "title": "Semana sem tarefas atrasadas", "progress": None, "next_target": None})

    next_up = []
    if tasks_next:
        next_up.append({"key": "tasks", "label": f"{tasks_next} tarefas concluídas", "progress": tasks_done, "target": tasks_next})
    if hours_next:
        next_up.append({"key": "hours", "label": f"{hours_next} horas registradas", "progress": round(hours_done), "target": hours_next})
    if streak_next:
        next_up.append({"key": "streak", "label": f"{streak_next} dias seguidos organizando o dia", "progress": streak, "target": streak_next})

    return {"achieved": achievements, "next_up": next_up}
