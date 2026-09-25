from datetime import datetime, timedelta
from app.models.db import db
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.services.activity_service import log_event

from app.utils.current_user import CURRENT_USER_ID


class TimerConflictError(Exception):
    """Já existe outra tarefa em execução."""
    def __init__(self, active_task):
        self.active_task = active_task
        super().__init__("Já existe uma tarefa em execução.")


def get_active_task():
    """Retorna a tarefa (se houver) que possui um TimeEntry em aberto."""
    return (
        Task.query.join(TimeEntry, TimeEntry.task_id == Task.id)
        .filter(Task.user_id == CURRENT_USER_ID, TimeEntry.end_time.is_(None))
        .first()
    )


def start_timer(task_id, force=False):
    """Inicia (ou retoma) o cronômetro de uma tarefa.
    Se outra tarefa já estiver em execução, levanta TimerConflictError,
    a menos que force=True (aí a tarefa atual é finalizada automaticamente)."""
    task = db.get_or_404(Task, task_id)

    active = get_active_task()
    if active and active.id != task.id:
        if not force:
            raise TimerConflictError(active)
        finish_timer(active.id)

    if task.status != "concluida":
        entry = TimeEntry(task_id=task.id, start_time=datetime.utcnow())
        db.session.add(entry)
        task.status = "em_andamento"
        log_event(
            "task_started" if task.session_count == 0 else "task_resumed",
            f'Tarefa "{task.name}" iniciada.',
            task_id=task.id,
        )
        db.session.commit()
    return task


def pause_timer(task_id):
    task = db.get_or_404(Task, task_id)
    entry = task.active_entry
    if entry:
        entry.close()
        task.status = "pausada"
        log_event("task_paused", f'Tarefa "{task.name}" pausada.', task_id=task.id)
        db.session.commit()
    return task


def finish_timer(task_id, mood=None, delay_reason=None, real_minutes_override=None):
    task = db.get_or_404(Task, task_id)
    entry = task.active_entry
    if entry:
        entry.close()

    task.status = "concluida"
    task.completed_at = datetime.utcnow()
    # Se a tarefa nunca usou o cronômetro (nenhuma sessão registrada), permite
    # registrar um tempo real manualmente — mantém compatível com a conclusão
    # simples da Fase 1. Se usou o cronômetro, o tempo real vem dele (mesmo 0).
    has_sessions = len(task.time_entries) > 0
    if has_sessions:
        task.real_minutes = task.worked_minutes
    elif real_minutes_override is not None:
        task.real_minutes = real_minutes_override
    # senão mantém o valor já existente em task.real_minutes (pode ser None)
    if mood:
        task.mood = mood
    if delay_reason:
        task.delay_reason = delay_reason

    log_event(
        "task_finished",
        f'Tarefa "{task.name}" concluída em {task.worked_minutes} min.',
        task_id=task.id,
    )
    db.session.commit()
    return task


def discount_idle(task_id, seconds, action):
    """Trata o tempo em que o usuário ficou sem atividade.
    action: 'pause'  -> descarta o tempo ausente e pausa;
            'resume' -> descarta o tempo ausente e segue trabalhando;
            'keep'   -> mantém tudo (estava trabalhando fora do app)."""
    task = db.get_or_404(Task, task_id)
    minutes = round(seconds / 60)
    entry = task.active_entry
    if entry and action in ("pause", "resume"):
        now = datetime.utcnow()
        cut = max(entry.start_time, now - timedelta(seconds=max(0, int(seconds))))
        entry.close(at=cut)
        if action == "resume":
            db.session.add(TimeEntry(task_id=task.id, start_time=now))
        else:
            task.status = "pausada"
        log_event("idle_discounted", f'{minutes} min de ausência descontados em "{task.name}".', task_id=task.id)
    else:
        log_event("idle_kept", f'{minutes} min de ausência mantidos em "{task.name}".', task_id=task.id)
    db.session.commit()
    return task
