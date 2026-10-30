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

const initialSession = { discipline: '', subject: '', minutes: 30, method: 'Exercícios', difficulty: 3, exercises: 0, correct: 0, learned: '', notMastered: '', observations: '' };
const initialReading = { title: '', author: '', type: 'book', status: 'planned', progress: 0, totalPages: '', currentPage: 0, notes: '' };
const initialReview = { title: '', discipline: '', content: '', example: '', tags: '' };
const initialError = { question: '', myAnswer: '', correctAnswer: '', whyWrong: '', type: 'Falta de conhecimento', discipline: '', subject: '' };

function dateLabel(value) {
  if (!value) return '-';
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
}

export default function Estudos({ appData = {}, saveAppData }) {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState({ sessions: [], readings: [], reviews: [], errors: [] });
  const [session, setSession] = useState(initialSession);
  const [reading, setReading] = useState(initialReading);
  const [review, setReview] = useState(initialReview);
  const [studyError, setStudyError] = useState(initialError);

  async function load() {
    setLoading(true); setError('');
    try { setData(await getStudyDashboard()); } catch (e) { setError(e.message || 'Não foi possível carregar seus estudos.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayMinutes = useMemo(() => data.sessions.filter(s => String(s.study_date).slice(0,10) === today).reduce((n,s) => n + Number(s.minutes || 0), 0), [data.sessions, today]);
  const totalMinutes = useMemo(() => data.sessions.reduce((n,s) => n + Number(s.minutes || 0), 0), [data.sessions]);
  const accuracy = useMemo(() => {
    const q = data.sessions.reduce((n,s) => n + Number(s.exercises || 0), 0);
    const c = data.sessions.reduce((n,s) => n + Number(s.correct || 0), 0);
    return q ? Math.round(c / q * 100) : 0;
  }, [data.sessions]);
  const safeReviews = Array.isArray(data.reviews) ? data.reviews.filter(r => r && typeof r === 'object') : [];
  const dueReviews = safeReviews.filter(r => r.next_review && String(r.next_review).slice(0,10) <= today);
  const activeReadings = data.readings.filter(r => r.status === 'reading');
  // Dados antigos que eram registrados dentro do Diário. Permanecem acessíveis
  // aqui para não perder o histórico após separar os módulos.
  const legacySessions = Array.isArray(appData.studySessions) ? appData.studySessions : [];
  const legacyKnowledge = Array.isArray(appData.knowledgeItems) ? appData.knowledgeItems : [];
  const legacyErrors = Array.isArray(appData.errors) ? appData.errors : [];
  const legacyStudyMinutes = legacySessions.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const legacyQuestions = legacySessions.reduce((sum, item) => sum + Number(item.exercises || 0), 0);
  const legacyCorrect = legacySessions.reduce((sum, item) => sum + Number(item.correct || 0), 0);
  const legacyAccuracy = legacyQuestions ? Math.round(legacyCorrect / legacyQuestions * 100) : 0;

  function reviewLegacyKnowledge(item, ratingKey) {
    if (!saveAppData) return;
    const levels = {
      forgot: { mastery: 20, days: 1 },
      little: { mastery: 40, days: 2 },
      partial: { mastery: 60, days: 4 },
      well: { mastery: 80, days: 7 },
      master: { mastery: 95, days: Number(item.reviewInterval || 0) < 14 ? 14 : Number(item.reviewInterval || 0) < 30 ? 30 : 60 },
    };
    const selected = levels[ratingKey];
    if (!selected) return;
    const nextDate = new Date(`${today}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + selected.days);
    const nextReview = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,'0')}-${String(nextDate.getDate()).padStart(2,'0')}`;
    const updated = {
      ...item,
      mastery: selected.mastery,
      lastReview: today,
      nextReview,
      reviewInterval: selected.days,
      reviewCount: Number(item.reviewCount || 0) + 1,
      reviewHistory: [...(item.reviewHistory || []), { date: today, rating: ratingKey, mastery: selected.mastery, nextReview }],
    };
    saveAppData({
      ...appData,
      knowledgeItems: legacyKnowledge.map(entry => entry.id === item.id ? updated : entry),
      xp: Number(appData.xp || 0) + 15,
    });
    flash(`Revisão salva. Próxima: ${dateLabel(nextReview)}.`);
  }

  function toggleLegacyError(item) {
    if (!saveAppData) return;
    saveAppData({
      ...appData,
      errors: legacyErrors.map(entry => entry.id === item.id
        ? { ...entry, resolved: !entry.resolved, resolvedAt: !entry.resolved ? new Date().toISOString() : null }
        : entry),
    });
  }



  function flash(text) { setMessage(text); setTimeout(() => setMessage(''), 3000); }
  async function submitSession(e) {
    e.preventDefault();
    try {
      const created = await createStudySession(session);
      setData(d => ({ ...d, sessions: [created, ...d.sessions] }));
      setSession(initialSession); flash('Sessão de estudo registrada.');
    } catch (e) { setError(e.message); }
  }
  async function submitReading(e) {
    e.preventDefault();
    try {
      const created = await createReading({ ...reading, totalPages: reading.totalPages ? Number(reading.totalPages) : null });
      setData(d => ({ ...d, readings: [created, ...d.readings] }));
      setReading(initialReading); flash('Leitura adicionada.');
    } catch (e) { setError(e.message); }
  }
  async function changeReading(item, patch) {
    try {
      const updated = await updateReading(item.id, patch);
      setData(d => ({ ...d, readings: d.readings.map(r => r.id === item.id ? updated : r) }));
    } catch (e) { setError(e.message); }
  }
  async function submitReview(e) {
    e.preventDefault();
    try {
      const created = await createReview({ ...review, tags: review.tags });
      setData(d => ({ ...d, reviews: [created, ...d.reviews] }));
      setReview(initialReview); flash('Conteúdo colocado na revisão espaçada.');
    } catch (e) { setError(e.message); }
  }
  async function doReview(item, rating) {
    try {
      const updated = await reviewStudyItem(item.id, rating);
      setData(d => ({ ...d, reviews: d.reviews.map(r => r.id === item.id ? updated : r) }));
      flash(`Revisão registrada. Próxima revisão: ${dateLabel(updated.next_review)}.`);
    } catch (e) { setError(e.message); }
  }
  async function submitError(e) {
    e.preventDefault();
    try {
      const created = await createStudyError(studyError);
      setData(d => ({ ...d, errors: [created, ...d.errors] }));
      setStudyError(initialError); flash('Erro adicionado ao banco de erros.');
    } catch (e) { setError(e.message); }
  }
  async function resolveError(item) {
    try {
      const updated = await toggleStudyError(item.id);
      setData(d => ({ ...d, errors: d.errors.map(x => x.id === item.id ? updated : x) }));
    } catch (e) { setError(e.message); }
  }

  if (loading) return <section className='card' style={{ margin: 24 }}><h2>📚 Estudos</h2><p>Carregando seus estudos...</p></section>;

  return (
    <section className='diary-page'>
      <div className='diary-hero'>
        <div><span className='eyebrow'>ESTUDOS</span><h1>📚 Estudos & Leitura</h1><p>Registre sessões, acompanhe leituras e revise conhecimentos no momento certo.</p></div>
        <div className='today-badge'>🧠</div>
      </div>
      {message && <div className='success-message'>{message}</div>}
      {error && <div className='auth-error' role='alert'>{error}<button className='ghost' onClick={() => setError('')}>Fechar</button></div>}

      <div className='diary-navigation'>{TABS.map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>

      {tab === 'overview' && <>
        <div className='diary-stats'>
          <div className='diary-stat'><span>⏱️</span><div><strong>{todayMinutes}min</strong><small>estudados hoje</small></div></div>
          <div className='diary-stat'><span>📚</span><div><strong>{Math.round(totalMinutes / 60 * 10) / 10}h</strong><small>tempo total</small></div></div>
          <div className='diary-stat'><span>🎯</span><div><strong>{accuracy}%</strong><small>acerto nos exercícios</small></div></div>
          <div className='diary-stat'><span>🧠</span><div><strong>{dueReviews.length}</strong><small>revisões para hoje</small></div></div>
        </div>
        <div className='card'><h3>🗓️ Próximas ações</h3><ul><li>{dueReviews.length ? `Faça ${dueReviews.length} revisão(ões) pendente(s).` : 'Nenhuma revisão atrasada ou para hoje.'}</li><li>{activeReadings.length ? `Você tem ${activeReadings.length} leitura(s) em andamento.` : 'Adicione uma leitura em andamento.'}</li><li>Registre cada sessão com o que aprendeu e o que ainda não domina.</li></ul></div>
        <div className='card'><h3>📈 Últimas sessões</h3>{data.sessions.slice(0,6).map(s => <div className='foguinho-row' key={s.id}><div><strong>{s.discipline} — {s.subject}</strong><small>{dateLabel(s.study_date)} · {s.minutes}min · {s.method}</small></div><strong>{s.exercises ? Math.round(s.correct / s.exercises * 100) : 0}%</strong></div>)}</div>
      </>}

      {tab === 'sessions' && <div className='card'><h3>⏱️ Registrar sessão de estudo</h3><form onSubmit={submitSession} className='form-grid'>
        <label>Disciplina<input required value={session.discipline} onChange={e => setSession({...session,discipline:e.target.value})} placeholder='Ex.: Matemática' /></label>
        <label>Conteúdo<input required value={session.subject} onChange={e => setSession({...session,subject:e.target.value})} placeholder='Ex.: Matemática Discreta' /></label>
        <label>Minutos<input type='number' min='1' value={session.minutes} onChange={e => setSession({...session,minutes:e.target.value})} /></label>
        <label>Método<select value={session.method} onChange={e => setSession({...session,method:e.target.value})}><option>Exercícios</option><option>Teoria</option><option>Videoaula</option><option>Leitura</option><option>Resumo</option><option>Flashcards</option><option>Projeto</option><option>Simulado</option></select></label>
        <label>Dificuldade<input type='number' min='1' max='5' value={session.difficulty} onChange={e => setSession({...session,difficulty:e.target.value})} /></label>
        <label>Questões<input type='number' min='0' value={session.exercises} onChange={e => setSession({...session,exercises:e.target.value})} /></label>
        <label>Acertos<input type='number' min='0' value={session.correct} onChange={e => setSession({...session,correct:e.target.value})} /></label>
        <label>Aprendi<textarea value={session.learned} onChange={e => setSession({...session,learned:e.target.value})} /></label>
        <label>Ainda não domino<textarea value={session.notMastered} onChange={e => setSession({...session,notMastered:e.target.value})} /></label>
        <label>Observações<textarea value={session.observations} onChange={e => setSession({...session,observations:e.target.value})} /></label>
        <div><button type='submit'>Salvar sessão</button></div>
      </form></div>}

      {tab === 'reading' && <>
        <div className='card'><h3>📖 Adicionar leitura</h3><form onSubmit={submitReading} className='form-grid'>
          <label>Título<input required value={reading.title} onChange={e => setReading({...reading,title:e.target.value})} /></label>
          <label>Autor / fonte<input value={reading.author} onChange={e => setReading({...reading,author:e.target.value})} /></label>
          <label>Tipo<select value={reading.type} onChange={e => setReading({...reading,type:e.target.value})}><option value='book'>Livro</option><option value='article'>Artigo</option><option value='paper'>Paper</option><option value='course'>Curso</option><option value='other'>Outro</option></select></label>
          <label>Total de páginas<input type='number' min='0' value={reading.totalPages} onChange={e => setReading({...reading,totalPages:e.target.value})} /></label>
          <label>Progresso (%)<input type='number' min='0' max='100' value={reading.progress} onChange={e => setReading({...reading,progress:e.target.value})} /></label>
          <label>Página atual<input type='number' min='0' value={reading.currentPage} onChange={e => setReading({...reading,currentPage:e.target.value})} /></label>
          <label>Status<select value={reading.status} onChange={e => setReading({...reading,status:e.target.value})}><option value='planned'>Planejada</option><option value='reading'>Lendo</option><option value='paused'>Pausada</option><option value='completed'>Concluída</option></select></label>
          <label>Notas<textarea value={reading.notes} onChange={e => setReading({...reading,notes:e.target.value})} /></label>
          <div><button type='submit'>Adicionar leitura</button></div>
        </form></div>
        <div className='card'><h3>📚 Minha biblioteca</h3>{data.readings.length === 0 ? <p>Nenhuma leitura cadastrada.</p> : data.readings.map(r => <div className='foguinho-row' key={r.id}><div><strong>{r.title}</strong><small>{r.author || 'Sem autor'} · {r.progress}% · {r.status}</small></div><div className='connection-actions'><button onClick={() => changeReading(r,{progress:Math.min(100,Number(r.progress)+10),status:Number(r.progress)+10>=100?'completed':'reading'})}>+10%</button><select value={r.status} onChange={e => changeReading(r,{status:e.target.value})}><option value='planned'>Planejada</option><option value='reading'>Lendo</option><option value='paused'>Pausada</option><option value='completed'>Concluída</option></select></div></div>)}</div>
      </>}

      {tab === 'reviews' && <>
        <div className='card'><h3>🧠 Criar conhecimento para revisão</h3><form onSubmit={submitReview} className='form-grid'>
          <label>Título<input required value={review.title} onChange={e => setReview({...review,title:e.target.value})} /></label>
          <label>Disciplina<input required value={review.discipline} onChange={e => setReview({...review,discipline:e.target.value})} /></label>
          <label className='full'>Conteúdo / resposta<input required value={review.content} onChange={e => setReview({...review,content:e.target.value})} /></label>
          <label>Exemplo<textarea value={review.example} onChange={e => setReview({...review,example:e.target.value})} /></label>
          <label>Tags<input value={review.tags} onChange={e => setReview({...review,tags:e.target.value})} placeholder='java, lógica, prova' /></label>
          <div><button type='submit'>Criar revisão</button></div>
        </form></div>
        <div className='card'><h3>📅 Fila de revisão</h3>{safeReviews.length === 0 ? <p>Nenhum conhecimento cadastrado.</p> : safeReviews.map(r => <article key={r.id} className='foguinho-card'><div className='foguinho-card-top'><span>{r.discipline}</span><span>{r.mastery}% domínio</span></div><h3>{r.title}</h3><p>{r.content}</p><small>Próxima: {dateLabel(r.next_review)} · {r.review_count} revisão(ões)</small><div className='connection-actions' style={{marginTop:10}}>{RATINGS.map(([key,label]) => <button key={key} className={String(r.next_review).slice(0,10) <= today ? '' : 'ghost'} onClick={() => doReview(r,key)}>{label}</button>)}</div></article>)}</div>
      </>}

      {tab === 'errors' && <>
        <div className='card'><h3>❌ Registrar erro</h3><form onSubmit={submitError} className='form-grid'>
          <label className='full'>Questão<input required value={studyError.question} onChange={e => setStudyError({...studyError,question:e.target.value})} /></label>
          <label>Minha resposta<textarea value={studyError.myAnswer} onChange={e => setStudyError({...studyError,myAnswer:e.target.value})} /></label>
          <label>Resposta correta<textarea required value={studyError.correctAnswer} onChange={e => setStudyError({...studyError,correctAnswer:e.target.value})} /></label>
          <label>Por que errei?<textarea required value={studyError.whyWrong} onChange={e => setStudyError({...studyError,whyWrong:e.target.value})} /></label>
          <label>Tipo<select value={studyError.type} onChange={e => setStudyError({...studyError,type:e.target.value})}><option>Falta de conhecimento</option><option>Desatenção</option><option>Interpretação</option><option>Pressa</option><option>Cálculo</option><option>Não conhecia o conteúdo</option></select></label>
          <label>Disciplina<input value={studyError.discipline} onChange={e => setStudyError({...studyError,discipline:e.target.value})} /></label>
          <label>Assunto<input value={studyError.subject} onChange={e => setStudyError({...studyError,subject:e.target.value})} /></label>
          <div><button type='submit'>Salvar erro</button></div>
        </form></div>
        <div className='card'><h3>🗂️ Banco de erros</h3>{data.errors.length === 0 ? <p>Nenhum erro registrado.</p> : data.errors.map(e => <div className='foguinho-row' key={e.id}><div><strong>{e.question}</strong><small>{e.discipline || 'Sem disciplina'} · {e.type} · {e.resolved ? 'Resolvido' : 'Pendente'}</small><p>{e.why_wrong}</p></div><button onClick={() => resolveError(e)}>{e.resolved ? '↩️ Reabrir' : '✅ Resolvi'}</button></div>)}</div>
      </>}

      {tab === 'archive' && <>
        <div className='diary-stats'>
          <div className='diary-stat'><span>⏱️</span><div><strong>{legacySessions.length}</strong><small>sessões antigas</small></div></div>
          <div className='diary-stat'><span>📚</span><div><strong>{Math.round(legacyStudyMinutes / 60 * 10) / 10}h</strong><small>tempo registrado</small></div></div>
          <div className='diary-stat'><span>🧠</span><div><strong>{legacyKnowledge.length}</strong><small>conhecimentos salvos</small></div></div>
          <div className='diary-stat'><span>❌</span><div><strong>{legacyErrors.length}</strong><small>erros registrados</small></div></div>
          <div className='diary-stat'><span>🎯</span><div><strong>{legacyAccuracy}%</strong><small>acerto no histórico antigo</small></div></div>
        </div>
        <div className='card'>
          <h3>📚 Histórico de sessões do antigo Diário</h3>
          {legacySessions.length === 0 ? <p>Nenhuma sessão antiga encontrada.</p> : [...legacySessions].sort((a,b) => String(b.date).localeCompare(String(a.date))).map(item => (
            <article className='foguinho-row' key={item.id}>
              <div><strong>{item.discipline} — {item.subject}</strong>
                <small>{dateLabel(item.date)} · {item.minutes} min · {item.method || 'Sem método'}</small>
                {item.learned && <p>Aprendi: {item.learned}</p>}
                {item.notMastered && <p>A revisar: {item.notMastered}</p>}
              </div>
              <strong>{item.exercises ? Math.round(Number(item.correct || 0) / Number(item.exercises) * 100) : '—'}{item.exercises ? '%' : ''}</strong>
            </article>
          ))}
        </div>
        <div className='card'>
          <h3>🧠 Conhecimentos salvos no antigo Diário</h3>
          {legacyKnowledge.length === 0 ? <p>Nenhum conhecimento antigo encontrado.</p> : legacyKnowledge.map(item => (
            <article className='foguinho-card' key={item.id}>
              <div className='foguinho-card-top'><span>{item.discipline || 'Sem disciplina'}</span><span>{item.mastery || 0}% domínio</span></div>
              <h3>{item.title}</h3><p>{item.explanation}</p>
              {item.example && <p><strong>Exemplo:</strong> {item.example}</p>}
              {item.doubt && <p><strong>Dúvida:</strong> {item.doubt}</p>}
              {item.nextReview && <small>Próxima revisão: {dateLabel(item.nextReview)}</small>}
              <div className='connection-actions' style={{marginTop:10}}>
                {RATINGS.map(([key,label]) => <button key={key} onClick={() => reviewLegacyKnowledge(item,key)}>{label}</button>)}
              </div>
            </article>
          ))}
        </div>
        <div className='card'>
          <h3>❌ Erros registrados no antigo Diário</h3>
          {legacyErrors.length === 0 ? <p>Nenhum erro antigo encontrado.</p> : legacyErrors.map(item => (
            <article className='foguinho-row' key={item.id}>
              <div><strong>{item.question}</strong><small>{item.discipline || 'Sem disciplina'} · {item.type || 'Outro'} · {item.resolved ? 'Resolvido' : 'Pendente'}</small>
                {item.whyWrong && <p>{item.whyWrong}</p>}
              </div>
              <button onClick={() => toggleLegacyError(item)}>{item.resolved ? '↩️ Reabrir' : '✅ Marcar resolvido'}</button>
            </article>
          ))}
        </div>
      </>}
    </section>
  );
}
