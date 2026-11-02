import React, { useMemo, useState } from 'react';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const empty = { subject: '', priority: 'Média', availableMinutes: 60, studiedMinutes: 0, sessions: 0, lastStudy: '', nextStudy: '', progress: 0, reviews: 0, difficulty: 3, tags: [], goalId: '' };

export default function StudyCycle({ data, save }) {
  const cycles = Array.isArray(data?.studyCycles) ? data.studyCycles : [];
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState('');
  const goals = data?.goals || [];
  const tags = data?.tags || [];
  const ordered = useMemo(() => [...cycles].sort((a, b) => ({ Alta: 0, Média: 1, Baixa: 2 }[a.priority] ?? 1) - ({ Alta: 0, Média: 1, Baixa: 2 }[b.priority] ?? 1)), [cycles]);
  const totalAvailable = cycles.reduce((s, c) => s + Number(c.availableMinutes || 0), 0);
  const totalStudied = cycles.reduce((s, c) => s + Number(c.studiedMinutes || 0), 0);

  function submit(e) {
    e.preventDefault();
    if (!form.subject.trim()) return;
    const item = { ...form, subject: form.subject.trim(), id: editing || uid(), updatedAt: new Date().toISOString() };
    save({ ...data, studyCycles: editing ? cycles.map(c => c.id === editing ? item : c) : [...cycles, item] });
    setForm(empty); setEditing('');
  }
  function edit(item) { setEditing(item.id); setForm({ ...empty, ...item }); }
  function remove(id) { if (window.confirm('Excluir esta matéria do ciclo?')) save({ ...data, studyCycles: cycles.filter(c => c.id !== id) }); }
  function registerSession(item) {
    const minutes = Number(window.prompt('Quantos minutos estudou?', '30'));
    if (!minutes || minutes < 1) return;
    const next = cycles.map(c => c.id === item.id ? { ...c, studiedMinutes: Number(c.studiedMinutes || 0) + minutes, sessions: Number(c.sessions || 0) + 1, lastStudy: new Date().toISOString().slice(0,10), nextStudy: new Date(Date.now() + 2 * 86400000).toISOString().slice(0,10), progress: Math.min(100, Number(c.progress || 0) + Math.max(1, Math.round(minutes / 10))) } : c);
    save({ ...data, studyCycles: next });
  }
  return <section className='central-page'>
    <div className='page-hero'><div><span className='eyebrow'>ESTUDOS</span><h2>🔄 Ciclo de Estudos</h2><p>O sistema organiza prioridade, tempo, progresso e próxima revisão para ajudar a decidir o próximo estudo.</p></div><div className='metric-group'><div><small>Disponível</small><strong>{totalAvailable} min</strong></div><div><small>Estudado</small><strong>{totalStudied} min</strong></div></div></div>
    <div className='card'><h3>{editing ? 'Editar matéria' : 'Adicionar ao ciclo'}</h3><form className='form-grid cycle-form' onSubmit={submit}><label>Matéria / disciplina<input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label><label>Prioridade<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Alta</option><option>Média</option><option>Baixa</option></select></label><label>Tempo disponível (min)<input type='number' min='0' value={form.availableMinutes} onChange={e=>setForm({...form,availableMinutes:e.target.value})}/></label><label>Dificuldade<input type='range' min='1' max='5' value={form.difficulty} onChange={e=>setForm({...form,difficulty:Number(e.target.value)})}/><span>{form.difficulty}/5</span></label><label>Próximo estudo<input type='date' value={form.nextStudy} onChange={e=>setForm({...form,nextStudy:e.target.value})}/></label><label>Meta relacionada<select value={form.goalId} onChange={e=>setForm({...form,goalId:e.target.value})}><option value=''>Nenhuma</option>{goals.map(g=><option key={g.id} value={g.id}>{g.name || g.title}</option>)}</select></label><label className='full'>Tags<select multiple value={form.tags || []} onChange={e=>setForm({...form,tags:[...e.target.selectedOptions].map(o=>o.value)})}>{tags.map(t=><option key={t.id} value={t.id}>#{t.name}</option>)}</select></label><div><button className='primary-button' type='submit'>{editing ? 'Salvar' : 'Adicionar'}</button>{editing && <button className='secondary-button' type='button' onClick={()=>{setEditing('');setForm(empty)}}>Cancelar</button>}</div></form></div>
    <div className='cycle-grid'>{ordered.length ? ordered.map(item => { const pct = Math.min(100, Number(item.progress || 0)); return <article className='cycle-card' key={item.id}><div className='cycle-top'><span className={`priority ${String(item.priority).toLowerCase()}`}>{item.priority}</span><button onClick={()=>edit(item)}>Editar</button></div><h3>{item.subject}</h3><div className='progress-track'><span style={{width:`${pct}%`}}/></div><div className='cycle-metrics'><span><b>{item.studiedMinutes || 0}</b> min</span><span><b>{item.sessions || 0}</b> sessões</span><span><b>{pct}%</b> progresso</span><span><b>{item.reviews || 0}</b> revisões</span></div><p>Último: {item.lastStudy || '—'} · Próximo: {item.nextStudy || 'não definido'}</p><div className='cycle-actions'><button className='primary-button' onClick={()=>registerSession(item)}>+ Registrar estudo</button><button className='secondary-button' onClick={()=>remove(item.id)}>Excluir</button></div></article> }) : <div className='empty-state'>Adicione matérias para começar seu ciclo.</div>}</div>
  </section>;
}
