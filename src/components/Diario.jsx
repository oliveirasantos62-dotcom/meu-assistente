import React, { useEffect, useMemo, useState } from 'react';

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dateLabel(value) {
  if (!value) return '—';
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}
const initialEntry = {
  mood: 3, energy: 3, focus: 3, sleep: '', stress: 3, motivation: 3,
  happened: '', important: '', wentWell: '', wentWrong: '',
  learned: '', improveTomorrow: '', notes: '',
};
const initialReflection = {
  accomplished: '', difficulty: '', continue: '', stop: '', priority: '',
};

function Rating({ label, value, onChange, minLabel = 'Baixo', maxLabel = 'Alto' }) {
  return (
    <label className="journal-rating">
      <span>{label}</span>
      <div className="journal-rating-options">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" className={Number(value) === n ? 'selected' : ''}
            onClick={() => onChange(n)} aria-pressed={Number(value) === n}>{n}</button>
        ))}
      </div>
      <small>{minLabel} <span>{maxLabel}</span></small>
    </label>
  );
}
function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="journal-field">
      <span>{label}</span>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3} />
    </label>
  );
}

export default function Diario({ data = {}, save }) {
  const [tab, setTab] = useState('today');
  const today = localDate();
  const entries = Array.isArray(data.diaryEntries) ? data.diaryEntries : [];
  const reflections = Array.isArray(data.weeklyReflections) ? data.weeklyReflections : [];
  const todayEntry = useMemo(() => entries.find(x => x.date === today), [entries, today]);
  const [form, setForm] = useState(initialEntry);
  const [reflection, setReflection] = useState(initialReflection);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setForm(todayEntry ? { ...initialEntry, ...todayEntry } : initialEntry);
  }, [todayEntry]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }
  function saveEntry(e) {
    e.preventDefault();
    const entry = { ...form, id: todayEntry?.id || Date.now(), date: today, updatedAt: new Date().toISOString() };
    const next = todayEntry
      ? entries.map(item => item.id === todayEntry.id ? entry : item)
      : [entry, ...entries];
    save({ ...data, diaryEntries: next });
    setNotice('Registro do dia salvo.');
  }
  function saveWeeklyReflection(e) {
    e.preventDefault();
    const item = { ...reflection, id: Date.now(), date: today, createdAt: new Date().toISOString() };
    save({ ...data, weeklyReflections: [item, ...reflections] });
    setReflection(initialReflection);
    setNotice('Reflexão semanal salva.');
  }

  return (
    <main className="journal-page">
      <style>{`
        .journal-page{max-width:1100px;margin:0 auto;padding:24px;color:var(--site-on-background)}
        .journal-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px}
        .journal-hero h1{font-size:clamp(1.8rem,3vw,2.4rem);margin:7px 0}
        .journal-hero p{margin:0;color:var(--site-text-muted)}
        .journal-icon{font-size:2.5rem;background:var(--site-surface);padding:16px;border-radius:18px}
        .journal-tabs{display:flex;gap:8px;overflow:auto;padding:7px;background:var(--site-surface);border:1px solid var(--site-border);border-radius:14px;margin-bottom:18px}
        .journal-tabs button{border:0;background:transparent;color:var(--site-on-background);padding:10px 15px;border-radius:10px;white-space:nowrap;cursor:pointer}
        .journal-tabs button.active{background:var(--site-primary);color:white}
        .journal-card{background:var(--site-card-bg);border:1px solid var(--site-border);border-radius:17px;padding:20px;margin-bottom:16px}
        .journal-card h2{font-size:1.1rem;margin:0 0 6px}
        .journal-muted{color:var(--site-text-muted);margin:0 0 16px}
        .journal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .journal-field{display:flex;flex-direction:column;gap:7px;min-width:0}
        .journal-field>span,.journal-rating>span{font-weight:650;font-size:.9rem}
        .journal-field textarea{width:100%;resize:vertical;min-height:86px;padding:11px 12px;border:1px solid var(--site-border);border-radius:10px;background:var(--site-background);color:var(--site-on-background);font:inherit}
        .journal-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .journal-rating{display:flex;flex-direction:column;gap:8px;padding:13px;border:1px solid var(--site-border);border-radius:12px}
        .journal-rating-options{display:flex;gap:7px}
        .journal-rating-options button{width:34px;height:34px;border-radius:50%;border:1px solid var(--site-border);background:var(--site-background);color:var(--site-on-background);cursor:pointer}
        .journal-rating-options button.selected{background:var(--site-primary);border-color:var(--site-primary);color:#fff}
        .journal-rating small{display:flex;justify-content:space-between;color:var(--site-text-muted)}
        .journal-submit{margin-top:16px;border:0;border-radius:10px;padding:11px 17px;background:var(--site-primary);color:white;font-weight:700;cursor:pointer}
        .journal-entry{padding:15px 0;border-bottom:1px solid var(--site-border)}
        .journal-entry:last-child{border-bottom:0}
        .journal-entry time{font-size:.8rem;color:var(--site-text-muted)}
        .journal-entry h3{margin:6px 0;font-size:1rem}
        .journal-entry p{margin:5px 0;white-space:pre-wrap;line-height:1.5}
        .journal-notice{margin:0 0 14px;padding:10px 13px;border-radius:10px;background:rgba(33,119,100,.15);color:var(--site-on-background)}
        @media(max-width:700px){.journal-page{padding:14px}.journal-grid,.journal-metrics{grid-template-columns:1fr}.journal-hero{align-items:flex-start}.journal-icon{font-size:1.8rem;padding:12px}}
      `}</style>

      <header className="journal-hero">
        <div><span className="eyebrow">MEU ESPAÇO PESSOAL</span><h1>📔 Diário</h1>
          <p>Registre seus dias, organize seus pensamentos e acompanhe como você está se sentindo.</p>
        </div>
        <div className="journal-icon">✍️</div>
      </header>

      {notice && <p className="journal-notice" role="status">{notice}</p>}
      <nav className="journal-tabs" aria-label="Seções do diário">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>✍️ Meu dia</button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>🗓️ Histórico</button>
        <button className={tab === 'reflection' ? 'active' : ''} onClick={() => setTab('reflection')}>🔎 Reflexão semanal</button>
      </nav>

      {tab === 'today' && <form onSubmit={saveEntry}>
        <section className="journal-card">
          <h2>Como estou hoje?</h2><p className="journal-muted">{dateLabel(today)}</p>
          <div className="journal-metrics">
            <Rating label="😊 Humor" value={form.mood} onChange={v => update('mood', v)} minLabel="Muito mal" maxLabel="Muito bem" />
            <Rating label="⚡ Energia" value={form.energy} onChange={v => update('energy', v)} />
            <Rating label="🎯 Foco" value={form.focus} onChange={v => update('focus', v)} />
            <Rating label="🌿 Estresse" value={form.stress} onChange={v => update('stress', v)} />
            <Rating label="🔥 Motivação" value={form.motivation} onChange={v => update('motivation', v)} />
          </div>
          <label className="journal-field" style={{marginTop:14,maxWidth:300}}>
            <span>😴 Quantas horas dormi?</span>
            <input type="number" min="0" max="24" step="0.5" value={form.sleep} onChange={e => update('sleep', e.target.value)}
              style={{padding:11,borderRadius:10,border:'1px solid var(--site-border)',background:'var(--site-background)',color:'var(--site-on-background)'}} />
          </label>
        </section>
        <section className="journal-card">
          <h2>✍️ Meu registro</h2><p className="journal-muted">Escreva livremente. Não é uma lista de tarefas nem um relatório de estudos.</p>
          <div className="journal-grid">
            <Field label="O que aconteceu hoje?" value={form.happened} onChange={v => update('happened',v)} placeholder="Conte os acontecimentos do dia..." />
            <Field label="O que foi importante para mim?" value={form.important} onChange={v => update('important',v)} placeholder="Pessoas, momentos ou decisões..." />
            <Field label="O que me fez bem?" value={form.wentWell} onChange={v => update('wentWell',v)} placeholder="Pequenas ou grandes coisas..." />
            <Field label="O que foi difícil?" value={form.wentWrong} onChange={v => update('wentWrong',v)} placeholder="O que pesou ou incomodou?" />
            <Field label="O que percebi ou aprendi sobre mim?" value={form.learned} onChange={v => update('learned',v)} placeholder="Uma percepção, sentimento ou descoberta..." />
            <Field label="O que gostaria de fazer diferente amanhã?" value={form.improveTomorrow} onChange={v => update('improveTomorrow',v)} placeholder="Sem cobrança: apenas uma intenção..." />
          </div>
          <div style={{marginTop:14}}>
            <Field label="Notas livres" value={form.notes} onChange={v => update('notes',v)} placeholder="Qualquer coisa que queira registrar..." />
          </div>
          <button className="journal-submit" type="submit">💾 {todayEntry ? 'Atualizar registro' : 'Salvar meu dia'}</button>
        </section>
      </form>}

      {tab === 'history' && <section className="journal-card">
        <h2>🗓️ Meus registros anteriores</h2><p className="journal-muted">Seus registros pessoais, organizados do mais recente para o mais antigo.</p>
        {entries.length === 0 ? <p>Ainda não há registros anteriores.</p> : [...entries].sort((a,b) => String(b.date).localeCompare(String(a.date))).map(item => (
          <article className="journal-entry" key={item.id}>
            <time>{dateLabel(item.date)}</time>
            <h3>{item.happened || 'Registro do dia'}</h3>
            {item.important && <p><strong>Importante:</strong> {item.important}</p>}
            {item.wentWell && <p><strong>Me fez bem:</strong> {item.wentWell}</p>}
            {item.wentWrong && <p><strong>Foi difícil:</strong> {item.wentWrong}</p>}
            {item.notes && <p>{item.notes}</p>}
          </article>
        ))}
      </section>}

      {tab === 'reflection' && <section>
        <form className="journal-card" onSubmit={saveWeeklyReflection}>
          <h2>🔎 Reflexão semanal</h2><p className="journal-muted">Uma pausa para perceber como você está vivendo sua semana.</p>
          <div className="journal-grid">
            <Field label="Do que me orgulho nesta semana?" value={reflection.accomplished} onChange={v => setReflection(p=>({...p,accomplished:v}))} />
            <Field label="O que foi mais difícil?" value={reflection.difficulty} onChange={v => setReflection(p=>({...p,difficulty:v}))} />
            <Field label="O que quero continuar fazendo?" value={reflection.continue} onChange={v => setReflection(p=>({...p,continue:v}))} />
            <Field label="O que quero deixar para trás?" value={reflection.stop} onChange={v => setReflection(p=>({...p,stop:v}))} />
            <Field label="Qual intenção quero levar para a próxima semana?" value={reflection.priority} onChange={v => setReflection(p=>({...p,priority:v}))} />
          </div>
          <button className="journal-submit" type="submit">Salvar reflexão</button>
        </form>
        {reflections.length > 0 && <section className="journal-card">
          <h2>Reflexões anteriores</h2>
          {reflections.map(item => <article className="journal-entry" key={item.id}>
            <time>{dateLabel(item.date)}</time><h3>{item.priority || 'Reflexão semanal'}</h3>
            {item.accomplished && <p>{item.accomplished}</p>}
            {item.difficulty && <p><strong>Desafio:</strong> {item.difficulty}</p>}
          </article>)}
        </section>}
      </section>}
    </main>
  );
}
