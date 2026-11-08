from datetime import datetime
from app.models.db import db


class TimeEntry(db.Model):
    """Uma sessão real de trabalho em uma tarefa: do horário de início ao de fim.
    Uma tarefa "em execução" possui um TimeEntry com end_time = None."""
    __tablename__ = "time_entries"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)

    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def is_open(self):
        return self.end_time is None

    def close(self, at=None):
        at = at or datetime.utcnow()
        self.end_time = at
        self.duration_seconds = int((self.end_time - self.start_time).total_seconds())

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": self.duration_seconds,
        }
