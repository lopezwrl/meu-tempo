from datetime import datetime
from app.models.db import db

NOTEBOOK_COLORS = ["#E76F6F", "#E9B44C", "#4FB286", "#4A90D9", "#8A6FB3", "#D98A3D", "#2F6F6B", "#7A8794"]


class Notebook(db.Model):
    __tablename__ = "notebooks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False, default="Novo caderno")
    color = db.Column(db.String(20), nullable=False, default=NOTEBOOK_COLORS[0])
    position = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    notes = db.relationship("Note", backref="notebook", lazy=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "color": self.color, "position": self.position}
