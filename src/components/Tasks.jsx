import React, { useMemo, useState } from 'react';

const EMPTY_FORM = {
  name: '',
  description: '',
  priority: 'Média',
  deadline: '',
  frequency: '1x',
  tag: 'Geral',
  xp: 40,
  projectId: '',
};

const PRIORITIES = ['Baixa', 'Média', 'Alta'];
const FREQUENCIES = ['1x', 'Diária', 'Semanal', 'Mensal'];

export default function Tasks({ data, save, completeTask }) {
  const [tab, setTab] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const tasksList = Array.isArray(data?.tasks) ? data.tasks : [];
  const projectsList = Array.isArray(data?.projects) ? data.projects : [];

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return tasksList.filter((task) => {
      const matchesSearch =
        !query ||
        String(task.name || '').toLocaleLowerCase('pt-BR').includes(query) ||
        String(task.description || '').toLocaleLowerCase('pt-BR').includes(query) ||
        String(task.tag || '').toLocaleLowerCase('pt-BR').includes(query);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && !task.done) ||
        (filter === 'done' && task.done) ||
        (filter === 'overdue' && !task.done && task.deadline && task.deadline < localDate());
      return matchesSearch && matchesFilter;
    });
  }, [tasksList, search, filter]);

  function localDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setForm({
      ...EMPTY_FORM,
      ...task,
      xp: Number(task.xp ?? 40),
      projectId: task.projectId == null ? '' : String(task.projectId),
    });
    setShowForm(true);
  };

  const saveTask = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const taskData = {
      ...form,
      name,
      description: form.description.trim(),
      xp: Math.max(0, Number(form.xp) || 0),
      projectId: form.projectId === '' ? null : form.projectId,
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = editingId
      ? tasksList.map((task) => task.id === editingId ? { ...task, ...taskData } : task)
      : [...tasksList, {
          id: Date.now(),
          ...taskData,
          done: false,
          createdAt: new Date().toISOString(),
        }];

    save({ ...data, tasks: updatedTasks });
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const toggleTask = (task) => {
    if (completeTask) {
      completeTask(task.id);
      return;
    }
    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id ? { ...item, done: !item.done, completedAt: !item.done ? new Date().toISOString() : null } : item
      ),
    });
  };

  const deleteTask = (id) => {
    if (!window.confirm('Excluir esta tarefa?')) return;
    save({ ...data, tasks: tasksList.filter((task) => task.id !== id) });
  };

  const clearCompleted = () => {
    if (!tasksList.some((task) => task.done)) return;
    save({ ...data, tasks: tasksList.filter((task) => !task.done) });
  };

  const resetDay = () => {
    save({
      ...data,
      tasks: tasksList.map((task) => ({ ...task, done: false, completedAt: null })),
    });
  };

  const recurringTasks = tasksList.filter((task) => (task.frequency || '1x') !== '1x');
  const completedCount = tasksList.filter((task) => task.done).length;

  return (
    <div className="card tasks-page">
      <div className="section-title">
        <div>
          <h2>📋 Tarefas</h2>
          <p className="subtitle">Organize suas atividades, prazos e prioridades.</p>
        </div>
        <button type="button" className="primary" onClick={openCreate}>＋ Nova tarefa</button>
      </div>

      <div className="metrics personal-metrics">
        <div className="reward"><strong>{tasksList.length}</strong><small>📋 Total</small></div>
        <div className="reward"><strong>{tasksList.filter((t) => !t.done).length}</strong><small>⏳ Pendentes</small></div>
        <div className="reward"><strong>{completedCount}</strong><small>✅ Concluídas</small></div>
        <div className="reward"><strong>{tasksList.filter((t) => !t.done && t.deadline && t.deadline < localDate()).length}</strong><small>⚠️ Atrasadas</small></div>
      </div>

      <div className="tabs">
        <button type="button" className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>Lista</button>
        <button type="button" className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>Recorrentes ({recurringTasks.length})</button>
      </div>

      {tab === 'tasks' ? (
        <>
          <div className="tasks-toolbar">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tarefa, descrição ou categoria..." aria-label="Buscar tarefas" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar tarefas">
              <option value="all">Todas</option>
              <option value="pending">Pendentes</option>
              <option value="done">Concluídas</option>
              <option value="overdue">Atrasadas</option>
            </select>
          </div>

          <div className="tasks-list">
            {visibleTasks.map((task) => {
              const project = projectsList.find((p) => String(p.id) === String(task.projectId));
              const overdue = !task.done && task.deadline && task.deadline < localDate();
              return (
                <article className={`task ${task.done ? 'done' : ''}`} key={task.id}>
                  <button type="button" className={`check ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task)} aria-label={task.done ? 'Reabrir tarefa' : 'Concluir tarefa'}>
                    {task.done ? '✓' : ''}
                  </button>
                  <div className="task-content">
                    <strong className="task-name">{task.name}</strong>
                    {task.description && <p className="subtitle">{task.description}</p>}
                    <div className="task-meta">
                      <span className={`priority priority-${String(task.priority || 'Média').toLowerCase()}`}>● {task.priority || 'Média'}</span>
                      <span className="value">{Number(task.xp) || 0} XP</span>
                      <span className="frequency">{task.frequency || '1x'}</span>
                      <span className="tag">{task.tag || 'Geral'}</span>
                      {task.deadline && <span className={overdue ? 'deadline overdue' : 'deadline'}>📅 {formatDate(task.deadline)}{overdue ? ' · Atrasada' : ''}</span>}
                      {project && <span className="tag">🚀 {project.name}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button type="button" className="ghost" onClick={() => openEdit(task)}>✏️ Editar</button>
                    <button type="button" className="ghost" onClick={() => deleteTask(task.id)} aria-label={`Excluir ${task.name}`}>🗑️</button>
                  </div>
                </article>
              );
            })}
            {visibleTasks.length === 0 && <p className="subtitle">Nenhuma tarefa encontrada com esse filtro.</p>}
          </div>
        </>
      ) : (
        <div className="daily">
          {recurringTasks.length ? recurringTasks.map((task) => (
            <div className="daily-row" key={task.id}>
              <span>{task.name}</span><strong>{task.frequency}</strong>
              <button type="button" className="ghost" onClick={() => openEdit(task)}>Editar</button>
            </div>
          )) : <p className="subtitle">Nenhuma tarefa recorrente. Edite uma tarefa e escolha a frequência.</p>}
        </div>
      )}

      <div className="quick" style={{ marginTop: 14 }}>
        <button type="button" onClick={openCreate}>➕ Adicionar</button>
        <button type="button" onClick={clearCompleted}>🧹 Limpar concluídas</button>
        <button type="button" onClick={resetDay}>🔄 Reiniciar dia</button>
      </div>

      {showForm && (
        <div className="task-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <form className="task-modal card" onSubmit={saveTask} aria-label={editingId ? 'Editar tarefa' : 'Nova tarefa'}>
            <div className="section-title">
              <h2>{editingId ? '✏️ Editar tarefa' : '➕ Nova tarefa'}</h2>
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <label>Nome da tarefa *
              <input autoFocus required maxLength={120} value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Ex.: Estudar Java" />
            </label>
            <label>Descrição
              <textarea rows="2" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="O que precisa ser feito?" />
            </label>
            <div className="form-grid">
              <label>Prioridade
                <select value={form.priority} onChange={(e) => updateForm('priority', e.target.value)}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
              </label>
              <label>Prazo
                <input type="date" value={form.deadline || ''} onChange={(e) => updateForm('deadline', e.target.value)} />
              </label>
              <label>Frequência
                <select value={form.frequency} onChange={(e) => updateForm('frequency', e.target.value)}>{FREQUENCIES.map((f) => <option key={f}>{f}</option>)}</select>
              </label>
              <label>Categoria
                <input value={form.tag} onChange={(e) => updateForm('tag', e.target.value)} maxLength={40} placeholder="Geral, Estudos..." />
              </label>
              <label>Recompensa XP
                <input type="number" min="0" max="10000" value={form.xp} onChange={(e) => updateForm('xp', e.target.value)} />
              </label>
              <label>Projeto relacionado
                <select value={form.projectId} onChange={(e) => updateForm('projectId', e.target.value)}>
                  <option value="">Nenhum</option>
                  {projectsList.map((project) => <option key={project.id} value={String(project.id)}>{project.name}</option>)}
                </select>
              </label>
            </div>
            <div className="quick">
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="primary">{editingId ? 'Salvar alterações' : 'Criar tarefa'}</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .tasks-page .section-title { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
        .tasks-toolbar { display:flex; gap:10px; margin:14px 0; flex-wrap:wrap; }
        .tasks-toolbar input { flex:1; min-width:180px; }
        .tasks-toolbar select { min-width:140px; }
        .tasks-list { display:grid; gap:10px; }
        .tasks-page .task { display:flex; align-items:flex-start; gap:12px; padding:14px; border:1px solid var(--border-color, rgba(120,120,120,.2)); border-radius:14px; }
        .tasks-page .task.done .task-name { text-decoration:line-through; opacity:.6; }
        .tasks-page .check { flex:0 0 28px; width:28px; height:28px; border-radius:8px; border:1px solid currentColor; cursor:pointer; }
        .tasks-page .check.checked { background:var(--accent-color, #16a34a); color:white; }
        .task-content { flex:1; min-width:0; }
        .task-name { display:block; margin-bottom:6px; }
        .task-meta { display:flex; gap:7px; flex-wrap:wrap; align-items:center; font-size:12px; margin-top:6px; }
        .task-actions { display:flex; gap:4px; flex-wrap:wrap; }
        .priority-alta { color:#ef4444; } .priority-média { color:#d97706; } .priority-baixa { color:#16a34a; }
        .deadline.overdue { color:#ef4444; font-weight:700; }
        .task-modal-backdrop { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; padding:16px; background:rgba(0,0,0,.55); }
        .task-modal { width:min(720px, 100%); max-height:90vh; overflow:auto; }
        .task-modal label { display:grid; gap:6px; margin:10px 0; font-size:13px; font-weight:600; }
        .task-modal input, .task-modal select, .task-modal textarea { width:100%; box-sizing:border-box; }
        .task-modal .quick { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
        @media(max-width:650px) { .tasks-page .task { flex-wrap:wrap; } .task-actions { width:100%; justify-content:flex-end; } }
      `}</style>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
