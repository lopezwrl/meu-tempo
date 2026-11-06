from datetime import datetime
from app.models.db import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, default="Você")
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    theme = db.Column(db.String(10), nullable=False, default="light")  # light | dark | auto
    workday_start = db.Column(db.String(5), nullable=False, default="08:00")
    workday_end = db.Column(db.String(5), nullable=False, default="18:00")

    margin_enabled = db.Column(db.Boolean, nullable=False, default=True)
    margin_percent = db.Column(db.Integer, nullable=False, default=15)

    pomodoro_focus_minutes = db.Column(db.Integer, nullable=False, default=25)
    pomodoro_break_minutes = db.Column(db.Integer, nullable=False, default=5)
    pomodoro_long_break_minutes = db.Column(db.Integer, nullable=False, default=15)
    idle_minutes = db.Column(db.Integer, nullable=False, default=10)  # 0 = desligado
    pomodoro_cycles = db.Column(db.Integer, nullable=False, default=4)

    onboarded = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")
    notes = db.relationship("Note", backref="user", lazy=True, cascade="all, delete-orphan")
    categories = db.relationship("Category", backref="user", lazy=True, cascade="all, delete-orphan")
