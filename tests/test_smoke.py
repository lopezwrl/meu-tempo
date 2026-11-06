"""Testes de fumaça: python -m unittest discover -s tests"""
import io
import json
import os
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app  # noqa: E402


class SmokeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        uri = "sqlite:///" + os.path.join(self.tmp.name, "teste.db")
        self.app = create_app({"SQLALCHEMY_DATABASE_URI": uri, "TESTING": True})
        self.c = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            from app.models.db import db
            db.session.remove()
            db.engine.dispose()
        self.tmp.cleanup()

    def test_pages_render(self):
        for url in ["/", "/notas", "/meu-dia", "/minha-semana", "/calendario", "/tarefas",
                    "/projetos", "/historico", "/configuracoes", "/manifest.webmanifest", "/sw.js"]:
            self.assertEqual(self.c.get(url).status_code, 200, url)

    def test_notebooks_and_notes(self):
        nbs = self.c.get("/api/notebooks").get_json()
        self.assertEqual(nbs[0]["name"], "Geral")
        nb = self.c.post("/api/notebooks", json={"name": "Estudos"}).get_json()
        note = self.c.post("/api/notes", json={"title": "a", "content": "b", "notebook_id": nb["id"]}).get_json()
        self.assertEqual(note["notebook_id"], nb["id"])
        moved = self.c.put(f"/api/notes/{note['id']}", json={"archived": True, "pinned": True}).get_json()
        self.assertTrue(moved["archived"] and moved["pinned"])
        # notebook de outro usuário/inexistente é ignorado
        stray = self.c.post("/api/notes", json={"title": "x", "notebook_id": 999}).get_json()
        self.assertIsNone(stray["notebook_id"])
        # excluir o caderno não apaga as notas
        self.c.delete(f"/api/notebooks/{nb['id']}")
        self.assertEqual(len(self.c.get("/api/notes").get_json()), 2)

    def test_export_markdown_zip(self):
        self.c.post("/api/notes", json={"title": "Ação", "content": "olá", "notebook_id": 1})
        r = self.c.get("/api/export?notebook=all")
        names = zipfile.ZipFile(io.BytesIO(r.data)).namelist()
        self.assertEqual(names, ["Geral/Acao.md"])
        self.assertIn("# Ação", self.c.get("/api/notes/1/export").data.decode())

    def test_backup_and_restore_roundtrip(self):
        self.c.post("/api/notes", json={"title": "guardar", "content": "isto", "notebook_id": 1})
        self.c.post("/api/tasks", json={"name": "Tarefa", "date": "2026-09-23", "time": "09:00", "estimated_minutes": 30})
        backup = json.loads(self.c.get("/api/backup").data)
        self.c.delete("/api/notes/1")
        self.assertEqual(self.c.get("/api/notes").get_json(), [])
        r = self.c.post("/api/backup/restore", json=backup)
        self.assertEqual(r.status_code, 200)
        self.assertEqual([n["title"] for n in self.c.get("/api/notes").get_json()], ["guardar"])
        self.assertEqual(self.c.post("/api/backup/restore", json={"x": 1}).status_code, 400)

    def test_exports_open(self):
        self.c.post("/api/tasks", json={"name": "Tarefa", "date": "2026-09-23"})
        self.assertIn("Tarefa", self.c.get("/api/export/tasks.csv").data.decode("utf-8-sig"))
        xlsx = self.c.get("/api/export/report.xlsx")
        self.assertTrue(zipfile.is_zipfile(io.BytesIO(xlsx.data)))

    def test_onboarding_once(self):
        self.assertIn(b'id="onboarding"', self.c.get("/").data)
        self.c.post("/api/onboarding", json={"name": "Ana", "workday_start": "09:00", "workday_end": "17:00", "notebook": "Trabalho"})
        page = self.c.get("/").data
        self.assertNotIn(b'id="onboarding"', page)
        self.assertEqual(self.c.get("/api/notebooks").get_json()[0]["name"], "Trabalho")

    def test_subtasks_and_linked_notes(self):
        task = self.c.post("/api/tasks", json={"name": "Relatório"}).get_json()
        sub = self.c.post(f"/api/tasks/{task['id']}/subtasks", json={"title": "Coletar dados"}).get_json()
        self.c.post(f"/api/tasks/{task['id']}/subtasks", json={"title": "Escrever"})
        self.assertEqual(self.c.post(f"/api/tasks/{task['id']}/subtasks", json={"title": " "}).status_code, 400)
        self.c.put(f"/api/subtasks/{sub['id']}", json={"done": True})
        t = [x for x in self.c.get("/api/tasks").get_json() if x["id"] == task["id"]][0]
        self.assertEqual((t["subtasks_done"], t["subtasks_total"]), (1, 2))

        note = self.c.post("/api/notes", json={"title": "Ideias", "content": ""}).get_json()
        self.assertIsNotNone(note["notebook_id"])  # sem caderno informado -> primeiro caderno
        extras = self.c.get(f"/api/tasks/{task['id']}/extras").get_json()
        self.assertEqual([n["id"] for n in extras["available_notes"]], [note["id"]])
        linked = self.c.put(f"/api/notes/{note['id']}", json={"task_id": task["id"]}).get_json()
        self.assertEqual(linked["task_name"], "Relatório")
        self.assertEqual(len(self.c.get(f"/api/tasks/{task['id']}/extras").get_json()["notes"]), 1)
        # apagar a tarefa leva as subtarefas junto
        self.c.delete(f"/api/tasks/{task['id']}")
        self.assertEqual(self.c.get("/api/tasks").get_json(), [])

    def test_idle_discount(self):
        task = self.c.post("/api/tasks", json={"name": "Foco"}).get_json()
        self.c.post(f"/api/tasks/{task['id']}/start", json={})
        with self.app.app_context():
            from datetime import datetime, timedelta
            from app.models.db import db
            from app.models.time_entry import TimeEntry
            entry = TimeEntry.query.first()
            entry.start_time = datetime.utcnow() - timedelta(minutes=40)
            db.session.commit()
        r = self.c.post("/api/timer/idle", json={"task_id": task["id"], "seconds": 30 * 60, "action": "resume"})
        self.assertEqual(r.status_code, 200)
        with self.app.app_context():
            from app.models.time_entry import TimeEntry
            closed = TimeEntry.query.filter(TimeEntry.end_time.isnot(None)).one()
            self.assertAlmostEqual(closed.duration_seconds, 10 * 60, delta=5)  # 40 min - 30 descontados
            self.assertEqual(TimeEntry.query.filter(TimeEntry.end_time.is_(None)).count(), 1)  # segue rodando
        self.assertEqual(self.c.post("/api/timer/idle", json={"task_id": 1, "action": "x"}).status_code, 400)
        self.assertEqual(self.c.post("/api/settings/idle", json={"minutes": 999}).status_code, 400)
        self.assertEqual(self.c.post("/api/settings/idle", json={"minutes": 5}).status_code, 200)


if __name__ == "__main__":
    unittest.main()
