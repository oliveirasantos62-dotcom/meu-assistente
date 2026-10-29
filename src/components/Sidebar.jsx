import React from 'react';

export default function Sidebar({
  activeSection,
  setActiveSection,
  darkMode,
  setDarkMode,
  onLogout,
}) {
  // Navegação principal
  const mainSections = [
    { id: 'dashboard', label: '🏠 Painel Principal' },
    { id: 'tasks', label: '✅ Tarefas' },
    { id: 'calendar', label: '📅 Calendário & Agenda' },
    { id: 'diario', label: '📔 Diário' },
    { id: 'goals', label: '🎯 Objetivos' },
    { id: 'habits', label: '🔥 Hábitos' },
  ];

  // Organização e desenvolvimento
  const developmentSections = [
    { id: 'projects', label: '📁 Projetos' },
    { id: 'collections', label: '🏆 Coleções & Conquistas' },
    { id: 'fase12', label: '📊 Ciência de Dados' },
    { id: 'gamification', label: '🎮 Gamificação' },
  ];

  // Finanças
  const financeSections = [
    { id: 'fase13', label: '💵 Finanças Pessoais' },
    { id: 'investments', label: '📈 Investimentos' },
  ];

  // Assistente
  const assistantSections = [{ id: 'assistant', label: '🤖 Assistente' }];

  // Renderiza cada item da navegação
  const renderSection = (item) => {
    const isActive = activeSection === item.id;

    return (
      <button
        key={item.id}
        type='button'
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => setActiveSection(item.id)}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className='nav-item-label'>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className='sidebar'>
      {/* Identidade do aplicativo */}
      <div className='sidebar-brand'>
        <div className='logo'>A</div>

        <div className='sidebar-brand-text'>
          <h3>Meu Assistente</h3>
          <small>v2.0 Pro</small>
        </div>
      </div>

      {/* Navegação */}
      <nav className='sidebar-nav' aria-label='Navegação principal'>
        <div className='sidebar-group'>
          <span className='sidebar-group-title'>PRINCIPAL</span>
          {mainSections.map(renderSection)}
        </div>

        <div className='sidebar-group'>
          <span className='sidebar-group-title'>
            ORGANIZAÇÃO & DESENVOLVIMENTO
          </span>
          {developmentSections.map(renderSection)}
        </div>

        <div className='sidebar-group'>
          <span className='sidebar-group-title'>FINANÇAS</span>
          {financeSections.map(renderSection)}
        </div>

        <div className='sidebar-group'>
          <span className='sidebar-group-title'>ASSISTENTE</span>
          {assistantSections.map(renderSection)}
        </div>
      </nav>

      {/* Rodapé */}
      <div className='sidebar-footer'>
        <button
          type='button'
          className='ghost theme-toggle'
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
        </button>

        {onLogout && (
          <button
            type='button'
            className='ghost'
            onClick={onLogout}
            style={{
              width: '100%',
              marginTop: 8,
              color: 'var(--site-danger)',
              borderColor: 'var(--site-danger)',
            }}
          >
            🚪 Sair da conta
          </button>
        )}
      </div>
    </aside>
  );
}
