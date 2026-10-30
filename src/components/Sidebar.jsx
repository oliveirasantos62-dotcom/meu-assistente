import React, { useEffect, useState } from 'react';

const DEFAULT_SECTIONS = {
  dashboard: true,
  tasks: true,
  calendar: true,
  diario: true,
  goals: true,
  habits: true,
  projects: true,
  collections: true,
  fase12: true,
  gamification: true,
  fase13: true,
  investments: true,
  connections: true,
  assistant: true,
};

const SECTIONS = [
  {
    id: 'dashboard',
    label: '🏠 Painel Principal',
    fixed: true,
  },
  {
    id: 'tasks',
    label: '✅ Tarefas',
  },
  {
    id: 'calendar',
    label: '📅 Calendário & Agenda',
  },
  {
    id: 'diario',
    label: '📔 Diário',
  },
  {
    id: 'goals',
    label: '🎯 Objetivos',
  },
  {
    id: 'habits',
    label: '🔥 Hábitos',
  },
  {
    id: 'projects',
    label: '📁 Projetos',
  },
  {
    id: 'collections',
    label: '🏆 Coleções & Conquistas',
  },
  {
    id: 'fase12',
    label: '📊 Ciência de Dados',
  },
  {
    id: 'gamification',
    label: '🎮 Gamificação',
  },
  {
    id: 'fase13',
    label: '💵 Finanças Pessoais',
  },
  {
    id: 'investments',
    label: '📈 Investimentos',
  },
  {
    id: 'connections',
    label: '👥 Conexões',
  },
  {
    id: 'assistant',
    label: '🤖 Assistente',
  },
];

const STORAGE_KEY = 'meu-assistente-sidebar-config';

function loadSidebarConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_SECTIONS;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_SECTIONS,
      ...parsed,

      // Painel Principal nunca pode ser removido
      dashboard: true,
    };
  } catch {
    return DEFAULT_SECTIONS;
  }
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  darkMode,
  setDarkMode,
  onLogout,
}) {
  const [visibleSections, setVisibleSections] = useState(loadSidebarConfig);

  const [customizing, setCustomizing] = useState(false);

  // Salva a personalização
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleSections));
    } catch {
      // Continua funcionando mesmo se localStorage falhar.
    }
  }, [visibleSections]);

  const toggleSection = (id) => {
    // Dashboard sempre fica disponível
    if (id === 'dashboard') {
      return;
    }

    setVisibleSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const restoreDefault = () => {
    setVisibleSections({
      ...DEFAULT_SECTIONS,
    });
  };

  return (
    <>
      <aside className='sidebar'>
        {/* IDENTIDADE */}
        <div className='sidebar-brand'>
          <div className='logo'>A</div>

          <div className='sidebar-brand-text'>
            <h3>Meu Assistente</h3>
            <small>v2.0 Pro</small>
          </div>
        </div>

        {/* MENU */}
        <nav className='sidebar-nav' aria-label='Navegação principal'>
          {SECTIONS.map((section) => {
            if (!visibleSections[section.id]) {
              return null;
            }

            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type='button'
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className='nav-item-label'>{section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RODAPÉ */}
        <div className='sidebar-footer'>
          <button
            type='button'
            className='ghost sidebar-settings-button'
            onClick={() => setCustomizing(true)}
          >
            ⚙️ Personalizar menu
          </button>

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
              className='ghost sidebar-logout-button'
              onClick={onLogout}
            >
              🚪 Sair da conta
            </button>
          )}
        </div>
      </aside>

      {/* MODAL DE PERSONALIZAÇÃO */}
      {customizing && (
        <div
          className='sidebar-settings-overlay'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCustomizing(false);
            }
          }}
        >
          <div
            className='sidebar-settings-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='sidebar-settings-title'
          >
            {/* CABEÇALHO */}
            <div className='sidebar-settings-header'>
              <div>
                <span className='sidebar-settings-eyebrow'>PERSONALIZAÇÃO</span>

                <h2 id='sidebar-settings-title'>Personalizar menu</h2>

                <p>Escolha quais recursos deseja visualizar na Sidebar.</p>
              </div>

              <button
                type='button'
                className='sidebar-settings-close'
                onClick={() => setCustomizing(false)}
                aria-label='Fechar personalização'
              >
                ×
              </button>
            </div>

            {/* OPÇÕES */}
            <div className='sidebar-settings-content'>
              {SECTIONS.map((section) => {
                const checked = visibleSections[section.id];

                return (
                  <label
                    key={section.id}
                    className={`sidebar-option ${checked ? 'checked' : ''} ${
                      section.fixed ? 'disabled' : ''
                    }`}
                  >
                    <span className='sidebar-option-left'>
                      <span className='sidebar-option-label'>
                        {section.label}
                      </span>

                      {section.fixed && <small>Sempre ativo</small>}
                    </span>

                    <input
                      type='checkbox'
                      checked={checked}
                      disabled={section.fixed}
                      onChange={() => toggleSection(section.id)}
                    />

                    <span className='sidebar-switch'>
                      <span />
                    </span>
                  </label>
                );
              })}
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className='sidebar-settings-footer'>
              <button type='button' className='ghost' onClick={restoreDefault}>
                ↻ Restaurar padrão
              </button>

              <button
                type='button'
                className='sidebar-settings-primary'
                onClick={() => setCustomizing(false)}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
