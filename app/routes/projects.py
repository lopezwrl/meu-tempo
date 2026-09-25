from datetime import datetime
from flask import Blueprint, render_template, request, jsonify
from app.models.db import db
from app.models.project import Project
from app.models.category import Category
from app.services.project_service import project_stats
from app.services.activity_service import log_event

projects_bp = Blueprint("projects", __name__)
from app.utils.current_user import CURRENT_USER_ID


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


@projects_bp.route("/projetos")
def projects_page():
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).order_by(Project.created_at.desc()).all()
    projects_with_stats = [(p, project_stats(p)) for p in projects]
    return render_template("projects.html", projects_with_stats=projects_with_stats, active_page="projects")


@projects_bp.route("/projetos/<int:project_id>")
def project_detail_page(project_id):
    project = db.get_or_404(Project, project_id)
    stats = project_stats(project)
    tasks = sorted(project.tasks, key=lambda t: (t.status == "concluida", t.date or datetime.max.date()))
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    return render_template(
        "project_detail.html", project=project, stats=stats, tasks=tasks,
        categories=categories, projects=projects, active_page="projects",
    )


@projects_bp.route("/api/projects", methods=["GET"])
def api_list_projects():
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    return jsonify([
        {**{"id": p.id, "name": p.name, "deadline": p.deadline.isoformat() if p.deadline else None,
            "color": p.color, "status": p.status}, **project_stats(p)}
        for p in projects
    ])


@projects_bp.route("/api/projects", methods=["POST"])
def api_create_project():
    data = request.get_json(force=True)
    if not data.get("name", "").strip():
        return jsonify({"error": "O nome do projeto é obrigatório."}), 400

    project = Project(
        user_id=CURRENT_USER_ID,
        name=data["name"].strip(),
        description=data.get("description"),
        deadline=_parse_date(data.get("deadline")),
        estimated_minutes=int(data["estimated_minutes"]) if data.get("estimated_minutes") else None,
        color=data.get("color", "#2F6F6B"),
    )
    db.session.add(project)
    db.session.flush()
    log_event("project_created", f'Projeto "{project.name}" criado.', project_id=project.id)
    db.session.commit()
    return jsonify({"id": project.id, "name": project.name}), 201


@projects_bp.route("/api/projects/<int:project_id>", methods=["PUT"])
def api_update_project(project_id):
    project = db.get_or_404(Project, project_id)
    data = request.get_json(force=True)
    project.name = data.get("name", project.name).strip()
    project.description = data.get("description", project.description)
    if "deadline" in data:
        project.deadline = _parse_date(data.get("deadline"))
    if "estimated_minutes" in data:
        project.estimated_minutes = int(data["estimated_minutes"]) if data["estimated_minutes"] else None
    project.color = data.get("color", project.color)
    project.status = data.get("status", project.status)
    db.session.commit()
    return jsonify({"id": project.id, "name": project.name})


@projects_bp.route("/api/projects/<int:project_id>", methods=["DELETE"])
def api_delete_project(project_id):
    project = db.get_or_404(Project, project_id)
    for task in project.tasks:
        task.project_id = None  # não apaga as tarefas, só desvincula
    db.session.delete(project)
    db.session.commit()
    return jsonify({"ok": True})
