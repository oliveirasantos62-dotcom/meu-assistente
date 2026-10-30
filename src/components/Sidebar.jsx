import React, { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'dashboard', label: '🏠 Painel Principal', fixed: true },
  { id: 'tasks', label: '✅ Tarefas' },
  { id: 'calendar', label: '📅 Calendário & Agenda' },
  { id: 'diario', label: '📔 Diário' },
  { id: 'estudos', label: '📚 Estudos & Leitura' },
  { id: 'goals', label: '🎯 Objetivos' },
  { id: 'habits', label: '🔥 Hábitos' },
  { id: 'projects', label: '📁 Projetos' },
  { id: 'collections', label: '🏆 Coleções & Conquistas' },
  { id: 'fase12', label: '📊 Ciência de Dados' },
  { id: 'gamification', label: '🎮 Gamificação' },
  { id: 'fase13', label: '💵 Finanças Pessoais' },
  { id: 'investments', label: '📈 Investimentos' },
  { id: 'connections', label: '👥 Conexões' },
  { id: 'foguinho', label: '🔥 Foguinho' },
  { id: 'groups', label: '👥 Grupos' },
  { id: 'assistant', label: '🤖 Assistente' },
];

const STORAGE_PREFIX = 'meu-assistente-sidebar-config-';

const DEFAULT_VISIBLE = {
  dashboard: true,
  tasks: true,
  calendar: true,
  diario: true,
  estudos: true,
  goals: true,
  habits: true,
  projects: true,

  // Recursos opcionais começam desativados
  collections: false,
  fase12: false,
  gamification: false,
  fase13: false,
  investments: false,
  connections: false,
  foguinho: false,
  groups: false,
  assistant: false,
};

const DEFAULT_ORDER = SECTIONS.map((section) => section.id);

function getStorageKey(currentUser) {
  const id = currentUser?.id || currentUser?.email || 'guest';
  return `${STORAGE_PREFIX}${String(id).toLowerCase()}`;
}

function createDefaultConfig() {
  return {
    visibleSections: { ...DEFAULT_VISIBLE },
    order: [...DEFAULT_ORDER],
  };
}

function loadSidebarConfig(currentUser) {
  try {
    const saved = localStorage.getItem(getStorageKey(currentUser));

    if (!saved) return createDefaultConfig();

    const parsed = JSON.parse(saved);

    // Compatibilidade com a configuração antiga,
    // que armazenava somente as páginas ativadas.
    const oldVisible = parsed.visibleSections || parsed;

    const visibleSections = {
      ...DEFAULT_VISIBLE,
      ...oldVisible,
      dashboard: true,
    };

    const savedOrder = Array.isArray(parsed.order)
      ? parsed.order
      : DEFAULT_ORDER;

    // Remove IDs inválidos e adiciona páginas novas.
    const validOrder = savedOrder.filter(
      (id, index) =>
        DEFAULT_ORDER.includes(id) && savedOrder.indexOf(id) === index,
    );

    const order = [
      ...validOrder,
      ...DEFAULT_ORDER.filter((id) => !validOrder.includes(id)),
    ];

    return { visibleSections, order };
  } catch {
    return createDefaultConfig();
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
  const storageKey = getStorageKey(currentUser);

  const [configState, setConfigState] = useState(() => ({
    owner: storageKey,
    config: loadSidebarConfig(currentUser),
  }));

  const [customizing, setCustomizing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Evita exibir a configuração de uma conta na outra.
  const config =
    configState.owner === storageKey
      ? configState.config
      : createDefaultConfig();

  const visibleSections = config.visibleSections;

  // Carrega a configuração da conta atual.
  useEffect(() => {
    setConfigState({
      owner: storageKey,
      config: loadSidebarConfig(currentUser),
    });
  }, [storageKey]);

  // Salva automaticamente quando a configuração muda.
  useEffect(() => {
    if (configState.owner !== storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(configState.config));
    } catch {
      console.warn('Não foi possível salvar a configuração da Sidebar.');
    }
  }, [configState, storageKey]);

  function updateConfig(updater) {
    setConfigState((current) => {
      const base =
        current.owner === storageKey
          ? current.config
          : loadSidebarConfig(currentUser);

      return {
        owner: storageKey,
        config: typeof updater === 'function' ? updater(base) : updater,
      };
    });
  }

  function toggleSection(id) {
    if (id === 'dashboard') return;

    updateConfig((current) => ({
      ...current,
      visibleSections: {
        ...current.visibleSections,
        [id]: !current.visibleSections[id],
      },
    }));
  }

  function restoreDefault() {
    updateConfig(createDefaultConfig());
  }

  function moveSection(id, direction) {
    updateConfig((current) => {
      const order = [...current.order];
      const index = order.indexOf(id);
      const newIndex = index + direction;

      if (index < 0 || newIndex < 0 || newIndex >= order.length) {
        return current;
      }

      [order[index], order[newIndex]] = [order[newIndex], order[index]];

      return { ...current, order };
    });
  }

  function handleDrop(targetId) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    updateConfig((current) => {
      const order = [...current.order];

      const fromIndex = order.indexOf(draggedId);
      const toIndex = order.indexOf(targetId);

      if (fromIndex < 0 || toIndex < 0) return current;

      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, draggedId);

      return { ...current, order };
    });

    setDraggedId(null);
    setDragOverId(null);
  }

  const orderedSections = config.order
    .map((id) => SECTIONS.find((section) => section.id === id))
    .filter(Boolean);

  const menuSections = orderedSections.filter(
    (section) => visibleSections[section.id],
  );

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

        {/* MENU COM ROLAGEM */}
        <nav className='sidebar-nav' aria-label='Navegação principal'>
          {menuSections.map((section) => {
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

          {menuSections.length === 0 && (
            <p className='sidebar-empty'>Nenhuma página ativada.</p>
          )}
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

                <p>Ative, desative e organize suas páginas.</p>
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

            {/* INFORMAÇÕES */}
            <div className='sidebar-settings-info'>
              <span>☰ Arraste as páginas para mudar a ordem.</span>
              <span>✓ Ative somente os recursos que utiliza.</span>
            </div>

            {/* LISTA DE PÁGINAS */}
            <div className='sidebar-settings-content'>
              {orderedSections.map((section, index) => {
                const checked = visibleSections[section.id];

                return (
                  <div
                    key={section.id}
                    className={[
                      'sidebar-option',
                      checked ? 'checked' : '',
                      section.fixed ? 'disabled' : '',
                      draggedId === section.id ? 'dragging' : '',
                      dragOverId === section.id ? 'drag-over' : '',
                    ].join(' ')}
                    draggable={!section.fixed}
                    onDragStart={(event) => {
                      if (section.fixed) {
                        event.preventDefault();
                        return;
                      }

                      setDraggedId(section.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', section.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedId !== section.id) {
                        setDragOverId(section.id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(section.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                  >
                    <span className='sidebar-drag-handle' aria-hidden='true'>
                      {section.fixed ? '🔒' : '⠿'}
                    </span>

                    <div className='sidebar-option-left'>
                      <span className='sidebar-option-label'>
                        {section.label}
                      </span>

                      {section.fixed && <small>Sempre ativo</small>}
                    </div>

                    <div className='sidebar-option-actions'>
                      {/* MOVER PARA CIMA */}
                      <button
                        type='button'
                        className='sidebar-move-button'
                        disabled={index === 0}
                        onClick={() => moveSection(section.id, -1)}
                        aria-label={`Mover ${section.label} para cima`}
                        title='Mover para cima'
                      >
                        ↑
                      </button>

                      {/* MOVER PARA BAIXO */}
                      <button
                        type='button'
                        className='sidebar-move-button'
                        disabled={index === orderedSections.length - 1}
                        onClick={() => moveSection(section.id, 1)}
                        aria-label={`Mover ${section.label} para baixo`}
                        title='Mover para baixo'
                      >
                        ↓
                      </button>

                      {/* ATIVAR / DESATIVAR */}
                      <label className='sidebar-switch-label'>
                        <input
                          type='checkbox'
                          checked={checked}
                          disabled={section.fixed}
                          onChange={() => toggleSection(section.id)}
                          aria-label={`Ativar ${section.label}`}
                        />

                        <span className='sidebar-switch'>
                          <span />
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RODAPÉ */}
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
