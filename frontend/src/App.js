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
function formatDurationShort(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    const minPart = minutes > 0 ? ` ${minutes}m` : '';
    return `${hours}h${minPart}`;
  }
  if (minutes > 0) {
    const secPart = secs > 0 ? ` ${secs}s` : '';
    return `${minutes}m${secPart}`;
  }
  return `${secs}s`;
}

function formatDurationHMS(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const secs = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

// Função utilitária para exportar CSV
function exportHistoricoCSV(historico) {
  if (!Array.isArray(historico) || historico.length === 0) return;
  const header = 'Código,Título,Status Original,Prioridade,Dono do Card,Responsável,Tags,Removido em,Removido por,Restaurado em,Restaurado por,Tempo Gasto (hh:mm:ss)\n';
  const rows = historico.map(item => {
    const safe = (value = '') => String(value || '').replace(/"/g, '""');
    const tags = Array.isArray(item.tags) ? item.tags.join(' | ') : '';
    const deletedAt = item.deleted_at ? new Date(item.deleted_at).toLocaleString() : '';
    const restoredAt = item.restored_at ? new Date(item.restored_at).toLocaleString() : '';
    const duration = formatDurationHMS(item.tracked_seconds || 0);
    return `"${safe(item.code)}","${safe(item.title)}","${safe(item.original_status)}","${safe(item.priority)}","${safe(item.owner_username)}","${safe(item.assignee)}","${safe(tags)}","${safe(deletedAt)}","${safe(item.deleted_by)}","${safe(restoredAt)}","${safe(item.restored_by)}","${safe(duration)}"`;
  });
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Histórico de tarefas removidas do concluído
function useHistoricoRecords({ user, isAdmin, handleLogout }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(() => ({ ...HISTORICO_DEFAULT_FILTERS }));
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const buildParams = useCallback((input) => {
    const params = {};
    if (input.search && input.search.trim()) {
      params.search = input.search.trim();
    }
    if (input.start) {
      params.start = input.start;
    }
    if (input.end) {
      params.end = input.end;
    }
    if (isAdmin) {
      if (input.owner && input.owner !== 'all') {
        params.owner = input.owner;
      }
    }
    params.includeRestored = input.includeRestored ? 'true' : 'false';
    return params;
  }, [isAdmin]);

  const fetchHistorico = useCallback((customFilters) => {
    if (!user?.token) {
      setHistorico([]);
      return;
    }
    const effective = customFilters || filtersRef.current;
    setLoading(true);
    setError('');
    axios.get('/tasks/archive', { params: buildParams(effective) })
      .then(res => {
        const payload = Array.isArray(res.data) ? res.data.map(normalizeArchiveEntry) : [];
        setHistorico(payload);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          setError(err.response?.data?.error || 'Erro ao carregar histórico');
        }
      })
      .finally(() => setLoading(false));
  }, [user?.token, buildParams, handleLogout]);

  useEffect(() => {
    if (!user?.token) {
      setHistorico([]);
      setLoading(false);
      setError('');
      return;
    }
    fetchHistorico(filters);
  }, [user?.token, filters, fetchHistorico]);

  const refreshHistorico = useCallback(() => {
    fetchHistorico(filtersRef.current);
  }, [fetchHistorico]);

  return {
    historico,
    historicoLoading: loading,
    historicoError: error,
    historicoFilters: filters,
    setHistoricoFilters: setFilters,
    refreshHistorico,
    fetchHistorico
  };
}

function RemindersPanel({ user, handleLogout }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReminders = useCallback(() => {
    if (!user?.token) {
      setReminders([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    axios.get('/reminders', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => {
        const payload = Array.isArray(res.data) ? res.data : [];
        setReminders(payload);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          setError(err.response?.data?.error || 'Erro ao carregar lembretes');
        }
      })
      .finally(() => setLoading(false));
  }, [user?.token, handleLogout]);

  useEffect(() => {
    if (!user?.token) return;
    fetchReminders();
  }, [fetchReminders, user?.token]);

  const addReminder = () => {
    const text = newText.trim();
    if (!text) {
      toast.warn('Digite algo para salvar o lembrete');
      return;
    }
    setSaving(true);
    if (!user?.token) {
      toast.warn('Faça login novamente para salvar o lembrete');
      return;
    }
    axios.post('/reminders', { text }, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => {
        const reminder = res.data;
        setReminders(prev => [reminder, ...prev]);
        setNewText('');
        toast.success('Lembrete salvo!');
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          toast.error(err.response?.data?.error || 'Erro ao salvar lembrete');
        }
      })
      .finally(() => setSaving(false));
  };

  const toggleReminder = (reminder) => {
    if (!user?.token) {
      toast.warn('Sessão expirada, faça login novamente');
      return;
    }
    axios.put(`/reminders/${reminder.id}`, { done: !reminder.done }, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => {
        const updated = res.data;
        setReminders(prev => prev.map(item => item.id === updated.id ? updated : item));
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          toast.error(err.response?.data?.error || 'Erro ao atualizar lembrete');
        }
      });
  };

  const editReminder = (reminder) => {
    const input = window.prompt('Editar lembrete', reminder.text);
    if (input === null) return;
    const text = input.trim();
    if (!text) {
      toast.warn('O texto do lembrete não pode ficar vazio');
      return;
    }
    if (!user?.token) {
      toast.warn('Sessão expirada, faça login novamente');
      return;
    }
    axios.put(`/reminders/${reminder.id}`, { text }, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(res => {
        const updated = res.data;
        setReminders(prev => prev.map(item => item.id === updated.id ? updated : item));
        toast.success('Lembrete atualizado');
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          toast.error(err.response?.data?.error || 'Erro ao atualizar lembrete');
        }
      });
  };

  const removeReminder = (reminderId) => {
    if (!user?.token) {
      toast.warn('Sessão expirada, faça login novamente');
      return;
    }
    axios.delete(`/reminders/${reminderId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(() => {
        setReminders(prev => prev.filter(item => item.id !== reminderId));
        toast.success('Lembrete removido');
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        } else {
          toast.error(err.response?.data?.error || 'Erro ao remover lembrete');
        }
      });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      addReminder();
    }
  };

  return (
    <div className="lembrete-box">
      <div className="lembrete-header">
        <label className="lembrete-label">Lembretes rápidos</label>
        <button
          className="lembrete-refresh"
          onClick={fetchReminders}
          title="Recarregar lembretes"
          disabled={loading}
        >
          ↻
        </button>
      </div>
      <div className="lembrete-input-row">
        <textarea
          className="lembrete-textarea"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar novo lembrete..."
          rows={2}
          disabled={saving}
        />
        <button className="kanban-btn" onClick={addReminder} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
      {error && <div className="lembrete-error">{error}</div>}
      {loading ? (
        <div className="lembrete-empty">Carregando lembretes...</div>
      ) : reminders.length === 0 ? (
        <div className="lembrete-empty">Nenhum lembrete por aqui ainda.</div>
      ) : (
        <ul className="lembrete-list">
          {reminders.map(reminder => (
            <li key={reminder.id} className={`lembrete-item ${reminder.done ? 'done' : ''}`}>
              <label className="lembrete-checkbox">
                <input
                  type="checkbox"
                  checked={reminder.done}
                  onChange={() => toggleReminder(reminder)}
                />
                <span />
              </label>
              <div className="lembrete-content">
                <button className="lembrete-text" onClick={() => editReminder(reminder)}>
                  {reminder.text}
                </button>
                <span className="lembrete-timestamp">
                  {reminder.updated_at ? formatRelativeTime(reminder.updated_at) : formatRelativeTime(reminder.created_at)}
                </span>
              </div>
              <button className="lembrete-remove" onClick={() => removeReminder(reminder.id)} title="Remover lembrete">✖</button>
            </li>
          ))}
        </ul>
      )}
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
const HISTORICO_DEFAULT_FILTERS = { search: '', owner: 'all', start: '', end: '', includeRestored: false };

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
  const ownerId = raw.owner_id !== undefined && raw.owner_id !== null ? Number(raw.owner_id) : null;
  const ownerName = raw.owner_username || raw.ownerName || null;
  let regressionReason = raw.regression_reason ?? null;
  if (typeof regressionReason === 'string') {
    regressionReason = regressionReason.trim();
    if (!regressionReason) {
      regressionReason = null;
    }
  }
  const regressionReasonAt = raw.regression_reason_at || null;
  const trackedSeconds = Number(raw.tracked_seconds) || 0;
  let timerStartedAt = raw.timer_started_at || null;
  if (timerStartedAt) {
    const parsed = new Date(timerStartedAt);
    if (Number.isNaN(parsed.getTime())) {
      timerStartedAt = null;
    } else {
      timerStartedAt = parsed.toISOString();
    }
  }
  return {
    ...raw,
    tags,
    checklist,
    updated_at: raw.updated_at || raw.updatedAt || null,
    owner_id: ownerId,
    owner_username: ownerName,
    regression_reason: regressionReason,
    regression_reason_at: regressionReasonAt,
    tracked_seconds: trackedSeconds,
    timer_started_at: timerStartedAt
  };
}

function normalizeArchiveEntry(raw = {}) {
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
    owner_id: raw.owner_id !== undefined && raw.owner_id !== null ? Number(raw.owner_id) : null,
    restored_task_id: raw.restored_task_id !== undefined && raw.restored_task_id !== null ? Number(raw.restored_task_id) : null,
    tags,
    checklist,
    deleted_at: raw.deleted_at || null,
    restored_at: raw.restored_at || null,
    tracked_seconds: Number(raw.tracked_seconds) || 0
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
      const stored = JSON.parse(localStorage.getItem("kanbanUser"));
      if (stored && stored.id !== undefined && stored.id !== null) {
        stored.id = Number(stored.id);
      }
      return stored;
    } catch {
      return null;
    }
  });

  const isAdmin = user?.role === 'admin';

  const handleAuth = (data) => {
    const normalized = data && data.id !== undefined && data.id !== null
      ? { ...data, id: Number(data.id) }
      : data;
    setUser(normalized);
    localStorage.setItem("kanbanUser", JSON.stringify(normalized));
  };

const handleLogout = useCallback(() => {
  setUser(null);
  localStorage.removeItem("kanbanUser");
  setOwnerFilter('all');
  setAdminUsers([]);
  setTasks([]);
}, []);

  // Intercepta requisições para enviar token
  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [user]);

  useEffect(() => {
    if (!isAdmin || !user?.token) {
      setAdminUsers([]);
      setOwnerFilter('all');
      return;
    }
    axios.get('/api/users')
      .then(res => setAdminUsers(res.data || []))
      .catch(err => {
        if (err.response?.status === 401) handleLogout();
      });
  }, [isAdmin, user]);


  const [tasks, setTasks] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('all');
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
  const {
    historico,
    historicoLoading,
    historicoError,
    historicoFilters,
    setHistoricoFilters,
    refreshHistorico
  } = useHistoricoRecords({ user, isAdmin, handleLogout });
  const [historicoFilterForm, setHistoricoFilterForm] = useState(() => ({ ...historicoFilters }));
  useEffect(() => {
    setHistoricoFilterForm({ ...historicoFilters });
  }, [historicoFilters]);
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
  const [detailForm, setDetailForm] = useState({ description: '', priority: 'media', assignee: '', tags: [], checklist: [], owner_id: null });
  const [newTagValue, setNewTagValue] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id da tarefa a confirmar
  const [timerBusyIds, setTimerBusyIds] = useState(() => new Set());
  const [nowTick, setNowTick] = useState(() => Date.now());

  const computeElapsedSeconds = useCallback((task) => {
    if (!task) return 0;
    const base = Number(task.tracked_seconds) || 0;
    if (!task.timer_started_at) return base;
    const startedAt = new Date(task.timer_started_at).getTime();
    if (Number.isNaN(startedAt)) return base;
    const diff = Math.max(0, Math.floor((nowTick - startedAt) / 1000));
    return base + diff;
  }, [nowTick]);

  const detailElapsedSeconds = detailTask ? computeElapsedSeconds(detailTask) : 0;
  const detailTimerRunning = detailTask ? Boolean(detailTask.timer_started_at) : false;
  const detailTimerBusy = detailTask ? timerBusyIds.has(detailTask.id) : false;
  const detailCanStop = detailTimerRunning || detailElapsedSeconds > 0;
  const detailTimerFullLabel = formatDurationHMS(detailElapsedSeconds);

  const currentUserId = user?.id !== undefined && user?.id !== null ? Number(user.id) : null;

  const ownerNameById = useMemo(() => {
    const entries = new Map();
    if (currentUserId && user?.username) {
      entries.set(currentUserId, user.username);
    }
    adminUsers.forEach(u => {
      entries.set(Number(u.id), u.username);
    });
    return entries;
  }, [adminUsers, currentUserId, user?.username]);

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
      checklist: sanitizeChecklistClient(detailTask.checklist),
      owner_id: detailTask.owner_id ?? null
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
    const normalizedChecklist = sanitizeChecklistClient(detailForm.checklist);
    const normalizedOwner = detailForm.owner_id === null || detailForm.owner_id === undefined
      ? null
      : Number(detailForm.owner_id);
    const currentOwner = detailTask.owner_id === undefined || detailTask.owner_id === null
      ? null
      : Number(detailTask.owner_id);

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
    if (JSON.stringify(normalizedChecklist) !== JSON.stringify(sanitizeChecklistClient(detailTask.checklist))) {
      updates.checklist = normalizedChecklist;
    }
    if ((normalizedOwner ?? null) !== (currentOwner ?? null)) {
      updates.owner_id = normalizedOwner;
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
        const nextOwner = updates.owner_id !== undefined ? updates.owner_id : prev.owner_id;
        return { ...prev, ...updates, tags: nextTags, checklist: nextChecklist, owner_id: nextOwner, updated_at: nowIso };
      });
      setDetailForm(prev => ({
        description: updates.description ?? prev.description,
        priority: updates.priority ?? prev.priority,
        assignee: updates.assignee ?? prev.assignee,
        tags: sanitizeTagsClient(updates.tags ?? prev.tags),
        checklist: sanitizeChecklistClient(updates.checklist ?? prev.checklist),
        owner_id: updates.owner_id ?? prev.owner_id
      }));
      setDetailEdit(false);
      setNewTagValue('');
      setNewChecklistText('');
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

  const setTimerBusy = useCallback((taskId, busy) => {
    setTimerBusyIds(prev => {
      const next = new Set(prev);
      if (busy) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const applyTaskUpdate = useCallback((updatedTask) => {
    const normalized = normalizeTask(updatedTask);
    setTasks(prev => {
      let replaced = false;
      const next = prev.map(task => {
        if (task.id !== normalized.id) return task;
        replaced = true;
        return normalized;
      });
      return replaced ? next : prev;
    });
    setDetailTask(prev => (prev && prev.id === normalized.id ? normalized : prev));
  }, [setTasks, setDetailTask]);

  const startTaskTimer = useCallback((taskId) => {
    if (timerBusyIds.has(taskId)) return;
    setTimerBusy(taskId, true);
    axios.post(`/tasks/${taskId}/timer/start`)
      .then(res => {
        applyTaskUpdate(res.data);
        setNowTick(Date.now());
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
          return;
        }
        toast.error(err.response?.data?.error || 'Não foi possível iniciar o timer');
      })
      .finally(() => {
        setTimerBusy(taskId, false);
      });
  }, [applyTaskUpdate, handleLogout, setTimerBusy, timerBusyIds]);

  const pauseTaskTimer = useCallback((taskId) => {
    if (timerBusyIds.has(taskId)) return;
    setTimerBusy(taskId, true);
    axios.post(`/tasks/${taskId}/timer/pause`)
      .then(res => {
        applyTaskUpdate(res.data);
        setNowTick(Date.now());
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
          return;
        }
        toast.error(err.response?.data?.error || 'Não foi possível pausar o timer');
      })
      .finally(() => {
        setTimerBusy(taskId, false);
      });
  }, [applyTaskUpdate, handleLogout, setTimerBusy, timerBusyIds]);

  const stopTaskTimer = useCallback((taskId) => {
    if (timerBusyIds.has(taskId)) return;
    setTimerBusy(taskId, true);
    axios.post(`/tasks/${taskId}/timer/stop`)
      .then(res => {
        applyTaskUpdate(res.data);
        setNowTick(Date.now());
      })
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
          return;
        }
        toast.error(err.response?.data?.error || 'Não foi possível parar o timer');
      })
      .finally(() => {
        setTimerBusy(taskId, false);
      });
  }, [applyTaskUpdate, handleLogout, setTimerBusy, timerBusyIds]);


  const fetchTasks = useCallback(() => {
    if (!user?.token) return;
    const params = {};
    if (isAdmin && ownerFilter !== 'all') {
      params.owner = ownerFilter;
    }
    axios.get("/tasks", { params })
      .then(res => setTasks(res.data.map(normalizeTask)))
      .catch(err => {
        if (err.response?.status === 401) {
          handleLogout();
        }
      });
  }, [user, isAdmin, ownerFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const hasRunning = tasks.some(task => task.timer_started_at);
    if (!hasRunning) return;
    setNowTick(Date.now());
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    setTimerBusyIds(prev => {
      const next = new Set();
      tasks.forEach(task => {
        if (prev.has(task.id)) {
          next.add(task.id);
        }
      });
      if (next.size === prev.size) {
        let identical = true;
        prev.forEach(id => {
          if (!next.has(id)) {
            identical = false;
          }
        });
        if (identical) {
          return prev;
        }
      }
      return next;
    });
  }, [tasks]);

  useEffect(() => {
    if (!detailTask) {
      setDetailHistory([]);
      setHistoryError('');
      setHistoryLoading(false);
      setDetailEdit(false);
      setDetailForm({ description: '', priority: 'media', assignee: '', tags: [], checklist: [], owner_id: null });
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
      checklist: sanitizeChecklistClient(detailTask.checklist),
      owner_id: detailTask.owner_id ?? null
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
    const targetIndex = statusOrder.indexOf(bulkTargetStatus);
    if (targetIndex === -1) {
      toast.error('Status destino inválido.');
      return;
    }

    const selectedTasks = selectedIds
      .map(id => tasks.find(t => t.id === id))
      .filter(Boolean);

    const regressionTasks = selectedTasks.filter(task => {
      const currentIndex = statusOrder.indexOf(task.status);
      return currentIndex !== -1 && targetIndex < currentIndex;
    });

    let regressionReason = null;
    if (regressionTasks.length > 0) {
      const firstTask = regressionTasks[0];
      const message = regressionTasks.length === 1
        ? `Informe o motivo para retornar o card ${firstTask.code} (${statusLabels[firstTask.status]}) para ${statusLabels[bulkTargetStatus]}:`
        : `Informe o motivo para retornar ${regressionTasks.length} cards para ${statusLabels[bulkTargetStatus]}:`;
      const input = window.prompt(message);
      if (input === null) {
        return;
      }
      regressionReason = input.trim();
      if (!regressionReason) {
        toast.warn('O motivo é obrigatório para mover cards para um status anterior.');
        return;
      }
    }

    setBulkLoading(true);
    const nowIso = new Date().toISOString();
    const regressionIds = new Set(regressionTasks.map(task => task.id));
    const affectedChildren = selectedTasks
      .filter(task => task.parent_id)
      .map(task => ({
        task,
        parent: tasks.find(t => t.id === task.parent_id)
      }));

    Promise.all(selectedIds.map(id => {
      const payload = { status: bulkTargetStatus };
      if (regressionReason && regressionIds.has(id)) {
        payload.regression_reason = regressionReason;
      }
      return axios.put(`/tasks/${id}`, payload);
    }))
      .then(() => {
        setTasks(prev => prev.map(t => {
          if (!selectedIds.includes(t.id)) return t;
          const extra = regressionReason && regressionIds.has(t.id)
            ? { regression_reason: regressionReason, regression_reason_at: nowIso }
            : {};
          return { ...t, status: bulkTargetStatus, updated_at: nowIso, ...extra };
        }));
        setDetailTask(prev => {
          if (!prev || !selectedIds.includes(prev.id)) return prev;
          const extra = regressionReason && regressionIds.has(prev.id)
            ? { regression_reason: regressionReason, regression_reason_at: nowIso }
            : {};
          return { ...prev, status: bulkTargetStatus, updated_at: nowIso, ...extra };
        });
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
          toast.error(err.response?.data?.error || 'Erro ao mover cards selecionados');
        }
      })
      .finally(() => setBulkLoading(false));
  };

  const handleHistoricoFormChange = (field, value) => {
    setHistoricoFilterForm(prev => ({ ...prev, [field]: value }));
  };

  const applyHistoricoFilters = () => {
    const payload = { ...historicoFilterForm };
    if (!isAdmin) {
      payload.owner = 'all';
    }
    setHistoricoFilters({ ...payload });
  };

  const clearHistoricoFilters = () => {
    const defaults = { ...HISTORICO_DEFAULT_FILTERS };
    if (!isAdmin) {
      defaults.owner = 'all';
    }
    setHistoricoFilterForm(defaults);
    setHistoricoFilters(defaults);
  };

  const restoreArchiveEntry = (archiveId) => {
    if (!archiveId) return;
    axios.post(`/tasks/archive/${archiveId}/restore`).then(() => {
      toast.success('Card restaurado a partir do histórico');
      fetchTasks();
      refreshHistorico();
    }).catch(err => {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        toast.error(err.response?.data?.error || 'Erro ao restaurar card');
      }
    });
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
    const ownerId = task.owner_id === undefined || task.owner_id === null ? null : Number(task.owner_id);
    const ownerName = ownerId === null
      ? 'Sem responsável'
      : (ownerNameById.get(ownerId) || task.owner_username || `Usuário ${ownerId}`);
    const displayOwnerName = ownerId !== null && ownerId === currentUserId ? 'Você' : ownerName;
    const showOwnerBadge = isAdmin || (currentUserId !== null && ownerId !== null && ownerId !== currentUserId);
    const timerBusy = timerBusyIds.has(task.id);
    const elapsedSeconds = computeElapsedSeconds(task);
    const timerRunning = Boolean(task.timer_started_at);
    const timerLabel = formatDurationShort(elapsedSeconds);
    const timerFullLabel = formatDurationHMS(elapsedSeconds);
    const canStopTimer = timerRunning || elapsedSeconds > 0;

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
            {showOwnerBadge && (
              <span className="kanban-owner-pill" title={`Responsável: ${displayOwnerName}`}>
                👤 {displayOwnerName}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6 }}>
          <span
            title={`Total registrado: ${timerFullLabel}`}
            style={{ fontSize: 12, fontWeight: 600, color: timerRunning ? '#1565c0' : '#607d8b' }}
          >
            ⏱️ {timerLabel}
            {timerRunning ? ' • rodando' : ''}
            {timerBusy ? ' • salvando...' : ''}
          </span>
          {status !== 'done' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="kanban-icon-btn confirm"
                onClick={(event) => {
                  event.stopPropagation();
                  startTaskTimer(task.id);
                }}
                title="Iniciar timer"
                disabled={timerRunning || timerBusy}
              >
                ▶
              </button>
              <button
                className="kanban-icon-btn info"
                onClick={(event) => {
                  event.stopPropagation();
                  pauseTaskTimer(task.id);
                }}
                title="Pausar timer"
                disabled={!timerRunning || timerBusy}
              >
                ⏸
              </button>
              <button
                className="kanban-icon-btn danger"
                onClick={(event) => {
                  event.stopPropagation();
                  stopTaskTimer(task.id);
                }}
                title="Parar e registrar tempo"
                disabled={!canStopTimer || timerBusy}
              >
                ■
              </button>
            </div>
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
    if (!originalTask || originalTask.status === status) return;
    const targetIndex = statusOrder.indexOf(status);
    const currentIndex = statusOrder.indexOf(originalTask.status);
    if (targetIndex === -1) {
      toast.error('Status destino inválido.');
      return;
    }
    const isRegression = currentIndex !== -1 && targetIndex < currentIndex;
    let regressionReason = null;
    if (isRegression) {
      const promptMessage = `Informe o motivo para retornar o card ${originalTask.code} (${statusLabels[originalTask.status]}) para ${statusLabels[status]}:`;
      const input = window.prompt(promptMessage);
      if (input === null) {
        return;
      }
      regressionReason = input.trim();
      if (!regressionReason) {
        toast.warn('O motivo é obrigatório para mover o card para um status anterior.');
        return;
      }
    }
    const payload = { status };
    if (regressionReason) {
      payload.regression_reason = regressionReason;
    }
    const originalParent = originalTask.parent_id ? tasks.find(t => t.id === originalTask.parent_id) : null;
    const timerSnapshotSeconds = status === 'done' ? computeElapsedSeconds(originalTask) : null;
    axios.put(`/tasks/${id}`, payload).then(() => {
      const nowIso = new Date().toISOString();
      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        const extra = regressionReason ? { regression_reason: regressionReason, regression_reason_at: nowIso } : {};
        const timerExtra = timerSnapshotSeconds !== null
          ? { tracked_seconds: timerSnapshotSeconds, timer_started_at: null }
          : {};
        return { ...t, status, updated_at: nowIso, ...extra, ...timerExtra };
      }));
      setDetailTask(prev => {
        if (!prev || prev.id !== id) return prev;
        const extra = regressionReason ? { regression_reason: regressionReason, regression_reason_at: nowIso } : {};
        const timerExtra = timerSnapshotSeconds !== null
          ? { tracked_seconds: timerSnapshotSeconds, timer_started_at: null }
          : {};
        return { ...prev, status, updated_at: nowIso, ...extra, ...timerExtra };
      });
      if (originalTask.parent_id && status !== originalTask.status) {
        const parentLabel = originalParent?.code || `Card ${originalTask.parent_id}`;
        if (status === 'blocked') {
          toast.warn(`Subtarefa ${originalTask.code} marcada como impedida (${parentLabel})`);
        }
        if (status === 'done') {
          toast.success(`Subtarefa ${originalTask.code} concluída (${parentLabel})`);
        }
      }
    }).catch(err => {
      if (err.response?.status === 401) {
        handleLogout();
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      }
    });
  };


  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const childTasks = tasks.filter(t => t.parent_id === id);
    const completedToArchive = [taskToDelete, ...childTasks].filter(Boolean).filter(t => t.status === "done");
    axios.delete(`/tasks/${id}`).then(() => {
      setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
      toast.success("Tarefa removida com sucesso!");
      refreshHistorico();
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
        {isAdmin && (
          <select
            className="kanban-input owner-filter"
            style={{ maxWidth: 240, minWidth: 160 }}
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
          >
            <option value="all">Todos os responsáveis</option>
            <option value="none">Sem responsável</option>
            {adminUsers.map(u => (
              <option key={u.id} value={String(u.id)}>
                {u.username}{currentUserId && Number(u.id) === currentUserId ? ' (você)' : ''}
              </option>
            ))}
          </select>
        )}
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
        <RemindersPanel user={user} handleLogout={handleLogout} />
        <div className="historico-box">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap'}}>
            <h2 className="historico-title" style={{margin: 0}}>Histórico de Atividades Concluídas Removidas</h2>
            <button
              className="kanban-btn"
              style={{padding: '4px 10px', fontSize: 13, fontWeight: 600}}
              onClick={() => exportHistoricoCSV(historico)}
              title="Exportar CSV"
              disabled={!historico.length}
            >
              ⬇️ Exportar
            </button>
          </div>
          <div className="historico-filters" style={{display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 12}}>
            <input
              className="kanban-input"
              value={historicoFilterForm.search}
              onChange={e => handleHistoricoFormChange('search', e.target.value)}
              placeholder="Buscar por título, código ou responsável"
            />
            <input
              className="kanban-input"
              type="date"
              value={historicoFilterForm.start}
              onChange={e => handleHistoricoFormChange('start', e.target.value)}
              title="Data inicial"
            />
            <input
              className="kanban-input"
              type="date"
              value={historicoFilterForm.end}
              onChange={e => handleHistoricoFormChange('end', e.target.value)}
              title="Data final"
            />
            {isAdmin && (
              <select
                className="kanban-input"
                value={historicoFilterForm.owner}
                onChange={e => handleHistoricoFormChange('owner', e.target.value)}
              >
                <option value="all">Todos os donos</option>
                <option value="none">Sem responsável</option>
                {adminUsers.map(u => (
                  <option key={`archive-owner-${u.id}`} value={String(u.id)}>
                    {u.username}{currentUserId && Number(u.id) === currentUserId ? ' (você)' : ''}
                  </option>
                ))}
              </select>
            )}
            <label style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 13}}>
              <input
                type="checkbox"
                checked={historicoFilterForm.includeRestored}
                onChange={e => handleHistoricoFormChange('includeRestored', e.target.checked)}
              />
              Incluir restaurados
            </label>
          </div>
          <div style={{display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap'}}>
            <button className="kanban-btn" onClick={applyHistoricoFilters}>Aplicar filtros</button>
            <button className="kanban-btn secondary" onClick={clearHistoricoFilters}>Limpar</button>
            <button className="kanban-btn secondary" onClick={refreshHistorico} disabled={historicoLoading}>Atualizar</button>
          </div>
          {historicoError && (
            <div style={{ color: '#e53935', marginBottom: 8 }}>{historicoError}</div>
          )}
          {historicoLoading ? (
            <div style={{ padding: 12 }}>Carregando histórico...</div>
          ) : historico.length === 0 ? (
            <div className="historico-empty">Nenhum card arquivado por enquanto.</div>
          ) : (
            <ul className="historico-list">
              {historico.map(item => {
                const deletedLabel = item.deleted_at ? new Date(item.deleted_at).toLocaleString() : '—';
                const restoredLabel = item.restored_at ? new Date(item.restored_at).toLocaleString() : null;
                const statusLabel = statusLabels[item.original_status] || item.original_status || '—';
                const priorityLabel = priorityLabels[item.priority] || item.priority || '—';
                const ownerLabel = item.owner_username || (item.owner_id ? `Usuário ${item.owner_id}` : 'Sem responsável');
                return (
                  <li key={item.id} className="historico-item">
                    <div className="historico-item-header">
                      <span className="historico-task-title">✅ {item.code ? `${item.code} · ` : ''}{item.title}</span>
                      <span className="historico-task-date">
                        Removido em {deletedLabel}
                        {item.deleted_by ? ` · por ${item.deleted_by}` : ''}
                      </span>
                    </div>
                    <div className="historico-item-meta">
                      <span>Status original: {statusLabel}</span>
                      <span>Prioridade: {priorityLabel}</span>
                      <span>Dono: {ownerLabel}</span>
                      <span title={`Total registrado: ${formatDurationHMS(item.tracked_seconds || 0)}`}>
                        ⏱️ Tempo: {formatDurationShort(item.tracked_seconds || 0)}
                      </span>
                      {item.assignee && <span>Responsável: {item.assignee}</span>}
                      {item.tags.length > 0 && (
                        <span>Tags: {item.tags.map(tag => `#${tag}`).join(' ')}</span>
                      )}
                    </div>
                    {item.restored_at ? (
                      <div className="historico-item-meta historico-item-restored">
                        Restaurado em {restoredLabel}
                        {item.restored_by ? ` · por ${item.restored_by}` : ''}
                      </div>
                    ) : isAdmin && (
                      <div style={{marginTop: 8}}>
                        <button className="kanban-btn" onClick={() => restoreArchiveEntry(item.id)}>Restaurar card</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
              <span>Tempo registrado:</span>
              <strong title={`Total: ${detailTimerFullLabel}`}>
                {formatDurationShort(detailElapsedSeconds)}
                {detailTimerRunning ? ' (em andamento)' : detailTimerBusy ? ' (atualizando...)' : ''}
              </strong>
            </div>
            {detailTask.status !== 'done' && (
              <div className="detail-row" style={{ alignItems: 'center', gap: 8 }}>
                <span>Controle do timer:</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="kanban-btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => startTaskTimer(detailTask.id)}
                    disabled={detailTimerRunning || detailTimerBusy}
                  >
                    ▶ Iniciar
                  </button>
                  <button
                    className="kanban-btn secondary"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => pauseTaskTimer(detailTask.id)}
                    disabled={!detailTimerRunning || detailTimerBusy}
                  >
                    ⏸ Pausar
                  </button>
                  <button
                    className="kanban-btn delete"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => stopTaskTimer(detailTask.id)}
                    disabled={!detailCanStop || detailTimerBusy}
                  >
                    ■ Parar
                  </button>
                </div>
              </div>
            )}
            {detailTask.regression_reason && (
              <div className="detail-row">
                <span>Motivo do retorno:</span>
                <strong>{detailTask.regression_reason}</strong>
              </div>
            )}
            {detailTask.regression_reason_at && (
              <div className="detail-row">
                <span>Registrado em:</span>
                <strong>{new Date(detailTask.regression_reason_at).toLocaleString()}</strong>
              </div>
            )}
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
            <div className="detail-row">
              <span>Dono do card:</span>
              {detailEdit && isAdmin ? (
                <select
                  className="detail-select"
                  value={detailForm.owner_id === null || detailForm.owner_id === undefined ? '' : String(detailForm.owner_id)}
                  onChange={e => handleDetailFieldChange('owner_id', e.target.value)}
                >
                  <option value="">Sem responsável</option>
                  {adminUsers.map(u => (
                    <option key={u.id} value={String(u.id)}>
                      {u.username}{currentUserId && Number(u.id) === currentUserId ? ' (você)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>
                  {detailTask.owner_id === null || detailTask.owner_id === undefined
                    ? 'Sem responsável'
                    : (detailTask.owner_id === currentUserId
                      ? 'Você'
                      : (ownerNameById.get(Number(detailTask.owner_id)) || detailTask.owner_username || `Usuário ${detailTask.owner_id}`))}
                </strong>
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
