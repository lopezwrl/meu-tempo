from datetime import datetime
from flask import Blueprint, render_template, request, jsonify
from app.models.category import Category
from app.models.project import Project
from app.services import report_service, achievements_service

reports_bp = Blueprint("reports", __name__)
from app.utils.current_user import CURRENT_USER_ID


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


@reports_bp.route("/historico")
def history_page():
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()

    entries = report_service.history()
    daily = report_service.daily_summary()
    weekly = report_service.weekly_summary()
    by_category = report_service.time_by_category()
    by_project = report_service.time_by_project()

    # Fase 4: gráficos, análises e conquistas
    hours_per_day = report_service.hours_per_day(30)
    tasks_per_week = report_service.tasks_per_week(8)
    est_vs_real_category = report_service.estimated_vs_real_by_category()
    est_vs_real_project = report_service.estimated_vs_real_by_project()
    precision_trend = report_service.precision_trend(8)
    precision_message = report_service.precision_trend_message(precision_trend)
    productivity = report_service.productivity_by_hour()
    week_summary = report_service.week_executive_summary()
    achievements = achievements_service.get_achievements()

    return render_template(
        "history.html",
        entries=entries,
        daily=daily,
        weekly=weekly,
        by_category=by_category,
        by_project=by_project,
        categories=categories,
        projects=projects,
        hours_per_day=hours_per_day,
        tasks_per_week=tasks_per_week,
        est_vs_real_category=est_vs_real_category,
        est_vs_real_project=est_vs_real_project,
        precision_trend=precision_trend,
        precision_message=precision_message,
        productivity=productivity,
        week_summary=week_summary,
        achievements=achievements,
        active_page="history",
    )


@reports_bp.route("/api/time-entries", methods=["GET"])
def api_time_entries():
    entries = report_service.history(
        start=_parse_date(request.args.get("start")),
        end=_parse_date(request.args.get("end")),
        project_id=request.args.get("project_id"),
        category_id=request.args.get("category_id"),
        task_id=request.args.get("task_id"),
    )
    return jsonify(entries)


@reports_bp.route("/api/reports/time", methods=["GET"])
def api_reports_time():
    return jsonify({
        "daily": report_service.daily_summary(),
        "weekly": report_service.weekly_summary(),
        "by_category": report_service.time_by_category(),
        "by_project": report_service.time_by_project(),
    })


@reports_bp.route("/api/reports/charts/hours-per-day", methods=["GET"])
def api_chart_hours_per_day():
    days = int(request.args.get("days", 30))
    return jsonify(report_service.hours_per_day(days))


@reports_bp.route("/api/reports/charts/hours-per-category", methods=["GET"])
def api_chart_hours_per_category():
    return jsonify(report_service.time_by_category())


@reports_bp.route("/api/reports/charts/hours-per-project", methods=["GET"])
def api_chart_hours_per_project():
    return jsonify(report_service.time_by_project())


@reports_bp.route("/api/reports/charts/estimated-vs-real", methods=["GET"])
def api_chart_estimated_vs_real():
    return jsonify({
        "by_category": report_service.estimated_vs_real_by_category(),
        "by_project": report_service.estimated_vs_real_by_project(),
    })


@reports_bp.route("/api/reports/charts/tasks-per-week", methods=["GET"])
def api_chart_tasks_per_week():
    weeks = int(request.args.get("weeks", 8))
    return jsonify(report_service.tasks_per_week(weeks))


@reports_bp.route("/api/reports/productivity-by-hour", methods=["GET"])
def api_productivity_by_hour():
    return jsonify(report_service.productivity_by_hour())


@reports_bp.route("/api/reports/precision-trend", methods=["GET"])
def api_precision_trend():
    weeks = int(request.args.get("weeks", 8))
    trend = report_service.precision_trend(weeks)
    return jsonify({"trend": trend, "message": report_service.precision_trend_message(trend)})


@reports_bp.route("/api/reports/week-summary", methods=["GET"])
def api_week_summary():
    day = _parse_date(request.args.get("date"))
    return jsonify(report_service.week_executive_summary(day))


@reports_bp.route("/api/achievements", methods=["GET"])
def api_achievements():
    return jsonify(achievements_service.get_achievements())
