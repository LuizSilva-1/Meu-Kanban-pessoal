const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📂 Garante que a pasta do banco existe
const dbPath = path.join(__dirname, "dbdata");
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

// 📦 Caminho fixo do banco
const dbFile = path.join(dbPath, "database.sqlite");
const db = new sqlite3.Database(dbFile);

// 🗄️ Criação segura da tabela
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('backlog','analysis','doing','blocked','review','done')),
      priority TEXT CHECK(priority IN ('baixa','media','alta')) DEFAULT 'media',
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      assignee TEXT
    )
  `);
});

// 📌 Rotas
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/tasks", (req, res) => {
  const { title, priority = 'media', description = '', assignee = '' } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "O título não pode ser vazio" });
  }
  db.run(
    "INSERT INTO tasks (title, status, priority, description, assignee) VALUES (?, ?, ?, ?, ?)",
    [title, "backlog", priority, description, assignee],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, status: "backlog", priority, description, assignee });
    }
  );
});

app.put("/tasks/:id", (req, res) => {
  const { status, priority, description, assignee } = req.body;
  let fields = [];
  let values = [];
  if (status) {
    fields.push("status = ?");
    values.push(status);
    if (status === "done") {
      fields.push("completed_at = datetime('now')");
    }
    if (status === "backlog" || status === "doing") {
      fields.push("completed_at = NULL");
    }
  }
  if (priority) {
    fields.push("priority = ?");
    values.push(priority);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    values.push(description);
  }
  if (assignee !== undefined) {
    fields.push("assignee = ?");
    values.push(assignee);
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }
  values.push(req.params.id);
  db.run(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete("/tasks/:id", (req, res) => {
  db.run("DELETE FROM tasks WHERE id = ?", req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// 🚀 Inicialização
app.listen(5000, () => console.log("🚀 Backend rodando na porta 5000"));
