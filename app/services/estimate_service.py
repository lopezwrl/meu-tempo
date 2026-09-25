from app.models.task import Task
from app.models.category import Category
from app.models.user import User

from app.utils.current_user import CURRENT_USER_ID
from app.models.db import db


def _completed_with_real_time():
    return Task.query.filter(
        Task.user_id == CURRENT_USER_ID,
        Task.status == "concluida",
        Task.real_minutes.isnot(None),
    ).all()


def apply_margin(minutes):
    """Aplica a margem de segurança configurada pelo usuário, se estiver ativa."""
    user = db.session.get(User, CURRENT_USER_ID)
    if not user or not user.margin_enabled or not minutes:
        return {"base_minutes": minutes, "margin_minutes": 0, "recommended_minutes": minutes, "margin_percent": 0}
    margin_minutes = round(minutes * (user.margin_percent / 100))
    return {
        "base_minutes": minutes,
        "margin_percent": user.margin_percent,
        "margin_minutes": margin_minutes,
        "recommended_minutes": minutes + margin_minutes,
    }


def suggest_estimate(name, category_id=None):
    """Sugere um tempo estimado (em minutos) com base em tarefas concluídas
    com nome parecido e/ou mesma categoria. Retorna None se não houver histórico."""
    candidates = _completed_with_real_time()
    if not candidates:
        return None

    name_lower = (name or "").strip().lower()
    matches = []
    for t in candidates:
        same_category = category_id and t.category_id == int(category_id)
        similar_name = name_lower and name_lower in (t.name or "").lower()
        if same_category or similar_name:
            matches.append(t.real_minutes)

    if not matches:
        return None

    average = round(sum(matches) / len(matches))
    result = {
        "average_minutes": average,
        "min_minutes": min(matches),
        "max_minutes": max(matches),
        "sample_size": len(matches),
    }
    result.update(apply_margin(average))
    return result


def accuracy_bias(category_id=None):
    """Retorna o percentual médio de subestimativa/superestimativa em uma categoria."""
    query = Task.query.filter(
        Task.user_id == CURRENT_USER_ID,
        Task.status == "concluida",
        Task.real_minutes.isnot(None),
        Task.estimated_minutes.isnot(None),
    )
    if category_id:
        query = query.filter(Task.category_id == int(category_id))

    tasks = query.all()
    diffs = [
        (t.real_minutes - t.estimated_minutes) / t.estimated_minutes
        for t in tasks if t.estimated_minutes
    ]
    if not diffs:
        return None
    return round((sum(diffs) / len(diffs)) * 100)


def estimate_by_category():
    """Média de tempo real por categoria, com base nas tarefas já concluídas."""
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    result = []
    for cat in categories:
        times = [
            t.real_minutes for t in cat.tasks
            if t.status == "concluida" and t.real_minutes
        ]
        if times:
            result.append({
                "category_id": cat.id,
                "category_name": cat.name,
                "icon": cat.icon,
                "average_minutes": round(sum(times) / len(times)),
                "sample_size": len(times),
            })
    return result


def estimation_precision(tasks):
    """Precisão média (%) entre estimado e real para uma lista de tarefas concluídas.
    100% = estimativas perfeitas; cai conforme a diferença percentual aumenta."""
    diffs = []
    for t in tasks:
        if t.estimated_minutes and t.real_minutes:
            diffs.append(abs(t.real_minutes - t.estimated_minutes) / t.estimated_minutes)
    if not diffs:
        return None
    avg_error = sum(diffs) / len(diffs)
    return max(0, round((1 - avg_error) * 100))
