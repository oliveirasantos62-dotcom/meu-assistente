import React, { useState } from 'react';

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (date) => {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
};

export default function Habits({ data, save }) {
  const [habitName, setHabitName] = useState('');
  const habits = data.habits || [];

  const todayStr = formatDate(new Date());

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const newHabit = {
      id: Date.now(),
      name: habitName.trim(),
      streak: 0,
      bestStreak: 0,
      xp: 30,
      history: {}, // Registo de dias concluídos { '2026-10-29': true }
    };

    save({
      ...data,
      habits: [...habits, newHabit],
    });
    setHabitName('');
  };

  const toggleTodayHabit = (id) => {
    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        const history = habit.history || {};
        const isDoneToday = !!history[todayStr];
        const nextDone = !isDoneToday;

        let streak = habit.streak || 0;
        let bestStreak = habit.bestStreak || 0;

        if (nextDone) {
          streak += 1;
          if (streak > bestStreak) bestStreak = streak;
        } else {
          streak = Math.max(0, streak - 1);
        }

        return {
          ...habit,
          streak,
          bestStreak,
          history: { ...history, [todayStr]: nextDone },
        };
      }
      return habit;
    });

    const target = habits.find((h) => h.id === id);
    const wasDone = target?.history?.[todayStr];
    const xpChange = !wasDone ? 30 : -30;

    save({
      ...data,
      xp: Math.max(0, (data.xp || 0) + xpChange),
      habits: updatedHabits,
    });
  };

  const removeHabit = (id) => {
    save({
      ...data,
      habits: habits.filter((h) => h.id !== id),
    });
  };

  return (
    <div className='card' style={{ minHeight: 'auto', marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div>
          <h2>🔥 Hábitos & Sequências</h2>
          <p className='subtitle'>
            Foque na consistência diária e multiplique sua sequência de fogo.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleAddHabit}
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <input
          placeholder='Novo hábito diário (ex: Meditar 10 min)...'
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          style={{ margin: 0, flex: 1 }}
        />
        <button type='submit' className='primary' style={{ height: 42 }}>
          Criar Hábito
        </button>
      </form>

      <div style={{ display: 'grid', gap: 12 }}>
        {habits.map((habit) => {
          const isDoneToday = !!habit.history?.[todayStr];

          return (
            <div
              key={habit.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--site-background)',
                borderRadius: 14,
                border: '1px solid var(--site-border)',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <button
                  type='button'
                  onClick={() => toggleTodayHabit(habit.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: `2px solid ${isDoneToday ? '#217764' : 'var(--site-border)'}`,
                    background: isDoneToday ? '#217764' : 'var(--site-card-bg)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {isDoneToday ? '✓' : ''}
                </button>

                <div style={{ minWidth: 0 }}>
                  <strong
                    style={{
                      display: 'block',
                      textDecoration: isDoneToday ? 'line-through' : 'none',
                      color: isDoneToday ? 'var(--site-text-muted)' : 'inherit',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {habit.name}
                  </strong>
                  <small style={{ color: 'var(--site-text-muted)' }}>
                    🔥 Sequência atual:{' '}
                    <strong>{habit.streak || 0} dias</strong> · Recorde:{' '}
                    {habit.bestStreak || 0} dias
                  </small>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  className='tag'
                  style={{
                    background: 'rgba(255, 152, 0, 0.12)',
                    color: '#b26500',
                    fontWeight: 800,
                  }}
                >
                  🔥 {habit.streak || 0}d
                </span>
                <button
                  className='ghost'
                  onClick={() => removeHabit(habit.id)}
                  style={{
                    padding: '6px 10px',
                    color: 'var(--site-danger)',
                    border: 'none',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        {habits.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px 0',
              color: 'var(--site-text-muted)',
            }}
          >
            Nenhum hábito registado. Comece adicionando um hábito acima para
            acompanhar suas sequências!
          </div>
        )}
      </div>
    </div>
  );
}
