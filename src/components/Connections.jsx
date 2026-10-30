import { useEffect, useState } from 'react';
import {
  getConnections,
  searchUsers,
  sendConnection,
  updateConnection,
} from '../services/api';

function statusLabel(status) {
  return (
    {
      pending: 'Pendente',
      accepted: 'Conectado',
      rejected: 'Recusado',
      blocked: 'Bloqueado',
    }[status] || status
  );
}

export default function Connections() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const data = await getConnections();
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar conexões.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setError('');

      try {
        const users = await searchUsers(term);
        setResults(Array.isArray(users) ? users : []);
      } catch (err) {
        setResults([]);
        setError(err.message || 'Erro ao pesquisar usuários.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function invite(user) {
    setError('');
    setMessage('');

    try {
      await sendConnection(user.id);

      setMessage(`Convite enviado para ${user.name}.`);
      setQuery('');
      setResults([]);

      await load();
    } catch (err) {
      setError(err.message || 'Erro ao enviar convite.');
    }
  }

  async function changeStatus(connection, status) {
    setError('');
    setMessage('');

    try {
      await updateConnection(connection.id, status);

      if (status === 'accepted') {
        setMessage('Conexão aceita.');
      } else if (status === 'rejected') {
        setMessage('Convite recusado.');
      } else if (status === 'blocked') {
        setMessage('Usuário bloqueado.');
      } else {
        setMessage('Convite atualizado.');
      }

      await load();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar conexão.');
    }
  }

  return (
    <section className='page-section connections-page'>
      <div className='section-heading'>
        <div>
          <span className='eyebrow'>SOCIAL</span>

          <h2>👥 Conexões</h2>

          <p>Conecte-se com outras contas para preparar o Foguinho.</p>
        </div>
      </div>

      {/* PESQUISA DE USUÁRIOS */}
      <div className='card'>
        <h3>Adicionar pessoa</h3>

        <p>Pesquise pelo nome completo ou @usuário.</p>

        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Digite o nome ou @usuário...'
          autoComplete='off'
        />

        {searching && (
          <p className='connection-search-status'>Pesquisando...</p>
        )}

        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <p className='connection-search-status'>Nenhum usuário encontrado.</p>
        )}

        {results.length > 0 && (
          <div className='connection-search-results'>
            {results.map((user) => (
              <div className='connection-row' key={user.id}>
                <div className='connection-user-info'>
                  <strong>{user.name}</strong>

                  <small>
                    {user.username ? `@${user.username}` : 'Sem @usuário'}
                  </small>
                </div>

                <button
                  type='button'
                  className='study-action-button'
                  onClick={() => invite(user)}
                >
                  + Conectar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MENSAGENS */}
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

      {/* CONEXÕES */}
      <div className='card'>
        <div className='section-heading'>
          <div>
            <h3>Minhas conexões</h3>

            <p>Convites recebidos e conexões aceitas.</p>
          </div>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : connections.length === 0 ? (
          <p>Nenhuma conexão ainda.</p>
        ) : (
          <div className='connections-list'>
            {connections.map((connection) => {
              /*
               * MySQL pode retornar esse campo como:
               * 1
               * "1"
               * true
               *
               * Por isso usamos Number().
               */
              const isReceiver = Number(connection.is_receiver) === 1;

              const isPending = connection.status === 'pending';

              return (
                <div className='connection-row' key={connection.id}>
                  <div className='connection-user-info'>
                    <strong>{connection.name}</strong>

                    <small>
                      {connection.username
                        ? `@${connection.username}`
                        : 'Sem @usuário'}

                      {' · '}

                      {statusLabel(connection.status)}
                    </small>
                  </div>

                  {/* CONVITE RECEBIDO */}
                  {isPending && isReceiver && (
                    <div className='connection-actions'>
                      <button
                        type='button'
                        onClick={() => changeStatus(connection, 'accepted')}
                      >
                        Aceitar
                      </button>

                      <button
                        type='button'
                        className='ghost'
                        onClick={() => changeStatus(connection, 'rejected')}
                      >
                        Recusar
                      </button>
                    </div>
                  )}

                  {/* CONVITE ENVIADO */}
                  {isPending && !isReceiver && (
                    <span className='connection-pending-label'>
                      Convite enviado
                    </span>
                  )}

                  {/* CONEXÃO ACEITA */}
                  {connection.status === 'accepted' && (
                    <span className='connection-connected-label'>
                      ✓ Conectado
                    </span>
                  )}

                  {/* CONVITE RECUSADO */}
                  {connection.status === 'rejected' && (
                    <span className='connection-rejected-label'>Recusado</span>
                  )}

                  {/* BLOQUEADO */}
                  {connection.status === 'blocked' && (
                    <span className='connection-blocked-label'>Bloqueado</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
