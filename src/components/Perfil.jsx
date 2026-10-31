import React, { useEffect, useState } from 'react';
import { updateProfile } from '../services/api';

export default function Perfil({ currentUser, onUserUpdated }) {
  const [name, setName] = useState(currentUser?.name || '');

  const [username, setUsername] = useState(currentUser?.username || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(currentUser?.name || '');
    setUsername(currentUser?.username || '');
  }, [currentUser?.id, currentUser?.name, currentUser?.username]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');

    const cleanName = name.trim();

    let cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.startsWith('@')) {
      cleanUsername = cleanUsername.slice(1);
    }

    /*
     * Validação do nome
     */
    if (!cleanName) {
      setError('Informe seu nome.');
      return;
    }

    /*
     * Validação do username
     */
    if (cleanUsername && !/^[a-z0-9._]{3,30}$/.test(cleanUsername)) {
      setError(
        'O @ deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto ou underline.',
      );

      return;
    }

    setLoading(true);

    try {
      const user = await updateProfile({
        name: cleanName,
        username: cleanUsername || null,
      });

      /*
       * Atualiza o usuário no App.jsx
       */
      onUserUpdated?.(user);

      /*
       * Atualiza os campos da tela
       */
      setName(user.name || '');
      setUsername(user.username || '');

      setMessage('Perfil atualizado com sucesso.');
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  }

  const avatarLetter = (name || 'U').trim().charAt(0).toUpperCase();

  return (
    <section className='profile-page'>
      <div className='profile-card'>
        {/* =================================================
            CABEÇALHO
        ================================================== */}

        <div className='profile-header'>
          <div className='profile-avatar'>{avatarLetter}</div>

          <div>
            <span className='profile-eyebrow'>MINHA CONTA</span>

            <h2>Perfil</h2>

            <p>
              Altere seu nome e seu @ sem perder conexões, projetos, grupos ou
              Foguinho.
            </p>
          </div>
        </div>

        {/* =================================================
            FORMULÁRIO
        ================================================== */}

        <form onSubmit={handleSubmit} className='profile-form'>
          {/* NOME */}

          <div className='profile-field'>
            <label htmlFor='profile-name'>Nome</label>

            <input
              id='profile-name'
              type='text'
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              autoComplete='name'
              placeholder='Seu nome'
              required
            />
          </div>

          {/* USERNAME */}

          <div className='profile-field'>
            <label htmlFor='profile-username'>Nome de usuário / @</label>

            <div className='username-input'>
              <span>@</span>

              <input
                id='profile-username'
                type='text'
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value.replace(/^@+/, ''))
                }
                maxLength={30}
                placeholder='seuusuario'
                autoComplete='username'
              />
            </div>

            <small className='profile-help'>
              3–30 caracteres: letras, números, ponto ou underline.
            </small>
          </div>

          {/* E-MAIL */}

          <div className='profile-field'>
            <label htmlFor='profile-email'>E-mail</label>

            <input
              id='profile-email'
              type='email'
              value={currentUser?.email || ''}
              disabled
            />

            <small className='profile-help'>
              O e-mail não é alterado nesta tela.
            </small>
          </div>

          {/* MENSAGEM DE ERRO */}

          {error && (
            <div
              className='profile-feedback profile-feedback-error'
              role='alert'
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* MENSAGEM DE SUCESSO */}

          {message && (
            <div
              className='profile-feedback profile-feedback-success'
              role='status'
            >
              <span>✓</span>
              <span>{message}</span>
            </div>
          )}

          {/* AÇÕES */}

          <div className='profile-actions'>
            <button type='submit' className='primary' disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
