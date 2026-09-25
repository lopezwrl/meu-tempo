from datetime import datetime, date as date_cls, timedelta
import calendar as cal_module
from flask import Blueprint, render_template, request, jsonify
from app.models.task import Task
from app.models.category import Category
from app.models.project import Project
from app.services import planning_service
planning_bp = Blueprint("planning", __name__)
from app.utils.current_user import CURRENT_USER_ID
from app.utils.formatting import MONTHS_PT


def _parse_date(value, default=None):
    if not value:
        return default
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return default


# ---------- Meu Dia ----------

@planning_bp.route("/meu-dia")
def myday_page():
    day = _parse_date(request.args.get("date"), default=date_cls.today())
    timeline = planning_service.day_timeline(day)
    slots = planning_service.day_slots(day)
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    projects = Project.query.filter_by(user_id=CURRENT_USER_ID).all()
    return render_template(
        "myday.html", day=day, timeline=timeline, slots=slots,
        categories=categories, projects=projects, active_page="myday",
        prev_day=(day - timedelta(days=1)).isoformat(), next_day=(day + timedelta(days=1)).isoformat(),
    )


@planning_bp.route("/api/planning/day", methods=["GET"])
def api_planning_day():
    day = _parse_date(request.args.get("date"), default=date_cls.today())
    return jsonify(planning_service.day_timeline(day))


@planning_bp.route("/api/planning/day/organize", methods=["POST"])
def api_planning_day_organize():
    data = request.get_json(silent=True) or {}
    day = _parse_date(data.get("date"), default=date_cls.today())
    apply_changes = bool(data.get("apply"))
    result = planning_service.organize_day(day, apply=apply_changes)
    return jsonify(result)


# ---------- Minha Semana ----------

@planning_bp.route("/minha-semana")
def week_page():
    start = _parse_date(request.args.get("start"))
    if not start:
        today = date_cls.today()
        start = today - timedelta(days=today.weekday())
    days = planning_service.week_overview(start)
    return render_template(
        "week.html", days=days, start=start,
        prev_start=(start - timedelta(days=7)).isoformat(),
        next_start=(start + timedelta(days=7)).isoformat(),
        active_page="week",
    )


@planning_bp.route("/api/planning/week", methods=["GET"])
def api_planning_week():
    start = _parse_date(request.args.get("start"))
    if not start:
        today = date_cls.today()
        start = today - timedelta(days=today.weekday())
    return jsonify(planning_service.week_overview(start))


@planning_bp.route("/api/planning/week/balance", methods=["POST"])
def api_planning_week_balance():
    data = request.get_json(silent=True) or {}
    start = _parse_date(data.get("start"))
    if not start:
        today = date_cls.today()
        start = today - timedelta(days=today.weekday())
    apply_changes = bool(data.get("apply"))
    result = planning_service.balance_week(start, apply=apply_changes)
    return jsonify(result)


# ---------- Calendário ----------

@planning_bp.route("/calendario")
def calendar_page():
    year = int(request.args.get("year", date_cls.today().year))
    month = int(request.args.get("month", date_cls.today().month))

    first_weekday, days_in_month = cal_module.monthrange(year, month)  # 0=segunda
    tasks = Task.query.filter(
        Task.user_id == CURRENT_USER_ID,
        Task.date >= date_cls(year, month, 1),
        Task.date <= date_cls(year, month, days_in_month),
        Task.status != "cancelada",
    ).all()

    tasks_by_day = {}
    for t in tasks:
        tasks_by_day.setdefault(t.date.day, []).append(t)

    weeks = []
    week = [None] * first_weekday
    for day_num in range(1, days_in_month + 1):
        week.append(day_num)
        if len(week) == 7:
            weeks.append(week)
            week = []
    if week:
        week += [None] * (7 - len(week))
        weeks.append(week)

    prev_month = month - 1 or 12
    prev_year = year - 1 if month == 1 else year
    next_month = month % 12 + 1
    next_year = year + 1 if month == 12 else year

    return render_template(
        "calendar.html",
        year=year, month=month, weeks=weeks, tasks_by_day=tasks_by_day,
        month_name=MONTHS_PT[month - 1].capitalize(),
        today=date_cls.today(),
        prev_year=prev_year, prev_month=prev_month,
        next_year=next_year, next_month=next_month,
        categories=Category.query.filter_by(user_id=CURRENT_USER_ID).all(),
        projects=Project.query.filter_by(user_id=CURRENT_USER_ID).all(),
        active_page="calendar",
    )
