from app.models.db import db


class FixedCommitment(db.Model):
    __tablename__ = "fixed_commitments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    weekday = db.Column(db.Integer, nullable=True)     # 0..6, para recorrente
    specific_date = db.Column(db.Date, nullable=True)  # para um único dia
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    recurring = db.Column(db.Boolean, nullable=False, default=True)

    def occurs_on(self, date):
        if self.recurring:
            return self.weekday == date.weekday()
        return self.specific_date == date

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "weekday": self.weekday,
            "specific_date": self.specific_date.isoformat() if self.specific_date else None,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "recurring": self.recurring,
        }
