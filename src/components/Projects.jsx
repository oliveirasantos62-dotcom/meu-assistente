import React, { useMemo, useState } from 'react';
import TagPicker from './TagPicker';

const EMPTY_PROJECT = {
  name: '',
  description: '',
  priority: 'Média',
  deadline: '',
  stageIndex: 1,
  totalStages: 3,
  status: 'Em andamento',
  tags: [],
};

const PRIORITIES = ['Baixa', 'Média', 'Alta'];
const STATUSES = ['Planejado', 'Em andamento', 'Pausado', 'Concluído'];

export default function Projects({ data, save }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PROJECT);
  const projectsList = Array.isArray(data?.projects) ? data.projects : [];
  const tasksList = Array.isArray(data?.tasks) ? data.tasks : [];

  const stats = useMemo(() => ({
    total: projectsList.length,
    active: projectsList.filter((p) => p.status !== 'Concluído').length,
    completed: projectsList.filter((p) => p.status === 'Concluído').length,
  }), [projectsList]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PROJECT);
    setShowForm(true);
  };

  const openEdit = (project) => {
    setEditingId(project.id);
    setForm({ ...EMPTY_PROJECT, ...project });
    setShowForm(true);
  };

  const saveProject = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const totalStages = Math.max(1, Number(form.totalStages) || 1);
    const project = {
      ...form,
      name,
      description: form.description.trim(),
      totalStages,
      stageIndex: Math.min(totalStages, Math.max(1, Number(form.stageIndex) || 1)),
      tags: Array.from(new Set((form.tags || []).map(String))),
      updatedAt: new Date().toISOString(),
    };

    save({
      ...data,
      projects: editingId
        ? projectsList.map((item) => item.id === editingId ? { ...item, ...project } : item)
        : [...projectsList, { id: Date.now(), ...project, createdAt: new Date().toISOString() }],
    });
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_PROJECT);
  };

  const advanceStage = (project) => {
    const total = Math.max(1, Number(project.totalStages) || 1);
    const current = Math.max(1, Number(project.stageIndex) || 1);
    const next = Math.min(total, current + 1);
    const status = next >= total ? 'Concluído' : 'Em andamento';
    save({
      ...data,
      projects: projectsList.map((p) => p.id === project.id ? { ...p, stageIndex: next, status } : p),
    });
  };

  const deleteProject = (project) => {
    const linked = tasksList.filter((task) => String(task.projectId) === String(project.id)).length;
    const message = linked
      ? `Excluir "${project.name}"? ${linked} tarefa(s) vinculada(s) ficarão sem projeto, mas não serão excluídas.`
      : `Excluir o projeto "${project.name}"?`;
    if (!window.confirm(message)) return;

    save({
      ...data,
      projects: projectsList.filter((p) => p.id !== project.id),
      tasks: tasksList.map((task) => String(task.projectId) === String(project.id) ? { ...task, projectId: null } : task),
    });
  };

  return (
    <div className="card projects-page">
      <div className="section-title">
        <div>
          <h2>🚀 Projetos</h2>
          <p className="subtitle">Divida objetivos grandes em etapas pequenas e acompanháveis.</p>
        </div>
        <button type="button" className="primary" onClick={openCreate}>＋ Novo projeto</button>
      </div>

      <div className="metrics personal-metrics">
        <div className="reward"><strong>{stats.total}</strong><small>🚀 Projetos</small></div>
        <div className="reward"><strong>{stats.active}</strong><small>⏳ Em aberto</small></div>
        <div className="reward"><strong>{stats.completed}</strong><small>✅ Concluídos</small></div>
      </div>

      <div className="goal-grid">
        {projectsList.map((project) => {
          const linked = tasksList.filter((task) => String(task.projectId) === String(project.id));
          const done = linked.filter((task) => task.done).length;
          const taskProgress = linked.length ? Math.round((done / linked.length) * 100) : 0;
          const totalStages = Math.max(1, Number(project.totalStages) || 1);
          const stageIndex = Math.min(totalStages, Math.max(1, Number(project.stageIndex) || 1));
          const stageProgress = Math.round((stageIndex / totalStages) * 100);
          const progress = linked.length ? taskProgress : stageProgress;

          return (
            <article className="project-card project-card-enhanced" key={project.id}>
              <div className="project-card-top">
                <div>
                  <span className={`project-status status-${String(project.status || 'Em andamento').toLowerCase().replaceAll(' ', '-')}`}>{project.status || 'Em andamento'}</span>
                  <h3>{project.name}</h3>
                </div>
                <span className={`project-priority priority-${String(project.priority || 'Média').toLowerCase()}`}>{project.priority || 'Média'}</span>
              </div>

              {project.description && <p className="subtitle">{project.description}</p>}

              <small>{project.deadline ? `📅 Prazo: ${formatDate(project.deadline)}` : '📅 Sem prazo definido'}</small>

              <div className="goal-progress" style={{ margin: '12px 0 6px' }}>
                <div className="progress"><span style={{ width: `${progress}%` }} /></div>
              </div>
              <div className="project-progress-label">
                <span>{linked.length ? `${done}/${linked.length} tarefas concluídas` : `Etapa ${stageIndex}/${totalStages}`}</span>
                <strong>{progress}%</strong>
              </div>

              <div className="project-actions">
                <button type="button" className="primary" onClick={() => advanceStage(project)} disabled={stageIndex >= totalStages}>
                  {stageIndex >= totalStages ? '✓ Etapas concluídas' : '➡️ Avançar etapa'}
                </button>
                <button type="button" className="ghost" onClick={() => openEdit(project)}>✏️ Editar</button>
                <button type="button" className="ghost" onClick={() => deleteProject(project)}>🗑️ Excluir</button>
              </div>
            </article>
          );
        })}
        {projectsList.length === 0 && (
          <p className="subtitle">Nenhum projeto cadastrado. Crie seu primeiro projeto para acompanhar as etapas.</p>
        )}
      </div>

      {showForm && (
        <div className="project-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form className="project-modal card" onSubmit={saveProject}>
            <div className="section-title">
              <h2>{editingId ? '✏️ Editar projeto' : '🚀 Novo projeto'}</h2>
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <label>Nome do projeto *
              <input autoFocus required maxLength={120} value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Ex.: Aplicativo fitness" />
            </label>
            <label>Descrição
              <textarea rows="3" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Qual resultado você quer alcançar?" />
            </label>
            <div className="form-grid">
              <label>Prioridade
                <select value={form.priority} onChange={(e) => updateForm('priority', e.target.value)}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
              </label>
              <label>Prazo
                <input type="date" value={form.deadline || ''} onChange={(e) => updateForm('deadline', e.target.value)} />
              </label>
              <label>Status
                <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label>Total de etapas
                <input type="number" min="1" max="100" value={form.totalStages} onChange={(e) => updateForm('totalStages', e.target.value)} />
              </label>
              <label>Etapa atual
                <input type="number" min="1" max={Math.max(1, Number(form.totalStages) || 1)} value={form.stageIndex} onChange={(e) => updateForm('stageIndex', e.target.value)} />
              </label>
            </div>
            <div className="quick project-form-actions">
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="primary">{editingId ? 'Salvar alterações' : 'Criar projeto'}</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .projects-page .section-title { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
        .project-card-enhanced { min-width:0; }
        .project-card-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
        .project-card-top h3 { margin:7px 0; }
        .project-status { display:inline-flex; padding:4px 8px; border-radius:999px; font-size:11px; background:rgba(100,100,100,.1); }
        .status-concluído { color:#16a34a; } .status-pausado { color:#d97706; }
        .project-priority { font-size:12px; font-weight:700; }
        .priority-alta { color:#ef4444; } .priority-média { color:#d97706; } .priority-baixa { color:#16a34a; }
        .project-progress-label { display:flex; justify-content:space-between; font-size:12px; opacity:.8; }
        .project-actions { display:flex; gap:7px; flex-wrap:wrap; margin-top:14px; }
        .project-modal-backdrop { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; padding:16px; background:rgba(0,0,0,.55); }
        .project-modal { width:min(680px, 100%); max-height:90vh; overflow:auto; }
        .project-modal label { display:grid; gap:6px; margin:10px 0; font-size:13px; font-weight:600; }
        .project-modal input, .project-modal select, .project-modal textarea { width:100%; box-sizing:border-box; }
        .project-form-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
      `}</style>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
