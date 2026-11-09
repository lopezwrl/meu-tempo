import os
from datetime import date
from flask import Blueprint, render_template, jsonify, send_from_directory, current_app
from app.models.db import db
from app.models.task import Task
from app.models.category import Category
from app.models.project import Project
from app.models.user import User
from app.services import timer_service, report_service, planning_service, achievements_service
from app.utils.current_user import CURRENT_USER_ID

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def dashboard():
    user = db.session.get(User, CURRENT_USER_ID)
    today = date.today()

    today_tasks = Task.query.filter_by(user_id=CURRENT_USER_ID, date=today).order_by(Task.time.asc().nullslast()).all()
    completed_today = [t for t in today_tasks if t.status == "concluida"]
    pending_today = [t for t in today_tasks if t.status not in ("concluida", "cancelada")]

    planned_minutes = sum(t.estimated_minutes or 0 for t in today_tasks if t.status != "cancelada")
    daily = report_service.daily_summary(today)
    worked_minutes = daily["worked_minutes"]

    efficiency = None
    if planned_minutes and worked_minutes:
        efficiency = round((worked_minutes / planned_minutes) * 100)

    overdue_tasks = Task.query.filter(
        Task.user_id == CURRENT_USER_ID,
        Task.status.notin_(["concluida", "cancelada"]),
        Task.date < today,
    ).all()

    # Capacidade do dia (Fase 3): agora vem da jornada configurada em Configurações,
    # já descontando almoço e compromissos fixos — não mais um horário fixo único.
    overload = planning_service.overload_detail(today)
    remaining_minutes = overload["remaining_needed_minutes"]
    available_minutes = overload["available_minutes"]
    overload_minutes = overload["overload_minutes"]
    postpone_suggestions = overload["postpone_suggestions"]

    active_task = timer_service.get_active_task()
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    achievements = achievements_service.get_achievements()

    return render_template(
        "dashboard.html",
        user=user,
        today=today,
        today_tasks=today_tasks,
        completed_today=completed_today,
        pending_today=pending_today,
        planned_minutes=planned_minutes,
        worked_minutes=worked_minutes,
        efficiency=efficiency,
        overdue_tasks=overdue_tasks,
        categories=categories,
        projects=projects,
        active_task=active_task,
        remaining_minutes=remaining_minutes,
        available_minutes=available_minutes,
        overload_minutes=overload_minutes,
        postpone_suggestions=postpone_suggestions,
        achievements=achievements,
        active_page="dashboard",
    )


@main_bp.route("/manifest.webmanifest")
def manifest():
    resp = jsonify({
        "name": "Meu Tempo",
        "short_name": "Meu Tempo",
        "description": "Notas, tarefas e controle real do seu tempo.",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "background_color": "#FFF5F7",
        "theme_color": "#D63B6A",
        "lang": "pt-BR",
        "icons": [
            {"src": "/static/icons/favicon-192x192.png?v=5", "sizes": "192x192", "type": "image/png"},
            {"src": "/static/icons/favicon-512x512.png?v=5", "sizes": "512x512", "type": "image/png"},
            {"src": "/static/icons/favicon-512x512.png?v=5", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
        "shortcuts": [{"name": "Notas", "url": "/notas"}, {"name": "Meu dia", "url": "/meu-dia"}],
    })
    resp.headers["Content-Type"] = "application/manifest+json"
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp


@main_bp.route("/favicon.ico")
def favicon_ico():
    icons_dir = os.path.join(current_app.static_folder or "static", "icons")
    resp = send_from_directory(icons_dir, "favicon.ico", mimetype="image/x-icon")
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp


@main_bp.route("/favicon.svg")
def favicon_svg():
    icons_dir = os.path.join(current_app.static_folder or "static", "icons")
    resp = send_from_directory(icons_dir, "favicon.svg", mimetype="image/svg+xml")
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp


@main_bp.route("/sw.js")
def service_worker():
    # Precisa sair da raiz para controlar o site inteiro.
    static_dir = current_app.static_folder or "static"
    resp = send_from_directory(static_dir, "sw.js", mimetype="application/javascript")
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp
