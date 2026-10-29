import React, { useMemo, useState } from 'react';

const EVENT_TYPES = {
  task: {
    label: 'Tarefa',
    icon: '✅',
    color: '#6d5dfc',
  },

  appointment: {
    label: 'Compromisso',
    icon: '📌',
    color: '#2196f3',
  },

  income: {
    label: 'Receita',
    icon: '💰',
    color: '#217764',
  },

  expense: {
    label: 'Despesa',
    icon: '💸',
    color: '#d64545',
  },

  investment: {
    label: 'Investimento',
    icon: '📈',
    color: '#d69e2e',
  },
};

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (date) => {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();

  // Segunda-feira = 0
  return day === 0 ? 6 : day - 1;
};

const getMinutes = (time) => {
  if (!time) return 0;

  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const getEndMinutes = (event) => {
  return getMinutes(event.scheduledTime) + Number(event.duration || 60);
};

const eventHasConflict = (event, events) => {
  // Eventos financeiros não possuem horário.
  if (
    !event.scheduledTime ||
    event.type === 'income' ||
    event.type === 'expense' ||
    event.type === 'investment'
  ) {
    return false;
  }

  const start = getMinutes(event.scheduledTime);

  const end = getEndMinutes(event);

  return events.some((other) => {
    if (other.id === event.id) return false;

    if (other.date !== event.date) return false;

    if (!other.scheduledTime) return false;

    if (
      other.type === 'income' ||
      other.type === 'expense' ||
      other.type === 'investment'
    ) {
      return false;
    }

    const otherStart = getMinutes(other.scheduledTime);

    const otherEnd = getEndMinutes(other);

    return start < otherEnd && end > otherStart;
  });
};

export default function SmartCalendar({ data, save }) {
  const today = new Date();

  const todayString = formatDate(today);

  /*
   * -------------------------------------------------------
   * ESTADOS
   * -------------------------------------------------------
   */

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(todayString);

  const [view, setView] = useState('month');

  const [showModal, setShowModal] = useState(false);

  const [editingEvent, setEditingEvent] = useState(null);

  const [eventType, setEventType] = useState('task');

  const [name, setName] = useState('');

  const [time, setTime] = useState('');

  const [duration, setDuration] = useState('60');

  const [amount, setAmount] = useState('');

  const [category, setCategory] = useState('');

  const [priority, setPriority] = useState('normal');

  const [xp, setXp] = useState('40');

  const [message, setMessage] = useState('');

  /*
   * -------------------------------------------------------
   * DADOS
   * -------------------------------------------------------
   */

  const events = data.calendarEvents || [];

  /*
   * Tarefas antigas continuam aparecendo
   * no calendário.
   */

  const legacyTasks = useMemo(() => {
    return (data.tasks || []).map((task) => ({
      ...task,
      type: task.tag === 'Compromisso' ? 'appointment' : 'task',
    }));
  }, [data.tasks]);

  const allEvents = useMemo(() => {
    const calendarIds = new Set(events.map((event) => event.id));

    return [
      ...events,

      ...legacyTasks.filter((task) => !calendarIds.has(task.id)),
    ];
  }, [events, legacyTasks]);

  /*
   * -------------------------------------------------------
   * CALENDÁRIO
   * -------------------------------------------------------
   */

  const year = currentDate.getFullYear();

  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);

  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  /*
   * -------------------------------------------------------
   * EVENTOS DO DIA
   * -------------------------------------------------------
   */

  const selectedEvents = allEvents
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => getMinutes(a.scheduledTime) - getMinutes(b.scheduledTime));

  /*
   * -------------------------------------------------------
   * FINANCEIRO
   * -------------------------------------------------------
   */

  const financialEvents = allEvents.filter(
    (event) =>
      event.type === 'income' ||
      event.type === 'expense' ||
      event.type === 'investment',
  );

  const monthFinancialEvents = financialEvents.filter((event) => {
    if (!event.date) {
      return false;
    }

    const date = new Date(`${event.date}T00:00:00`);

    return date.getFullYear() === year && date.getMonth() === month;
  });

  const income = monthFinancialEvents
    .filter((event) => event.type === 'income')
    .reduce((total, event) => total + Number(event.amount || 0), 0);

  const expenses = monthFinancialEvents
    .filter((event) => event.type === 'expense')
    .reduce((total, event) => total + Number(event.amount || 0), 0);

  const investments = monthFinancialEvents
    .filter((event) => event.type === 'investment')
    .reduce((total, event) => total + Number(event.amount || 0), 0);

  const balance = income - expenses - investments;

  /*
   * -------------------------------------------------------
   * NAVEGAÇÃO
   * -------------------------------------------------------
   */

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    const now = new Date();

    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));

    setSelectedDate(formatDate(now));
  };

  /*
   * -------------------------------------------------------
   * FORMULÁRIO
   * -------------------------------------------------------
   */

  const resetForm = () => {
    setName('');
    setTime('');
    setDuration('60');
    setAmount('');
    setCategory('');
    setPriority('normal');
    setXp('40');
    setEventType('task');
    setEditingEvent(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openNewEvent = (date = selectedDate) => {
    resetForm();

    setSelectedDate(date);

    // Mantém o mês atual sincronizado com a data escolhida.
    if (date) {
      const dateObject = new Date(`${date}T00:00:00`);

      if (!Number.isNaN(dateObject.getTime())) {
        setCurrentDate(
          new Date(dateObject.getFullYear(), dateObject.getMonth(), 1),
        );
      }
    }

    setShowModal(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);

    setName(event.name || '');

    setTime(event.scheduledTime || '');

    setDuration(String(event.duration || 60));

    setAmount(event.amount || '');

    setCategory(event.category || '');

    setPriority(event.priority || 'normal');

    setXp(String(event.xp || 40));

    setEventType(event.type || 'task');

    setSelectedDate(event.date || selectedDate);

    setShowModal(true);
  };

  /*
   * -------------------------------------------------------
   * SALVAR EVENTO
   * -------------------------------------------------------
   */

  const handleSaveEvent = (e) => {
    e.preventDefault();

    setMessage('');

    if (!name.trim()) {
      setMessage('Digite um nome para o evento.');
      return;
    }

    const requiresTime = eventType === 'task' || eventType === 'appointment';

    if (requiresTime && !time) {
      setMessage('Informe o horário do evento.');
      return;
    }

    const isFinancial =
      eventType === 'income' ||
      eventType === 'expense' ||
      eventType === 'investment';

    if (isFinancial && (!amount || Number(amount) <= 0)) {
      setMessage('Informe um valor válido.');
      return;
    }

    const newEvent = {
      id: editingEvent?.id || Date.now(),

      name: name.trim(),

      date: selectedDate,

      scheduledTime: requiresTime ? time : '',

      duration: requiresTime ? Number(duration || 60) : 0,

      type: eventType,

      amount: isFinancial ? Number(amount || 0) : 0,

      category: isFinancial ? category.trim() : '',

      priority: eventType === 'task' ? priority : '',

      xp: eventType === 'task' ? Number(xp || 0) : 0,

      done: editingEvent?.done || false,
    };

    /*
     * CONFLITO
     */

    if (requiresTime) {
      const eventsForConflict = allEvents.filter(
        (event) => event.id !== editingEvent?.id,
      );

      const conflict = eventHasConflict(newEvent, eventsForConflict);

      if (conflict) {
        setMessage('⚠️ Esse horário entra em conflito com outro compromisso.');

        return;
      }
    }

    /*
     * CRIAR / EDITAR
     */

    let updatedEvents;

    if (editingEvent) {
      updatedEvents = events.map((event) =>
        event.id === editingEvent.id ? newEvent : event,
      );
    } else {
      updatedEvents = [...events, newEvent];
    }

    /*
     * SALVAR
     */

    save({
      ...data,
      calendarEvents: updatedEvents,
    });

    const wasEditing = Boolean(editingEvent);

    closeModal();

    setMessage(
      wasEditing ? '✅ Evento atualizado!' : '✅ Evento criado com sucesso!',
    );

    setTimeout(() => setMessage(''), 2500);
  };

  /*
   * -------------------------------------------------------
   * EXCLUIR
   * -------------------------------------------------------
   */

  const deleteEvent = (event) => {
    if (!window.confirm('Excluir este evento?')) {
      return;
    }

    save({
      ...data,

      calendarEvents: events.filter((item) => item.id !== event.id),
    });

    setMessage('🗑️ Evento excluído.');

    setTimeout(() => setMessage(''), 2500);
  };

  /*
   * -------------------------------------------------------
   * CONCLUIR TAREFA
   * -------------------------------------------------------
   */

  const toggleDone = (event) => {
    const updatedEvents = events.map((item) =>
      item.id === event.id
        ? {
            ...item,
            done: !item.done,
          }
        : item,
    );

    save({
      ...data,

      calendarEvents: updatedEvents,
    });
  };

  /*
   * -------------------------------------------------------
   * RENDER EVENTO
   * -------------------------------------------------------
   */

  const renderEvent = (event, compact = false) => {
    const config = EVENT_TYPES[event.type] || EVENT_TYPES.task;

    return (
      <button
        key={event.id}
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          openEditEvent(event);
        }}
        style={{
          display: 'block',
          width: '100%',
          border: 'none',
          borderLeft: `4px solid ${config.color}`,
          background: `${config.color}18`,
          color: 'inherit',
          borderRadius: 6,
          padding: compact ? '4px 6px' : '9px',
          textAlign: 'left',
          cursor: 'pointer',
          marginBottom: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 5,
            alignItems: 'center',
            fontSize: compact ? 11 : 13,
            fontWeight: 700,
          }}
        >
          <span>{config.icon}</span>

          {event.scheduledTime && <span>{event.scheduledTime}</span>}
        </div>

        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: event.done ? 'line-through' : 'none',
          }}
        >
          {event.name}
        </div>

        {!compact && event.amount > 0 && (
          <small>{formatMoney(event.amount)}</small>
        )}
      </button>
    );
  };

  /*
   * -------------------------------------------------------
   * JSX
   * -------------------------------------------------------
   */

  return (
    <div className='card'>
      {/* CABEÇALHO */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: 4,
            }}
          >
            📅 Agenda
          </h2>

          <p className='subtitle'>
            Tarefas, compromissos e controle financeiro em um só lugar.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <button className='ghost' onClick={goToday}>
            Hoje
          </button>

          <button
            className={view === 'month' ? 'primary' : 'ghost'}
            onClick={() => setView('month')}
          >
            Mês
          </button>

          <button
            className={view === 'day' ? 'primary' : 'ghost'}
            onClick={() => setView('day')}
          >
            Dia
          </button>

          <button
            className='primary'
            onClick={() => openNewEvent(selectedDate)}
          >
            + Novo
          </button>
        </div>
      </div>

      {/* MENSAGEM */}

      {message && (
        <div
          style={{
            padding: '11px 14px',
            borderRadius: 10,
            marginBottom: 14,
            background: 'rgba(109, 93, 252, 0.12)',
            color: 'var(--site-primary)',
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}

      {/* RESUMO FINANCEIRO */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div className='focus'>
          <small>Receitas</small>

          <h3
            style={{
              margin: '5px 0 0',
              color: '#217764',
            }}
          >
            {formatMoney(income)}
          </h3>
        </div>

        <div className='focus'>
          <small>Despesas</small>

          <h3
            style={{
              margin: '5px 0 0',
              color: '#d64545',
            }}
          >
            {formatMoney(expenses)}
          </h3>
        </div>

        <div className='focus'>
          <small>Investimentos</small>

          <h3
            style={{
              margin: '5px 0 0',
              color: '#d69e2e',
            }}
          >
            {formatMoney(investments)}
          </h3>
        </div>

        <div className='focus'>
          <small>Saldo previsto</small>

          <h3
            style={{
              margin: '5px 0 0',
            }}
          >
            {formatMoney(balance)}
          </h3>
        </div>
      </div>

      {/* ===================================================
          VISÃO MENSAL
          =================================================== */}

      {view === 'month' && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <button className='ghost' onClick={previousMonth}>
              ‹
            </button>

            <h3
              style={{
                margin: 0,
                textTransform: 'capitalize',
              }}
            >
              {monthName}
            </h3>

            <button className='ghost' onClick={nextMonth}>
              ›
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              marginBottom: 4,
            }}
          >
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: 8,
                  color: 'var(--site-text-muted)',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 4,
            }}
          >
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      minHeight: 115,
                    }}
                  />
                );
              }

              const dateString = formatDate(date);

              const dayEvents = allEvents
                .filter((event) => event.date === dateString)
                .sort(
                  (a, b) =>
                    getMinutes(a.scheduledTime) - getMinutes(b.scheduledTime),
                );

              const isToday = dateString === todayString;

              const isSelected = dateString === selectedDate;

              return (
                <div
                  key={dateString}
                  onClick={() => {
                    setSelectedDate(dateString);

                    setView('day');
                  }}
                  style={{
                    minHeight: 115,
                    padding: 6,
                    borderRadius: 8,
                    border: isSelected
                      ? '2px solid var(--site-primary)'
                      : '1px solid var(--site-border)',
                    background: isToday
                      ? 'rgba(109, 93, 252, 0.06)'
                      : 'var(--site-card)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      marginBottom: 5,
                      color: isToday ? 'var(--site-primary)' : 'inherit',
                    }}
                  >
                    {date.getDate()}
                  </div>

                  {dayEvents
                    .slice(0, 4)
                    .map((event) => renderEvent(event, true))}

                  {dayEvents.length > 4 && (
                    <small
                      style={{
                        color: 'var(--site-text-muted)',
                      }}
                    >
                      +{dayEvents.length - 4} eventos
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===================================================
          VISÃO DIÁRIA
          =================================================== */}

      {view === 'day' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h3
                style={{
                  marginBottom: 3,
                }}
              >
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                  'pt-BR',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  },
                )}
              </h3>

              <small
                style={{
                  color: 'var(--site-text-muted)',
                }}
              >
                {selectedEvents.length} eventos
              </small>
            </div>

            <input
              type='date'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gap: 8,
            }}
          >
            {selectedEvents.length === 0 && (
              <div className='focus'>
                <p className='subtitle'>Nenhum evento para este dia.</p>

                <button
                  className='primary'
                  onClick={() => openNewEvent(selectedDate)}
                >
                  + Adicionar evento
                </button>
              </div>
            )}

            {selectedEvents.map((event) => {
              const conflict = eventHasConflict(event, allEvents);

              return (
                <div
                  key={event.id}
                  className='focus'
                  style={{
                    borderLeft: conflict ? '4px solid #d64545' : undefined,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <strong>{EVENT_TYPES[event.type]?.icon}</strong>

                        <strong>{event.name}</strong>
                      </div>

                      {event.scheduledTime && (
                        <small
                          style={{
                            display: 'block',
                            marginTop: 4,
                          }}
                        >
                          {event.scheduledTime} · {event.duration || 60} min
                        </small>
                      )}

                      {event.amount > 0 && (
                        <small
                          style={{
                            display: 'block',
                            marginTop: 4,
                            fontWeight: 700,
                          }}
                        >
                          {formatMoney(event.amount)}
                        </small>
                      )}

                      {event.category && (
                        <small
                          style={{
                            display: 'block',
                            marginTop: 3,
                            opacity: 0.65,
                          }}
                        >
                          Categoria: {event.category}
                        </small>
                      )}

                      {conflict && (
                        <small
                          style={{
                            display: 'block',
                            marginTop: 5,
                            color: '#d64545',
                            fontWeight: 700,
                          }}
                        >
                          ⚠️ Conflito de horário
                        </small>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 5,
                        flexWrap: 'wrap',
                      }}
                    >
                      {event.type === 'task' && (
                        <button
                          className='ghost'
                          onClick={() => toggleDone(event)}
                          title={event.done ? 'Desfazer' : 'Concluir'}
                        >
                          {event.done ? '↩' : '✓'}
                        </button>
                      )}

                      <button
                        className='ghost'
                        onClick={() => openEditEvent(event)}
                        title='Editar'
                      >
                        ✏️
                      </button>

                      <button
                        className='ghost'
                        onClick={() => deleteEvent(event)}
                        title='Excluir'
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================
          LEGENDA
          =================================================== */}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--site-border)',
        }}
      >
        {Object.entries(EVENT_TYPES).map(([key, config]) => (
          <span
            key={key}
            style={{
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: config.color,
              }}
            />
            {config.icon} {config.label}
          </span>
        ))}
      </div>

      {/* ===================================================
          MODAL
          =================================================== */}

      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,

            background: 'rgba(0, 0, 0, 0.65)',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            padding: 16,

            boxSizing: 'border-box',
          }}
        >
          {/* CONTAINER DO MODAL */}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 620,

              height: 'auto',
              maxHeight: '90vh',

              display: 'flex',
              flexDirection: 'column',

              background: 'var(--site-card, #fff)',

              color: 'var(--site-text, #222)',

              borderRadius: 18,

              boxShadow: '0 20px 60px rgba(0,0,0,.30)',

              overflow: 'hidden',

              boxSizing: 'border-box',
            }}
          >
            {/* =========================
                CABEÇALHO
                ========================= */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 15,

                padding: '20px 22px',

                borderBottom: '1px solid var(--site-border, #ddd)',

                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {editingEvent ? '✏️ Editar evento' : '➕ Novo evento'}
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    opacity: 0.65,
                    fontSize: 14,
                  }}
                >
                  Crie uma tarefa, compromisso ou movimentação financeira.
                </p>
              </div>

              <button
                type='button'
                onClick={closeModal}
                style={{
                  width: 38,
                  height: 38,

                  flexShrink: 0,

                  borderRadius: '50%',

                  border: '1px solid var(--site-border, #ddd)',

                  background: 'var(--site-background, #f3f3f3)',

                  color: 'inherit',

                  cursor: 'pointer',

                  fontSize: 17,
                }}
              >
                ✕
              </button>
            </div>

            {/* =========================
                FORMULÁRIO
                ========================= */}

            <form
              onSubmit={handleSaveEvent}
              style={{
                display: 'flex',
                flexDirection: 'column',

                flex: 1,

                minHeight: 0,

                overflow: 'hidden',
              }}
            >
              {/* =========================
                  CONTEÚDO ROLÁVEL
                  ========================= */}

              <div
                style={{
                  flex: 1,

                  minHeight: 0,

                  overflowY: 'auto',

                  padding: '20px 22px',

                  display: 'grid',

                  gap: 17,

                  boxSizing: 'border-box',
                }}
              >
                {/* TIPO */}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Tipo de evento
                  </label>

                  <div
                    style={{
                      display: 'grid',

                      gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',

                      gap: 7,
                    }}
                  >
                    {Object.entries(EVENT_TYPES).map(([type, config]) => {
                      const selected = eventType === type;

                      return (
                        <button
                          key={type}
                          type='button'
                          onClick={() => setEventType(type)}
                          style={{
                            minHeight: 78,

                            padding: '8px 5px',

                            borderRadius: 10,

                            border: selected
                              ? `2px solid ${config.color}`
                              : '1px solid var(--site-border, #ddd)',

                            background: selected
                              ? `${config.color}18`
                              : 'transparent',

                            color: 'inherit',

                            cursor: 'pointer',

                            fontWeight: selected ? 700 : 500,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 20,
                              marginBottom: 4,
                            }}
                          >
                            {config.icon}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                            }}
                          >
                            {config.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NOME */}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      marginBottom: 7,
                    }}
                  >
                    Nome
                  </label>

                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      eventType === 'task'
                        ? 'Ex.: Estudar Java'
                        : eventType === 'appointment'
                          ? 'Ex.: Aula de programação'
                          : eventType === 'income'
                            ? 'Ex.: Salário'
                            : eventType === 'expense'
                              ? 'Ex.: Conta de internet'
                              : 'Ex.: Aporte em ações'
                    }
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* DATA */}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 700,
                      marginBottom: 7,
                    }}
                  >
                    Data
                  </label>

                  <input
                    type='date'
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* HORÁRIO E DURAÇÃO */}

                {(eventType === 'task' || eventType === 'appointment') && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          marginBottom: 7,
                        }}
                      >
                        Horário
                      </label>

                      <input
                        type='time'
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          marginBottom: 7,
                        }}
                      >
                        Duração
                      </label>

                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value='15'>15 minutos</option>

                        <option value='30'>30 minutos</option>

                        <option value='45'>45 minutos</option>

                        <option value='60'>1 hora</option>

                        <option value='90'>1h30</option>

                        <option value='120'>2 horas</option>

                        <option value='180'>3 horas</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* FINANCEIRO */}

                {(eventType === 'income' ||
                  eventType === 'expense' ||
                  eventType === 'investment') && (
                  <>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          marginBottom: 7,
                        }}
                      >
                        Valor
                      </label>

                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder='0,00'
                        required
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          marginBottom: 7,
                        }}
                      >
                        Categoria
                      </label>

                      <input
                        type='text'
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={
                          eventType === 'income'
                            ? 'Ex.: Salário'
                            : eventType === 'expense'
                              ? 'Ex.: Alimentação'
                              : 'Ex.: Ações'
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </>
                )}

                {/* CONFIGURAÇÕES DA TAREFA */}

                {eventType === 'task' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          marginBottom: 7,
                        }}
                      >
                        Prioridade
                      </label>

                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value='low'>🟢 Baixa</option>

                        <option value='normal'>🟡 Normal</option>

                        <option value='high'>🔴 Alta</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          marginBottom: 7,
                        }}
                      >
                        XP
                      </label>

                      <input
                        type='number'
                        min='0'
                        value={xp}
                        onChange={(e) => setXp(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* PREVIEW */}

                <div
                  style={{
                    padding: '12px 14px',

                    borderRadius: 10,

                    background: 'var(--site-background, #f5f5f5)',

                    border: '1px solid var(--site-border, #ddd)',

                    fontSize: 13,
                  }}
                >
                  <strong>
                    {EVENT_TYPES[eventType]?.icon}{' '}
                    {EVENT_TYPES[eventType]?.label}
                  </strong>

                  <div
                    style={{
                      marginTop: 5,
                      opacity: 0.7,
                    }}
                  >
                    {name || 'Nome do evento'}

                    {selectedDate && ` · ${selectedDate}`}

                    {time && ` · ${time}`}

                    {amount &&
                      Number(amount) > 0 &&
                      ` · ${formatMoney(amount)}`}
                  </div>
                </div>
              </div>

              {/* =========================
                  RODAPÉ FIXO
                  ========================= */}

              <div
                style={{
                  display: 'flex',

                  justifyContent: 'flex-end',

                  gap: 10,

                  padding: '14px 22px',

                  borderTop: '1px solid var(--site-border, #ddd)',

                  background: 'var(--site-card, #fff)',

                  flexShrink: 0,

                  boxSizing: 'border-box',
                }}
              >
                <button
                  type='button'
                  className='ghost'
                  onClick={closeModal}
                  style={{
                    minWidth: 110,
                    padding: '11px 16px',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type='submit'
                  className='primary'
                  style={{
                    minWidth: 160,
                    padding: '11px 16px',
                    fontWeight: 700,
                  }}
                >
                  {editingEvent ? '💾 Salvar alterações' : '➕ Criar evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
