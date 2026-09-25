from datetime import date, timedelta
from app.services import schedule_service

from app.utils.current_user import CURRENT_USER_ID


def project_stats(project):
    tasks = project.tasks
    total_tasks = len(tasks)
    done_tasks = [t for t in tasks if t.status == "concluida"]

    estimated_from_tasks = sum(t.estimated_minutes or 0 for t in tasks)
    worked_minutes = sum(t.worked_minutes for t in tasks)

    estimated_minutes = project.estimated_minutes or estimated_from_tasks or None
    remaining_minutes = None
    if estimated_minutes is not None:
        remaining_minutes = max(estimated_minutes - worked_minutes, 0)

    progress_percent = round((len(done_tasks) / total_tasks) * 100) if total_tasks else 0

    risk = _deadline_risk(project, remaining_minutes)

    return {
        "total_tasks": total_tasks,
        "done_tasks": len(done_tasks),
        "progress_percent": progress_percent,
        "estimated_minutes": estimated_minutes,
        "worked_minutes": worked_minutes,
        "remaining_minutes": remaining_minutes,
        "risk": risk,
    }


def _deadline_risk(project, remaining_minutes):
    """Compara o tempo restante estimado com a capacidade real dos dias até o
    prazo (jornada configurada em Configurações, já descontando fins de
    semana não úteis, almoço e compromissos fixos)."""
    if not project.deadline or remaining_minutes is None:
        return None

    today = date.today()
    days_left = (project.deadline - today).days
    if days_left < 0:
        return {"level": "atrasado", "message": "O prazo deste projeto já passou."}

    available_minutes = sum(
        schedule_service.capacity_minutes_for_date(today + timedelta(days=i))
        for i in range(days_left + 1)
    )

    if available_minutes == 0 and remaining_minutes > 0:
        return {"level": "risco", "message": "Não há dias úteis disponíveis até o prazo e ainda há tempo estimado restante."}

    if remaining_minutes > available_minutes:
        return {
            "level": "risco",
            "message": "Com a capacidade disponível na sua jornada até o prazo, este projeto corre risco de atraso.",
        }

    return {"level": "no_prazo", "message": "Dentro da capacidade disponível até o prazo."}
