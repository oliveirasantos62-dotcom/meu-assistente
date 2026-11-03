import React, { useEffect, useState } from 'react';
import { updateProfile } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Perfil({ currentUser, onUserUpdated }) {
  const [name, setName] = useState(currentUser?.name || '');

  const [username, setUsername] = useState(currentUser?.username || '');

  const { language, setLanguage, languages, t } = useLanguage();

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
      setError(t('profile.nameRequired'));
      return;
    }

    /*
     * Validação do username
     */
    if (cleanUsername && !/^[a-z0-9._]{3,30}$/.test(cleanUsername)) {
      setError(
        t('profile.usernameInvalid'),
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

      setMessage(t('profile.saved'));
    } catch (err) {
      setError(err.message || t('profile.updateError'));
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
            <span className='profile-eyebrow'>{t('profile.account')}</span>

            <h2>{t('profile.title')}</h2>

            <p>{t('profile.description')}</p>
          </div>
        </div>

        {/* =================================================
            FORMULÁRIO
        ================================================== */}

        <form onSubmit={handleSubmit} className='profile-form'>
          {/* NOME */}

          <div className='profile-field'>
            <label htmlFor='profile-name'>{t('profile.name')}</label>

            <input
              id='profile-name'
              type='text'
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              autoComplete='name'
              placeholder={t('profile.namePlaceholder')}
              required
            />
          </div>

          {/* USERNAME */}

          <div className='profile-field'>
            <label htmlFor='profile-username'>{t('profile.username')}</label>

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
              {t('profile.usernameHelp')}
            </small>
          </div>

          {/* E-MAIL */}

          <div className='profile-field'>
            <label htmlFor='profile-email'>{t('profile.email')}</label>

            <input
              id='profile-email'
              type='email'
              value={currentUser?.email || ''}
              disabled
            />

            <small className='profile-help'>
              {t('profile.emailHelp')}
            </small>
          </div>

          {/* IDIOMA */}

          <div className='profile-field'>
            <label htmlFor='profile-language'>{t('profile.language')}</label>

            <select
              id='profile-language'
              className='profile-language-select'
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.label}
                </option>
              ))}
            </select>

            <small className='profile-help'>{t('profile.languageHelp')}</small>
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
              {loading ? t('profile.saving') : t('profile.save')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
