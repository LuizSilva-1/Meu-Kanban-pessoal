const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");


const crypto = require('crypto');
function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

const VALID_STATUSES = ['backlog', 'analysis', 'doing', 'blocked', 'review', 'done'];
const VALID_PRIORITIES = ['baixa', 'media', 'alta'];

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
// Garante que todas as colunas necessárias existem na tabela tasks
function ensureTaskColumns() {
  db.all("PRAGMA table_info(tasks)", [], (err, columns) => {
    if (err) return console.error("Erro ao verificar colunas da tabela tasks:", err);
    const colNames = columns.map(c => c.name);
    if (!colNames.includes("parent_id")) {
      db.run("ALTER TABLE tasks ADD COLUMN parent_id INTEGER REFERENCES tasks(id)");
    }
    if (!colNames.includes("code")) {
      db.run("ALTER TABLE tasks ADD COLUMN code TEXT");
    }
    if (!colNames.includes("updated_at")) {
      db.run("ALTER TABLE tasks ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))");
    }
    if (!colNames.includes("tags")) {
      db.run("ALTER TABLE tasks ADD COLUMN tags TEXT DEFAULT '[]'");
    }
    if (!colNames.includes("checklist")) {
      db.run("ALTER TABLE tasks ADD COLUMN checklist TEXT DEFAULT '[]'");
    }
  });
}

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
      assignee TEXT,
      parent_id INTEGER REFERENCES tasks(id),
      code TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      tags TEXT DEFAULT '[]',
      checklist TEXT DEFAULT '[]'
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
  ensureTaskColumns();
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
    const normalized = rows.map(row => {
      let parsedTags = [];
      if (row.tags) {
        if (Array.isArray(row.tags)) {
          parsedTags = sanitizeTags(row.tags);
        } else if (typeof row.tags === 'string') {
          try {
            const fromJson = JSON.parse(row.tags);
            parsedTags = sanitizeTags(fromJson);
          } catch (e) {
            parsedTags = [];
          }
        }
      }
      let parsedChecklist = [];
      if (row.checklist) {
        if (Array.isArray(row.checklist)) {
          parsedChecklist = sanitizeChecklist(row.checklist);
        } else if (typeof row.checklist === 'string') {
          try {
            const fromJsonChecklist = JSON.parse(row.checklist);
            parsedChecklist = sanitizeChecklist(fromJsonChecklist);
          } catch (e) {
            parsedChecklist = [];
          }
        }
      }
      return { ...row, tags: parsedTags, checklist: parsedChecklist };
    });
    res.json(normalized);
  });
});

// Criar nova tarefa
function sanitizeTags(input) {
  if (!input) return [];
  const source = Array.isArray(input) ? input : [];
  const cleaned = source
    .map(t => String(t).trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(cleaned)].slice(0, 10);
}

function sanitizeChecklist(input) {
  if (!input) return [];
  const source = Array.isArray(input) ? input : [];
  const seen = new Set();
  const result = [];
  for (const item of source) {
    if (!item) continue;
    const textSource = typeof item === 'string' ? item : (item.text ?? '');
    const text = String(textSource).trim();
    if (!text) continue;
    let id = item.id ? String(item.id) : `chk-${crypto.randomBytes(5).toString('hex')}`;
    if (seen.has(id)) {
      id = `chk-${crypto.randomBytes(5).toString('hex')}`;
    }
    seen.add(id);
    result.push({ id, text, done: Boolean(item.done) });
    if (result.length >= 50) break;
  }
  return result;
}

app.post("/tasks", authMiddleware, audit('create_task'), (req, res) => {
  let { title, priority = 'media', description = '', assignee = '', parent_id = null, status, tags = [], checklist = [] } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "O título não pode ser vazio" });
  }
  title = title.trim();
  if (!VALID_PRIORITIES.includes(priority)) {
    priority = 'media';
  }
  const sanitizedTags = sanitizeTags(tags);
  const tagsJson = JSON.stringify(sanitizedTags);
  const sanitizedChecklist = sanitizeChecklist(checklist);
  const checklistJson = JSON.stringify(sanitizedChecklist);

  const insertTask = (finalStatus, parentIdValue) => {
    db.get("SELECT MAX(id) as lastId FROM tasks", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      const newId = (row?.lastId || 0) + 1;
      const code = `TASK-${String(newId).padStart(3, '0')}`;
      db.run(
        "INSERT INTO tasks (title, status, priority, description, assignee, parent_id, code, tags, checklist) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, finalStatus, priority, description, assignee, parentIdValue, code, tagsJson, checklistJson],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          const payload = {
            id: this.lastID,
            code,
            title,
            status: finalStatus,
            priority,
            description,
            assignee,
            parent_id: parentIdValue,
            updated_at: new Date().toISOString(),
            tags: sanitizedTags,
            checklist: sanitizedChecklist
          };
          res.json(payload);
        }
      );
    });
  };

  if (parent_id !== null && parent_id !== undefined && parent_id !== '') {
    const parentId = parseInt(parent_id, 10);
    if (Number.isNaN(parentId) || parentId < 1) {
      return res.status(400).json({ error: 'parent_id inválido' });
    }
    db.get("SELECT id, status, parent_id FROM tasks WHERE id = ?", [parentId], (err, parentTask) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!parentTask) return res.status(400).json({ error: 'Tarefa pai não encontrada' });
      if (parentTask.parent_id) {
        return res.status(400).json({ error: 'Uma subtarefa não pode ter seus próprios filhos' });
      }
      if (parentTask.status !== 'backlog') {
        return res.status(400).json({ error: 'Só é possível adicionar subtarefa enquanto o card pai estiver no backlog' });
      }
      const parentStatus = parentTask.status;
      const finalStatus = VALID_STATUSES.includes(status) ? status : parentStatus;
      insertTask(finalStatus, parentId);
    });
  } else {
    const finalStatus = VALID_STATUSES.includes(status) ? status : 'backlog';
    insertTask(finalStatus, null);
  }
});

// Atualizar tarefa
app.put("/tasks/:id", authMiddleware, audit('update_task'), (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (Number.isNaN(taskId) || taskId < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  const { status, priority, description, assignee, title, parent_id, tags, checklist } = req.body;

  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, currentTask) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!currentTask) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const fields = [];
    const values = [];

    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'O título não pode ser vazio' });
      }
      fields.push('title = ?');
      values.push(title.trim());
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      fields.push('status = ?');
      values.push(status);
      if (status === 'done') {
        fields.push("completed_at = datetime('now')");
      }
      if (status === 'backlog' || status === 'doing') {
        fields.push('completed_at = NULL');
      }
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: 'Prioridade inválida' });
      }
      fields.push('priority = ?');
      values.push(priority);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }

    if (assignee !== undefined) {
      fields.push('assignee = ?');
      values.push(assignee);
    }

    if (tags !== undefined) {
      const sanitizedTags = sanitizeTags(tags);
      fields.push('tags = ?');
      values.push(JSON.stringify(sanitizedTags));
    }

    if (checklist !== undefined) {
      const sanitizedChecklist = sanitizeChecklist(checklist);
      fields.push('checklist = ?');
      values.push(JSON.stringify(sanitizedChecklist));
    }

    const finalizeUpdate = () => {
      if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
      }
      fields.push("updated_at = datetime('now')");
      values.push(taskId);
      db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function (updateErr) {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          res.json({ updated: this.changes });
        }
      );
    };

    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === '') {
        fields.push('parent_id = ?');
        values.push(null);
        finalizeUpdate();
      } else {
        const newParentId = parseInt(parent_id, 10);
        if (Number.isNaN(newParentId) || newParentId < 1) {
          return res.status(400).json({ error: 'parent_id inválido' });
        }
        if (newParentId === taskId) {
          return res.status(400).json({ error: 'Uma tarefa não pode ser pai de si mesma' });
        }
        db.get('SELECT id, parent_id FROM tasks WHERE id = ?', [newParentId], (parentErr, parentTask) => {
          if (parentErr) return res.status(500).json({ error: parentErr.message });
          if (!parentTask) return res.status(400).json({ error: 'Tarefa pai não encontrada' });
          if (parentTask.parent_id) {
            return res.status(400).json({ error: 'Uma subtarefa não pode ter seus próprios filhos' });
          }
          fields.push('parent_id = ?');
          values.push(newParentId);
          finalizeUpdate();
        });
      }
    } else {
      finalizeUpdate();
    }
  });
});

// Remover tarefa
app.delete("/tasks/:id", authMiddleware, audit('delete_task'), (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (Number.isNaN(taskId) || taskId < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  db.run("DELETE FROM tasks WHERE id = ? OR parent_id = ?", [taskId, taskId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// 🚀 Inicialização
app.listen(5000, () => console.log("🚀 Backend rodando na porta 5000"));
