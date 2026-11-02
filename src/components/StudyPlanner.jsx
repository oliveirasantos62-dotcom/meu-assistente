import React, { useMemo, useState } from 'react';

const WEEKDAYS = [
  ['1', 'Segunda'], ['2', 'Terça'], ['3', 'Quarta'], ['4', 'Quinta'],
  ['5', 'Sexta'], ['6', 'Sábado'], ['0', 'Domingo'],
];

const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 120, 240, 365];

const DEFAULT_PLAN = {
  id: 'main-study-plan',
  name: 'Planejamento principal',
  active: true,
  mode: 'cycle', // cycle = tempo diário; fixed = matéria fixa por dia
  fixedMinutes: 60,
  minutesByDay: { '1': 60, '2': 60, '3': 60, '4': 60, '5': 60, '6': 90, '0': 30 },
  subjectsByDay: { '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '0': [] },
  cycleSubjects: [],
  cycleSubjectMinutes: {},
  cycleIndex: 0,
  horizonDays: 42,
  studyTime: '19:00',
  reviewRules: { previousDay: true, days3: true, days7: true, days14: true, days30: true, days60: false, days120: false, days240: false },
  steps: [
    { id: 'step-1', title: 'Questões do dia anterior', description: 'Fazer 10 questões do conteúdo estudado no dia anterior.', scope: 'global', amount: 10, unit: 'questões' },
    { id: 'step-2', title: 'Revisão rápida', description: 'Relembrar os principais pontos antes de começar.', scope: 'global', amount: 5, unit: 'min' },
  ],
};

const uid = (prefix = 'study') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };

function normalizePlan(plan) {
  return {
    ...DEFAULT_PLAN,
    ...(plan || {}),
    minutesByDay: { ...DEFAULT_PLAN.minutesByDay, ...(plan?.minutesByDay || {}) },
    subjectsByDay: { ...DEFAULT_PLAN.subjectsByDay, ...(plan?.subjectsByDay || {}) },
    cycleSubjects: Array.isArray(plan?.cycleSubjects) ? plan.cycleSubjects : [],
    cycleSubjectMinutes: { ...(plan?.cycleSubjectMinutes || {}) },
    reviewRules: { ...DEFAULT_PLAN.reviewRules, ...(plan?.reviewRules || {}) },
    steps: Array.isArray(plan?.steps) && plan.steps.length ? plan.steps : DEFAULT_PLAN.steps,
  };
}

function normalizePlans(data) {
  const existing = Array.isArray(data?.studyPlans) ? data.studyPlans : [];
  if (existing.length) return existing.map(normalizePlan);
  if (data?.studyPlan) return [normalizePlan(data.studyPlan)];
  return [normalizePlan(DEFAULT_PLAN)];
}

export default function StudyPlanner({ data, save, sessions = [], reviews = [], cycles = [] }) {
  const [plans, setPlans] = useState(() => normalizePlans(data));
  const [editingId, setEditingId] = useState(() => normalizePlans(data)[0]?.id || DEFAULT_PLAN.id);
  const [message, setMessage] = useState('');
  const [newStep, setNewStep] = useState({ title: '', description: '', scope: 'global', subject: '', amount: 10, unit: 'questões' });

  const plan = useMemo(() => normalizePlan(plans.find((item) => item.id === editingId) || plans[0] || DEFAULT_PLAN), [plans, editingId]);
  const subjects = useMemo(() => cycles.map((item) => item.subject).filter(Boolean), [cycles]);
  const existingEvents = Array.isArray(data?.calendarEvents) ? data.calendarEvents : [];

  const updatePlan = (patch) => {
    setPlans((current) => current.map((item) => item.id === plan.id ? normalizePlan({ ...item, ...patch, updatedAt: new Date().toISOString() }) : item));
  };

  const saveAll = (nextPlans = plans) => {
    const normalized = nextPlans.map(normalizePlan);
    save({ ...(data || {}), studyPlans: normalized, studyPlan: normalized.find((item) => item.active) || normalized[0] || null });
    setPlans(normalized);
  };

  const createPlan = () => {
    const next = normalizePlan({ ...DEFAULT_PLAN, id: uid('plan'), name: `Planejamento ${plans.length + 1}`, active: false, createdAt: new Date().toISOString() });
    const nextPlans = [...plans.map((item) => ({ ...item, active: false })), next];
    setPlans(nextPlans); setEditingId(next.id);
  };

  const activatePlan = (id) => updateAndPersist(plans.map((item) => ({ ...item, active: item.id === id })));

  const updateAndPersist = (nextPlans) => saveAll(nextPlans);

  const deletePlan = () => {
    if (plans.length <= 1) { setMessage('Mantenha pelo menos um planejamento. Você pode desativá-lo.'); return; }
    if (!window.confirm('Excluir este planejamento recorrente? Os registros de estudo não serão apagados.')) return;
    const remaining = plans.filter((item) => item.id !== plan.id);
    if (!remaining.some((item) => item.active)) remaining[0].active = true;
    setEditingId(remaining[0].id); saveAll(remaining);
  };

  const toggleSubjectDay = (day, subject) => {
    const current = plan.subjectsByDay[day] || [];
    updatePlan({ subjectsByDay: { ...plan.subjectsByDay, [day]: current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject] } });
  };

  const toggleCycleSubject = (subject) => {
    const current = plan.cycleSubjects || [];
    const enabled = current.includes(subject);
    const nextSubjects = enabled ? current.filter((item) => item !== subject) : [...current, subject];
    const nextMinutes = { ...(plan.cycleSubjectMinutes || {}) };
    if (!enabled && !nextMinutes[subject]) nextMinutes[subject] = 45;
    if (enabled) delete nextMinutes[subject];
    updatePlan({ cycleSubjects: nextSubjects, cycleSubjectMinutes: nextMinutes });
  };

  const setCycleSubjectMinutes = (subject, minutes) => {
    updatePlan({ cycleSubjectMinutes: { ...(plan.cycleSubjectMinutes || {}), [subject]: Math.max(5, Number(minutes || 0)) } });
  };

  const savePlan = () => {
    const active = plan.active ? plan : { ...plan, active: true };
    const nextPlans = plans.map((item) => item.id === plan.id ? active : item);
    save({ ...(data || {}), studyPlans: nextPlans, studyPlan: active, calendarEvents: buildStudyEvents() });
    setPlans(nextPlans);
    setMessage('Planejamento salvo e sincronizado com a Agenda e o Painel Principal.');
    window.setTimeout(() => setMessage(''), 3000);
  };

  const addStep = (event) => {
    event.preventDefault();
    if (!newStep.title.trim()) return;
    const step = { ...newStep, id: uid('step'), title: newStep.title.trim(), description: newStep.description.trim(), amount: Number(newStep.amount || 0) };
    updatePlan({ steps: [...plan.steps, step] });
    setNewStep({ title: '', description: '', scope: 'global', subject: '', amount: 10, unit: 'questões' });
  };

  const removeStep = (id) => updatePlan({ steps: plan.steps.filter((step) => step.id !== id) });

  const nextStudyDates = useMemo(() => {
    const result = []; const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < Number(plan.horizonDays || 42); i += 1) result.push(addDays(today, i));
    return result;
  }, [plan.horizonDays]);

  const buildStudyEvents = () => {
    const events = existingEvents.filter((event) => event.source !== 'study-plan' && event.source !== 'study-review');
    let cycleCursor = Number(plan.cycleIndex || 0);
    const cycleSubjects = plan.cycleSubjects?.length ? plan.cycleSubjects : subjects;

    nextStudyDates.forEach((date) => {
      const weekday = String(date.getDay());
      const minutes = Number(plan.minutesByDay[weekday] || plan.fixedMinutes || 0);
      if (minutes <= 0) return;

      if (plan.mode === 'cycle' && cycleSubjects.length) {
        let remaining = minutes;
        let used = 0;
        let guard = 0;
        while (remaining > 0 && guard < cycleSubjects.length * 2) {
          const subject = cycleSubjects[cycleCursor % cycleSubjects.length];
          const subjectMinutes = Math.max(5, Number(plan.cycleSubjectMinutes?.[subject] || 45));
          if (subjectMinutes > remaining) break;
          const key = `${dateKey(date)}-${subject}`;
          if (!events.some((event) => event.source === 'study-plan' && event.planKey === key)) {
            const startOffset = used;
            const [hour, minute] = String(plan.studyTime || '19:00').split(':').map(Number);
            const start = hour * 60 + minute + startOffset;
            const scheduledTime = `${String(Math.floor(start / 60) % 24).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
            events.push({ id: uid('study-event'), name: `Estudar: ${subject}`, description: `${subjectMinutes} min · Ciclo`, date: dateKey(date), scheduledTime, duration: subjectMinutes, type: 'study', source: 'study-plan', planKey: key, studySubject: subject, done: false, recurringPlanId: plan.id, notes: plan.steps.filter((step) => step.scope === 'global' || step.subject === subject).map((step) => step.title).join(' · ') });
          }
          remaining -= subjectMinutes;
          used += subjectMinutes;
          cycleCursor = (cycleCursor + 1) % cycleSubjects.length;
          guard += 1;
        }
      } else {
        const daySubjects = plan.subjectsByDay[weekday] || [];
        if (!daySubjects.length) return;
        const perSubject = Math.max(10, Math.floor(minutes / daySubjects.length));
        daySubjects.forEach((subject, index) => {
          const key = `${dateKey(date)}-${subject}`;
          if (!events.some((event) => event.source === 'study-plan' && event.planKey === key)) {
            const startOffset = index * perSubject;
            const [hour, minute] = String(plan.studyTime || '19:00').split(':').map(Number);
            const start = hour * 60 + minute + startOffset;
            const scheduledTime = `${String(Math.floor(start / 60) % 24).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
            events.push({ id: uid('study-event'), name: `Estudar: ${subject}`, description: `${perSubject} min · Matéria fixa`, date: dateKey(date), scheduledTime, duration: perSubject, type: 'study', source: 'study-plan', planKey: key, studySubject: subject, done: false, recurringPlanId: plan.id, notes: plan.steps.filter((step) => step.scope === 'global' || step.subject === subject).map((step) => step.title).join(' · ') });
          }
        });
      }
    });

    const reviewOffsets = [
      ['previousDay', 1], ['days3', 3], ['days7', 7], ['days14', 14], ['days30', 30],
      ['days60', 60], ['days120', 120], ['days240', 240],
    ].filter(([key]) => plan.reviewRules[key]).map(([, offset]) => offset);

    sessions.forEach((session) => {
      const base = new Date(`${String(session.study_date || session.date).slice(0, 10)}T12:00:00`);
      if (Number.isNaN(base.getTime())) return;
      const subject = session.subject || session.discipline;
      if (!subject) return;
      reviewOffsets.forEach((offset) => {
        const reviewDate = addDays(base, offset);
        const key = `${dateKey(reviewDate)}-${subject}-review-${offset}`;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (!events.some((event) => event.source === 'study-review' && event.planKey === key) && reviewDate >= today && reviewDate <= addDays(today, 365)) {
          events.push({ id: uid('study-review'), name: `Revisar: ${subject}`, description: `Revisão espaçada · D+${offset}`, date: dateKey(reviewDate), scheduledTime: plan.studyTime || '', duration: Math.min(30, Number(plan.fixedMinutes || 30)), type: 'study', source: 'study-review', planKey: key, studySubject: subject, reviewOffset: offset, done: false, recurringPlanId: plan.id });
        }
      });
    });
    return events;
  };

  const generateAgenda = () => {
    const active = plan.active ? plan : { ...plan, active: true };
    const nextPlans = plans.map((item) => item.id === plan.id ? active : item);
    save({ ...(data || {}), studyPlans: nextPlans, studyPlan: active, calendarEvents: buildStudyEvents() });
    setPlans(nextPlans);
    setMessage('Agenda atualizada. O planejamento continua recorrente nas próximas semanas.');
    window.setTimeout(() => setMessage(''), 3000);
  };

  const totalWeeklyMinutes = WEEKDAYS.reduce((sum, [day]) => sum + Number(plan.minutesByDay[day] || 0), 0);
  const reviewCount = Object.values(plan.reviewRules).filter(Boolean).length;

  return (
    <div className='study-planner'>
      {message && <div className='success-message'>{message}</div>}

      <div className='study-planner-hero'>
        <div><span className='eyebrow'>PLANEJAMENTO RECORRENTE</span><h2>🗓️ Organização dos estudos</h2><p>O planejamento não é de uma única semana. Ele funciona como uma regra recorrente para todas as semanas e pode ser editado, ativado ou excluído quando quiser.</p></div>
        <div className='study-planner-summary'><strong>{plan.mode === 'fixed' ? `${Math.round(totalWeeklyMinutes / 60 * 10) / 10}h/semana` : `${plan.fixedMinutes} min/dia`}</strong><span>{plan.active ? '● Planejamento ativo' : '○ Planejamento inativo'}</span></div>
      </div>

      <div className='card study-plan-manager'>
        <div><span className='eyebrow'>MODELOS RECORRENTES</span><h3>Seus planejamentos</h3><p>Crie modelos diferentes para fases de estudo, mantendo os registros anteriores intactos.</p></div>
        <div className='study-plan-list'>{plans.map((item) => <button type='button' key={item.id} className={`study-plan-chip ${item.id === plan.id ? 'active' : ''}`} onClick={() => setEditingId(item.id)}><strong>{item.name}</strong><span>{item.active ? 'Ativo' : 'Inativo'}</span></button>)}<button type='button' className='secondary-button' onClick={createPlan}>+ Novo planejamento</button></div>
      </div>

      <div className='card'>
        <div className='study-section-heading'><div><span className='eyebrow'>MODELO ATUAL</span><h3>{plan.name}</h3><p>Edite esta regra sem apagar sessões, revisões ou histórico.</p></div><div className='study-plan-toolbar'><label>Nome<input value={plan.name} onChange={(e) => updatePlan({ name: e.target.value })} /></label><button type='button' className='secondary-button' onClick={() => updatePlan({ active: !plan.active })}>{plan.active ? 'Desativar' : 'Ativar'}</button><button type='button' className='study-action-button danger' onClick={deletePlan}>Excluir</button></div></div>
        <div className='study-mode-grid'>
          <button type='button' className={`study-mode-card ${plan.mode === 'fixed' ? 'active' : ''}`} onClick={() => updatePlan({ mode: 'fixed' })}><strong>📅 Matéria fixa por dia</strong><span>Você decide quais matérias entram na segunda, terça, quarta...</span></button>
          <button type='button' className={`study-mode-card ${plan.mode === 'cycle' ? 'active' : ''}`} onClick={() => updatePlan({ mode: 'cycle' })}><strong>🔄 Ciclo por tempo</strong><span>Você define o tempo disponível por dia e o sistema distribui as matérias em ciclo.</span></button>
        </div>
      </div>

      <div className='card'>
        <div className='study-section-heading'><div><h3>⏱️ Tempo semanal recorrente</h3><p>O tempo abaixo se repete toda semana. Você pode manter igual ou variar por dia.</p></div><label className='study-inline-field'>Horário padrão<input type='time' value={plan.studyTime} onChange={(e) => updatePlan({ studyTime: e.target.value })} /></label></div>
        <div className='study-planner-time-row'><label>Tempo padrão (min/dia)<input type='number' min='0' value={plan.fixedMinutes} onChange={(e) => updatePlan({ fixedMinutes: Number(e.target.value || 0) })} /></label><label>Gerar agenda até<input type='number' min='7' max='365' value={plan.horizonDays} onChange={(e) => updatePlan({ horizonDays: Number(e.target.value || 42) })} /> dias</label></div>
        <div className='study-week-grid'>{WEEKDAYS.map(([day, label]) => <label key={day}><strong>{label}</strong><span>minutos</span><input type='number' min='0' value={plan.minutesByDay[day] || 0} onChange={(e) => updatePlan({ minutesByDay: { ...plan.minutesByDay, [day]: Number(e.target.value || 0) } })} /></label>)}</div>
      </div>

      {plan.mode === 'fixed' ? <div className='card'><div className='study-section-heading'><div><h3>📚 Matéria fixa por dia</h3><p>Essa distribuição se repete em todas as semanas enquanto o planejamento estiver ativo.</p></div></div>{subjects.length === 0 ? <div className='study-empty-performance'><strong>Cadastre matérias primeiro.</strong><p>Use as matérias do seu ciclo atual para montar os dias.</p></div> : <div className='study-day-subjects'>{WEEKDAYS.map(([day, label]) => <div className='study-day-card' key={day}><strong>{label}</strong><div>{subjects.map((subject) => <label key={subject} className='study-check'><input type='checkbox' checked={(plan.subjectsByDay[day] || []).includes(subject)} onChange={() => toggleSubjectDay(day, subject)} /><span>{subject}</span></label>)}</div></div>)}</div>}</div> : <div className='card'><div className='study-section-heading'><div><h3>🔄 Matérias do ciclo</h3><p>Escolha as matérias que participam do ciclo. A ordem é percorrida continuamente conforme o tempo de cada dia.</p></div></div>{subjects.length === 0 ? <div className='study-empty-performance'><strong>Cadastre matérias primeiro.</strong></div> : <div className='study-cycle-subject-picker'>{subjects.map((subject) => <div className='study-cycle-subject-row' key={subject}><label className='study-check'><input type='checkbox' checked={(plan.cycleSubjects || []).includes(subject)} onChange={() => toggleCycleSubject(subject)} /><span>{subject}</span></label>{(plan.cycleSubjects || []).includes(subject) && <label className='study-cycle-minutes'>Tempo da matéria (min)<input type='number' min='5' step='5' value={plan.cycleSubjectMinutes?.[subject] || 45} onChange={(e) => setCycleSubjectMinutes(subject, e.target.value)} /></label>}</div>)}</div>}</div>}

      <div className='card'>
        <div className='study-section-heading'><div><h3>🪜 Etapas do estudo</h3><p>Crie etapas globais ou específicas por matéria. Ex.: fazer 10 questões do dia anterior.</p></div></div>
        <div className='study-step-list'>{plan.steps.map((step, index) => <div className='study-step-row' key={step.id}><span className='study-step-number'>{index + 1}</span><div><strong>{step.title}</strong><small>{step.description || `${step.amount || 0} ${step.unit || ''}`}</small></div><span>{step.scope === 'global' ? 'Todos' : step.subject}</span><button type='button' className='study-action-button secondary' onClick={() => removeStep(step.id)}>Excluir</button></div>)}</div>
        <form className='study-step-form' onSubmit={addStep}><input required placeholder='Ex.: Fazer 10 questões do dia anterior' value={newStep.title} onChange={(e) => setNewStep({ ...newStep, title: e.target.value })} /><input placeholder='Detalhe / instrução' value={newStep.description} onChange={(e) => setNewStep({ ...newStep, description: e.target.value })} /><select value={newStep.scope} onChange={(e) => setNewStep({ ...newStep, scope: e.target.value })}><option value='global'>Todos os estudos</option><option value='subject'>Uma matéria</option></select>{newStep.scope === 'subject' && <select value={newStep.subject} onChange={(e) => setNewStep({ ...newStep, subject: e.target.value })}><option value=''>Escolha a matéria</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select>}<button type='submit' className='study-action-button'>+ Adicionar etapa</button></form>
      </div>

      <div className='card'>
        <div className='study-section-heading'><div><h3>🧠 Revisão espaçada progressiva</h3><p>Sim. A distância aumenta ao longo das revisões quando o conteúdo está sendo lembrado. Se esquecer, o intervalo volta para perto do início.</p></div></div>
        <div className='study-review-rules'>{[['previousDay', 1, 'Dia seguinte'], ['days3', 3, 'D+3'], ['days7', 7, 'D+7'], ['days14', 14, 'D+14'], ['days30', 30, 'D+30'], ['days60', 60, 'D+60'], ['days120', 120, 'D+120'], ['days240', 240, 'D+240']].map(([key, days, label]) => <label className='study-check' key={key}><input type='checkbox' checked={Boolean(plan.reviewRules[key])} onChange={(e) => updatePlan({ reviewRules: { ...plan.reviewRules, [key]: e.target.checked } })} /><span>{label} <small>({days} dia{days > 1 ? 's' : ''})</small></span></label>)}</div>
        <div className='study-spaced-ladder'>{REVIEW_INTERVALS.map((days, index) => <span key={days}>{index ? '→ ' : ''}<b>{days}d</b></span>)}</div>
        <div className='study-review-info'><strong>{reviews.length}</strong><span>itens de revisão</span><strong>{sessions.length}</strong><span>sessões usadas como base</span></div>
      </div>

      <div className='study-planner-actions'><button type='button' className='secondary-button' onClick={savePlan}>💾 Salvar planejamento</button><button type='button' className='primary-button' onClick={generateAgenda}>📅 Gerar / atualizar agenda</button></div>
    </div>
  );
}
