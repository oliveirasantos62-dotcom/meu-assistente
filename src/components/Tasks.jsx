import React, { useMemo, useState } from 'react';
import { getTagIds } from '../utils/analytics';

import { isTaskCancelled, localDateString } from '../utils/taskStatus';
const EMPTY_FORM = {
  name: '',
  description: '',
  priority: 'Média',
  deadline: '',
  frequency: '1x',
  xp: 40,
  projectId: '',
  areaId: '',
  tags: [],
  subtasks: [],
};

const EMPTY_AREA = {
  name: '',
  icon: '📁',
  color: '#6366f1',
};

const PRIORITIES = ['Baixa', 'Média', 'Alta'];
const FREQUENCIES = ['1x', 'Diária', 'Semanal', 'Mensal'];

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

function localDate() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) return '';

  const [year, month, day] = value.split('-');

  return `${day}/${month}/${year}`;
}

export default function Tasks({ data, save, completeTask }) {
  const [tab, setTab] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingAreaId, setEditingAreaId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [areaForm, setAreaForm] = useState(EMPTY_AREA);
  const [observationDrafts, setObservationDrafts] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [collapsedSubtasks, setCollapsedSubtasks] = useState({});

  const tasksList = Array.isArray(data?.tasks) ? data.tasks : [];
  const projectsList = Array.isArray(data?.projects) ? data.projects : [];
  const areasList = Array.isArray(data?.areas) ? data.areas : [];
  const tagsList = Array.isArray(data?.tags) ? data.tags : [];

  // Localiza a área de uma tarefa.
  // Também reconhece tarefas antigas que guardavam o nome em "area".
  const getTaskArea = (task) => {
    return areasList.find(
      (area) =>
        String(area.id) === String(task.areaId) ||
        (task.area && area.name === task.area),
    );
  };

  // =====================================
  // FILTROS
  // =====================================

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');

    const orderedTasks = tasksList
      .map((task, index) => ({ task, index }))
      .sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.task.sortOrder))
          ? Number(a.task.sortOrder)
          : a.index;
        const bOrder = Number.isFinite(Number(b.task.sortOrder))
          ? Number(b.task.sortOrder)
          : b.index;
        return aOrder - bOrder;
      })
      .map(({ task }) => task);

    return orderedTasks.filter((task) => {
      const taskTagNames = getTagIds(task)
        .map(
          (tagId) =>
            tagsList.find((tag) => String(tag.id) === String(tagId))?.name ||
            '',
        )
        .join(' ');

      const matchesSearch =
        !query ||
        String(task.name || '')
          .toLocaleLowerCase('pt-BR')
          .includes(query) ||
        String(task.description || '')
          .toLocaleLowerCase('pt-BR')
          .includes(query) ||
        taskTagNames.toLocaleLowerCase('pt-BR').includes(query);

      const cancelled = isTaskCancelled(task, new Date());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' &&
          !task.done &&
          !isTaskCancelled(task, new Date())) ||
        (filter === 'done' && task.done) ||
        (filter === 'cancelled' && isTaskCancelled(task, new Date())) ||
        (filter === 'overdue' &&
          !task.done &&
          !cancelled &&
          task.deadline &&
          task.deadline < localDate());

      const taskArea = getTaskArea(task);

      const matchesArea =
        areaFilter === 'all' ||
        (areaFilter === 'none'
          ? !taskArea
          : String(taskArea?.id) === String(areaFilter));

      const taskTagIds = getTagIds(task).map(String);
      const matchesTag =
        tagFilter === 'all' || taskTagIds.includes(String(tagFilter));

      return matchesSearch && matchesFilter && matchesArea && matchesTag;
    });
  }, [tasksList, search, filter, areaFilter, tagFilter, areasList, tagsList]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSubtaskToForm = () => {
    const title = String(form.subtaskDraft || '').trim();
    if (!title) return;
    setForm((prev) => ({
      ...prev,
      subtasks: [
        ...(Array.isArray(prev.subtasks) ? prev.subtasks : []),
        {
          id: createId(),
          title,
          done: false,
          createdAt: new Date().toISOString(),
        },
      ],
      subtaskDraft: '',
    }));
  };

  const toggleFormSubtask = (subtaskId) => {
    setForm((prev) => ({
      ...prev,
      subtasks: (Array.isArray(prev.subtasks) ? prev.subtasks : []).map(
        (item) =>
          item.id === subtaskId ? { ...item, done: !item.done } : item,
      ),
    }));
  };

  const deleteFormSubtask = (subtaskId) => {
    setForm((prev) => ({
      ...prev,
      subtasks: (Array.isArray(prev.subtasks) ? prev.subtasks : []).filter(
        (item) => item.id !== subtaskId,
      ),
    }));
  };

  const toggleSubtasksVisibility = (taskId) => {
    setCollapsedSubtasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleTaskSubtask = (task, subtaskId) => {
    const subtasks = (Array.isArray(task.subtasks) ? task.subtasks : []).map(
      (item) => (item.id === subtaskId ? { ...item, done: !item.done } : item),
    );
    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id
          ? { ...item, subtasks, updatedAt: new Date().toISOString() }
          : item,
      ),
    });
  };

  const toggleFormTag = (tagId) => {
    const id = String(tagId);
    setForm((prev) => {
      const current = Array.isArray(prev.tags) ? prev.tags.map(String) : [];
      return {
        ...prev,
        tags: current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      };
    });
  };

  const createTagFromTask = () => {
    const clean = newTagName.trim().replace(/^#/, '');
    if (!clean) return;

    const existing = tagsList.find(
      (tag) =>
        String(tag.name || '')
          .trim()
          .toLowerCase() === clean.toLowerCase(),
    );

    if (existing) {
      toggleFormTag(existing.id);
      setNewTagName('');
      return;
    }

    const tag = {
      id: createId(),
      name: clean,
      color: '#6366f1',
      createdAt: new Date().toISOString(),
    };

    save({ ...data, tags: [...tagsList, tag] });
    setForm((prev) => ({
      ...prev,
      tags: [
        ...(Array.isArray(prev.tags) ? prev.tags.map(String) : []),
        String(tag.id),
      ],
    }));
    setNewTagName('');
  };

  // =====================================
  // TAREFAS
  // =====================================

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setNewTagName('');
    setShowForm(true);
  };

  const openEdit = (task) => {
    const taskArea = getTaskArea(task);

    setEditingId(task.id);

    setForm({
      ...EMPTY_FORM,
      ...task,
      xp: Number(task.xp ?? 40),
      projectId: task.projectId == null ? '' : String(task.projectId),
      areaId: taskArea ? String(taskArea.id) : '',
      tags: getTagIds(task).map(String),
    });

    setNewTagName('');
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
      xp: Math.min(10000, Math.max(0, Number(form.xp) || 0)),
      projectId: form.projectId === '' ? null : form.projectId,
      areaId: form.areaId === '' ? null : form.areaId,
      tags: Array.from(
        new Set(
          (Array.isArray(form.tags) ? form.tags : [])
            .map(String)
            .filter(Boolean),
        ),
      ),
      subtasks: (Array.isArray(form.subtasks) ? form.subtasks : [])
        .map((item) => ({ ...item, title: String(item.title || '').trim() }))
        .filter((item) => item.title),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = editingId
      ? tasksList.map((task) => {
          if (task.id !== editingId) return task;

          return {
            ...task,
            ...taskData,
          };
        })
      : [
          ...tasksList,
          {
            id: createId(),
            ...taskData,
            done: false,
            createdAt: new Date().toISOString(),
          },
        ];

    save({ ...data, tasks: updatedTasks });

    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const toggleTask = (task) => {
    if (isTaskCancelled(task, new Date())) return;

    if (completeTask) {
      completeTask(task.id);
      return;
    }

    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id
          ? {
              ...item,
              done: !item.done,
              completedAt: !item.done ? new Date().toISOString() : null,
            }
          : item,
      ),
    });
  };

  // Observações ficam vinculadas à tarefa recorrente e permanecem salvas
  // até que sejam excluídas manualmente após a resolução.
  const updateObservationDraft = (taskId, value) => {
    setObservationDrafts((current) => ({ ...current, [taskId]: value }));
  };

  const addObservation = (task) => {
    const text = String(observationDrafts[task.id] || '').trim();
    if (!text) return;

    const observation = {
      id: createId(),
      text,
      createdAt: new Date().toISOString(),
    };

    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id
          ? {
              ...item,
              observations: [
                ...(Array.isArray(item.observations) ? item.observations : []),
                observation,
              ],
            }
          : item,
      ),
    });
    updateObservationDraft(task.id, '');
  };

  const deleteObservation = (task, observationId) => {
    if (!window.confirm('Excluir esta observação?')) return;
    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id
          ? {
              ...item,
              observations: (Array.isArray(item.observations)
                ? item.observations
                : []
              ).filter((note) => note.id !== observationId),
            }
          : item,
      ),
    });
  };

  const reorderTasks = (draggedId, targetId, position = 'before') => {
    if (!draggedId || !targetId || String(draggedId) === String(targetId))
      return;

    const ordered = [...tasksList].sort((a, b) => {
      const ai = tasksList.findIndex((item) => item.id === a.id);
      const bi = tasksList.findIndex((item) => item.id === b.id);
      const ao = Number.isFinite(Number(a.sortOrder))
        ? Number(a.sortOrder)
        : ai;
      const bo = Number.isFinite(Number(b.sortOrder))
        ? Number(b.sortOrder)
        : bi;
      return ao - bo;
    });

    const fromIndex = ordered.findIndex(
      (task) => String(task.id) === String(draggedId),
    );
    const targetIndex = ordered.findIndex(
      (task) => String(task.id) === String(targetId),
    );
    if (fromIndex < 0 || targetIndex < 0) return;

    const [moved] = ordered.splice(fromIndex, 1);
    let insertIndex = ordered.findIndex(
      (task) => String(task.id) === String(targetId),
    );
    if (insertIndex < 0) return;
    if (position === 'after') insertIndex += 1;
    ordered.splice(insertIndex, 0, moved);

    const updatedTasks = ordered.map((task, index) => ({
      ...task,
      sortOrder: index,
    }));

    save({ ...data, tasks: updatedTasks });
    setDraggedTaskId(null);
    setDragOverTask(null);
  };

  const handleTaskDragStart = (event, taskId) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleTaskDragOver = (event, taskId) => {
    event.preventDefault();
    if (!draggedTaskId || String(draggedTaskId) === String(taskId)) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDragOverTask({ id: taskId, position });
    event.dataTransfer.dropEffect = 'move';
  };

  const handleTaskDrop = (event, taskId) => {
    event.preventDefault();
    const dragged = event.dataTransfer.getData('text/plain') || draggedTaskId;
    const position =
      dragOverTask?.id === taskId ? dragOverTask.position : 'before';
    reorderTasks(dragged, taskId, position);
  };

  const deleteTask = (id) => {
    if (!window.confirm('Excluir esta tarefa?')) return;

    save({
      ...data,
      tasks: tasksList.filter((task) => task.id !== id),
    });
  };

  const toggleCancelled = (task) => {
    const isCancelled = isTaskCancelled(task, new Date());

    if (isCancelled) {
      save({
        ...data,
        tasks: tasksList.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: 'pending',
                cancelled: false,
                cancellationScope: null,
                cancelledForDate: null,
                cancelledAt: null,
                cancellationReason: '',
              }
            : item,
        ),
      });
      return;
    }

    if (task.done) {
      alert(
        'Uma tarefa concluída não precisa ser cancelada. Reabra-a primeiro se quiser reagendá-la.',
      );
      return;
    }

    const mode = window.prompt(
      'Como deseja cancelar esta tarefa?\n\n1 = Cancelar somente hoje\n2 = Suspender indefinidamente\n\nDigite 1 ou 2:',
      '1',
    );

    if (mode === null) return;
    if (mode !== '1' && mode !== '2') {
      alert(
        'Escolha 1 para cancelar somente hoje ou 2 para suspender indefinidamente.',
      );
      return;
    }

    const reason = window.prompt(
      'Motivo do cancelamento (opcional):',
      task.cancellationReason || '',
    );
    if (reason === null) return;

    const today = localDateString(new Date());
    const indefinite = mode === '2';

    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: indefinite ? 'cancelled' : 'pending',
              cancelled: indefinite,
              cancellationScope: indefinite ? 'indefinite' : 'day',
              cancelledForDate: indefinite ? null : today,
              cancelledAt: new Date().toISOString(),
              cancellationReason: reason.trim(),
            }
          : item,
      ),
    });
  };

  const clearCompleted = () => {
    if (!tasksList.some((task) => task.done)) return;

    if (!window.confirm('Excluir todas as tarefas concluídas?')) return;

    save({
      ...data,
      tasks: tasksList.filter((task) => !task.done),
    });
  };

  const resetDay = () => {
    if (!window.confirm('Reiniciar todas as tarefas?')) return;

    save({
      ...data,
      tasks: tasksList.map((task) => ({
        ...task,
        done: false,
        completedAt: null,
      })),
    });
  };

  // =====================================
  // GERENCIAMENTO DE ÁREAS
  // =====================================

  const openCreateArea = () => {
    setEditingAreaId(null);
    setAreaForm({ ...EMPTY_AREA });
    setShowAreaForm(true);
  };

  const openEditArea = (area) => {
    setEditingAreaId(area.id);

    setAreaForm({
      name: area.name,
      icon: area.icon || '📁',
      color: area.color || '#6366f1',
    });

    setShowAreaForm(true);
  };

  const saveArea = (event) => {
    event.preventDefault();

    const name = areaForm.name.trim();

    if (!name) return;

    const duplicated = areasList.some(
      (area) =>
        area.name.toLocaleLowerCase('pt-BR') ===
          name.toLocaleLowerCase('pt-BR') &&
        String(area.id) !== String(editingAreaId),
    );

    if (duplicated) {
      alert('Já existe uma área com esse nome.');
      return;
    }

    const areaData = {
      name,
      icon: areaForm.icon.trim() || '📁',
      color: areaForm.color,
    };

    const updatedAreas = editingAreaId
      ? areasList.map((area) =>
          String(area.id) === String(editingAreaId)
            ? { ...area, ...areaData }
            : area,
        )
      : [
          ...areasList,
          {
            id: createId(),
            ...areaData,
            createdAt: new Date().toISOString(),
          },
        ];

    save({
      ...data,
      areas: updatedAreas,
    });

    setShowAreaForm(false);
    setEditingAreaId(null);
    setAreaForm({ ...EMPTY_AREA });
  };

  const deleteArea = (area) => {
    const confirmed = window.confirm(
      `Excluir a área "${area.name}"?\n\nAs tarefas vinculadas não serão excluídas. Elas ficarão sem área.`,
    );

    if (!confirmed) return;

    const updatedAreas = areasList.filter(
      (item) => String(item.id) !== String(area.id),
    );

    const updatedTasks = tasksList.map((task) => {
      const taskArea = getTaskArea(task);

      if (taskArea && String(taskArea.id) === String(area.id)) {
        return {
          ...task,
          areaId: null,
          area: null,
        };
      }

      return task;
    });

    save({
      ...data,
      areas: updatedAreas,
      tasks: updatedTasks,
    });

    if (String(areaFilter) === String(area.id)) {
      setAreaFilter('all');
    }
  };

  // =====================================
  // MÉTRICAS
  // =====================================

  const completedCount = tasksList.filter((task) => task.done).length;

  const pendingCount = tasksList.filter(
    (task) => !task.done && task.status !== 'cancelled' && !task.cancelled,
  ).length;

  const cancelledCount = tasksList.filter(
    (task) => task.status === 'cancelled' || task.cancelled === true,
  ).length;

  const overdueCount = tasksList.filter(
    (task) =>
      !task.done &&
      !isTaskCancelled(task, new Date()) &&
      task.deadline &&
      task.deadline < localDate(),
  ).length;

  const recurringTasks = tasksList.filter(
    (task) => (task.frequency || '1x') !== '1x',
  );

  const getAreaCount = (areaId) =>
    tasksList.filter((task) => {
      const area = getTaskArea(task);

      return area && String(area.id) === String(areaId);
    }).length;

  return (
    <div className='card tasks-page'>
      {/* CABEÇALHO */}
      <div className='section-title'>
        <div>
          <h2>📋 Tarefas</h2>
          <p className='subtitle'>
            Organize suas atividades, prazos e prioridades.
          </p>
        </div>

        <button type='button' className='primary' onClick={openCreate}>
          ＋ Nova tarefa
        </button>
      </div>

      {/* INDICADORES */}
      <div className='metrics personal-metrics'>
        <div className='reward'>
          <strong>{tasksList.length}</strong>
          <small>📋 Total</small>
        </div>

        <div className='reward'>
          <strong>{pendingCount}</strong>
          <small>⏳ Pendentes</small>
        </div>

        <div className='reward'>
          <strong>{completedCount}</strong>
          <small>✅ Concluídas</small>
        </div>

        <div className='reward'>
          <strong>{overdueCount}</strong>
          <small>⚠️ Atrasadas</small>
        </div>

        <div className='reward'>
          <strong>{cancelledCount}</strong>
          <small>⏸️ Canceladas</small>
        </div>
      </div>

      {/* ABAS */}
      <div className='tabs'>
        <button
          type='button'
          className={tab === 'tasks' ? 'active' : ''}
          onClick={() => setTab('tasks')}
        >
          Lista
        </button>

        <button
          type='button'
          className={tab === 'daily' ? 'active' : ''}
          onClick={() => setTab('daily')}
        >
          Recorrentes ({recurringTasks.length})
        </button>

        <button
          type='button'
          className={tab === 'areas' ? 'active' : ''}
          onClick={() => setTab('areas')}
        >
          📂 Áreas ({areasList.length})
        </button>
      </div>

      {/* ABA DE TAREFAS */}
      {tab === 'tasks' && (
        <>
          <div className='tasks-toolbar'>
            <div className='filter-field search-field'>
              <label htmlFor='task-search'>Pesquisar</label>

              <input
                id='task-search'
                type='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar tarefa ou descrição...'
                aria-label='Buscar tarefas'
              />
            </div>

            <div className='filter-field'>
              <label htmlFor='task-status-filter'>Status</label>

              <select
                id='task-status-filter'
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label='Filtrar por status'
              >
                <option value='all'>Todos os status</option>
                <option value='pending'>Pendentes</option>
                <option value='done'>Concluídas</option>
                <option value='cancelled'>Canceladas</option>
                <option value='overdue'>Atrasadas</option>
              </select>
            </div>

            <div className='filter-field'>
              <label htmlFor='task-area-filter'>Áreas</label>

              <select
                id='task-area-filter'
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                aria-label='Filtrar por área'
              >
                <option value='all'>Todas as áreas</option>
                <option value='none'>Sem área</option>

                {areasList.map((area) => (
                  <option key={area.id} value={String(area.id)}>
                    {area.icon} {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='filter-field'>
              <label htmlFor='task-tag-filter'>Tags</label>
              <select
                id='task-tag-filter'
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                aria-label='Filtrar por tag'
              >
                <option value='all'>Todas as tags</option>
                {tagsList.map((tag) => (
                  <option key={tag.id} value={String(tag.id)}>
                    #{tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className='tasks-order-hint'>
            ↕️ Arraste pelo ícone ⋮⋮ para definir a ordem das tarefas. A ordem
            fica salva e continua a mesma ao voltar para a página.
          </p>

          <div className='tasks-list'>
            {visibleTasks.map((task) => {
              const project = projectsList.find(
                (p) => String(p.id) === String(task.projectId),
              );

              const area = getTaskArea(task);

              const cancelled = isTaskCancelled(task, new Date());
              const indefinitelySuspended =
                task?.status === 'cancelled' ||
                task?.cancelled === true ||
                task?.cancellationScope === 'indefinite';

              const overdue =
                !task.done &&
                !cancelled &&
                task.deadline &&
                task.deadline < localDate();

              return (
                <article
                  className={`task ${task.done ? 'done' : ''} ${cancelled ? 'cancelled' : ''} ${draggedTaskId === task.id ? 'task-dragging' : ''} ${dragOverTask?.id === task.id && dragOverTask.position === 'before' ? 'task-drag-over-before' : ''} ${dragOverTask?.id === task.id && dragOverTask.position === 'after' ? 'task-drag-over-after' : ''}`}
                  key={task.id}
                  draggable
                  onDragStart={(event) => handleTaskDragStart(event, task.id)}
                  onDragOver={(event) => handleTaskDragOver(event, task.id)}
                  onDrop={(event) => handleTaskDrop(event, task.id)}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverTask(null);
                  }}
                >
                  <button
                    type='button'
                    className='task-drag-handle'
                    draggable={false}
                    onClick={(event) => event.preventDefault()}
                    aria-label={`Arrastar tarefa: ${task.name}`}
                    title='Arraste para reorganizar'
                  >
                    ⋮⋮
                  </button>

                  <button
                    type='button'
                    className={`task-completion-button ${task.done ? 'is-done' : 'is-pending'}`}
                    onClick={() => toggleTask(task)}
                    aria-label={
                      task.done
                        ? `Reabrir tarefa: ${task.name}`
                        : `Marcar como concluída: ${task.name}`
                    }
                    aria-pressed={Boolean(task.done)}
                    title={
                      task.done
                        ? 'Clique para reabrir esta tarefa'
                        : 'Clique para concluir esta tarefa'
                    }
                  >
                    <span className='completion-icon' aria-hidden='true'>
                      {task.done ? '✓' : '○'}
                    </span>
                  </button>

                  <div className='task-content'>
                    <div className='task-title-row'>
                      <strong className='task-name'>
                        {task.name}
                        {cancelled && (
                          <span className='status-chip status-cancelled'>
                            {indefinitelySuspended
                              ? '⏸️ Suspensa'
                              : '⏸️ Cancelada hoje'}
                          </span>
                        )}
                      </strong>
                      {Array.isArray(task.subtasks) &&
                        task.subtasks.length > 0 && (
                          <button
                            type='button'
                            className={`task-subtasks-toggle ${collapsedSubtasks[task.id] ? 'is-collapsed' : ''}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSubtasksVisibility(task.id);
                            }}
                            onMouseDown={(event) => event.stopPropagation()}
                            draggable={false}
                            aria-label={`${collapsedSubtasks[task.id] ? 'Mostrar' : 'Ocultar'} subtarefas de ${task.name}`}
                            aria-expanded={!collapsedSubtasks[task.id]}
                            title={
                              collapsedSubtasks[task.id]
                                ? 'Mostrar subtarefas'
                                : 'Ocultar subtarefas'
                            }
                          >
                            <span aria-hidden='true'>
                              {collapsedSubtasks[task.id] ? '▸' : '▾'}
                            </span>
                          </button>
                        )}
                    </div>

                    {task.description && (
                      <p className='subtitle'>{task.description}</p>
                    )}

                    {Array.isArray(task.subtasks) &&
                      task.subtasks.length > 0 &&
                      !collapsedSubtasks[task.id] && (
                        <div className='task-subtasks'>
                          <div className='task-subtasks-heading'>
                            <strong>Subtarefas</strong>
                            <small>
                              {task.subtasks.filter((item) => item.done).length}
                              /{task.subtasks.length} concluídas
                            </small>
                          </div>
                          <div className='task-subtasks-list'>
                            {task.subtasks.map((subtask) => (
                              <label
                                className={`task-subtask ${subtask.done ? 'is-done' : ''}`}
                                key={subtask.id}
                              >
                                <input
                                  type='checkbox'
                                  checked={Boolean(subtask.done)}
                                  onChange={() =>
                                    toggleTaskSubtask(task, subtask.id)
                                  }
                                />
                                <span>{subtask.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className='task-meta'>
                      <span
                        className={`priority priority-${String(
                          task.priority || 'Média',
                        ).toLowerCase()}`}
                      >
                        ● {task.priority || 'Média'}
                      </span>

                      <span className='value'>{Number(task.xp) || 0} XP</span>

                      <span className='frequency'>
                        {task.frequency || '1x'}
                      </span>

                      {area && (
                        <span
                          className='task-area'
                          style={{
                            '--area-color': area.color || '#6366f1',
                          }}
                        >
                          {area.icon} {area.name}
                        </span>
                      )}

                      {cancelled && task.cancellationReason && (
                        <span className='task-cancellation-reason'>
                          Motivo: {task.cancellationReason}
                        </span>
                      )}

                      {task.deadline && (
                        <span
                          className={overdue ? 'deadline overdue' : 'deadline'}
                        >
                          📅 {formatDate(task.deadline)}
                          {overdue ? ' · Atrasada' : ''}
                        </span>
                      )}

                      {project && (
                        <span className='tag'>🚀 {project.name}</span>
                      )}

                      {getTagIds(task).map((tagId) => {
                        const taskTag = tagsList.find(
                          (item) => String(item.id) === String(tagId),
                        );
                        if (!taskTag) return null;
                        return (
                          <button
                            type='button'
                            key={String(tagId)}
                            className='task-tag-chip'
                            style={{
                              '--tag-color': taskTag.color || '#6366f1',
                            }}
                            onClick={() => setTagFilter(String(tagId))}
                            title={`Filtrar por #${taskTag.name}`}
                          >
                            #{taskTag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className='task-actions'>
                    <button
                      type='button'
                      className='ghost'
                      onClick={() => toggleCancelled(task)}
                      title={
                        cancelled ? 'Reativar tarefa' : 'Cancelar sem excluir'
                      }
                    >
                      {cancelled ? '▶️ Reativar' : '⏸️ Cancelar'}
                    </button>

                    <button
                      type='button'
                      className='ghost'
                      onClick={() => openEdit(task)}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      type='button'
                      className='ghost'
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Excluir ${task.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              );
            })}

            {visibleTasks.length === 0 && (
              <p className='subtitle'>
                Nenhuma tarefa encontrada com esses filtros.
              </p>
            )}
          </div>

          <div className='quick' style={{ marginTop: 14 }}>
            <button type='button' onClick={openCreate}>
              ➕ Adicionar
            </button>

            <button type='button' onClick={clearCompleted}>
              🧹 Limpar concluídas
            </button>

            <button type='button' onClick={resetDay}>
              🔄 Reiniciar dia
            </button>
          </div>
        </>
      )}

      {/* ABA DE RECORRENTES */}
      {tab === 'daily' && (
        <div className='daily'>
          {recurringTasks.length ? (
            recurringTasks.map((task) => {
              const area = getTaskArea(task);

              return (
                <div className='daily-row' key={task.id}>
                  <div className='daily-task-content'>
                    <div className='daily-task-heading'>
                      <div>
                        <strong>{task.name}</strong>
                        {area && (
                          <small className='subtitle'>
                            {area.icon} {area.name}
                          </small>
                        )}
                      </div>
                      <strong>{task.frequency}</strong>
                    </div>

                    <div className='observation-panel'>
                      <strong>📝 Observações para consultar depois</strong>
                      {(Array.isArray(task.observations)
                        ? task.observations
                        : []
                      ).length > 0 ? (
                        <ul className='observation-list'>
                          {task.observations.map((observation) => (
                            <li key={observation.id}>
                              <span>{observation.text}</span>
                              <button
                                type='button'
                                className='ghost observation-delete'
                                onClick={() =>
                                  deleteObservation(task, observation.id)
                                }
                                aria-label='Excluir observação resolvida'
                                title='Excluir quando estiver resolvido'
                              >
                                🗑️
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <small className='subtitle'>
                          Nenhuma observação registrada.
                        </small>
                      )}
                      <div className='observation-entry'>
                        <input
                          type='text'
                          value={observationDrafts[task.id] || ''}
                          onChange={(event) =>
                            updateObservationDraft(task.id, event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addObservation(task);
                            }
                          }}
                          placeholder='Anote algo para lembrar futuramente...'
                          aria-label={`Nova observação para ${task.name}`}
                        />
                        <button
                          type='button'
                          className='ghost'
                          onClick={() => addObservation(task)}
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='task-actions'>
                    <button
                      type='button'
                      className='ghost'
                      onClick={() => openEdit(task)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className='subtitle'>
              Nenhuma tarefa recorrente. Edite uma tarefa e escolha a
              frequência.
            </p>
          )}
        </div>
      )}

      {/* ABA DE ÁREAS */}
      {tab === 'areas' && (
        <div className='areas-section'>
          <div className='section-title'>
            <div>
              <h3>📂 Minhas áreas</h3>

              <p className='subtitle'>
                Crie espaços para organizar diferentes partes da sua vida.
              </p>
            </div>

            <button type='button' className='primary' onClick={openCreateArea}>
              ＋ Nova área
            </button>
          </div>

          {areasList.length > 0 ? (
            <div className='areas-grid'>
              {areasList.map((area) => (
                <article
                  className='area-card'
                  key={area.id}
                  style={{
                    '--area-color': area.color || '#6366f1',
                  }}
                >
                  <div className='area-card-top'>
                    <div className='area-icon'>{area.icon || '📁'}</div>

                    <div className='area-actions'>
                      <button
                        type='button'
                        className='ghost'
                        onClick={() => openEditArea(area)}
                        aria-label={`Editar área ${area.name}`}
                      >
                        ✏️
                      </button>

                      <button
                        type='button'
                        className='ghost'
                        onClick={() => deleteArea(area)}
                        aria-label={`Excluir área ${area.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3>{area.name}</h3>

                  <p className='subtitle'>{getAreaCount(area.id)} tarefa(s)</p>

                  <button
                    type='button'
                    className='area-filter-button'
                    onClick={() => {
                      setAreaFilter(String(area.id));
                      setTab('tasks');
                    }}
                  >
                    Ver tarefas →
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className='empty-areas'>
              <span>📂</span>

              <h3>Nenhuma área criada</h3>

              <p className='subtitle'>
                Crie sua primeira área para começar a organizar suas tarefas.
              </p>

              <button
                type='button'
                className='primary'
                onClick={openCreateArea}
              >
                Criar primeira área
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE TAREFAS */}
      {showForm && (
        <div
          className='task-modal-backdrop'
          role='presentation'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <form
            className='task-modal card'
            onSubmit={saveTask}
            aria-label={editingId ? 'Editar tarefa' : 'Nova tarefa'}
          >
            <div className='section-title'>
              <h2>{editingId ? '✏️ Editar tarefa' : '➕ Nova tarefa'}</h2>

              <button
                type='button'
                className='ghost'
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <label>
              Nome da tarefa *
              <input
                autoFocus
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder='Ex.: Estudar Java'
              />
            </label>

            <label>
              Descrição
              <textarea
                rows='2'
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder='O que precisa ser feito?'
              />
            </label>

            <section className='subtask-editor' aria-label='Subtarefas'>
              <div className='subtask-editor-title'>
                <strong>☑️ Subtarefas</strong>
                <small>
                  {
                    (Array.isArray(form.subtasks) ? form.subtasks : []).filter(
                      (item) => item.done,
                    ).length
                  }
                  /{(Array.isArray(form.subtasks) ? form.subtasks : []).length}
                </small>
              </div>
              {(Array.isArray(form.subtasks) ? form.subtasks : []).map(
                (subtask) => (
                  <div className='subtask-edit-row' key={subtask.id}>
                    <input
                      type='checkbox'
                      checked={Boolean(subtask.done)}
                      onChange={() => toggleFormSubtask(subtask.id)}
                      aria-label={`Concluir ${subtask.title}`}
                    />
                    <span className={subtask.done ? 'is-done' : ''}>
                      {subtask.title}
                    </span>
                    <button
                      type='button'
                      className='ghost'
                      onClick={() => deleteFormSubtask(subtask.id)}
                      aria-label={`Excluir ${subtask.title}`}
                    >
                      🗑️
                    </button>
                  </div>
                ),
              )}
              <div className='subtask-add-row'>
                <input
                  type='text'
                  value={form.subtaskDraft || ''}
                  onChange={(e) => updateForm('subtaskDraft', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubtaskToForm();
                    }
                  }}
                  placeholder='Digite uma subtarefa...'
                  aria-label='Nome da nova subtarefa'
                />
                <button
                  type='button'
                  className='secondary'
                  onClick={addSubtaskToForm}
                >
                  ＋ Adicionar
                </button>
              </div>
            </section>

            <div className='form-grid'>
              <label>
                Prioridade
                <select
                  value={form.priority}
                  onChange={(e) => updateForm('priority', e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label>
                Prazo
                <input
                  type='date'
                  value={form.deadline || ''}
                  onChange={(e) => updateForm('deadline', e.target.value)}
                />
              </label>

              <label>
                Frequência
                <select
                  value={form.frequency}
                  onChange={(e) => updateForm('frequency', e.target.value)}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>

              <label>
                Recompensa XP
                <input
                  type='number'
                  min='0'
                  max='10000'
                  value={form.xp}
                  onChange={(e) => updateForm('xp', e.target.value)}
                />
              </label>

              <label>
                Projeto relacionado
                <select
                  value={form.projectId}
                  onChange={(e) => updateForm('projectId', e.target.value)}
                >
                  <option value=''>Nenhum</option>

                  {projectsList.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Área
                <select
                  value={form.areaId}
                  onChange={(e) => updateForm('areaId', e.target.value)}
                >
                  <option value=''>Sem área</option>

                  {areasList.map((area) => (
                    <option key={area.id} value={String(area.id)}>
                      {area.icon} {area.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className='task-tags-field'>
              <div className='task-tags-heading'>
                <span>🏷️ Tags</span>
                <small>
                  Use tags para conectar a tarefa a estudos, objetivos, hábitos,
                  projetos e relatórios.
                </small>
              </div>

              {tagsList.length ? (
                <div className='task-tag-picker'>
                  {tagsList.map((tag) => {
                    const active = (form.tags || [])
                      .map(String)
                      .includes(String(tag.id));
                    return (
                      <button
                        type='button'
                        key={tag.id}
                        className={`task-tag-option ${active ? 'active' : ''}`}
                        style={{ '--tag-color': tag.color || '#6366f1' }}
                        onClick={() => toggleFormTag(tag.id)}
                        aria-pressed={active}
                      >
                        <span className='task-tag-dot' />#{tag.name}
                        {active && <b>✓</b>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className='subtitle'>Nenhuma tag criada ainda.</p>
              )}

              <div className='task-tag-create'>
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder='Nova tag, ex.: #Concurso'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createTagFromTask();
                    }
                  }}
                />
                <button
                  type='button'
                  className='ghost'
                  onClick={createTagFromTask}
                >
                  + Criar tag
                </button>
              </div>
            </div>

            {areasList.length === 0 && (
              <p className='subtitle'>
                Você ainda não criou áreas. É possível criar uma na aba Áreas.
              </p>
            )}

            <div className='quick'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                {editingId ? 'Salvar alterações' : 'Criar tarefa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE ÁREAS */}
      {showAreaForm && (
        <div
          className='task-modal-backdrop'
          role='presentation'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAreaForm(false);
          }}
        >
          <form
            className='task-modal card area-modal'
            onSubmit={saveArea}
            aria-label={editingAreaId ? 'Editar área' : 'Criar área'}
          >
            <div className='section-title'>
              <h2>{editingAreaId ? '✏️ Editar área' : '📂 Nova área'}</h2>

              <button
                type='button'
                className='ghost'
                onClick={() => setShowAreaForm(false)}
              >
                ✕
              </button>
            </div>

            <label>
              Nome da área *
              <input
                autoFocus
                required
                maxLength={50}
                value={areaForm.name}
                onChange={(e) =>
                  setAreaForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder='Ex.: Desenvolvimento'
              />
            </label>

            <label>
              Ícone (emoji)
              <input
                maxLength={8}
                value={areaForm.icon}
                onChange={(e) =>
                  setAreaForm((prev) => ({
                    ...prev,
                    icon: e.target.value,
                  }))
                }
                placeholder='📁'
              />
            </label>

            <label>
              Cor da área
              <div className='area-color-control'>
                <input
                  type='color'
                  value={areaForm.color}
                  onChange={(e) =>
                    setAreaForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />

                <span>{areaForm.color}</span>
              </div>
            </label>

            <div className='area-preview'>
              <span>{areaForm.icon || '📁'}</span>

              <strong>{areaForm.name || 'Nome da área'}</strong>

              <div
                className='area-preview-dot'
                style={{ background: areaForm.color }}
              />
            </div>

            <div className='quick'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowAreaForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                {editingAreaId ? 'Salvar alterações' : 'Criar área'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ESTILIZAÇÃO */}
      <style>{`
        .tasks-page {
          min-width: 0;
        }

        .tasks-page .section-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* FILTROS */

        .tasks-page .tasks-toolbar {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) minmax(160px, 200px) minmax(160px, 220px);
          gap: 14px;
          width: 100%;
          margin: 20px 0;
          padding: 0;
          align-items: end;
          box-sizing: border-box;
          overflow: visible;
          position: relative;
          z-index: 1;
        }

        .tasks-page .filter-field {
          display: flex !important;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-end;
          gap: 7px;
          width: 100%;
          min-width: 0;
          opacity: 1 !important;
          visibility: visible !important;
          overflow: visible;
        }

        .tasks-page .filter-field label {
          display: block !important;
          position: static !important;
          visibility: visible !important;
          opacity: 1 !important;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          margin: 0;
          color: inherit;
        }

        .tasks-page .tasks-toolbar input,
        .tasks-page .tasks-toolbar select {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: static !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100%;
          height: 44px;
          box-sizing: border-box;
          margin: 0;
          flex: none;
          font: inherit;
        }

        .tasks-page .tasks-toolbar input {
          padding: 0 12px;
        }

        .tasks-page .tasks-toolbar select {
          padding: 0 30px 0 12px;
          cursor: pointer;
          appearance: auto;
        }

        .tasks-list {
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .tasks-page .task {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--border-color, rgba(120,120,120,.2));
          border-radius: 14px;
          min-width: 0;
        }

        .tasks-page .task.done .task-name {
          text-decoration: line-through;
          opacity: .6;
        }

        .tasks-page .task-subtasks-toggle {
          width: 24px;
          height: 24px;
          min-width: 24px;
          min-height: 24px;
          flex: 0 0 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid var(--border-color, rgba(120,120,120,.3));
          border-radius: 7px;
          background: transparent;
          color: var(--text-secondary, inherit);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease, transform .18s ease;
        }

        .tasks-page .task-subtasks-toggle:hover {
          background: var(--hover-bg, rgba(120,120,120,.10));
          border-color: var(--accent-color, #6366f1);
        }

        .tasks-page .task-subtasks-toggle:focus-visible {
          outline: 2px solid var(--accent-color, #6366f1);
          outline-offset: 2px;
        }

        .tasks-page .task-completion-button {
          flex: 0 0 auto;
          width: 24px;
          height: 24px;
          min-width: 24px;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 0;
          border: 1px solid var(--accent-color, #6366f1);
          border-radius: 50%;
          background: color-mix(in srgb, var(--accent-color, #6366f1) 10%, transparent);
          color: var(--accent-color, #6366f1);
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition: background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease, box-shadow .18s ease;
        }

        .tasks-page .task-completion-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0,0,0,.10);
        }

        .tasks-page .task-completion-button:active {
          transform: scale(.97);
        }

        .tasks-page .task-completion-button:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--accent-color, #6366f1) 30%, transparent);
          outline-offset: 2px;
        }

        .tasks-page .task-completion-button.is-done {
          border-color: #16a34a;
          background: #16a34a;
          color: #fff;
        }

        .tasks-page .task-completion-button.is-done:hover {
          border-color: #15803d;
          background: #15803d;
        }

        .tasks-page .completion-icon {
          width: 100%;
          height: 100%;
          display: inline-grid;
          place-items: center;
          border: 1.5px solid currentColor;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 900;
        }

        .tasks-page .task-subtasks { flex: 1 0 100%; min-width: 0; margin-top: 8px; padding: 10px 12px; border: 1px solid var(--border-color, rgba(120,120,120,.2)); border-radius: 10px; }
        .tasks-page .task-subtasks-heading, .tasks-page .subtask-editor-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 7px; }
        .tasks-page .task-subtasks-heading small, .tasks-page .subtask-editor-title small { opacity: .7; }
        .tasks-page .task-subtasks-list { display: grid; gap: 6px; }
        .tasks-page .task-subtask { display: flex; align-items: center; gap: 8px; font-size: .92em; cursor: pointer; }
        .tasks-page .task-subtask input, .tasks-page .subtask-edit-row input[type='checkbox'] { width: 16px; height: 16px; flex: 0 0 auto; }
        .tasks-page .task-subtask.is-done span, .tasks-page .subtask-edit-row .is-done { text-decoration: line-through; opacity: .6; }
        .tasks-page .subtask-editor { display: grid; gap: 8px; padding: 12px; border: 1px solid var(--border-color, rgba(120,120,120,.2)); border-radius: 12px; }
        .tasks-page .subtask-edit-row, .tasks-page .subtask-add-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .tasks-page .subtask-edit-row span { flex: 1; overflow-wrap: anywhere; }
        .tasks-page .subtask-add-row input { flex: 1; min-width: 0; }

        .tasks-page .is-done .completion-icon {
          border-color: rgba(255,255,255,.9);
        }

        .task-content {
          flex: 1;
          min-width: 0;
        }

        .task-name {
          display: block;
          margin-bottom: 6px;
          overflow-wrap: anywhere;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          min-width: 0;
        }

        .task-title-row .task-name {
          margin: 0;
        }


        .task-meta {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          align-items: center;
          font-size: 12px;
          margin-top: 6px;
        }

        .task-actions {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .priority-alta {
          color: #ef4444;
        }

        .priority-média {
          color: #d97706;
        }

        .priority-baixa {
          color: #16a34a;
        }

        .deadline.overdue {
          color: #ef4444;
          font-weight: 700;
        }

        .task-area {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--area-color);
          background: color-mix(in srgb, var(--area-color) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--area-color) 30%, transparent);
          border-radius: 20px;
          padding: 3px 9px;
          font-weight: 600;
        }

        .daily-task-content {
          flex: 1;
          min-width: 0;
        }

        .daily-task-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .daily-task-heading > div {
          display: grid;
          gap: 4px;
        }

        .observation-panel {
          display: grid;
          gap: 9px;
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--accent-color, #6366f1) 6%, transparent);
          border: 1px solid var(--border-color, rgba(120,120,120,.2));
        }

        .observation-list {
          display: grid;
          gap: 7px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .observation-list li {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--card-background, rgba(120,120,120,.07));
        }

        .observation-list li span {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .observation-delete {
          flex: 0 0 auto;
          padding: 2px 6px;
        }

        .observation-entry {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .observation-entry input {
          flex: 1;
          min-width: 0;
        }

        /* ÁREAS */

        .areas-section {
          margin-top: 15px;
        }

        .areas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .area-card {
          border: 1px solid var(--border-color, rgba(120,120,120,.2));
          border-top: 3px solid var(--area-color);
          border-radius: 14px;
          padding: 16px;
          transition: transform .2s, box-shadow .2s;
          min-width: 0;
        }

        .area-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 7px 20px rgba(0,0,0,.08);
        }

        .area-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .area-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          font-size: 25px;
          background: color-mix(in srgb, var(--area-color) 12%, transparent);
          border-radius: 12px;
        }

        .area-actions {
          display: flex;
          gap: 2px;
        }

        .area-card h3 {
          margin: 14px 0 5px;
          overflow-wrap: anywhere;
        }

        .area-card .subtitle {
          margin: 0;
          font-size: 13px;
        }

        .area-filter-button {
          margin-top: 15px;
          border: 0;
          background: none;
          color: var(--area-color);
          cursor: pointer;
          font-weight: 700;
          padding: 5px 0;
        }

        .empty-areas {
          text-align: center;
          padding: 40px 15px;
        }

        .empty-areas > span {
          font-size: 42px;
        }

        .empty-areas h3 {
          margin-bottom: 5px;
        }

        /* MODAIS */

        .task-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(0,0,0,.55);
        }

        .task-modal {
          width: min(720px, 100%);
          max-height: 90vh;
          overflow: auto;
        }

        .task-modal label {
          display: grid;
          gap: 6px;
          margin: 10px 0;
          font-size: 13px;
          font-weight: 600;
        }

        .task-modal input,
        .task-modal select,
        .task-modal textarea {
          width: 100%;
          box-sizing: border-box;
        }

        .task-modal .quick {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px 14px;
        }

        .area-color-control {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .area-color-control input[type="color"] {
          width: 55px;
          height: 40px;
          padding: 3px;
          cursor: pointer;
        }

        .area-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--border-color, rgba(120,120,120,.2));
          border-radius: 12px;
          margin: 18px 0;
        }

        .area-preview span {
          font-size: 28px;
        }

        .area-preview-dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          margin-left: auto;
        }

        .daily-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid var(--border-color, rgba(120,120,120,.2));
        }

        .daily-row > div {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        /* TABLETS */

        @media (max-width: 850px) {
          .tasks-page .tasks-toolbar {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }

          .tasks-page .search-field {
            grid-column: 1 / -1;
          }
        }

        /* CELULARES */

        @media (max-width: 520px) {
          .tasks-page .tasks-toolbar {
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
          }

          .tasks-page .search-field {
            grid-column: auto;
          }

          .tasks-page .task {
            flex-wrap: wrap;
          }

          .task-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .daily-row {
            flex-wrap: wrap;
          }

          .observation-entry {
            align-items: stretch;
            flex-direction: column;
          }

          .observation-entry button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
