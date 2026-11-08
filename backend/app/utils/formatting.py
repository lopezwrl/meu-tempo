def format_minutes(value):
    """Converte um total de minutos em uma string tipo '1h30' ou '45min'."""
    if value is None:
        return "—"
    value = int(value)
    hours, minutes = divmod(value, 60)
    if hours and minutes:
        return f"{hours}h{minutes:02d}"
    if hours:
        return f"{hours}h"
    return f"{minutes}min"


_WEEKDAYS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"]
MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]


def pt_date(value, fmt="weekday"):
    """'Quarta-feira, 23 de setembro' (independe do idioma do sistema)."""
    if not value:
        return ""
    if fmt == "month":
        return f"{MONTHS_PT[value.month - 1].capitalize()} de {value.year}"
    text = f"{_WEEKDAYS[value.weekday()]}, {value.day:02d} de {MONTHS_PT[value.month - 1]}"
    return text[0].upper() + text[1:]
