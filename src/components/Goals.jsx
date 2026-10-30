import React, { useMemo, useState } from 'react';
import './Goals.visual.css';

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return 'Sem prazo';
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
};

const daysUntil = (date) => {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
};

const createId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const initialForm = {
  title: '',
  description: '',
  category: 'Carreira',
  horizon: 'long',
  priority: 'high',
  startDate: today(),
  targetDate: '',
  motivation: '',
  nextStep: '',
};

const categoryOptions = [
  'Carreira', 'Estudos', 'Finanças', 'Saúde', 'Projetos',
  'Relacionamentos', 'Pessoal', 'Outro',
];

const priorityOptions = [
  { value: 'high', label: 'Alta', icon: '🔴' },
  { value: 'medium', label: 'Média', icon: '🟡' },
  { value: 'low', label: 'Baixa', icon: '🟢' },
];

const horizonOptions = [
  { value: 'long', label: 'Longo prazo', description: '1 a 5 anos' },
  { value: 'medium', label: 'Médio prazo', description: '3 a 12 meses' },
  { value: 'short', label: 'Curto prazo', description: 'Até 3 meses' },
];

const getHorizonLabel = (horizon) =>
  horizonOptions.find((item) => item.value === horizon)?.label || 'Longo prazo';

const getPriorityData = (priority) =>
  priorityOptions.find((item) => item.value === priority) || priorityOptions[1];

const normalizeGoals = (data) => Array.isArray(data?.goals) ? data.goals : [];

/*
 * Compatibilidade:
 * - Microobjetivos novos ficam em goal.microGoals.
 * - Etapas antigas em goal.milestones são mantidas e convertidas visualmente
 *   para microobjetivos, sem apagar nem reescrever os dados antigos.
 */
const getMicroGoals = (goal) => {
  if (Array.isArray(goal.microGoals)) return goal.microGoals;
  if (Array.isArray(goal.milestones)) {
    return goal.milestones.map((item) => ({
      ...item,
      description: item.description || '',
      startDate: item.startDate || '',
      targetDate: item.targetDate || '',
    }));
  }
  return [];
};

const calculateProgress = (goal) => {
  const microGoals = getMicroGoals(goal);
  if (microGoals.length) {
    const completed = microGoals.filter((item) => item.completed).length;
    return Math.round((completed / microGoals.length) * 100);
  }
  return Math.min(100, Math.max(0, Number(goal.progress) || 0));
};

function GoalProgress({ value }) {
  return (
    <div className="goal-progress">
      <div className="goal-progress-header">
        <span>Progresso</span>
        <strong>{value}%</strong>
      </div>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

const emptyMicroForm = {
  title: '',
  description: '',
  startDate: today(),
  targetDate: '',
};

export default function Goals({ data, save }) {
  const goals = normalizeGoals(data);
  const [view, setView] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [microForms, setMicroForms] = useState({});
  const [editingMicro, setEditingMicro] = useState(null);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status !== 'completed' && goal.status !== 'archived'),
    [goals],
  );
  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'completed'),
    [goals],
  );
  const overdueGoals = useMemo(
    () => activeGoals.filter((goal) => {
      const days = daysUntil(goal.targetDate);
      return days !== null && days < 0;
    }),
    [activeGoals],
  );
  const overallProgress = useMemo(() => {
    if (!activeGoals.length) return 0;
    return Math.round(activeGoals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / activeGoals.length);
  }, [activeGoals]);

  const longGoals = activeGoals.filter((goal) => goal.horizon === 'long');
  const mediumGoals = activeGoals.filter((goal) => goal.horizon === 'medium');
  const shortGoals = activeGoals.filter((goal) => goal.horizon === 'short');
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId);

  const persistGoals = (nextGoals) => save?.({ ...data, goals: nextGoals });

  const openNewGoal = () => {
    setEditingGoal(null);
    setForm({ ...initialForm, startDate: today() });
    setShowForm(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title || '',
      description: goal.description || '',
      category: goal.category || 'Pessoal',
      horizon: goal.horizon || 'long',
      priority: goal.priority || 'medium',
      startDate: goal.startDate || today(),
      targetDate: goal.targetDate || '',
      motivation: goal.motivation || '',
      nextStep: goal.nextStep || '',
    });
    setShowForm(true);
  };

  const updateForm = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const saveGoal = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    const oldMicroGoals = editingGoal ? getMicroGoals(editingGoal) : [];
    const goal = {
      ...(editingGoal || {}),
      id: editingGoal?.id || createId('goal'),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      horizon: form.horizon,
      priority: form.priority,
      status: editingGoal?.status || 'active',
      startDate: form.startDate || today(),
      targetDate: form.targetDate || '',
      motivation: form.motivation.trim(),
      nextStep: form.nextStep.trim(),
      microGoals: oldMicroGoals,
      progress: editingGoal ? calculateProgress(editingGoal) : 0,
      linkedTasks: editingGoal?.linkedTasks || [],
      linkedProjects: editingGoal?.linkedProjects || [],
      history: editingGoal?.history || [{ date: today(), progress: 0 }],
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persistGoals(editingGoal
      ? goals.map((item) => item.id === editingGoal.id ? goal : item)
      : [...goals, goal]);
    setShowForm(false);
    setEditingGoal(null);
  };

  const deleteGoal = (id) => {
    const goal = goals.find((item) => item.id === id);
    if (!goal || !window.confirm(`Excluir o objetivo "${goal.title}"?`)) return;
    persistGoals(goals.filter((item) => item.id !== id));
    if (selectedGoalId === id) setSelectedGoalId(null);
  };

  const saveMicroGoal = (goalId, event) => {
    event.preventDefault();
    const values = microForms[goalId] || emptyMicroForm;
    if (!values.title.trim()) return;

    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;

    const current = getMicroGoals(goal);
    let nextMicroGoals;

    if (editingMicro?.goalId === goalId) {
      nextMicroGoals = current.map((item) =>
        item.id === editingMicro.microId
          ? { ...item, ...values, title: values.title.trim(), description: values.description.trim(), updatedAt: new Date().toISOString() }
          : item,
      );
    } else {
      nextMicroGoals = [...current, {
        id: createId('micro'),
        title: values.title.trim(),
        description: values.description.trim(),
        startDate: values.startDate || '',
        targetDate: values.targetDate || '',
        completed: false,
        createdAt: new Date().toISOString(),
      }];
    }

    const updated = { ...goal, microGoals: nextMicroGoals, progress: 0, updatedAt: new Date().toISOString() };
    updated.progress = calculateProgress(updated);
    if (updated.progress >= 100 && nextMicroGoals.length) updated.status = 'completed';
    else if (updated.status === 'completed') updated.status = 'active';

    persistGoals(goals.map((item) => item.id === goalId ? updated : item));
    setMicroForms((currentForms) => ({ ...currentForms, [goalId]: { ...emptyMicroForm, startDate: today() } }));
    setEditingMicro(null);
  };

  const editMicroGoal = (goalId, micro) => {
    setEditingMicro({ goalId, microId: micro.id });
    setMicroForms((current) => ({
      ...current,
      [goalId]: {
        title: micro.title || '',
        description: micro.description || '',
        startDate: micro.startDate || '',
        targetDate: micro.targetDate || '',
      },
    }));
  };

  const deleteMicroGoal = (goalId, microId) => {
    if (!window.confirm('Excluir este microobjetivo?')) return;
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;
    const updated = {
      ...goal,
      microGoals: getMicroGoals(goal).filter((item) => item.id !== microId),
      updatedAt: new Date().toISOString(),
    };
    updated.progress = calculateProgress(updated);
    if (updated.status === 'completed' && updated.progress < 100) updated.status = 'active';
    persistGoals(goals.map((item) => item.id === goalId ? updated : item));
    if (editingMicro?.microId === microId) setEditingMicro(null);
  };

  const toggleMicroGoal = (goalId, microId) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;
    const updated = {
      ...goal,
      microGoals: getMicroGoals(goal).map((item) =>
        item.id === microId
          ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : null }
          : item,
      ),
      updatedAt: new Date().toISOString(),
    };
    updated.progress = calculateProgress(updated);
    if (updated.microGoals.length && updated.progress >= 100) updated.status = 'completed';
    else if (updated.status === 'completed') updated.status = 'active';
    persistGoals(goals.map((item) => item.id === goalId ? updated : item));
  };

  const completeGoal = (goalId) => {
    persistGoals(goals.map((goal) => goal.id === goalId
      ? { ...goal, progress: 100, status: 'completed', updatedAt: new Date().toISOString(), history: [...(goal.history || []), { date: today(), progress: 100 }] }
      : goal));
  };

  const reopenGoal = (goalId) => {
    persistGoals(goals.map((goal) => goal.id === goalId
      ? { ...goal, status: 'active', updatedAt: new Date().toISOString() }
      : goal));
  };

  const renderMicroGoals = (goal) => {
    const items = getMicroGoals(goal);
    const formValues = microForms[goal.id] || { ...emptyMicroForm, startDate: today() };
    const isEditing = editingMicro?.goalId === goal.id;

    return (
      <section className="goal-micro-section">
        <div className="goal-section-title">🧩 Microobjetivos <span>{items.filter((item) => item.completed).length}/{items.length}</span></div>
        {items.length > 0 && (
          <div className="goal-micro-list">
            {items.map((micro) => {
              const remaining = daysUntil(micro.targetDate);
              const late = !micro.completed && remaining !== null && remaining < 0;
              const near = !micro.completed && remaining !== null && remaining >= 0 && remaining <= 7;
              return (
                <article className={`goal-micro-card ${micro.completed ? 'is-completed' : ''}`} key={micro.id}>
                  <label className="goal-micro-check">
                    <input type="checkbox" checked={!!micro.completed} onChange={() => toggleMicroGoal(goal.id, micro.id)} />
                    <span />
                  </label>
                  <div className="goal-micro-content">
                    <strong>{micro.title}</strong>
                    {micro.description && <p>{micro.description}</p>}
                    <div className="goal-micro-dates">
                      <span>Início: {formatDate(micro.startDate)}</span>
                      <span>Prazo: {formatDate(micro.targetDate)}</span>
                      {late && <b className="micro-late">Atrasado</b>}
                      {near && <b className="micro-near">Prazo próximo</b>}
                      {micro.completed && <b className="micro-done">Concluído</b>}
                    </div>
                  </div>
                  <div className="goal-micro-actions">
                    <button type="button" onClick={() => editMicroGoal(goal.id, micro)} aria-label="Editar microobjetivo">✏️</button>
                    <button type="button" onClick={() => deleteMicroGoal(goal.id, micro.id)} aria-label="Excluir microobjetivo">🗑️</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <form className="goal-micro-form" onSubmit={(event) => saveMicroGoal(goal.id, event)}>
          <div className="goal-micro-form-heading">{isEditing ? 'Editar microobjetivo' : 'Adicionar microobjetivo'}</div>
          <label>
            <span>Nome *</span>
            <input value={formValues.title} onChange={(event) => setMicroForms((current) => ({ ...current, [goal.id]: { ...formValues, title: event.target.value } }))} placeholder="Ex.: Concluir o primeiro capítulo" required />
          </label>
          <label>
            <span>Descrição</span>
            <textarea rows="2" value={formValues.description} onChange={(event) => setMicroForms((current) => ({ ...current, [goal.id]: { ...formValues, description: event.target.value } }))} placeholder="Detalhe o que precisa ser feito..." />
          </label>
          <div className="goal-micro-date-grid">
            <label>
              <span>Data de início</span>
              <input type="date" value={formValues.startDate} onChange={(event) => setMicroForms((current) => ({ ...current, [goal.id]: { ...formValues, startDate: event.target.value } }))} />
            </label>
            <label>
              <span>Prazo final</span>
              <input type="date" min={formValues.startDate || undefined} value={formValues.targetDate} onChange={(event) => setMicroForms((current) => ({ ...current, [goal.id]: { ...formValues, targetDate: event.target.value } }))} />
            </label>
          </div>
          <div className="goal-micro-form-actions">
            {isEditing && <button type="button" className="ghost" onClick={() => { setEditingMicro(null); setMicroForms((current) => ({ ...current, [goal.id]: { ...emptyMicroForm, startDate: today() } })); }}>Cancelar edição</button>}
            <button type="submit" className="primary">{isEditing ? 'Salvar microobjetivo' : '+ Adicionar microobjetivo'}</button>
          </div>
        </form>
      </section>
    );
  };

  const renderGoalCard = (goal) => {
    const progress = calculateProgress(goal);
    const priority = getPriorityData(goal.priority);
    const days = daysUntil(goal.targetDate);
    const isOverdue = days !== null && days < 0;
    const isCompleted = goal.status === 'completed';

    return (
      <article className="goal-card" key={goal.id}>
        <div className="goal-card-top">
          <div className="goal-icon">🎯</div>
          <div className="goal-card-title">
            <div className="goal-tags">
              <span className="goal-tag">{goal.category}</span>
              <span className="goal-tag">{getHorizonLabel(goal.horizon)}</span>
              <span className="goal-tag">{priority.icon} {priority.label}</span>
            </div>
            <h3>{goal.title}</h3>
          </div>
          <button type="button" className="goal-menu-button" onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)} aria-label="Opções">⋮</button>
        </div>

        {goal.description && <p className="goal-description">{goal.description}</p>}
        <GoalProgress value={progress} />

        <div className="goal-meta">
          <div><span>Início</span><strong>{formatDate(goal.startDate)}</strong></div>
          <div><span>Prazo</span><strong className={isOverdue ? 'goal-overdue' : ''}>{formatDate(goal.targetDate)}</strong></div>
          <div><span>Status</span><strong>{isCompleted ? '🏆 Concluído' : isOverdue ? '⚠️ Atrasado' : days === 0 ? '🔥 Hoje' : days !== null && days <= 7 ? `⏳ ${days} dias` : '🟢 Em andamento'}</strong></div>
        </div>

        {goal.nextStep && <div className="goal-next-step"><span>🧭 Próximo passo</span><strong>{goal.nextStep}</strong></div>}
        {goal.motivation && <div className="goal-motivation"><span>💡 Por que isso importa</span><p>{goal.motivation}</p></div>}

        {renderMicroGoals(goal)}

        {selectedGoalId === goal.id && (
          <div className="goal-actions">
            <button type="button" className="ghost" onClick={() => openEditGoal(goal)}>✏️ Editar objetivo</button>
            {!isCompleted
              ? <button type="button" className="ghost" onClick={() => completeGoal(goal.id)}>🏆 Concluir objetivo</button>
              : <button type="button" className="ghost" onClick={() => reopenGoal(goal.id)}>↩️ Reabrir</button>}
            <button type="button" className="ghost danger" onClick={() => deleteGoal(goal.id)}>🗑️ Excluir</button>
          </div>
        )}
      </article>
    );
  };

  const renderEmpty = (icon, title, description) => (
    <div className="goals-empty"><div>{icon}</div><h3>{title}</h3>{description && <p>{description}</p>}</div>
  );

  return (
    <section className="goals-page">
      <header className="goals-header">
        <div><span className="section-eyebrow">DIREÇÃO</span><h2>🎯 Meus Objetivos</h2><p>Transforme seus objetivos em pequenos passos concretos e acompanhe cada conquista.</p></div>
        <button type="button" className="primary" onClick={openNewGoal}>+ Novo objetivo</button>
      </header>

      <div className="goals-summary">
        <div className="goal-summary-card"><span>Objetivos ativos</span><strong>{activeGoals.length}</strong></div>
        <div className="goal-summary-card"><span>Progresso geral</span><strong>{overallProgress}%</strong></div>
        <div className="goal-summary-card"><span>Concluídos</span><strong>{completedGoals.length}</strong></div>
        <div className={`goal-summary-card ${overdueGoals.length ? 'warning' : ''}`}><span>Atrasados</span><strong>{overdueGoals.length}</strong></div>
      </div>

      <div className="goal-alignment">
        <div><span>🧭 Direção atual</span><h3>Seu progresso geral</h3><p>O objetivo não é fazer mais coisas. É fazer mais coisas que aproximam você do que realmente importa.</p></div>
        <div className="alignment-score"><strong>{overallProgress}%</strong><span>progresso médio</span></div>
      </div>

      <nav className="goals-tabs" aria-label="Filtrar objetivos">
        {[
          ['active', 'Ativos'], ['long', 'Longo prazo'], ['medium', 'Médio prazo'],
          ['short', 'Curto prazo'], ['completed', 'Concluídos'],
        ].map(([key, label]) => <button type="button" key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}
      </nav>

      {view === 'active' && (activeGoals.length ? <div className="goals-grid">{activeGoals.map(renderGoalCard)}</div> : renderEmpty('🎯', 'Você ainda não criou nenhum objetivo', 'Comece definindo algo que realmente queira alcançar.'))}
      {view === 'long' && (longGoals.length ? <div className="goals-grid">{longGoals.map(renderGoalCard)}</div> : renderEmpty('🌎', 'Nenhum objetivo de longo prazo', 'Pense em onde você quer estar daqui a 1, 3 ou 5 anos.'))}
      {view === 'medium' && (mediumGoals.length ? <div className="goals-grid">{mediumGoals.map(renderGoalCard)}</div> : renderEmpty('🚀', 'Nenhum objetivo de médio prazo', ''))}
      {view === 'short' && (shortGoals.length ? <div className="goals-grid">{shortGoals.map(renderGoalCard)}</div> : renderEmpty('📅', 'Nenhum objetivo de curto prazo', ''))}
      {view === 'completed' && (completedGoals.length ? <div className="goals-grid">{completedGoals.map(renderGoalCard)}</div> : renderEmpty('🏆', 'Nenhum objetivo concluído ainda', ''))}

      {showForm && (
        <div className="goal-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <div className="goal-modal">
            <div className="goal-modal-header"><div><span>{editingGoal ? 'EDITAR OBJETIVO' : 'NOVO OBJETIVO'}</span><h2>{editingGoal ? 'Atualizar objetivo' : 'Criar objetivo'}</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Fechar">×</button></div>
            <form onSubmit={saveGoal}>
              <div className="goal-form-grid">
                <label><span>Nome do objetivo *</span><input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Ex.: Conseguir estágio em Computação" required /></label>
                <label><span>Categoria</span><select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>{categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label><span>Horizonte</span><select value={form.horizon} onChange={(event) => updateForm('horizon', event.target.value)}>{horizonOptions.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.description}</option>)}</select></label>
                <label><span>Prioridade</span><select value={form.priority} onChange={(event) => updateForm('priority', event.target.value)}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.icon} {item.label}</option>)}</select></label>
                <label><span>Data de início</span><input type="date" value={form.startDate} onChange={(event) => updateForm('startDate', event.target.value)} /></label>
                <label><span>Prazo</span><input type="date" min={form.startDate || undefined} value={form.targetDate} onChange={(event) => updateForm('targetDate', event.target.value)} /></label>
              </div>
              <label><span>Descrição</span><textarea rows="3" value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="O que exatamente você quer alcançar?" /></label>
              <label><span>💡 Por que isso importa?</span><textarea rows="3" value={form.motivation} onChange={(event) => updateForm('motivation', event.target.value)} placeholder="Por que esse objetivo é importante para você?" /></label>
              <label><span>🧭 Próximo passo</span><input value={form.nextStep} onChange={(event) => updateForm('nextStep', event.target.value)} placeholder="Qual é a próxima ação concreta?" /></label>
              <div className="goal-form-actions"><button type="button" className="ghost" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="primary">{editingGoal ? 'Salvar alterações' : 'Criar objetivo'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
