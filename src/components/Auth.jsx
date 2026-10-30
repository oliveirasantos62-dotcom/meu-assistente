import { useState } from 'react';
import { loginUser, registerUser } from '../services/api.js';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || (mode === 'signup' && !name.trim())) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setError('Use uma senha com pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const user = mode === 'signup'
        ? await registerUser({ name: name.trim(), username: username.trim(), email: normalizedEmail, password })
        : await loginUser({ email: normalizedEmail, password });
      onLogin?.(user);
    } catch (err) {
      setError(err.message || 'Não foi possível autenticar.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === 'login' ? 'signup' : 'login'));
    setError('');
    setMessage('');
  }

  return (
    <main className='auth-page'>
      <form className='auth-card' onSubmit={handleSubmit}>
        <h1>Meu Assistente</h1>
        <p>{mode === 'login' ? 'Entre para acessar seus dados.' : 'Crie sua conta para começar.'}</p>

        {mode === 'signup' && (
          <>
            <label htmlFor='auth-name'>Nome</label>
            <input id='auth-name' type='text' autoComplete='name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Seu nome' required />
            <label htmlFor='auth-username'>Nome de usuário</label>
            <input id='auth-username' type='text' autoComplete='username' value={username} onChange={(e) => setUsername(e.target.value)} placeholder='@seuusuario' />
          </>
        )}

        <label htmlFor='auth-email'>E-mail</label>
        <input id='auth-email' type='email' autoComplete='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='voce@exemplo.com' required />
        <label htmlFor='auth-password'>Senha</label>
        <input id='auth-password' type='password' autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Mínimo de 6 caracteres' minLength={6} required />

        {error && <p role='alert' className='auth-error'>{error}</p>}
        {message && <p role='status' className='auth-message'>{message}</p>}

        <button type='submit' disabled={loading}>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <button type='button' className='auth-switch' onClick={switchMode}>
          {mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </main>
  );
}
