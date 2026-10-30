import React, { useEffect, useMemo, useState } from 'react';

import {
  createReading,
  createReview,
  createStudyError,
  createStudySession,
  getStudyDashboard,
  reviewStudyItem,
  toggleStudyError,
  updateReading,
} from '../services/api';

const TABS = [
  ['overview', '📚 Visão geral'],
  ['sessions', '⏱️ Sessões'],
  ['reading', '📖 Leitura'],
  ['reviews', '🧠 Revisão espaçada'],
  ['errors', '❌ Banco de erros'],
  ['archive', '🗂️ Registros antigos'],
];

const RATINGS = [
  ['forgot', '😵 Não lembro', 1],
  ['little', '😕 Lembro pouco', 2],
  ['partial', '😐 Parcialmente', 4],
  ['well', '🙂 Lembro bem', 7],
  ['master', '🧠 Domino', 14],
];

const initialSession = {
  discipline: '',
  subject: '',
  minutes: 30,
  method: 'Exercícios',
  difficulty: 3,
  exercises: 0,
  correct: 0,
  learned: '',
  notMastered: '',
  observations: '',
};

const initialReading = {
  title: '',
  author: '',
  type: 'book',
  status: 'planned',
  progress: 0,
  totalPages: '',
  currentPage: 0,
  notes: '',
};

const initialReview = {
  title: '',
  discipline: '',
  content: '',
  example: '',
  tags: '',
};

const initialError = {
  question: '',
  myAnswer: '',
  correctAnswer: '',
  whyWrong: '',
  type: 'Falta de conhecimento',
  discipline: '',
  subject: '',
};

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateLabel(value) {
  if (!value) return '-';

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('pt-BR');
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getStatusLabel(status) {
  const labels = {
    planned: 'Planejada',
    reading: 'Lendo',
    paused: 'Pausada',
    completed: 'Concluída',
  };

  return labels[status] || status;
}

function getTypeLabel(type) {
  const labels = {
    book: 'Livro',
    article: 'Artigo',
    paper: 'Paper',
    course: 'Curso',
    other: 'Outro',
  };

  return labels[type] || type;
}

function StatCard({ icon, value, label }) {
  return (
    <div className='diary-stat'>
      <span>{icon}</span>

      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function EmptyState({ icon = '📭', title, text }) {
  return (
    <div className='empty-state'>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

function LoadingState() {
  return (
    <section className='card' style={{ margin: 24 }}>
      <h2>📚 Estudos</h2>
      <p>Carregando seus estudos...</p>
    </section>
  );
}

export default function Estudos({ appData = {}, saveAppData }) {
  const [tab, setTab] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [data, setData] = useState({
    sessions: [],
    readings: [],
    reviews: [],
    errors: [],
  });

  const [session, setSession] = useState(initialSession);
  const [reading, setReading] = useState(initialReading);
  const [review, setReview] = useState(initialReview);
  const [studyError, setStudyError] = useState(initialError);

  const [readingSearch, setReadingSearch] = useState('');
  const [readingFilter, setReadingFilter] = useState('all');

  const [reviewFilter, setReviewFilter] = useState('all');

  const today = getLocalDate();

  function flash(text) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage('');
    }, 3500);
  }

  function handleError(exception, fallback) {
    console.error(exception);

    setError(
      exception?.message || fallback || 'Não foi possível concluir a operação.',
    );
  }

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await getStudyDashboard();

      setData({
        sessions: Array.isArray(result?.sessions) ? result.sessions : [],

        readings: Array.isArray(result?.readings) ? result.readings : [],

        reviews: Array.isArray(result?.reviews)
          ? result.reviews.filter(Boolean)
          : [],

        errors: Array.isArray(result?.errors) ? result.errors : [],
      });
    } catch (exception) {
      handleError(exception, 'Não foi possível carregar seus estudos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     DADOS DERIVADOS
  ========================================================= */

  const todayMinutes = useMemo(() => {
    return data.sessions
      .filter((item) => String(item.study_date).slice(0, 10) === today)
      .reduce((total, item) => total + normalizeNumber(item.minutes), 0);
  }, [data.sessions, today]);

  const totalMinutes = useMemo(() => {
    return data.sessions.reduce(
      (total, item) => total + normalizeNumber(item.minutes),
      0,
    );
  }, [data.sessions]);

  const accuracy = useMemo(() => {
    const questions = data.sessions.reduce(
      (total, item) => total + normalizeNumber(item.exercises),
      0,
    );

    const correct = data.sessions.reduce(
      (total, item) => total + normalizeNumber(item.correct),
      0,
    );

    if (!questions) return 0;

    return Math.min(100, Math.round((correct / questions) * 100));
  }, [data.sessions]);

  const safeReviews = useMemo(() => {
    return data.reviews.filter((item) => item && typeof item === 'object');
  }, [data.reviews]);

  const dueReviews = useMemo(() => {
    return safeReviews.filter((item) => {
      if (!item.next_review) return false;

      return String(item.next_review).slice(0, 10) <= today;
    });
  }, [safeReviews, today]);

  const activeReadings = useMemo(() => {
    return data.readings.filter((item) => item.status === 'reading');
  }, [data.readings]);

  const completedReadings = useMemo(() => {
    return data.readings.filter((item) => item.status === 'completed');
  }, [data.readings]);

  const filteredReadings = useMemo(() => {
    const search = readingSearch.trim().toLowerCase();

    return data.readings.filter((item) => {
      const matchesSearch =
        !search ||
        String(item.title || '')
          .toLowerCase()
          .includes(search) ||
        String(item.author || '')
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        readingFilter === 'all' || item.status === readingFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.readings, readingSearch, readingFilter]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'due') {
      return dueReviews;
    }

    if (reviewFilter === 'active') {
      return safeReviews.filter((item) => normalizeNumber(item.mastery) < 80);
    }

    return safeReviews;
  }, [safeReviews, dueReviews, reviewFilter]);

  /* =========================================================
     DADOS ANTIGOS
  ========================================================= */

  const legacySessions = Array.isArray(appData.studySessions)
    ? appData.studySessions
    : [];

  const legacyKnowledge = Array.isArray(appData.knowledgeItems)
    ? appData.knowledgeItems
    : [];

  const legacyErrors = Array.isArray(appData.errors) ? appData.errors : [];

  const legacyStudyMinutes = legacySessions.reduce(
    (sum, item) => sum + normalizeNumber(item.minutes),
    0,
  );

  const legacyQuestions = legacySessions.reduce(
    (sum, item) => sum + normalizeNumber(item.exercises),
    0,
  );

  const legacyCorrect = legacySessions.reduce(
    (sum, item) => sum + normalizeNumber(item.correct),
    0,
  );

  const legacyAccuracy = legacyQuestions
    ? Math.round((legacyCorrect / legacyQuestions) * 100)
    : 0;

  /* =========================================================
     SESSÕES
  ========================================================= */

  async function submitSession(event) {
    event.preventDefault();

    const minutes = normalizeNumber(session.minutes);

    const exercises = normalizeNumber(session.exercises);

    const correct = normalizeNumber(session.correct);

    if (minutes <= 0) {
      setError('Informe uma duração válida para a sessão.');
      return;
    }

    if (correct > exercises) {
      setError(
        'O número de acertos não pode ser maior que o número de questões.',
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createStudySession({
        ...session,
        minutes,
        exercises,
        correct,
        difficulty: normalizeNumber(session.difficulty, 3),
      });

      setData((current) => ({
        ...current,
        sessions: [created, ...current.sessions],
      }));

      setSession(initialSession);

      flash('Sessão de estudo registrada.');
      setTab('overview');
    } catch (exception) {
      handleError(exception, 'Não foi possível salvar a sessão.');
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LEITURAS
  ========================================================= */

  async function submitReading(event) {
    event.preventDefault();

    if (!reading.title.trim()) {
      setError('Informe o título da leitura.');
      return;
    }

    const progress = Math.min(
      100,
      Math.max(0, normalizeNumber(reading.progress)),
    );

    const totalPages = reading.totalPages
      ? normalizeNumber(reading.totalPages)
      : null;

    const currentPage = Math.max(0, normalizeNumber(reading.currentPage));

    if (totalPages !== null && currentPage > totalPages) {
      setError('A página atual não pode ser maior que o total de páginas.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createReading({
        ...reading,
        progress,
        currentPage,
        totalPages,
      });

      setData((current) => ({
        ...current,
        readings: [created, ...current.readings],
      }));

      setReading(initialReading);

      flash('Leitura adicionada.');
    } catch (exception) {
      handleError(exception, 'Não foi possível adicionar a leitura.');
    } finally {
      setSaving(false);
    }
  }

  async function changeReading(item, patch) {
    try {
      const updated = await updateReading(item.id, patch);

      setData((current) => ({
        ...current,
        readings: current.readings.map((readingItem) =>
          readingItem.id === item.id ? updated : readingItem,
        ),
      }));

      flash('Leitura atualizada.');
    } catch (exception) {
      handleError(exception, 'Não foi possível atualizar a leitura.');
    }
  }

  /* =========================================================
     REVISÃO ESPAÇADA
  ========================================================= */

  async function submitReview(event) {
    event.preventDefault();

    if (
      !review.title.trim() ||
      !review.discipline.trim() ||
      !review.content.trim()
    ) {
      setError('Preencha título, disciplina e conteúdo.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createReview({
        ...review,
        tags: review.tags.trim(),
      });

      setData((current) => ({
        ...current,
        reviews: [created, ...current.reviews],
      }));

      setReview(initialReview);

      flash('Conhecimento colocado na revisão espaçada.');
    } catch (exception) {
      handleError(exception, 'Não foi possível criar a revisão.');
    } finally {
      setSaving(false);
    }
  }

  async function doReview(item, rating) {
    try {
      const updated = await reviewStudyItem(item.id, rating);

      setData((current) => ({
        ...current,
        reviews: current.reviews.map((reviewItem) =>
          reviewItem.id === item.id ? updated : reviewItem,
        ),
      }));

      flash(`Revisão registrada. Próxima: ${dateLabel(updated.next_review)}.`);
    } catch (exception) {
      handleError(exception, 'Não foi possível registrar a revisão.');
    }
  }

  /* =========================================================
     BANCO DE ERROS
  ========================================================= */

  async function submitError(event) {
    event.preventDefault();

    if (
      !studyError.question.trim() ||
      !studyError.correctAnswer.trim() ||
      !studyError.whyWrong.trim()
    ) {
      setError('Preencha a questão, resposta correta e motivo do erro.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createStudyError(studyError);

      setData((current) => ({
        ...current,
        errors: [created, ...current.errors],
      }));

      setStudyError(initialError);

      flash('Erro adicionado ao banco de erros.');
    } catch (exception) {
      handleError(exception, 'Não foi possível salvar o erro.');
    } finally {
      setSaving(false);
    }
  }

  async function resolveError(item) {
    try {
      const updated = await toggleStudyError(item.id);

      setData((current) => ({
        ...current,
        errors: current.errors.map((errorItem) =>
          errorItem.id === item.id ? updated : errorItem,
        ),
      }));

      flash(
        updated.resolved ? 'Erro marcado como resolvido.' : 'Erro reaberto.',
      );
    } catch (exception) {
      handleError(exception, 'Não foi possível atualizar o erro.');
    }
  }

  /* =========================================================
     LEGADO
  ========================================================= */

  function reviewLegacyKnowledge(item, ratingKey) {
    if (!saveAppData) return;

    const levels = {
      forgot: {
        mastery: 20,
        days: 1,
      },

      little: {
        mastery: 40,
        days: 2,
      },

      partial: {
        mastery: 60,
        days: 4,
      },

      well: {
        mastery: 80,
        days: 7,
      },

      master: {
        mastery: 95,
        days:
          Number(item.reviewInterval || 0) < 14
            ? 14
            : Number(item.reviewInterval || 0) < 30
              ? 30
              : 60,
      },
    };

    const selected = levels[ratingKey];

    if (!selected) return;

    const nextDate = new Date(`${today}T12:00:00`);

    nextDate.setDate(nextDate.getDate() + selected.days);

    const nextReview = `${nextDate.getFullYear()}-${String(
      nextDate.getMonth() + 1,
    ).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

    const updated = {
      ...item,

      mastery: selected.mastery,

      lastReview: today,

      nextReview,

      reviewInterval: selected.days,

      reviewCount: Number(item.reviewCount || 0) + 1,

      reviewHistory: [
        ...(item.reviewHistory || []),

        {
          date: today,
          rating: ratingKey,
          mastery: selected.mastery,
          nextReview,
        },
      ],
    };

    saveAppData({
      ...appData,

      knowledgeItems: legacyKnowledge.map((entry) =>
        entry.id === item.id ? updated : entry,
      ),

      xp: Number(appData.xp || 0) + 15,
    });

    flash(`Revisão salva. Próxima: ${dateLabel(nextReview)}.`);
  }

  function toggleLegacyError(item) {
    if (!saveAppData) return;

    saveAppData({
      ...appData,

      errors: legacyErrors.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,

              resolved: !entry.resolved,

              resolvedAt: !entry.resolved ? new Date().toISOString() : null,
            }
          : entry,
      ),
    });

    flash(item.resolved ? 'Erro reaberto.' : 'Erro marcado como resolvido.');
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <section className='diary-page'>
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className='diary-hero'>
        <div>
          <span className='eyebrow'>ESTUDOS</span>

          <h1>📚 Estudos & Leitura</h1>

          <p>Organize sessões, leituras, revisões e erros em um único lugar.</p>
        </div>

        <div className='today-badge'>🧠</div>
      </div>

      {/* =====================================================
          FEEDBACK
      ===================================================== */}

      {message && (
        <div className='success-message' role='status'>
          ✅ {message}
        </div>
      )}

      {error && (
        <div className='auth-error' role='alert'>
          <span>⚠️ {error}</span>

          <button className='ghost' onClick={() => setError('')}>
            Fechar
          </button>
        </div>
      )}

      {/* =====================================================
          NAVEGAÇÃO
      ===================================================== */}

      <div className='diary-navigation'>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type='button'
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}

        <button
          type='button'
          className='ghost'
          onClick={load}
          title='Atualizar estudos'
        >
          🔄
        </button>
      </div>

      {/* =====================================================
          VISÃO GERAL
      ===================================================== */}

      {tab === 'overview' && (
        <>
          <div className='diary-stats'>
            <StatCard
              icon='⏱️'
              value={`${todayMinutes}min`}
              label='estudados hoje'
            />

            <StatCard
              icon='📚'
              value={`${Math.round((totalMinutes / 60) * 10) / 10}h`}
              label='tempo total'
            />

            <StatCard
              icon='🎯'
              value={`${accuracy}%`}
              label='acerto nos exercícios'
            />

            <StatCard
              icon='🧠'
              value={dueReviews.length}
              label='revisões para hoje'
            />
          </div>

          <div className='diary-stats'>
            <StatCard
              icon='📖'
              value={activeReadings.length}
              label='leituras em andamento'
            />

            <StatCard
              icon='✅'
              value={completedReadings.length}
              label='leituras concluídas'
            />

            <StatCard
              icon='❌'
              value={data.errors.filter((item) => !item.resolved).length}
              label='erros pendentes'
            />

            <StatCard
              icon='📝'
              value={data.sessions.length}
              label='sessões registradas'
            />
          </div>

          <div className='card'>
            <h3>🗓️ Próximas ações</h3>

            {dueReviews.length > 0 ? (
              <p>
                🧠 Você tem <strong>{dueReviews.length}</strong> revisão(ões)
                para fazer hoje.
              </p>
            ) : (
              <p>✅ Nenhuma revisão pendente para hoje.</p>
            )}

            <p>
              {activeReadings.length
                ? `📖 Você tem ${activeReadings.length} leitura(s) em andamento.`
                : '📖 Você não possui leituras em andamento.'}
            </p>

            <p>
              💡 Registre o que aprendeu e o que ainda não domina em cada
              sessão.
            </p>
          </div>

          <div className='card'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <h3>📈 Últimas sessões</h3>

              <button className='ghost' onClick={() => setTab('sessions')}>
                + Nova sessão
              </button>
            </div>

            {data.sessions.length === 0 ? (
              <EmptyState
                icon='📚'
                title='Nenhuma sessão ainda'
                text='Registre seu primeiro estudo para começar seu histórico.'
              />
            ) : (
              data.sessions.slice(0, 6).map((sessionItem) => (
                <div className='foguinho-row' key={sessionItem.id}>
                  <div>
                    <strong>
                      {sessionItem.discipline}
                      {' — '}
                      {sessionItem.subject}
                    </strong>

                    <small>
                      {dateLabel(sessionItem.study_date)}
                      {' · '}
                      {sessionItem.minutes}min
                      {' · '}
                      {sessionItem.method}
                    </small>
                  </div>

                  <strong>
                    {sessionItem.exercises
                      ? Math.round(
                          (Number(sessionItem.correct) /
                            Number(sessionItem.exercises)) *
                            100,
                        )
                      : 0}
                    %
                  </strong>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* =====================================================
          SESSÕES
      ===================================================== */}

      {tab === 'sessions' && (
        <div className='card'>
          <h3>⏱️ Registrar sessão de estudo</h3>

          <form onSubmit={submitSession} className='form-grid'>
            <label>
              Disciplina
              <input
                required
                value={session.discipline}
                onChange={(event) =>
                  setSession({
                    ...session,
                    discipline: event.target.value,
                  })
                }
                placeholder='Ex.: Matemática'
              />
            </label>

            <label>
              Conteúdo
              <input
                required
                value={session.subject}
                onChange={(event) =>
                  setSession({
                    ...session,
                    subject: event.target.value,
                  })
                }
                placeholder='Ex.: Matemática Discreta'
              />
            </label>

            <label>
              Minutos
              <input
                type='number'
                min='1'
                value={session.minutes}
                onChange={(event) =>
                  setSession({
                    ...session,
                    minutes: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Método
              <select
                value={session.method}
                onChange={(event) =>
                  setSession({
                    ...session,
                    method: event.target.value,
                  })
                }
              >
                <option>Exercícios</option>

                <option>Teoria</option>

                <option>Videoaula</option>

                <option>Leitura</option>

                <option>Resumo</option>

                <option>Flashcards</option>

                <option>Projeto</option>

                <option>Simulado</option>
              </select>
            </label>

            <label>
              Dificuldade
              <input
                type='number'
                min='1'
                max='5'
                value={session.difficulty}
                onChange={(event) =>
                  setSession({
                    ...session,
                    difficulty: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Questões
              <input
                type='number'
                min='0'
                value={session.exercises}
                onChange={(event) =>
                  setSession({
                    ...session,
                    exercises: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Acertos
              <input
                type='number'
                min='0'
                value={session.correct}
                onChange={(event) =>
                  setSession({
                    ...session,
                    correct: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Aprendi
              <textarea
                value={session.learned}
                onChange={(event) =>
                  setSession({
                    ...session,
                    learned: event.target.value,
                  })
                }
                placeholder='O que você aprendeu?'
              />
            </label>

            <label>
              Ainda não domino
              <textarea
                value={session.notMastered}
                onChange={(event) =>
                  setSession({
                    ...session,
                    notMastered: event.target.value,
                  })
                }
                placeholder='O que precisa revisar?'
              />
            </label>

            <label>
              Observações
              <textarea
                value={session.observations}
                onChange={(event) =>
                  setSession({
                    ...session,
                    observations: event.target.value,
                  })
                }
              />
            </label>

            <div>
              <button type='submit' disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar sessão'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          LEITURAS
      ===================================================== */}

      {tab === 'reading' && (
        <>
          <div className='card'>
            <h3>📖 Adicionar leitura</h3>

            <form onSubmit={submitReading} className='form-grid'>
              <label>
                Título
                <input
                  required
                  value={reading.title}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Autor / fonte
                <input
                  value={reading.author}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      author: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Tipo
                <select
                  value={reading.type}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      type: event.target.value,
                    })
                  }
                >
                  <option value='book'>Livro</option>

                  <option value='article'>Artigo</option>

                  <option value='paper'>Paper</option>

                  <option value='course'>Curso</option>

                  <option value='other'>Outro</option>
                </select>
              </label>

              <label>
                Total de páginas
                <input
                  type='number'
                  min='0'
                  value={reading.totalPages}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      totalPages: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Progresso (%)
                <input
                  type='number'
                  min='0'
                  max='100'
                  value={reading.progress}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      progress: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Página atual
                <input
                  type='number'
                  min='0'
                  value={reading.currentPage}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      currentPage: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={reading.status}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      status: event.target.value,
                    })
                  }
                >
                  <option value='planned'>Planejada</option>

                  <option value='reading'>Lendo</option>

                  <option value='paused'>Pausada</option>

                  <option value='completed'>Concluída</option>
                </select>
              </label>

              <label>
                Notas
                <textarea
                  value={reading.notes}
                  onChange={(event) =>
                    setReading({
                      ...reading,
                      notes: event.target.value,
                    })
                  }
                />
              </label>

              <div>
                <button type='submit' disabled={saving}>
                  {saving ? 'Salvando...' : 'Adicionar leitura'}
                </button>
              </div>
            </form>
          </div>

          <div className='card'>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3>📚 Minha biblioteca</h3>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <input
                  value={readingSearch}
                  onChange={(event) => setReadingSearch(event.target.value)}
                  placeholder='🔎 Buscar leitura...'
                />

                <select
                  value={readingFilter}
                  onChange={(event) => setReadingFilter(event.target.value)}
                >
                  <option value='all'>Todas</option>

                  <option value='planned'>Planejadas</option>

                  <option value='reading'>Lendo</option>

                  <option value='paused'>Pausadas</option>

                  <option value='completed'>Concluídas</option>
                </select>
              </div>
            </div>

            {filteredReadings.length === 0 ? (
              <EmptyState
                icon='📖'
                title='Nenhuma leitura encontrada'
                text={
                  data.readings.length
                    ? 'Tente mudar o filtro ou a busca.'
                    : 'Adicione seu primeiro livro, artigo ou curso.'
                }
              />
            ) : (
              filteredReadings.map((item) => (
                <div className='foguinho-row' key={item.id}>
                  <div style={{ flex: 1 }}>
                    <strong>{item.title}</strong>

                    <small>
                      {item.author || 'Sem autor'}
                      {' · '}
                      {getTypeLabel(item.type)}
                      {' · '}
                      {getStatusLabel(item.status)}
                    </small>

                    <div
                      style={{
                        marginTop: 8,
                        height: 7,
                        borderRadius: 999,
                        background: 'rgba(127,127,127,.18)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Number(item.progress) || 0),
                          )}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'currentColor',
                        }}
                      />
                    </div>

                    <small>{item.progress || 0}% concluído</small>
                  </div>

                  <div className='connection-actions'>
                    <button
                      type='button'
                      onClick={() => {
                        const next = Math.min(100, Number(item.progress) + 10);

                        changeReading(item, {
                          progress: next,
                          status: next >= 100 ? 'completed' : 'reading',
                        });
                      }}
                    >
                      +10%
                    </button>

                    <select
                      value={item.status}
                      onChange={(event) =>
                        changeReading(item, {
                          status: event.target.value,
                        })
                      }
                    >
                      <option value='planned'>Planejada</option>

                      <option value='reading'>Lendo</option>

                      <option value='paused'>Pausada</option>

                      <option value='completed'>Concluída</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* =====================================================
          REVISÃO ESPAÇADA
      ===================================================== */}

      {tab === 'reviews' && (
        <>
          <div className='card'>
            <h3>🧠 Criar conhecimento para revisão</h3>

            <form onSubmit={submitReview} className='form-grid'>
              <label>
                Título
                <input
                  required
                  value={review.title}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      title: event.target.value,
                    })
                  }
                  placeholder='Ex.: Lei de De Morgan'
                />
              </label>

              <label>
                Disciplina
                <input
                  required
                  value={review.discipline}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      discipline: event.target.value,
                    })
                  }
                  placeholder='Ex.: Matemática Discreta'
                />
              </label>

              <label className='full'>
                Conteúdo / resposta
                <textarea
                  required
                  value={review.content}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      content: event.target.value,
                    })
                  }
                  placeholder='Explique o conceito de forma curta.'
                />
              </label>

              <label>
                Exemplo
                <textarea
                  value={review.example}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      example: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Tags
                <input
                  value={review.tags}
                  onChange={(event) =>
                    setReview({
                      ...review,
                      tags: event.target.value,
                    })
                  }
                  placeholder='java, lógica, prova'
                />
              </label>

              <div>
                <button type='submit' disabled={saving}>
                  {saving ? 'Criando...' : 'Criar revisão'}
                </button>
              </div>
            </form>
          </div>

          <div className='card'>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h3>📅 Fila de revisão</h3>

              <select
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value)}
              >
                <option value='all'>Todos</option>

                <option value='due'>🔥 Para hoje</option>

                <option value='active'>📚 Em aprendizado</option>
              </select>
            </div>

            {filteredReviews.length === 0 ? (
              <EmptyState
                icon='🧠'
                title='Nenhuma revisão encontrada'
                text={
                  reviewFilter === 'due'
                    ? 'Você está em dia com suas revisões.'
                    : 'Crie seu primeiro conhecimento para começar.'
                }
              />
            ) : (
              filteredReviews.map((item) => {
                const isDue = String(item.next_review).slice(0, 10) <= today;

                const mastery = Math.min(
                  100,
                  Math.max(0, normalizeNumber(item.mastery)),
                );

                return (
                  <article key={item.id} className='foguinho-card'>
                    <div className='foguinho-card-top'>
                      <span>{item.discipline}</span>

                      <span>{mastery}% domínio</span>
                    </div>

                    <h3>{item.title}</h3>

                    <p>{item.content}</p>

                    {item.example && (
                      <p>
                        <strong>Exemplo:</strong> {item.example}
                      </p>
                    )}

                    <div
                      style={{
                        margin: '10px 0',
                        height: 7,
                        borderRadius: 999,
                        background: 'rgba(127,127,127,.18)',
                      }}
                    >
                      <div
                        style={{
                          width: `${mastery}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'currentColor',
                        }}
                      />
                    </div>

                    <small>
                      {isDue
                        ? '🔥 Revisão pendente'
                        : `Próxima: ${dateLabel(item.next_review)}`}
                      {' · '}
                      {item.review_count || 0} revisão(ões)
                    </small>

                    <div
                      className='connection-actions'
                      style={{
                        marginTop: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      {RATINGS.map(([key, label]) => (
                        <button
                          key={key}
                          type='button'
                          className={isDue ? '' : 'ghost'}
                          onClick={() => doReview(item, key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

      {/* =====================================================
          BANCO DE ERROS
      ===================================================== */}

      {tab === 'errors' && (
        <>
          <div className='card'>
            <h3>❌ Registrar erro</h3>

            <form onSubmit={submitError} className='form-grid'>
              <label className='full'>
                Questão
                <input
                  required
                  value={studyError.question}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      question: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Minha resposta
                <textarea
                  value={studyError.myAnswer}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      myAnswer: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Resposta correta
                <textarea
                  required
                  value={studyError.correctAnswer}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      correctAnswer: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Por que errei?
                <textarea
                  required
                  value={studyError.whyWrong}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      whyWrong: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Tipo
                <select
                  value={studyError.type}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      type: event.target.value,
                    })
                  }
                >
                  <option>Falta de conhecimento</option>

                  <option>Desatenção</option>

                  <option>Interpretação</option>

                  <option>Pressa</option>

                  <option>Cálculo</option>

                  <option>Não conhecia o conteúdo</option>
                </select>
              </label>

              <label>
                Disciplina
                <input
                  value={studyError.discipline}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      discipline: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Assunto
                <input
                  value={studyError.subject}
                  onChange={(event) =>
                    setStudyError({
                      ...studyError,
                      subject: event.target.value,
                    })
                  }
                />
              </label>

              <div>
                <button type='submit' disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar erro'}
                </button>
              </div>
            </form>
          </div>

          <div className='card'>
            <h3>🗂️ Banco de erros</h3>

            {data.errors.length === 0 ? (
              <EmptyState
                icon='🎯'
                title='Nenhum erro registrado'
                text='Registrar erros ajuda a identificar exatamente o que precisa ser revisado.'
              />
            ) : (
              data.errors.map((item) => (
                <div className='foguinho-row' key={item.id}>
                  <div>
                    <strong>{item.question}</strong>

                    <small>
                      {item.discipline || 'Sem disciplina'}
                      {' · '}
                      {item.type}
                      {' · '}
                      {item.resolved ? 'Resolvido' : 'Pendente'}
                    </small>

                    {item.why_wrong && <p>{item.why_wrong}</p>}
                  </div>

                  <button type='button' onClick={() => resolveError(item)}>
                    {item.resolved ? '↩️ Reabrir' : '✅ Resolvi'}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* =====================================================
          ARQUIVO
      ===================================================== */}

      {tab === 'archive' && (
        <>
          <div className='diary-stats'>
            <StatCard
              icon='⏱️'
              value={legacySessions.length}
              label='sessões antigas'
            />

            <StatCard
              icon='📚'
              value={`${Math.round((legacyStudyMinutes / 60) * 10) / 10}h`}
              label='tempo histórico'
            />

            <StatCard
              icon='🧠'
              value={legacyKnowledge.length}
              label='conhecimentos antigos'
            />

            <StatCard
              icon='❌'
              value={legacyErrors.length}
              label='erros antigos'
            />
          </div>

          <div className='card'>
            <h3>📚 Histórico de sessões</h3>

            {legacySessions.length === 0 ? (
              <EmptyState icon='🗂️' title='Nenhuma sessão antiga' />
            ) : (
              [...legacySessions]
                .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                .map((item) => (
                  <article className='foguinho-row' key={item.id}>
                    <div>
                      <strong>
                        {item.discipline}
                        {' — '}
                        {item.subject}
                      </strong>

                      <small>
                        {dateLabel(item.date)}
                        {' · '}
                        {item.minutes} min
                        {' · '}
                        {item.method || 'Sem método'}
                      </small>

                      {item.learned && (
                        <p>
                          <strong>Aprendi:</strong> {item.learned}
                        </p>
                      )}

                      {item.notMastered && (
                        <p>
                          <strong>A revisar:</strong> {item.notMastered}
                        </p>
                      )}
                    </div>

                    <strong>
                      {item.exercises
                        ? Math.round(
                            (Number(item.correct || 0) /
                              Number(item.exercises)) *
                              100,
                          )
                        : '—'}

                      {item.exercises ? '%' : ''}
                    </strong>
                  </article>
                ))
            )}
          </div>

          <div className='card'>
            <h3>🧠 Conhecimentos antigos</h3>

            {legacyKnowledge.length === 0 ? (
              <EmptyState icon='🧠' title='Nenhum conhecimento antigo' />
            ) : (
              legacyKnowledge.map((item) => (
                <article className='foguinho-card' key={item.id}>
                  <div className='foguinho-card-top'>
                    <span>{item.discipline || 'Sem disciplina'}</span>

                    <span>{item.mastery || 0}% domínio</span>
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.explanation}</p>

                  {item.example && (
                    <p>
                      <strong>Exemplo:</strong> {item.example}
                    </p>
                  )}

                  {item.doubt && (
                    <p>
                      <strong>Dúvida:</strong> {item.doubt}
                    </p>
                  )}

                  {item.nextReview && (
                    <small>Próxima revisão: {dateLabel(item.nextReview)}</small>
                  )}

                  <div
                    className='connection-actions'
                    style={{
                      marginTop: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    {RATINGS.map(([key, label]) => (
                      <button
                        key={key}
                        type='button'
                        onClick={() => reviewLegacyKnowledge(item, key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className='card'>
            <h3>❌ Erros antigos</h3>

            {legacyErrors.length === 0 ? (
              <EmptyState icon='🎯' title='Nenhum erro antigo' />
            ) : (
              legacyErrors.map((item) => (
                <article className='foguinho-row' key={item.id}>
                  <div>
                    <strong>{item.question}</strong>

                    <small>
                      {item.discipline || 'Sem disciplina'}
                      {' · '}
                      {item.type || 'Outro'}
                      {' · '}
                      {item.resolved ? 'Resolvido' : 'Pendente'}
                    </small>

                    {item.whyWrong && <p>{item.whyWrong}</p>}
                  </div>

                  <button type='button' onClick={() => toggleLegacyError(item)}>
                    {item.resolved ? '↩️ Reabrir' : '✅ Marcar resolvido'}
                  </button>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
