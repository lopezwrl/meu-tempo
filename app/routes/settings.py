from datetime import datetime
from flask import Blueprint, render_template, request, jsonify
from app.models.db import db
from app.models.schedule import Schedule
from app.models.fixed_commitment import FixedCommitment
from app.services import schedule_service

settings_bp = Blueprint("settings", __name__)
from app.utils.current_user import CURRENT_USER_ID


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


@settings_bp.route("/configuracoes")
def settings_page():
    schedules = schedule_service.get_all_schedules()
    commitments = FixedCommitment.query.filter_by(user_id=CURRENT_USER_ID).all()
    return render_template(
        "settings.html", schedules=schedules, commitments=commitments, active_page="settings"
    )


@settings_bp.route("/api/schedule", methods=["GET"])
def api_get_schedule():
    return jsonify([s.to_dict() for s in schedule_service.get_all_schedules()])


@settings_bp.route("/api/schedule", methods=["PUT"])
def api_update_schedule():
    """Atualiza a jornada em lote: espera uma lista com um item por dia da semana."""
    data = request.get_json(force=True)
    for row in data:
        schedule = Schedule.query.filter_by(
            user_id=CURRENT_USER_ID, weekday=int(row["weekday"])
        ).first()
        if not schedule:
            schedule = Schedule(user_id=CURRENT_USER_ID, weekday=int(row["weekday"]))
            db.session.add(schedule)
        schedule.is_working_day = bool(row.get("is_working_day", True))
        schedule.start_time = row.get("start_time", schedule.start_time or "08:00")
        schedule.end_time = row.get("end_time", schedule.end_time or "18:00")
        schedule.lunch_start = row.get("lunch_start") or None
        schedule.lunch_end = row.get("lunch_end") or None
    db.session.commit()
    return jsonify([s.to_dict() for s in schedule_service.get_all_schedules()])


@settings_bp.route("/api/commitments", methods=["GET"])
def api_list_commitments():
    commitments = FixedCommitment.query.filter_by(user_id=CURRENT_USER_ID).all()
    return jsonify([c.to_dict() for c in commitments])


@settings_bp.route("/api/commitments", methods=["POST"])
def api_create_commitment():
    data = request.get_json(force=True)
    if not data.get("name", "").strip():
        return jsonify({"error": "O nome do compromisso é obrigatório."}), 400
    if not data.get("start_time") or not data.get("end_time"):
        return jsonify({"error": "Informe o horário de início e fim."}), 400

    recurring = bool(data.get("recurring", True))
    commitment = FixedCommitment(
        user_id=CURRENT_USER_ID,
        name=data["name"].strip(),
        recurring=recurring,
        weekday=int(data["weekday"]) if recurring and data.get("weekday") not in (None, "") else None,
        specific_date=_parse_date(data.get("specific_date")) if not recurring else None,
        start_time=data["start_time"],
        end_time=data["end_time"],
    )
    db.session.add(commitment)
    db.session.commit()
    return jsonify(commitment.to_dict()), 201


@settings_bp.route("/api/commitments/<int:commitment_id>", methods=["DELETE"])
def api_delete_commitment(commitment_id):
    commitment = db.get_or_404(FixedCommitment, commitment_id)
    db.session.delete(commitment)
    db.session.commit()
    return jsonify({"ok": True})


@settings_bp.route("/api/settings/idle", methods=["POST"])
def api_set_idle():
    from app.models.user import User
    try:
        minutes = int((request.get_json(silent=True) or {}).get("minutes"))
    except (TypeError, ValueError):
        return jsonify({"error": "Informe um número de minutos."}), 400
    if not 0 <= minutes <= 240:
        return jsonify({"error": "Use um valor entre 0 (desligado) e 240."}), 400
    user = db.session.get(User, CURRENT_USER_ID)
    user.idle_minutes = minutes
    db.session.commit()
    return jsonify({"idle_minutes": minutes})
