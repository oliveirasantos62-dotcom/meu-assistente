import React, { useMemo, useState } from 'react';
import './Goals.css';

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

  if (!year || !month || !day) return date;

  return `${day}/${month}/${year}`;
};

const daysUntil = (date) => {
  if (!date) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
  'Carreira',
  'Estudos',
  'Finanças',
  'Saúde',
  'Projetos',
  'Relacionamentos',
  'Pessoal',
  'Outro',
];

const priorityOptions = [
  {
    value: 'high',
    label: 'Alta',
    icon: '🔴',
  },
  {
    value: 'medium',
    label: 'Média',
    icon: '🟡',
  },
  {
    value: 'low',
    label: 'Baixa',
    icon: '🟢',
  },
];

const horizonOptions = [
  {
    value: 'long',
    label: 'Longo prazo',
    description: '1 a 5 anos',
  },
  {
    value: 'medium',
    label: 'Médio prazo',
    description: '3 a 12 meses',
  },
  {
    value: 'short',
    label: 'Curto prazo',
    description: 'Até 3 meses',
  },
];

function getHorizonLabel(horizon) {
  const item = horizonOptions.find((option) => option.value === horizon);

  return item?.label || 'Longo prazo';
}

function getPriorityData(priority) {
  return (
    priorityOptions.find((option) => option.value === priority) ||
    priorityOptions[1]
  );
}

function normalizeGoals(data) {
  return Array.isArray(data?.goals) ? data.goals : [];
}

function calculateProgress(goal) {
  if (!Array.isArray(goal.milestones)) {
    return Number(goal.progress) || 0;
  }

  if (!goal.milestones.length) {
    return Number(goal.progress) || 0;
  }

  const completed = goal.milestones.filter(
    (milestone) => milestone.completed,
  ).length;

  return Math.round((completed / goal.milestones.length) * 100);
}

function GoalProgress({ value }) {
  return (
    <div className='goal-progress'>
      <div className='goal-progress-header'>
        <span>Progresso</span>
        <strong>{value}%</strong>
      </div>

      <div className='goal-progress-track'>
        <div
          className='goal-progress-fill'
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function Goals({ data, save }) {
  const goals = normalizeGoals(data);

  const [view, setView] = useState('active');

  const [showForm, setShowForm] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [milestoneText, setMilestoneText] = useState('');

  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const [progressValue, setProgressValue] = useState(0);

  const activeGoals = useMemo(
    () =>
      goals.filter(
        (goal) => goal.status !== 'completed' && goal.status !== 'archived',
      ),
    [goals],
  );

  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'completed'),
    [goals],
  );

  const overdueGoals = useMemo(
    () =>
      activeGoals.filter((goal) => {
        const days = daysUntil(goal.targetDate);

        return days !== null && days < 0;
      }),
    [activeGoals],
  );

  const overallProgress = useMemo(() => {
    if (!activeGoals.length) return 0;

    const total = activeGoals.reduce(
      (sum, goal) => sum + calculateProgress(goal),
      0,
    );

    return Math.round(total / activeGoals.length);
  }, [activeGoals]);

  const longGoals = activeGoals.filter((goal) => goal.horizon === 'long');

  const mediumGoals = activeGoals.filter((goal) => goal.horizon === 'medium');

  const shortGoals = activeGoals.filter((goal) => goal.horizon === 'short');

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId);

  const openNewGoal = () => {
    setEditingGoal(null);
    setForm(initialForm);
    setMilestoneText('');
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

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveGoal = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    const oldMilestones = editingGoal?.milestones || [];

    const goal = {
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

      milestones: oldMilestones,

      progress: editingGoal ? calculateProgress(editingGoal) : 0,

      linkedTasks: editingGoal?.linkedTasks || [],

      linkedProjects: editingGoal?.linkedProjects || [],

      history: editingGoal?.history || [
        {
          date: today(),
          progress: 0,
        },
      ],

      createdAt: editingGoal?.createdAt || new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    const nextGoals = editingGoal
      ? goals.map((item) => (item.id === editingGoal.id ? goal : item))
      : [...goals, goal];

    save({
      ...data,
      goals: nextGoals,
    });

    setShowForm(false);
    setEditingGoal(null);
    setForm(initialForm);
  };

  const deleteGoal = (id) => {
    const goal = goals.find((item) => item.id === id);

    if (!goal) return;

    const confirmed = window.confirm(`Excluir o objetivo "${goal.title}"?`);

    if (!confirmed) return;

    save({
      ...data,
      goals: goals.filter((item) => item.id !== id),
    });

    if (selectedGoalId === id) {
      setSelectedGoalId(null);
    }
  };

  const addMilestone = () => {
    const text = milestoneText.trim();

    if (!text || !editingGoal) return;

    const updatedGoal = {
      ...editingGoal,

      milestones: [
        ...(editingGoal.milestones || []),
        {
          id: createId('milestone'),
          title: text,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],

      updatedAt: new Date().toISOString(),
    };

    const nextGoals = goals.map((goal) =>
      goal.id === editingGoal.id ? updatedGoal : goal,
    );

    save({
      ...data,
      goals: nextGoals,
    });

    setEditingGoal(updatedGoal);
    setMilestoneText('');
  };

  const toggleMilestone = (goalId, milestoneId) => {
    const goal = goals.find((item) => item.id === goalId);

    if (!goal) return;

    const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];

    const updatedMilestones = milestones.map((milestone) =>
      milestone.id === milestoneId
        ? {
            ...milestone,
            completed: !milestone.completed,
            completedAt: !milestone.completed ? new Date().toISOString() : null,
          }
        : milestone,
    );

    const updatedGoal = {
      ...goal,
      milestones: updatedMilestones,
      progress: calculateProgress({
        ...goal,
        milestones: updatedMilestones,
      }),
      updatedAt: new Date().toISOString(),
    };

    if (updatedGoal.progress >= 100) {
      updatedGoal.status = 'completed';
    } else if (updatedGoal.status === 'completed') {
      updatedGoal.status = 'active';
    }

    const nextGoals = goals.map((item) =>
      item.id === goalId ? updatedGoal : item,
    );

    save({
      ...data,
      goals: nextGoals,
    });

    setEditingGoal((current) =>
      current?.id === goalId ? updatedGoal : current,
    );
  };

  const updateManualProgress = (goalId, value) => {
    const numericValue = Math.min(100, Math.max(0, Number(value) || 0));

    const goal = goals.find((item) => item.id === goalId);

    if (!goal) return;

    const previousProgress = calculateProgress(goal);

    const updatedGoal = {
      ...goal,

      progress: numericValue,

      status: numericValue >= 100 ? 'completed' : 'active',

      updatedAt: new Date().toISOString(),

      history: [
        ...(goal.history || []),
        {
          date: today(),
          progress: numericValue,
        },
      ],
    };

    const nextGoals = goals.map((item) =>
      item.id === goalId ? updatedGoal : item,
    );

    save({
      ...data,
      goals: nextGoals,
    });

    setProgressValue(numericValue);

    // Evita variável não utilizada em alguns linters
    void previousProgress;
  };

  const completeGoal = (goalId) => {
    const goal = goals.find((item) => item.id === goalId);

    if (!goal) return;

    const updatedGoal = {
      ...goal,

      progress: 100,

      status: 'completed',

      updatedAt: new Date().toISOString(),

      history: [
        ...(goal.history || []),
        {
          date: today(),
          progress: 100,
        },
      ],
    };

    save({
      ...data,

      goals: goals.map((item) => (item.id === goalId ? updatedGoal : item)),
    });
  };

  const reopenGoal = (goalId) => {
    save({
      ...data,

      goals: goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: 'active',
              updatedAt: new Date().toISOString(),
            }
          : goal,
      ),
    });
  };

  const renderGoalCard = (goal) => {
    const progress = calculateProgress(goal);

    const priority = getPriorityData(goal.priority);

    const days = daysUntil(goal.targetDate);

    const isOverdue = days !== null && days < 0;

    const isCompleted = goal.status === 'completed';

    return (
      <article className='goal-card' key={goal.id}>
        <div className='goal-card-top'>
          <div className='goal-icon'>🎯</div>

          <div className='goal-card-title'>
            <div className='goal-tags'>
              <span className='goal-tag'>{goal.category}</span>

              <span className='goal-tag'>{getHorizonLabel(goal.horizon)}</span>

              <span className='goal-tag'>
                {priority.icon} {priority.label}
              </span>
            </div>

            <h3>{goal.title}</h3>
          </div>

          <button
            type='button'
            className='goal-menu-button'
            onClick={() =>
              setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)
            }
            aria-label='Opções'
          >
            ⋮
          </button>
        </div>

        {goal.description && (
          <p className='goal-description'>{goal.description}</p>
        )}

        <GoalProgress value={progress} />

        <div className='goal-meta'>
          <div>
            <span>Início</span>
            <strong>{formatDate(goal.startDate)}</strong>
          </div>

          <div>
            <span>Prazo</span>
            <strong className={isOverdue ? 'goal-overdue' : ''}>
              {formatDate(goal.targetDate)}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {isCompleted
                ? '🏆 Concluído'
                : isOverdue
                  ? '⚠️ Atrasado'
                  : days === 0
                    ? '🔥 Hoje'
                    : days !== null && days <= 7
                      ? `⏳ ${days} dias`
                      : '🟢 Em andamento'}
            </strong>
          </div>
        </div>

        {goal.nextStep && (
          <div className='goal-next-step'>
            <span>🧭 Próximo passo</span>

            <strong>{goal.nextStep}</strong>
          </div>
        )}

        {goal.motivation && (
          <div className='goal-motivation'>
            <span>💡 Por que isso importa</span>

            <p>{goal.motivation}</p>
          </div>
        )}

        {goal.milestones?.length > 0 && (
          <div className='goal-milestones'>
            <div className='goal-section-title'>Etapas</div>

            {goal.milestones.slice(0, 4).map((milestone) => (
              <label className='goal-milestone' key={milestone.id}>
                <input
                  type='checkbox'
                  checked={!!milestone.completed}
                  onChange={() => toggleMilestone(goal.id, milestone.id)}
                />

                <span className={milestone.completed ? 'completed' : ''}>
                  {milestone.title}
                </span>
              </label>
            ))}

            {goal.milestones.length > 4 && (
              <small>+{goal.milestones.length - 4} etapas</small>
            )}
          </div>
        )}

        {selectedGoalId === goal.id && (
          <div className='goal-actions'>
            <button
              type='button'
              className='ghost'
              onClick={() => openEditGoal(goal)}
            >
              ✏️ Editar
            </button>

            {!isCompleted ? (
              <button
                type='button'
                className='ghost'
                onClick={() => completeGoal(goal.id)}
              >
                🏆 Concluir
              </button>
            ) : (
              <button
                type='button'
                className='ghost'
                onClick={() => reopenGoal(goal.id)}
              >
                ↩️ Reabrir
              </button>
            )}

            <button
              type='button'
              className='ghost danger'
              onClick={() => deleteGoal(goal.id)}
            >
              🗑️ Excluir
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <section className='goals-page'>
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className='goals-header'>
        <div>
          <span className='section-eyebrow'>DIREÇÃO</span>

          <h2>🎯 Meus Objetivos</h2>

          <p>
            Transforme seus objetivos de longo prazo em próximos passos
            concretos.
          </p>
        </div>

        <button type='button' className='primary' onClick={openNewGoal}>
          + Novo objetivo
        </button>
      </div>

      {/* =====================================================
          RESUMO
      ====================================================== */}

      <div className='goals-summary'>
        <div className='goal-summary-card'>
          <span>Objetivos ativos</span>
          <strong>{activeGoals.length}</strong>
        </div>

        <div className='goal-summary-card'>
          <span>Progresso geral</span>
          <strong>{overallProgress}%</strong>
        </div>

        <div className='goal-summary-card'>
          <span>Concluídos</span>
          <strong>{completedGoals.length}</strong>
        </div>

        <div
          className={`goal-summary-card ${
            overdueGoals.length ? 'warning' : ''
          }`}
        >
          <span>Atrasados</span>
          <strong>{overdueGoals.length}</strong>
        </div>
      </div>

      {/* =====================================================
          ALINHAMENTO
      ====================================================== */}

      <div className='goal-alignment'>
        <div>
          <span>🧭 Direção atual</span>

          <h3>Seu progresso geral</h3>

          <p>
            O objetivo não é fazer mais coisas. É fazer mais coisas que
            aproximam você do que realmente importa.
          </p>
        </div>

        <div className='alignment-score'>
          <strong>{overallProgress}%</strong>

          <span>progresso médio</span>
        </div>
      </div>

      {/* =====================================================
          MENU
      ====================================================== */}

      <div className='goals-tabs'>
        <button
          type='button'
          className={view === 'active' ? 'active' : ''}
          onClick={() => setView('active')}
        >
          Ativos
        </button>

        <button
          type='button'
          className={view === 'long' ? 'active' : ''}
          onClick={() => setView('long')}
        >
          Longo prazo
        </button>

        <button
          type='button'
          className={view === 'medium' ? 'active' : ''}
          onClick={() => setView('medium')}
        >
          Médio prazo
        </button>

        <button
          type='button'
          className={view === 'short' ? 'active' : ''}
          onClick={() => setView('short')}
        >
          Curto prazo
        </button>

        <button
          type='button'
          className={view === 'completed' ? 'active' : ''}
          onClick={() => setView('completed')}
        >
          Concluídos
        </button>
      </div>

      {/* =====================================================
          CONTEÚDO
      ====================================================== */}

      {view === 'active' && (
        <>
          {activeGoals.length === 0 ? (
            <div className='goals-empty'>
              <div>🎯</div>

              <h3>Você ainda não criou nenhum objetivo</h3>

              <p>Comece definindo algo que realmente queira alcançar.</p>

              <button type='button' className='primary' onClick={openNewGoal}>
                Criar meu primeiro objetivo
              </button>
            </div>
          ) : (
            <div className='goals-grid'>{activeGoals.map(renderGoalCard)}</div>
          )}
        </>
      )}

      {view === 'long' && (
        <div className='goals-grid'>
          {longGoals.length ? (
            longGoals.map(renderGoalCard)
          ) : (
            <div className='goals-empty'>
              <div>🌎</div>
              <h3>Nenhum objetivo de longo prazo</h3>
              <p>Pense em onde você quer estar daqui a 1, 3 ou 5 anos.</p>
            </div>
          )}
        </div>
      )}

      {view === 'medium' && (
        <div className='goals-grid'>
          {mediumGoals.length ? (
            mediumGoals.map(renderGoalCard)
          ) : (
            <div className='goals-empty'>
              <div>🚀</div>
              <h3>Nenhum objetivo de médio prazo</h3>
            </div>
          )}
        </div>
      )}

      {view === 'short' && (
        <div className='goals-grid'>
          {shortGoals.length ? (
            shortGoals.map(renderGoalCard)
          ) : (
            <div className='goals-empty'>
              <div>📅</div>
              <h3>Nenhum objetivo de curto prazo</h3>
            </div>
          )}
        </div>
      )}

      {view === 'completed' && (
        <div className='goals-grid'>
          {completedGoals.length ? (
            completedGoals.map(renderGoalCard)
          ) : (
            <div className='goals-empty'>
              <div>🏆</div>
              <h3>Nenhum objetivo concluído ainda</h3>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          FORMULÁRIO
      ====================================================== */}

      {showForm && (
        <div
          className='goal-modal-overlay'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className='goal-modal'>
            <div className='goal-modal-header'>
              <div>
                <span>{editingGoal ? 'EDITAR OBJETIVO' : 'NOVO OBJETIVO'}</span>

                <h2>{editingGoal ? 'Atualizar objetivo' : 'Criar objetivo'}</h2>
              </div>

              <button type='button' onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={saveGoal}>
              <div className='goal-form-grid'>
                <label>
                  <span>Nome do objetivo *</span>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateForm('title', event.target.value)
                    }
                    placeholder='Ex.: Conseguir estágio em Computação'
                    required
                  />
                </label>

                <label>
                  <span>Categoria</span>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm('category', event.target.value)
                    }
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Horizonte</span>

                  <select
                    value={form.horizon}
                    onChange={(event) =>
                      updateForm('horizon', event.target.value)
                    }
                  >
                    {horizonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} — {option.description}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Prioridade</span>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm('priority', event.target.value)
                    }
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Data de início</span>

                  <input
                    type='date'
                    value={form.startDate}
                    onChange={(event) =>
                      updateForm('startDate', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Prazo</span>

                  <input
                    type='date'
                    value={form.targetDate}
                    onChange={(event) =>
                      updateForm('targetDate', event.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                <span>Descrição</span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  placeholder='O que exatamente você quer alcançar?'
                  rows={3}
                />
              </label>

              <label>
                <span>💡 Por que isso importa?</span>

                <textarea
                  value={form.motivation}
                  onChange={(event) =>
                    updateForm('motivation', event.target.value)
                  }
                  placeholder='Por que esse objetivo é importante para você?'
                  rows={3}
                />
              </label>

              <label>
                <span>🧭 Próximo passo</span>

                <input
                  value={form.nextStep}
                  onChange={(event) =>
                    updateForm('nextStep', event.target.value)
                  }
                  placeholder='Qual é a próxima ação concreta?'
                />
              </label>

              {/* ETAPAS */}

              {editingGoal && (
                <div className='milestone-editor'>
                  <div className='goal-section-title'>Etapas do objetivo</div>

                  <div className='milestone-add'>
                    <input
                      value={milestoneText}
                      onChange={(event) => setMilestoneText(event.target.value)}
                      placeholder='Ex.: Finalizar portfólio'
                    />

                    <button
                      type='button'
                      className='ghost'
                      onClick={addMilestone}
                    >
                      + Adicionar
                    </button>
                  </div>

                  {editingGoal.milestones?.map((milestone) => (
                    <label className='goal-milestone' key={milestone.id}>
                      <input
                        type='checkbox'
                        checked={!!milestone.completed}
                        onChange={() =>
                          toggleMilestone(editingGoal.id, milestone.id)
                        }
                      />

                      <span className={milestone.completed ? 'completed' : ''}>
                        {milestone.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className='goal-form-actions'>
                <button
                  type='button'
                  className='ghost'
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>

                <button type='submit' className='primary'>
                  {editingGoal ? 'Salvar alterações' : 'Criar objetivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ATUALIZAÇÃO MANUAL RÁPIDA
      ====================================================== */}

      {selectedGoal && (
        <div className='goal-progress-panel'>
          <div>
            <span>Atualização rápida</span>

            <strong>{selectedGoal.title}</strong>
          </div>

          <input
            type='range'
            min='0'
            max='100'
            value={progressValue || calculateProgress(selectedGoal)}
            onChange={(event) => setProgressValue(Number(event.target.value))}
            onMouseUp={(event) =>
              updateManualProgress(selectedGoal.id, event.target.value)
            }
            onTouchEnd={(event) =>
              updateManualProgress(selectedGoal.id, event.target.value)
            }
          />

          <span>{progressValue || calculateProgress(selectedGoal)}%</span>
        </div>
      )}
    </section>
  );
}
