import { useState } from 'react';
import { supabase } from '../services/supabase.js';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
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

    if (!normalizedEmail || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Use uma senha com pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        if (data.session && data.user) {
          onLogin?.(data.user);
        } else {
          setMessage(
            'Conta criada! Verifique seu e-mail para confirmar o cadastro e depois entre.',
          );
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onLogin?.(data.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Não foi possível autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='auth-page'>
      <form className='auth-card' onSubmit={handleSubmit}>
        <h1>Meu Assistente</h1>

        <p>
          {mode === 'login'
            ? 'Entre para acessar seus dados.'
            : 'Crie sua conta para começar.'}
        </p>

        <label htmlFor='auth-email'>E-mail</label>
        <input
          id='auth-email'
          type='email'
          autoComplete='email'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder='voce@exemplo.com'
          required
        />

        <label htmlFor='auth-password'>Senha</label>
        <input
          id='auth-password'
          type='password'
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder='Mínimo de 8 caracteres'
          minLength={mode === 'signup' ? 8 : undefined}
          required
        />

        {error && (
          <p role='alert' className='auth-error'>
            {error}
          </p>
        )}
        {message && (
          <p role='status' className='auth-message'>
            {message}
          </p>
        )}

        <button type='submit' disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          type='button'
          className='auth-switch'
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setMessage('');
          }}
        >
          {mode === 'login'
            ? 'Ainda não tem conta? Cadastre-se'
            : 'Já tem conta? Entrar'}
        </button>
      </form>
    </main>
  );
}
