import React, { useEffect, useMemo, useState } from 'react';
import {
  getCollaborativeProjects, createCollaborativeProject, updateCollaborativeProject, deleteCollaborativeProject,
  getProjectMembers, inviteProjectMember, getProjectInvitations, respondProjectInvitation,
  getProjectTasks, createProjectTask, updateProjectTask, deleteProjectTask, getProjectTaskHistory,
  getConnections,
} from '../services/api';

const EMPTY_PROJECT = { name: '', description: '', priority: 'medium', status: 'active', deadline: '', privacy: 'connections' };
const EMPTY_TASK = { title: '', description: '', responsibleId: '', status: 'todo', priority: 'medium', deadline: '', progress: 0 };
const labels = { low: 'Baixa', medium: 'Média', high: 'Alta', planned: 'Planejado', active: 'Em andamento', paused: 'Pausado', completed: 'Concluído', todo: 'A fazer', doing: 'Em andamento', done: 'Concluída' };

export default function ProjetosColaborativos() {
  const [projects, setProjects] = useState([]);
  const [connections, setConnections] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [showProject, setShowProject] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [editingTask, setEditingTask] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadBase() {
    setLoading(true); setError('');
    try {
      const [p, c, i] = await Promise.all([getCollaborativeProjects(), getConnections(), getProjectInvitations()]);
      setProjects(p); setConnections(c.filter((x) => x.status === 'accepted')); setInvitations(i);
      if (selected) {
        const fresh = p.find((x) => x.id === selected.id);
        if (fresh) setSelected(fresh); else setSelected(null);
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function openProject(project) {
    setSelected(project); setError(''); setMessage(''); setHistoryTask(null);
    try {
      const [m, t] = await Promise.all([getProjectMembers(project.id), getProjectTasks(project.id)]);
      setMembers(m.filter((x) => x.status === 'accepted')); setTasks(t);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { loadBase(); }, []);

  async function saveProject(e) {
    e.preventDefault(); setError('');
    try {
      const p = await createCollaborativeProject(projectForm);
      setProjects((old) => [p, ...old]); setProjectForm(EMPTY_PROJECT); setShowProject(false); setMessage('Projeto criado.');
    } catch (e) { setError(e.message); }
  }

  async function removeProject(project) {
    if (!window.confirm(`Excluir o projeto "${project.name}" e suas tarefas?`)) return;
    try { await deleteCollaborativeProject(project.id); setProjects((old) => old.filter((x) => x.id !== project.id)); if (selected?.id === project.id) setSelected(null); setMessage('Projeto excluído.'); }
    catch (e) { setError(e.message); }
  }

  async function invite(projectId, userId) {
    try { await inviteProjectMember(projectId, userId); setMessage('Convite enviado.'); }
    catch (e) { setError(e.message); }
  }

  async function respond(inv, status) {
    try { await respondProjectInvitation(inv.id, status); setInvitations((old) => old.filter((x) => x.id !== inv.id)); await loadBase(); setMessage(status === 'accepted' ? 'Você entrou no projeto.' : 'Convite recusado.'); }
    catch (e) { setError(e.message); }
  }

  async function saveTask(e) {
    e.preventDefault(); if (!selected) return;
    try {
      if (editingTask) {
        const t = await updateProjectTask(selected.id, editingTask.id, taskForm);
        setTasks((old) => old.map((x) => x.id === t.id ? t : x));
      } else {
        const t = await createProjectTask(selected.id, taskForm);
        setTasks((old) => [t, ...old]);
      }
      setTaskForm(EMPTY_TASK); setEditingTask(null); setShowTask(false); setMessage('Tarefa salva.'); await loadBase();
    } catch (e) { setError(e.message); }
  }

  async function changeTask(task, patch) {
    try { const t = await updateProjectTask(selected.id, task.id, patch); setTasks((old) => old.map((x) => x.id === t.id ? t : x)); await loadBase(); }
    catch (e) { setError(e.message); }
  }

  async function removeTask(task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;
    try { await deleteProjectTask(selected.id, task.id); setTasks((old) => old.filter((x) => x.id !== task.id)); }
    catch (e) { setError(e.message); }
  }

  async function showHistory(task) {
    try { setHistoryTask(task); setHistory(await getProjectTaskHistory(selected.id, task.id)); }
    catch (e) { setError(e.message); }
  }

  const stats = useMemo(() => {
    const total = tasks.length; const done = tasks.filter((t) => t.status === 'done').length;
    return { total, done, progress: total ? Math.round(tasks.reduce((s, t) => s + Number(t.progress || 0), 0) / total) : 0 };
  }, [tasks]);

  const inviteCandidates = connections.filter((c) => !members.some((m) => m.user_id === c.user_id));

  return <section className="page-section collaborative-projects-page">
    <div className="section-heading">
      <div><span className="eyebrow">FASE 5 · COLABORAÇÃO</span><h2>📁 Projetos colaborativos</h2><p>Crie projetos, convide conexões, distribua tarefas e acompanhe o progresso de cada membro.</p></div>
      <button className="primary" onClick={() => setShowProject(true)}>＋ Novo projeto</button>
    </div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {message && <p className="auth-message" role="status">{message}</p>}

    {invitations.length > 0 && <div className="card project-invitations"><h3>📨 Convites para projetos</h3>{invitations.map((inv) => <div className="project-invitation" key={inv.id}><div><strong>{inv.project_name}</strong><small>{inv.inviter_name}{inv.inviter_username ? ` · @${inv.inviter_username}` : ''}</small></div><div className="project-actions"><button onClick={() => respond(inv, 'accepted')}>Aceitar</button><button className="ghost" onClick={() => respond(inv, 'rejected')}>Recusar</button></div></div>)}</div>}

    {loading ? <div className="card"><p>Carregando projetos...</p></div> : <div className="collab-project-grid">
      {projects.map((p) => <article className="collab-project-card" key={p.id}>
        <div className="project-card-top"><span className={`project-status status-${p.status}`}>{labels[p.status]}</span><span className={`project-priority priority-${p.priority}`}>{labels[p.priority]}</span></div>
        <h3>{p.name}</h3><p>{p.description || 'Sem descrição.'}</p>
        <div className="collab-project-meta"><span>👥 {p.member_count} membro(s)</span><span>✅ {p.done_task_count}/{p.task_count} tarefas</span>{p.deadline && <span>📅 {new Date(`${p.deadline}T00:00:00`).toLocaleDateString('pt-BR')}</span>}</div>
        <div className="goal-progress"><div className="progress"><span style={{ width: `${Number(p.task_progress || 0)}%` }} /></div></div><div className="project-progress-label"><span>Progresso</span><strong>{Number(p.task_progress || 0)}%</strong></div>
        <div className="project-actions"><button className="primary" onClick={() => openProject(p)}>Abrir projeto</button>{p.my_role === 'owner' && <button className="ghost" onClick={() => removeProject(p)}>🗑️</button>}</div>
      </article>)}
      {!projects.length && <div className="card"><h3>Comece um projeto em equipe</h3><p>Crie um projeto e convide suas conexões para dividir responsabilidades.</p></div>}
    </div>}

    {selected && <div className="card collaborative-project-detail">
      <div className="section-heading"><div><span className="eyebrow">PROJETO</span><h2>{selected.name}</h2><p>{selected.description || 'Sem descrição.'}</p></div><button className="ghost" onClick={() => setSelected(null)}>Fechar</button></div>
      <div className="foguinho-stats"><div className="card"><strong>{members.length}</strong><span>Membros</span></div><div className="card"><strong>{stats.total}</strong><span>Tarefas</span></div><div className="card"><strong>{stats.done}</strong><span>Concluídas</span></div><div className="card"><strong>{stats.progress}%</strong><span>Progresso médio</span></div></div>
      <div className="collab-two-columns">
        <div><div className="section-title"><h3>👥 Membros</h3></div>{members.map((m) => <div className="project-member" key={m.user_id}><span>👤 {m.name}</span><small>{m.role === 'owner' ? 'Dono' : 'Membro'}{m.username ? ` · @${m.username}` : ''}</small></div>)}{selected.my_role === 'owner' && selected.privacy !== 'private' && <select className="project-invite-select" defaultValue="" onChange={(e) => { if (e.target.value) invite(selected.id, e.target.value); e.target.value = ''; }}><option value="">＋ Convidar conexão...</option>{inviteCandidates.map((c) => <option key={c.user_id} value={c.user_id}>{c.name}{c.username ? ` · @${c.username}` : ''}</option>)}</select>}</div>
        <div><div className="section-title"><h3>📊 Visão do projeto</h3></div><p className="subtitle">As tarefas ficam associadas ao responsável e o progresso geral é calculado automaticamente.</p><div className="goal-progress"><div className="progress"><span style={{ width: `${stats.progress}%` }} /></div></div></div>
      </div>
      <div className="section-title project-task-heading"><h3>✅ Tarefas</h3><button className="primary" onClick={() => { setEditingTask(null); setTaskForm(EMPTY_TASK); setShowTask(true); }}>＋ Nova tarefa</button></div>
      <div className="collab-task-list">{tasks.map((task) => <article className="collab-task" key={task.id}><div><div className="collab-task-top"><span className={`task-status status-${task.status}`}>{labels[task.status]}</span><span>{labels[task.priority]}</span></div><h4>{task.title}</h4><p>{task.description || 'Sem descrição.'}</p><small>👤 {task.responsible_name || 'Sem responsável'}{task.deadline ? ` · 📅 ${new Date(`${task.deadline}T00:00:00`).toLocaleDateString('pt-BR')}` : ''}</small></div><div className="collab-task-controls"><strong>{task.progress}%</strong><input type="range" min="0" max="100" value={task.progress} onChange={(e) => changeTask(task, { progress: Number(e.target.value), status: Number(e.target.value) >= 100 ? 'done' : Number(e.target.value) > 0 ? 'doing' : 'todo' })} /><div className="project-actions"><button className="ghost" onClick={() => { setEditingTask(task); setTaskForm({ title: task.title, description: task.description || '', responsibleId: task.responsible_id || '', status: task.status, priority: task.priority, deadline: task.deadline || '', progress: task.progress }); setShowTask(true); }}>✏️</button><button className="ghost" onClick={() => showHistory(task)}>📜</button><button className="ghost" onClick={() => removeTask(task)}>🗑️</button></div></div></article>)}{!tasks.length && <p className="subtitle">Nenhuma tarefa ainda.</p>}</div>
    </div>}

    {showProject && <div className="project-modal-backdrop"><form className="project-modal card" onSubmit={saveProject}><div className="section-title"><h2>📁 Novo projeto colaborativo</h2><button type="button" className="ghost" onClick={() => setShowProject(false)}>✕</button></div><label>Nome *<input required value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></label><label>Descrição<textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} /></label><div className="form-grid"><label>Prioridade<select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}>{['low','medium','high'].map((x) => <option key={x} value={x}>{labels[x]}</option>)}</select></label><label>Status<select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>{['planned','active','paused','completed'].map((x) => <option key={x} value={x}>{labels[x]}</option>)}</select></label><label>Prazo<input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} /></label><label>Privacidade<select value={projectForm.privacy} onChange={(e) => setProjectForm({ ...projectForm, privacy: e.target.value })}><option value="connections">Conexões</option><option value="private">Privado</option></select></label></div><div className="project-form-actions"><button type="button" className="ghost" onClick={() => setShowProject(false)}>Cancelar</button><button className="primary">Criar projeto</button></div></form></div>}

    {showTask && selected && <div className="project-modal-backdrop"><form className="project-modal card" onSubmit={saveTask}><div className="section-title"><h2>{editingTask ? '✏️ Editar tarefa' : '✅ Nova tarefa'}</h2><button type="button" className="ghost" onClick={() => setShowTask(false)}>✕</button></div><label>Título *<input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></label><label>Descrição<textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></label><div className="form-grid"><label>Responsável<select value={taskForm.responsibleId} onChange={(e) => setTaskForm({ ...taskForm, responsibleId: e.target.value })}><option value="">Ninguém</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select></label><label>Status<select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>{['todo','doing','done'].map((x) => <option key={x} value={x}>{labels[x]}</option>)}</select></label><label>Prioridade<select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>{['low','medium','high'].map((x) => <option key={x} value={x}>{labels[x]}</option>)}</select></label><label>Prazo<input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} /></label><label>Progresso (%)<input type="number" min="0" max="100" value={taskForm.progress} onChange={(e) => setTaskForm({ ...taskForm, progress: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} /></label></div><div className="project-form-actions"><button type="button" className="ghost" onClick={() => setShowTask(false)}>Cancelar</button><button className="primary">Salvar tarefa</button></div></form></div>}

    {historyTask && <div className="project-modal-backdrop"><div className="project-modal card"><div className="section-title"><h2>📜 Histórico — {historyTask.title}</h2><button className="ghost" onClick={() => setHistoryTask(null)}>✕</button></div>{history.length ? history.map((h) => <div className="project-history-row" key={h.id}><strong>{h.name}</strong><span>{h.action}</span><small>{new Date(h.created_at).toLocaleString('pt-BR')}</small></div>) : <p>Sem alterações registradas.</p>}</div></div>}
  </section>;
}
