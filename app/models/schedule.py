from app.models.db import db

WEEKDAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]


class Schedule(db.Model):
    """Jornada de trabalho de um dia da semana (0=segunda ... 6=domingo)."""
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    weekday = db.Column(db.Integer, nullable=False)  # 0..6
    is_working_day = db.Column(db.Boolean, nullable=False, default=True)
    start_time = db.Column(db.String(5), nullable=False, default="08:00")
    end_time = db.Column(db.String(5), nullable=False, default="18:00")
    lunch_start = db.Column(db.String(5), nullable=True, default="12:00")
    lunch_end = db.Column(db.String(5), nullable=True, default="13:00")

    __table_args__ = (db.UniqueConstraint("user_id", "weekday", name="uq_schedule_user_weekday"),)

    @property
    def weekday_label(self):
        return WEEKDAY_LABELS[self.weekday]

    def to_dict(self):
        return {
            "id": self.id,
            "weekday": self.weekday,
            "weekday_label": self.weekday_label,
            "is_working_day": self.is_working_day,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "lunch_start": self.lunch_start,
            "lunch_end": self.lunch_end,
        }
