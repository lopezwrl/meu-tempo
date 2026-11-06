from app.models.schedule import Schedule
from app.models.fixed_commitment import FixedCommitment

from app.utils.current_user import CURRENT_USER_ID


def _to_minutes(hhmm):
    if not hhmm:
        return None
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


def to_hhmm(minutes):
    minutes = int(minutes) % (24 * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def get_schedule_for_date(date):
    return Schedule.query.filter_by(user_id=CURRENT_USER_ID, weekday=date.weekday()).first()


def get_all_schedules():
    return (
        Schedule.query.filter_by(user_id=CURRENT_USER_ID)
        .order_by(Schedule.weekday.asc())
        .all()
    )


def get_commitments_for_date(date):
    all_commitments = FixedCommitment.query.filter_by(user_id=CURRENT_USER_ID).all()
    return sorted(
        [c for c in all_commitments if c.occurs_on(date)],
        key=lambda c: _to_minutes(c.start_time),
    )


def work_window_for_date(date):
    """Retorna (inicio_min, fim_min) da jornada do dia, ou None se não for dia útil."""
    schedule = get_schedule_for_date(date)
    if not schedule or not schedule.is_working_day:
        return None
    return _to_minutes(schedule.start_time), _to_minutes(schedule.end_time)


def busy_blocks_for_date(date):
    """Blocos ocupados fixos do dia (almoço + compromissos), como (inicio_min, fim_min, label, tipo)."""
    blocks = []
    schedule = get_schedule_for_date(date)
    if schedule and schedule.lunch_start and schedule.lunch_end:
        blocks.append((_to_minutes(schedule.lunch_start), _to_minutes(schedule.lunch_end), "Almoço", "pausa"))
    for c in get_commitments_for_date(date):
        blocks.append((_to_minutes(c.start_time), _to_minutes(c.end_time), c.name, "compromisso"))
    return sorted(blocks, key=lambda b: b[0])


def capacity_minutes_for_date(date):
    """Minutos totais disponíveis no dia, já descontando almoço e compromissos fixos."""
    window = work_window_for_date(date)
    if not window:
        return 0
    start, end = window
    total = max(end - start, 0)
    for b_start, b_end, _, _ in busy_blocks_for_date(date):
        overlap = max(0, min(end, b_end) - max(start, b_start))
        total -= overlap
    return max(total, 0)
