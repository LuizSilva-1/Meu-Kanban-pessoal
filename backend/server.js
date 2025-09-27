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
const STATUS_ORDER = ['backlog', 'analysis', 'doing', 'blocked', 'review', 'done'];
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
    if (!colNames.includes("owner_id")) {
      db.run("ALTER TABLE tasks ADD COLUMN owner_id INTEGER REFERENCES users(id)");
    }
    if (!colNames.includes("regression_reason")) {
      db.run("ALTER TABLE tasks ADD COLUMN regression_reason TEXT");
    }
    if (!colNames.includes("regression_reason_at")) {
      db.run("ALTER TABLE tasks ADD COLUMN regression_reason_at TEXT");
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
      checklist TEXT DEFAULT '[]',
      owner_id INTEGER REFERENCES users(id),
      regression_reason TEXT,
      regression_reason_at TEXT
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
  db.run(`
    CREATE TABLE IF NOT EXISTS task_archive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      code TEXT,
      title TEXT NOT NULL,
      original_status TEXT,
      priority TEXT,
      assignee TEXT,
      owner_id INTEGER,
      owner_username TEXT,
      tags TEXT,
      description TEXT,
      parent_id INTEGER,
      checklist TEXT,
      deleted_at TEXT DEFAULT (datetime('now')),
      deleted_by TEXT,
      restored_at TEXT,
      restored_by TEXT,
      restored_task_id INTEGER
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
          res.json({ id: this.lastID, username, token, role: 'admin' });
        });
      });
    } else {
      const token = generateToken();
      db.run('INSERT INTO users (username, password, token, role) VALUES (?, ?, ?, ?)', [username, password, token, 'user'], function (err2) {
        if (err2) return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
        res.json({ id: this.lastID, username, token, role: 'user' });
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
      res.json({ id: user.id, username, token, role: user.role });
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
  const requesterIsAdmin = req.user.role === 'admin';
  const filters = [];
  const params = [];
  if (!requesterIsAdmin) {
    filters.push('(tasks.owner_id = ? OR tasks.owner_id IS NULL)');
    params.push(req.user.id);
  } else if (req.query.owner) {
    const ownerParam = req.query.owner.trim();
    if (ownerParam === 'none') {
      filters.push('tasks.owner_id IS NULL');
    } else {
      const ownerId = parseInt(ownerParam, 10);
      if (Number.isNaN(ownerId) || ownerId < 1) {
        return res.status(400).json({ error: 'Parâmetro owner inválido' });
      }
      filters.push('tasks.owner_id = ?');
      params.push(ownerId);
    }
  }
  const query = `SELECT tasks.*, users.username AS owner_username FROM tasks LEFT JOIN users ON tasks.owner_id = users.id${filters.length ? ` WHERE ${filters.join(' AND ')}` : ''}`;
  db.all(query, params, (err, rows) => {
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

function ensureOwnerExists(ownerId, dbInstance, callback) {
  if (ownerId === null || ownerId === undefined) {
    return callback(null);
  }
  const numericId = parseInt(ownerId, 10);
  if (Number.isNaN(numericId) || numericId < 1) {
    return callback(new Error('INVALID_OWNER'));
  }
  dbInstance.get('SELECT id FROM users WHERE id = ?', [numericId], (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(new Error('OWNER_NOT_FOUND'));
    callback(null, numericId);
  });
}

function archiveCompletedCards(rows, deletedBy, callback) {
  const doneCards = Array.isArray(rows) ? rows.filter(row => row && row.status === 'done') : [];
  if (doneCards.length === 0) {
    return callback(null);
  }
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO task_archive (
      task_id,
      code,
      title,
      original_status,
      priority,
      assignee,
      owner_id,
      owner_username,
      tags,
      description,
      parent_id,
      checklist,
      deleted_at,
      deleted_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let firstError = null;
  doneCards.forEach(card => {
    if (firstError) return;
    let tagsJson = '[]';
    if (card.tags) {
      if (typeof card.tags === 'string') {
        tagsJson = card.tags;
      } else if (Array.isArray(card.tags)) {
        tagsJson = JSON.stringify(sanitizeTags(card.tags));
      }
    }
    let checklistJson = '[]';
    if (card.checklist) {
      if (typeof card.checklist === 'string') {
        checklistJson = card.checklist;
      } else if (Array.isArray(card.checklist)) {
        checklistJson = JSON.stringify(card.checklist);
      }
    }
    stmt.run(
      [
        card.id || null,
        card.code || null,
        card.title || '',
        card.status || null,
        card.priority || null,
        card.assignee || null,
        card.owner_id || null,
        card.owner_username || null,
        tagsJson,
        card.description || null,
        card.parent_id || null,
        checklistJson,
        now,
        deletedBy || null
      ],
      err => {
        if (err && !firstError) {
          firstError = err;
        }
      }
    );
  });
  stmt.finalize(err => {
    if (!firstError && err) {
      firstError = err;
    }
    callback(firstError);
  });
}

function sanitizeReminderText(input) {
  if (input === null || input === undefined) return '';
  return String(input).trim().slice(0, 280);
}

function normalizeReminderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    text: row.text,
    done: Boolean(row.done),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

app.post("/tasks", authMiddleware, audit('create_task'), (req, res) => {
  let { title, priority = 'media', description = '', assignee = '', parent_id = null, status, tags = [], checklist = [], owner_id } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "O título não pode ser vazio" });
  }
  title = title.trim();
  if (!VALID_PRIORITIES.includes(priority)) {
    priority = 'media';
  }
  const requesterIsAdmin = req.user.role === 'admin';
  let ownerId = req.user.id;
  if (requesterIsAdmin && owner_id !== undefined && owner_id !== null && owner_id !== '') {
    const parsedOwner = parseInt(owner_id, 10);
    if (Number.isNaN(parsedOwner) || parsedOwner < 1) {
      return res.status(400).json({ error: 'owner_id inválido' });
    }
    ownerId = parsedOwner;
  }
  const sanitizedTags = sanitizeTags(tags);
  const tagsJson = JSON.stringify(sanitizedTags);
  const sanitizedChecklist = sanitizeChecklist(checklist);
  const checklistJson = JSON.stringify(sanitizedChecklist);

  const proceedInsert = (finalStatus, parentIdValue, finalOwnerId) => {
    db.get("SELECT MAX(id) as lastId FROM tasks", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      const newId = (row?.lastId || 0) + 1;
      const code = `TASK-${String(newId).padStart(3, '0')}`;
      db.run(
        "INSERT INTO tasks (title, status, priority, description, assignee, parent_id, code, tags, checklist, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, finalStatus, priority, description, assignee, parentIdValue, code, tagsJson, checklistJson, finalOwnerId],
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
            checklist: sanitizedChecklist,
            owner_id: finalOwnerId,
            regression_reason: null,
            regression_reason_at: null
          };
          res.json(payload);
        }
      );
    });
  };
  const insertTask = (finalStatus, parentIdValue, finalOwnerId) => {
    if (finalOwnerId === null || finalOwnerId === undefined || finalOwnerId === req.user.id) {
      proceedInsert(finalStatus, parentIdValue, finalOwnerId ?? null);
      return;
    }
    ensureOwnerExists(finalOwnerId, db, (ownerErr, validatedOwnerId) => {
      if (ownerErr) {
        if (ownerErr.message === 'OWNER_NOT_FOUND') {
          return res.status(400).json({ error: 'owner_id não encontrado' });
        }
        if (ownerErr.message === 'INVALID_OWNER') {
          return res.status(400).json({ error: 'owner_id inválido' });
        }
        return res.status(500).json({ error: ownerErr.message });
      }
      proceedInsert(finalStatus, parentIdValue, validatedOwnerId);
    });
  };

  if (parent_id !== null && parent_id !== undefined && parent_id !== '') {
    const parentId = parseInt(parent_id, 10);
    if (Number.isNaN(parentId) || parentId < 1) {
      return res.status(400).json({ error: 'parent_id inválido' });
    }
    db.get("SELECT id, status, parent_id, owner_id FROM tasks WHERE id = ?", [parentId], (err, parentTask) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!parentTask) return res.status(400).json({ error: 'Tarefa pai não encontrada' });
      if (parentTask.parent_id) {
        return res.status(400).json({ error: 'Uma subtarefa não pode ter seus próprios filhos' });
      }
      if (parentTask.status !== 'backlog') {
        return res.status(400).json({ error: 'Só é possível adicionar subtarefa enquanto o card pai estiver no backlog' });
      }
      if (!requesterIsAdmin && parentTask.owner_id && parentTask.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Sem permissão para adicionar subtarefa neste card' });
      }
      const effectiveOwner = parentTask.owner_id || ownerId;
      const parentStatus = parentTask.status;
      const finalStatus = VALID_STATUSES.includes(status) ? status : parentStatus;
      insertTask(finalStatus, parentId, effectiveOwner);
    });
  } else {
    const finalStatus = VALID_STATUSES.includes(status) ? status : 'backlog';
    insertTask(finalStatus, null, ownerId);
  }
});

// Atualizar tarefa
app.put("/tasks/:id", authMiddleware, audit('update_task'), (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (Number.isNaN(taskId) || taskId < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  const { status, priority, description, assignee, title, parent_id, tags, checklist } = req.body;

  const requesterIsAdmin = req.user.role === 'admin';
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, currentTask) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!currentTask) return res.status(404).json({ error: 'Tarefa não encontrada' });
    if (!requesterIsAdmin && currentTask.owner_id && currentTask.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para alterar este card' });
    }

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
      const currentIndex = STATUS_ORDER.indexOf(currentTask.status);
      const nextIndex = STATUS_ORDER.indexOf(status);
      const statusChanged = status !== currentTask.status;
      const isRegression = statusChanged && currentIndex !== -1 && nextIndex !== -1 && nextIndex < currentIndex;
      let regressionReason = null;

      if (isRegression) {
        regressionReason = typeof req.body.regression_reason === 'string' ? req.body.regression_reason.trim() : '';
        if (!regressionReason) {
          return res.status(400).json({ error: 'Motivo obrigatório ao mover o card para um status anterior.' });
        }
      }

      if (statusChanged) {
        fields.push('status = ?');
        values.push(status);
        if (status === 'done') {
          fields.push("completed_at = datetime('now')");
        }
        if (status === 'backlog' || status === 'doing') {
          fields.push('completed_at = NULL');
        }
        if (isRegression) {
          fields.push('regression_reason = ?');
          values.push(regressionReason);
          fields.push("regression_reason_at = datetime('now')");
        }
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

    let ownerValidationTarget;

    if (req.body.owner_id !== undefined) {
      if (!requesterIsAdmin) {
        return res.status(403).json({ error: 'Somente administradores podem reatribuir cards' });
      }
      if (req.body.owner_id === null || req.body.owner_id === '') {
        fields.push('owner_id = ?');
        values.push(null);
        ownerValidationTarget = null;
      } else {
        const newOwnerId = parseInt(req.body.owner_id, 10);
        if (Number.isNaN(newOwnerId) || newOwnerId < 1) {
          return res.status(400).json({ error: 'owner_id inválido' });
        }
        fields.push('owner_id = ?');
        values.push(newOwnerId);
        ownerValidationTarget = newOwnerId;
      }
    }

    const finalizeUpdate = () => {
      if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
      }
      const performUpdate = () => {
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
      if (ownerValidationTarget && ownerValidationTarget !== currentTask.owner_id) {
        ensureOwnerExists(ownerValidationTarget, db, (ownerErr) => {
          if (ownerErr) {
            if (ownerErr.message === 'OWNER_NOT_FOUND') {
              return res.status(400).json({ error: 'owner_id não encontrado' });
            }
            if (ownerErr.message === 'INVALID_OWNER') {
              return res.status(400).json({ error: 'owner_id inválido' });
            }
            return res.status(500).json({ error: ownerErr.message });
          }
          performUpdate();
        });
      } else {
        performUpdate();
      }
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
        db.get('SELECT id, parent_id, owner_id FROM tasks WHERE id = ?', [newParentId], (parentErr, parentTask) => {
          if (parentErr) return res.status(500).json({ error: parentErr.message });
          if (!parentTask) return res.status(400).json({ error: 'Tarefa pai não encontrada' });
          if (parentTask.parent_id) {
            return res.status(400).json({ error: 'Uma subtarefa não pode ter seus próprios filhos' });
          }
          if (!requesterIsAdmin) {
            const allowedOwner = parentTask.owner_id || req.user.id;
            const currentOwner = currentTask.owner_id || req.user.id;
            if (allowedOwner !== req.user.id || currentOwner !== req.user.id) {
              return res.status(403).json({ error: 'Sem permissão para vincular a este card' });
            }
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
  const requesterIsAdmin = req.user.role === 'admin';
  db.get('SELECT owner_id FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    if (!requesterIsAdmin && task.owner_id && task.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para remover este card' });
    }
    db.all(
      'SELECT tasks.*, users.username AS owner_username FROM tasks LEFT JOIN users ON tasks.owner_id = users.id WHERE tasks.id = ? OR tasks.parent_id = ?',
      [taskId, taskId],
      (fetchErr, rows) => {
        if (fetchErr) return res.status(500).json({ error: fetchErr.message });
        archiveCompletedCards(rows, req.user?.username || null, (archiveErr) => {
          if (archiveErr) {
            console.error('Erro ao arquivar cards concluídos:', archiveErr);
            return res.status(500).json({ error: 'Erro ao arquivar cards removidos' });
          }
          db.run("DELETE FROM tasks WHERE id = ? OR parent_id = ?", [taskId, taskId], function (deleteErr) {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });
            res.json({ deleted: this.changes });
          });
        });
      }
    );
  });
});

app.get('/tasks/archive', authMiddleware, audit('list_archive'), (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { search, owner, start, end, includeRestored } = req.query;
  const filters = [];
  const params = [];

  if (!isAdmin) {
    filters.push('(owner_id = ? OR owner_id IS NULL OR deleted_by = ?)');
    params.push(req.user.id);
    params.push(req.user.username);
  } else if (owner && owner !== 'all') {
    if (owner === 'none') {
      filters.push('owner_id IS NULL');
    } else {
      const ownerId = parseInt(owner, 10);
      if (Number.isNaN(ownerId) || ownerId < 1) {
        return res.status(400).json({ error: 'Parâmetro owner inválido' });
      }
      filters.push('owner_id = ?');
      params.push(ownerId);
    }
  }

  const normalizedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';
  if (normalizedSearch) {
    filters.push('(LOWER(title) LIKE ? OR LOWER(code) LIKE ? OR LOWER(assignee) LIKE ?)');
    const like = `%${normalizedSearch}%`;
    params.push(like, like, like);
  }

  const parseDateInput = (value, endOfDay = false) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    if (endOfDay) {
      parsed.setHours(23, 59, 59, 999);
    }
    return parsed.toISOString();
  };

  const startIso = parseDateInput(start);
  if (start && !startIso) {
    return res.status(400).json({ error: 'Parâmetro start inválido' });
  }
  if (startIso) {
    filters.push('deleted_at >= ?');
    params.push(startIso);
  }

  const endIso = parseDateInput(end, true);
  if (end && !endIso) {
    return res.status(400).json({ error: 'Parâmetro end inválido' });
  }
  if (endIso) {
    filters.push('deleted_at <= ?');
    params.push(endIso);
  }

  const includeRestoredCards = includeRestored === 'true';
  if (!includeRestoredCards) {
    filters.push('restored_at IS NULL');
  }

  const query = `SELECT * FROM task_archive${filters.length ? ` WHERE ${filters.join(' AND ')}` : ''} ORDER BY datetime(deleted_at) DESC LIMIT 500`;
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const normalized = rows.map(row => {
      let tags = [];
      if (row.tags) {
        if (Array.isArray(row.tags)) {
          tags = sanitizeTags(row.tags);
        } else if (typeof row.tags === 'string') {
          try {
            const parsed = JSON.parse(row.tags);
            tags = sanitizeTags(parsed);
          } catch (e) {
            tags = [];
          }
        }
      }
      let checklist = [];
      if (row.checklist) {
        if (Array.isArray(row.checklist)) {
          checklist = row.checklist;
        } else if (typeof row.checklist === 'string') {
          try {
            const parsedChecklist = JSON.parse(row.checklist);
            checklist = Array.isArray(parsedChecklist) ? parsedChecklist : [];
          } catch (e) {
            checklist = [];
          }
        }
      }
      return {
        ...row,
        owner_id: row.owner_id !== null && row.owner_id !== undefined ? Number(row.owner_id) : null,
        restored_task_id: row.restored_task_id !== null && row.restored_task_id !== undefined ? Number(row.restored_task_id) : null,
        tags,
        checklist
      };
    });
    res.json(normalized);
  });
});

app.post('/tasks/archive/:id/restore', authMiddleware, audit('restore_archive'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Somente administradores podem restaurar cards' });
  }
  const archiveId = parseInt(req.params.id, 10);
  if (Number.isNaN(archiveId) || archiveId < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  db.get('SELECT * FROM task_archive WHERE id = ?', [archiveId], (err, record) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!record) return res.status(404).json({ error: 'Registro não encontrado' });
    if (record.restored_at) {
      return res.status(409).json({ error: 'Este card já foi restaurado' });
    }

    let tagsArray = [];
    if (record.tags) {
      if (Array.isArray(record.tags)) {
        tagsArray = sanitizeTags(record.tags);
      } else if (typeof record.tags === 'string') {
        try {
          const parsed = JSON.parse(record.tags);
          tagsArray = sanitizeTags(parsed);
        } catch (e) {
          tagsArray = [];
        }
      }
    }
    const tagsJson = JSON.stringify(tagsArray);

    let checklistArray = [];
    if (record.checklist) {
      if (Array.isArray(record.checklist)) {
        checklistArray = record.checklist;
      } else if (typeof record.checklist === 'string') {
        try {
          const parsedChecklist = JSON.parse(record.checklist);
          checklistArray = Array.isArray(parsedChecklist) ? parsedChecklist : [];
        } catch (e) {
          checklistArray = [];
        }
      }
    }
    const sanitizedChecklist = sanitizeChecklist(checklistArray);
    const checklistJson = JSON.stringify(sanitizedChecklist);

    const priority = VALID_PRIORITIES.includes(record.priority) ? record.priority : 'media';
    const assignee = record.assignee || '';
    const baseDescription = record.description ? String(record.description) : '';
    const now = new Date().toISOString();
    const restoreNote = `Restaurado do histórico em ${now} por ${req.user.username}${record.deleted_by ? ` (removido originalmente por ${record.deleted_by})` : ''}.`;
    const description = baseDescription ? `${baseDescription}\n\n${restoreNote}` : restoreNote;

    const insertTask = (ownerIdForRestore) => {
      db.get('SELECT MAX(id) as lastId FROM tasks', [], (maxErr, last) => {
        if (maxErr) return res.status(500).json({ error: maxErr.message });
        const newId = (last?.lastId || 0) + 1;
        const code = `TASK-${String(newId).padStart(3, '0')}`;
        db.run(
          "INSERT INTO tasks (title, status, priority, description, assignee, parent_id, code, tags, checklist, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            record.title,
            'backlog',
            priority,
            description,
            assignee,
            null,
            code,
            tagsJson,
            checklistJson,
            ownerIdForRestore ?? null
          ],
          function (insertErr) {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            const restoredTaskId = this.lastID;
            db.run(
              'UPDATE task_archive SET restored_at = datetime(\'now\'), restored_by = ?, restored_task_id = ? WHERE id = ?',
              [req.user.username, restoredTaskId, archiveId],
              function (updateErr) {
                if (updateErr) {
                  console.error('Erro ao atualizar registro de histórico:', updateErr);
                  return res.status(500).json({ error: 'Card restaurado, porém houve falha ao atualizar histórico.' });
                }
                res.json({
                  restored: true,
                  restored_task_id: restoredTaskId,
                  code,
                  status: 'backlog'
                });
              }
            );
          }
        );
      });
    };

    const ownerId = record.owner_id !== null && record.owner_id !== undefined ? Number(record.owner_id) : null;
    if (ownerId) {
      ensureOwnerExists(ownerId, db, (ownerErr, validatedOwnerId) => {
        if (ownerErr) {
          if (ownerErr.message === 'INVALID_OWNER') {
            return res.status(400).json({ error: 'Responsável inválido para restauração' });
          }
          // Se o usuário original não existir mais, restauramos sem responsável.
          insertTask(null);
        } else {
          insertTask(validatedOwnerId);
        }
      });
    } else {
      insertTask(null);
    }
  });
});

app.get('/reminders', authMiddleware, audit('list_reminders'), (req, res) => {
  const isAdmin = req.user.role === 'admin';
  let targetUserId = req.user.id;
  if (isAdmin && req.query.user) {
    const parsed = parseInt(String(req.query.user).trim(), 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return res.status(400).json({ error: 'Parâmetro user inválido' });
    }
    targetUserId = parsed;
  }

  db.all(
    'SELECT * FROM reminders WHERE user_id = ? ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC LIMIT 100',
    [targetUserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const normalized = rows.map(normalizeReminderRow);
      res.json(normalized);
    }
  );
});

app.post('/reminders', authMiddleware, audit('create_reminder'), (req, res) => {
  const rawText = req.body?.text;
  const text = sanitizeReminderText(rawText);
  if (!text) {
    return res.status(400).json({ error: 'O texto do lembrete é obrigatório.' });
  }

  const targetUserId = req.user.id;

  db.run(
    'INSERT INTO reminders (user_id, text, done) VALUES (?, ?, 0)',
    [targetUserId, text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM reminders WHERE id = ?', [this.lastID], (fetchErr, row) => {
        if (fetchErr) return res.status(500).json({ error: fetchErr.message });
        res.status(201).json(normalizeReminderRow(row));
      });
    }
  );
});

app.put('/reminders/:id', authMiddleware, audit('update_reminder'), (req, res) => {
  const reminderId = parseInt(req.params.id, 10);
  if (Number.isNaN(reminderId) || reminderId < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  db.get('SELECT * FROM reminders WHERE id = ?', [reminderId], (err, reminder) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!reminder) return res.status(404).json({ error: 'Lembrete não encontrado' });
    if (reminder.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para alterar este lembrete' });
    }

    const fields = [];
    const values = [];

    if (req.body?.text !== undefined) {
      const text = sanitizeReminderText(req.body.text);
      if (!text) {
        return res.status(400).json({ error: 'O texto do lembrete é obrigatório.' });
      }
      fields.push('text = ?');
      values.push(text);
    }

    if (req.body?.done !== undefined) {
      fields.push('done = ?');
      values.push(req.body.done ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    fields.push("updated_at = datetime('now')");
    values.push(reminderId);

    db.run(
      `UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function (updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        db.get('SELECT * FROM reminders WHERE id = ?', [reminderId], (fetchErr, row) => {
          if (fetchErr) return res.status(500).json({ error: fetchErr.message });
          res.json(normalizeReminderRow(row));
        });
      }
    );
  });
});

app.delete('/reminders/:id', authMiddleware, audit('delete_reminder'), (req, res) => {
  const reminderId = parseInt(req.params.id, 10);
  if (Number.isNaN(reminderId) || reminderId < 1) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  db.get('SELECT user_id FROM reminders WHERE id = ?', [reminderId], (err, reminder) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!reminder) return res.status(404).json({ error: 'Lembrete não encontrado' });
    if (reminder.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover este lembrete' });
    }

    db.run('DELETE FROM reminders WHERE id = ?', [reminderId], function (deleteErr) {
      if (deleteErr) return res.status(500).json({ error: deleteErr.message });
      res.json({ deleted: this.changes });
    });
  });
});

// 🚀 Inicialização
app.listen(5000, () => console.log("🚀 Backend rodando na porta 5000"));
