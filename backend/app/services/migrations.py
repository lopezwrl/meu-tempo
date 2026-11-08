from sqlalchemy import inspect, text
from app.models.db import db

# (tabela, coluna, definição SQL) — adicionadas apenas se ainda não existirem.
NEW_COLUMNS = [
    ("tasks", "project_id", "INTEGER REFERENCES projects(id)"),
    ("tasks", "mood", "VARCHAR(20)"),
    ("tasks", "delay_reason", "VARCHAR(40)"),
    ("notes", "notebook_id", "INTEGER REFERENCES notebooks(id)"),
    ("notes", "archived", "BOOLEAN DEFAULT 0"),
    ("users", "idle_minutes", "INTEGER DEFAULT 10"),
    ("users", "onboarded", "BOOLEAN DEFAULT 1"),
    ("users", "margin_enabled", "BOOLEAN DEFAULT 1"),
    ("users", "margin_percent", "INTEGER DEFAULT 15"),
    ("users", "pomodoro_focus_minutes", "INTEGER DEFAULT 25"),
    ("users", "pomodoro_break_minutes", "INTEGER DEFAULT 5"),
    ("users", "pomodoro_long_break_minutes", "INTEGER DEFAULT 15"),
    ("users", "pomodoro_cycles", "INTEGER DEFAULT 4"),
]


def run_migrations():
    """Verifica o banco existente e adiciona apenas as colunas/tabelas que faltam.
    Nunca remove ou reescreve dados já gravados na Fase 1."""
    inspector = inspect(db.engine)
    existing_tables = inspector.get_table_names()

    # Tabelas novas (projects, time_entries, activity_log) são criadas pelo db.create_all()
    # chamado logo antes desta função — aqui só cuidamos de colunas novas em tabelas antigas.
    for table, column, definition in NEW_COLUMNS:
        if table not in existing_tables:
            continue  # tabela ainda será criada pelo create_all
        columns = [c["name"] for c in inspector.get_columns(table)]
        if column not in columns:
            db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))

    db.session.commit()
