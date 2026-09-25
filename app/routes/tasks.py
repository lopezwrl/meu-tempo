from datetime import datetime, date as date_cls
from flask import Blueprint, render_template, request, jsonify
from app.models.db import db
from app.models.task import Task, PRIORITIES, STATUSES, MOODS, DELAY_REASONS
from app.models.category import Category
from app.models.project import Project
from app.services.estimate_service import suggest_estimate
from app.services import timer_service, planning_service
from app.services.activity_service import log_event

tasks_bp = Blueprint("tasks", __name__)
from app.utils.current_user import CURRENT_USER_ID


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _task_from_form(data, task=None):
    task = task or Task(user_id=CURRENT_USER_ID)
    task.name = data.get("name", task.name or "").strip()
    task.description = data.get("description", task.description)
    task.priority = data.get("priority") if data.get("priority") in PRIORITIES else (task.priority or "media")
    category_id = data.get("category_id")
    task.category_id = int(category_id) if category_id else None
    project_id = data.get("project_id")
    task.project_id = int(project_id) if project_id else None
    estimated = data.get("estimated_minutes")
    task.estimated_minutes = int(estimated) if estimated not in (None, "",) else task.estimated_minutes
    task.date = _parse_date(data.get("date")) if data.get("date") is not None else task.date
    task.time = data.get("time") or task.time
    task.deadline_time = data.get("deadline_time") or task.deadline_time
    task.tags = data.get("tags") or task.tags
    task.color = data.get("color") or task.color
    task.observations = data.get("observations") or task.observations
    return task


@tasks_bp.route("/tarefas")
def tasks_page():
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    status_filter = request.args.get("status", "todas")
    query = Task.query.filter_by(user_id=CURRENT_USER_ID)
    if status_filter == "pendentes":
        query = query.filter(Task.status.in_(["pendente", "em_andamento", "pausada"]))
    elif status_filter == "concluidas":
        query = query.filter_by(status="concluida")

    tasks = query.order_by(Task.date.asc().nullslast(), Task.time.asc().nullslast()).all()
    return render_template(
        "tasks.html",
        tasks=tasks,
        categories=categories,
        projects=projects,
        priorities=PRIORITIES,
        status_filter=status_filter,
        active_page="tasks",
    )


@tasks_bp.route("/api/tasks", methods=["GET"])
def api_list_tasks():
    tasks = Task.query.filter_by(user_id=CURRENT_USER_ID).order_by(Task.date.asc().nullslast()).all()
    return jsonify([t.to_dict() for t in tasks])


@tasks_bp.route("/api/tasks", methods=["POST"])
def api_create_task():
    data = request.get_json(force=True)
    if not data.get("name", "").strip():
        return jsonify({"error": "O nome da tarefa é obrigatório."}), 400

    task = _task_from_form(data)
    task.status = "pendente"
    db.session.add(task)
    db.session.flush()  # garante task.id antes de logar
    log_event("task_created", f'Tarefa "{task.name}" criada.', task_id=task.id)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
def api_update_task(task_id):
    task = db.get_or_404(Task, task_id)
    data = request.get_json(force=True)
    task = _task_from_form(data, task=task)
    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def api_delete_task(task_id):
    task = db.get_or_404(Task, task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"ok": True})


@tasks_bp.route("/api/tasks/<int:task_id>/complete", methods=["POST"])
def api_complete_task(task_id):
    """Conclusão manual (sem cronômetro), mantida da Fase 1 — usada pelo ✓ rápido
    na lista de tarefas. Se a tarefa tiver sessões de cronômetro, o tempo real
    vem delas; senão aceita um valor manual opcional."""
    data = request.get_json(silent=True) or {}
    mood = data.get("mood") if data.get("mood") in MOODS else None
    delay_reason = data.get("delay_reason") if data.get("delay_reason") in DELAY_REASONS else None
    real_minutes = data.get("real_minutes")
    task = timer_service.finish_timer(
        task_id, mood=mood, delay_reason=delay_reason,
        real_minutes_override=int(real_minutes) if real_minutes else None,
    )
    return jsonify(task.to_dict())


@tasks_bp.route("/api/tasks/<int:task_id>/reopen", methods=["POST"])
def api_reopen_task(task_id):
    task = db.get_or_404(Task, task_id)
    task.status = "pendente"
    task.completed_at = None
    log_event("task_reopened", f'Tarefa "{task.name}" reaberta.', task_id=task.id)
    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.route("/api/tasks/<int:task_id>/postpone", methods=["POST"])
def api_postpone_task(task_id):
    task = planning_service.postpone_task(task_id)
    return jsonify(task.to_dict())


@tasks_bp.route("/api/tasks/estimate", methods=["GET"])
def api_estimate():
    name = request.args.get("name", "")
    category_id = request.args.get("category_id")
    suggestion = suggest_estimate(name, category_id)
    return jsonify(suggestion or {})


# ---------- Cronômetro ----------

@tasks_bp.route("/api/tasks/<int:task_id>/start", methods=["POST"])
def api_start_timer(task_id):
    data = request.get_json(silent=True) or {}
    force = bool(data.get("force"))
    try:
        task = timer_service.start_timer(task_id, force=force)
    except timer_service.TimerConflictError as exc:
        active = exc.active_task
        return jsonify({
            "conflict": True,
            "message": "Você já está trabalhando em outra tarefa.",
            "active_task": {
                "id": active.id,
                "name": active.name,
                "worked_seconds": active.worked_seconds,
            },
        }), 409
    return jsonify(task.to_dict())


@tasks_bp.route("/api/tasks/<int:task_id>/pause", methods=["POST"])
def api_pause_timer(task_id):
    task = timer_service.pause_timer(task_id)
    return jsonify(task.to_dict())


@tasks_bp.route("/api/tasks/<int:task_id>/finish", methods=["POST"])
def api_finish_timer(task_id):
    data = request.get_json(silent=True) or {}
    mood = data.get("mood") if data.get("mood") in MOODS else None
    delay_reason = data.get("delay_reason") if data.get("delay_reason") in DELAY_REASONS else None
    task = timer_service.finish_timer(task_id, mood=mood, delay_reason=delay_reason)

    result = task.to_dict()
    if task.estimated_minutes and task.real_minutes is not None:
        diff = task.real_minutes - task.estimated_minutes
        result["comparison"] = {
            "estimated_minutes": task.estimated_minutes,
            "real_minutes": task.real_minutes,
            "difference_minutes": diff,
            "percent": round((diff / task.estimated_minutes) * 100, 1),
        }
    return jsonify(result)


@tasks_bp.route("/api/tasks/<int:task_id>/timer", methods=["GET"])
def api_task_timer(task_id):
    task = db.get_or_404(Task, task_id)
    return jsonify({
        "task_id": task.id,
        "status": task.status,
        "is_running": task.is_running,
        "worked_seconds": task.worked_seconds,
        "active_entry_start": task.active_entry.start_time.isoformat() if task.active_entry else None,
        "session_count": task.session_count,
    })
