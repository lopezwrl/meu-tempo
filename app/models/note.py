from datetime import datetime
from app.models.db import db


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=True)
    notebook_id = db.Column(db.Integer, db.ForeignKey("notebooks.id"), nullable=True)

    title = db.Column(db.String(150), nullable=True)
    content = db.Column(db.Text, nullable=False, default="")
    pinned = db.Column(db.Boolean, default=False)
    archived = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "pinned": self.pinned,
            "archived": bool(self.archived),
            "notebook_id": self.notebook_id,
            "task_name": self.task.name if self.task else None,
            "task_id": self.task_id,
            "updated_at": self.updated_at.strftime("%d/%m/%Y %H:%M") if self.updated_at else None,
        }
