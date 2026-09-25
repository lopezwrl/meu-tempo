"""Subtarefas e notas ligadas a uma tarefa."""
from flask import Blueprint, jsonify, request
from app.models.db import db
from app.models.note import Note
from app.models.subtask import Subtask
from app.models.task import Task
from app.utils.current_user import CURRENT_USER_ID

subtasks_bp = Blueprint("subtasks", __name__)


def _own_task(task_id):
    task = db.get_or_404(Task, task_id)
    if task.user_id != CURRENT_USER_ID:
        return jsonify({"error": "Tarefa não encontrada."}), 404
    return task


@subtasks_bp.route("/api/tasks/<int:task_id>/extras")
def api_task_extras(task_id):
    task = db.get_or_404(Task, task_id)
    linked = [n for n in task.notes if not n.archived]
    free = (Note.query.filter_by(user_id=CURRENT_USER_ID, task_id=None)
            .filter(Note.archived.isnot(True)).order_by(Note.updated_at.desc()).limit(50).all())
    return jsonify({
        "subtasks": [s.to_dict() for s in task.subtasks],
        "notes": [{"id": n.id, "title": n.title or "Sem título"} for n in linked],
        "available_notes": [{"id": n.id, "title": n.title or "Sem título"} for n in free],
    })


@subtasks_bp.route("/api/tasks/<int:task_id>/subtasks", methods=["POST"])
def api_create_subtask(task_id):
    task = db.get_or_404(Task, task_id)
    title = (request.get_json(silent=True) or {}).get("title", "").strip()
    if not title:
        return jsonify({"error": "Escreva o título da subtarefa."}), 400
    sub = Subtask(task_id=task.id, title=title[:200], position=len(task.subtasks))
    db.session.add(sub)
    db.session.commit()
    return jsonify(sub.to_dict()), 201


@subtasks_bp.route("/api/subtasks/<int:sub_id>", methods=["PUT"])
def api_update_subtask(sub_id):
    sub = db.get_or_404(Subtask, sub_id)
    data = request.get_json(silent=True) or {}
    if "title" in data and data["title"].strip():
        sub.title = data["title"].strip()[:200]
    if "done" in data:
        sub.done = bool(data["done"])
    db.session.commit()
    return jsonify(sub.to_dict())


@subtasks_bp.route("/api/subtasks/<int:sub_id>", methods=["DELETE"])
def api_delete_subtask(sub_id):
    sub = db.get_or_404(Subtask, sub_id)
    db.session.delete(sub)
    db.session.commit()
    return jsonify({"ok": True})
