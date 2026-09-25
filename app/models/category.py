from app.models.db import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(60), nullable=False)
    icon = db.Column(db.String(10), nullable=False, default="🗂")
    color = db.Column(db.String(20), nullable=False, default="#2F6F6B")

    tasks = db.relationship("Task", backref="category", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "color": self.color,
        }
