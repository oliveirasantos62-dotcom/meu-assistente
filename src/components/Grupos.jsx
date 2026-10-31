import React, { useEffect, useState } from 'react';
import {
  getGroups,
  createGroup,
  getGroupMembers,
  inviteGroupMember,
  getGroupInvitations,
  respondGroupInvitation,
  updateGroupMember,
  getGroupActivities,
  createGroupActivity,
  logGroupActivity,
  getGroupActivityHistory,
  getConnections,
  deleteGroup,
} from '../services/api';

const types = {
  habit: '🔥 Hábito',
  study: '📚 Estudo',
  reading: '📖 Leitura',
  goal: '🎯 Meta',
  project: '📁 Projeto',
  custom: '✨ Atividade',
};

const today = () => new Date().toISOString().slice(0, 10);

export default function Grupos() {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [history, setHistory] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    privacy: 'connections',
  });

  const [activity, setActivity] = useState({
    title: '',
    description: '',
    type: 'habit',
    frequency: 'daily',
    targetDate: '',
  });

  async function load() {
    try {
      setError('');

      const [g, i, c] = await Promise.all([
        getGroups(),
        getGroupInvitations(),
        getConnections(),
      ]);

      setGroups(g);
      setInvitations(i);
      setConnections(c.filter((x) => x.status === 'accepted'));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openGroup(g) {
    try {
      setError('');

      const [m, a] = await Promise.all([
        getGroupMembers(g.id),
        getGroupActivities(g.id),
      ]);

      setSelected(g);
      setMembers(m);
      setActivities(a);
      setHistory([]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function create(e) {
    e.preventDefault();

    try {
      setError('');

      await createGroup(form);

      setForm({
        name: '',
        description: '',
        privacy: 'connections',
      });

      setShowCreate(false);
      setMessage('Grupo criado.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeGroup(group) {
    if (!group || group.my_role !== 'owner') {
      setError('Somente o proprietário pode excluir este grupo.');
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o grupo "${group.name}"?\n\nEssa ação não poderá ser desfeita.`,
    );

    if (!confirmed) return;

    try {
      setError('');
      setMessage('');

      await deleteGroup(group.id);

      setSelected(null);
      setMembers([]);
      setActivities([]);
      setHistory([]);

      setMessage('Grupo excluído com sucesso.');

      await load();
    } catch (e) {
      setError(e.message || 'Não foi possível excluir o grupo.');
    }
  }

  async function respond(inv, status) {
    try {
      setError('');

      await respondGroupInvitation(inv.id, status);

      setMessage(
        status === 'accepted' ? 'Convite aceito.' : 'Convite recusado.',
      );

      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function invite(userId) {
    try {
      setError('');

      await inviteGroupMember(selected.id, userId);

      setMessage('Convite enviado.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function addActivity(e) {
    e.preventDefault();

    try {
      setError('');

      await createGroupActivity(selected.id, activity);

      setActivity({
        title: '',
        description: '',
        type: 'habit',
        frequency: 'daily',
        targetDate: '',
      });

      setShowActivity(false);
      setMessage('Atividade criada.');

      const a = await getGroupActivities(selected.id);
      setActivities(a);
    } catch (e) {
      setError(e.message);
    }
  }

  async function log(a) {
    try {
      setError('');

      await logGroupActivity(selected.id, a.id, {
        date: today(),
        note: '',
        progress: 1,
      });

      setMessage('Registro feito.');

      const list = await getGroupActivities(selected.id);
      setActivities(list);
    } catch (e) {
      setError(e.message);
    }
  }

  async function showHistory(a) {
    try {
      setError('');

      setHistory(await getGroupActivityHistory(selected.id, a.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function promote(member, role) {
    try {
      setError('');

      await updateGroupMember(selected.id, member.id, { role });

      setMembers(await getGroupMembers(selected.id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className='page-section'>
      <div className='section-heading'>
        <div>
          <span className='eyebrow'>FASE 6 · SOCIAL</span>
          <h2>👥 Grupos</h2>
          <p>
            Crie comunidades para estudar, manter hábitos, ler e executar
            projetos juntos.
          </p>
        </div>

        <button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Fechar' : '+ Criar grupo'}
        </button>
      </div>

      {error && <p className='auth-error'>{error}</p>}
      {message && <p className='auth-message'>{message}</p>}

      {showCreate && (
        <form className='card' onSubmit={create}>
          <h3>Novo grupo</h3>

          <div className='form-grid'>
            <label>
              Nome
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Privacidade
              <select
                value={form.privacy}
                onChange={(e) => setForm({ ...form, privacy: e.target.value })}
              >
                <option value='connections'>Conexões</option>
                <option value='private'>Privado</option>
              </select>
            </label>

            <label className='full'>
              Descrição
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
          </div>

          <button type='submit'>Criar grupo</button>
        </form>
      )}

      {invitations.length > 0 && (
        <div className='card'>
          <h3>📨 Convites de grupos</h3>

          {invitations.map((i) => (
            <div className='foguinho-row' key={i.id}>
              <div>
                <strong>{i.group_name}</strong>
                <small>
                  {i.inviter_name} · {i.description || 'Sem descrição'}
                </small>
              </div>

              <div className='connection-actions'>
                <button onClick={() => respond(i, 'accepted')}>Aceitar</button>

                <button
                  className='ghost'
                  onClick={() => respond(i, 'rejected')}
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!selected && (
        <div className='foguinho-cards'>
          {groups.map((g) => (
            <article className='foguinho-card' key={g.id}>
              <div className='foguinho-card-top'>
                <span>👥 {g.member_count} membros</span>

                <span>
                  {g.privacy === 'private' ? '🔒 Privado' : '🌐 Conexões'}
                </span>
              </div>

              <h3>{g.name}</h3>

              <p>{g.description || 'Sem descrição.'}</p>

              <small>
                📌 {g.activity_count} atividade(s) · {g.my_role}
              </small>

              <div className='foguinho-card-actions'>
                <button onClick={() => openGroup(g)}>Abrir grupo</button>

                {g.my_role === 'owner' && (
                  <button
                    type='button'
                    className='ghost'
                    onClick={() => removeGroup(g)}
                  >
                    🗑️ Excluir grupo
                  </button>
                )}
              </div>
            </article>
          ))}

          {groups.length === 0 && (
            <div className='card'>
              <p>Você ainda não participa de nenhum grupo.</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className='card'>
            <div className='section-heading'>
              <div>
                <span className='eyebrow'>GRUPO</span>
                <h2>👥 {selected.name}</h2>
                <p>{selected.description || 'Sem descrição.'}</p>
              </div>

              <div className='connection-actions'>
                <button className='ghost' onClick={() => setSelected(null)}>
                  Voltar
                </button>

                {selected.my_role === 'owner' && (
                  <button
                    type='button'
                    className='ghost'
                    onClick={() => removeGroup(selected)}
                  >
                    🗑️ Excluir grupo
                  </button>
                )}
              </div>
            </div>

            <div className='foguinho-stats'>
              <div className='card'>
                <strong>
                  {members.filter((m) => m.status === 'accepted').length}
                </strong>
                <span>Membros</span>
              </div>

              <div className='card'>
                <strong>{activities.length}</strong>
                <span>Atividades</span>
              </div>
            </div>
          </div>

          <div className='card'>
            <div className='section-heading'>
              <h3>👤 Membros</h3>
            </div>

            <div className='foguinho-list'>
              {members.map((m) => (
                <div className='foguinho-row' key={m.id}>
                  <div>
                    <strong>{m.name}</strong>
                    <small>
                      @{m.username || 'sem-username'} · {m.role}
                    </small>
                  </div>

                  {selected.my_role === 'owner' && m.role !== 'owner' && (
                    <select
                      value={m.role}
                      onChange={(e) => promote(m, e.target.value)}
                    >
                      <option value='member'>Membro</option>
                      <option value='admin'>Admin</option>
                    </select>
                  )}
                </div>
              ))}
            </div>

            {(selected.my_role === 'owner' || selected.my_role === 'admin') &&
              connections.length > 0 && (
                <label className='invite-select'>
                  Convidar conexão
                  <select
                    defaultValue=''
                    onChange={(e) => {
                      if (e.target.value) invite(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value=''>Selecione...</option>

                    {connections.map((c) => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.name} {c.username ? `(@${c.username})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}
          </div>

          <div className='card'>
            <div className='section-heading'>
              <h3>🔥 Atividades coletivas</h3>

              <button onClick={() => setShowActivity((v) => !v)}>
                {showActivity ? 'Fechar' : '+ Atividade'}
              </button>
            </div>

            {showActivity && (
              <form onSubmit={addActivity} className='foguinho-form'>
                <div className='form-grid'>
                  <label>
                    Título
                    <input
                      required
                      value={activity.title}
                      onChange={(e) =>
                        setActivity({ ...activity, title: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Tipo
                    <select
                      value={activity.type}
                      onChange={(e) =>
                        setActivity({ ...activity, type: e.target.value })
                      }
                    >
                      {Object.entries(types).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Frequência
                    <select
                      value={activity.frequency}
                      onChange={(e) =>
                        setActivity({ ...activity, frequency: e.target.value })
                      }
                    >
                      <option value='daily'>Diária</option>
                      <option value='weekly'>Semanal</option>
                      <option value='once'>Uma vez</option>
                    </select>
                  </label>

                  <label>
                    Data limite
                    <input
                      type='date'
                      value={activity.targetDate}
                      onChange={(e) =>
                        setActivity({ ...activity, targetDate: e.target.value })
                      }
                    />
                  </label>

                  <label className='full'>
                    Descrição
                    <textarea
                      value={activity.description}
                      onChange={(e) =>
                        setActivity({
                          ...activity,
                          description: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <button type='submit'>Criar atividade</button>
              </form>
            )}

            {activities.map((a) => (
              <div className='foguinho-row' key={a.id}>
                <div>
                  <strong>
                    {types[a.type]} · {a.title}
                  </strong>
                  <small>
                    {a.description || 'Sem descrição.'} · criada por{' '}
                    {a.creator_name}
                  </small>
                </div>

                <div className='connection-actions'>
                  <button
                    disabled={Number(a.done_today) > 0}
                    onClick={() => log(a)}
                  >
                    {Number(a.done_today) > 0
                      ? '✅ Feito hoje'
                      : '🔥 Registrar'}
                  </button>

                  <button className='ghost' onClick={() => showHistory(a)}>
                    Histórico
                  </button>
                </div>
              </div>
            ))}

            {activities.length === 0 && <p>Nenhuma atividade criada.</p>}
          </div>

          {history.length > 0 && (
            <div className='card'>
              <h3>📜 Histórico</h3>

              {history.map((h) => (
                <div className='foguinho-row' key={h.id}>
                  <div>
                    <strong>{h.name}</strong>
                    <small>
                      {new Date(h.log_date + 'T00:00:00').toLocaleDateString(
                        'pt-BR',
                      )}
                      {' · '}
                      {h.note || 'Registro coletivo'}
                    </small>
                  </div>

                  <strong>+{h.progress}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
