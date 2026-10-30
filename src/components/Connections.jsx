import { useEffect, useState } from 'react';
import { getConnections, searchUsers, sendConnection, updateConnection } from '../services/api';

function statusLabel(status) {
  return ({ pending: 'Pendente', accepted: 'Conectado', rejected: 'Recusado', blocked: 'Bloqueado' })[status] || status;
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
    try { setConnections(await getConnections()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setResults([]); return undefined; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try { setResults(await searchUsers(term)); }
      catch (err) { setError(err.message); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function invite(user) {
    setError(''); setMessage('');
    try {
      await sendConnection(user.id);
      setMessage(`Convite enviado para ${user.name}.`);
      setQuery(''); setResults([]);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function changeStatus(connection, status) {
    setError(''); setMessage('');
    try {
      await updateConnection(connection.id, status);
      setMessage(status === 'accepted' ? 'Conexão aceita.' : 'Convite atualizado.');
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <section className='page-section connections-page'>
      <div className='section-heading'>
        <div><span className='eyebrow'>SOCIAL</span><h2>👥 Conexões</h2><p>Conecte-se com outras contas para preparar o Foguinho.</p></div>
      </div>

      <div className='card'>
        <h3>Adicionar pessoa</h3>
        <p>Pesquise pelo nome ou @usuário.</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Digite pelo menos 2 caracteres...' />
        {searching && <p>Pesquisando...</p>}
        {results.length > 0 && (
          <div className='connection-search-results'>
            {results.map((user) => (
              <div className='connection-row' key={user.id}>
                <div><strong>{user.name}</strong><small>{user.username ? `@${user.username}` : 'Sem @usuário'}</small></div>
                <button type='button' onClick={() => invite(user)}>+ Conectar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className='auth-error' role='alert'>{error}</p>}
      {message && <p className='auth-message' role='status'>{message}</p>}

      <div className='card'>
        <div className='section-heading'><div><h3>Minhas conexões</h3><p>Convites recebidos e conexões aceitas.</p></div></div>
        {loading ? <p>Carregando...</p> : connections.length === 0 ? <p>Nenhuma conexão ainda.</p> : (
          <div className='connections-list'>
            {connections.map((connection) => (
              <div className='connection-row' key={connection.id}>
                <div>
                  <strong>{connection.name}</strong>
                  <small>{connection.username ? `@${connection.username}` : 'Sem @usuário'} · {statusLabel(connection.status)}</small>
                </div>
                {connection.status === 'pending' && Boolean(connection.is_receiver) && (
                  <div className='connection-actions'>
                    <button type='button' onClick={() => changeStatus(connection, 'accepted')}>Aceitar</button>
                    <button type='button' className='ghost' onClick={() => changeStatus(connection, 'rejected')}>Recusar</button>
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
