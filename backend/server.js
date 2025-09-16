const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");


const crypto = require('crypto');
function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

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

// 🗄️ Criação segura das tabelas
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
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      token TEXT,
      role TEXT DEFAULT 'user' -- 'user' ou 'admin'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      action TEXT,
      method TEXT,
      path TEXT,
      date TEXT
    )
  `);
});

// Middleware para checar se usuário é admin
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores' });
  next();
}

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente' });
  const token = auth.replace('Bearer ', '');
  db.get('SELECT * FROM users WHERE token = ?', [token], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Middleware de auditoria
function audit(action) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        db.run(
          'INSERT INTO audit (user, action, method, path, date) VALUES (?, ?, ?, ?, ?)',
          [req.user ? req.user.username : 'anonymous', action, req.method, req.originalUrl, new Date().toISOString()]
        );
      }
    });
    next();
  };
}

// Cadastro de usuário
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) return res.status(409).json({ error: 'Usuário já existe' });
    // Permitir criar admin apenas se não houver nenhum admin
    if (role === 'admin') {
      db.get('SELECT * FROM users WHERE role = "admin"', [], (err2, adminUser) => {
        if (adminUser) return res.status(403).json({ error: 'Já existe um administrador' });
        const token = generateToken();
        db.run('INSERT INTO users (username, password, token, role) VALUES (?, ?, ?, ?)', [username, password, token, 'admin'], function (err3) {
          if (err3) return res.status(500).json({ error: 'Erro ao cadastrar admin' });
          res.json({ username, token, role: 'admin' });
        });
      });
    } else {
      const token = generateToken();
      db.run('INSERT INTO users (username, password, token, role) VALUES (?, ?, ?, ?)', [username, password, token, 'user'], function (err2) {
        if (err2) return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
        res.json({ username, token, role: 'user' });
      });
    }
  });
});

// Login de usuário
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user || user.password !== password) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    // Gera novo token a cada login
    const token = generateToken();
    db.run('UPDATE users SET token = ? WHERE id = ?', [token, user.id], function (err2) {
      if (err2) return res.status(500).json({ error: 'Erro ao atualizar token' });
      res.json({ username, token, role: user.role });
    });
  });
});

// Exemplo de rota protegida só para admin
app.get('/api/admin-only', authMiddleware, adminOnly, (req, res) => {
  res.json({ message: 'Bem-vindo, admin!' });
});

// Alteração de senha (rota protegida)
app.post('/api/change-password', authMiddleware, audit('change_password'), (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Senha atual e nova obrigatórias' });
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (!user || user.password !== currentPassword) return res.status(401).json({ error: 'Senha atual incorreta' });
    db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.user.id], function (err2) {
      if (err2) return res.status(500).json({ error: 'Erro ao alterar senha' });
      res.json({ success: true });
    });
  });
});

// Listar todos os usuários (admin only)
app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
  db.all('SELECT id, username, role FROM users ORDER BY username', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// Editar papel do usuário (admin only)
app.put('/api/users/:id/role', authMiddleware, adminOnly, (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Papel inválido' });
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Remover usuário (admin only, não pode remover a si mesmo)
app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Não pode remover a si mesmo' });
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Consulta de auditoria (protegida)
app.get('/api/audit', authMiddleware, audit('view_audit'), (req, res) => {
  db.all('SELECT * FROM audit ORDER BY date DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Listar todas as tarefas
app.get("/tasks", authMiddleware, audit('list_tasks'), (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Criar nova tarefa
app.post("/tasks", authMiddleware, audit('create_task'), (req, res) => {
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

// Atualizar tarefa
app.put("/tasks/:id", authMiddleware, audit('update_task'), (req, res) => {
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

// Remover tarefa
app.delete("/tasks/:id", authMiddleware, audit('delete_task'), (req, res) => {
  db.run("DELETE FROM tasks WHERE id = ?", req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// 🚀 Inicialização
app.listen(5000, () => console.log("🚀 Backend rodando na porta 5000"));
