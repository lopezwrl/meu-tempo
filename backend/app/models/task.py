from datetime import datetime, date as date_cls
from app.models.db import db

PRIORITIES = ["baixa", "media", "alta", "urgente"]
STATUSES = ["pendente", "em_andamento", "pausada", "concluida", "cancelada"]
MOODS = ["facil", "normal", "dificil", "muito_dificil"]
DELAY_REASONS = [
    "complexidade", "interrupcao", "falta_informacao", "problema_tecnico",
    "reuniao", "dependencia_terceiros", "estimativa_incorreta", "outro",
]


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True)

    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(10), nullable=False, default="media")
    status = db.Column(db.String(20), nullable=False, default="pendente")

    estimated_minutes = db.Column(db.Integer, nullable=True)
    real_minutes = db.Column(db.Integer, nullable=True)

    date = db.Column(db.Date, nullable=True)
    time = db.Column(db.String(5), nullable=True)      # HH:MM
    deadline_time = db.Column(db.String(5), nullable=True)  # HH:MM

    tags = db.Column(db.String(200), nullable=True)  # csv: "sql,urgente"
    color = db.Column(db.String(20), nullable=True)
    observations = db.Column(db.Text, nullable=True)

    mood = db.Column(db.String(20), nullable=True)  # facil | normal | dificil | muito_dificil
    delay_reason = db.Column(db.String(40), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    notes = db.relationship("Note", backref="task", lazy=True)
    subtasks = db.relationship(
        "Subtask", backref="task", lazy=True,
        cascade="all, delete-orphan", order_by="Subtask.position, Subtask.id",
    )
    time_entries = db.relationship(
        "TimeEntry", backref="task", lazy=True,
        cascade="all, delete-orphan", order_by="TimeEntry.start_time",
    )

    @property
    def subtasks_total(self):
        return len(self.subtasks)

    @property
    def subtasks_done(self):
        return len([s for s in self.subtasks if s.done])

    @property
    def active_entry(self):
        for entry in self.time_entries:
            if entry.is_open:
                return entry
        return None

    @property
    def is_running(self):
        return self.active_entry is not None

    @property
    def worked_seconds(self):
        """Soma das sessões fechadas + a sessão em aberto (se houver), em segundos."""
        total = 0
        now = datetime.utcnow()
        for entry in self.time_entries:
            if entry.duration_seconds is not None:
                total += entry.duration_seconds
            elif entry.is_open:
                total += int((now - entry.start_time).total_seconds())
        return total

    @property
    def worked_minutes(self):
        return round(self.worked_seconds / 60)

    @property
    def session_count(self):
        return len([e for e in self.time_entries if not e.is_open])

    @property
    def is_overdue(self):
        if self.status == "concluida" or not self.date:
            return False
        return self.date < date_cls.today()

    @property
    def is_due_soon(self):
        if self.status == "concluida" or not self.date:
            return False
        delta = (self.date - date_cls.today()).days
        return 0 <= delta <= 1

    @property
    def tag_list(self):
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    def to_dict(self):
        active = self.active_entry
        return {
            "id": self.id,
            "subtasks_total": self.subtasks_total,
            "subtasks_done": self.subtasks_done,
            "name": self.name,
            "description": self.description,
            "category_id": self.category_id,
            "category": self.category.to_dict() if self.category else None,
            "project_id": self.project_id,
            "project": {"id": self.project.id, "name": self.project.name} if self.project else None,
            "priority": self.priority,
            "status": self.status,
            "estimated_minutes": self.estimated_minutes,
            "real_minutes": self.real_minutes,
            "date": self.date.isoformat() if self.date else None,
            "time": self.time,
            "deadline_time": self.deadline_time,
            "tags": self.tag_list,
            "color": self.color,
            "observations": self.observations,
            "mood": self.mood,
            "delay_reason": self.delay_reason,
            "is_overdue": self.is_overdue,
            "is_due_soon": self.is_due_soon,
            "is_running": self.is_running,
            "worked_seconds": self.worked_seconds,
            "worked_minutes": self.worked_minutes,
            "session_count": self.session_count,
            "active_entry_start": active.start_time.isoformat() if active else None,
        }
