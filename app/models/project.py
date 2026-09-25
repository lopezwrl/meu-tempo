from datetime import datetime
from app.models.db import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    deadline = db.Column(db.Date, nullable=True)
    estimated_minutes = db.Column(db.Integer, nullable=True)  # estimativa manual do projeto (opcional)
    status = db.Column(db.String(20), nullable=False, default="ativo")  # ativo | concluido | arquivado
    color = db.Column(db.String(20), nullable=False, default="#2F6F6B")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship("Task", backref="project", lazy=True)
