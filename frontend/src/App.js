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


// Configuração do login local (altere aqui seu usuário/senha)
const LOGIN_USER = "admin";
const LOGIN_PASS = "minhasenha123";

function App() {
  // Estado do login
  const [isLogged, setIsLogged] = useState(() => {
    return localStorage.getItem("kanbanLogged") === "true";
  });
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUser === LOGIN_USER && loginPass === LOGIN_PASS) {
      setIsLogged(true);
      localStorage.setItem("kanbanLogged", "true");
      setLoginError("");
    } else {
      setLoginError("Usuário ou senha inválidos!");
    }
  };

  const handleLogout = () => {
    setIsLogged(false);
    localStorage.removeItem("kanbanLogged");
  };

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
    axios.get("/tasks").then(res => setTasks(res.data));
  }, []);

  const addTask = () => {
    if (!title.trim()) return;
    axios.post("/tasks", { title }).then(res => {
      setTasks([...tasks, res.data]);
      setTitle("");
    });
  };

  const moveTask = (id, status) => {
    axios.put(`/tasks/${id}`, { status }).then(() => {
      setTasks(tasks.map(t => (t.id === id ? { ...t, status } : t)));
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
    });
    setConfirmDelete(null);
  };

  if (!isLogged) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#232f3e' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0003', padding: 32, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ textAlign: 'center', color: '#232f3e', marginBottom: 8 }}>Login do Kanban</h2>
          <input type="text" placeholder="Usuário" value={loginUser} onChange={e => setLoginUser(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #bbb', fontSize: 16 }} autoFocus />
          <input type="password" placeholder="Senha" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #bbb', fontSize: 16 }} />
          {loginError && <div style={{ color: '#e53935', fontWeight: 600, textAlign: 'center' }}>{loginError}</div>}
          <button type="submit" style={{ padding: '10px 0', borderRadius: 6, background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`kanban-bg${darkMode ? " dark-mode" : ""}`}>
      <button onClick={handleLogout} style={{ position: 'fixed', top: 18, left: 24, zIndex: 2000, background: '#fff', color: '#232f3e', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'all 0.2s', fontSize: 15 }}>Sair</button>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <button
        onClick={() => setDarkMode(d => !d)}
        style={{
          position: 'fixed', top: 18, right: 24, zIndex: 2000, background: darkMode ? '#232f3e' : '#fff', color: darkMode ? '#ff9900' : '#232f3e', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'all 0.2s', fontSize: 15
        }}
        title={darkMode ? 'Modo claro' : 'Modo escuro'}
      >
        {darkMode ? '☀️ Modo claro' : '🌙 Modo escuro'}
      </button>
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
