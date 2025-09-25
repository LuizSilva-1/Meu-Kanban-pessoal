// Painel administrativo para gerenciar usuários
function AdminPanel({ user, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    axios.get("/api/users")
      .then(res => setUsers(res.data))
      .catch(() => setError("Erro ao buscar usuários"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = (id, newRole) => {
    axios.put(`/api/users/${id}/role`, { role: newRole })
      .then(() => { setSuccess("Papel atualizado!"); fetchUsers(); })
      .catch(() => setError("Erro ao atualizar papel"));
  };

  const handleRemove = (id) => {
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      axios.delete(`/api/users/${id}`)
        .then(() => { setSuccess("Usuário removido!"); fetchUsers(); })
        .catch(err => setError(err.response?.data?.error || "Erro ao remover usuário"));
    }
  };

  return (
    <Modal isOpen onRequestClose={onClose} contentLabel="Administração de Usuários" style={{content:{maxWidth:500,margin:'60px auto',borderRadius:10}}}>
      <h2 style={{marginTop:0}}>Administração de Usuários</h2>
      {error && <div style={{ color: "#e53935", marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: "#43a047", marginBottom: 8 }}>{success}</div>}
      {loading ? <div>Carregando...</div> : (
        <table style={{width:'100%',fontSize:15}}>
          <thead>
            <tr style={{background:'#eee'}}>
              <th>Usuário</th>
              <th>Papel</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}{u.id === user.id && ' (você)'}</td>
                <td>
                  <select value={u.role} disabled={u.id === user.id} onChange={e => handleRoleChange(u.id, e.target.value)}>
                    <option value="user">usuário</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  {u.id !== user.id && (
                    <button onClick={() => handleRemove(u.id)} style={{ background: "#e53935", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontWeight: 700 }}>Remover</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={onClose} style={{ width: "100%", padding: 8, borderRadius: 6, background: "#eee", color: "#232f3e", fontWeight: 700, border: "none", marginTop: 16 }}>Fechar</button>
    </Modal>
  );
}
// Formulário de alteração de senha
function ChangePasswordForm({ onClose, isOpen }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/change-password", { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} contentLabel="Alterar Senha" style={{content:{maxWidth:400,margin:'60px auto',borderRadius:10}}}>
      <h2 style={{marginTop:0}}>Alterar Senha</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
          required
        />
        <input
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
          required
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
          required
        />
        {error && <div style={{ color: "#e53935", marginBottom: 8 }}>{error}</div>}
        {success && <div style={{ color: "#43a047", marginBottom: 8 }}>Senha alterada com sucesso!</div>}
        <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#1976d2", color: "#fff", fontWeight: 700, border: "none", marginBottom: 8 }} disabled={loading}>
          {loading ? "Salvando..." : "Alterar Senha"}
        </button>
      </form>
      <button onClick={onClose} style={{ width: "100%", padding: 8, borderRadius: 6, background: "#eee", color: "#232f3e", fontWeight: 700, border: "none" }}>Fechar</button>
    </Modal>
  );
}
// ...existing imports...
import Modal from "react-modal";
Modal.setAppElement('#root');
// Componente para exibir auditoria
function AuditLogModal({ isOpen, onRequestClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      axios.get("/api/audit")
        .then(res => setLogs(res.data))
        .catch(err => setError("Erro ao buscar auditoria"))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Auditoria" style={{content:{maxWidth:600,margin:'60px auto',borderRadius:10}}}>
      <h2 style={{marginTop:0}}>Auditoria do Sistema</h2>
      <button onClick={onRequestClose} style={{position:'absolute',top:12,right:18,background:'#e53935',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:700}}>Fechar</button>
      {loading ? <div>Carregando...</div> : error ? <div style={{color:'#e53935'}}>{error}</div> : (
        <div style={{maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',fontSize:15}}>
            <thead>
              <tr style={{background:'#eee'}}>
                <th style={{textAlign:'left'}}>Usuário</th>
                <th>Ação</th>
                <th>Método</th>
                <th>Rota</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log,i) => (
                <tr key={log.id || i}>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.method}</td>
                  <td>{log.path}</td>
                  <td>{new Date(log.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
// Função utilitária para exportar CSV
function exportHistoricoCSV(historico) {
  if (!historico.length) return;
  const header = 'Título,Data de Remoção\n';
  const rows = historico.map(t => `"${t.title.replace(/"/g, '""')}",${t.deletedAt ? new Date(t.deletedAt).toLocaleString() : ''}`);
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'historico_atividades_concluidas.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Histórico de tarefas removidas do concluído
function useHistorico() {
  const [historico, setHistorico] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("historicoTarefas")) || [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("historicoTarefas", JSON.stringify(historico));
  }, [historico]);
  return [historico, setHistorico];
}

// Lembrete geral salvo no localStorage
function Lembrete() {
  const [lembrete, setLembrete] = useState(() => localStorage.getItem("lembrete") || "");
  useEffect(() => {
    localStorage.setItem("lembrete", lembrete);
  }, [lembrete]);
  return (
    <div className="lembrete-box">
      <label className="lembrete-label">Lembrete rápido:</label>
      <textarea
        className="lembrete-textarea"
        value={lembrete}
        onChange={e => setLembrete(e.target.value)}
        placeholder="Digite aqui seu lembrete pessoal..."
        rows={2}
      />
    </div>
  );
}

const statusIcons = {
  backlog: "📋",
  analysis: "🔎",
  doing: "🚧",
  blocked: "⛔",
  review: "🧐",
  done: "✅"
};
const statusLabels = {
  backlog: "Backlog",
  analysis: "Em Análise",
  doing: "Fazendo",
  blocked: "Impedido",
  review: "Revisão",
  done: "Concluído"
};
const priorityLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
};
const priorityOptions = ['baixa', 'media', 'alta'];

const RELATIVE_TIME_MAP = [
  { limit: 60, divisor: 1, unit: 'segundos' },
  { limit: 3600, divisor: 60, unit: 'minutos' },
  { limit: 86400, divisor: 3600, unit: 'horas' },
  { limit: 604800, divisor: 86400, unit: 'dias' },
  { limit: 2629746, divisor: 604800, unit: 'semanas' },
  { limit: 31556952, divisor: 2629746, unit: 'meses' }
];
const MAX_CHECKLIST_ITEMS = 50;
const SEARCHABLE_KEYS = new Set(['status', 'assignee', 'priority', 'tag', 'code']);

function formatRelativeTime(value) {
  if (!value) return '—';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '—';
  const diffSeconds = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (diffSeconds < 5) return 'agora';
  for (const entry of RELATIVE_TIME_MAP) {
    if (diffSeconds < entry.limit) {
      const amount = Math.floor(diffSeconds / entry.divisor);
      return `há ${amount} ${entry.unit}`;
    }
  }
  const years = Math.floor(diffSeconds / 31556952);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function createChecklistId() {
  return `chk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeTagsClient(input) {
  if (!input) return [];
  const source = Array.isArray(input) ? input : [];
  const cleaned = source
    .map(t => String(t).trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(cleaned)].slice(0, 10);
}

function sanitizeChecklistClient(input) {
  if (!input) return [];
  const source = Array.isArray(input) ? input : [];
  const seen = new Set();
  const cleaned = [];
  source.forEach(item => {
    if (!item) return;
    const text = String(item.text ?? '').trim();
    if (!text) return;
    let id = item.id ? String(item.id) : createChecklistId();
    if (seen.has(id)) {
      id = createChecklistId();
    }
    seen.add(id);
    cleaned.push({ id, text, done: Boolean(item.done) });
  });
  return cleaned.slice(0, MAX_CHECKLIST_ITEMS);
}

function normalizeTask(raw = {}) {
  let tagsSource = raw.tags;
  if (!Array.isArray(tagsSource) && typeof tagsSource === 'string') {
    try {
      const parsed = JSON.parse(tagsSource);
      tagsSource = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      tagsSource = [];
    }
  }
  const tags = sanitizeTagsClient(tagsSource);
  let checklistSource = raw.checklist;
  if (!Array.isArray(checklistSource) && typeof checklistSource === 'string') {
    try {
      const parsedChecklist = JSON.parse(checklistSource);
      checklistSource = Array.isArray(parsedChecklist) ? parsedChecklist : [];
    } catch (e) {
      checklistSource = [];
    }
  }
  const checklist = sanitizeChecklistClient(checklistSource);
  return {
    ...raw,
    tags,
    checklist,
    updated_at: raw.updated_at || raw.updatedAt || null
  };
}

function parseSearchQuery(query) {
  const filters = {
    status: [],
    assignee: [],
    priority: [],
    tag: [],
    code: []
  };
  const textTerms = [];
  const tokens = [];
  if (!query) return { filters, textTerms, tokens };
  query.trim().split(/\s+/).forEach(token => {
    if (!token) return;
    const [rawKey, ...rest] = token.split(':');
    if (rest.length === 0) {
      const value = token.toLowerCase();
      textTerms.push(value);
      tokens.push({ type: 'text', value, raw: token });
      return;
    }
    const key = rawKey.toLowerCase();
    const value = rest.join(':').toLowerCase();
    if (!SEARCHABLE_KEYS.has(key) || !value) {
      textTerms.push(token.toLowerCase());
      tokens.push({ type: 'text', value: token.toLowerCase(), raw: token });
      return;
    }
    if (key === 'status' && statusOrder.includes(value)) {
      filters.status.push(value);
      tokens.push({ type: 'filter', key: 'status', value, raw: token });
      return;
    }
    if (key === 'priority' && priorityOptions.includes(value)) {
      filters.priority.push(value);
      tokens.push({ type: 'filter', key: 'priority', value, raw: token });
      return;
    }
    if (key === 'tag') {
      filters.tag.push(value);
      tokens.push({ type: 'filter', key: 'tag', value, raw: token });
      return;
    }
    filters[key].push(value);
    tokens.push({ type: 'filter', key, value, raw: token });
  });
  return { filters, textTerms, tokens };
}
const statusOrder = [
  "backlog",
  "analysis",
  "doing",
  "blocked",
  "review",
  "done"
];



// Componente de autenticação (login/cadastro) com opção de admin
function AuthForm({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("user");
  const [adminAvailable, setAdminAvailable] = useState(false);

  // Sempre permitir criar admin, o backend irá validar
  useEffect(() => {
    if (!isLogin) {
      setAdminAvailable(true);
    }
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const url = isLogin ? "/api/login" : "/api/register";
      const payload = isLogin ? { username, password } : { username, password, role };
      const res = await axios.post(url, payload);
      onAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao autenticar");
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: "60px auto", background: "#fff", padding: 24, borderRadius: 10, boxShadow: "0 2px 12px #0002" }}>
      <h2 style={{ textAlign: "center" }}>{isLogin ? "Login" : "Cadastro"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
          required
        />
        {!isLogin && adminAvailable && (
          <div style={{ marginBottom: 10 }}>
            <label>
              <input type="radio" name="role" value="user" checked={role === "user"} onChange={() => setRole("user")} /> Usuário
            </label>
            <label style={{ marginLeft: 16 }}>
              <input type="radio" name="role" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} /> Administrador
            </label>
            <div style={{ fontSize: 12, color: '#888' }}>(Só é possível criar o primeiro admin)</div>
          </div>
        )}
        {error && <div style={{ color: "#e53935", marginBottom: 8 }}>{error}</div>}
        <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#1976d2", color: "#fff", fontWeight: 700, border: "none", marginBottom: 8 }}>
          {isLogin ? "Entrar" : "Cadastrar"}
        </button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} style={{ width: "100%", padding: 8, borderRadius: 6, background: "#ff9900", color: "#232f3e", fontWeight: 700, border: "none" }}>
        {isLogin ? "Criar conta" : "Já tenho conta"}
      </button>
    </div>
  );
}

function App() {
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  // Estado do usuário autenticado

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("kanbanUser"));
    } catch {
      return null;
    }
  });

  const handleAuth = (data) => {
    setUser(data);
    localStorage.setItem("kanbanUser", JSON.stringify(data));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("kanbanUser");
  };

  // Intercepta requisições para enviar token
  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [user]);


  const [tasks, setTasks] = useState([]);
  // Função para drag & drop
  const onDragEnd = (result) => {
    if (selectionMode) return;
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    const taskId = parseInt(draggableId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = destination.droppableId;
    if (task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };
  const [title, setTitle] = useState("");
  const [historico, setHistorico] = useHistorico();
  const [search, setSearch] = useState("");
  const searchDetails = useMemo(() => parseSearchQuery(search), [search]);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [childInputs, setChildInputs] = useState({});
  const [activeChildParent, setActiveChildParent] = useState(null);
  const [viewFilter, setViewFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('backlog');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [detailEdit, setDetailEdit] = useState(false);
  const [detailForm, setDetailForm] = useState({ description: '', priority: 'media', assignee: '', tags: [], checklist: [] });
  const [newTagValue, setNewTagValue] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id da tarefa a confirmar

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("kanbanDarkMode");
    return saved === null ? false : saved === "true";
  });
  useEffect(() => {
    localStorage.setItem("kanbanDarkMode", darkMode);
  }, [darkMode]);
  const [listMode, setListMode] = useState(() => {
    try {
      const stored = localStorage.getItem('kanbanListMode');
      if (stored !== null) return stored === 'true';
      if (typeof window !== 'undefined') {
        return window.innerWidth < 768;
      }
    } catch {
      /* noop */
    }
    return false;
  });
  useEffect(() => {
    localStorage.setItem('kanbanListMode', listMode);
  }, [listMode]);

  const filteredTasks = useMemo(() => {
    const { filters, textTerms } = searchDetails;
    const normalizedTerms = textTerms.map(term => term.toLowerCase());
    return tasks.filter(task => {
      if (viewFilter === 'parents' && task.parent_id) return false;
      if (viewFilter === 'children' && !task.parent_id) return false;

      const normalizedTags = sanitizeTagsClient(task.tags);

      if (tagFilter.length && !tagFilter.every(tag => normalizedTags.includes(tag))) return false;

      if (filters.status.length && !filters.status.includes(task.status)) return false;

      const priorityValue = priorityOptions.includes(task.priority) ? task.priority : 'media';
      if (filters.priority.length && !filters.priority.includes(priorityValue)) return false;

      if (filters.assignee.length) {
        const assignee = (task.assignee || '').toLowerCase();
        const matchesAssignee = filters.assignee.some(candidate => assignee.includes(candidate));
        if (!matchesAssignee) return false;
      }

      if (filters.code.length) {
        const code = (task.code || '').toLowerCase();
        const matchesCode = filters.code.some(candidate => code.includes(candidate));
        if (!matchesCode) return false;
      }

      if (filters.tag.length && !filters.tag.every(tag => normalizedTags.includes(tag))) return false;

      if (normalizedTerms.length) {
        const searchableContent = [
          task.title,
          task.description,
          task.code,
          task.assignee,
          priorityLabels[priorityValue],
          statusLabels[task.status],
          ...normalizedTags
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchesTerms = normalizedTerms.every(term => searchableContent.includes(term));
        if (!matchesTerms) return false;
      }

      return true;
    });
  }, [tasks, viewFilter, tagFilter, searchDetails]);

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    statusOrder.forEach(status => {
      grouped[status] = [];
    });
    filteredTasks.forEach(task => {
      if (!grouped[task.status]) grouped[task.status] = [];
      grouped[task.status].push(task);
    });
    statusOrder.forEach(status => {
      grouped[status].sort((a, b) => {
        if (!a.parent_id && b.parent_id) return -1;
        if (a.parent_id && !b.parent_id) return 1;
        return a.id - b.id;
      });
    });
    return grouped;
  }, [filteredTasks]);

  const taskById = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  const childrenByParent = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      if (!task.parent_id) return;
      if (!map.has(task.parent_id)) {
        map.set(task.parent_id, []);
      }
      map.get(task.parent_id).push(task);
    });
    return map;
  }, [tasks]);

  const searchSummaryChips = useMemo(() => {
    return searchDetails.tokens.map((token, index) => {
      if (token.type === 'filter') {
        if (token.key === 'status') {
          const label = statusLabels[token.value] || token.value;
          return { key: `${token.key}-${token.value}-${index}`, label: `Status: ${label}`, raw: token.raw };
        }
        if (token.key === 'priority') {
          const label = priorityLabels[token.value] || token.value;
          return { key: `${token.key}-${token.value}-${index}`, label: `Prioridade: ${label}`, raw: token.raw };
        }
        if (token.key === 'tag') {
          return { key: `${token.key}-${token.value}-${index}`, label: `#${token.value}`, raw: token.raw };
        }
        if (token.key === 'assignee') {
          return { key: `${token.key}-${token.value}-${index}`, label: `Responsável: ${token.value}`, raw: token.raw };
        }
        if (token.key === 'code') {
          return { key: `${token.key}-${token.value}-${index}`, label: `Código: ${token.value}`, raw: token.raw };
        }
      }
      return { key: `text-${index}`, label: `Texto: ${token.value}`, raw: token.raw };
    });
  }, [searchDetails]);

  const removeSearchToken = (rawToken) => {
    setSearch(prev => {
      if (!prev.trim()) return prev;
      const parts = prev.trim().split(/\s+/);
      const index = parts.findIndex(part => part.toLowerCase() === rawToken.toLowerCase());
      if (index === -1) return prev;
      parts.splice(index, 1);
      return parts.join(' ');
    });
  };
  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveEdit = (task) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    if (trimmed === task.title.trim()) {
      cancelEdit();
      return;
    }
    axios.put(`/tasks/${task.id}`, { title: trimmed, status: task.status }).then(() => {
      const nowIso = new Date().toISOString();
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: trimmed, updated_at: nowIso } : t));
      setDetailTask(prev => (prev && prev.id === task.id ? { ...prev, title: trimmed, updated_at: nowIso } : prev));
      setEditingId(null);
      setEditingTitle("");
    });
  };

  const handleTitleBlur = (task) => {
    if (editingId === task.id) {
      saveEdit(task);
    }
  };


  const handleDetailFieldChange = (field, value) => {
    setDetailForm(prev => ({ ...prev, [field]: value }));
  };

  const resetDetailForm = () => {
    if (!detailTask) return;
    setDetailForm({
      description: detailTask.description || '',
      priority: detailTask.priority && priorityOptions.includes(detailTask.priority) ? detailTask.priority : 'media',
      assignee: detailTask.assignee || '',
      tags: sanitizeTagsClient(detailTask.tags),
      checklist: sanitizeChecklistClient(detailTask.checklist)
    });
    setDetailEdit(false);
    setNewTagValue('');
    setNewChecklistText('');
  };

  const saveDetailChanges = () => {
    if (!detailTask) return;
    const trimmedDescription = detailForm.description.trim();
    const trimmedAssignee = detailForm.assignee.trim();
    const normalizedPriority = priorityOptions.includes(detailForm.priority) ? detailForm.priority : 'media';
    const normalizedTags = sanitizeTagsClient(detailForm.tags);

    const updates = {};
    if (trimmedDescription !== (detailTask.description || '')) {
      updates.description = trimmedDescription;
    }
    if (trimmedAssignee !== (detailTask.assignee || '')) {
      updates.assignee = trimmedAssignee;
    }
    if (normalizedPriority !== (detailTask.priority || 'media')) {
      updates.priority = normalizedPriority;
    }
    if (JSON.stringify(normalizedTags) !== JSON.stringify(sanitizeTagsClient(detailTask.tags))) {
      updates.tags = normalizedTags;
    }

    if (Object.keys(updates).length === 0) {
      setDetailEdit(false);
      return;
    }

    axios.put(`/tasks/${detailTask.id}`, updates).then(() => {
      const nowIso = new Date().toISOString();
      setTasks(prev => prev.map(t => (
        t.id === detailTask.id ? { ...t, ...updates, updated_at: nowIso } : t
      )));
      setDetailTask(prev => {
        if (!prev) return prev;
        const nextTags = updates.tags ? sanitizeTagsClient(updates.tags) : prev.tags;
        const nextChecklist = updates.checklist ? sanitizeChecklistClient(updates.checklist) : prev.checklist;
        return { ...prev, ...updates, tags: nextTags, checklist: nextChecklist, updated_at: nowIso };
      });
      setDetailForm(prev => ({
        description: updates.description ?? prev.description,
        priority: updates.priority ?? prev.priority,
        assignee: updates.assignee ?? prev.assignee,
        tags: sanitizeTagsClient(updates.tags ?? prev.tags),
        checklist: sanitizeChecklistClient(updates.checklist ?? prev.checklist)
      }));
      setDetailEdit(false);
      setNewTagValue('');
      toast.success('Detalhes atualizados');
    }).catch(err => {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        toast.error(err.response?.data?.error || 'Erro ao atualizar detalhes');
      }
    });
  };

  const handleAddDetailTag = () => {
    const candidate = newTagValue.trim().toLowerCase();
    if (!candidate) return;
    setDetailForm(prev => {
      const current = sanitizeTagsClient(prev.tags);
      if (current.includes(candidate)) return prev;
      return { ...prev, tags: sanitizeTagsClient([...current, candidate]) };
    });
    setNewTagValue('');
  };

  const handleRemoveDetailTag = (tag) => {
    setDetailForm(prev => ({
      ...prev,
      tags: sanitizeTagsClient(prev.tags.filter(t => t !== tag))
    }));
  };

  const handleChecklistToggle = (itemId) => {
    setDetailForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => (item.id === itemId ? { ...item, done: !item.done } : item))
    }));
  };

  const handleChecklistTextChange = (itemId, value) => {
    setDetailForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => (item.id === itemId ? { ...item, text: value } : item))
    }));
  };

  const handleRemoveChecklistItem = (itemId) => {
    setDetailForm(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== itemId)
    }));
  };

  const handleAddChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    setDetailForm(prev => ({
      ...prev,
      checklist: sanitizeChecklistClient([...prev.checklist, { id: createChecklistId(), text: trimmed, done: false }])
    }));
    setNewChecklistText('');
  };


  useEffect(() => {
    if (user?.token) {
      axios.get("/tasks").then(res => setTasks(res.data.map(normalizeTask)));
    }
  }, [user]);

  useEffect(() => {
    if (!detailTask) {
      setDetailHistory([]);
      setHistoryError('');
      setHistoryLoading(false);
      setDetailEdit(false);
      setDetailForm({ description: '', priority: 'media', assignee: '', tags: [], checklist: [] });
      setNewTagValue('');
      setNewChecklistText('');
      return;
    }
    setDetailEdit(false);
    setDetailForm({
      description: detailTask.description || '',
      priority: detailTask.priority && priorityOptions.includes(detailTask.priority) ? detailTask.priority : 'media',
      assignee: detailTask.assignee || '',
      tags: sanitizeTagsClient(detailTask.tags),
      checklist: sanitizeChecklistClient(detailTask.checklist)
    });
    setNewTagValue('');
    setNewChecklistText('');
    setHistoryLoading(true);
    setHistoryError('');
    axios.get('/api/audit')
      .then(res => {
        const filtered = res.data
          .filter(entry => entry.path?.includes(`/tasks/${detailTask.id}`));
        setDetailHistory(filtered);
      })
      .catch(err => {
        if (err.response?.status === 401) handleLogout();
        setHistoryError('Não foi possível carregar o histórico.');
      })
      .finally(() => setHistoryLoading(false));
  }, [detailTask]);

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => tasks.some(t => t.id === id)));
  }, [tasks]);

  useEffect(() => {
    if (!focusedTaskId) return;
    const current = tasks.find(t => t.id === focusedTaskId);
    if (!current) {
      setFocusedTaskId(null);
      return;
    }
    if (viewFilter === 'parents' && current.parent_id) setFocusedTaskId(null);
    if (viewFilter === 'children' && !current.parent_id) setFocusedTaskId(null);
  }, [viewFilter, focusedTaskId, tasks]);

  useEffect(() => {
    const handler = (e) => {
      if (!focusedTaskId) return;
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.classList.contains('kanban-card-input')) {
        // Deixa atalhos para quem está editando usar Enter/Escape padrões já tratados
        return;
      }
      const currentTask = tasks.find(t => t.id === focusedTaskId);
      if (!currentTask) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const currentIndex = statusOrder.indexOf(currentTask.status);
        if (currentIndex === -1) return;
        if (e.key === 'ArrowRight' && currentIndex < statusOrder.length - 1) {
          moveTask(currentTask.id, statusOrder[currentIndex + 1]);
        }
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          moveTask(currentTask.id, statusOrder[currentIndex - 1]);
        }
      }

      if (e.key === 'Enter' && editingId !== currentTask.id) {
        e.preventDefault();
        startEdit(currentTask);
      }

      if (e.key === 'Escape' && editingId === currentTask.id) {
        e.preventDefault();
        cancelEdit();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedTaskId, tasks, editingId]);


  const addTask = () => {
    if (!title.trim()) return;
    axios.post("/tasks", { title }).then(res => {
      setTasks(prev => [...prev, normalizeTask(res.data)]);
      setTitle("");
    }).catch(err => {
      if (err.response?.status === 401) handleLogout();
    });
  };

  const handleChildInputChange = (parentId, value) => {
    setChildInputs(prev => ({ ...prev, [parentId]: value }));
  };

  const startChildInput = (parentId) => {
    setActiveChildParent(parentId);
    setChildInputs(prev => ({ ...prev, [parentId]: prev[parentId] || "" }));
  };

  const cancelChildInput = (parentId) => {
    setActiveChildParent(prev => (prev === parentId ? null : prev));
    setChildInputs(prev => ({ ...prev, [parentId]: "" }));
  };

  const selectedCount = selectedIds.length;

  const toggleSelectionMode = () => {
    if (bulkLoading) return;
    setSelectionMode(prev => {
      const next = !prev;
      if (!next) {
        setSelectedIds([]);
        setBulkLoading(false);
      }
      return next;
    });
  };

  const toggleTaskSelection = (taskId) => {
    if (bulkLoading) return;
    setSelectedIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionMode(false);
    setBulkLoading(false);
    setBulkTargetStatus('backlog');
  };

  const addChildTask = (parent) => {
    const value = (childInputs[parent.id] || "").trim();
    if (!value) return;
    axios.post("/tasks", { title: value, parent_id: parent.id, status: parent.status }).then(res => {
      setTasks(prev => [...prev, normalizeTask(res.data)]);
      setChildInputs(prev => ({ ...prev, [parent.id]: "" }));
      setActiveChildParent(null);
    }).catch(err => {
      if (err.response?.status === 401) handleLogout();
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      }
    });
  };

  const handleBulkMove = () => {
    if (!bulkTargetStatus || selectedIds.length === 0) return;
    setBulkLoading(true);
    const nowIso = new Date().toISOString();
    const affectedChildren = selectedIds
      .map(id => {
        const task = tasks.find(t => t.id === id);
        if (!task || !task.parent_id) return null;
        const parent = tasks.find(t => t.id === task.parent_id);
        return { task, parent };
      })
      .filter(Boolean);
    Promise.all(selectedIds.map(id => axios.put(`/tasks/${id}`, { status: bulkTargetStatus })))
      .then(() => {
        setTasks(prev => prev.map(t => (
          selectedIds.includes(t.id) ? { ...t, status: bulkTargetStatus, updated_at: nowIso } : t
        )));
        setDetailTask(prev => (prev && selectedIds.includes(prev.id)
          ? { ...prev, status: bulkTargetStatus, updated_at: nowIso }
          : prev));
        affectedChildren.forEach(({ task, parent }) => {
          const parentLabel = parent?.code || `Card ${task.parent_id}`;
          if (bulkTargetStatus === 'blocked') {
            toast.warn(`Subtarefa ${task.code} marcada como impedida (${parentLabel})`);
          }
          if (bulkTargetStatus === 'done') {
            toast.success(`Subtarefa ${task.code} concluída (${parentLabel})`);
          }
        });
        toast.success('Cards movidos com sucesso');
        setSelectedIds([]);
        setSelectionMode(false);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          toast.error('Erro ao mover cards selecionados');
        }
      })
      .finally(() => setBulkLoading(false));
  };

  const availableTags = useMemo(() => {
    const set = new Set();
    tasks.forEach(task => {
      sanitizeTagsClient(task.tags).forEach(tag => set.add(tag));
    });
    return Array.from(set).sort();
  }, [tasks]);

  useEffect(() => {
    setTagFilter(prev => {
      const filtered = prev.filter(tag => availableTags.includes(tag));
      if (filtered.length === prev.length && filtered.every((tag, index) => tag === prev[index])) {
        return prev;
      }
      return filtered;
    });
  }, [availableTags]);

  const toggleTagFilter = (tag) => {
    setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const exportStatusCsv = (status) => {
    const tasksInStatus = (tasksByStatus[status] || []);
    if (!tasksInStatus.length) {
      toast.info('Sem cards neste status para exportar.');
      return;
    }
    const statusLabel = statusLabels[status] || status;
    const header = 'Código,Título,Responsável,Prioridade,Tags,Atualizado em,Status\n';
    const rows = tasksInStatus.map(task => {
      const code = (task.code || '').replace(/"/g, '""');
      const title = (task.title || '').replace(/"/g, '""');
      const assignee = (task.assignee || '').replace(/"/g, '""');
      const priorityValue = priorityOptions.includes(task.priority) ? task.priority : 'media';
      const priorityLabel = priorityLabels[priorityValue] || priorityValue;
      const tags = (sanitizeTagsClient(task.tags).join(' ')).replace(/"/g, '""');
      const updated = task.updated_at ? new Date(task.updated_at).toLocaleString('pt-BR') : '';
      const statusValue = statusLabels[task.status] || task.status;
      return `"${code}","${title}","${assignee}","${priorityLabel}","${tags}","${updated}","${statusValue}"`;
    });
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    link.download = `kanban-${status}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exportação de ${statusLabel} concluída!`);
  };

  const renderColumnHeader = (status, tasksInColumn) => (
    <div className="kanban-column-header">
      <div className="kanban-column-header-title">
        <span style={{ fontSize: 22, marginRight: 6 }}>{statusIcons[status]}</span>
        {statusLabels[status]}
        <span className="kanban-column-count">{tasksInColumn.length}</span>
      </div>
      <button
        className="kanban-icon-btn export"
        onClick={() => exportStatusCsv(status)}
        title="Exportar cards desta coluna"
      >
        ⬇️
      </button>
    </div>
  );

  const renderTaskCard = (task, status, options = {}) => {
    const { dragProvided, dragSnapshot, listMode: isListMode } = options;
    const isChild = Boolean(task.parent_id);
    const parentTask = isChild ? taskById.get(task.parent_id) : null;
    const priorityValue = priorityOptions.includes(task.priority) ? task.priority : 'media';
    const cardClasses = `kanban-card ${isChild ? 'kanban-card-child' : 'kanban-card-parent'} priority-${priorityValue} ${task.status === 'blocked' ? 'status-blocked' : ''}`;
    const childOfThis = isChild ? [] : (childrenByParent.get(task.id) || []);
    const doneChildrenCount = isChild ? 0 : childOfThis.filter(t => t.status === 'done').length;
    const progressPct = childOfThis.length ? Math.round((doneChildrenCount / childOfThis.length) * 100) : 0;
    const lastUpdateLabel = formatRelativeTime(task.updated_at);
    const isSelected = selectedIds.includes(task.id);
    const checklistItems = Array.isArray(task.checklist) ? task.checklist : [];
    const doneChecklistItems = checklistItems.filter(item => item.done).length;
    const baseCardStyle = {
      border: isChild ? '1px solid #bbb' : '2px solid #1976d2',
      marginBottom: isListMode ? 12 : 8
    };

    const handleCardClick = (event) => {
      if (selectionMode) {
        event.preventDefault();
        if (!bulkLoading) {
          toggleTaskSelection(task.id);
        }
      } else {
        setFocusedTaskId(task.id);
      }
    };

    const cardProps = {
      className: `${cardClasses} ${focusedTaskId === task.id ? 'kanban-card-focused' : ''} ${isSelected ? 'kanban-card-selected' : ''}`.trim(),
      tabIndex: 0,
      onClick: handleCardClick,
      onFocus: () => setFocusedTaskId(task.id)
    };

    const style = { ...baseCardStyle };

    if (dragSnapshot?.isDragging) {
      style.boxShadow = '0 8px 24px #0005';
      style.background = '#fffde7';
    }

    if (dragProvided) {
      const { style: draggableStyle, ...draggableRest } = dragProvided.draggableProps;
      Object.assign(cardProps, draggableRest);
      if (dragProvided.dragHandleProps) {
        Object.assign(cardProps, dragProvided.dragHandleProps);
      }
      cardProps.ref = dragProvided.innerRef;
      cardProps.style = { ...style, ...draggableStyle };
    } else {
      cardProps.style = style;
    }

    return (
      <div {...cardProps}>
        <div className="kanban-card-meta" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectionMode && (
              <label className="card-select-control" onClick={event => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTaskSelection(task.id)}
                  disabled={bulkLoading}
                />
                <span />
              </label>
            )}
            {!isChild && childOfThis.length > 0 && (
              <>
                <span className="kanban-child-progress">{doneChildrenCount}/{childOfThis.length} subt.</span>
                {progressPct > 0 && (
                  <span className="kanban-child-progress" style={{ background: 'rgba(25,118,210,0.12)', color: '#1565c0' }}>
                    {progressPct}%
                  </span>
                )}
              </>
            )}
            {isChild && (
              <span style={{ background: '#f5f5f5', color: '#555', borderRadius: 10, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                Sub de {parentTask?.code || `#${task.parent_id}`}
              </span>
            )}
            <span className={`priority-pill priority-${priorityValue}`}>
              {priorityLabels[priorityValue] || priorityValue}
            </span>
            {task.status === 'blocked' && (
              <span className="status-pill-blocked">⛔ Impedido</span>
            )}
          </div>
          {!isChild && task.status === 'backlog' && (
            <button
              className="kanban-icon-btn"
              onClick={(event) => { event.stopPropagation(); startChildInput(task.id); }}
              title="Adicionar subtarefa"
            >
              ➕
            </button>
          )}
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="kanban-card-tags">
            {task.tags.map(tag => (
              <span className="kanban-tag" key={`${task.id}-tag-${tag}`}>#{tag}</span>
            ))}
          </div>
        )}
        {!isChild && childOfThis.length > 0 && (
          <div className="kanban-progress">
            <div className="kanban-progress-header">
              <span>{doneChildrenCount}/{childOfThis.length} subtarefas</span>
              <span>{progressPct}%</span>
            </div>
            <div className="kanban-progress-bar">
              <div className="kanban-progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
        <div className="kanban-card-content">
          <span className="kanban-card-code">{task.code}</span>
          {editingId === task.id ? (
            <input
              className="kanban-card-input"
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit(task);
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={() => handleTitleBlur(task)}
              autoFocus
            />
          ) : (
            <span
              className="kanban-card-title"
              onDoubleClick={() => { if (!selectionMode) startEdit(task); }}
              title="Clique duas vezes para editar"
            >
              {task.title}
            </span>
          )}
        </div>
        <div className="kanban-card-actions">
          <button
            className="kanban-icon-btn info"
            onClick={(event) => {
              event.stopPropagation();
              setDetailTask(normalizeTask(task));
            }}
            title="Detalhes do card"
          >
            ℹ️
          </button>
          {status === 'done' && (
            <button
              className="kanban-btn delete"
              onClick={(event) => {
                event.stopPropagation();
                setConfirmDelete(task.id);
              }}
              title="Remover"
            >
              🗑
            </button>
          )}
        </div>
        <div className="kanban-card-footer">
          {checklistItems.length > 0 && (
            <span className="kanban-checklist-summary">Checklist {doneChecklistItems}/{checklistItems.length}</span>
          )}
          <span className="kanban-updated-text">Atualizado {lastUpdateLabel}</span>
        </div>
        {!isChild && activeChildParent === task.id && (
          <div className="kanban-child-input" style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <input
              className="kanban-input"
              style={{ flex: 1, minHeight: 32, fontSize: 14 }}
              placeholder="Descrição da subtarefa"
              value={childInputs[task.id] || ""}
              onChange={e => handleChildInputChange(task.id, e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") addChildTask(task);
                if (e.key === "Escape") cancelChildInput(task.id);
              }}
              onClick={event => event.stopPropagation()}
              autoFocus
            />
            <button
              className="kanban-icon-btn confirm"
              onClick={(event) => { event.stopPropagation(); addChildTask(task); }}
              title="Salvar subtarefa"
            >
              ✔
            </button>
            <button
              className="kanban-icon-btn danger"
              onClick={(event) => { event.stopPropagation(); cancelChildInput(task.id); }}
              title="Cancelar"
            >
              ✖
            </button>
          </div>
        )}
      </div>
    );
  };


  const moveTask = (id, status) => {
    const originalTask = tasks.find(t => t.id === id);
    const originalParent = originalTask?.parent_id ? tasks.find(t => t.id === originalTask.parent_id) : null;
    axios.put(`/tasks/${id}`, { status }).then(() => {
      const nowIso = new Date().toISOString();
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, status, updated_at: nowIso } : t)));
      setDetailTask(prev => (prev && prev.id === id ? { ...prev, status, updated_at: nowIso } : prev));
      if (originalTask?.parent_id && status !== originalTask.status) {
        const parentLabel = originalParent?.code || `Card ${originalTask.parent_id}`;
        if (status === 'blocked') {
          toast.warn(`Subtarefa ${originalTask.code} marcada como impedida (${parentLabel})`);
        }
        if (status === 'done') {
          toast.success(`Subtarefa ${originalTask.code} concluída (${parentLabel})`);
        }
      }
    }).catch(err => {
      if (err.response?.status === 401) handleLogout();
    });
  };


  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const childTasks = tasks.filter(t => t.parent_id === id);
    const completedToArchive = [taskToDelete, ...childTasks].filter(Boolean).filter(t => t.status === "done");
    if (completedToArchive.length > 0) {
      const stamped = completedToArchive.map(t => ({ ...t, deletedAt: new Date().toISOString() }));
      setHistorico(prev => [...stamped, ...prev]);
    }
    axios.delete(`/tasks/${id}`).then(() => {
      setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
      toast.success("Tarefa removida com sucesso!");
    }).catch(err => {
      if (err.response?.status === 401) handleLogout();
    });
    setConfirmDelete(null);
  };

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className={`kanban-bg${darkMode ? " dark-mode" : ""}`}>
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: 'center',
        gap: 12,
        padding: 12,
        position: 'relative',
        zIndex: 10,
        flexWrap: 'wrap',
      }}>
        <span>Olá, <b>{user.username}</b> <span style={{fontSize:13, color:'#888'}}>({user.role === 'admin' ? 'admin' : 'usuário'})</span></span>
        <button onClick={() => setChangePassOpen(true)} style={{ background: "#ff9900", color: "#232f3e", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, position: 'relative', zIndex: 2 }}>Alterar Senha</button>
        {user.role === 'admin' && (
          <>
            <button onClick={() => setAuditOpen(true)} style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, position: 'relative', zIndex: 2 }}>Ver Auditoria</button>
            <button onClick={() => setAdminPanelOpen(true)} style={{ background: "#232f3e", color: "#ffeb3b", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, position: 'relative', zIndex: 2 }}>Administração</button>
          </>
        )}
        <button onClick={handleLogout} style={{ background: "#e53935", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, position: 'relative', zIndex: 2 }}>Sair</button>
        <button
          onClick={() => setDarkMode(d => !d)}
          style={{
            background: darkMode ? '#232f3e' : '#fff',
            color: darkMode ? '#ff9900' : '#232f3e',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 700,
            boxShadow: '0 2px 8px #0002',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: 15,
            marginLeft: 8,
            position: 'relative',
            zIndex: 1,
          }}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
        >
          {darkMode ? '☀️ Modo claro' : '🌙 Modo escuro'}
        </button>
      </div>
      <ChangePasswordForm onClose={() => setChangePassOpen(false)} isOpen={changePassOpen} />
      {user.role === 'admin' && <AuditLogModal isOpen={auditOpen} onRequestClose={() => setAuditOpen(false)} />}
      {user.role === 'admin' && adminPanelOpen && <AdminPanel user={user} onClose={() => setAdminPanelOpen(false)} />}
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="kanban-main-title">CloudOps Tracker – Minhas Atividades</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <input
          className="kanban-input"
          style={{ maxWidth: 340, minWidth: 180 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tarefa..."
          title="Dicas: status:doing prioridade:alta tag:frontend código:OPS-1"
        />
        {search && (
          <button className="kanban-btn secondary" onClick={() => setSearch("")}>
            Limpar busca
          </button>
        )}
        <div className="view-filter">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'parents', label: 'Só pais' },
            { key: 'children', label: 'Só subtarefas' }
          ].map(option => (
            <button
              key={option.key}
              className={`view-filter-btn ${viewFilter === option.key ? 'active' : ''}`}
              onClick={() => setViewFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          className={`kanban-btn secondary ${listMode ? 'active' : ''}`}
          onClick={() => setListMode(prev => !prev)}
          title={listMode ? 'Voltar ao modo coluna' : 'Ativar modo lista'}
        >
          {listMode ? 'Modo colunas' : 'Modo lista'}
        </button>
        {availableTags.length > 0 && (
          <div className="tag-filter">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-btn ${tagFilter.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTagFilter(tag)}
              >
                #{tag}
              </button>
            ))}
            {tagFilter.length > 0 && (
              <button className="tag-filter-btn clear" onClick={() => setTagFilter([])}>Limpar</button>
            )}
          </div>
        )}
        <button
          className={`kanban-btn selection-toggle ${selectionMode ? 'active' : ''}`}
          onClick={toggleSelectionMode}
        >
          {selectionMode ? `Encerrar seleção (${selectedCount})` : 'Selecionar cards'}
        </button>
      </div>
      {searchSummaryChips.length > 0 && (
        <div className="search-summary">
          {searchSummaryChips.map(chip => (
            <button
              key={chip.key}
              className="search-chip"
              onClick={() => removeSearchToken(chip.raw)}
              title="Remover filtro da busca"
            >
              {chip.label} ✕
            </button>
          ))}
        </div>
      )}
      {selectionMode && (
        <div className="bulk-actions">
          <span>{selectedCount} selecionado(s)</span>
          <select
            value={bulkTargetStatus}
            onChange={e => setBulkTargetStatus(e.target.value)}
            disabled={bulkLoading}
          >
            {statusOrder.map(statusKey => (
              <option key={statusKey} value={statusKey}>{statusLabels[statusKey]}</option>
            ))}
          </select>
          <button
            className="kanban-btn"
            onClick={handleBulkMove}
            disabled={selectedCount === 0 || bulkLoading}
          >
            {bulkLoading ? 'Movendo...' : 'Mover selecionados'}
          </button>
          <button className="kanban-btn secondary" onClick={clearSelection} disabled={bulkLoading}>Cancelar</button>
        </div>
      )}
      {listMode ? (
        <div className="kanban-list-view">
          {statusOrder.map(status => {
            const tasksInColumn = tasksByStatus[status] || [];
            return (
              <section className="kanban-list-section" key={status}>
                {renderColumnHeader(status, tasksInColumn)}
                {status === 'backlog' && (
                  <div className="kanban-input-row kanban-input-row-backlog">
                    <input
                      className="kanban-input"
                      value={title}
                      placeholder="Nova tarefa..."
                      onChange={e => setTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                    />
                    <button className="kanban-btn" onClick={addTask}>
                      Adicionar
                    </button>
                  </div>
                )}
                <div className="kanban-list-cards">
                  {tasksInColumn.length === 0 ? (
                    <div className="kanban-empty">Nenhum card aqui agora.</div>
                  ) : (
                    tasksInColumn.map(task => (
                      <div className="kanban-list-card" key={task.id}>
                        {renderTaskCard(task, status, { listMode: true })}
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {statusOrder.map(status => {
              const tasksInColumn = tasksByStatus[status] || [];
              return (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`kanban-column ${status}`}
                      style={{ background: snapshot.isDraggingOver ? '#ffe082' : undefined }}
                    >
                      {renderColumnHeader(status, tasksInColumn)}
                      {status === 'backlog' && (
                        <div className="kanban-input-row kanban-input-row-backlog">
                          <input
                            className="kanban-input"
                            value={title}
                            placeholder="Nova tarefa..."
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                          />
                          <button className="kanban-btn" onClick={addTask}>
                            Adicionar
                          </button>
                        </div>
                      )}
                      {tasksInColumn.length === 0 ? (
                        <div className="kanban-empty">Nenhum card aqui agora.</div>
                      ) : (
                        tasksInColumn.map((task, idx) => (
                          <Draggable
                            draggableId={String(task.id)}
                            index={idx}
                            key={task.id}
                            isDragDisabled={selectionMode}
                          >
                            {(dragProvided, dragSnapshot) => (
                              renderTaskCard(task, status, { dragProvided, dragSnapshot })
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}
      <div className="historico-lembrete-wrapper">
        <Lembrete />
        {historico.length > 0 && (
          <div className="historico-box">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6}}>
              <h2 className="historico-title" style={{margin: 0}}>Histórico de Atividades Concluídas Removidas</h2>
              <button
                className="kanban-btn"
                style={{padding: '4px 10px', fontSize: 13, fontWeight: 600}}
                onClick={() => exportHistoricoCSV(historico)}
                title="Exportar CSV"
              >
                ⬇️ Exportar
              </button>
            </div>
            <ul className="historico-list">
              {historico.map((t, i) => (
                <li key={t.id + '-' + (t.deletedAt || i)} className="historico-item">
                  <span className="historico-task-title">✅ {t.title}</span>
                  <span className="historico-task-date">{t.deletedAt ? new Date(t.deletedAt).toLocaleString() : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Modal de confirmação de remoção */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 280, boxShadow: '0 4px 24px #0003', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 18 }}>Remover atividade concluída?</div>
            <div style={{ marginBottom: 22, color: '#232f3e' }}>
              Tem certeza que deseja remover a tarefa:<br/>
              <span style={{ color: '#388e3c', fontWeight: 600 }}>
                {tasks.find(t => t.id === confirmDelete)?.title}
              </span>
            </div>
            <button className="kanban-btn delete" style={{ marginRight: 12 }} onClick={() => deleteTask(confirmDelete)}>Remover</button>
            <button className="kanban-btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
          </div>
        </div>
      )}
      {detailTask && (
        <Modal
          isOpen={!!detailTask}
          onRequestClose={() => setDetailTask(null)}
          contentLabel="Detalhes da tarefa"
          style={{ content: { maxWidth: 480, margin: '80px auto', borderRadius: 12, padding: 0 } }}
        >
          <div className="detail-modal-header">
            <h2>{detailTask.code}</h2>
            <div className="detail-header-actions">
              {detailEdit ? (
                <>
                  <button className="kanban-icon-btn confirm" onClick={saveDetailChanges} title="Salvar alterações">✔</button>
                  <button className="kanban-icon-btn info" onClick={resetDetailForm} title="Cancelar edição">↩</button>
                </>
              ) : (
                <button className="kanban-icon-btn info" onClick={() => setDetailEdit(true)} title="Editar detalhes">✏️</button>
              )}
              <button className="kanban-icon-btn danger" onClick={() => setDetailTask(null)} title="Fechar">✖</button>
            </div>
          </div>
          <div className="detail-modal-body">
            <div className="detail-row"><span>Nome:</span><strong>{detailTask.title}</strong></div>
            <div className="detail-row"><span>Status:</span><strong>{statusLabels[detailTask.status]}</strong></div>
            <div className="detail-row">
              <span>Prioridade:</span>
              {detailEdit ? (
                <select
                  className="detail-select"
                  value={detailForm.priority}
                  onChange={e => handleDetailFieldChange('priority', e.target.value)}
                >
                  {priorityOptions.map(opt => (
                    <option key={opt} value={opt}>{priorityLabels[opt]}</option>
                  ))}
                </select>
              ) : (
                <strong>{priorityLabels[detailTask.priority] || 'não definida'}</strong>
              )}
            </div>
            <div className="detail-row">
              <span>Responsável:</span>
              {detailEdit ? (
                <input
                  className="detail-input"
                  value={detailForm.assignee}
                  onChange={e => handleDetailFieldChange('assignee', e.target.value)}
                  placeholder="Nome do responsável"
                />
              ) : (
                <strong>{detailTask.assignee || '—'}</strong>
              )}
            </div>
            {detailTask.parent_id && (
              <div className="detail-row"><span>Card pai:</span><strong>{tasks.find(t => t.id === detailTask.parent_id)?.code || detailTask.parent_id}</strong></div>
            )}
            <div className="detail-block">
              <span>Etiquetas</span>
              {detailEdit ? (
                <div className="detail-tags-editor">
                  <div className="detail-tags-list">
                    {detailForm.tags.length === 0 && <span className="detail-tags-empty">Nenhuma etiqueta</span>}
                    {detailForm.tags.map(tag => (
                      <span className="detail-tag-chip" key={`detail-tag-${tag}`}>
                        #{tag}
                        <button onClick={() => handleRemoveDetailTag(tag)} title="Remover etiqueta">✖</button>
                      </span>
                    ))}
                  </div>
                  <div className="detail-tag-input">
                    <input
                      value={newTagValue}
                      onChange={e => setNewTagValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDetailTag();
                        }
                      }}
                      placeholder="Digite e aperte Enter"
                    />
                    <button className="kanban-btn" onClick={handleAddDetailTag}>
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : detailTask.tags && detailTask.tags.length > 0 ? (
                <div className="detail-tags-view">
                  {detailTask.tags.map(tag => (
                    <span className="detail-tag-chip" key={`detail-view-tag-${tag}`}>#{tag}</span>
                  ))}
                </div>
              ) : (
                <p>Sem etiquetas.</p>
              )}
            </div>
            <div className="detail-block">
              <span>Checklist</span>
              {detailEdit ? (
                <div className="detail-checklist-editor">
                  {detailForm.checklist.length === 0 && <span className="detail-tags-empty">Nenhum item</span>}
                  <div className="detail-checklist-list">
                    {detailForm.checklist.map(item => (
                      <div className="detail-checklist-item" key={item.id}>
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleChecklistToggle(item.id)}
                        />
                        <input
                          className="detail-checklist-text"
                          value={item.text}
                          onChange={e => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Descrição do item"
                        />
                        <button className="detail-checklist-remove" onClick={() => handleRemoveChecklistItem(item.id)} title="Remover item">✖</button>
                      </div>
                    ))}
                  </div>
                  <div className="detail-checklist-add">
                    <input
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      placeholder="Adicionar novo item"
                    />
                    <button className="kanban-btn" onClick={handleAddChecklistItem}>Adicionar</button>
                  </div>
                </div>
              ) : detailTask.checklist && detailTask.checklist.length > 0 ? (
                <ul className="detail-checklist-view">
                  {detailTask.checklist.map(item => (
                    <li key={`detail-view-check-${item.id}`}>
                      <input type="checkbox" checked={item.done} readOnly />
                      <span className={item.done ? 'done' : ''}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Checklist vazio.</p>
              )}
            </div>
            <div className="detail-block">
              <span>Descrição</span>
              {detailEdit ? (
                <textarea
                  className="detail-textarea"
                  rows={4}
                  value={detailForm.description}
                  onChange={e => handleDetailFieldChange('description', e.target.value)}
                  placeholder="Adicionar descrição detalhada do card"
                />
              ) : (
                <p>{detailTask.description ? detailTask.description : 'Sem descrição cadastrada.'}</p>
              )}
            </div>
            {!detailTask.parent_id && (
              <div className="detail-block">
                <span>Subtarefas</span>
                {tasks.filter(t => t.parent_id === detailTask.id).length === 0 ? (
                  <p>Sem subtarefas vinculadas.</p>
                ) : (
                  <ul>
                    {tasks.filter(t => t.parent_id === detailTask.id).map(child => (
                      <li key={child.id}>{child.code} · {statusLabels[child.status]}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="detail-block">
              <span>Histórico recente</span>
              {historyLoading ? (
                <p>Carregando...</p>
              ) : historyError ? (
                <p>{historyError}</p>
              ) : detailHistory.length === 0 ? (
                <p>Nenhuma movimentação registrada para este card nos últimos eventos.</p>
              ) : (
                <ul className="detail-history">
                  {detailHistory.slice(0, 10).map(entry => (
                    <li key={`${entry.id}-${entry.date}`}>
                      <strong>{entry.action}</strong> • {entry.method} • {new Date(entry.date).toLocaleString('pt-BR')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
