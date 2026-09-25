from flask import Blueprint, request, jsonify
from app.models.db import db
from app.models.category import Category

categories_bp = Blueprint("categories", __name__)
from app.utils.current_user import CURRENT_USER_ID


@categories_bp.route("/api/categories", methods=["GET"])
def api_list_categories():
    categories = Category.query.filter_by(user_id=CURRENT_USER_ID).all()
    return jsonify([c.to_dict() for c in categories])


@categories_bp.route("/api/categories", methods=["POST"])
def api_create_category():
    data = request.get_json(force=True)
    if not data.get("name", "").strip():
        return jsonify({"error": "O nome da categoria é obrigatório."}), 400
    category = Category(
        user_id=CURRENT_USER_ID,
        name=data["name"].strip(),
        icon=data.get("icon", "🗂"),
        color=data.get("color", "#2F6F6B"),
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@categories_bp.route("/api/categories/<int:category_id>", methods=["DELETE"])
def api_delete_category(category_id):
    category = db.get_or_404(Category, category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({"ok": True})
