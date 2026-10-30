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
      setConnections(data);
    } catch (err) {
      console.error('Erro ao carregar conexões:', err);
      setError(err.message || 'Erro ao carregar conexões.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /*
   * PESQUISA
   *
   * O backend deve retornar apenas correspondências EXATAS.
   *
   * Exemplos:
   * "ab"  -> nada
   * "abc" -> aparece abc
   * "cb"  -> nada
   * "cba" -> aparece cba
   *
   * O frontend também exige pelo menos 2 caracteres.
   */
  useEffect(() => {
    const term = query.trim();

    // Menos de 2 caracteres: não pesquisa
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);
      setError('');

      try {
        const users = await searchUsers(term);

        if (!cancelled) {
          setResults(Array.isArray(users) ? users : []);
        }
      } catch (err) {
        console.error('Erro ao pesquisar usuários:', err);

        if (!cancelled) {
          setResults([]);
          setError(err.message || 'Erro ao pesquisar usuários.');
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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
      console.error('Erro ao enviar convite:', err);
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
      console.error('Erro ao atualizar conexão:', err);
      setError(err.message || 'Erro ao atualizar conexão.');
    }
  }

  function handleSearchChange(event) {
    setQuery(event.target.value);
    setError('');
    setMessage('');
  }

  return (
    <section className='page-section connections-page'>
      {/* CABEÇALHO */}
      <div className='section-heading'>
        <div>
          <span className='eyebrow'>SOCIAL</span>

          <h2>👥 Conexões</h2>

          <p>Conecte-se com outras contas para preparar o Foguinho.</p>
        </div>
      </div>

      {/* PESQUISA */}
      <div className='card'>
        <h3>Adicionar pessoa</h3>

        <p>Digite o nome completo ou o @usuário completo.</p>

        <input
          type='text'
          value={query}
          onChange={handleSearchChange}
          placeholder='Digite o nome completo...'
          autoComplete='off'
        />

        {/* MENOS DE 2 CARACTERES */}
        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className='search-hint'>Digite pelo menos 2 caracteres.</p>
        )}

        {/* PESQUISANDO */}
        {searching && <p className='search-hint'>Pesquisando...</p>}

        {/* RESULTADOS */}
        {!searching && results.length > 0 && (
          <div className='connection-search-results'>
            {results.map((user) => (
              <div className='connection-row' key={user.id}>
                <div>
                  <strong>{user.name}</strong>

                  <small>
                    {user.username ? `@${user.username}` : 'Sem @usuário'}
                  </small>
                </div>

                <button type='button' onClick={() => invite(user)}>
                  + Conectar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* NENHUM RESULTADO */}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <p className='search-hint'>Nenhum usuário encontrado.</p>
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
            {connections.map((connection) => (
              <div className='connection-row' key={connection.id}>
                <div>
                  <strong>{connection.name}</strong>

                  <small>
                    {connection.username
                      ? `@${connection.username}`
                      : 'Sem @usuário'}

                    {' · '}

                    {statusLabel(connection.status)}
                  </small>
                </div>

                {connection.status === 'pending' &&
                  Boolean(connection.is_receiver) && (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
