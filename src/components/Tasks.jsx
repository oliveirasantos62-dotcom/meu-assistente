import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTagIds } from '../utils/analytics';

import { isTaskCancelled, localDateString } from '../utils/taskStatus';
const EMPTY_FORM = {
  name: '',
  description: '',
  priority: 'Média',
  deadline: '',
  frequency: '1x',
  xp: 40,
  estimatedMinutes: '',
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

function updateSubtaskTree(items, targetId, updater) {
  return (Array.isArray(items) ? items : []).map((item) =>
    String(item.id) === String(targetId)
      ? updater(item)
      : {
          ...item,
          subtasks: updateSubtaskTree(item.subtasks, targetId, updater),
        },
  );
}
function removeSubtaskTree(items, targetId) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => String(item.id) !== String(targetId))
    .map((item) => ({
      ...item,
      subtasks: removeSubtaskTree(item.subtasks, targetId),
    }));
}
function extractSubtaskTree(items, targetId) {
  const list = Array.isArray(items) ? items : [];

  for (let index = 0; index < list.length; index++) {
    const item = list[index];

    if (String(item.id) === String(targetId)) {
      return {
        items: list.filter((_, i) => i !== index),
        found: item,
      };
    }

    const result = extractSubtaskTree(item.subtasks, targetId);

    if (result.found) {
      return {
        items: list.map((current, i) =>
          i === index ? { ...current, subtasks: result.items } : current,
        ),
        found: result.found,
      };
    }
  }

  return { items: list, found: null };
}
function resetSubtaskTree(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    done: false,
    subtasks: resetSubtaskTree(item.subtasks),
  }));
}
function countSubtasks(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (n, item) => n + 1 + countSubtasks(item.subtasks),
    0,
  );
}
function countCompletedSubtasks(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (n, item) =>
      n + (item.done ? 1 : 0) + countCompletedSubtasks(item.subtasks),
    0,
  );
}

export default function Tasks({ data, save, completeTask }) {
  const [tab, setTab] = useState('tasks');
  const [viewMode, setViewMode] = useState('list');
  const [filter, setFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const resetModalRef = useRef(null);

  useEffect(() => {
    if (!showResetModal) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() =>
      resetModalRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      }),
    );
  }, [showResetModal]);
  const [subtaskDrafts, setSubtaskDrafts] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editingAreaId, setEditingAreaId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [areaForm, setAreaForm] = useState(EMPTY_AREA);
  const [observationDrafts, setObservationDrafts] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [collapsedSubtasks, setCollapsedSubtasks] = useState({});
  const [collapsedSubtaskNotes, setCollapsedSubtaskNotes] = useState({});
  const [subtaskFilters, setSubtaskFilters] = useState({});
  const [editingSubtaskNoteId, setEditingSubtaskNoteId] = useState(null);
  const [draggedSubtask, setDraggedSubtask] = useState(null);
  const [dragOverSubtask, setDragOverSubtask] = useState(null);

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

  const addSubtaskToForm = (parentId = null) => {
    const title = String(
      parentId ? subtaskDrafts[parentId] || '' : form.subtaskDraft || '',
    ).trim();
    if (!title) return;
    const child = {
      id: createId(),
      title,
      done: false,
      note: '',
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    setForm((prev) => ({
      ...prev,
      subtasks: parentId
        ? updateSubtaskTree(prev.subtasks, parentId, (item) => ({
            ...item,
            subtasks: [
              ...(Array.isArray(item.subtasks) ? item.subtasks : []),
              child,
            ],
          }))
        : [...(Array.isArray(prev.subtasks) ? prev.subtasks : []), child],
      subtaskDraft: parentId ? prev.subtaskDraft : '',
    }));
    if (parentId) setSubtaskDrafts((prev) => ({ ...prev, [parentId]: '' }));
  };
  const toggleFormSubtask = (id) =>
    setForm((prev) => ({
      ...prev,
      subtasks: updateSubtaskTree(prev.subtasks, id, (item) => ({
        ...item,
        done: !item.done,
      })),
    }));
  const updateFormSubtask = (id, changes) =>
    setForm((prev) => ({
      ...prev,
      subtasks: updateSubtaskTree(prev.subtasks, id, (item) => ({
        ...item,
        ...changes,
      })),
    }));
  const deleteFormSubtask = (id) =>
    setForm((prev) => ({
      ...prev,
      subtasks: removeSubtaskTree(prev.subtasks, id),
    }));
  const renderSubtaskEditor = (items, depth = 0) =>
    (Array.isArray(items) ? items : []).map((subtask) => (
      <div
        className='subtask-edit-item'
        key={subtask.id}
        style={{
          marginLeft: depth ? 18 : 0,
          borderLeft: depth ? '2px solid var(--border-color, #888)' : undefined,
          paddingLeft: depth ? 10 : undefined,
        }}
      >
        <div className='subtask-edit-row'>
          <input
            type='checkbox'
            checked={Boolean(subtask.done)}
            onChange={() => toggleFormSubtask(subtask.id)}
            aria-label={`Concluir ${subtask.title}`}
          />
          <input
            className='subtask-edit-name'
            type='text'
            value={subtask.title || ''}
            maxLength={160}
            onChange={(e) =>
              updateFormSubtask(subtask.id, { title: e.target.value })
            }
            placeholder='Nome da subtarefa'
            aria-label='Nome da subtarefa'
          />
          <button
            type='button'
            className='ghost subtask-note-action'
            onClick={() =>
              setEditingSubtaskNoteId((current) =>
                String(current) === String(subtask.id) ? null : subtask.id,
              )
            }
            aria-label='Mostrar ou ocultar nota e subdivisões'
            title='Mostrar/ocultar nota e subdivisões'
          >
            📝
          </button>
          <button
            type='button'
            className='ghost subtask-delete-action'
            onClick={() => deleteFormSubtask(subtask.id)}
            aria-label={`Excluir ${subtask.title}`}
            title='Excluir subtarefa'
          >
            🗑️
          </button>
        </div>
        {String(editingSubtaskNoteId) === String(subtask.id) && (
          <>
            <textarea
              className='subtask-edit-note'
              rows='2'
              value={subtask.note || ''}
              onChange={(e) =>
                updateFormSubtask(subtask.id, { note: e.target.value })
              }
              placeholder='Escreva uma nota...'
              aria-label={`Nota da subtarefa ${subtask.title || ''}`}
            />
            {renderSubtaskEditor(subtask.subtasks, depth + 1)}
            <div className='subtask-add-row nested-subtask-add-row'>
              <input
                type='text'
                value={subtaskDrafts[subtask.id] || ''}
                onChange={(e) =>
                  setSubtaskDrafts((prev) => ({
                    ...prev,
                    [subtask.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtaskToForm(subtask.id);
                  }
                }}
                placeholder='Adicionar subsubtarefa...'
                aria-label={`Nova subdivisão de ${subtask.title}`}
              />
              <button
                type='button'
                className='secondary'
                onClick={() => addSubtaskToForm(subtask.id)}
              >
                ＋
              </button>
            </div>
          </>
        )}
      </div>
    ));

  const toggleSubtasksVisibility = (taskId) => {
    setCollapsedSubtasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleTaskSubtask = (task, subtaskId) => {
    const subtasks = updateSubtaskTree(task.subtasks, subtaskId, (item) => ({
      ...item,
      done: !item.done,
    }));
    save({
      ...data,
      tasks: tasksList.map((item) =>
        item.id === task.id
          ? { ...item, subtasks, updatedAt: new Date().toISOString() }
          : item,
      ),
    });
  };

  const updateTaskSubtasks = (task, subtasks) => {
    save({
      ...data,
      tasks: tasksList.map((item) =>
        String(item.id) === String(task.id)
          ? { ...item, subtasks, updatedAt: new Date().toISOString() }
          : item,
      ),
    });
  };

  const toggleSubtaskNote = (taskId, subtaskId) => {
    const key = `${taskId}:${subtaskId}`;
    setCollapsedSubtaskNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const reorderSubtaskSiblings = (
    task,
    parentId,
    draggedId,
    targetId,
    position = 'before',
  ) => {
    if (!draggedId || !targetId || String(draggedId) === String(targetId))
      return;

    const reorderList = (items) => {
      const ordered = [...(Array.isArray(items) ? items : [])];
      const fromIndex = ordered.findIndex(
        (item) => String(item.id) === String(draggedId),
      );
      const targetIndex = ordered.findIndex(
        (item) => String(item.id) === String(targetId),
      );
      if (fromIndex < 0 || targetIndex < 0) return items;
      const [moved] = ordered.splice(fromIndex, 1);
      let insertIndex = ordered.findIndex(
        (item) => String(item.id) === String(targetId),
      );
      if (insertIndex < 0) return items;
      if (position === 'after') insertIndex += 1;
      ordered.splice(insertIndex, 0, moved);
      return ordered;
    };

    const updated =
      parentId == null
        ? reorderList(task.subtasks)
        : updateSubtaskTree(task.subtasks, parentId, (parent) => ({
            ...parent,
            subtasks: reorderList(parent.subtasks),
          }));

    updateTaskSubtasks(task, updated);
    setDraggedSubtask(null);
    setDragOverSubtask(null);
  };

  const handleSubtaskDragStart = (event, taskId, parentId, subtaskId) => {
    event.stopPropagation();
    setDraggedSubtask({ taskId, parentId: parentId ?? null, subtaskId });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(subtaskId));
  };

  const subtaskTreeContains = (items, targetId) =>
    (Array.isArray(items) ? items : []).some(
      (item) =>
        String(item.id) === String(targetId) ||
        subtaskTreeContains(item.subtasks, targetId),
    );

  const moveSubtaskIntoSubtask = (
    sourceTaskId,
    draggedId,
    targetTask,
    targetId,
  ) => {
    if (!sourceTaskId || !draggedId || !targetTask || !targetId) return;
    if (String(draggedId) === String(targetId)) return;

    const sourceTask = tasksList.find(
      (item) => String(item.id) === String(sourceTaskId),
    );
    if (!sourceTask) return;

    const extracted = extractSubtaskTree(sourceTask.subtasks, draggedId);
    if (!extracted.found) return;
    // Impede soltar um item dentro dele mesmo ou de um descendente seu.
    if (subtaskTreeContains(extracted.found.subtasks, targetId)) return;

    const targetBase =
      String(sourceTask.id) === String(targetTask.id)
        ? extracted.items
        : targetTask.subtasks;
    let targetFound = false;
    const nested = updateSubtaskTree(targetBase, targetId, (item) => {
      targetFound = true;
      return {
        ...item,
        subtasks: [
          ...(Array.isArray(item.subtasks) ? item.subtasks : []),
          extracted.found,
        ],
      };
    });
    if (!targetFound) return;

    const now = new Date().toISOString();
    const updatedTasks = tasksList.map((item) => {
      if (String(item.id) === String(sourceTask.id)) {
        return {
          ...item,
          subtasks:
            String(sourceTask.id) === String(targetTask.id)
              ? nested
              : extracted.items,
          updatedAt: now,
        };
      }
      if (String(item.id) === String(targetTask.id)) {
        return { ...item, subtasks: nested, updatedAt: now };
      }
      return item;
    });
    save({ ...data, tasks: updatedTasks });
    setDraggedSubtask(null);
    setDragOverSubtask(null);
  };

  const handleSubtaskDragOver = (event, taskId, parentId, subtaskId) => {
    if (!draggedSubtask) return;
    event.preventDefault();
    event.stopPropagation();
    if (String(draggedSubtask.subtaskId) === String(subtaskId)) return;

    const sourceTask = tasksList.find(
      (item) => String(item.id) === String(draggedSubtask.taskId),
    );
    const extracted = sourceTask
      ? extractSubtaskTree(sourceTask.subtasks, draggedSubtask.subtaskId)
      : { found: null };
    if (
      !extracted.found ||
      subtaskTreeContains(extracted.found.subtasks, subtaskId)
    )
      return;

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = (event.clientY - rect.top) / Math.max(rect.height, 1);
    const position =
      relativeY < 0.25 ? 'before' : relativeY > 0.75 ? 'after' : 'inside';
    setDragOverSubtask({
      taskId,
      parentId: parentId ?? null,
      subtaskId,
      position,
    });
    event.dataTransfer.dropEffect = 'move';
  };

  const handleSubtaskDrop = (event, task, parentId, subtaskId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedSubtask) return;

    const position =
      dragOverSubtask?.subtaskId === subtaskId &&
      String(dragOverSubtask?.taskId) === String(task.id)
        ? dragOverSubtask.position
        : 'inside';

    const sameParent =
      String(draggedSubtask.taskId) === String(task.id) &&
      String(draggedSubtask.parentId ?? '') === String(parentId ?? '');

    if (sameParent && position !== 'inside') {
      reorderSubtaskSiblings(
        task,
        parentId,
        draggedSubtask.subtaskId,
        subtaskId,
        position,
      );
      return;
    }

    moveSubtaskIntoSubtask(
      draggedSubtask.taskId,
      draggedSubtask.subtaskId,
      task,
      subtaskId,
    );
  };
  const promoteSubtaskToTask = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const draggedId =
      event.dataTransfer.getData('text/plain') || draggedSubtask?.subtaskId;

    const sourceTaskId = draggedSubtask?.taskId;

    if (!draggedId || !sourceTaskId) return;

    const parentTask = tasksList.find(
      (task) => String(task.id) === String(sourceTaskId),
    );

    if (!parentTask) return;

    const extracted = extractSubtaskTree(parentTask.subtasks, draggedId);

    if (!extracted.found) return;

    const subtask = extracted.found;
    const now = new Date().toISOString();

    const promotedTask = {
      id: createId(),

      name: String(subtask.title || 'Nova tarefa').trim(),
      description: String(subtask.note || '').trim(),

      priority: parentTask.priority || 'Média',
      deadline: parentTask.deadline || '',
      frequency: parentTask.frequency || '1x',
      xp: Number(parentTask.xp ?? 40),

      projectId: parentTask.projectId ?? null,
      areaId: parentTask.areaId ?? null,
      tags: Array.isArray(parentTask.tags) ? [...parentTask.tags] : [],

      // Mantém toda a árvore de subdivisões.
      subtasks: Array.isArray(subtask.subtasks) ? subtask.subtasks : [],

      // Preserva o estado da subtarefa.
      done: Boolean(subtask.done),
      completedAt: subtask.completedAt || null,

      // Preserva outros dados existentes da subtarefa.
      createdAt: subtask.createdAt || now,
      updatedAt: now,

      sortOrder: tasksList.length,
    };

    const updatedTasks = [
      ...tasksList.map((task) =>
        String(task.id) === String(parentTask.id)
          ? {
              ...task,
              subtasks: extracted.items,
              updatedAt: now,
            }
          : task,
      ),
      promotedTask,
    ];

    save({
      ...data,
      tasks: updatedTasks,
    });

    setDraggedSubtask(null);
    setDragOverSubtask(null);
  };

  const handleSubtaskOutsideDragOver = (event) => {
    if (!draggedSubtask) return;

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = 'move';
  };

  const handleSubtaskOutsideDrop = (event) => {
    if (!draggedSubtask) return;

    promoteSubtaskToTask(event);
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
    setSubtaskDrafts({});
    setEditingSubtaskNoteId(null);
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

    setSubtaskDrafts({});
    setEditingSubtaskNoteId(null);
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
      estimatedMinutes:
        form.estimatedMinutes === ''
          ? null
          : Math.max(0, Number(form.estimatedMinutes) || 0),
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
        .map((item) => ({
          ...item,
          title: String(item.title || '').trim(),
          note: String(item.note || '').trim(),
        }))
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

  const resetDay = () => setShowResetModal(true);
  const applyResetDay = (includeSubtasks) => {
    save({
      ...data,
      tasks: tasksList.map((task) => ({
        ...task,
        done: false,
        completedAt: null,
        ...(includeSubtasks
          ? { subtasks: resetSubtaskTree(task.subtasks) }
          : {}),
      })),
    });
    setShowResetModal(false);
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

  const setWorkflowStatus = (task, workflowStatus) => {
    save({
      ...data,
      tasks: tasksList.map((item) =>
        String(item.id) === String(task.id)
          ? { ...item, workflowStatus, updatedAt: new Date().toISOString() }
          : item,
      ),
    });
  };

  const applySmartOrder = () => {
    const priorityScore = (task) => {
      const priority = String(task.priority || 'Média').toLowerCase();
      const base = priority === 'alta' ? 30 : priority === 'média' ? 20 : 10;
      const overdue =
        task.deadline && task.deadline < localDate() && !task.done ? 100 : 0;
      const dueToday = task.deadline === localDate() && !task.done ? 50 : 0;
      const cancelled = isTaskCancelled(task, new Date()) ? -1000 : 0;
      const completed = task.done ? -2000 : 0;
      return base + overdue + dueToday + cancelled + completed;
    };
    const ordered = [...tasksList].sort((a, b) => {
      const scoreDiff = priorityScore(b) - priorityScore(a);
      if (scoreDiff) return scoreDiff;
      return String(a.deadline || '9999-12-31').localeCompare(
        String(b.deadline || '9999-12-31'),
      );
    });
    save({
      ...data,
      tasks: ordered.map((task, index) => ({ ...task, sortOrder: index })),
    });
    setViewMode('list');
    setFilter('all');
    setAreaFilter('all');
    setTagFilter('all');
    setSearch('');
  };

  const todayTasks = visibleTasks.filter(
    (task) =>
      !task.done &&
      !isTaskCancelled(task, new Date()) &&
      (!task.deadline || task.deadline <= localDate()),
  );
  const displayTasks = viewMode === 'today' ? todayTasks : visibleTasks;
  const prioritySortedTasks = [...visibleTasks].sort((a, b) => {
    const rank = (task) =>
      ({ alta: 3, média: 2, baixa: 1 })[
        String(task.priority || 'Média').toLowerCase()
      ] || 0;
    return (
      rank(b) - rank(a) ||
      String(a.deadline || '9999-12-31').localeCompare(
        String(b.deadline || '9999-12-31'),
      )
    );
  });
  const subtaskTotal = tasksList.reduce(
    (sum, task) => sum + countSubtasks(task.subtasks),
    0,
  );
  const subtaskDone = tasksList.reduce(
    (sum, task) => sum + countCompletedSubtasks(task.subtasks),
    0,
  );
  const completionRate = tasksList.length
    ? Math.round((completedCount / tasksList.length) * 100)
    : 0;
  const estimatedTotal = tasksList.reduce(
    (sum, task) => sum + (Number(task.estimatedMinutes) || 0),
    0,
  );
  const completedEstimated = tasksList
    .filter((task) => task.done)
    .reduce((sum, task) => sum + (Number(task.estimatedMinutes) || 0), 0);
  const nextSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      key,
      label:
        index === 0
          ? 'Hoje'
          : date.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            }),
    };
  });

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

  const renderRuntimeSubtasks = (
    task,
    items,
    depth = 0,
    status = 'all',
    parentId = null,
  ) =>
    (Array.isArray(items) ? items : [])
      .filter(
        (item) =>
          status === 'all' ||
          (status === 'done' && item.done) ||
          (status === 'pending' && !item.done),
      )
      .map((subtask) => {
        const noteKey = `${task.id}:${subtask.id}`;
        const hasNote = Boolean(String(subtask.note || '').trim());
        const hasChildren =
          Array.isArray(subtask.subtasks) && subtask.subtasks.length > 0;
        const noteCollapsed = Boolean(collapsedSubtaskNotes[noteKey]);
        const isDragging =
          draggedSubtask?.subtaskId === subtask.id &&
          String(draggedSubtask?.taskId) === String(task.id) &&
          String(draggedSubtask?.parentId ?? '') === String(parentId ?? '');
        const isDragOver =
          dragOverSubtask?.subtaskId === subtask.id &&
          String(dragOverSubtask?.taskId) === String(task.id) &&
          String(dragOverSubtask?.parentId ?? '') === String(parentId ?? '');
        return (
          <div
            className={`task-subtask-item ${isDragging ? 'is-dragging' : ''} ${isDragOver ? `drag-over-${dragOverSubtask.position}` : ''}`}
            key={subtask.id}
            style={{
              marginLeft: depth ? 18 : 0,
              borderLeft: depth
                ? '2px solid var(--border-color, #888)'
                : undefined,
              paddingLeft: depth ? 10 : undefined,
            }}
            onDragOver={(event) =>
              handleSubtaskDragOver(event, task.id, parentId, subtask.id)
            }
            onDrop={(event) =>
              handleSubtaskDrop(event, task, parentId, subtask.id)
            }
          >
            <div className='task-subtask-row'>
              <button
                type='button'
                className='subtask-drag-handle'
                draggable
                onDragStart={(event) =>
                  handleSubtaskDragStart(event, task.id, parentId, subtask.id)
                }
                onDragEnd={() => {
                  setDraggedSubtask(null);
                  setDragOverSubtask(null);
                }}
                onClick={(event) => event.preventDefault()}
                title='Arraste para dentro de outra subtarefa ou para transformar em tarefa principal'
              >
                ⋮⋮
              </button>
              <label
                className={`task-subtask ${subtask.done ? 'is-done' : ''}`}
              >
                <input
                  type='checkbox'
                  checked={Boolean(subtask.done)}
                  onChange={() => toggleTaskSubtask(task, subtask.id)}
                />
                <span>{subtask.title}</span>
              </label>
              {(hasNote || hasChildren) && (
                <button
                  type='button'
                  className={`task-subtasks-toggle subtask-note-toggle ${noteCollapsed ? 'is-collapsed' : ''}`}
                  onClick={() => toggleSubtaskNote(task.id, subtask.id)}
                  aria-label={`${noteCollapsed ? 'Mostrar' : 'Ocultar'} ${hasChildren ? 'subtarefas' : 'nota'} de ${subtask.title}`}
                  aria-expanded={!noteCollapsed}
                  title={
                    noteCollapsed
                      ? `Mostrar ${hasChildren ? 'subtarefas e nota' : 'nota'}`
                      : `Ocultar ${hasChildren ? 'subtarefas e nota' : 'nota'}`
                  }
                >
                  <span aria-hidden='true'>{noteCollapsed ? '▸' : '▾'}</span>
                </button>
              )}
            </div>
            {!noteCollapsed && hasNote && (
              <div className='subtask-note'>
                <span>{subtask.note}</span>
              </div>
            )}
            {!noteCollapsed &&
              renderRuntimeSubtasks(
                task,
                subtask.subtasks,
                depth + 1,
                status,
                subtask.id,
              )}
          </div>
        );
      });

  return (
    <div
      className='card tasks-page'
      onDragOver={(event) => {
        if (!draggedSubtask || event.target.closest('.task-subtask-item'))
          return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        if (!draggedSubtask || event.target.closest('.task-subtask-item'))
          return;
        promoteSubtaskToTask(event);
      }}
    >
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
      <div className='cyber-overview-strip'>
        <div className='cyber-overview-copy'>
          <span className='cyber-eyebrow'>CENTRAL DE OPERAÇÕES</span>
          <strong>Seu progresso está em {completionRate}%</strong>
          <small>
            {pendingCount} pendentes · {overdueCount} atrasadas · {subtaskDone}/
            {subtaskTotal} subtarefas concluídas
          </small>
        </div>
        <div
          className='cyber-progress-track'
          role='progressbar'
          aria-valuenow={completionRate}
          aria-valuemin='0'
          aria-valuemax='100'
        >
          <span style={{ width: `${completionRate}%` }} />
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

          <div
            className='cyber-viewbar'
            role='tablist'
            aria-label='Modos de visualização'
          >
            {[
              ['list', '☷', 'Lista'],
              ['today', '◷', 'Hoje'],
              ['kanban', '▥', 'Kanban'],
              ['calendar', '▦', 'Agenda'],
              ['analytics', '⌁', 'Análises'],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                type='button'
                role='tab'
                aria-selected={viewMode === key}
                className={viewMode === key ? 'is-active' : ''}
                onClick={() => setViewMode(key)}
              >
                <span aria-hidden='true'>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <p className='tasks-order-hint'>
            ↕️ Arraste pelo ícone ⋮⋮ para definir a ordem das tarefas. A ordem
            fica salva e continua a mesma ao voltar para a página.
          </p>

          {draggedSubtask && (
            <div
              className='subtask-promotion-dropzone'
              onDragOver={handleSubtaskOutsideDragOver}
              onDrop={handleSubtaskOutsideDrop}
            >
              <span>📤</span>
              <strong>Transformar em tarefa principal</strong>
              <small>
                Solte aqui para separar a subtarefa. Para aninhar, solte sobre
                outra subtarefa.
              </small>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className='cyber-kanban' aria-label='Quadro Kanban'>
              {[
                {
                  key: 'pending',
                  title: 'A fazer',
                  items: visibleTasks.filter(
                    (task) =>
                      !task.done &&
                      !isTaskCancelled(task, new Date()) &&
                      !['in_progress', 'waiting'].includes(task.workflowStatus),
                  ),
                },
                {
                  key: 'progress',
                  title: 'Em andamento',
                  items: visibleTasks.filter(
                    (task) =>
                      !task.done &&
                      !isTaskCancelled(task, new Date()) &&
                      task.workflowStatus === 'in_progress',
                  ),
                },
                {
                  key: 'paused',
                  title: 'Em espera',
                  items: visibleTasks.filter(
                    (task) =>
                      !task.done &&
                      (isTaskCancelled(task, new Date()) ||
                        task.workflowStatus === 'waiting'),
                  ),
                },
                {
                  key: 'done',
                  title: 'Concluídas',
                  items: visibleTasks.filter((task) => task.done),
                },
              ].map((column) => (
                <section
                  className={`cyber-kanban-column cyber-column-${column.key}`}
                  key={column.key}
                >
                  <header>
                    <strong>{column.title}</strong>
                    <span>{column.items.length}</span>
                  </header>
                  {column.items.length ? (
                    column.items.map((task) => (
                      <article className='cyber-kanban-card' key={task.id}>
                        <strong>{task.name}</strong>
                        {task.description && <p>{task.description}</p>}
                        <div className='cyber-kanban-meta'>
                          <span
                            className={`priority priority-${String(task.priority || 'Média').toLowerCase()}`}
                          >
                            {task.priority || 'Média'}
                          </span>
                          {task.deadline && (
                            <small>{formatDate(task.deadline)}</small>
                          )}
                        </div>
                        <div className='cyber-kanban-actions'>
                          {isTaskCancelled(task, new Date()) ? (
                            <button
                              type='button'
                              onClick={() => toggleCancelled(task)}
                            >
                              Reativar
                            </button>
                          ) : (
                            <>
                              {!task.done &&
                                task.workflowStatus !== 'in_progress' && (
                                  <button
                                    type='button'
                                    onClick={() =>
                                      setWorkflowStatus(task, 'in_progress')
                                    }
                                  >
                                    Iniciar
                                  </button>
                                )}
                              {!task.done &&
                                task.workflowStatus !== 'waiting' && (
                                  <button
                                    type='button'
                                    onClick={() =>
                                      setWorkflowStatus(task, 'waiting')
                                    }
                                  >
                                    Aguardar
                                  </button>
                                )}
                              {task.workflowStatus !== 'pending' && (
                                <button
                                  type='button'
                                  onClick={() =>
                                    setWorkflowStatus(task, 'pending')
                                  }
                                >
                                  A fazer
                                </button>
                              )}
                            </>
                          )}
                          <button
                            type='button'
                            onClick={() => toggleTask(task)}
                          >
                            {task.done ? 'Reabrir' : 'Concluir'}
                          </button>
                          <button type='button' onClick={() => openEdit(task)}>
                            Editar
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className='cyber-empty'>Nenhuma tarefa nesta coluna.</p>
                  )}
                </section>
              ))}
            </div>
          )}

          {viewMode === 'calendar' && (
            <section className='cyber-agenda'>
              <div className='cyber-panel-heading'>
                <div>
                  <span className='cyber-eyebrow'>PRÓXIMOS 7 DIAS</span>
                  <h3>Agenda de entregas</h3>
                </div>
                <span>
                  {visibleTasks.filter((task) => task.deadline).length} com
                  prazo
                </span>
              </div>
              {nextSevenDays.map((day) => {
                const dayTasks = visibleTasks.filter(
                  (task) => task.deadline === day.key,
                );
                return (
                  <div className='cyber-agenda-day' key={day.key}>
                    <div className='cyber-agenda-date'>
                      <strong>{day.label}</strong>
                      <small>{day.key}</small>
                    </div>
                    <div className='cyber-agenda-items'>
                      {dayTasks.length ? (
                        dayTasks.map((task) => (
                          <button
                            type='button'
                            className={`cyber-agenda-task ${task.done ? 'is-done' : ''}`}
                            key={task.id}
                            onClick={() => openEdit(task)}
                          >
                            <span className='cyber-agenda-dot' />
                            {task.name}
                            <small>{task.priority || 'Média'}</small>
                          </button>
                        ))
                      ) : (
                        <span className='cyber-empty-inline'>
                          Sem tarefas agendadas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className='cyber-footnote'>
                Tarefas sem prazo continuam disponíveis nas visualizações Lista
                e Hoje.
              </p>
            </section>
          )}

          {viewMode === 'analytics' && (
            <section className='cyber-analytics'>
              <div className='cyber-panel-heading'>
                <div>
                  <span className='cyber-eyebrow'>
                    INTELIGÊNCIA DE PRODUTIVIDADE
                  </span>
                  <h3>Desempenho das tarefas</h3>
                </div>
                <span>Dados atuais</span>
              </div>
              <div className='cyber-analytics-grid'>
                <div className='cyber-analytics-card'>
                  <small>Taxa de conclusão</small>
                  <strong>{completionRate}%</strong>
                  <div className='cyber-mini-track'>
                    <i style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
                <div className='cyber-analytics-card'>
                  <small>Tempo estimado total</small>
                  <strong>
                    {Math.floor(estimatedTotal / 60)}h {estimatedTotal % 60}min
                  </strong>
                  <span>Somatório das estimativas informadas</span>
                </div>
                <div className='cyber-analytics-card'>
                  <small>Estimativa concluída</small>
                  <strong>
                    {Math.floor(completedEstimated / 60)}h{' '}
                    {completedEstimated % 60}min
                  </strong>
                  <span>Nas tarefas marcadas como concluídas</span>
                </div>
                <div className='cyber-analytics-card'>
                  <small>Subtarefas</small>
                  <strong>
                    {subtaskTotal
                      ? Math.round((subtaskDone / subtaskTotal) * 100)
                      : 0}
                    %
                  </strong>
                  <span>
                    {subtaskDone} de {subtaskTotal} concluídas
                  </span>
                </div>
              </div>
              <div className='cyber-priority-breakdown'>
                {['Alta', 'Média', 'Baixa'].map((priority) => {
                  const count = tasksList.filter(
                    (task) =>
                      String(task.priority || 'Média').toLowerCase() ===
                      priority.toLowerCase(),
                  ).length;
                  const percent = tasksList.length
                    ? Math.round((count / tasksList.length) * 100)
                    : 0;
                  return (
                    <div className='cyber-breakdown-row' key={priority}>
                      <span>{priority}</span>
                      <div>
                        <i style={{ width: `${percent}%` }} />
                      </div>
                      <b>{count}</b>
                    </div>
                  );
                })}
              </div>
              <div className='cyber-automation-panel'>
                <div>
                  <span className='cyber-eyebrow'>AUTOMAÇÃO ASSISTIDA</span>
                  <h3>Plano de ação recomendado</h3>
                  <p>
                    {overdueCount
                      ? `Você tem ${overdueCount} tarefa(s) atrasada(s). Reorganize a fila para priorizar atrasos e prazos de hoje.`
                      : pendingCount
                        ? 'Não há tarefas atrasadas. Organize a fila por prioridade e prazo para manter o ritmo.'
                        : 'Sua lista está em dia. Continue registrando estimativas para enriquecer as análises.'}
                  </p>
                </div>
                <button
                  type='button'
                  className='cyber-primary-button'
                  onClick={applySmartOrder}
                >
                  ✦ Aplicar ordem inteligente
                </button>
              </div>
              <div className='cyber-priority-list'>
                <strong>Fila sugerida</strong>
                {prioritySortedTasks.slice(0, 5).map((task, index) => (
                  <div key={task.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <b>{task.name}</b>
                    <small>
                      {task.priority || 'Média'}
                      {task.deadline ? ` · ${formatDate(task.deadline)}` : ''}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {['list', 'today'].includes(viewMode) && (
            <div className='tasks-list'>
              {displayTasks.map((task) => {
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
                                {countCompletedSubtasks(task.subtasks)}/
                                {countSubtasks(task.subtasks)} concluídas
                              </small>
                              <select
                                className='subtask-status-filter'
                                value={subtaskFilters[task.id] || 'all'}
                                onChange={(event) =>
                                  setSubtaskFilters((prev) => ({
                                    ...prev,
                                    [task.id]: event.target.value,
                                  }))
                                }
                                aria-label={`Filtrar subtarefas de ${task.name}`}
                              >
                                <option value='all'>Todas</option>
                                <option value='done'>Só feitas</option>
                                <option value='pending'>Só pendentes</option>
                              </select>
                            </div>
                            <div className='cyber-subtask-progress'>
                              <span
                                style={{
                                  width: `${countSubtasks(task.subtasks) ? (countCompletedSubtasks(task.subtasks) / countSubtasks(task.subtasks)) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <div className='task-subtasks-list'>
                              {renderRuntimeSubtasks(
                                task,
                                task.subtasks,
                                0,
                                subtaskFilters[task.id] || 'all',
                              )}
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
                        {Number(task.estimatedMinutes) > 0 && (
                          <span className='cyber-time-chip'>
                            ◷ {task.estimatedMinutes} min
                          </span>
                        )}

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
                            className={
                              overdue ? 'deadline overdue' : 'deadline'
                            }
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

              {displayTasks.length === 0 && (
                <p className='subtitle'>
                  {viewMode === 'today'
                    ? 'Nenhuma tarefa pendente para hoje.'
                    : 'Nenhuma tarefa encontrada com esses filtros.'}
                </p>
              )}
            </div>
          )}

          {['list', 'today'].includes(viewMode) && (
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
          )}
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

      {showResetModal && (
        <div
          className='task-modal-backdrop'
          role='presentation'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <section
            ref={resetModalRef}
            className='task-modal card reset-day-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='reset-day-title'
          >
            <div className='section-title'>
              <h2 id='reset-day-title'>🔄 Reiniciar dia</h2>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowResetModal(false)}
                aria-label='Fechar'
              >
                ✕
              </button>
            </div>
            <p>Escolha quais itens terão o status redefinido:</p>
            <div className='reset-day-options'>
              <button
                type='button'
                className='secondary'
                onClick={() => applyResetDay(false)}
              >
                <strong>Somente tarefas principais</strong>
                <small>As subtarefas manterão seus status atuais.</small>
              </button>
              <button
                type='button'
                className='secondary'
                onClick={() => applyResetDay(true)}
              >
                <strong>Tarefas e todas as subdivisões</strong>
                <small>
                  Reinicia subtarefas, subsubtarefas e todos os níveis abaixo.
                </small>
              </button>
            </div>
            <button
              type='button'
              className='ghost'
              onClick={() => setShowResetModal(false)}
            >
              Cancelar
            </button>
          </section>
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
                  {countCompletedSubtasks(form.subtasks)}/
                  {countSubtasks(form.subtasks)}
                </small>
              </div>
              {renderSubtaskEditor(form.subtasks)}
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
                  onClick={() => addSubtaskToForm()}
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
                Tempo estimado (minutos)
                <input
                  type='number'
                  min='0'
                  max='100000'
                  step='5'
                  value={form.estimatedMinutes ?? ''}
                  onChange={(e) =>
                    updateForm('estimatedMinutes', e.target.value)
                  }
                  placeholder='Ex.: 25'
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

        .tasks-page .subtask-promotion-dropzone {
          position: fixed;
          z-index: 9999;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: min(560px, calc(100vw - 32px));
          min-height: 88px;
          margin: 0;
          padding: 16px 20px;
          border: 2px dashed var(--accent-color, #6366f1);
          border-radius: 16px;
          background: var(--card-bg, #fff);
          color: var(--text-color, inherit);
          text-align: center;
          box-shadow: 0 12px 36px rgba(0, 0, 0, .22);
          pointer-events: auto;
        }

        .tasks-page .subtask-promotion-dropzone > span {
          font-size: 22px;
        }

        .tasks-page .subtask-promotion-dropzone strong {
          font-size: 14px;
        }

        .tasks-page .subtask-promotion-dropzone small {
          opacity: .75;
          font-size: 12px;
        }

        .tasks-page .task-subtask-item.drag-over-inside {
          outline: 2px solid var(--accent-color, #6366f1);
          outline-offset: 2px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--accent-color, #6366f1) 14%, transparent);
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

        /* O controle de subtarefas mantém a aparência normal mesmo quando a tarefa é concluída. */
        .tasks-page .task.done .task-subtasks-toggle {
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;
          min-height: 24px !important;
          flex: 0 0 24px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          border: 1px solid var(--border-color, rgba(120,120,120,.3)) !important;
          border-radius: 7px !important;
          background: transparent !important;
          color: var(--text-secondary, inherit) !important;
          font-family: inherit !important;
          font-size: 16px !important;
          font-weight: 400 !important;
          line-height: 1 !important;
          text-decoration: none !important;
          opacity: 1 !important;
          filter: none !important;
          transform: none !important;
          box-shadow: none !important;
          cursor: pointer !important;
        }

        .tasks-page .task.done .task-subtasks-toggle::before,
        .tasks-page .task.done .task-subtasks-toggle::after {
          content: none !important;
          display: none !important;
        }

        .tasks-page .task.done .task-subtasks-toggle span {
          display: inline !important;
          color: inherit !important;
          font: inherit !important;
          line-height: 1 !important;
          text-decoration: none !important;
          opacity: 1 !important;
          transform: none !important;
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
        .tasks-page .task-subtask-item {
          display: grid;
          gap: 5px;
          min-width: 0;
          padding: 3px 4px;
          border-radius: 8px;
          position: relative;
        }
        .tasks-page .task-subtask-item.is-dragging { opacity: .45; }
        .tasks-page .task-subtask-item.drag-over-before { box-shadow: inset 0 2px 0 var(--accent-color, #6366f1); }
        .tasks-page .task-subtask-item.drag-over-after { box-shadow: inset 0 -2px 0 var(--accent-color, #6366f1); }
        .tasks-page .task-subtask-row {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }
        .tasks-page .subtask-drag-handle {
          flex: 0 0 20px;
          width: 20px;
          height: 24px;
          padding: 0;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: var(--text-secondary, #888);
          cursor: grab;
          touch-action: none;
          letter-spacing: -2px;
        }
        .tasks-page .subtask-drag-handle:active { cursor: grabbing; }
        .tasks-page .task-subtask-row .task-subtask { flex: 1; min-width: 0; }
        .tasks-page .subtask-note-toggle { margin-left: auto; }
        .tasks-page .subtask-note-edit {
          width: 24px;
          height: 24px;
          min-width: 24px;
          min-height: 24px;
          flex: 0 0 24px;
          padding: 0;
          font-size: 12px;
          line-height: 1;
        }
        .tasks-page .subtask-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-left: 27px;
          padding: 7px 9px;
          border-left: 2px solid var(--accent-color, #6366f1);
          border-radius: 0 7px 7px 0;
          background: color-mix(in srgb, var(--accent-color, #6366f1) 7%, transparent);
          font-size: .88em;
        }
        .tasks-page .subtask-note > span {
          flex: 1;
          min-width: 0;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }
        .tasks-page .task-subtask input, .tasks-page .subtask-edit-row input[type='checkbox'] { width: 16px; height: 16px; flex: 0 0 auto; }
        .tasks-page .task-subtask.is-done span, .tasks-page .subtask-edit-row .is-done { text-decoration: line-through; opacity: .6; }
        .tasks-page .subtask-editor { display: grid; gap: 8px; padding: 12px; border: 1px solid var(--border-color, rgba(120,120,120,.2)); border-radius: 12px; }
        .tasks-page .subtask-edit-item { display: grid; gap: 7px; min-width: 0; }
        .tasks-page .subtask-edit-row, .tasks-page .subtask-add-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .tasks-page .subtask-edit-row .subtask-edit-name { flex: 1; min-width: 0; }
        .tasks-page .subtask-edit-row .subtask-note-action,
        .tasks-page .subtask-edit-row .subtask-delete-action { flex: 0 0 32px; width: 32px; min-width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        .tasks-page .subtask-edit-note { width: 100%; min-width: 0; box-sizing: border-box; margin-left: 24px; width: calc(100% - 24px); }
        .tasks-page .subtask-edit-row span { flex: 1; overflow-wrap: anywhere; }
        .tasks-page .subtask-add-row input { flex: 1; min-width: 0; }
        .tasks-page .nested-subtask-add-row { margin: 2px 0 4px 18px; }
        .tasks-page .nested-subtask-add-row button { flex: 0 0 34px; min-width: 34px; padding: 5px; }

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

        .reset-day-modal { width: min(480px, 100%); }
        .reset-day-options { display: grid; gap: 10px; margin: 16px 0; }
        .reset-day-options button { display: grid; gap: 5px; text-align: left; padding: 13px 15px; }
        .reset-day-options small { opacity: .75; font-weight: 400; }

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

        /* CYBERPUNK COMMAND CENTER — estilos isolados nesta página */
        .tasks-page {
          --cyber-bg: #080b18;
          --cyber-panel: rgba(17, 23, 46, .88);
          --cyber-panel-2: rgba(23, 30, 59, .82);
          --cyber-border: rgba(94, 117, 255, .28);
          --cyber-purple: #9b5cff;
          --cyber-cyan: #22d3ee;
          --cyber-text: #edf0ff;
          --cyber-muted: #9ca9ca;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          color: var(--cyber-text);
          background:
            radial-gradient(ellipse at 8% 0%, rgba(112, 49, 255, .18), transparent 36%),
            radial-gradient(ellipse at 94% 8%, rgba(0, 207, 255, .12), transparent 30%),
            linear-gradient(145deg, #090d1d 0%, #0b1023 52%, #090b18 100%);
          border: 1px solid rgba(115, 103, 255, .30);
          border-radius: 18px;
          box-shadow: 0 0 0 1px rgba(23, 218, 255, .04), 0 18px 60px rgba(0, 0, 0, .28), inset 0 1px rgba(255,255,255,.035);
        }
        .tasks-page::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .18; background-image: linear-gradient(rgba(112,130,255,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(112,130,255,.10) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(to bottom, black, transparent 75%); }
        .tasks-page > * { position: relative; }
        .tasks-page .section-title h2 { color: #fff; letter-spacing: -.035em; text-shadow: 0 0 22px rgba(150,92,255,.35); }
        .tasks-page .subtitle, .tasks-page .tasks-order-hint { color: var(--cyber-muted); }
        .tasks-page .primary, .tasks-page button.primary { background: linear-gradient(115deg, #773cff, #b14cff 55%, #5a6dff); border: 1px solid rgba(203,177,255,.42); color: #fff; box-shadow: 0 0 22px rgba(133,74,255,.28); }
        .tasks-page .primary:hover, .tasks-page button.primary:hover { filter: brightness(1.12); box-shadow: 0 0 28px rgba(133,74,255,.42); transform: translateY(-1px); }
        .tasks-page .metrics { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; }
        .tasks-page .metrics .reward { min-width: 0; padding: 15px 16px; border: 1px solid var(--cyber-border); border-radius: 13px; background: linear-gradient(145deg, rgba(28,36,70,.88), rgba(14,19,39,.92)); box-shadow: inset 0 1px rgba(255,255,255,.04), 0 8px 24px rgba(0,0,0,.12); }
        .tasks-page .metrics .reward strong { color: #f7f7ff; font-size: 1.45rem; }
        .tasks-page .metrics .reward small { color: #aab7d8; }
        .cyber-overview-strip { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(120px, 34%); gap: 20px; align-items: center; margin: 12px 0 18px; padding: 13px 16px; border: 1px solid rgba(34,211,238,.20); border-radius: 12px; background: linear-gradient(90deg, rgba(23,37,73,.74), rgba(32,20,66,.55)); }
        .cyber-overview-copy { display: grid; gap: 3px; }
        .cyber-overview-copy strong { color: #f4f5ff; }
        .cyber-overview-copy small { color: var(--cyber-muted); }
        .cyber-eyebrow { color: #49dff3; font-size: 10px; font-weight: 800; letter-spacing: .16em; }
        .cyber-progress-track, .cyber-mini-track { height: 8px; overflow: hidden; border-radius: 99px; background: rgba(123,139,190,.18); box-shadow: inset 0 1px 3px rgba(0,0,0,.35); }
        .cyber-progress-track span, .cyber-mini-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #22d3ee, #8b5cf6, #ec4cff); box-shadow: 0 0 14px rgba(34,211,238,.6); transition: width .35s ease; }
        .tasks-page .tabs { display: flex; gap: 7px; flex-wrap: wrap; border-bottom: 1px solid rgba(104,122,192,.20); padding-bottom: 10px; }
        .tasks-page .tabs button, .cyber-viewbar button { border: 1px solid rgba(111,127,194,.22); background: rgba(22,29,57,.78); color: #b9c5e5; border-radius: 9px; padding: 9px 13px; transition: .18s ease; }
        .tasks-page .tabs button.active, .cyber-viewbar button.is-active { color: #fff; border-color: rgba(163,103,255,.72); background: linear-gradient(110deg, rgba(111,57,255,.42), rgba(32,179,222,.14)); box-shadow: 0 0 18px rgba(125,75,255,.20), inset 0 0 12px rgba(128,92,255,.10); }
        .tasks-page .tasks-toolbar { grid-template-columns: minmax(220px,1fr) minmax(130px,170px) minmax(130px,190px) minmax(130px,190px); gap: 10px; margin: 14px 0; }
        .tasks-page .filter-field label { color: #b9c7e9; font-size: 11px; letter-spacing: .04em; }
        .tasks-page .tasks-toolbar input, .tasks-page .tasks-toolbar select, .tasks-page .task-modal input, .tasks-page .task-modal select, .tasks-page .task-modal textarea, .tasks-page .observation-entry input { color: #edf0ff; background: rgba(13,19,41,.92); border: 1px solid rgba(103,125,194,.30); border-radius: 9px; }
        .tasks-page input::placeholder, .tasks-page textarea::placeholder { color: #7482a9; }
        .tasks-page .tasks-toolbar input:focus, .tasks-page .tasks-toolbar select:focus, .tasks-page .task-modal input:focus, .tasks-page .task-modal select:focus, .tasks-page .task-modal textarea:focus { outline: 2px solid rgba(34,211,238,.48); outline-offset: 1px; border-color: #22d3ee; }
        .cyber-viewbar { display: flex; gap: 7px; flex-wrap: wrap; margin: 8px 0 12px; }
        .cyber-viewbar button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; cursor: pointer; }
        .cyber-viewbar button span { color: #56dff5; font-size: 16px; }
        .tasks-page .task { border: 1px solid rgba(103,123,190,.24); border-radius: 13px; background: linear-gradient(120deg, rgba(21,28,54,.92), rgba(13,18,37,.96)); box-shadow: inset 0 1px rgba(255,255,255,.025); transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
        .tasks-page .task:hover { border-color: rgba(34,211,238,.42); box-shadow: 0 0 22px rgba(45,104,255,.10); transform: translateY(-1px); }
        .tasks-page .task-name { color: #f1f3ff; }
        .tasks-page .task-meta { color: #b8c5e4; }
        .tasks-page .task-subtasks { border-color: rgba(113,133,204,.22); background: rgba(8,13,29,.55); }
        .tasks-page .task-subtask { color: #d4dcf4; }
        .tasks-page .task-subtask input { accent-color: #a35cff; }
        .cyber-subtask-progress { height: 4px; margin: 0 0 9px; border-radius: 99px; overflow: hidden; background: rgba(130,144,190,.16); }
        .cyber-subtask-progress span { display: block; height: 100%; background: linear-gradient(90deg,#20d7ec,#9b5cff); box-shadow: 0 0 10px rgba(34,211,238,.6); }
        .cyber-time-chip { display: inline-flex; align-items: center; border: 1px solid rgba(34,211,238,.28); color: #6ce7f6; background: rgba(34,211,238,.08); border-radius: 20px; padding: 3px 8px; }
        .tasks-page .task-actions button, .tasks-page .ghost { color: #c3ccef; border-color: rgba(112,129,191,.25); }
        .tasks-page .task-actions button:hover, .tasks-page .ghost:hover { color: #fff; border-color: rgba(34,211,238,.48); background: rgba(34,211,238,.08); }
        .cyber-kanban { display: grid; grid-template-columns: repeat(4,minmax(210px,1fr)); gap: 12px; overflow-x: auto; padding: 3px 1px 12px; }
        .cyber-kanban-column { min-width: 210px; padding: 11px; border: 1px solid rgba(103,123,190,.25); border-radius: 13px; background: rgba(13,19,40,.75); }
        .cyber-kanban-column > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: #e5eaff; }
        .cyber-kanban-column > header span { min-width: 23px; text-align: center; border-radius: 20px; background: rgba(125,92,255,.20); color: #c9b3ff; padding: 2px 7px; font-size: 11px; }
        .cyber-kanban-card { display: grid; gap: 8px; padding: 11px; margin-bottom: 9px; border: 1px solid rgba(112,132,205,.24); border-radius: 10px; background: linear-gradient(145deg,rgba(28,36,70,.92),rgba(15,21,43,.96)); }
        .cyber-kanban-card > strong { color: #f0f2ff; overflow-wrap: anywhere; }
        .cyber-kanban-card p { margin: 0; color: var(--cyber-muted); font-size: 12px; }
        .cyber-kanban-meta, .cyber-kanban-actions { display: flex; align-items: center; justify-content: space-between; gap: 7px; flex-wrap: wrap; }
        .cyber-kanban-meta small { color: #9daaca; }
        .cyber-kanban-actions button { border: 1px solid rgba(34,211,238,.25); border-radius: 7px; padding: 5px 8px; color: #bcecf6; background: rgba(34,211,238,.06); cursor: pointer; }
        .cyber-empty, .cyber-empty-inline { color: #7886a9; font-size: 12px; }
        .cyber-agenda, .cyber-analytics { padding: 15px; border: 1px solid rgba(103,123,190,.25); border-radius: 14px; background: rgba(13,19,40,.72); }
        .cyber-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .cyber-panel-heading h3, .cyber-automation-panel h3 { margin: 3px 0 0; color: #f1f3ff; }
        .cyber-panel-heading > span { color: #91a1c9; font-size: 12px; }
        .cyber-agenda-day { display: grid; grid-template-columns: 145px minmax(0,1fr); gap: 13px; padding: 12px 0; border-top: 1px solid rgba(104,122,185,.17); }
        .cyber-agenda-date { display: grid; align-content: start; gap: 3px; color: #e8edff; }
        .cyber-agenda-date small { color: #7e8cad; font-size: 10px; }
        .cyber-agenda-items { display: grid; gap: 6px; }
        .cyber-agenda-task { display: flex; align-items: center; gap: 9px; text-align: left; padding: 8px 10px; border: 1px solid rgba(105,127,194,.20); border-radius: 8px; color: #dce5ff; background: rgba(28,36,70,.55); cursor: pointer; }
        .cyber-agenda-task small { margin-left: auto; color: #8d9dc4; }
        .cyber-agenda-task.is-done { opacity: .55; text-decoration: line-through; }
        .cyber-agenda-dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #23d6ee; box-shadow: 0 0 9px #23d6ee; }
        .cyber-footnote { margin: 12px 0 0; color: #8190b3; font-size: 11px; }
        .cyber-analytics-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
        .cyber-analytics-card { display: grid; gap: 7px; padding: 13px; border: 1px solid rgba(106,126,196,.24); border-radius: 11px; background: linear-gradient(145deg,rgba(28,36,70,.8),rgba(13,19,40,.9)); }
        .cyber-analytics-card small, .cyber-analytics-card span { color: #98a7ca; font-size: 11px; }
        .cyber-analytics-card strong { color: #f5f5ff; font-size: 22px; }
        .cyber-mini-track { height: 5px; }
        .cyber-priority-breakdown { display: grid; gap: 11px; margin: 18px 0; }
        .cyber-breakdown-row { display: grid; grid-template-columns: 55px minmax(0,1fr) 30px; gap: 10px; align-items: center; color: #c4cdea; font-size: 12px; }
        .cyber-breakdown-row > div { height: 7px; border-radius: 99px; overflow: hidden; background: rgba(123,139,190,.16); }
        .cyber-breakdown-row i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#22d3ee,#a855f7); }
        .cyber-breakdown-row b { text-align: right; color: #edf0ff; }
        .cyber-automation-panel { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px; border: 1px solid rgba(153,91,255,.34); border-radius: 12px; background: linear-gradient(110deg,rgba(83,42,155,.22),rgba(17,95,126,.16)); }
        .cyber-automation-panel p { max-width: 640px; margin: 7px 0 0; color: #aab8d8; font-size: 12px; }
        .cyber-primary-button { flex: 0 0 auto; border: 1px solid rgba(196,159,255,.48); border-radius: 9px; padding: 10px 14px; color: #fff; font-weight: 700; background: linear-gradient(110deg,#763cff,#a344e9); box-shadow: 0 0 18px rgba(140,75,255,.22); cursor: pointer; }
        .cyber-priority-list { display: grid; gap: 8px; margin-top: 16px; }
        .cyber-priority-list > strong { margin-bottom: 2px; color: #e9edff; }
        .cyber-priority-list > div { display: grid; grid-template-columns: 30px minmax(0,1fr) auto; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; background: rgba(28,36,70,.48); }
        .cyber-priority-list > div > span { color: #55dced; font-size: 11px; }
        .cyber-priority-list b { color: #e5eaff; font-size: 12px; overflow-wrap: anywhere; }
        .cyber-priority-list small { color: #91a1c7; font-size: 10px; }
        .tasks-page .task-modal-backdrop { background: rgba(3,6,18,.82); backdrop-filter: blur(10px); }
        .tasks-page .task-modal { color: #edf0ff; border: 1px solid rgba(132,105,255,.36); border-radius: 16px; background: linear-gradient(145deg,#141b37,#0b1022); box-shadow: 0 20px 70px rgba(0,0,0,.55), 0 0 35px rgba(121,75,255,.12); }
        .tasks-page .subtask-editor, .tasks-page .area-preview, .tasks-page .observation-panel { border-color: rgba(103,123,190,.25); background: rgba(10,16,34,.58); }
        .tasks-page .area-card { border-color: rgba(103,123,190,.25); background: linear-gradient(145deg,rgba(25,32,63,.86),rgba(12,17,36,.92)); }
        .tasks-page .daily-row { border-color: rgba(103,123,190,.20); }
        .tasks-page button:focus-visible, .tasks-page input:focus-visible, .tasks-page select:focus-visible { outline-color: #22d3ee; }
        @media (max-width: 1000px) { .tasks-page .metrics { grid-template-columns: repeat(3,minmax(0,1fr)); } .tasks-page .tasks-toolbar { grid-template-columns: repeat(2,minmax(0,1fr)); } .cyber-analytics-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
        @media (max-width: 620px) { .tasks-page { padding: 12px; border-radius: 12px; } .tasks-page .metrics { grid-template-columns: repeat(2,minmax(0,1fr)); } .cyber-overview-strip { grid-template-columns: 1fr; gap: 10px; } .tasks-page .tasks-toolbar { grid-template-columns: 1fr; } .cyber-agenda-day { grid-template-columns: 1fr; gap: 7px; } .cyber-automation-panel { align-items: stretch; flex-direction: column; } .cyber-primary-button { width: 100%; } .cyber-priority-list > div { grid-template-columns: 25px minmax(0,1fr); } .cyber-priority-list small { grid-column: 2; } .cyber-analytics-grid { grid-template-columns: 1fr 1fr; } }
        @media (prefers-reduced-motion: reduce) { .tasks-page *, .tasks-page *::before, .tasks-page *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; } }

      `}</style>
    </div>
  );
}
