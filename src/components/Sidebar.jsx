import React, { useEffect, useState } from 'react';

// Menu inicial enxuto. Os demais módulos continuam disponíveis em
// "Personalizar menu" e podem ser ativados individualmente.
const DEFAULT_SECTIONS = {
  dashboard: true,
  tasks: true,
  calendar: true,
  diario: true,
  estudos: true,
  goals: false,
  habits: false,
  projects: false,
  collections: false,
  fase12: false,
  gamification: false,
  fase13: false,
  investments: false,
  connections: false,
  foguinho: false,
  groups: false,
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
    id: 'estudos',
    label: '📚 Estudos & Leitura',
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
    id: 'foguinho',
    label: '🔥 Foguinho',
  },
  {
    id: 'groups',
    label: '👥 Grupos',
  },
  {
    id: 'assistant',
    label: '🤖 Assistente',
  },
];

const STORAGE_PREFIX = 'meu-assistente-sidebar-config-';

function getStorageKey(currentUser) {
  const id = currentUser?.id || currentUser?.email || 'guest';
  return `${STORAGE_PREFIX}${String(id).toLowerCase()}`;
}

function loadSidebarConfig(currentUser) {
  try {
    const saved = localStorage.getItem(getStorageKey(currentUser));
    const fallbackOrder = SECTIONS.map((section) => section.id);

    if (!saved) {
      return {
        visible: { ...DEFAULT_SECTIONS },
        order: fallbackOrder,
      };
    }

    const parsed = JSON.parse(saved);
    // Compatibilidade: versões antigas salvavam somente { id: boolean }.
    const visible = parsed.visibleSections || parsed.visible || parsed;
    const savedOrder = Array.isArray(parsed.order) ? parsed.order : [];
    const knownIds = new Set(fallbackOrder);
    const order = [
      ...savedOrder.filter((id) => knownIds.has(id)),
      ...fallbackOrder.filter((id) => !savedOrder.includes(id)),
    ];

    return {
      visible: {
        ...DEFAULT_SECTIONS,
        ...visible,
        dashboard: true,
      },
      order,
    };
  } catch {
    return {
      visible: { ...DEFAULT_SECTIONS },
      order: SECTIONS.map((section) => section.id),
    };
  }
}

export default function Sidebar({
  activeSection,
  currentUser,
  setActiveSection,
  darkMode,
  setDarkMode,
  onLogout,
}) {
  const userStorageKey = getStorageKey(currentUser);
  const [menuConfig, setMenuConfig] = useState(() => loadSidebarConfig(currentUser));
  const { visible: visibleSections, order: sectionOrder } = menuConfig;
  const [loadedStorageKey, setLoadedStorageKey] = useState(userStorageKey);

  const [customizing, setCustomizing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Troca de conta: carrega a configuração daquele usuário.
  useEffect(() => {
    setMenuConfig(loadSidebarConfig(currentUser));
    setLoadedStorageKey(userStorageKey);
  }, [userStorageKey]);

  // Evita gravar a configuração da conta anterior na chave da nova conta
  // durante a renderização intermediária da troca de usuário.
  useEffect(() => {
    if (loadedStorageKey !== userStorageKey) return;

    try {
      localStorage.setItem(userStorageKey, JSON.stringify({
        visibleSections: menuConfig.visible,
        order: menuConfig.order,
      }));
    } catch {
      // Continua funcionando mesmo se localStorage falhar.
    }
  }, [menuConfig, userStorageKey, loadedStorageKey]);

  const toggleSection = (id) => {
    // Dashboard sempre fica disponível
    if (id === 'dashboard') {
      return;
    }

    setMenuConfig((current) => ({
      ...current,
      visible: { ...current.visible, [id]: !current.visible[id] },
    }));
  };

  const restoreDefault = () => {
    setMenuConfig({
      visible: { ...DEFAULT_SECTIONS },
      order: SECTIONS.map((section) => section.id),
    });
  };

  const moveSection = (id, direction) => {
    setMenuConfig((current) => {
      const index = current.order.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.order.length) return current;
      const order = [...current.order];
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, order };
    });
  };

  const orderedSections = sectionOrder
    .map((id) => SECTIONS.find((section) => section.id === id))
    .filter(Boolean);

  return (
    <>
      {!mobileOpen && (
        <button
          type='button'
          className='mobile-sidebar-trigger'
          onClick={() => setMobileOpen(true)}
          aria-label='Abrir menu'
          aria-expanded='false'
        >
          ☰
        </button>
      )}

      {mobileOpen && (
        <button
          type='button'
          className='sidebar-mobile-backdrop'
          onClick={() => setMobileOpen(false)}
          aria-label='Fechar menu'
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className='sidebar-mobile-header'>
          <span>Menu</span>
          <button
            type='button'
            className='sidebar-mobile-close'
            onClick={() => setMobileOpen(false)}
            aria-label='Fechar menu'
          >
            ×
          </button>
        </div>
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
          {orderedSections.map((section) => {
            if (!visibleSections[section.id]) {
              return null;
            }

            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type='button'
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id);
                  setMobileOpen(false);
                }}
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
              {orderedSections.map((section, index) => {
                const checked = visibleSections[section.id];

                return (
                  <div
                    key={section.id}
                    className={`sidebar-option ${checked ? 'checked' : ''} ${
                      section.fixed ? 'disabled' : ''
                    }`}
                  >
                    <label className='sidebar-option-main'>
                      <span className='sidebar-option-left'>
                        <span className='sidebar-option-label'>{section.label}</span>
                        {section.fixed && <small>Sempre ativo</small>}
                      </span>
                      <input
                        type='checkbox'
                        checked={checked}
                        disabled={section.fixed}
                        onChange={() => toggleSection(section.id)}
                        aria-label={`Mostrar ${section.label} no menu`}
                      />
                      <span className='sidebar-switch'><span /></span>
                    </label>

                    <span className='sidebar-option-controls'>
                      <button
                        type='button'
                        className='sidebar-order-button'
                        aria-label={`Mover ${section.label} para cima`}
                        title='Mover para cima'
                        disabled={index === 0}
                        onClick={() => moveSection(section.id, -1)}
                      >↑</button>
                      <button
                        type='button'
                        className='sidebar-order-button'
                        aria-label={`Mover ${section.label} para baixo`}
                        title='Mover para baixo'
                        disabled={index === orderedSections.length - 1}
                        onClick={() => moveSection(section.id, 1)}
                      >↓</button>
                    </span>
                  </div>
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
