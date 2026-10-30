import React, { useMemo, useState } from 'react';
import PersonalData from './PersonalData';

const MENU_ITEMS = [
  {
    id: 'today',
    icon: '🏠',
    label: 'Hoje',
    description: 'Meu dia',
  },
  {
    id: 'study',
    icon: '📚',
    label: 'Estudos',
    description: 'Sessões e desempenho',
  },
  {
    id: 'reviews',
    icon: '🧠',
    label: 'Revisões',
    description: 'Revisão espaçada',
  },
  {
    id: 'errors',
    icon: '❌',
    label: 'Banco de erros',
    description: 'Erros e aprendizados',
  },
  {
    id: 'knowledge',
    icon: '📖',
    label: 'Conhecimentos',
    description: 'O que estou aprendendo',
  },
  {
    id: 'performance',
    icon: '📊',
    label: 'Desempenho',
    description: 'Minha evolução',
  },
  {
    id: 'history',
    icon: '🗓️',
    label: 'Histórico',
    description: 'Linha do tempo',
  },
  {
    id: 'reflection',
    icon: '🔎',
    label: 'Reflexão',
    description: 'Reflexão semanal',
  },
];

const REVIEW_LEVELS = [
  {
    key: 'forgot',
    emoji: '😵',
    label: 'Não lembro',
    days: 1,
    mastery: 20,
  },
  {
    key: 'little',
    emoji: '😕',
    label: 'Lembro pouco',
    days: 2,
    mastery: 40,
  },
  {
    key: 'partial',
    emoji: '😐',
    label: 'Parcialmente',
    days: 4,
    mastery: 60,
  },
  {
    key: 'well',
    emoji: '🙂',
    label: 'Lembro bem',
    days: 7,
    mastery: 80,
  },
  {
    key: 'master',
    emoji: '🧠',
    label: 'Domino',
    days: 14,
    mastery: 95,
  },
];

const ERROR_TYPES = [
  'Falta de conhecimento',
  'Desatenção',
  'Interpretação',
  'Pressa',
  'Cálculo',
  'Não conhecia o conteúdo',
];

const STUDY_METHODS = [
  'Teoria',
  'Exercícios',
  'Videoaula',
  'Leitura',
  'Resumo',
  'Flashcards',
  'Revisão',
  'Projeto',
  'Simulado',
  'Outro',
];

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return '-';

  const [year, month, day] = dateString.split('-');

  return `${day}/${month}/${year}`;
}

function formatLongDate(dateString) {
  if (!dateString) return '';

  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatMinutes(minutes) {
  const value = Number(minutes) || 0;

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }

  return `${mins}min`;
}

function getReviewStatus(nextReview) {
  const today = getLocalDate();

  if (!nextReview) return 'future';

  if (nextReview < today) return 'overdue';
  if (nextReview === today) return 'today';

  return 'future';
}

function getMasteryLabel(mastery) {
  const value = Number(mastery) || 0;

  if (value >= 90) return 'Dominado';
  if (value >= 75) return 'Bom';
  if (value >= 50) return 'Parcial';
  if (value >= 25) return 'Baixo';

  return 'Inicial';
}

function getMasteryClass(mastery) {
  const value = Number(mastery) || 0;

  if (value >= 75) return 'good';
  if (value >= 50) return 'medium';

  return 'low';
}

function getNextMasterInterval(previousInterval) {
  const previous = Number(previousInterval) || 0;

  if (previous < 14) return 14;
  if (previous < 30) return 30;
  if (previous < 60) return 60;
  if (previous < 120) return 120;

  return 120;
}

function getInitialDiary() {
  return {
    mood: 3,
    energy: 3,
    focus: 3,
    sleep: '',
    stress: 3,
    motivation: 3,
    productivity: 3,
    happened: '',
    important: '',
    wentWell: '',
    wentWrong: '',
    learned: '',
    improveTomorrow: '',
    notes: '',
  };
}

function getInitialStudy() {
  return {
    discipline: '',
    subject: '',
    minutes: '',
    method: 'Exercícios',
    difficulty: 3,
    exercises: '',
    correct: '',
    errors: '',
    observations: '',
    learned: '',
    notMastered: '',
  };
}

function getInitialKnowledge() {
  return {
    title: '',
    discipline: '',
    explanation: '',
    example: '',
    doubt: '',
    tags: '',
    addToReview: true,
  };
}

function getInitialError() {
  return {
    question: '',
    myAnswer: '',
    correctAnswer: '',
    whyWrong: '',
    type: 'Falta de conhecimento',
    discipline: '',
    subject: '',
  };
}

function getInitialReflection() {
  return {
    accomplished: '',
    learned: '',
    difficulty: '',
    lostTime: '',
    continue: '',
    stop: '',
    priority: '',
  };
}

export default function Diario({ data, save }) {
  const [section, setSection] = useState('today');

  const [diaryForm, setDiaryForm] = useState(getInitialDiary);
  const [studyForm, setStudyForm] = useState(getInitialStudy);
  const [knowledgeForm, setKnowledgeForm] = useState(getInitialKnowledge);
  const [errorForm, setErrorForm] = useState(getInitialError);
  const [reflectionForm, setReflectionForm] = useState(getInitialReflection);

  const [reviewingId, setReviewingId] = useState(null);
  const [message, setMessage] = useState('');

  const diaryEntries = data.diaryEntries || [];
  const studySessions = data.studySessions || [];
  const knowledgeItems = data.knowledgeItems || [];
  const errors = data.errors || [];
  const weeklyReflections = data.weeklyReflections || [];

  const today = getLocalDate();

  const todayDiary = useMemo(() => {
    return diaryEntries.find((entry) => entry.date === today);
  }, [diaryEntries, today]);

  const todaySessions = useMemo(() => {
    return studySessions.filter((session) => session.date === today);
  }, [studySessions, today]);

  const todayStudyMinutes = useMemo(() => {
    return todaySessions.reduce(
      (total, session) => total + Number(session.minutes || 0),
      0,
    );
  }, [todaySessions]);

  const totalQuestions = useMemo(() => {
    return studySessions.reduce(
      (total, session) => total + Number(session.exercises || 0),
      0,
    );
  }, [studySessions]);

  const totalCorrect = useMemo(() => {
    return studySessions.reduce(
      (total, session) => total + Number(session.correct || 0),
      0,
    );
  }, [studySessions]);

  const accuracy = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const reviews = useMemo(() => {
    return knowledgeItems
      .map((item) => ({
        ...item,
        reviewStatus: getReviewStatus(item.nextReview),
      }))
      .sort((a, b) => {
        const order = {
          overdue: 0,
          today: 1,
          future: 2,
        };

        return (
          order[a.reviewStatus] - order[b.reviewStatus] ||
          String(a.nextReview).localeCompare(String(b.nextReview))
        );
      });
  }, [knowledgeItems]);

  const overdueReviews = reviews.filter(
    (item) => item.reviewStatus === 'overdue',
  );

  const todayReviews = reviews.filter((item) => item.reviewStatus === 'today');

  const futureReviews = reviews.filter(
    (item) => item.reviewStatus === 'future',
  );

  const masteredKnowledge = knowledgeItems.filter(
    (item) => Number(item.mastery || 0) >= 90,
  );

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage('');
    }, 2500);
  };

  const updateDiaryField = (field, value) => {
    setDiaryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveDiary = (event) => {
    event.preventDefault();

    const entry = {
      id: todayDiary?.id || Date.now(),
      date: today,
      ...diaryForm,
      updatedAt: new Date().toISOString(),
    };

    const updatedEntries = todayDiary
      ? diaryEntries.map((item) => (item.id === todayDiary.id ? entry : item))
      : [entry, ...diaryEntries];

    save({
      ...data,
      diaryEntries: updatedEntries,
    });

    showMessage('Diário salvo com sucesso.');
  };

  const saveStudySession = (event) => {
    event.preventDefault();

    if (
      !studyForm.discipline.trim() ||
      !studyForm.subject.trim() ||
      !studyForm.minutes
    ) {
      showMessage('Preencha disciplina, conteúdo e tempo de estudo.');
      return;
    }

    const exercises = Number(studyForm.exercises || 0);
    const correct = Number(studyForm.correct || 0);

    const session = {
      id: Date.now(),
      date: today,
      createdAt: new Date().toISOString(),
      discipline: studyForm.discipline.trim(),
      subject: studyForm.subject.trim(),
      minutes: Number(studyForm.minutes),
      method: studyForm.method,
      difficulty: Number(studyForm.difficulty),
      exercises,
      correct,
      errors: Number(studyForm.errors || Math.max(0, exercises - correct)),
      observations: studyForm.observations.trim(),
      learned: studyForm.learned.trim(),
      notMastered: studyForm.notMastered.trim(),
    };

    save({
      ...data,
      studySessions: [session, ...studySessions],
      xp: Number(data.xp || 0) + 40,
    });

    setStudyForm(getInitialStudy());

    showMessage('Sessão registrada! +40 XP');
  };

  const saveKnowledge = (event) => {
    event.preventDefault();

    if (
      !knowledgeForm.title.trim() ||
      !knowledgeForm.discipline.trim() ||
      !knowledgeForm.explanation.trim()
    ) {
      showMessage('Preencha título, disciplina e explicação.');
      return;
    }

    const knowledge = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      title: knowledgeForm.title.trim(),
      discipline: knowledgeForm.discipline.trim(),
      explanation: knowledgeForm.explanation.trim(),
      example: knowledgeForm.example.trim(),
      doubt: knowledgeForm.doubt.trim(),
      tags: knowledgeForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      mastery: 0,
      lastReview: null,
      nextReview: knowledgeForm.addToReview ? today : null,
      reviewInterval: 0,
      reviewCount: 0,
      reviewHistory: [],
    };

    save({
      ...data,
      knowledgeItems: [knowledge, ...knowledgeItems],
    });

    setKnowledgeForm(getInitialKnowledge());

    showMessage('Conhecimento salvo.');
  };

  const saveError = (event) => {
    event.preventDefault();

    if (
      !errorForm.question.trim() ||
      !errorForm.correctAnswer.trim() ||
      !errorForm.whyWrong.trim()
    ) {
      showMessage('Preencha a questão, resposta correta e motivo do erro.');
      return;
    }

    const errorItem = {
      id: Date.now(),
      date: today,
      createdAt: new Date().toISOString(),
      question: errorForm.question.trim(),
      myAnswer: errorForm.myAnswer.trim(),
      correctAnswer: errorForm.correctAnswer.trim(),
      whyWrong: errorForm.whyWrong.trim(),
      type: errorForm.type,
      discipline: errorForm.discipline.trim(),
      subject: errorForm.subject.trim(),
      resolved: false,
    };

    save({
      ...data,
      errors: [errorItem, ...errors],
    });

    setErrorForm(getInitialError());

    showMessage('Erro registrado no banco.');
  };

  const markErrorResolved = (id) => {
    const updatedErrors = errors.map((item) =>
      item.id === id
        ? {
            ...item,
            resolved: !item.resolved,
            resolvedAt: !item.resolved ? new Date().toISOString() : null,
          }
        : item,
    );

    save({
      ...data,
      errors: updatedErrors,
    });
  };

  const reviewKnowledge = (id, ratingKey) => {
    const item = knowledgeItems.find((knowledge) => knowledge.id === id);

    const rating = REVIEW_LEVELS.find((level) => level.key === ratingKey);

    if (!item || !rating) return;

    const todayDate = getLocalDate();

    let interval = rating.days;

    if (ratingKey === 'master') {
      interval = getNextMasterInterval(item.reviewInterval);
    }

    const nextReview = addDays(todayDate, interval);

    const updatedItem = {
      ...item,
      mastery: rating.mastery,
      lastReview: todayDate,
      nextReview,
      reviewInterval: interval,
      reviewCount: Number(item.reviewCount || 0) + 1,
      reviewHistory: [
        ...(item.reviewHistory || []),
        {
          date: todayDate,
          rating: ratingKey,
          label: rating.label,
          mastery: rating.mastery,
          nextReview,
        },
      ],
    };

    save({
      ...data,
      knowledgeItems: knowledgeItems.map((knowledge) =>
        knowledge.id === id ? updatedItem : knowledge,
      ),
      xp: Number(data.xp || 0) + 15,
    });

    setReviewingId(null);

    showMessage(
      `Revisão concluída! +15 XP • Próxima: ${formatDate(nextReview)}`,
    );
  };

  const saveReflection = (event) => {
    event.preventDefault();

    const weekStart = addDays(today, -6);

    const reflection = {
      id: Date.now(),
      date: today,
      weekStart,
      ...reflectionForm,
      createdAt: new Date().toISOString(),
    };

    save({
      ...data,
      weeklyReflections: [reflection, ...weeklyReflections],
    });

    setReflectionForm(getInitialReflection());

    showMessage('Reflexão semanal salva.');
  };

  const getSectionTitle = () => {
    const current = MENU_ITEMS.find((item) => item.id === section);

    return current?.label || 'Diário';
  };

  const getDisciplineStats = () => {
    const map = {};

    studySessions.forEach((session) => {
      const discipline = session.discipline || 'Sem disciplina';

      if (!map[discipline]) {
        map[discipline] = {
          discipline,
          minutes: 0,
          sessions: 0,
          questions: 0,
          correct: 0,
        };
      }

      map[discipline].minutes += Number(session.minutes || 0);
      map[discipline].sessions += 1;
      map[discipline].questions += Number(session.exercises || 0);
      map[discipline].correct += Number(session.correct || 0);
    });

    return Object.values(map).sort((a, b) => b.minutes - a.minutes);
  };

  const disciplineStats = getDisciplineStats();

  const getErrorStats = () => {
    const map = {};

    errors.forEach((item) => {
      const type = item.type || 'Outro';

      map[type] = (map[type] || 0) + 1;
    });

    return Object.entries(map)
      .map(([type, count]) => ({
        type,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const errorStats = getErrorStats();

  const totalStudyHours = studySessions.reduce(
    (total, session) => total + Number(session.minutes || 0),
    0,
  );

  const renderStars = (value) => {
    return '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value));
  };

  const renderToday = () => (
    <div className='diary-section'>
      <div className='diary-hero'>
        <div>
          <span className='eyebrow'>DIÁRIO</span>

          <h1>Como foi seu dia?</h1>

          <p>{formatLongDate(today)}</p>
        </div>

        <div className='today-badge'>📖</div>
      </div>

      <div className='diary-stats'>
        <div className='diary-stat'>
          <span>📚</span>
          <div>
            <strong>{formatMinutes(todayStudyMinutes)}</strong>
            <small>estudados hoje</small>
          </div>
        </div>

        <div className='diary-stat'>
          <span>🧠</span>
          <div>
            <strong>{overdueReviews.length + todayReviews.length}</strong>
            <small>revisões pendentes</small>
          </div>
        </div>

        <div className='diary-stat'>
          <span>📝</span>
          <div>
            <strong>{todaySessions.length}</strong>
            <small>sessões hoje</small>
          </div>
        </div>

        <div className='diary-stat'>
          <span>🎯</span>
          <div>
            <strong>{accuracy}%</strong>
            <small>precisão geral</small>
          </div>
        </div>
      </div>

      <form onSubmit={saveDiary}>
        <PersonalData
          data={data}
          save={save}
          daily={diaryForm}
          sleepValue={diaryForm.sleep === '' ? 0 : Number(diaryForm.sleep)}
          energyValue={Number(diaryForm.energy) || 0}
          focusValue={Number(diaryForm.focus) || 0}
          productivityScore={(Number(diaryForm.productivity) || 0) * 20}
          bestHour={null}
          setMood={(mood) => {
            const moodValues = {
              'Muito mal': 1,
              Mal: 2,
              Neutro: 3,
              Bem: 4,
              'Muito bem': 5,
            };
            updateDiaryField('mood', moodValues[mood] || 3);
          }}
          setDailyMetric={(field, value) => {
            updateDiaryField(field, field === 'sleep' ? String(value) : value);
          }}
        />

        <div className='diary-card'>
          <div className='card-heading'>
            <div>
              <h2>🌱 Outros indicadores pessoais</h2>
              <p>Continue registrando estresse e motivação junto ao diário.</p>
            </div>
          </div>
          <div className='rating-grid'>
            <RatingInput
              label='Estresse'
              value={diaryForm.stress}
              onChange={(value) => updateDiaryField('stress', value)}
            />
            <RatingInput
              label='Motivação'
              value={diaryForm.motivation}
              onChange={(value) => updateDiaryField('motivation', value)}
            />
          </div>
        </div>

        <div className='diary-card'>
          <div className='card-heading'>
            <div>
              <h2>✍️ Registro do dia</h2>
              <p>
                Não precisa escrever muito. Registre o que realmente importa.
              </p>
            </div>
          </div>

          <div className='diary-fields'>
            <TextArea
              label='O que aconteceu hoje?'
              value={diaryForm.happened}
              onChange={(value) => updateDiaryField('happened', value)}
              placeholder='Conte os acontecimentos importantes...'
            />

            <TextArea
              label='O que fiz de importante?'
              value={diaryForm.important}
              onChange={(value) => updateDiaryField('important', value)}
              placeholder='Qual foi sua principal realização?'
            />

            <TextArea
              label='O que deu certo?'
              value={diaryForm.wentWell}
              onChange={(value) => updateDiaryField('wentWell', value)}
              placeholder='O que funcionou bem?'
            />

            <TextArea
              label='O que deu errado?'
              value={diaryForm.wentWrong}
              onChange={(value) => updateDiaryField('wentWrong', value)}
              placeholder='Onde você poderia ter feito melhor?'
            />

            <TextArea
              label='O que aprendi?'
              value={diaryForm.learned}
              onChange={(value) => updateDiaryField('learned', value)}
              placeholder='Uma ideia, conceito, comportamento ou aprendizado...'
            />

            <TextArea
              label='O que quero melhorar amanhã?'
              value={diaryForm.improveTomorrow}
              onChange={(value) => updateDiaryField('improveTomorrow', value)}
              placeholder='Escolha uma melhoria concreta...'
            />

            <TextArea
              label='Notas livres'
              value={diaryForm.notes}
              onChange={(value) => updateDiaryField('notes', value)}
              placeholder='Escreva qualquer outra coisa...'
            />
          </div>

          <button className='primary diary-save-button'>
            💾 {todayDiary ? 'Atualizar diário' : 'Salvar diário'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStudy = () => (
    <div className='diary-section'>
      <SectionHeader
        eyebrow='ESTUDOS'
        title='Registrar sessão'
        description='Transforme cada sessão em dados úteis para melhorar seu aprendizado.'
        icon='📚'
      />

      <form onSubmit={saveStudySession}>
        <div className='diary-card'>
          <div className='form-grid'>
            <Field
              label='Disciplina'
              value={studyForm.discipline}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  discipline: value,
                }))
              }
              placeholder='Ex.: Matemática Discreta'
            />

            <Field
              label='Conteúdo'
              value={studyForm.subject}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  subject: value,
                }))
              }
              placeholder='Ex.: Relações de equivalência'
            />

            <Field
              label='Tempo de estudo (min)'
              type='number'
              value={studyForm.minutes}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  minutes: value,
                }))
              }
              placeholder='50'
            />

            <div className='field'>
              <label>Método</label>

              <select
                value={studyForm.method}
                onChange={(event) =>
                  setStudyForm((prev) => ({
                    ...prev,
                    method: event.target.value,
                  }))
                }
              >
                {STUDY_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className='field'>
              <label>Dificuldade</label>

              <select
                value={studyForm.difficulty}
                onChange={(event) =>
                  setStudyForm((prev) => ({
                    ...prev,
                    difficulty: Number(event.target.value),
                  }))
                }
              >
                <option value='1'>1/5 — Muito fácil</option>
                <option value='2'>2/5 — Fácil</option>
                <option value='3'>3/5 — Média</option>
                <option value='4'>4/5 — Difícil</option>
                <option value='5'>5/5 — Muito difícil</option>
              </select>
            </div>

            <Field
              label='Número de questões'
              type='number'
              min='0'
              value={studyForm.exercises}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  exercises: value,
                }))
              }
              placeholder='12'
            />

            <Field
              label='Acertos'
              type='number'
              min='0'
              value={studyForm.correct}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  correct: value,
                }))
              }
              placeholder='9'
            />

            <Field
              label='Erros'
              type='number'
              min='0'
              value={studyForm.errors}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  errors: value,
                }))
              }
              placeholder='3'
            />
          </div>

          <div className='diary-fields'>
            <TextArea
              label='Observações'
              value={studyForm.observations}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  observations: value,
                }))
              }
              placeholder='Como foi a sessão?'
            />

            <TextArea
              label='O que aprendi?'
              value={studyForm.learned}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  learned: value,
                }))
              }
              placeholder='Explique o que você aprendeu com suas próprias palavras.'
            />

            <TextArea
              label='O que ainda não domino?'
              value={studyForm.notMastered}
              onChange={(value) =>
                setStudyForm((prev) => ({
                  ...prev,
                  notMastered: value,
                }))
              }
              placeholder='O que precisa ser revisado?'
            />
          </div>

          <button className='primary'>📚 Registrar sessão • +40 XP</button>
        </div>
      </form>

      <div className='diary-card'>
        <div className='card-heading'>
          <div>
            <h2>Últimas sessões</h2>
            <p>Seu histórico recente de estudos.</p>
          </div>
        </div>

        {studySessions.length === 0 ? (
          <EmptyState
            icon='📚'
            title='Nenhuma sessão registrada'
            text='Registre sua primeira sessão de estudo acima.'
          />
        ) : (
          <div className='session-list'>
            {studySessions.slice(0, 10).map((session) => (
              <div className='session-item' key={session.id}>
                <div className='session-date'>{formatDate(session.date)}</div>

                <div className='session-main'>
                  <strong>{session.subject}</strong>

                  <span>
                    {session.discipline} • {session.method}
                  </span>
                </div>

                <div className='session-result'>
                  <strong>{formatMinutes(session.minutes)}</strong>

                  {Number(session.exercises) > 0 && (
                    <span>
                      {session.correct}/{session.exercises} acertos
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className='diary-section'>
      <SectionHeader
        eyebrow='REVISÃO ESPAÇADA'
        title='Central de revisões'
        description='Revise no momento certo para transformar conhecimento em memória.'
        icon='🧠'
      />

      <div className='review-summary'>
        <div className='review-summary-card overdue'>
          <span>🔴</span>
          <strong>{overdueReviews.length}</strong>
          <small>Atrasadas</small>
        </div>

        <div className='review-summary-card today'>
          <span>🟡</span>
          <strong>{todayReviews.length}</strong>
          <small>Hoje</small>
        </div>

        <div className='review-summary-card future'>
          <span>🔵</span>
          <strong>{futureReviews.length}</strong>
          <small>Próximas</small>
        </div>

        <div className='review-summary-card'>
          <span>🧠</span>
          <strong>{masteredKnowledge.length}</strong>
          <small>Dominados</small>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className='diary-card'>
          <EmptyState
            icon='🧠'
            title='Nenhum conhecimento para revisar'
            text='Adicione conhecimentos na seção Conhecimentos.'
          />
        </div>
      ) : (
        <>
          {overdueReviews.length > 0 && (
            <ReviewGroup
              title='🔴 Revisões atrasadas'
              items={overdueReviews}
              reviewingId={reviewingId}
              setReviewingId={setReviewingId}
              onReview={reviewKnowledge}
            />
          )}

          {todayReviews.length > 0 && (
            <ReviewGroup
              title='🟡 Revisões de hoje'
              items={todayReviews}
              reviewingId={reviewingId}
              setReviewingId={setReviewingId}
              onReview={reviewKnowledge}
            />
          )}

          {futureReviews.length > 0 && (
            <ReviewGroup
              title='🔵 Próximas revisões'
              items={futureReviews.slice(0, 10)}
              reviewingId={reviewingId}
              setReviewingId={setReviewingId}
              onReview={reviewKnowledge}
            />
          )}
        </>
      )}
    </div>
  );

  const renderErrors = () => (
    <div className='diary-section'>
      <SectionHeader
        eyebrow='BANCO DE ERROS'
        title='Transforme erros em aprendizado'
        description='Registre por que errou para evitar repetir o mesmo padrão.'
        icon='❌'
      />

      <form onSubmit={saveError}>
        <div className='diary-card'>
          <div className='form-grid'>
            <Field
              label='Disciplina'
              value={errorForm.discipline}
              onChange={(value) =>
                setErrorForm((prev) => ({
                  ...prev,
                  discipline: value,
                }))
              }
              placeholder='Ex.: Matemática'
            />

            <Field
              label='Conteúdo'
              value={errorForm.subject}
              onChange={(value) =>
                setErrorForm((prev) => ({
                  ...prev,
                  subject: value,
                }))
              }
              placeholder='Ex.: Conjuntos'
            />

            <div className='field'>
              <label>Tipo do erro</label>

              <select
                value={errorForm.type}
                onChange={(event) =>
                  setErrorForm((prev) => ({
                    ...prev,
                    type: event.target.value,
                  }))
                }
              >
                {ERROR_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className='diary-fields'>
            <TextArea
              label='Questão'
              value={errorForm.question}
              onChange={(value) =>
                setErrorForm((prev) => ({
                  ...prev,
                  question: value,
                }))
              }
              placeholder='Cole ou descreva a questão...'
            />

            <TextArea
              label='Minha resposta'
              value={errorForm.myAnswer}
              onChange={(value) =>
                setErrorForm((prev) => ({
                  ...prev,
                  myAnswer: value,
                }))
              }
              placeholder='O que você respondeu?'
            />

            <TextArea
              label='Resposta correta'
              value={errorForm.correctAnswer}
              onChange={(value) =>
                setErrorForm((prev) => ({
                  ...prev,
                  correctAnswer: value,
                }))
              }
              placeholder='Qual era a resposta correta?'
            />

            <TextArea
              label='Por que eu errei?'
              value={errorForm.whyWrong}
              onChange={(value) =>
                setErrorForm((prev) => ({
                  ...prev,
                  whyWrong: value,
                }))
              }
              placeholder='Qual foi a verdadeira causa do erro?'
            />
          </div>

          <button className='primary'>❌ Registrar erro</button>
        </div>
      </form>

      {errors.length > 0 && (
        <div className='diary-card'>
          <div className='card-heading'>
            <div>
              <h2>Erros registrados</h2>
              <p>Use estes erros como material de revisão.</p>
            </div>
          </div>

          <div className='error-list'>
            {errors.map((item) => (
              <div
                className={`error-item ${item.resolved ? 'resolved' : ''}`}
                key={item.id}
              >
                <div className='error-top'>
                  <div>
                    <span className='error-type'>{item.type}</span>

                    {item.discipline && (
                      <span className='tag'>{item.discipline}</span>
                    )}

                    {item.subject && (
                      <span className='tag'>{item.subject}</span>
                    )}
                  </div>

                  <span>{formatDate(item.date)}</span>
                </div>

                <h3>{item.question}</h3>

                <div className='error-columns'>
                  <div>
                    <strong>Minha resposta</strong>
                    <p>{item.myAnswer || 'Não registrada.'}</p>
                  </div>

                  <div>
                    <strong>Resposta correta</strong>
                    <p>{item.correctAnswer}</p>
                  </div>
                </div>

                <div className='why-error'>
                  <strong>Por que errei?</strong>
                  <p>{item.whyWrong}</p>
                </div>

                <button
                  type='button'
                  className='ghost small-button'
                  onClick={() => markErrorResolved(item.id)}
                >
                  {item.resolved ? '↩ Reabrir erro' : '✓ Marcar como resolvido'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderKnowledge = () => (
    <div className='diary-section'>
      <SectionHeader
        eyebrow='CONHECIMENTOS'
        title='Construa sua base de conhecimento'
        description='Explique com suas próprias palavras. É assim que o conhecimento realmente fica.'
        icon='📖'
      />

      <form onSubmit={saveKnowledge}>
        <div className='diary-card'>
          <div className='form-grid'>
            <Field
              label='Título'
              value={knowledgeForm.title}
              onChange={(value) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  title: value,
                }))
              }
              placeholder='Ex.: Teorema de Pitágoras'
            />

            <Field
              label='Disciplina'
              value={knowledgeForm.discipline}
              onChange={(value) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  discipline: value,
                }))
              }
              placeholder='Ex.: Matemática'
            />

            <Field
              label='Tags'
              value={knowledgeForm.tags}
              onChange={(value) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  tags: value,
                }))
              }
              placeholder='geometria, triângulo, fórmula'
            />
          </div>

          <div className='diary-fields'>
            <TextArea
              label='Explique com suas palavras'
              value={knowledgeForm.explanation}
              onChange={(value) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  explanation: value,
                }))
              }
              placeholder='Imagine que está ensinando para alguém...'
            />

            <TextArea
              label='Exemplo'
              value={knowledgeForm.example}
              onChange={(value) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  example: value,
                }))
              }
              placeholder='Crie um exemplo prático.'
            />

            <TextArea
              label='Dúvida'
              value={knowledgeForm.doubt}
              onChange={(value) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  doubt: value,
                }))
              }
              placeholder='O que ainda não está completamente claro?'
            />
          </div>

          <label className='checkbox-row'>
            <input
              type='checkbox'
              checked={knowledgeForm.addToReview}
              onChange={(event) =>
                setKnowledgeForm((prev) => ({
                  ...prev,
                  addToReview: event.target.checked,
                }))
              }
            />

            <span>Adicionar automaticamente à revisão espaçada</span>
          </label>

          <button className='primary'>📖 Salvar conhecimento</button>
        </div>
      </form>

      <div className='diary-card'>
        <div className='card-heading'>
          <div>
            <h2>Minha base de conhecimento</h2>
            <p>{knowledgeItems.length} conhecimentos registrados.</p>
          </div>
        </div>

        {knowledgeItems.length === 0 ? (
          <EmptyState
            icon='📖'
            title='Sua base está vazia'
            text='Comece registrando aquilo que você acabou de aprender.'
          />
        ) : (
          <div className='knowledge-grid'>
            {knowledgeItems.map((item) => (
              <div className='knowledge-card' key={item.id}>
                <div className='knowledge-top'>
                  <span className='tag'>{item.discipline}</span>

                  <span
                    className={`mastery-badge ${getMasteryClass(item.mastery)}`}
                  >
                    {item.mastery || 0}%
                  </span>
                </div>

                <h3>{item.title}</h3>

                <p>{item.explanation}</p>

                {item.example && (
                  <div className='knowledge-example'>
                    <strong>Exemplo</strong>
                    <span>{item.example}</span>
                  </div>
                )}

                {item.doubt && (
                  <div className='knowledge-doubt'>
                    <strong>❓ Dúvida</strong>
                    <span>{item.doubt}</span>
                  </div>
                )}

                <div className='knowledge-footer'>
                  <span>{getMasteryLabel(item.mastery)}</span>

                  {item.nextReview && (
                    <span>Revisar {formatDate(item.nextReview)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className='diary-section'>
      <SectionHeader
        eyebrow='DESEMPENHO'
        title='Seu aprendizado em números'
        description='Veja o que está funcionando e onde você precisa melhorar.'
        icon='📊'
      />

      <div className='performance-grid'>
        <PerformanceCard
          icon='⏱️'
          value={formatMinutes(totalStudyHours)}
          label='Tempo total de estudo'
        />

        <PerformanceCard
          icon='📚'
          value={studySessions.length}
          label='Sessões'
        />

        <PerformanceCard icon='📝' value={totalQuestions} label='Questões' />

        <PerformanceCard icon='🎯' value={`${accuracy}%`} label='Precisão' />

        <PerformanceCard
          icon='🧠'
          value={masteredKnowledge.length}
          label='Conhecimentos dominados'
        />

        <PerformanceCard
          icon='❌'
          value={errors.length}
          label='Erros registrados'
        />
      </div>

      <div className='performance-two-columns'>
        <div className='diary-card'>
          <div className='card-heading'>
            <div>
              <h2>📚 Desempenho por disciplina</h2>
              <p>Onde você está colocando mais tempo e qual o resultado.</p>
            </div>
          </div>

          {disciplineStats.length === 0 ? (
            <EmptyState
              icon='📊'
              title='Sem dados suficientes'
              text='Registre algumas sessões de estudo para gerar análises.'
            />
          ) : (
            <div className='discipline-list'>
              {disciplineStats.map((item) => {
                const percentage = item.questions
                  ? Math.round((item.correct / item.questions) * 100)
                  : 0;

                return (
                  <div className='discipline-row' key={item.discipline}>
                    <div className='discipline-row-top'>
                      <strong>{item.discipline}</strong>

                      <span>{formatMinutes(item.minutes)}</span>
                    </div>

                    <div className='progress'>
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>
                      {percentage}% de acerto • {item.sessions} sessões •{' '}
                      {item.questions} questões
                    </small>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className='diary-card'>
          <div className='card-heading'>
            <div>
              <h2>❌ Tipos de erro</h2>
              <p>
                Descubra o padrão que mais está prejudicando seu desempenho.
              </p>
            </div>
          </div>

          {errorStats.length === 0 ? (
            <EmptyState
              icon='🎯'
              title='Nenhum erro registrado'
              text='Quando você registrar erros, eles aparecerão aqui.'
            />
          ) : (
            <div className='error-stat-list'>
              {errorStats.map((item) => {
                const max = errorStats[0]?.count || 1;
                const percentage = (item.count / max) * 100;

                return (
                  <div className='error-stat' key={item.type}>
                    <div>
                      <strong>{item.type}</strong>
                      <span>{item.count}</span>
                    </div>

                    <div className='progress'>
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className='diary-card'>
        <div className='card-heading'>
          <div>
            <h2>📈 Evolução da memória</h2>
            <p>Distribuição atual dos conhecimentos por nível de domínio.</p>
          </div>
        </div>

        <div className='mastery-bars'>
          {[
            ['Inicial', 0, 24],
            ['Baixo', 25, 49],
            ['Parcial', 50, 74],
            ['Bom', 75, 89],
            ['Dominado', 90, 100],
          ].map(([label, min, max]) => {
            const count = knowledgeItems.filter(
              (item) =>
                Number(item.mastery || 0) >= min &&
                Number(item.mastery || 0) <= max,
            ).length;

            const percentage = knowledgeItems.length
              ? (count / knowledgeItems.length) * 100
              : 0;

            return (
              <div className='mastery-bar-row' key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>

                <div className='progress'>
                  <span
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => {
    const timeline = [];

    diaryEntries.forEach((entry) => {
      timeline.push({
        id: `diary-${entry.id}`,
        date: entry.date,
        icon: '📖',
        title: 'Diário escrito',
        description: entry.important || entry.happened || 'Registro do dia.',
      });
    });

    studySessions.forEach((session) => {
      timeline.push({
        id: `study-${session.id}`,
        date: session.date,
        icon: '📚',
        title: `${formatMinutes(session.minutes)} de ${session.discipline}`,
        description: session.subject,
      });
    });

    knowledgeItems.forEach((item) => {
      if (item.lastReview) {
        timeline.push({
          id: `review-${item.id}-${item.lastReview}`,
          date: item.lastReview,
          icon: '🧠',
          title: `Revisão: ${item.title}`,
          description: `${item.mastery}% de domínio`,
        });
      }
    });

    timeline.sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const grouped = timeline.reduce((groups, item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }

      groups[item.date].push(item);

      return groups;
    }, {});

    return (
      <div className='diary-section'>
        <SectionHeader
          eyebrow='HISTÓRICO'
          title='Sua linha do tempo'
          description='Tudo o que você registrou no Diário ao longo dos dias.'
          icon='🗓️'
        />

        <div className='diary-card'>
          {timeline.length === 0 ? (
            <EmptyState
              icon='🗓️'
              title='Seu histórico está vazio'
              text='Comece registrando seu dia ou suas sessões de estudo.'
            />
          ) : (
            <div className='timeline'>
              {Object.entries(grouped).map(([date, items]) => (
                <div className='timeline-day' key={date}>
                  <div className='timeline-date'>{formatDate(date)}</div>

                  <div className='timeline-items'>
                    {items.map((item) => (
                      <div className='timeline-item' key={item.id}>
                        <div className='timeline-icon'>{item.icon}</div>

                        <div>
                          <strong>{item.title}</strong>

                          <p>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReflection = () => (
    <div className='diary-section'>
      <SectionHeader
        eyebrow='REFLEXÃO'
        title='Reflexão semanal'
        description='Pare, analise a semana e decida conscientemente o que fazer na próxima.'
        icon='🔎'
      />

      <form onSubmit={saveReflection}>
        <div className='diary-card'>
          <div className='reflection-intro'>
            <span>🧭</span>

            <div>
              <strong>Uma semana melhor começa com uma análise honesta.</strong>

              <p>
                Não tente justificar tudo. Procure padrões, decisões e ações que
                você pode mudar.
              </p>
            </div>
          </div>

          <div className='diary-fields'>
            <TextArea
              label='🏆 O que conquistei?'
              value={reflectionForm.accomplished}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  accomplished: value,
                }))
              }
              placeholder='Quais foram suas principais conquistas?'
            />

            <TextArea
              label='🧠 O que aprendi?'
              value={reflectionForm.learned}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  learned: value,
                }))
              }
              placeholder='Quais foram os principais aprendizados?'
            />

            <TextArea
              label='⚠️ Qual foi minha maior dificuldade?'
              value={reflectionForm.difficulty}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  difficulty: value,
                }))
              }
              placeholder='O que mais dificultou sua semana?'
            />

            <TextArea
              label='⏳ Onde perdi tempo?'
              value={reflectionForm.lostTime}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  lostTime: value,
                }))
              }
              placeholder='Onde você sente que desperdiçou tempo?'
            />

            <TextArea
              label='✅ O que devo continuar?'
              value={reflectionForm.continue}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  continue: value,
                }))
              }
              placeholder='O que funcionou e merece continuar?'
            />

            <TextArea
              label='🛑 O que devo parar?'
              value={reflectionForm.stop}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  stop: value,
                }))
              }
              placeholder='O que não está ajudando?'
            />

            <TextArea
              label='🎯 Qual será minha prioridade na próxima semana?'
              value={reflectionForm.priority}
              onChange={(value) =>
                setReflectionForm((prev) => ({
                  ...prev,
                  priority: value,
                }))
              }
              placeholder='Escolha uma prioridade clara.'
            />
          </div>

          <button className='primary'>🔎 Salvar reflexão</button>
        </div>
      </form>

      {weeklyReflections.length > 0 && (
        <div className='diary-card'>
          <div className='card-heading'>
            <div>
              <h2>Reflexões anteriores</h2>
              <p>Veja como suas prioridades mudaram ao longo do tempo.</p>
            </div>
          </div>

          <div className='reflection-list'>
            {weeklyReflections.slice(0, 10).map((reflection) => (
              <div className='reflection-item' key={reflection.id}>
                <div className='reflection-date'>
                  Semana de {formatDate(reflection.weekStart)}
                </div>

                <h3>{reflection.priority || 'Sem prioridade registrada'}</h3>

                <p>
                  {reflection.accomplished || 'Nenhuma conquista registrada.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case 'today':
        return renderToday();

      case 'study':
        return renderStudy();

      case 'reviews':
        return renderReviews();

      case 'errors':
        return renderErrors();

      case 'knowledge':
        return renderKnowledge();

      case 'performance':
        return renderPerformance();

      case 'history':
        return renderHistory();

      case 'reflection':
        return renderReflection();

      default:
        return renderToday();
    }
  };

  return (
    <div className='diary-page'>
      <style>{`
        .diary-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          color: var(--text-color, #111827);
        }

        .diary-navigation {
          display: flex;
          gap: 8px;
          padding: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          border-radius: 16px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          scrollbar-width: thin;
        }

        .diary-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 165px;
          padding: 12px 14px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-align: left;
          transition: 0.2s ease;
          flex-shrink: 0;
        }

        .diary-menu-item:hover {
          background: rgba(100, 100, 100, 0.08);
        }

        .diary-menu-item.active {
          background: var(--primary, #2563eb);
          color: white;
        }

        .diary-menu-icon {
          font-size: 21px;
          flex-shrink: 0;
        }

        .diary-menu-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .diary-menu-content strong {
          font-size: 14px;
          white-space: nowrap;
        }

        .diary-menu-content small {
          font-size: 11px;
          opacity: 0.68;
          white-space: nowrap;
        }

        .diary-menu-item.active small {
          opacity: 0.85;
        }

        .diary-section {
          animation: diaryFade 0.2s ease;
        }

        @keyframes diaryFade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .diary-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px;
          margin-bottom: 18px;
          border-radius: 20px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .eyebrow {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          opacity: 0.6;
        }

        .diary-hero h1 {
          margin: 0 0 5px;
          font-size: clamp(26px, 4vw, 38px);
        }

        .diary-hero p {
          margin: 0;
          opacity: 0.65;
          text-transform: capitalize;
        }

        .today-badge {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: rgba(37, 99, 235, 0.1);
          font-size: 34px;
        }

        .diary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .diary-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          border-radius: 16px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .diary-stat > span {
          font-size: 25px;
        }

        .diary-stat div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .diary-stat strong {
          font-size: 20px;
        }

        .diary-stat small {
          opacity: 0.6;
        }

        .diary-card {
          padding: 22px;
          margin-bottom: 18px;
          border-radius: 18px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .card-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-heading h2 {
          margin: 0 0 5px;
          font-size: 20px;
        }

        .card-heading p {
          margin: 0;
          opacity: 0.62;
          font-size: 13px;
        }

        .rating-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .rating-input {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rating-input label {
          font-size: 13px;
          font-weight: 700;
        }

        .rating-buttons {
          display: flex;
          gap: 5px;
        }

        .rating-button {
          flex: 1;
          height: 36px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-weight: 700;
        }

        .rating-button:hover {
          background: rgba(100, 100, 100, 0.07);
        }

        .rating-button.selected {
          background: var(--primary, #2563eb);
          color: white;
          border-color: var(--primary, #2563eb);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field label,
        .diary-fields label {
          font-size: 13px;
          font-weight: 700;
        }

        .field input,
        .field select,
        .diary-fields textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 10px;
          background: var(--input-bg, transparent);
          color: inherit;
          outline: none;
          font: inherit;
        }

        .field input:focus,
        .field select:focus,
        .diary-fields textarea:focus {
          border-color: var(--primary, #2563eb);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .diary-fields {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .diary-fields > div:last-child:nth-child(odd) {
          grid-column: 1 / -1;
        }

        .diary-fields textarea {
          min-height: 105px;
          resize: vertical;
        }

        .primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 18px;
          border: none;
          border-radius: 10px;
          background: var(--primary, #2563eb);
          color: white;
          cursor: pointer;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .primary:hover {
          transform: translateY(-1px);
          filter: brightness(0.95);
        }

        .ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px 13px;
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 9px;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .small-button {
          font-size: 12px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          cursor: pointer;
        }

        .checkbox-row input {
          width: 16px;
          height: 16px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 22px;
        }

        .section-header-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: rgba(37, 99, 235, 0.1);
          font-size: 25px;
        }

        .section-header h1 {
          margin: 0 0 4px;
          font-size: 28px;
        }

        .section-header p {
          margin: 0;
          opacity: 0.62;
          font-size: 13px;
        }

        .review-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .review-summary-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 125px;
          padding: 18px;
          border-radius: 16px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          text-align: center;
        }

        .review-summary-card span {
          font-size: 23px;
        }

        .review-summary-card strong {
          margin-top: 5px;
          font-size: 28px;
        }

        .review-summary-card small {
          opacity: 0.62;
        }

        .review-group {
          margin-bottom: 20px;
        }

        .review-group h2 {
          margin: 0 0 12px;
          font-size: 18px;
        }

        .review-list {
          display: grid;
          gap: 12px;
        }

        .review-card {
          padding: 18px;
          border-radius: 15px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .review-card-top {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 10px;
        }

        .review-card h3 {
          margin: 0 0 4px;
          font-size: 17px;
        }

        .review-card p {
          margin: 0;
          font-size: 13px;
          opacity: 0.7;
        }

        .review-meta {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .tag,
        .error-type {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(100, 100, 100, 0.09);
          font-size: 11px;
          font-weight: 700;
        }

        .mastery {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .mastery-track {
          flex: 1;
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(100, 100, 100, 0.12);
        }

        .mastery-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--primary, #2563eb);
        }

        .review-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .review-action {
          padding: 8px 10px;
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 9px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 12px;
        }

        .review-action:hover {
          background: rgba(100, 100, 100, 0.07);
        }

        .session-list {
          display: grid;
          gap: 8px;
        }

        .session-item {
          display: grid;
          grid-template-columns: 85px 1fr auto;
          align-items: center;
          gap: 15px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(100, 100, 100, 0.045);
        }

        .session-date {
          font-size: 12px;
          opacity: 0.6;
        }

        .session-main {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .session-main span,
        .session-result span {
          font-size: 12px;
          opacity: 0.6;
        }

        .session-result {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .error-list {
          display: grid;
          gap: 13px;
        }

        .error-item {
          padding: 18px;
          border-radius: 14px;
          background: rgba(100, 100, 100, 0.045);
          border-left: 4px solid var(--primary, #2563eb);
        }

        .error-item.resolved {
          opacity: 0.58;
        }

        .error-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 11px;
          opacity: 0.65;
        }

        .error-top > div {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .error-item h3 {
          margin: 0 0 15px;
          font-size: 16px;
        }

        .error-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .error-columns > div,
        .why-error {
          padding: 13px;
          border-radius: 10px;
          background: var(--card-bg, #fff);
        }

        .error-columns strong,
        .why-error strong {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .error-columns p,
        .why-error p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .why-error {
          margin-bottom: 12px;
        }

        .knowledge-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .knowledge-card {
          padding: 18px;
          border-radius: 15px;
          background: rgba(100, 100, 100, 0.045);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .knowledge-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .knowledge-card h3 {
          margin: 12px 0 8px;
          font-size: 18px;
        }

        .knowledge-card > p {
          margin: 0 0 13px;
          font-size: 13px;
          line-height: 1.6;
          opacity: 0.8;
        }

        .mastery-badge {
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .mastery-badge.good {
          background: rgba(34, 197, 94, 0.12);
        }

        .mastery-badge.medium {
          background: rgba(234, 179, 8, 0.12);
        }

        .mastery-badge.low {
          background: rgba(239, 68, 68, 0.12);
        }

        .knowledge-example,
        .knowledge-doubt {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 11px;
          margin-top: 8px;
          border-radius: 9px;
          background: var(--card-bg, #fff);
          font-size: 12px;
        }

        .knowledge-doubt {
          background: rgba(234, 179, 8, 0.08);
        }

        .knowledge-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          font-size: 11px;
          opacity: 0.65;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .performance-card {
          padding: 18px;
          border-radius: 15px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .performance-card-icon {
          font-size: 21px;
        }

        .performance-card strong {
          display: block;
          margin-top: 7px;
          font-size: 22px;
        }

        .performance-card span {
          font-size: 11px;
          opacity: 0.62;
        }

        .performance-two-columns {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 18px;
        }

        .discipline-list,
        .error-stat-list {
          display: grid;
          gap: 17px;
        }

        .discipline-row-top,
        .error-stat > div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
          font-size: 13px;
        }

        .progress {
          width: 100%;
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(100, 100, 100, 0.12);
        }

        .progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--primary, #2563eb);
        }

        .discipline-row small {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          opacity: 0.58;
        }

        .mastery-bars {
          display: grid;
          gap: 15px;
        }

        .mastery-bar-row > div:first-child {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
          font-size: 13px;
        }

        .timeline {
          position: relative;
        }

        .timeline-day {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }

        .timeline-date {
          padding-top: 8px;
          font-weight: 800;
          font-size: 13px;
        }

        .timeline-items {
          position: relative;
          display: grid;
          gap: 9px;
        }

        .timeline-items::before {
          content: '';
          position: absolute;
          left: 17px;
          top: 20px;
          bottom: 20px;
          width: 1px;
          background: var(--border-color, #e5e7eb);
        }

        .timeline-item {
          position: relative;
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 11px;
          background: rgba(100, 100, 100, 0.045);
        }

        .timeline-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--card-bg, #fff);
          z-index: 1;
        }

        .timeline-item strong {
          font-size: 13px;
        }

        .timeline-item p {
          margin: 4px 0 0;
          font-size: 12px;
          opacity: 0.62;
        }

        .reflection-intro {
          display: flex;
          gap: 13px;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 12px;
          background: rgba(37, 99, 235, 0.07);
        }

        .reflection-intro > span {
          font-size: 24px;
        }

        .reflection-intro strong {
          display: block;
          margin-bottom: 4px;
        }

        .reflection-intro p {
          margin: 0;
          font-size: 12px;
          opacity: 0.65;
          line-height: 1.5;
        }

        .reflection-list {
          display: grid;
          gap: 10px;
        }

        .reflection-item {
          padding: 15px;
          border-radius: 12px;
          background: rgba(100, 100, 100, 0.045);
        }

        .reflection-date {
          margin-bottom: 5px;
          font-size: 11px;
          opacity: 0.55;
        }

        .reflection-item h3 {
          margin: 0 0 5px;
          font-size: 15px;
        }

        .reflection-item p {
          margin: 0;
          font-size: 12px;
          opacity: 0.7;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-state-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .empty-state h3 {
          margin: 0 0 5px;
          font-size: 17px;
        }

        .empty-state p {
          max-width: 450px;
          margin: 0;
          font-size: 13px;
          opacity: 0.6;
        }

        .diary-toast {
          position: fixed;
          right: 25px;
          bottom: 25px;
          z-index: 9999;
          padding: 13px 17px;
          border-radius: 11px;
          background: var(--card-bg, #111827);
          color: var(--text-color, #fff);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
          font-size: 13px;
          font-weight: 700;
          animation: diaryToast 0.2s ease;
        }

        @keyframes diaryToast {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1100px) {
          .diary-stats,
          .review-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .performance-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .rating-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 850px) {
          .form-grid,
          .diary-fields,
          .knowledge-grid,
          .performance-two-columns,
          .error-columns {
            grid-template-columns: 1fr;
          }

          .diary-fields > div:last-child:nth-child(odd) {
            grid-column: auto;
          }

          .timeline-day {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .timeline-date {
            padding-top: 0;
          }
        }

        @media (max-width: 650px) {
          .diary-page {
            padding: 12px;
          }

          .diary-stats,
          .review-summary,
          .performance-grid,
          .rating-grid {
            grid-template-columns: 1fr;
          }

          .diary-hero {
            padding: 20px;
          }

          .today-badge {
            width: 55px;
            height: 55px;
          }

          .session-item {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .session-result {
            align-items: flex-start;
          }

          .diary-navigation {
            margin-right: -12px;
            margin-left: -12px;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }
      `}</style>

      <nav className='diary-navigation'>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type='button'
            className={`diary-menu-item ${section === item.id ? 'active' : ''}`}
            onClick={() => setSection(item.id)}
          >
            <span className='diary-menu-icon'>{item.icon}</span>

            <span className='diary-menu-content'>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </button>
        ))}
      </nav>

      {renderSection()}

      {message && <div className='diary-toast'>{message}</div>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, icon }) {
  return (
    <div className='section-header'>
      <div className='section-header-icon'>{icon}</div>

      <div>
        <span className='eyebrow'>{eyebrow}</span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </div>
  );
}

function RatingInput({ label, value, onChange }) {
  return (
    <div className='rating-input'>
      <label>{label}</label>

      <div className='rating-buttons'>
        {[1, 2, 3, 4, 5].map((number) => (
          <button
            type='button'
            key={number}
            className={`rating-button ${value === number ? 'selected' : ''}`}
            onClick={() => onChange(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', min }) {
  return (
    <div className='field'>
      <label>{label}</label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label>{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function PerformanceCard({ icon, value, label }) {
  return (
    <div className='performance-card'>
      <div className='performance-card-icon'>{icon}</div>

      <strong>{value}</strong>

      <span>{label}</span>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className='empty-state'>
      <div className='empty-state-icon'>{icon}</div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  );
}

function ReviewGroup({ title, items, reviewingId, setReviewingId, onReview }) {
  return (
    <div className='review-group'>
      <h2>{title}</h2>

      <div className='review-list'>
        {items.map((item) => (
          <div className='review-card' key={item.id}>
            <div className='review-card-top'>
              <div>
                <h3>{item.title}</h3>

                <p>
                  {item.discipline}
                  {item.lastReview
                    ? ` • Última revisão ${formatDate(item.lastReview)}`
                    : ''}
                </p>
              </div>

              <span
                className={`mastery-badge ${getMasteryClass(item.mastery)}`}
              >
                {item.mastery || 0}%
              </span>
            </div>

            <div className='review-meta'>
              <span className='tag'>{getMasteryLabel(item.mastery)}</span>

              {item.tags?.map((tag) => (
                <span className='tag' key={tag}>
                  #{tag}
                </span>
              ))}
            </div>

            <div className='mastery'>
              <div className='mastery-track'>
                <span
                  style={{
                    width: `${item.mastery || 0}%`,
                  }}
                />
              </div>

              <strong>{item.mastery || 0}%</strong>
            </div>

            {reviewingId === item.id ? (
              <div className='review-actions'>
                {REVIEW_LEVELS.map((level) => (
                  <button
                    type='button'
                    key={level.key}
                    className='review-action'
                    onClick={() => onReview(item.id, level.key)}
                  >
                    {level.emoji} {level.label}
                  </button>
                ))}

                <button
                  type='button'
                  className='ghost small-button'
                  onClick={() => setReviewingId(null)}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type='button'
                className='primary'
                onClick={() => setReviewingId(item.id)}
              >
                🧠 Fazer revisão
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
