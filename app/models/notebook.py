from datetime import datetime
from app.models.db import db

NOTEBOOK_COLORS = ["#D9648F", "#E88BA8", "#C0568A", "#F2A9C0", "#B04578", "#E58A5B", "#A76EE7", "#F7C8D9"]


class Notebook(db.Model):
    __tablename__ = "notebooks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False, default="Novo caderno")
    color = db.Column(db.String(20), nullable=False, default=NOTEBOOK_COLORS[0])
    position = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    notes = db.relationship("Note", backref="notebook", lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "color": self.color, "position": self.position}
