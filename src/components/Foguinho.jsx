import { useEffect, useMemo, useState } from 'react';
import {
  createFoguinhoActivity,
  getFoguinhoActivities,
  getFoguinhoHistory,
  getFoguinhoInvitations,
  getNotifications,
  getConnections,
  inviteFoguinhoMember,
  logFoguinhoActivity,
  markNotificationRead,
  respondFoguinhoInvitation,
} from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);

const typeLabels = {
  habit: '🔥 Hábito',
  goal: '🎯 Meta',
  study: '📚 Estudo',
  reading: '📖 Leitura',
  project: '📁 Projeto',
  custom: '✨ Personalizada',
};

const privacyLabels = {
  private: '🔒 Privada',
  connections: '👥 Conexões',
  group: '🌐 Grupo',
};

function streakForLogs(logs, userId) {
  const dates = [...new Set(logs.filter((x) => x.user_id === userId).map((x) => x.log_date?.slice(0, 10)))].sort().reverse();
  if (!dates.length) return 0;
  let cursor = new Date(today() + 'T00:00:00');
  const todayStr = today();
  if (dates[0] !== todayStr) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.includes(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Foguinho({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connections, setConnections] = useState([]);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'habit', privacy: 'connections', frequency: 'daily', targetDate: '' });
  const [logNote, setLogNote] = useState('');
  const [logProgress, setLogProgress] = useState(1);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, i, n, c] = await Promise.all([getFoguinhoActivities(), getFoguinhoInvitations(), getNotifications(), getConnections()]);
      setActivities(a); setInvitations(i); setNotifications(n); setConnections(c.filter((x) => x.status === 'accepted'));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  const unread = notifications.filter((n) => !n.read_at).length;
  const pendingConnections = connections.length;

  async function create(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await createFoguinhoActivity(form);
      setForm({ title: '', description: '', type: 'habit', privacy: 'connections', frequency: 'daily', targetDate: '' });
      setShowForm(false); setMessage('🔥 Atividade compartilhada criada.'); await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function respond(invitation, status) {
    try { await respondFoguinhoInvitation(invitation.id, status); setMessage(status === 'accepted' ? 'Convite aceito.' : 'Convite recusado.'); await loadAll(); }
    catch (err) { setError(err.message); }
  }

  async function logToday(activity) {
    try { await logFoguinhoActivity(activity.id, { date: today(), note: logNote, progress: logProgress }); setLogNote(''); setLogProgress(1); setMessage(`🔥 Registro feito em “${activity.title}”.`); await loadAll(); if (selected?.id === activity.id) await openHistory(activity); }
    catch (err) { setError(err.message); }
  }

  async function openHistory(activity) {
    try { const logs = await getFoguinhoHistory(activity.id); setHistory((h) => ({ ...h, [activity.id]: logs })); setSelected(activity); }
    catch (err) { setError(err.message); }
  }

  async function invite(activity, userId) {
    try { await inviteFoguinhoMember(activity.id, userId); setMessage('Convite enviado para a atividade.'); await loadAll(); }
    catch (err) { setError(err.message); }
  }

  async function readNotification(n) {
    if (!n.read_at) { try { await markNotificationRead(n.id); await loadAll(); } catch (err) { setError(err.message); } }
  }

  const selectedLogs = selected ? (history[selected.id] || []) : [];
  const memberIds = [...new Set(selectedLogs.map((log) => log.user_id))];
  const dates = [...new Set(selectedLogs.map((log) => log.log_date?.slice(0, 10)))].sort().reverse();
  let groupStreak = 0;
  if (memberIds.length && dates.length) {
    let cursor = new Date(today() + 'T00:00:00');
    if (dates[0] !== today()) cursor.setDate(cursor.getDate() - 1);
    for (;;) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const allDone = memberIds.every((id) => selectedLogs.some((log) => log.user_id === id && log.log_date?.slice(0, 10) === dateKey));
      if (!allDone) break;
      groupStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  const myStreak = selectedLogs.length ? streakForLogs(selectedLogs, currentUser.id) : 0;
  const memberNames = useMemo(() => [...new Map(selectedLogs.map((l) => [l.user_id, l.name])).values()], [selectedLogs]);

  return (
    <section className='page-section foguinho-page'>
      <div className='section-heading'>
        <div>
          <span className='eyebrow'>FASE 3 · SOCIAL</span>
          <h2>🔥 Foguinho</h2>
          <p>Faça atividades junto com outras pessoas, cada uma registrando seu próprio progresso.</p>
        </div>
        <button type='button' onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : '+ Criar atividade'}</button>
      </div>

      {error && <p className='auth-error' role='alert'>{error}</p>}
      {message && <p className='auth-message' role='status'>{message}</p>}

      <div className='foguinho-stats'>
        <div className='card'><strong>{activities.length}</strong><span>Atividades</span></div>
        <div className='card'><strong>{pendingConnections}</strong><span>Conexões</span></div>
        <div className='card'><strong>{invitations.length}</strong><span>Convites</span></div>
        <div className='card'><strong>{unread}</strong><span>Notificações</span></div>
      </div>

      {showForm && (
        <form className='card foguinho-form' onSubmit={create}>
          <h3>🔥 Nova atividade compartilhada</h3>
          <div className='form-grid'>
            <label>Título<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder='Ex.: Estudar Java todos os dias' /></label>
            <label>Tipo<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label>Privacidade<select value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value })}>{Object.entries(privacyLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label>Frequência<select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}><option value='daily'>Diária</option><option value='weekly'>Semanal</option><option value='custom'>Personalizada</option><option value='once'>Uma vez</option></select></label>
            <label>Data limite<input type='date' value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
            <label className='full'>Descrição<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder='Como vocês vão cumprir essa atividade?' /></label>
          </div>
          <button type='submit'>Criar Foguinho</button>
        </form>
      )}

      {invitations.length > 0 && (
        <div className='card'>
          <h3>📨 Convites recebidos</h3>
          <div className='foguinho-list'>{invitations.map((inv) => <div className='foguinho-row' key={inv.id}><div><strong>{inv.title}</strong><small>{inv.inviter_name} · {typeLabels[inv.type]}</small></div><div className='connection-actions'><button onClick={() => respond(inv, 'accepted')}>Aceitar</button><button className='ghost' onClick={() => respond(inv, 'rejected')}>Recusar</button></div></div>)}</div>
        </div>
      )}

      <div className='card'>
        <h3>🔥 Minhas atividades</h3>
        {loading ? <p>Carregando...</p> : activities.length === 0 ? <p>Você ainda não participa de nenhuma atividade compartilhada.</p> : (
          <div className='foguinho-cards'>{activities.map((activity) => (
            <article className='foguinho-card' key={activity.id}>
              <div className='foguinho-card-top'><span>{typeLabels[activity.type]}</span><span>{privacyLabels[activity.privacy]}</span></div>
              <h3>{activity.title}</h3>
              <p>{activity.description || 'Sem descrição.'}</p>
              <small>👥 {activity.member_count} participante(s) · {activity.frequency}</small>
              <div className='foguinho-card-actions'>
                <div className='foguinho-log-form'><input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder={activity.type === 'goal' ? 'O que avançou hoje?' : 'Observação (opcional)'} /><input type='number' min='1' value={logProgress} onChange={(e) => setLogProgress(Math.max(1, Number(e.target.value) || 1))} aria-label='Progresso do registro' /><button type='button' onClick={() => logToday(activity)} disabled={activity.today_done}>{activity.today_done ? '✅ Feito hoje' : '🔥 Registrar'}</button></div>
                <button type='button' className='ghost' onClick={() => openHistory(activity)}>Histórico</button>
              </div>
              {activity.my_role === 'owner' && activity.privacy !== 'private' && connections.length > 0 && (
                <label className='invite-select'>Convidar conexão<select defaultValue='' onChange={(e) => { if (e.target.value) invite(activity, e.target.value); e.target.value = ''; }}><option value=''>Selecione...</option>{connections.map((c) => <option key={c.user_id} value={c.user_id}>{c.name}{c.username ? ` (@${c.username})` : ''}</option>)}</select></label>
              )}
            </article>
          ))}</div>
        )}
      </div>

      {selected && (
        <div className='card foguinho-history'>
          <div className='section-heading'><div><h3>📜 {selected.title}</h3><p>{memberNames.length || selected.member_count} participante(s) com registros.</p></div><button className='ghost' onClick={() => setSelected(null)}>Fechar</button></div>
          <div className='foguinho-stats'><div className='card'><strong>{myStreak}</strong><span>Meu streak</span></div><div className='card'><strong>{groupStreak}</strong><span>Streak do grupo</span></div><div className='card'><strong>{selectedLogs.length}</strong><span>Registros</span></div></div>
          {selectedLogs.length === 0 ? <p>Nenhum registro ainda.</p> : <div className='foguinho-list'>{selectedLogs.map((log) => <div className='foguinho-row' key={log.id}><div><strong>{log.name}</strong><small>{new Date(log.log_date + 'T00:00:00').toLocaleDateString('pt-BR')} · {log.note || 'Atividade concluída'}</small></div><strong>+{log.progress}</strong></div>)}</div>}
        </div>
      )}

      <div className='card'>
        <h3>🔔 Notificações</h3>
        {notifications.length === 0 ? <p>Nenhuma notificação.</p> : <div className='foguinho-list'>{notifications.slice(0, 10).map((n) => <button className={`notification-row ${n.read_at ? '' : 'unread'}`} key={n.id} onClick={() => readNotification(n)}><div><strong>{n.title}</strong><small>{n.message}</small></div><small>{new Date(n.created_at).toLocaleString('pt-BR')}</small></button>)}</div>}
      </div>
    </section>
  );
}
