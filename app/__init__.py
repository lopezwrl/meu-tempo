import os
import secrets
import sys
from flask import Flask
from app.models.db import db


def _local_secret(instance_dir):
    """Chave secreta gerada uma vez e guardada em instance/ (nada fixo no código)."""
    path = os.path.join(instance_dir, "secret.key")
    if not os.path.exists(path):
        with open(path, "w") as fh:
            fh.write(secrets.token_hex(32))
    with open(path) as fh:
        return fh.read().strip()


def _app_base_dir():
    """Pasta base para dados (instance/): ao lado do .exe quando "congelado"
    pelo PyInstaller, ou a raiz do projeto em modo desenvolvedor."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


def create_app(test_config=None):
    app = Flask(__name__)

    base_dir = _app_base_dir()
    instance_dir = os.path.join(base_dir, "instance")
    os.makedirs(instance_dir, exist_ok=True)

    app.config["SECRET_KEY"] = os.environ.get("MEUTEMPO_SECRET") or _local_secret(instance_dir)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(instance_dir, 'meutempo.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    if test_config:
        app.config.update(test_config)

    db.init_app(app)

    @app.context_processor
    def inject_onboarding():
        from app.models.user import User
        from app.utils.current_user import CURRENT_USER_ID
        user = db.session.get(User, CURRENT_USER_ID)
        idle = user.idle_minutes if user and user.idle_minutes is not None else 10
        return {"needs_onboarding": bool(user and not user.onboarded), "idle_minutes": idle}

    from app.utils.formatting import format_minutes
    from app.utils.formatting import pt_date
    app.jinja_env.filters["hm"] = format_minutes
    app.jinja_env.filters["pt_date"] = pt_date

    from app.routes.main import main_bp
    from app.routes.tasks import tasks_bp
    from app.routes.notes import notes_bp
    from app.routes.categories import categories_bp
    from app.routes.projects import projects_bp
    from app.routes.timer import timer_bp
    from app.routes.reports import reports_bp
    from app.routes.planning import planning_bp
    from app.routes.settings import settings_bp
    from app.routes.data import data_bp
    from app.routes.subtasks import subtasks_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(timer_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(planning_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(subtasks_bp)

    with app.app_context():
        db.create_all()
        from app.services.migrations import run_migrations
        run_migrations()
        from app.services.seed import seed_defaults
        seed_defaults()

    return app
