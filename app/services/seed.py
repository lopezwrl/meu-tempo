from app.models.db import db
from app.models.user import User
from app.models.category import Category
from app.models.schedule import Schedule
from app.models.notebook import Notebook
from app.models.note import Note

DEFAULT_CATEGORIES = [
    ("Trabalho", "briefcase", "#2F6F6B"),
    ("Desenvolvimento", "code", "#3B6EA5"),
    ("Estudos", "book", "#8A6FB3"),
    ("Pessoal", "home", "#D98A3D"),
    ("Reuniões", "phone", "#C25B5B"),
]


def seed_defaults():
    user = db.session.get(User, 1)
    if not user:
        user = User(id=1, name="Você", onboarded=False)
        db.session.add(user)
        db.session.commit()

    if Category.query.filter_by(user_id=user.id).count() == 0:
        for name, icon, color in DEFAULT_CATEGORIES:
            db.session.add(Category(user_id=user.id, name=name, icon=icon, color=color))
        db.session.commit()

    # Jornada padrão (Fase 3): 7 dias, usando os horários que já existiam em
    # User (workday_start/workday_end) como base. Segunda a sexta como dias
    # úteis; fim de semana criado como não-útil, mas editável depois.
    if Schedule.query.filter_by(user_id=user.id).count() == 0:
        for weekday in range(7):
            db.session.add(Schedule(
                user_id=user.id,
                weekday=weekday,
                is_working_day=weekday < 5,
                start_time=user.workday_start or "08:00",
                end_time=user.workday_end or "18:00",
                lunch_start="12:00",
                lunch_end="13:00",
            ))
        db.session.commit()

    # Fase 5: cadernos. Na primeira vez cria o caderno "Geral" e move as notas
    # antigas para ele (nada é apagado).
    if Notebook.query.filter_by(user_id=user.id).count() == 0:
        geral = Notebook(user_id=user.id, name="Geral", color="#2F6F6B", position=0)
        db.session.add(geral)
        db.session.flush()
        Note.query.filter_by(user_id=user.id, notebook_id=None).update({"notebook_id": geral.id})
        db.session.commit()
