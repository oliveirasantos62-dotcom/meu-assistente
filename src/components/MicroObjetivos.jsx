import React, { useMemo, useState } from 'react';
import './MicroObjetivos.css';

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const makeId = () => `micro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const dateLabel = (value) => value ? value.split('-').reverse().join('/') : 'Sem prazo';
const daysLeft = (value) => {
  if (!value) return null;
  const now = new Date(`${localToday()}T00:00:00`);
  const due = new Date(`${value}T00:00:00`);
  return Math.ceil((due - now) / 86400000);
};

/** Microobjetivos vinculados a um objetivo principal. */
export default function MicroObjetivos({ milestones = [], onChange, compact = false }) {
  const items = Array.isArray(milestones) ? milestones : [];
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: localToday(), dueDate: '' });
  const completed = useMemo(() => items.filter((item) => item.completed).length, [items]);
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

  const reset = () => {
    setForm({ title: '', description: '', startDate: localToday(), dueDate: '' });
    setEditingId(null);
    setShowForm(false);
  };
  const submit = (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    if (editingId) {
      onChange(items.map((item) => item.id === editingId ? { ...item, ...form, title, updatedAt: new Date().toISOString() } : item));
    } else {
      onChange([...items, { id: makeId(), ...form, title, completed: false, createdAt: new Date().toISOString() }]);
    }
    reset();
  };
  const edit = (item) => {
    setEditingId(item.id);
    setForm({ title: item.title || '', description: item.description || '', startDate: item.startDate || '', dueDate: item.dueDate || item.targetDate || '' });
    setShowForm(true);
  };
  const toggle = (id) => onChange(items.map((item) => item.id === id ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : null } : item));
  const remove = (id) => {
    if (window.confirm('Excluir este microobjetivo?')) onChange(items.filter((item) => item.id !== id));
  };

  return (
    <section className={`micro-goals ${compact ? 'is-compact' : ''}`}>
      <header className="micro-goals-head">
        <div><span className="micro-kicker">PROGRESSO EM PEQUENOS PASSOS</span><h4>🧩 Microobjetivos</h4><p>{completed} de {items.length} concluídos</p></div>
        <strong className="micro-total">{progress}%</strong>
      </header>
      <div className="micro-progress"><span style={{ width: `${progress}%` }} /></div>
      {items.length > 0 ? (
        <div className="micro-list">
          {items.map((item) => {
            const left = daysLeft(item.dueDate || item.targetDate);
            const late = !item.completed && left !== null && left < 0;
            return <article className={`micro-item ${item.completed ? 'is-done' : ''}`} key={item.id}>
              <button type="button" className="micro-check" onClick={() => toggle(item.id)} aria-label={item.completed ? 'Reabrir microobjetivo' : 'Concluir microobjetivo'}>{item.completed ? '✓' : ''}</button>
              <div className="micro-item-content">
                <strong>{item.title}</strong>
                {item.description && <p>{item.description}</p>}
                <div className="micro-dates"><span>Início: {dateLabel(item.startDate)}</span><span className={late ? 'is-late' : ''}>Prazo: {dateLabel(item.dueDate || item.targetDate)}</span>{late && <b>Atrasado</b>}{!item.completed && left !== null && left >= 0 && left <= 3 && <b className="is-soon">{left === 0 ? 'Vence hoje' : `Faltam ${left} dias`}</b>}</div>
              </div>
              <div className="micro-actions"><button type="button" onClick={() => edit(item)} aria-label="Editar">✎</button><button type="button" onClick={() => remove(item.id)} aria-label="Excluir">×</button></div>
            </article>;
          })}
        </div>
      ) : <p className="micro-empty">Divida seu objetivo em pequenas conquistas com prazos realistas.</p>}
      {showForm ? <form className="micro-form" onSubmit={submit}>
        <label>Nome do microobjetivo<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: concluir o primeiro módulo" required /></label>
        <label>Descrição (opcional)<textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que precisa ser feito?" /></label>
        <div className="micro-date-fields"><label>Data de início<input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label><label>Prazo final<input type="date" value={form.dueDate} min={form.startDate || undefined} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label></div>
        <div className="micro-form-actions"><button type="button" className="micro-cancel" onClick={reset}>Cancelar</button><button type="submit" className="micro-save">{editingId ? 'Salvar alterações' : 'Adicionar microobjetivo'}</button></div>
      </form> : <button type="button" className="micro-add" onClick={() => { setEditingId(null); setForm({ title: '', description: '', startDate: localToday(), dueDate: '' }); setShowForm(true); }}>＋ Adicionar microobjetivo</button>}
    </section>
  );
}
