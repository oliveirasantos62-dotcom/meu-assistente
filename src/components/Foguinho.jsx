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
  private: '🔒 Somente eu',
  connections: '👥 Escolher conexões',
};

function streakForLogs(logs, userId) {
  const dates = [
    ...new Set(
      logs
        .filter((x) => x.user_id === userId)
        .map((x) => x.log_date?.slice(0, 10)),
    ),
  ]
    .sort()
    .reverse();

  if (!dates.length) return 0;

  let cursor = new Date(today() + 'T00:00:00');
  const todayStr = today();

  if (dates[0] !== todayStr) {
    cursor.setDate(cursor.getDate() - 1);
  }

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

  const [selectedConnections, setSelectedConnections] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'habit',
    privacy: 'connections',
    frequency: 'daily',
    targetDate: '',
  });

  const [logNote, setLogNote] = useState('');
  const [logProgress, setLogProgress] = useState(1);

  async function loadAll() {
    setLoading(true);

    try {
      const [a, i, n, c] = await Promise.all([
        getFoguinhoActivities(),
        getFoguinhoInvitations(),
        getNotifications(),
        getConnections(),
      ]);

      setActivities(a);
      setInvitations(i);
      setNotifications(n);
      setConnections(c.filter((x) => x.status === 'accepted'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const unread = notifications.filter((n) => !n.read_at).length;

  const pendingConnections = connections.length;

  function resetForm() {
    setForm({
      title: '',
      description: '',
      type: 'habit',
      privacy: 'connections',
      frequency: 'daily',
      targetDate: '',
    });

    setSelectedConnections([]);
  }

  function toggleConnection(userId) {
    setSelectedConnections((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }

      return [...current, userId];
    });
  }

  function selectAllConnections() {
    setSelectedConnections(connections.map((connection) => connection.user_id));
  }

  function clearAllConnections() {
    setSelectedConnections([]);
  }

  async function create(event) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (form.privacy === 'connections' && selectedConnections.length === 0) {
      setError(
        'Selecione pelo menos uma conexão para compartilhar o Foguinho.',
      );
      return;
    }

    try {
      await createFoguinhoActivity({
        ...form,
        selectedUserIds:
          form.privacy === 'connections' ? selectedConnections : [],
      });

      resetForm();

      setShowForm(false);

      setMessage(
        form.privacy === 'connections'
          ? `🔥 Foguinho criado e convite enviado para ${selectedConnections.length} conexão(ões).`
          : '🔥 Foguinho privado criado.',
      );

      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function respond(invitation, status) {
    try {
      await respondFoguinhoInvitation(invitation.id, status);

      setMessage(
        status === 'accepted' ? 'Convite aceito.' : 'Convite recusado.',
      );

      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function logToday(activity) {
    try {
      await logFoguinhoActivity(activity.id, {
        date: today(),
        note: logNote,
        progress: logProgress,
      });

      setLogNote('');
      setLogProgress(1);

      setMessage(`🔥 Registro feito em “${activity.title}”.`);

      await loadAll();

      if (selected?.id === activity.id) {
        await openHistory(activity);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function openHistory(activity) {
    try {
      const logs = await getFoguinhoHistory(activity.id);

      setHistory((h) => ({
        ...h,
        [activity.id]: logs,
      }));

      setSelected(activity);
    } catch (err) {
      setError(err.message);
    }
  }

  async function invite(activity, userId) {
    try {
      await inviteFoguinhoMember(activity.id, userId);

      setMessage('Convite enviado para a atividade.');

      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function readNotification(notification) {
    if (!notification.read_at) {
      try {
        await markNotificationRead(notification.id);
        await loadAll();
      } catch (err) {
        setError(err.message);
      }
    }
  }

  const selectedLogs = selected ? history[selected.id] || [] : [];

  const memberIds = [...new Set(selectedLogs.map((log) => log.user_id))];

  const dates = [
    ...new Set(selectedLogs.map((log) => log.log_date?.slice(0, 10))),
  ]
    .sort()
    .reverse();

  let groupStreak = 0;

  if (memberIds.length && dates.length) {
    let cursor = new Date(today() + 'T00:00:00');

    if (dates[0] !== today()) {
      cursor.setDate(cursor.getDate() - 1);
    }

    for (;;) {
      const dateKey = cursor.toISOString().slice(0, 10);

      const allDone = memberIds.every((id) =>
        selectedLogs.some(
          (log) => log.user_id === id && log.log_date?.slice(0, 10) === dateKey,
        ),
      );

      if (!allDone) break;

      groupStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const myStreak = selectedLogs.length
    ? streakForLogs(selectedLogs, currentUser.id)
    : 0;

  const memberNames = useMemo(
    () => [
      ...new Map(selectedLogs.map((log) => [log.user_id, log.name])).values(),
    ],
    [selectedLogs],
  );

  return (
    <section className='page-section foguinho-page'>
      <div className='section-heading'>
        <div>
          <span className='eyebrow'>FASE 3 · SOCIAL</span>

          <h2>🔥 Foguinho</h2>

          <p>
            Faça atividades junto com outras pessoas, cada uma registrando seu
            próprio progresso.
          </p>
        </div>

        <button
          type='button'
          onClick={() => {
            setShowForm((v) => !v);
            setError('');
            setMessage('');

            if (!showForm) {
              resetForm();
            }
          }}
        >
          {showForm ? 'Fechar' : '+ Criar atividade'}
        </button>
      </div>

      {error && (
        <p className='auth-error' role='alert'>
          {error}
        </p>
      )}

      {message && (
        <p className='auth-message' role='status'>
          {message}
        </p>
      )}

      <div className='foguinho-stats'>
        <div className='card'>
          <strong>{activities.length}</strong>
          <span>Atividades</span>
        </div>

        <div className='card'>
          <strong>{pendingConnections}</strong>
          <span>Conexões</span>
        </div>

        <div className='card'>
          <strong>{invitations.length}</strong>
          <span>Convites</span>
        </div>

        <div className='card'>
          <strong>{unread}</strong>
          <span>Notificações</span>
        </div>
      </div>

      {showForm && (
        <form className='card foguinho-form' onSubmit={create}>
          <h3>🔥 Nova atividade compartilhada</h3>

          <div className='form-grid'>
            <label>
              Título
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder='Ex.: Estudar Java todos os dias'
              />
            </label>

            <label>
              Tipo
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                  })
                }
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Compartilhar com
              <select
                value={form.privacy}
                onChange={(e) => {
                  const privacy = e.target.value;

                  setForm({
                    ...form,
                    privacy,
                  });

                  if (privacy === 'private') {
                    setSelectedConnections([]);
                  }
                }}
              >
                {Object.entries(privacyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Frequência
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    frequency: e.target.value,
                  })
                }
              >
                <option value='daily'>Diária</option>
                <option value='weekly'>Semanal</option>
                <option value='custom'>Personalizada</option>
                <option value='once'>Uma vez</option>
              </select>
            </label>

            <label>
              Data limite
              <input
                type='date'
                value={form.targetDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetDate: e.target.value,
                  })
                }
              />
            </label>

            <label className='full'>
              Descrição
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder='Como vocês vão cumprir essa atividade?'
              />
            </label>
          </div>

          {form.privacy === 'connections' && (
            <div className='foguinho-share-selector'>
              <div className='foguinho-share-header'>
                <div>
                  <h4>👥 Escolha as conexões</h4>

                  <p>Somente as pessoas selecionadas receberão o convite.</p>
                </div>

                <div className='connection-actions'>
                  <button
                    type='button'
                    className='ghost'
                    onClick={selectAllConnections}
                    disabled={connections.length === 0}
                  >
                    Selecionar todas
                  </button>

                  <button
                    type='button'
                    className='ghost'
                    onClick={clearAllConnections}
                    disabled={selectedConnections.length === 0}
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {connections.length === 0 ? (
                <div className='foguinho-empty-connections'>
                  <p>Você ainda não possui conexões aceitas.</p>

                  <small>
                    Adicione conexões antes de criar um Foguinho compartilhado.
                  </small>
                </div>
              ) : (
                <div className='foguinho-connections-grid'>
                  {connections.map((connection) => {
                    const checked = selectedConnections.includes(
                      connection.user_id,
                    );

                    return (
                      <label
                        className={`foguinho-connection-option ${
                          checked ? 'selected' : ''
                        }`}
                        key={connection.user_id}
                      >
                        <input
                          type='checkbox'
                          checked={checked}
                          onChange={() => toggleConnection(connection.user_id)}
                        />

                        <span className='foguinho-connection-info'>
                          <strong>{connection.name}</strong>

                          {connection.username && (
                            <small>@{connection.username}</small>
                          )}
                        </span>

                        <span className='foguinho-check'>
                          {checked ? '✓' : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {connections.length > 0 && (
                <small className='foguinho-selected-count'>
                  {selectedConnections.length} de {connections.length}{' '}
                  conexão(ões) selecionada(s)
                </small>
              )}
            </div>
          )}

          {form.privacy === 'private' && (
            <div className='foguinho-private-info'>
              🔒 Esta atividade será somente sua. Nenhuma conexão receberá
              convite.
            </div>
          )}

          <button type='submit'>
            {form.privacy === 'connections'
              ? '🔥 Criar e enviar convites'
              : '🔥 Criar Foguinho'}
          </button>
        </form>
      )}

      {invitations.length > 0 && (
        <div className='card'>
          <h3>📨 Convites recebidos</h3>

          <div className='foguinho-list'>
            {invitations.map((invitation) => (
              <div className='foguinho-row' key={invitation.id}>
                <div>
                  <strong>{invitation.title}</strong>

                  <small>
                    {invitation.inviter_name} · {typeLabels[invitation.type]}
                  </small>
                </div>

                <div className='connection-actions'>
                  <button
                    type='button'
                    onClick={() => respond(invitation, 'accepted')}
                  >
                    Aceitar
                  </button>

                  <button
                    type='button'
                    className='ghost'
                    onClick={() => respond(invitation, 'rejected')}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='card'>
        <h3>🔥 Minhas atividades</h3>

        {loading ? (
          <p>Carregando...</p>
        ) : activities.length === 0 ? (
          <p>Você ainda não participa de nenhuma atividade compartilhada.</p>
        ) : (
          <div className='foguinho-cards'>
            {activities.map((activity) => (
              <article className='foguinho-card' key={activity.id}>
                <div className='foguinho-card-top'>
                  <span>{typeLabels[activity.type]}</span>

                  <span>
                    {privacyLabels[activity.privacy] || activity.privacy}
                  </span>
                </div>

                <h3>{activity.title}</h3>

                <p>{activity.description || 'Sem descrição.'}</p>

                <small>
                  👥 {activity.member_count} participante(s) ·{' '}
                  {activity.frequency}
                </small>

                <div className='foguinho-card-actions'>
                  <div className='foguinho-log-form'>
                    <input
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      placeholder={
                        activity.type === 'goal'
                          ? 'O que avançou hoje?'
                          : 'Observação (opcional)'
                      }
                    />

                    <input
                      type='number'
                      min='1'
                      value={logProgress}
                      onChange={(e) =>
                        setLogProgress(Math.max(1, Number(e.target.value) || 1))
                      }
                      aria-label='Progresso do registro'
                    />

                    <button
                      type='button'
                      onClick={() => logToday(activity)}
                      disabled={activity.today_done}
                    >
                      {activity.today_done ? '✅ Feito hoje' : '🔥 Registrar'}
                    </button>
                  </div>

                  <button
                    type='button'
                    className='ghost'
                    onClick={() => openHistory(activity)}
                  >
                    Histórico
                  </button>
                </div>

                {activity.my_role === 'owner' &&
                  activity.privacy !== 'private' &&
                  connections.length > 0 && (
                    <label className='invite-select'>
                      Convidar outra conexão
                      <select
                        defaultValue=''
                        onChange={(e) => {
                          if (e.target.value) {
                            invite(activity, e.target.value);
                          }

                          e.target.value = '';
                        }}
                      >
                        <option value=''>Selecione...</option>

                        {connections.map((connection) => (
                          <option
                            key={connection.user_id}
                            value={connection.user_id}
                          >
                            {connection.name}
                            {connection.username
                              ? ` (@${connection.username})`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
              </article>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className='card foguinho-history'>
          <div className='section-heading'>
            <div>
              <h3>📜 {selected.title}</h3>

              <p>
                {memberNames.length || selected.member_count} participante(s)
                com registros.
              </p>
            </div>

            <button
              type='button'
              className='ghost'
              onClick={() => setSelected(null)}
            >
              Fechar
            </button>
          </div>

          <div className='foguinho-stats'>
            <div className='card'>
              <strong>{myStreak}</strong>
              <span>Meu streak</span>
            </div>

            <div className='card'>
              <strong>{groupStreak}</strong>
              <span>Streak do grupo</span>
            </div>

            <div className='card'>
              <strong>{selectedLogs.length}</strong>
              <span>Registros</span>
            </div>
          </div>

          {selectedLogs.length === 0 ? (
            <p>Nenhum registro ainda.</p>
          ) : (
            <div className='foguinho-list'>
              {selectedLogs.map((log) => (
                <div className='foguinho-row' key={log.id}>
                  <div>
                    <strong>{log.name}</strong>

                    <small>
                      {new Date(log.log_date + 'T00:00:00').toLocaleDateString(
                        'pt-BR',
                      )}{' '}
                      · {log.note || 'Atividade concluída'}
                    </small>
                  </div>

                  <strong>+{log.progress}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className='card'>
        <h3>🔔 Notificações</h3>

        {notifications.length === 0 ? (
          <p>Nenhuma notificação.</p>
        ) : (
          <div className='foguinho-list'>
            {notifications.slice(0, 10).map((notification) => (
              <button
                type='button'
                className={`notification-row ${
                  notification.read_at ? '' : 'unread'
                }`}
                key={notification.id}
                onClick={() => readNotification(notification)}
              >
                <div>
                  <strong>{notification.title}</strong>

                  <small>{notification.message}</small>
                </div>

                <small>
                  {new Date(notification.created_at).toLocaleString('pt-BR')}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
