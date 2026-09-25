import io
import re
import unicodedata
import zipfile
from urllib.parse import quote
from flask import Blueprint, render_template, request, jsonify, Response
from sqlalchemy import func
from app.models.db import db
from app.models.note import Note
from app.models.task import Task
from app.models.notebook import Notebook, NOTEBOOK_COLORS

notes_bp = Blueprint("notes", __name__)
from app.utils.current_user import CURRENT_USER_ID


def _notebook_or_none(notebook_id):
    """Só aceita cadernos do próprio usuário; qualquer outra coisa vira None."""
    if not notebook_id:
        return None
    nb = db.session.get(Notebook, int(notebook_id))
    return nb.id if nb and nb.user_id == CURRENT_USER_ID else None


@notes_bp.route("/notas")
def notes_page():
    return render_template("notes.html", active_page="notes")


# ---------- Cadernos ----------
@notes_bp.route("/api/notebooks", methods=["GET"])
def api_list_notebooks():
    counts = dict(
        db.session.query(Note.notebook_id, func.count(Note.id))
        .filter(Note.user_id == CURRENT_USER_ID, Note.archived.is_(False) | Note.archived.is_(None))
        .group_by(Note.notebook_id).all()
    )
    notebooks = Notebook.query.filter_by(user_id=CURRENT_USER_ID).order_by(Notebook.position, Notebook.id).all()
    return jsonify([{**nb.to_dict(), "count": counts.get(nb.id, 0)} for nb in notebooks])


@notes_bp.route("/api/notebooks", methods=["POST"])
def api_create_notebook():
    data = request.get_json(force=True)
    total = Notebook.query.filter_by(user_id=CURRENT_USER_ID).count()
    nb = Notebook(
        user_id=CURRENT_USER_ID,
        name=(data.get("name") or "Novo caderno").strip()[:80],
        color=data.get("color") or NOTEBOOK_COLORS[total % len(NOTEBOOK_COLORS)],
        position=total,
    )
    db.session.add(nb)
    db.session.commit()
    return jsonify({**nb.to_dict(), "count": 0}), 201


@notes_bp.route("/api/notebooks/<int:notebook_id>", methods=["PUT"])
def api_update_notebook(notebook_id):
    nb = db.get_or_404(Notebook, notebook_id)
    data = request.get_json(force=True)
    if "name" in data:
        nb.name = (data["name"] or "Sem nome").strip()[:80]
    if "color" in data:
        nb.color = data["color"]
    db.session.commit()
    return jsonify(nb.to_dict())


@notes_bp.route("/api/notebooks/<int:notebook_id>", methods=["DELETE"])
def api_delete_notebook(notebook_id):
    """Apaga só o caderno: as notas dele continuam existindo, sem caderno."""
    nb = db.get_or_404(Notebook, notebook_id)
    Note.query.filter_by(notebook_id=nb.id).update({"notebook_id": None})
    db.session.delete(nb)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- Notas ----------
@notes_bp.route("/api/notes", methods=["GET"])
def api_list_notes():
    notes = Note.query.filter_by(user_id=CURRENT_USER_ID).order_by(Note.pinned.desc(), Note.updated_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@notes_bp.route("/api/notes", methods=["POST"])
def api_create_note():
    data = request.get_json(force=True)
    if "notebook_id" in data:
        notebook_id = _notebook_or_none(data.get("notebook_id"))
    else:  # sem caderno informado: vai para o primeiro
        first = Notebook.query.filter_by(user_id=CURRENT_USER_ID).order_by(Notebook.position, Notebook.id).first()
        notebook_id = first.id if first else None
    note = Note(
        user_id=CURRENT_USER_ID,
        task_id=data.get("task_id"),
        notebook_id=notebook_id,
        title=data.get("title"),
        content=data.get("content", ""),
        pinned=bool(data.get("pinned", False)),
    )
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@notes_bp.route("/api/notes/<int:note_id>", methods=["PUT"])
def api_update_note(note_id):
    note = db.get_or_404(Note, note_id)
    data = request.get_json(force=True)
    note.title = data.get("title", note.title)
    note.content = data.get("content", note.content)
    if "pinned" in data:
        note.pinned = bool(data["pinned"])
    if "archived" in data:
        note.archived = bool(data["archived"])
    if "notebook_id" in data:
        note.notebook_id = _notebook_or_none(data["notebook_id"])
    if "task_id" in data:
        task = db.session.get(Task, data["task_id"]) if data["task_id"] else None
        note.task_id = task.id if task and task.user_id == CURRENT_USER_ID else None
    db.session.commit()
    return jsonify(note.to_dict())


@notes_bp.route("/api/notes/<int:note_id>", methods=["DELETE"])
def api_delete_note(note_id):
    note = db.get_or_404(Note, note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- Exportar como arquivos .md ----------
def _slug(text, fallback="nota"):
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    text = re.sub(r"[^A-Za-z0-9 _-]+", "", text).strip().replace(" ", "-")
    return re.sub(r"-{2,}", "-", text or fallback)[:60] or fallback


def _as_markdown(note):
    title = (note.title or "").strip()
    return (f"# {title}\n\n" if title else "") + (note.content or "") + "\n"


def _download(data, mimetype, filename):
    ascii_name = re.sub(r"[^A-Za-z0-9._-]+", "-", unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode())
    resp = Response(data, mimetype=mimetype)
    resp.headers["Content-Disposition"] = f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(filename)}"
    return resp


@notes_bp.route("/api/notes/<int:note_id>/export")
def api_export_note(note_id):
    note = db.get_or_404(Note, note_id)
    name = (_slug(note.title) if note.title else f"nota-{note.id}") + ".md"
    return _download(_as_markdown(note), "text/markdown; charset=utf-8", name)


@notes_bp.route("/api/export")
def api_export_many():
    """?notebook=all -> um .zip com uma pasta por caderno; ?notebook=<id> -> só esse caderno."""
    which = request.args.get("notebook", "all")
    query = Note.query.filter_by(user_id=CURRENT_USER_ID).filter(Note.archived.isnot(True))
    if which != "all":
        query = query.filter_by(notebook_id=int(which))
    names = {nb.id: nb.name for nb in Notebook.query.filter_by(user_id=CURRENT_USER_ID)}
    used, buf = set(), io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for note in query.order_by(Note.updated_at.desc()).all():
            folder = _slug(names.get(note.notebook_id), "Sem-caderno") if which == "all" else ""
            base = _slug(note.title, f"nota-{note.id}")
            path, n = f"{folder}/{base}.md" if folder else f"{base}.md", 1
            while path in used:
                n += 1
                path = f"{folder}/{base}-{n}.md" if folder else f"{base}-{n}.md"
            used.add(path)
            zf.writestr(path, _as_markdown(note))
    label = "todas-as-notas" if which == "all" else _slug(names.get(int(which)), "caderno")
    return _download(buf.getvalue(), "application/zip", f"meu-tempo-{label}.zip")
