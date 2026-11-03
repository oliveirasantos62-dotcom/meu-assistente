import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const SECTIONS = [
  {
    id: 'dashboard',
    icon: '🏠',
    fallback: 'Dashboard',
    module: 'dashboard',
  },
  {
    id: 'tasks',
    icon: '✅',
    fallback: 'Tarefas',
    module: 'tasks',
  },
  {
    id: 'processos',
    icon: '⚙️',
    fallback: 'Processos',
    module: 'processos',
  },
  {
    id: 'calendar',
    icon: '📅',
    fallback: 'Calendário',
    module: 'calendar',
  },
  {
    id: 'diario',
    icon: '📔',
    fallback: 'Diário',
    module: 'diario',
  },
  {
    id: 'estudos',
    icon: '📚',
    fallback: 'Estudos',
    module: 'estudos',
  },
  {
    id: 'goals',
    icon: '🎯',
    fallback: 'Metas',
    module: 'goals',
  },
  {
    id: 'habits',
    icon: '🔁',
    fallback: 'Hábitos',
    module: 'habits',
  },
  {
    id: 'evolucao',
    icon: '📈',
    fallback: 'Evolução',
    module: 'evolucao',
  },
  {
    id: 'projects',
    icon: '🚀',
    fallback: 'Projetos',
    module: 'projects',
  },
  {
    id: 'groups',
    icon: '👥',
    fallback: 'Grupos',
    module: 'groups',
  },
  {
    id: 'collections',
    icon: '🗂️',
    fallback: 'Coleções',
    module: 'collections',
  },
  {
    id: 'dataScience',
    icon: '📊',
    fallback: 'Dados',
    module: 'dataScience',
  },
  {
    id: 'reports',
    icon: '📑',
    fallback: 'Relatórios',
    module: 'reports',
  },
  {
    id: 'tags',
    icon: '🏷️',
    fallback: 'Tags',
    module: 'tags',
  },
  {
    id: 'gamification',
    icon: '🎮',
    fallback: 'Gamificação',
    module: 'gamification',
  },
  {
    id: 'finance',
    icon: '💰',
    fallback: 'Finanças',
    module: 'finance',
  },
  {
    id: 'investments',
    icon: '📈',
    fallback: 'Investimentos',
    module: 'investments',
  },
  {
    id: 'connections',
    icon: '🤝',
    fallback: 'Conexões',
    module: 'connections',
  },
  {
    id: 'foguinho',
    icon: '🔥',
    fallback: 'Sequência',
    module: 'foguinho',
  },
  {
    id: 'assistant',
    icon: '🤖',
    fallback: 'Assistente',
    module: 'assistant',
  },
  {
    id: 'profile',
    icon: '👤',
    fallback: 'Perfil',
    module: 'profile',
  },
];

const DEFAULT_VISIBLE = {
  dashboard: true,
  tasks: true,
  processos: true,
  calendar: true,
  diario: true,
  estudos: true,
  goals: true,
  habits: true,
  evolucao: true,
  projects: true,
  groups: true,
  collections: false,
  dataScience: true,
  reports: true,
  tags: true,
  gamification: false,
  finance: true,
  investments: false,
  connections: false,
  foguinho: false,
  assistant: false,
  profile: true,
};

const DEFAULT_REFERENCES = {
  dashboard: true,
  tasks: true,
  processos: true,
  calendar: true,
  diario: true,
  estudos: true,
  goals: true,
  habits: true,
  evolucao: true,
  projects: true,
  groups: true,
  collections: true,
  dataScience: true,
  reports: true,
  tags: true,
  gamification: true,
  finance: true,
  investments: true,
  connections: true,
  foguinho: true,
  assistant: true,
  profile: true,
};

const STORAGE_PREFIX = 'meu-assistente-sidebar-config-';

function getStorageKey(user) {
  const identifier = user?.id || user?.email || user?.username || 'default';

  return `${STORAGE_PREFIX}${identifier}`;
}

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== 'object') {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

function getInitialConfig(user) {
  const key = getStorageKey(user);

  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return {
        visible: DEFAULT_VISIBLE,
        references: DEFAULT_REFERENCES,
      };
    }

    const parsed = safeParse(saved, {});

    return {
      visible: {
        ...DEFAULT_VISIBLE,
        ...(parsed.visible || {}),
      },
      references: {
        ...DEFAULT_REFERENCES,
        ...(parsed.references || {}),
      },
    };
  } catch {
    return {
      visible: DEFAULT_VISIBLE,
      references: DEFAULT_REFERENCES,
    };
  }
}

function getAriaLabel(section, label) {
  return `${label}`;
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  onNavigate,
  currentUser,
  isOpen = false,
  onClose,
}) {
  const { t } = useLanguage();

  const [config, setConfig] = useState(() => getInitialConfig(currentUser));

  const [search, setSearch] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerTab, setCustomizerTab] = useState('visibility');

  useEffect(() => {
    setConfig(getInitialConfig(currentUser));
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(currentUser), JSON.stringify(config));
    } catch {
      // Ignora falhas de localStorage
    }
  }, [config, currentUser]);

  const text = (key, fallback) => {
    try {
      const value = t(key);

      if (value && typeof value === 'string' && value !== key) {
        return value;
      }
    } catch {
      // usa fallback
    }

    return fallback;
  };

  const getLabel = (section) => text(`nav.${section.id}`, section.fallback);

  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return SECTIONS.filter((section) => {
      if (!config.visible[section.id]) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const label = getLabel(section).toLowerCase();

      return (
        label.includes(normalizedSearch) ||
        section.id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [search, config.visible, t]);

  const allSections = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      label: getLabel(section),
    }));
  }, [t]);

  function handleNavigate(sectionId) {
    // Compatível com as duas APIs usadas pelo App: onNavigate e setActiveSection.
    const navigate = onNavigate || setActiveSection;

    if (typeof navigate === 'function') {
      navigate(sectionId);
    }

    if (onClose) {
      onClose();
    }
  }

  function updateVisibility(sectionId, value) {
    setConfig((previous) => ({
      ...previous,
      visible: {
        ...previous.visible,
        [sectionId]: value,
      },
    }));
  }

  function updateReference(sectionId, value) {
    setConfig((previous) => ({
      ...previous,
      references: {
        ...previous.references,
        [sectionId]: value,
      },
    }));
  }

  function restoreDefaults() {
    setConfig({
      visible: {
        ...DEFAULT_VISIBLE,
      },
      references: {
        ...DEFAULT_REFERENCES,
      },
    });
  }

  function showAll() {
    const nextVisible = {};

    SECTIONS.forEach((section) => {
      nextVisible[section.id] = true;
    });

    setConfig((previous) => ({
      ...previous,
      visible: nextVisible,
    }));
  }

  function hideOptional() {
    setConfig((previous) => ({
      ...previous,
      visible: {
        ...DEFAULT_VISIBLE,
      },
    }));
  }

  function toggleReference(sectionId) {
    updateReference(sectionId, !config.references[sectionId]);
  }

  const visibleCount = SECTIONS.filter(
    (section) => config.visible[section.id],
  ).length;

  const referenceCount = SECTIONS.filter(
    (section) => config.references[section.id],
  ).length;

  const sidebarClassName = ['sidebar', isOpen ? 'sidebar-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isOpen && (
        <button
          type='button'
          className='sidebar-overlay'
          aria-label={text('sidebar.close', 'Fechar menu')}
          onClick={onClose}
        />
      )}

      <aside className={sidebarClassName}>
        <div className='sidebar-inner'>
          {/* =====================================================
              BRAND
          ====================================================== */}

          <div className='sidebar-brand'>
            <button
              type='button'
              className='sidebar-brand-button'
              onClick={() => handleNavigate('dashboard')}
              aria-label={text('brand.openDashboard', 'Abrir Dashboard')}
            >
              <div className='logo' aria-label='Meu Assistente'>
                <img src='/favicon-tech.png' alt='' />
              </div>

              <div className='sidebar-brand-text'>
                <h3>Meu Assistente</h3>
                <small>v2.0 Pro</small>
              </div>
            </button>

            <button
              type='button'
              className='sidebar-mobile-close'
              onClick={onClose}
              aria-label={text('sidebar.close', 'Fechar menu')}
            >
              ×
            </button>
          </div>

          {/* =====================================================
              SEARCH
          ====================================================== */}

          <div className='sidebar-search'>
            <label htmlFor='sidebar-search' className='sr-only'>
              {text('sidebar.searchLabel', 'Pesquisar no menu')}
            </label>

            <span className='sidebar-search-icon' aria-hidden='true'>
              🔎
            </span>

            <input
              id='sidebar-search'
              type='search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text('sidebar.searchPlaceholder', 'Pesquisar...')}
              autoComplete='off'
            />

            {search && (
              <button
                type='button'
                className='sidebar-search-clear'
                onClick={() => setSearch('')}
                aria-label={text('sidebar.clearSearch', 'Limpar pesquisa')}
                title={text('sidebar.clearSearch', 'Limpar pesquisa')}
              >
                ×
              </button>
            )}
          </div>

          {/* =====================================================
              NAVIGATION
          ====================================================== */}

          <nav
            className='sidebar-nav'
            aria-label={text('sidebar.navigation', 'Navegação principal')}
          >
            {filteredSections.length > 0 ? (
              <div className='sidebar-section-list'>
                {filteredSections.map((section) => {
                  const label = getLabel(section);

                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type='button'
                      className={['sidebar-nav-item', isActive ? 'active' : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleNavigate(section.id)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={getAriaLabel(section, label)}
                      title={label}
                    >
                      <span className='sidebar-nav-icon' aria-hidden='true'>
                        {section.icon}
                      </span>

                      <span className='sidebar-nav-label'>{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className='sidebar-empty'>
                <span className='sidebar-empty-icon' aria-hidden='true'>
                  🔎
                </span>

                <strong>{text('sidebar.noResults', 'Nenhum resultado')}</strong>

                <span>
                  {text(
                    'sidebar.tryAnotherSearch',
                    'Tente outro termo de pesquisa.',
                  )}
                </span>
              </div>
            )}
          </nav>

          {/* =====================================================
              CUSTOMIZATION BUTTON
          ====================================================== */}

          <div className='sidebar-customize'>
            <button
              type='button'
              className='sidebar-customize-button'
              onClick={() => {
                setCustomizerTab('visibility');
                setShowCustomizer(true);
              }}
            >
              <span className='sidebar-customize-icon' aria-hidden='true'>
                ⚙️
              </span>

              <span>{text('sidebar.customizeMenu', 'Personalizar menu')}</span>
            </button>
          </div>

          {/* =====================================================
              FOOTER
          ====================================================== */}

          <div className='sidebar-footer'>
            <div className='sidebar-footer-stats'>
              <span>
                {visibleCount}/{SECTIONS.length}{' '}
                {text('sidebar.visible', 'visíveis')}
              </span>

              <span>
                {referenceCount}/{SECTIONS.length}{' '}
                {text('sidebar.references', 'referências')}
              </span>
            </div>

            <button
              type='button'
              className='sidebar-footer-settings'
              onClick={() => {
                setCustomizerTab('visibility');
                setShowCustomizer(true);
              }}
            >
              ⚙️
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
          CUSTOMIZATION MODAL
      ========================================================== */}

      {showCustomizer && (
        <div
          className='sidebar-customizer-backdrop'
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCustomizer(false);
            }
          }}
        >
          <div
            className='sidebar-customizer-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='sidebar-customizer-title'
          >
            {/* HEADER */}

            <div className='sidebar-customizer-header'>
              <div>
                <span className='sidebar-customizer-eyebrow'>
                  {text('sidebar.customizer.eyebrow', 'PERSONALIZAÇÃO')}
                </span>

                <h2 id='sidebar-customizer-title'>
                  {text('sidebar.customizer.title', 'Personalizar menu')}
                </h2>

                <p>
                  {text(
                    'sidebar.customizer.subtitle',
                    'Escolha como os módulos aparecem no seu menu.',
                  )}
                </p>
              </div>

              <button
                type='button'
                className='sidebar-customizer-close'
                onClick={() => setShowCustomizer(false)}
                aria-label={text('sidebar.close', 'Fechar')}
              >
                ×
              </button>
            </div>

            {/* TABS */}

            <div className='sidebar-customizer-tabs'>
              <button
                type='button'
                className={customizerTab === 'visibility' ? 'active' : ''}
                onClick={() => setCustomizerTab('visibility')}
              >
                👁️ {text('sidebar.customizer.visibility', 'Visibilidade')}
              </button>

              <button
                type='button'
                className={customizerTab === 'references' ? 'active' : ''}
                onClick={() => setCustomizerTab('references')}
              >
                🔗 {text('sidebar.customizer.references', 'Referências')}
              </button>
            </div>

            {/* ===================================================
                VISIBILITY
            ==================================================== */}

            {customizerTab === 'visibility' && (
              <div className='sidebar-customizer-content'>
                <div className='sidebar-customizer-info'>
                  <div>
                    <strong>
                      {text(
                        'sidebar.customizer.visibilityTitle',
                        'Visibilidade dos módulos',
                      )}
                    </strong>

                    <p>
                      {text(
                        'sidebar.customizer.visibilityDescription',
                        'Defina quais áreas aparecem no menu lateral.',
                      )}
                    </p>
                  </div>

                  <span className='sidebar-customizer-counter'>
                    {visibleCount}/{SECTIONS.length}
                  </span>
                </div>

                <div className='sidebar-customizer-actions'>
                  <button type='button' onClick={showAll}>
                    {text('sidebar.customizer.showAll', 'Mostrar todos')}
                  </button>

                  <button type='button' onClick={hideOptional}>
                    {text(
                      'sidebar.customizer.restoreDefault',
                      'Restaurar padrão',
                    )}
                  </button>
                </div>

                <div className='sidebar-customizer-list'>
                  {allSections.map((section) => {
                    const enabled = Boolean(config.visible[section.id]);

                    const isRequired =
                      section.id === 'dashboard' || section.id === 'profile';

                    return (
                      <div
                        key={section.id}
                        className={[
                          'sidebar-customizer-row',
                          enabled ? 'enabled' : 'disabled',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className='sidebar-customizer-row-main'>
                          <span
                            className='sidebar-customizer-row-icon'
                            aria-hidden='true'
                          >
                            {section.icon}
                          </span>

                          <div>
                            <strong>{section.label}</strong>

                            <small>
                              {isRequired
                                ? text(
                                    'sidebar.customizer.alwaysVisible',
                                    'Sempre disponível',
                                  )
                                : enabled
                                  ? text(
                                      'sidebar.customizer.visible',
                                      'Visível no menu',
                                    )
                                  : text(
                                      'sidebar.customizer.hidden',
                                      'Oculto do menu',
                                    )}
                            </small>
                          </div>
                        </div>

                        <button
                          type='button'
                          className={['sidebar-switch', enabled ? 'on' : 'off']
                            .filter(Boolean)
                            .join(' ')}
                          disabled={isRequired}
                          onClick={() => updateVisibility(section.id, !enabled)}
                          aria-pressed={enabled}
                          aria-label={
                            enabled
                              ? text(
                                  'sidebar.customizer.hide',
                                  `Ocultar ${section.label}`,
                                )
                              : text(
                                  'sidebar.customizer.show',
                                  `Mostrar ${section.label}`,
                                )
                          }
                          title={
                            enabled
                              ? text('sidebar.customizer.hide', 'Ocultar')
                              : text('sidebar.customizer.show', 'Mostrar')
                          }
                        >
                          <span />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===================================================
                REFERENCES
            ==================================================== */}

            {customizerTab === 'references' && (
              <div className='sidebar-customizer-content'>
                <div className='sidebar-customizer-info'>
                  <div>
                    <strong>
                      {text(
                        'sidebar.customizer.referencesTitle',
                        'Referências entre módulos',
                      )}
                    </strong>

                    <p>
                      {text(
                        'sidebar.customizer.referencesDescription',
                        'Controle quais módulos podem aparecer como referência em outras áreas.',
                      )}
                    </p>
                  </div>

                  <span className='sidebar-customizer-counter'>
                    {referenceCount}/{SECTIONS.length}
                  </span>
                </div>

                <div className='sidebar-customizer-list'>
                  {allSections.map((section) => {
                    const enabled = Boolean(config.references[section.id]);

                    return (
                      <div
                        key={section.id}
                        className={[
                          'sidebar-customizer-row',
                          enabled ? 'enabled' : 'disabled',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <div className='sidebar-customizer-row-main'>
                          <span
                            className='sidebar-customizer-row-icon'
                            aria-hidden='true'
                          >
                            {section.icon}
                          </span>

                          <div>
                            <strong>{section.label}</strong>

                            <small>
                              {enabled
                                ? text(
                                    'sidebar.customizer.referenceEnabled',
                                    'Pode ser usado como referência',
                                  )
                                : text(
                                    'sidebar.customizer.referenceDisabled',
                                    'Referência desativada',
                                  )}
                            </small>
                          </div>
                        </div>

                        <button
                          type='button'
                          className={['sidebar-switch', enabled ? 'on' : 'off']
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => toggleReference(section.id)}
                          aria-pressed={enabled}
                          aria-label={
                            enabled
                              ? text(
                                  'sidebar.customizer.disableReference',
                                  `Desativar referência de ${section.label}`,
                                )
                              : text(
                                  'sidebar.customizer.enableReference',
                                  `Ativar referência de ${section.label}`,
                                )
                          }
                        >
                          <span />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FOOTER */}

            <div className='sidebar-customizer-footer'>
              <button
                type='button'
                className='sidebar-customizer-reset'
                onClick={restoreDefaults}
              >
                ↺{' '}
                {text('sidebar.customizer.restore', 'Restaurar configurações')}
              </button>

              <button
                type='button'
                className='sidebar-customizer-done'
                onClick={() => setShowCustomizer(false)}
              >
                {text('sidebar.customizer.done', 'Concluir')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
