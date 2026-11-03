import React, { useEffect, useMemo, useState } from 'react';

import StudyPlanner from './StudyPlanner';

import {
  createReading,
  createReview,
  createStudyError,
  createStudySession,
  getStudyDashboard,
  migrateLocalStudyData,
  reviewStudyItem,
  toggleStudyError,
  updateReading,
} from '../services/api';

const TABS = [
  ['overview', '📚 Visão geral'],
  ['statistics', '📊 Estatísticas'],
  ['organization', '🗓️ Planejamento'],
  ['sessions', '⏱️ Sessões'],
  ['reading', '📖 Leitura'],
  ['reviews', '🧠 Revisão espaçada'],
  ['errors', '❌ Banco de erros'],
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

function dateLabel(value) {
  if (!value) return '-';

  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
    'pt-BR',
  );
}

function percentage(correct, total) {
  const questions = Number(total || 0);
  const hits = Number(correct || 0);

  if (!questions) return 0;

  return Math.round((hits / questions) * 100);
}

function accuracyClass(value) {
  if (value >= 80) return 'study-accuracy-good';
  if (value >= 60) return 'study-accuracy-medium';
  return 'study-accuracy-low';
}
function getLocalDate(value) {
  if (!value) return null;

  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getWeekStart(date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);

  return result;
}

function formatHours(minutes) {
  const total = Number(minutes || 0);

  const hours = Math.floor(total / 60);
  const remaining = total % 60;

  if (hours === 0) return `${remaining}min`;

  return `${hours}h ${remaining}min`;
}

function getStudyPeriod(date, period) {
  const now = new Date();
  const current = getLocalDate(date);

  if (!current) return false;

  now.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      return current.getTime() === now.getTime();

    case 'week': {
      const start = getWeekStart(now);
      const end = new Date(start);

      end.setDate(end.getDate() + 7);

      return current >= start && current < end;
    }

    case 'month':
      return (
        current.getMonth() === now.getMonth() &&
        current.getFullYear() === now.getFullYear()
      );

    case 'year':
      return current.getFullYear() === now.getFullYear();

    case 'all':
      return true;

    default:
      return true;
  }
}

function getChartDateLabel(date, period) {
  const parsed = getLocalDate(date);

  if (!parsed) return '';

  if (period === 'year') {
    return parsed.toLocaleDateString('pt-BR', {
      month: 'short',
    });
  }

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}
export default function Estudos({ data: appData, save: saveAppData }) {
  const [tab, setTab] = useState('overview');

  const [loading, setLoading] = useState(true);
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

  const [expandedDisciplines, setExpandedDisciplines] = useState({});
  const studyCycles = Array.isArray(appData?.studyCycles)
    ? appData.studyCycles
    : [];
  const [statisticsPeriod, setStatisticsPeriod] = useState('week');

  const [selectedDisciplines, setSelectedDisciplines] = useState([]);

  const [statisticsMetric, setStatisticsMetric] = useState('questions');

  const [showAllDisciplines, setShowAllDisciplines] = useState(true);
  async function load() {
    setLoading(true);
    setError('');

    try {
      let local = null;

      /*
       * Migração dos dados antigos do localStorage.
       */
      try {
        const rawUser = localStorage.getItem('meu-assistente-user');
        const user = rawUser ? JSON.parse(rawUser) : null;

        if (user?.email) {
          local = JSON.parse(
            localStorage.getItem(`app_data_${user.email}`) || 'null',
          );
        }
      } catch {
        local = null;
      }

      if (
        local &&
        (local.studySessions?.length ||
          local.knowledgeItems?.length ||
          local.errors?.length)
      ) {
        await migrateLocalStudyData({
          studySessions: local.studySessions || [],
          knowledgeItems: local.knowledgeItems || [],
          errors: local.errors || [],
        });
      }

      const dashboard = await getStudyDashboard();

      setData({
        sessions: dashboard?.sessions || [],
        readings: dashboard?.readings || [],
        reviews: dashboard?.reviews || [],
        errors: dashboard?.errors || [],
      });
    } catch (e) {
      setError(e.message || 'Não foi possível carregar seus estudos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const todayMinutes = useMemo(
    () =>
      data.sessions
        .filter((s) => String(s.study_date).slice(0, 10) === today)
        .reduce((total, s) => total + Number(s.minutes || 0), 0),
    [data.sessions, today],
  );

  const totalMinutes = useMemo(
    () => data.sessions.reduce((total, s) => total + Number(s.minutes || 0), 0),
    [data.sessions],
  );

  const accuracy = useMemo(() => {
    const questions = data.sessions.reduce(
      (total, s) => total + Number(s.exercises || 0),
      0,
    );

    const correct = data.sessions.reduce(
      (total, s) => total + Number(s.correct || 0),
      0,
    );

    return percentage(correct, questions);
  }, [data.sessions]);

  /*
   * ============================================================
   * DESEMPENHO POR DISCIPLINA
   * ============================================================
   *
   * Estrutura:
   *
   * disciplina
   *   ├── questões
   *   ├── acertos
   *   ├── sessões
   *   ├── minutos
   *   ├── percentual
   *   └── conteúdos
   *          ├── questões
   *          ├── acertos
   *          ├── sessões
   *          ├── minutos
   *          └── percentual
   */

  const performanceByDiscipline = useMemo(() => {
    const disciplines = {};

    data.sessions.forEach((sessionItem) => {
      const discipline =
        String(sessionItem.discipline || 'Sem disciplina').trim() ||
        'Sem disciplina';

      const subject =
        String(sessionItem.subject || 'Sem conteúdo').trim() || 'Sem conteúdo';

      if (!disciplines[discipline]) {
        disciplines[discipline] = {
          name: discipline,
          questions: 0,
          correct: 0,
          sessions: 0,
          minutes: 0,
          contents: {},
        };
      }

      const disciplineData = disciplines[discipline];

      const questions = Number(sessionItem.exercises || 0);
      const correct = Number(sessionItem.correct || 0);
      const minutes = Number(sessionItem.minutes || 0);

      disciplineData.questions += questions;
      disciplineData.correct += correct;
      disciplineData.sessions += 1;
      disciplineData.minutes += minutes;

      if (!disciplineData.contents[subject]) {
        disciplineData.contents[subject] = {
          name: subject,
          questions: 0,
          correct: 0,
          sessions: 0,
          minutes: 0,
        };
      }

      const contentData = disciplineData.contents[subject];

      contentData.questions += questions;
      contentData.correct += correct;
      contentData.sessions += 1;
      contentData.minutes += minutes;
    });

    return Object.values(disciplines)
      .map((discipline) => ({
        ...discipline,
        accuracy: percentage(discipline.correct, discipline.questions),
        contents: Object.values(discipline.contents)
          .map((content) => ({
            ...content,
            accuracy: percentage(content.correct, content.questions),
          }))
          .sort((a, b) => {
            if (a.accuracy !== b.accuracy) {
              return a.accuracy - b.accuracy;
            }

            return b.questions - a.questions;
          }),
      }))
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) {
          return b.accuracy - a.accuracy;
        }

        return b.questions - a.questions;
      });
  }, [data.sessions]);

  const performanceMax = 100;
  const availableDisciplines = useMemo(() => {
    return [
      ...new Set(
        data.sessions
          .map((s) => String(s.discipline || '').trim())
          .filter(Boolean),
      ),
    ].sort();
  }, [data.sessions]);

  const statisticsSessions = useMemo(() => {
    return data.sessions.filter((session) => {
      const date = session.study_date || session.date;

      const matchesPeriod = getStudyPeriod(date, statisticsPeriod);

      const matchesDiscipline =
        showAllDisciplines ||
        selectedDisciplines.includes(String(session.discipline || '').trim());

      return matchesPeriod && matchesDiscipline;
    });
  }, [
    data.sessions,
    statisticsPeriod,
    selectedDisciplines,
    showAllDisciplines,
  ]);

  const statisticsTotals = useMemo(() => {
    return statisticsSessions.reduce(
      (total, session) => {
        const questions = Number(session.exercises || 0);
        const correct = Number(session.correct || 0);

        total.questions += questions;
        total.correct += correct;
        total.errors += Math.max(0, questions - correct);
        total.minutes += Number(session.minutes || 0);
        total.sessions += 1;

        return total;
      },
      {
        questions: 0,
        correct: 0,
        errors: 0,
        minutes: 0,
        sessions: 0,
      },
    );
  }, [statisticsSessions]);

  const statisticsAccuracy = percentage(
    statisticsTotals.correct,
    statisticsTotals.questions,
  );

  const statisticsChartData = useMemo(() => {
    const grouped = {};

    statisticsSessions.forEach((session) => {
      const date = String(session.study_date || session.date || '').slice(
        0,
        10,
      );

      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = {
          date,
          questions: 0,
          correct: 0,
          errors: 0,
          minutes: 0,
        };
      }

      const questions = Number(session.exercises || 0);
      const correct = Number(session.correct || 0);

      grouped[date].questions += questions;
      grouped[date].correct += correct;
      grouped[date].errors += Math.max(0, questions - correct);
      grouped[date].minutes += Number(session.minutes || 0);
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [statisticsSessions]);

  const statisticsByDiscipline = useMemo(() => {
    const grouped = {};

    statisticsSessions.forEach((session) => {
      const name = session.discipline || 'Sem disciplina';

      if (!grouped[name]) {
        grouped[name] = {
          name,
          questions: 0,
          correct: 0,
          minutes: 0,
        };
      }

      grouped[name].questions += Number(session.exercises || 0);
      grouped[name].correct += Number(session.correct || 0);
      grouped[name].minutes += Number(session.minutes || 0);
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      errors: Math.max(0, item.questions - item.correct),
      accuracy: percentage(item.correct, item.questions),
    }));
  }, [statisticsSessions]);
  function toggleDiscipline(disciplineName) {
    setExpandedDisciplines((current) => ({
      ...current,
      [disciplineName]: !current[disciplineName],
    }));
  }

  const dueReviews = data.reviews.filter(
    (r) => String(r.next_review).slice(0, 10) <= today,
  );

  const activeReadings = data.readings.filter((r) => r.status === 'reading');

  function flash(text) {
    setMessage(text);

    setTimeout(() => {
      setMessage('');
    }, 3000);
  }

  async function submitSession(e) {
    e.preventDefault();

    try {
      const payload = {
        ...session,
        minutes: Number(session.minutes || 0),
        difficulty: Number(session.difficulty || 3),
        exercises: Number(session.exercises || 0),
        correct: Number(session.correct || 0),
      };

      const created = await createStudySession(payload);

      if (appData && saveAppData) {
        saveAppData({
          ...appData,
          studySessions: [
            {
              ...created,
              date: created.study_date || new Date().toISOString().slice(0, 10),
              minutes: payload.minutes,
              subject: payload.subject,
              discipline: payload.discipline,
            },
            ...(appData.studySessions || []),
          ],
        });
      }

      setData((current) => ({
        ...current,
        sessions: [created, ...current.sessions],
      }));

      setSession(initialSession);

      flash('Sessão de estudo registrada.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitReading(e) {
    e.preventDefault();

    try {
      const created = await createReading({
        ...reading,
        totalPages: reading.totalPages ? Number(reading.totalPages) : null,
      });

      setData((current) => ({
        ...current,
        readings: [created, ...current.readings],
      }));

      setReading(initialReading);

      flash('Leitura adicionada.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function changeReading(item, patch) {
    try {
      const updated = await updateReading(item.id, patch);

      setData((current) => ({
        ...current,
        readings: current.readings.map((r) => (r.id === item.id ? updated : r)),
      }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitReview(e) {
    e.preventDefault();

    try {
      const created = await createReview({
        ...review,
        tags: review.tags,
      });

      setData((current) => ({
        ...current,
        reviews: [created, ...current.reviews],
      }));

      setReview(initialReview);

      flash('Conteúdo colocado na revisão espaçada.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function doReview(item, rating) {
    try {
      const updated = await reviewStudyItem(item.id, rating);

      setData((current) => ({
        ...current,
        reviews: current.reviews.map((r) => (r.id === item.id ? updated : r)),
      }));

      flash(
        `Revisão registrada. Próxima revisão: ${dateLabel(
          updated.next_review,
        )}.`,
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitError(e) {
    e.preventDefault();

    try {
      const created = await createStudyError(studyError);

      setData((current) => ({
        ...current,
        errors: [created, ...current.errors],
      }));

      setStudyError(initialError);

      flash('Erro adicionado ao banco de erros.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function resolveError(item) {
    try {
      const updated = await toggleStudyError(item.id);

      setData((current) => ({
        ...current,
        errors: current.errors.map((x) => (x.id === item.id ? updated : x)),
      }));
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <section className='card' style={{ margin: 24 }}>
        <h2>📚 Estudos</h2>
        <p>Carregando seus estudos...</p>
      </section>
    );
  }

  return (
    <section className='diary-page'>
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className='diary-hero'>
        <div>
          <span className='eyebrow'>ESTUDOS</span>

          <h1>📚 Estudos & Leitura</h1>

          <p>
            Registre sessões, acompanhe leituras e revise conhecimentos no
            momento certo.
          </p>
        </div>

        <div className='today-badge'>🧠</div>
      </div>

      {/* =====================================================
          MENSAGENS
      ====================================================== */}

      {message && <div className='success-message'>{message}</div>}

      {error && (
        <div className='auth-error' role='alert'>
          <span>{error}</span>

          <button
            type='button'
            className='study-action-button secondary'
            onClick={() => setError('')}
          >
            Fechar
          </button>
        </div>
      )}

      {/* =====================================================
          NAVEGAÇÃO
      ====================================================== */}

      <div className='study-navigation'>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type='button'
            className={tab === id ? 'study-tab active' : 'study-tab'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {/* =====================================================
    ESTATÍSTICAS DOS ESTUDOS
===================================================== */}

      {tab === 'statistics' && (
        <div className='study-statistics'>
          <div className='card'>
            <div className='study-section-heading'>
              <div>
                <span className='eyebrow'>ANÁLISE DE DESEMPENHO</span>
                <h3>📊 Estatísticas dos estudos</h3>
                <p>
                  Acompanhe sua evolução, produtividade e desempenho em
                  questões.
                </p>
              </div>
            </div>

            <div className='study-statistics-filters'>
              <label>
                Período
                <select
                  value={statisticsPeriod}
                  onChange={(e) => setStatisticsPeriod(e.target.value)}
                >
                  <option value='today'>Hoje</option>
                  <option value='week'>Esta semana</option>
                  <option value='month'>Este mês</option>
                  <option value='year'>Este ano</option>
                  <option value='all'>Todo o período</option>
                </select>
              </label>

              <label>
                Disciplinas
                <select
                  value={showAllDisciplines ? 'all' : 'selected'}
                  onChange={(e) => {
                    setShowAllDisciplines(e.target.value === 'all');
                  }}
                >
                  <option value='all'>Todas as disciplinas</option>
                  <option value='selected'>Selecionar disciplinas</option>
                </select>
              </label>
            </div>

            {!showAllDisciplines && (
              <div className='study-statistics-disciplines'>
                {availableDisciplines.map((discipline) => (
                  <label key={discipline}>
                    <input
                      type='checkbox'
                      checked={selectedDisciplines.includes(discipline)}
                      onChange={(e) => {
                        setSelectedDisciplines((current) =>
                          e.target.checked
                            ? [...current, discipline]
                            : current.filter((item) => item !== discipline),
                        );
                      }}
                    />
                    {discipline}
                  </label>
                ))}

                {availableDisciplines.length === 0 && (
                  <p>Nenhuma disciplina cadastrada.</p>
                )}
              </div>
            )}
          </div>

          {/* INDICADORES */}

          <div className='diary-stats'>
            <div className='diary-stat'>
              <span>📝</span>
              <div>
                <strong>
                  {statisticsTotals.questions.toLocaleString('pt-BR')}
                </strong>
                <small>Total de questões feitas</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>✅</span>
              <div>
                <strong>
                  {statisticsTotals.correct.toLocaleString('pt-BR')}
                </strong>
                <small>Questões corretas</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>❌</span>
              <div>
                <strong>
                  {statisticsTotals.errors.toLocaleString('pt-BR')}
                </strong>
                <small>Questões erradas</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>⏱️</span>
              <div>
                <strong>{formatHours(statisticsTotals.minutes)}</strong>
                <small>Tempo estudado</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>🎯</span>
              <div>
                <strong>{statisticsAccuracy}%</strong>
                <small>Taxa de acertos</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>📚</span>
              <div>
                <strong>{statisticsTotals.sessions}</strong>
                <small>Sessões realizadas</small>
              </div>
            </div>
          </div>

          {/* SELEÇÃO DO GRÁFICO */}

          <div className='card'>
            <h3>📈 Evolução dos estudos</h3>

            <div className='study-statistics-metric'>
              <button
                type='button'
                className={
                  statisticsMetric === 'questions'
                    ? 'study-tab active'
                    : 'study-tab'
                }
                onClick={() => setStatisticsMetric('questions')}
              >
                Questões
              </button>

              <button
                type='button'
                className={
                  statisticsMetric === 'minutes'
                    ? 'study-tab active'
                    : 'study-tab'
                }
                onClick={() => setStatisticsMetric('minutes')}
              >
                Horas estudadas
              </button>

              <button
                type='button'
                className={
                  statisticsMetric === 'accuracy'
                    ? 'study-tab active'
                    : 'study-tab'
                }
                onClick={() => setStatisticsMetric('accuracy')}
              >
                Aproveitamento
              </button>
            </div>

            {statisticsChartData.length === 0 ? (
              <div className='study-empty-performance'>
                <div className='study-empty-icon'>📊</div>
                <strong>Nenhum dado encontrado neste período.</strong>
                <p>
                  Registre sessões de estudo com questões ou tempo para
                  visualizar sua evolução.
                </p>
              </div>
            ) : (
              <div className='study-statistics-chart'>
                {statisticsChartData.map((item) => {
                  const value =
                    statisticsMetric === 'questions'
                      ? item.questions
                      : statisticsMetric === 'minutes'
                        ? item.minutes
                        : percentage(item.correct, item.questions);

                  const maxValue = Math.max(
                    1,
                    ...statisticsChartData.map((entry) =>
                      statisticsMetric === 'questions'
                        ? entry.questions
                        : statisticsMetric === 'minutes'
                          ? entry.minutes
                          : percentage(entry.correct, entry.questions),
                    ),
                  );

                  return (
                    <div className='study-chart-column' key={item.date}>
                      <div className='study-chart-value'>
                        {statisticsMetric === 'minutes'
                          ? formatHours(value)
                          : statisticsMetric === 'accuracy'
                            ? `${value}%`
                            : value}
                      </div>

                      <div className='study-chart-bar-area'>
                        <div
                          className={`study-chart-bar ${statisticsMetric}`}
                          style={{
                            height: `${Math.max(3, (value / maxValue) * 100)}%`,
                          }}
                        />
                      </div>

                      <small>
                        {getChartDateLabel(item.date, statisticsPeriod)}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACERTOS E ERROS */}

          <div className='card'>
            <h3>🎯 Acertos e erros</h3>

            <div className='study-statistics-comparison'>
              <div>
                <span>Acertos</span>
                <strong>{statisticsTotals.correct}</strong>
                <div className='study-progress-track'>
                  <div
                    className='study-progress-fill study-accuracy-good'
                    style={{
                      width: `${statisticsAccuracy}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <span>Erros</span>
                <strong>{statisticsTotals.errors}</strong>
                <div className='study-progress-track'>
                  <div
                    className='study-progress-fill study-accuracy-low'
                    style={{
                      width: `${
                        statisticsTotals.questions
                          ? (statisticsTotals.errors /
                              statisticsTotals.questions) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DESEMPENHO POR DISCIPLINA */}

          <div className='card'>
            <h3>📚 Desempenho por disciplina</h3>

            {statisticsByDiscipline.length === 0 ? (
              <p>Nenhuma disciplina encontrada.</p>
            ) : (
              <div className='study-performance-list'>
                {statisticsByDiscipline.map((discipline) => (
                  <div className='study-discipline' key={discipline.name}>
                    <div className='study-discipline-header'>
                      <div>
                        <strong>{discipline.name}</strong>
                        <small>
                          {discipline.questions} questões ·{' '}
                          {formatHours(discipline.minutes)}
                        </small>
                      </div>

                      <div className='study-discipline-score'>
                        <strong>{discipline.accuracy}%</strong>
                        <small>
                          {discipline.correct} acertos · {discipline.errors}{' '}
                          erros
                        </small>
                      </div>
                    </div>

                    <div className='study-progress-track'>
                      <div
                        className={`study-progress-fill ${accuracyClass(
                          discipline.accuracy,
                        )}`}
                        style={{
                          width: `${discipline.accuracy}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {tab === 'organization' && (
        <StudyPlanner
          data={appData}
          save={saveAppData}
          sessions={data.sessions}
          reviews={data.reviews}
          cycles={studyCycles}
        />
      )}

      {/* =====================================================
          VISÃO GERAL
      ====================================================== */}

      {tab === 'overview' && (
        <>
          <div className='diary-stats'>
            <div className='diary-stat'>
              <span>⏱️</span>

              <div>
                <strong>{todayMinutes}min</strong>

                <small>estudados hoje</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>📚</span>

              <div>
                <strong>{Math.round((totalMinutes / 60) * 10) / 10}h</strong>

                <small>tempo total</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>🎯</span>

              <div>
                <strong>{accuracy}%</strong>

                <small>acerto nos exercícios</small>
              </div>
            </div>

            <div className='diary-stat'>
              <span>🧠</span>

              <div>
                <strong>{dueReviews.length}</strong>

                <small>revisões para hoje</small>
              </div>
            </div>
          </div>

          {/* =================================================
              NOVO: DESEMPENHO POR DISCIPLINA
          ================================================== */}

          <div className='card study-performance-card'>
            <div className='study-section-heading'>
              <div>
                <span className='eyebrow'>DESEMPENHO</span>

                <h3>📊 Desempenho por disciplina</h3>

                <p>
                  Veja seu percentual de acertos e aprofunde até o nível de cada
                  conteúdo.
                </p>
              </div>

              <span className='study-performance-total'>
                {performanceByDiscipline.length} disciplina(s)
              </span>
            </div>

            {performanceByDiscipline.length === 0 ? (
              <div className='study-empty-performance'>
                <div className='study-empty-icon'>📊</div>

                <strong>Ainda não há dados suficientes.</strong>

                <p>
                  Registre suas primeiras sessões de estudo com disciplina,
                  conteúdo, questões e acertos.
                </p>

                <button
                  type='button'
                  className='study-action-button'
                  onClick={() => setTab('sessions')}
                >
                  Registrar sessão
                </button>
              </div>
            ) : (
              <div className='study-performance-list'>
                {performanceByDiscipline.map((discipline) => {
                  const isExpanded = Boolean(
                    expandedDisciplines[discipline.name],
                  );

                  return (
                    <div className='study-discipline' key={discipline.name}>
                      <button
                        type='button'
                        className='study-discipline-header'
                        onClick={() => toggleDiscipline(discipline.name)}
                      >
                        <div className='study-discipline-main'>
                          <span
                            className={`study-expand-icon ${
                              isExpanded ? 'expanded' : ''
                            }`}
                          >
                            ›
                          </span>

                          <div>
                            <strong>{discipline.name}</strong>

                            <small>
                              {discipline.sessions} sessão
                              {discipline.sessions !== 1 ? 'ões' : ''} ·{' '}
                              {discipline.questions} questões ·{' '}
                              {discipline.minutes}min
                            </small>
                          </div>
                        </div>

                        <div className='study-discipline-score'>
                          <strong>{discipline.accuracy}%</strong>

                          <small>
                            {discipline.correct}/{discipline.questions} acertos
                          </small>
                        </div>
                      </button>

                      <div className='study-progress-track'>
                        <div
                          className={`study-progress-fill ${accuracyClass(
                            discipline.accuracy,
                          )}`}
                          style={{
                            width: `${Math.min(
                              performanceMax,
                              discipline.accuracy,
                            )}%`,
                          }}
                        />
                      </div>

                      {isExpanded && (
                        <div className='study-content-breakdown'>
                          <div className='study-content-title'>
                            <span>📚 Conteúdos</span>

                            <small>
                              {discipline.contents.length} conteúdo(s)
                            </small>
                          </div>

                          {discipline.contents.map((content) => (
                            <div
                              className='study-content-row'
                              key={`${discipline.name}-${content.name}`}
                            >
                              <div className='study-content-info'>
                                <strong>{content.name}</strong>

                                <small>
                                  {content.sessions} sessão
                                  {content.sessions !== 1 ? 'ões' : ''} ·{' '}
                                  {content.minutes}min
                                </small>
                              </div>

                              <div className='study-content-bar-area'>
                                <div className='study-progress-track'>
                                  <div
                                    className={`study-progress-fill ${accuracyClass(
                                      content.accuracy,
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        performanceMax,
                                        content.accuracy,
                                      )}%`,
                                    }}
                                  />
                                </div>

                                <span
                                  className={`study-content-percentage ${accuracyClass(
                                    content.accuracy,
                                  )}`}
                                >
                                  {content.accuracy}%
                                </span>
                              </div>

                              <div className='study-content-stats'>
                                <span>
                                  🎯 {content.correct}/{content.questions}
                                </span>

                                <span>📝 {content.questions} questões</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =================================================
              PRÓXIMAS AÇÕES
          ================================================== */}

          <div className='card'>
            <h3>🗓️ Próximas ações</h3>

            <ul>
              <li>
                {dueReviews.length
                  ? `Faça ${dueReviews.length} revisão(ões) pendente(s).`
                  : 'Nenhuma revisão atrasada ou para hoje.'}
              </li>

              <li>
                {activeReadings.length
                  ? `Você tem ${activeReadings.length} leitura(s) em andamento.`
                  : 'Adicione uma leitura em andamento.'}
              </li>

              <li>
                Registre cada sessão com o que aprendeu e o que ainda não
                domina.
              </li>
            </ul>
          </div>

          {/* =================================================
              ÚLTIMAS SESSÕES
          ================================================== */}

          <div className='card'>
            <h3>📈 Últimas sessões</h3>

            {data.sessions.length === 0 ? (
              <p>Nenhuma sessão registrada ainda.</p>
            ) : (
              data.sessions.slice(0, 6).map((s) => (
                <div className='foguinho-row' key={s.id}>
                  <div>
                    <strong>
                      {s.discipline} — {s.subject}
                    </strong>

                    <small>
                      {dateLabel(s.study_date)}
                      {' · '}
                      {s.minutes}min
                      {' · '}
                      {s.method}
                    </small>
                  </div>

                  <strong>{percentage(s.correct, s.exercises)}%</strong>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* =====================================================
          CICLO DE ESTUDOS
      ====================================================== */}

      {/* =====================================================
          SESSÕES
      ====================================================== */}

      {tab === 'sessions' && (
        <div className='card'>
          <h3>⏱️ Registrar sessão de estudo</h3>

          <form onSubmit={submitSession} className='form-grid'>
            <label>
              Disciplina
              <input
                required
                value={session.discipline}
                onChange={(e) =>
                  setSession({
                    ...session,
                    discipline: e.target.value,
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
                onChange={(e) =>
                  setSession({
                    ...session,
                    subject: e.target.value,
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
                onChange={(e) =>
                  setSession({
                    ...session,
                    minutes: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Método
              <select
                value={session.method}
                onChange={(e) =>
                  setSession({
                    ...session,
                    method: e.target.value,
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
                onChange={(e) =>
                  setSession({
                    ...session,
                    difficulty: e.target.value,
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
                onChange={(e) =>
                  setSession({
                    ...session,
                    exercises: e.target.value,
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
                onChange={(e) =>
                  setSession({
                    ...session,
                    correct: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Aprendi
              <textarea
                value={session.learned}
                onChange={(e) =>
                  setSession({
                    ...session,
                    learned: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Ainda não domino
              <textarea
                value={session.notMastered}
                onChange={(e) =>
                  setSession({
                    ...session,
                    notMastered: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Observações
              <textarea
                value={session.observations}
                onChange={(e) =>
                  setSession({
                    ...session,
                    observations: e.target.value,
                  })
                }
              />
            </label>

            <div>
              <button type='submit' className='study-action-button'>
                Salvar sessão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          LEITURA
      ====================================================== */}

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
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      title: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Autor / fonte
                <input
                  value={reading.author}
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      author: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Tipo
                <select
                  value={reading.type}
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      type: e.target.value,
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
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      totalPages: e.target.value,
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
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      progress: e.target.value,
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
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      currentPage: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={reading.status}
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      status: e.target.value,
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
                  onChange={(e) =>
                    setReading({
                      ...reading,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              <div>
                <button type='submit' className='study-action-button'>
                  Adicionar leitura
                </button>
              </div>
            </form>
          </div>

          <div className='card'>
            <h3>📚 Minha biblioteca</h3>

            {data.readings.length === 0 ? (
              <p>Nenhuma leitura cadastrada.</p>
            ) : (
              data.readings.map((r) => (
                <div className='foguinho-row' key={r.id}>
                  <div>
                    <strong>{r.title}</strong>

                    <small>
                      {r.author || 'Sem autor'}
                      {' · '}
                      {r.progress}%{' · '}
                      {r.status}
                    </small>
                  </div>

                  <div className='study-reading-actions'>
                    <button
                      type='button'
                      className='study-action-button'
                      onClick={() =>
                        changeReading(r, {
                          progress: Math.min(100, Number(r.progress) + 10),
                          status:
                            Number(r.progress) + 10 >= 100
                              ? 'completed'
                              : 'reading',
                        })
                      }
                    >
                      +10%
                    </button>

                    <select
                      value={r.status}
                      onChange={(e) =>
                        changeReading(r, {
                          status: e.target.value,
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
      ====================================================== */}

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
                  onChange={(e) =>
                    setReview({
                      ...review,
                      title: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Disciplina
                <input
                  required
                  value={review.discipline}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      discipline: e.target.value,
                    })
                  }
                />
              </label>

              <label className='full'>
                Conteúdo / resposta
                <input
                  required
                  value={review.content}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      content: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Exemplo
                <textarea
                  value={review.example}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      example: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Tags
                <input
                  value={review.tags}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      tags: e.target.value,
                    })
                  }
                  placeholder='java, lógica, prova'
                />
              </label>

              <div>
                <button type='submit' className='study-action-button'>
                  Criar revisão
                </button>
              </div>
            </form>
          </div>

          <div className='card'>
            <h3>📅 Fila de revisão</h3>

            {data.reviews.length === 0 ? (
              <p>Nenhum conhecimento cadastrado.</p>
            ) : (
              data.reviews.map((r) => (
                <article key={r.id} className='foguinho-card'>
                  <div className='foguinho-card-top'>
                    <span>{r.discipline}</span>

                    <span>{r.mastery}% domínio</span>
                  </div>

                  <h3>{r.title}</h3>

                  <p>{r.content}</p>

                  <small>
                    Próxima: {dateLabel(r.next_review)}
                    {' · '}
                    {r.review_count} revisão(ões)
                  </small>

                  <div className='study-review-actions'>
                    {RATINGS.map(([key, label]) => {
                      const isDue = String(r.next_review).slice(0, 10) <= today;

                      return (
                        <button
                          key={key}
                          type='button'
                          className={
                            isDue
                              ? 'study-action-button'
                              : 'study-action-button secondary'
                          }
                          onClick={() => doReview(r, key)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* =====================================================
          BANCO DE ERROS
      ====================================================== */}

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
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      question: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Minha resposta
                <textarea
                  value={studyError.myAnswer}
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      myAnswer: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Resposta correta
                <textarea
                  required
                  value={studyError.correctAnswer}
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      correctAnswer: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Por que errei?
                <textarea
                  required
                  value={studyError.whyWrong}
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      whyWrong: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Tipo
                <select
                  value={studyError.type}
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      type: e.target.value,
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
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      discipline: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Assunto
                <input
                  value={studyError.subject}
                  onChange={(e) =>
                    setStudyError({
                      ...studyError,
                      subject: e.target.value,
                    })
                  }
                />
              </label>

              <div>
                <button type='submit' className='study-action-button'>
                  Salvar erro
                </button>
              </div>
            </form>
          </div>

          <div className='card'>
            <h3>🗂️ Banco de erros</h3>

            {data.errors.length === 0 ? (
              <p>Nenhum erro registrado.</p>
            ) : (
              data.errors.map((e) => (
                <div className='foguinho-row' key={e.id}>
                  <div>
                    <strong>{e.question}</strong>

                    <small>
                      {e.discipline || 'Sem disciplina'}
                      {' · '}
                      {e.type}
                      {' · '}
                      {e.resolved ? 'Resolvido' : 'Pendente'}
                    </small>

                    <p>{e.why_wrong}</p>
                  </div>

                  <button
                    type='button'
                    className={
                      e.resolved
                        ? 'study-action-button secondary'
                        : 'study-action-button'
                    }
                    onClick={() => resolveError(e)}
                  >
                    {e.resolved ? '↩️ Reabrir' : '✅ Resolvi'}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
