from app.models.db import db
from app.models.activity_log import ActivityLog

from app.utils.current_user import CURRENT_USER_ID


def log_event(event_type, description, task_id=None, project_id=None):
    entry = ActivityLog(
        user_id=CURRENT_USER_ID,
        event_type=event_type,
        description=description,
        task_id=task_id,
        project_id=project_id,
    )
    db.session.add(entry)
    # não damos commit aqui: quem chama já está dentro de uma transação
    # que salva a tarefa/projeto junto — evita commits duplicados.
