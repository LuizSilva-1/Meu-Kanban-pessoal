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
import React, { useEffect, useState } from "react";
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

  // Verifica se pode criar admin
  useEffect(() => {
    if (!isLogin) {
      axios.get("/api/audit") // qualquer rota protegida
        .then(() => setAdminAvailable(false))
        .catch(err => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            // Tenta criar admin apenas se não houver admin
            axios.post("/api/login", { username: "__admin_check__", password: "__admin_check__" })
              .catch(() => setAdminAvailable(true));
          }
        });
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
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // id da tarefa a confirmar

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("kanbanDarkMode");
    return saved === null ? false : saved === "true";
  });
  useEffect(() => {
    localStorage.setItem("kanbanDarkMode", darkMode);
  }, [darkMode]);
  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveEdit = (task) => {
    if (!editingTitle.trim()) return;
    axios.put(`/tasks/${task.id}`, { title: editingTitle, status: task.status }).then(() => {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, title: editingTitle } : t));
      setEditingId(null);
      setEditingTitle("");
    });
  };


  useEffect(() => {
    if (user?.token) {
      axios.get("/tasks").then(res => setTasks(res.data));
    }
  }, [user]);


  const addTask = () => {
    if (!title.trim()) return;
    axios.post("/tasks", { title }).then(res => {
      setTasks([...tasks, res.data]);
      setTitle("");
    }).catch(err => {
      if (err.response?.status === 401) handleLogout();
    });
  };


  const moveTask = (id, status) => {
    axios.put(`/tasks/${id}`, { status }).then(() => {
      setTasks(tasks.map(t => (t.id === id ? { ...t, status } : t)));
    }).catch(err => {
      if (err.response?.status === 401) handleLogout();
    });
  };


  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && taskToDelete.status === "done") {
      setHistorico([{ ...taskToDelete, deletedAt: new Date().toISOString() }, ...historico]);
    }
    axios.delete(`/tasks/${id}`).then(() => {
      setTasks(tasks.filter(t => t.id !== id));
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
      {/* Botão de modo escuro movido para o topo, junto dos outros botões */}
      <h1 className="kanban-main-title">CloudOps Tracker – Minhas Atividades</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <input
          className="kanban-input"
          style={{ maxWidth: 340, minWidth: 180 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tarefa..."
        />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {statusOrder.map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`kanban-column ${status}`}
                  style={{ background: snapshot.isDraggingOver ? '#ffe082' : undefined }}
                >
                  <div className="kanban-column-header">
                    <span style={{fontSize: 22, marginRight: 6}}>{statusIcons[status]}</span>
                    {statusLabels[status]}
                  </div>
                  {status === "backlog" && (
                    <div className="kanban-input-row kanban-input-row-backlog">
                      <input
                        className="kanban-input"
                        value={title}
                        placeholder="Nova tarefa..."
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTask()}
                      />
                      <button className="kanban-btn" onClick={addTask}>
                        Adicionar
                      </button>
                    </div>
                  )}
                  {tasks.filter(t => t.status === status && t.title.toLowerCase().includes(search.toLowerCase())).map((t, idx) => (
                    <Draggable draggableId={String(t.id)} index={idx} key={t.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="kanban-card"
                          style={{
                            ...provided.draggableProps.style,
                            boxShadow: snapshot.isDragging ? '0 8px 24px #0005' : undefined,
                            background: snapshot.isDragging ? '#fffde7' : undefined
                          }}
                        >
                          <div className="kanban-card-content">
                            {editingId === t.id ? (
                              <input
                                className="kanban-input"
                                style={{ fontSize: 15, marginBottom: 4 }}
                                value={editingTitle}
                                autoFocus
                                onChange={e => setEditingTitle(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEdit(t);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                              />
                            ) : (
                              <span className="kanban-card-title">{t.title}</span>
                            )}
                          </div>
                          <div className="kanban-card-actions">
                            <select
                              className="kanban-status-dropdown"
                              value={t.status}
                              onChange={e => moveTask(t.id, e.target.value)}
                            >
                              {statusOrder.map(opt => (
                                <option key={opt} value={opt}>{statusLabels[opt]}</option>
                              ))}
                            </select>
                            {editingId === t.id ? (
                              <>
                                <button className="kanban-btn move" onClick={() => saveEdit(t)} title="Salvar">💾</button>
                                <button className="kanban-btn delete" onClick={cancelEdit} title="Cancelar">✖</button>
                              </>
                            ) : (
                              <button className="kanban-btn" onClick={() => startEdit(t)} title="Editar">✏️</button>
                            )}
                            {status === "done" && (
                              <button
                                className="kanban-btn delete"
                                onClick={() => setConfirmDelete(t.id)}
                                title="Remover"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
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
    </div>
  );
}

export default App;
