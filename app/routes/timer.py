from flask import Blueprint, jsonify, render_template, request
from app.models.task import Task
from app.models.user import User
from app.services import timer_service

timer_bp = Blueprint("timer", __name__)
from app.utils.current_user import CURRENT_USER_ID
from app.models.db import db


@timer_bp.route("/api/timer/active", methods=["GET"])
def api_active_timer():
    task = timer_service.get_active_task()
    if not task:
        return jsonify({"active": False})
    return jsonify({
        "active": True,
        "task": task.to_dict(),
    })


@timer_bp.route("/foco/<int:task_id>")
def focus_page(task_id):
    task = db.get_or_404(Task, task_id)
    user = db.session.get(User, CURRENT_USER_ID)
    return render_template("focus.html", task=task, user=user, active_page="focus")


@timer_bp.route("/api/timer/idle", methods=["POST"])
def api_timer_idle():
    """Resposta do usuário ao aviso 'você ficou ausente'."""
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if action not in ("pause", "resume", "keep"):
        return jsonify({"error": "Ação inválida."}), 400
    try:
        seconds = max(0, min(int(data.get("seconds", 0)), 24 * 3600))
        task = timer_service.discount_idle(int(data.get("task_id")), seconds, action)
    except (TypeError, ValueError):
        return jsonify({"error": "Dados inválidos."}), 400
    return jsonify(task.to_dict())
