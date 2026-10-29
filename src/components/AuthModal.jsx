import React, { useState } from 'react';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { name, email, password }
      : { email, password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        setMessage(resData.error || 'Erro na operação.');
        return;
      }

      localStorage.setItem('auth_token', resData.token);
      setMessage(resData.message);
      if (onLoginSuccess) onLoginSuccess(resData.user, resData.token);
    } catch (err) {
      setMessage('Erro ao conectar ao servidor backend.');
    }
  };

  return (
    <div className='card'>
      <h2>🔐 {isRegister ? 'Criar Conta' : 'Acessar Conta'}</h2>
      <p className='subtitle'>Sincronize seus dados em qualquer dispositivo.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        {isRegister && (
          <input
            placeholder='Nome Completo'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type='email'
          placeholder='E-mail'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type='password'
          placeholder='Senha'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className='primary'
          type='submit'
          style={{ width: '100%', marginTop: 10 }}
        >
          {isRegister ? 'Cadastrar' : 'Entrar'}
        </button>
      </form>

      {message && <p style={{ marginTop: 10, color: '#6d5dfc' }}>{message}</p>}

      <button
        className='ghost'
        onClick={() => setIsRegister(!isRegister)}
        style={{ width: '100%', marginTop: 10 }}
      >
        {isRegister
          ? 'Já possui uma conta? Faça Login'
          : 'Não tem conta? Cadastre-se'}
      </button>
    </div>
  );
}
