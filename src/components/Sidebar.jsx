import React, { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'dashboard', label: '🏠 Painel Principal', fixed: true },
  { id: 'tasks', label: '✅ Tarefas' },
  { id: 'processos', label: '🧩 Processos' },
  { id: 'calendar', label: '📅 Calendário & Agenda' },
  { id: 'diario', label: '📔 Diário' },
  { id: 'estudos', label: '📚 Estudos' },
  { id: 'goals', label: '🎯 Objetivos' },
  { id: 'habits', label: '🔥 Hábitos' },

  // PROJETOS E GRUPOS CONTINUAM SENDO PÁGINAS DIFERENTES
  { id: 'projects', label: '📁 Projetos' },
  { id: 'groups', label: '👥 Grupos' },

  { id: 'collections', label: '🏆 Coleções & Conquistas' },
  { id: 'fase12', label: '📊 Ciência de Dados' },
  { id: 'gamification', label: '🎮 Gamificação' },
  { id: 'fase13', label: '💵 Finanças Pessoais' },
  { id: 'investments', label: '📈 Investimentos' },
  { id: 'connections', label: '🤝 Conexões' },
  { id: 'foguinho', label: '🔥 Foguinho' },
  { id: 'assistant', label: '🤖 Assistente' },

  // NOVA PÁGINA
  { id: 'profile', label: '👤 Meu Perfil' },
];

const STORAGE_PREFIX = 'meu-assistente-sidebar-config-';

// Páginas que aparecem inicialmente para contas novas.
const DEFAULT_VISIBLE = {
  dashboard: true,
  tasks: true,
  processos: true,
  calendar: true,
  diario: true,
  estudos: true,
  goals: true,
  habits: true,

  projects: true,
  groups: true,

  collections: false,
  fase12: false,
  gamification: false,
  fase13: false,
  investments: false,
  connections: false,
  foguinho: false,
  assistant: false,

  profile: true,
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

    // NOVO:
    // Define se o campo de pesquisa aparece no menu.
    showSearch: true,
  };
}

function loadSidebarConfig(currentUser) {
  try {
    const saved = localStorage.getItem(getStorageKey(currentUser));

    if (!saved) {
      return createDefaultConfig();
    }

    const parsed = JSON.parse(saved);

    // Compatibilidade com versões antigas
    // que salvavam somente as páginas ativadas.
    const oldVisible = parsed.visibleSections || parsed;

    const visibleSections = {
      ...DEFAULT_VISIBLE,
      ...oldVisible,
      dashboard: true,
    };

    const savedOrder = Array.isArray(parsed.order)
      ? parsed.order
      : DEFAULT_ORDER;

    // Remove IDs inválidos e duplicados.
    const validOrder = savedOrder.filter(
      (id, index) =>
        DEFAULT_ORDER.includes(id) && savedOrder.indexOf(id) === index,
    );

    // Adiciona páginas novas que não existiam
    // na configuração salva.
    let order = [
      ...validOrder,
      ...DEFAULT_ORDER.filter((id) => !validOrder.includes(id)),
    ];

    // Painel Principal permanece sempre na primeira posição.
    order = ['dashboard', ...order.filter((id) => id !== 'dashboard')];

    return {
      visibleSections,

      order,

      // Compatibilidade com configurações antigas:
      // se ainda não existir, pesquisa fica ativada.
      showSearch:
        typeof parsed.showSearch === 'boolean' ? parsed.showSearch : true,
    };
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Evita mostrar a configuração de uma conta na outra.
  const config =
    configState.owner === storageKey
      ? configState.config
      : createDefaultConfig();

  const visibleSections = config.visibleSections;

  // Define se a pesquisa está ativada.
  const showSearch =
    typeof config.showSearch === 'boolean' ? config.showSearch : true;

  // Carrega a configuração correspondente à conta atual.
  useEffect(() => {
    setConfigState({
      owner: storageKey,
      config: loadSidebarConfig(currentUser),
    });

    setDraggedId(null);
    setDragOverId(null);
    setSearchTerm('');
  }, [storageKey]);

  // Salva automaticamente as configurações.
  useEffect(() => {
    if (configState.owner !== storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(configState.config));
    } catch {
      console.warn('Não foi possível salvar a configuração da Sidebar.');
    }
  }, [configState, storageKey]);

  // Atualiza a configuração preservando os dados atuais.
  function updateConfig(updater) {
    setConfigState((current) => {
      const base =
        current.owner === storageKey
          ? current.config
          : loadSidebarConfig(currentUser);

      const nextConfig =
        typeof updater === 'function' ? updater(base) : updater;

      return {
        owner: storageKey,
        config: nextConfig,
      };
    });
  }

  // Ativa ou desativa uma página.
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

  // Ativa ou desativa a pesquisa de páginas.
  function toggleSearch() {
    updateConfig((current) => {
      const nextShowSearch = !current.showSearch;

      // Se desativou a pesquisa, limpa o texto atual.
      if (!nextShowSearch) {
        setSearchTerm('');
      }

      return {
        ...current,
        showSearch: nextShowSearch,
      };
    });
  }

  // Restaura páginas, ordem e pesquisa padrão.
  function restoreDefault() {
    setSearchTerm('');
    updateConfig(createDefaultConfig());
  }

  // Calcula a posição do mouse:
  // antes ou depois do item.
  function getDropPosition(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  }

  // Insere a página arrastada na posição escolhida.
  function handleDrop(targetId, position) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Painel Principal não pode ser ultrapassado.
    if (targetId === 'dashboard') {
      position = 'after';
    }

    updateConfig((current) => {
      const order = [...current.order];

      const draggedIndex = order.indexOf(draggedId);

      if (draggedIndex < 0) {
        return current;
      }

      // Retira o item da posição original.
      order.splice(draggedIndex, 1);

      // Encontra a posição de destino.
      const targetIndex = order.indexOf(targetId);

      if (targetIndex < 0) {
        return current;
      }

      // Insere antes ou depois do destino.
      const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;

      order.splice(insertIndex, 0, draggedId);

      // Garante Painel Principal no início.
      const finalOrder = [
        'dashboard',
        ...order.filter((id) => id !== 'dashboard'),
      ];

      return {
        ...current,
        order: finalOrder,
      };
    });

    setDraggedId(null);
    setDragOverId(null);
  }

  // Organiza as páginas conforme a ordem salva.
  const orderedSections = config.order
    .map((id) => SECTIONS.find((section) => section.id === id))
    .filter(Boolean);

  // Exibe somente as páginas ativadas.
  const menuSections = orderedSections.filter(
    (section) => visibleSections[section.id],
  );

  // Aplica a pesquisa somente quando ela está ativada.
  const filteredSections = showSearch
    ? menuSections.filter((section) =>
        section.label
          .toLocaleLowerCase('pt-BR')
          .includes(searchTerm.trim().toLocaleLowerCase('pt-BR')),
      )
    : menuSections;

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setCustomizing(false);
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeSection]);

  return (
    <>
      {/* BOTÃO MOBILE */}
      <button
        type='button'
        className='mobile-sidebar-trigger'
        onClick={() => setMobileOpen(true)}
        aria-label='Abrir menu de navegação'
        aria-expanded={mobileOpen}
        aria-controls='app-sidebar'
      >
        <span aria-hidden='true'>☰</span>
      </button>

      {/* FUNDO DO MENU MOBILE */}
      {mobileOpen && (
        <button
          type='button'
          className='sidebar-mobile-backdrop'
          onClick={() => setMobileOpen(false)}
          aria-label='Fechar menu de navegação'
        />
      )}

      <aside
        id='app-sidebar'
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* IDENTIDADE */}
        <div className='sidebar-brand'>
          <div className='logo'>A</div>

          <div className='sidebar-brand-text'>
            <h3>Meu Assistente</h3>
            <small>v2.0 Pro</small>
          </div>
        </div>

        {/* MENU PRINCIPAL */}
        <nav className='sidebar-nav' aria-label='Navegação principal'>
          {/* PESQUISA OPCIONAL */}
          {showSearch && (
            <div className='sidebar-search'>
              <span aria-hidden='true'>⌕</span>

              <input
                type='search'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Buscar página...'
                aria-label='Buscar página no menu'
              />

              {searchTerm && (
                <button
                  type='button'
                  onClick={() => setSearchTerm('')}
                  aria-label='Limpar busca'
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* PÁGINAS */}
          {filteredSections.map((section) => {
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

          {menuSections.length > 0 && filteredSections.length === 0 && (
            <p className='sidebar-empty'>Nenhuma página encontrada.</p>
          )}
        </nav>

        {/* RODAPÉ */}
        <div className='sidebar-footer'>
          <button
            type='button'
            className='ghost sidebar-settings-button'
            onClick={() => {
              setMobileOpen(false);
              setCustomizing(true);
            }}
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

            {/* INSTRUÇÕES */}
            <div className='sidebar-settings-info'>
              <span>⠿ Arraste as páginas para reorganizar.</span>

              <span>↕ Solte entre duas páginas para escolher a posição.</span>

              <span>✓ Ative somente os recursos que deseja visualizar.</span>
            </div>

            {/* CONFIGURAÇÃO DA PESQUISA */}
            <div className='sidebar-search-setting'>
              <div className='sidebar-search-setting-info'>
                <div className='sidebar-search-setting-icon'>🔎</div>
              </div>

              <label className='sidebar-switch-label'>
                <input
                  type='checkbox'
                  checked={showSearch}
                  onChange={toggleSearch}
                  aria-label='Mostrar pesquisa de páginas'
                />

                <span className='sidebar-switch'>
                  <span />
                </span>
              </label>
            </div>

            {/* LISTA DE PÁGINAS */}
            <div className='sidebar-settings-content'>
              {orderedSections.map((section) => {
                const checked = visibleSections[section.id];

                const isDragging = draggedId === section.id;

                const dropPosition =
                  dragOverId?.id === section.id ? dragOverId.position : null;

                return (
                  <div
                    key={section.id}
                    className={[
                      'sidebar-option',
                      checked ? 'checked' : '',
                      section.fixed ? 'disabled' : '',
                      isDragging ? 'dragging' : '',
                      dropPosition === 'before' ? 'drag-over-before' : '',
                      dropPosition === 'after' ? 'drag-over-after' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
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

                      if (!draggedId || draggedId === section.id) {
                        return;
                      }

                      const position = getDropPosition(event);

                      setDragOverId({
                        id: section.id,
                        position,
                      });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      const dragged =
                        event.dataTransfer.getData('text/plain') || draggedId;

                      if (dragged && dragged !== draggedId) {
                        setDraggedId(dragged);
                      }

                      const position = getDropPosition(event);

                      handleDrop(section.id, position);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                  >
                    {/* ALÇA DE ARRASTE */}
                    <span
                      className='sidebar-drag-handle'
                      title={
                        section.fixed
                          ? 'Página fixa'
                          : 'Arraste para reorganizar'
                      }
                      aria-hidden='true'
                    >
                      {section.fixed ? '🔒' : '⠿'}
                    </span>

                    {/* NOME DA PÁGINA */}
                    <div className='sidebar-option-left'>
                      <span className='sidebar-option-label'>
                        {section.label}
                      </span>

                      {section.fixed && (
                        <small>Sempre ativo e na primeira posição</small>
                      )}

                      {!section.fixed && (
                        <small>
                          {checked ? 'Visível no menu' : 'Oculta no menu'}
                        </small>
                      )}
                    </div>

                    {/* INTERRUPTOR */}
                    <div className='sidebar-option-actions'>
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
