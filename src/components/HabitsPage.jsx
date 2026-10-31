import React, { useMemo, useState } from 'react';

/* =========================================================
   UTILITÁRIOS
========================================================= */

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (year, month, day) => {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const isSameDate = (dateA, dateB) => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

/*
 * Calcula a sequência atual do hábito.
 *
 * A sequência é calculada olhando para os dias mais recentes,
 * evitando o problema do antigo "streak += 1".
 */
const calculateCurrentStreak = (habit) => {
  const history = habit.history || {};
  const today = new Date();

  let streak = 0;

  /*
   * Começamos hoje.
   *
   * Se hoje ainda não foi concluído, verificamos ontem.
   * Isso permite que a sequência continue durante o dia.
   */
  let date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (
    !history[formatDate(date.getFullYear(), date.getMonth(), date.getDate())]
  ) {
    date.setDate(date.getDate() - 1);
  }

  while (true) {
    const dateStr = formatDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (!history[dateStr]) {
      break;
    }

    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
};

/*
 * Calcula a maior sequência histórica.
 */
const calculateBestStreak = (habit) => {
  const history = habit.history || {};

  const dates = Object.keys(history)
    .filter((date) => history[date])
    .sort();

  if (dates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i += 1) {
    const previous = new Date(`${dates[i - 1]}T00:00:00`);
    const currentDate = new Date(`${dates[i]}T00:00:00`);

    const difference = (currentDate - previous) / (1000 * 60 * 60 * 24);

    if (difference === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function HabitsPage({ data, save }) {
  const [habitName, setHabitName] = useState('');
  const [habitFeedback, setHabitFeedback] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayStatus, setDayStatus] = useState('done');
  const [dayReason, setDayReason] = useState('');

  const habits = Array.isArray(data?.habits) ? data.habits : [];

  /* =======================================================
     DATA ATUAL
  ======================================================= */

  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);

  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => index + 1),
    [daysInMonth],
  );

  const monthName = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  /* =======================================================
     DATA DE HOJE
  ======================================================= */

  const todayDate = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const viewingCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  /* =======================================================
     ESTATÍSTICAS
  ======================================================= */

  const statistics = useMemo(() => {
    let completed = 0;
    let possible = 0;

    let bestStreak = 0;
    let activeHabits = 0;

    habits.forEach((habit) => {
      const history = habit.history || {};

      let habitCompleted = 0;

      daysArray.forEach((day) => {
        const dateStr = formatDate(year, month, day);

        possible += 1;

        if (history[dateStr]) {
          completed += 1;
          habitCompleted += 1;
        }
      });

      if (habitCompleted > 0) {
        activeHabits += 1;
      }

      const habitBest = calculateBestStreak(habit);

      bestStreak = Math.max(bestStreak, habitBest);
    });

    const consistency =
      possible > 0 ? Math.round((completed / possible) * 100) : 0;

    return {
      completed,
      possible,
      consistency,
      bestStreak,
      activeHabits,
    };
  }, [habits, daysArray, year, month]);

  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  /* =======================================================
     CRIAR HÁBITO
  ======================================================= */

  const handleAddHabit = (event) => {
    event.preventDefault();

    const name = habitName.trim();

    if (!name) {
      setHabitFeedback('Digite o nome do hábito antes de criar.');
      return;
    }

    if (typeof save !== 'function') {
      setHabitFeedback(
        'Não foi possível salvar: a função de salvamento não foi recebida.',
      );
      return;
    }

    const alreadyExists = habits.some(
      (habit) =>
        String(habit?.name || '')
          .trim()
          .toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'),
    );

    if (alreadyExists) {
      setHabitFeedback('Você já possui um hábito com esse nome.');
      return;
    }

    const newHabit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      streak: 0,
      bestStreak: 0,
      xp: 30,
      history: {},
    };

    try {
      save({
        ...(data || {}),
        habits: [...habits, newHabit],
      });
      setHabitName('');
      setHabitFeedback(`Hábito "${name}" criado com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar hábito:', error);
      setHabitFeedback('Ocorreu um erro ao criar o hábito. Tente novamente.');
    }
  };

  /* =======================================================
     REGISTRAR O STATUS DE UM DIA
  ======================================================= */

  const openDayEditor = (habit, day) => {
    const dateStr = formatDate(year, month, day);
    const missed = Boolean(habit.missed?.[dateStr]);
    const done = Boolean(habit.history?.[dateStr]);

    setSelectedDay({ habitId: habit.id, dateStr, habitName: habit.name, day });
    setDayStatus(done ? 'done' : missed ? 'missed' : 'pending');
    setDayReason(habit.missedReasons?.[dateStr] || '');
  };

  const saveDayStatus = (event) => {
    event.preventDefault();
    if (!selectedDay || typeof save !== 'function') return;

    const targetHabit = habits.find(
      (habit) => String(habit.id) === String(selectedDay.habitId),
    );
    if (!targetHabit) return;

    const dateStr = selectedDay.dateStr;
    const history = { ...(targetHabit.history || {}) };
    const missed = { ...(targetHabit.missed || {}) };
    const missedReasons = { ...(targetHabit.missedReasons || {}) };
    const wasDone = Boolean(history[dateStr]);
    const willBeDone = dayStatus === 'done';

    history[dateStr] = willBeDone;

    if (dayStatus === 'missed') {
      missed[dateStr] = true;
      if (dayReason.trim()) missedReasons[dateStr] = dayReason.trim();
      else delete missedReasons[dateStr];
    } else {
      delete missed[dateStr];
      delete missedReasons[dateStr];
    }

    const temporaryHabit = { ...targetHabit, history };
    const newStreak = calculateCurrentStreak(temporaryHabit);
    const newBestStreak = calculateBestStreak(temporaryHabit);
    const updatedHabits = habits.map((habit) =>
      String(habit.id) === String(selectedDay.habitId)
        ? {
            ...habit,
            history,
            missed,
            missedReasons,
            streak: newStreak,
            bestStreak: Math.max(Number(habit.bestStreak) || 0, newBestStreak),
          }
        : habit,
    );

    const xpChange = wasDone === willBeDone ? 0 : willBeDone ? 30 : -30;
    save({
      ...data,
      xp: Math.max(0, (Number(data?.xp) || 0) + xpChange),
      habits: updatedHabits,
    });

    setSelectedDay(null);
    setDayReason('');
  };

  /* =======================================================
     EXCLUIR HÁBITO
  ======================================================= */

  const removeHabit = (id) => {
    const habit = habits.find((item) => item.id === id);

    if (!habit) return;

    const confirmed = window.confirm(
      `Excluir o hábito "${habit.name}"?\n\nTodo o histórico desse hábito será removido.`,
    );

    if (!confirmed) return;

    save({
      ...data,

      habits: habits.filter((item) => item.id !== id),
    });
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className='card'
      style={{
        borderRadius: 16,
        padding: 24,
      }}
    >
      {/* ===================================================
          CABEÇALHO
      ==================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 30,
              }}
            >
              🔥
            </span>

            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                Hábitos
              </h2>

              <p
                className='subtitle'
                style={{
                  margin: '4px 0 0',
                }}
              >
                Construa consistência um dia de cada vez.
              </p>
            </div>
          </div>
        </div>

        {/* ===============================================
            NAVEGAÇÃO DO MÊS
        ================================================ */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--site-background)',
            padding: 6,
            borderRadius: 12,
            border: '1px solid var(--site-border)',
          }}
        >
          <button
            type='button'
            className='ghost'
            onClick={previousMonth}
            aria-label='Mês anterior'
            style={{
              width: 38,
              height: 36,
              padding: 0,
              fontSize: 22,
            }}
          >
            ‹
          </button>

          <button
            type='button'
            className='ghost'
            onClick={goToToday}
            style={{
              height: 36,
              padding: '0 12px',
              fontWeight: 700,
            }}
          >
            Hoje
          </button>

          <div
            style={{
              minWidth: 150,
              textAlign: 'center',
              fontWeight: 800,
              textTransform: 'capitalize',
            }}
          >
            {monthName}
          </div>

          <button
            type='button'
            className='ghost'
            onClick={nextMonth}
            aria-label='Próximo mês'
            style={{
              width: 38,
              height: 36,
              padding: 0,
              fontSize: 22,
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* ===================================================
          INDICADORES
      ==================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {/* HÁBITOS */}
        <div
          className='stat'
          style={{
            padding: 16,
          }}
        >
          <strong>{habits.length}</strong>

          <small>Hábitos ativos</small>
        </div>

        {/* CONCLUSÕES */}
        <div
          className='stat'
          style={{
            padding: 16,
          }}
        >
          <strong>{statistics.completed}</strong>

          <small>Conclusões no mês</small>
        </div>

        {/* CONSISTÊNCIA */}
        <div
          className='stat'
          style={{
            padding: 16,
          }}
        >
          <strong>{statistics.consistency}%</strong>

          <small>Consistência</small>
        </div>

        {/* MELHOR SEQUÊNCIA */}
        <div
          className='stat'
          style={{
            padding: 16,
          }}
        >
          <strong>🔥 {statistics.bestStreak}d</strong>

          <small>Melhor sequência</small>
        </div>
      </div>

      {/* ===================================================
          PROGRESSO GERAL
      ==================================================== */}

      {habits.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--site-border)',
            background: 'var(--site-background)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <strong>Progresso do mês</strong>

            <span
              style={{
                color: 'var(--site-text-muted)',
                fontSize: 13,
              }}
            >
              {statistics.completed}/{statistics.possible} conclusões
            </span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 999,
              overflow: 'hidden',
              background: 'var(--site-border)',
            }}
          >
            <div
              style={{
                width: `${statistics.consistency}%`,
                height: '100%',
                borderRadius: 999,
                background: 'var(--site-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* ===================================================
          CRIAR HÁBITO
      ==================================================== */}

      <form
        onSubmit={handleAddHabit}
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <input
          type='text'
          placeholder='Novo hábito — ex.: Ler 10 páginas'
          value={habitName}
          onChange={(event) => setHabitName(event.target.value)}
          maxLength={80}
          style={{
            margin: 0,
            flex: 1,
            minWidth: 220,
            padding: '12px 16px',
            borderRadius: 10,
          }}
        />

        <button
          type='submit'
          className='primary'
          style={{
            minHeight: 46,
            padding: '0 20px',
            fontWeight: 700,
            borderRadius: 10,
          }}
        >
          + Criar hábito
        </button>
      </form>

      {habitFeedback && (
        <p
          role='status'
          aria-live='polite'
          style={{
            margin: '-12px 0 18px',
            color: habitFeedback.includes('sucesso')
              ? 'var(--site-primary)'
              : 'var(--site-danger, #ef4444)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {habitFeedback}
        </p>
      )}

      {/* ===================================================
          MATRIZ DE HÁBITOS
      ==================================================== */}

      <div
        style={{
          overflowX: 'auto',
          width: '100%',
          borderRadius: 14,
          border: '1px solid var(--site-border)',
          background: 'var(--site-card-bg)',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 850,
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 13,
          }}
        >
          {/* ===============================================
              CABEÇALHO
          ================================================ */}

          <thead>
            <tr
              style={{
                background: 'var(--site-background)',
                borderBottom: '2px solid var(--site-border)',
              }}
            >
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  padding: '14px 16px',
                  minWidth: 230,
                  background: 'var(--site-background)',
                }}
              >
                Hábito
              </th>

              <th
                style={{
                  padding: '14px 8px',
                  textAlign: 'center',
                  width: 90,
                  background: 'var(--site-background)',
                }}
              >
                Sequência
              </th>

              {daysArray.map((day) => {
                const dateStr = formatDate(year, month, day);

                const dateObject = new Date(year, month, day);

                const isToday = dateStr === todayDate;

                const isSunday = dateObject.getDay() === 0;

                return (
                  <th
                    key={day}
                    style={{
                      padding: '10px 2px',
                      textAlign: 'center',
                      width: 32,
                      fontSize: 11,
                      color: isToday
                        ? 'var(--site-primary)'
                        : 'var(--site-text-muted)',
                      fontWeight: isToday ? 900 : 600,
                      background: isToday
                        ? 'color-mix(in srgb, var(--site-primary) 10%, transparent)'
                        : undefined,
                      borderLeft: isSunday
                        ? '1px solid var(--site-border)'
                        : undefined,
                    }}
                    title={
                      isToday ? 'Hoje' : dateObject.toLocaleDateString('pt-BR')
                    }
                  >
                    {day}
                  </th>
                );
              })}

              <th
                style={{
                  padding: '14px 12px',
                  textAlign: 'center',
                  width: 60,
                  background: 'var(--site-background)',
                }}
              >
                Ação
              </th>
            </tr>
          </thead>

          {/* ===============================================
              CORPO
          ================================================ */}

          <tbody>
            {habits.map((habit, index) => {
              const history = habit.history || {};

              const currentStreak = calculateCurrentStreak(habit);

              const bestStreak = calculateBestStreak(habit);

              const completedThisMonth = daysArray.filter((day) => {
                const dateStr = formatDate(year, month, day);

                return Boolean(history[dateStr]);
              }).length;

              const habitProgress =
                daysInMonth > 0
                  ? Math.round((completedThisMonth / daysInMonth) * 100)
                  : 0;

              return (
                <tr
                  key={habit.id}
                  style={{
                    borderBottom:
                      index === habits.length - 1
                        ? 'none'
                        : '1px solid var(--site-border)',
                  }}
                >
                  {/* HÁBITO */}
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      padding: '14px 16px',
                      background: 'var(--site-card-bg)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 7,
                      }}
                    >
                      <strong>{habit.name}</strong>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 70,
                            height: 5,
                            borderRadius: 999,
                            overflow: 'hidden',
                            background: 'var(--site-border)',
                          }}
                        >
                          <div
                            style={{
                              width: `${habitProgress}%`,
                              height: '100%',
                              borderRadius: 999,
                              background: 'var(--site-primary)',
                            }}
                          />
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--site-text-muted)',
                          }}
                        >
                          {habitProgress}%
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* SEQUÊNCIA */}
                  <td
                    style={{
                      padding: '14px 8px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '4px 8px',
                          borderRadius: 7,
                          background: 'rgba(255, 152, 0, 0.12)',
                          color: 'var(--site-warning, #b26500)',
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        🔥 {currentStreak}d
                      </span>

                      <small
                        style={{
                          color: 'var(--site-text-muted)',
                          fontSize: 10,
                        }}
                      >
                        recorde {bestStreak}d
                      </small>
                    </div>
                  </td>

                  {/* DIAS */}
                  {daysArray.map((day) => {
                    const dateStr = formatDate(year, month, day);

                    const isDone = Boolean(history[dateStr]);
                    const isMissed = Boolean(habit.missed?.[dateStr]) && !isDone;

                    const isToday = dateStr === todayDate;

                    const dateObject = new Date(year, month, day);

                    const isSunday = dateObject.getDay() === 0;

                    return (
                      <td
                        key={day}
                        style={{
                          padding: '9px 2px',
                          textAlign: 'center',
                          background: isToday
                            ? 'color-mix(in srgb, var(--site-primary) 6%, transparent)'
                            : undefined,
                          borderLeft: isSunday
                            ? '1px solid var(--site-border)'
                            : undefined,
                        }}
                      >
                        <button
                          type='button'
                          onClick={() => openDayEditor(habit, day)}
                          aria-label={`${habit.name} — dia ${day}`}
                          title={`Dia ${day}: ${isDone ? 'Concluído' : isMissed ? `Não realizado${habit.missedReasons?.[dateStr] ? ` — ${habit.missedReasons[dateStr]}` : ''}` : 'Sem registro'}. Clique para editar.`}
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 8,
                            border: isDone
                              ? '2px solid var(--site-primary)'
                              : isMissed
                                ? '2px solid var(--site-danger, #dc2626)'
                                : '2px solid var(--site-border)',
                            background: isDone
                              ? 'var(--site-primary)'
                              : isMissed
                                ? 'color-mix(in srgb, var(--site-danger, #dc2626) 14%, transparent)'
                                : 'var(--site-background)',
                            color: isDone ? '#fff' : isMissed ? 'var(--site-danger, #dc2626)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 900,
                            display: 'inline-grid',
                            placeItems: 'center',
                            transition:
                              'transform 0.15s ease, background 0.15s ease, border 0.15s ease',
                            boxShadow: isToday
                              ? '0 0 0 2px color-mix(in srgb, var(--site-primary) 20%, transparent)'
                              : 'none',
                          }}
                        >
                          {isDone ? '✓' : isMissed ? '×' : ''}
                        </button>
                      </td>
                    );
                  })}

                  {/* EXCLUIR */}
                  <td
                    style={{
                      padding: '14px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      type='button'
                      className='ghost'
                      onClick={() => removeHabit(habit.id)}
                      title='Excluir hábito'
                      aria-label={`Excluir ${habit.name}`}
                      style={{
                        color: 'var(--site-danger)',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* =============================================
                ESTADO VAZIO
            ============================================== */}

            {habits.length === 0 && (
              <tr>
                <td
                  colSpan={daysArray.length + 3}
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--site-text-muted)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 38,
                      marginBottom: 10,
                    }}
                  >
                    🔥
                  </div>

                  <strong
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      color: 'var(--site-text)',
                    }}
                  >
                    Nenhum hábito criado
                  </strong>

                  <span>
                    Crie seu primeiro hábito acima para começar a acompanhar sua
                    consistência.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* HISTÓRICO DE DIAS NÃO REALIZADOS */}
      {habits.some((habit) => Object.values(habit.missed || {}).some(Boolean)) && (
        <section style={{ marginTop: 24 }}>
          <h3 style={{ margin: '0 0 12px' }}>📝 Histórico de dias não realizados</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {habits.flatMap((habit) =>
              Object.keys(habit.missed || {})
                .filter((date) => habit.missed[date])
                .sort((a, b) => b.localeCompare(a))
                .map((date) => (
                  <div key={`${habit.id}-${date}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: '1px solid var(--site-border)', borderRadius: 10, background: 'var(--site-background)' }}>
                    <div>
                      <strong>{habit.name}</strong>
                      <span className='subtitle' style={{ display: 'block', fontSize: 12 }}>{date.split('-').reverse().join('/')}</span>
                    </div>
                    <span style={{ color: 'var(--site-danger, #dc2626)', fontSize: 13 }}>
                      {habit.missedReasons?.[date] || 'Motivo não informado'}
                    </span>
                  </div>
                )),
            )}
          </div>
        </section>
      )}

      {/* EDITAR REGISTRO DO DIA */}
      {selectedDay && (
        <div
          role='presentation'
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDay(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(0,0,0,.55)' }}
        >
          <form onSubmit={saveDayStatus} className='card' style={{ width: 'min(100%, 440px)', padding: 22, borderRadius: 16, background: 'var(--site-card-bg)', color: 'var(--site-text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0 }}>Registro do hábito</h3>
              <button type='button' className='ghost' onClick={() => setSelectedDay(null)} aria-label='Fechar'>✕</button>
            </div>
            <p className='subtitle' style={{ margin: '8px 0 16px' }}>
              {selectedDay.habitName} · {selectedDay.dateStr.split('-').reverse().join('/')}
            </p>
            <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
              Como foi esse dia?
              <select value={dayStatus} onChange={(event) => setDayStatus(event.target.value)}>
                <option value='done'>Concluí o hábito</option>
                <option value='missed'>Não consegui fazer</option>
                <option value='pending'>Ainda não quero registrar</option>
              </select>
            </label>
            {dayStatus === 'missed' && (
              <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                Qual foi o motivo? (opcional)
                <textarea rows={3} maxLength={300} value={dayReason} onChange={(event) => setDayReason(event.target.value)} placeholder='Ex.: falta de tempo, cansaço, imprevisto...' />
              </label>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <button type='button' className='ghost' onClick={() => setSelectedDay(null)}>Cancelar</button>
              <button type='submit' className='primary'>Salvar registro</button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================
          LEGENDA
      ==================================================== */}

      {habits.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 16,
            color: 'var(--site-text-muted)',
            fontSize: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                display: 'inline-grid',
                placeItems: 'center',
                background: 'var(--site-primary)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              ✓
            </span>
            Hábito concluído
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, display: 'inline-grid', placeItems: 'center', border: '1px solid var(--site-danger, #dc2626)', color: 'var(--site-danger, #dc2626)', fontWeight: 900 }}>×</span>
            Não realizado
          </div>

          <div>
            Cada conclusão rende{' '}
            <strong
              style={{
                color: 'var(--site-primary)',
              }}
            >
              +30 XP
            </strong>
          </div>

          <div>🔥 Sequência atual baseada no histórico real</div>
        </div>
      )}
    </div>
  );
}
