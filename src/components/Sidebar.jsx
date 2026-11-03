import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Sidebar.css';
import brandIcon from '../../resources/icon-only.png';

const SECTIONS = [
  { id: 'dashboard', icon: '🏠', fallback: 'Dashboard' },
  { id: 'tasks', icon: '✅', fallback: 'Tarefas' },
  { id: 'processos', icon: '⚙️', fallback: 'Processos' },
  { id: 'calendar', icon: '📅', fallback: 'Calendário' },
  { id: 'diario', icon: '📔', fallback: 'Diário' },
  { id: 'estudos', icon: '📚', fallback: 'Estudos' },
  { id: 'goals', icon: '🎯', fallback: 'Metas' },
  { id: 'habits', icon: '🔁', fallback: 'Hábitos' },
  { id: 'evolucao', icon: '📈', fallback: 'Evolução' },
  { id: 'projects', icon: '🚀', fallback: 'Projetos' },
  { id: 'groups', icon: '👥', fallback: 'Grupos' },
  { id: 'collections', icon: '🗂️', fallback: 'Coleções' },
  { id: 'dataScience', icon: '📊', fallback: 'Dados' },
  { id: 'reports', icon: '📑', fallback: 'Relatórios' },
  { id: 'tags', icon: '🏷️', fallback: 'Tags' },
  { id: 'gamification', icon: '🎮', fallback: 'Gamificação' },
  { id: 'finance', icon: '💰', fallback: 'Finanças' },
  { id: 'investments', icon: '📈', fallback: 'Investimentos' },
  { id: 'connections', icon: '🤝', fallback: 'Conexões' },
  { id: 'foguinho', icon: '🔥', fallback: 'Sequência' },
  { id: 'assistant', icon: '🤖', fallback: 'Assistente' },
  { id: 'profile', icon: '👤', fallback: 'Meu Perfil' },
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
  profile: false,
};

const DEFAULT_REFERENCES = Object.fromEntries(
  SECTIONS.map((section) => [section.id, true]),
);

const STORAGE_PREFIX = 'meu-assistente-sidebar-config-';

function getStorageKey(user) {
  const identifier = user?.id || user?.email || user?.username || 'default';

  return `${STORAGE_PREFIX}${identifier}`;
}

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getInitialConfig(user) {
  try {
    const saved = localStorage.getItem(getStorageKey(user));
    const parsed = saved ? safeParse(saved, {}) : {};

    return {
      visible: {
        ...DEFAULT_VISIBLE,
        ...(parsed.visible || {}),
        dashboard: true,
      },
      searchVisible:
        typeof parsed.searchVisible === 'boolean' ? parsed.searchVisible : true,
    };
  } catch {
    return {
      visible: { ...DEFAULT_VISIBLE },
      searchVisible: true,
    };
  }
}

function cleanNavLabel(value) {
  return String(value || '')
    .replace(/^(?:\p{Extended_Pictographic}\uFE0F?\s*)+/u, '')
    .trim();
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  onNavigate,
  currentUser,
  data,
  save,
  darkMode = false,
  setDarkMode,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const { t } = useLanguage();

  const [config, setConfig] = useState(() => getInitialConfig(currentUser));

  const [search, setSearch] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerTab, setCustomizerTab] = useState('visibility');

  // REFERÊNCIAS: fonte única de dados = useAppData.
  const references = useMemo(
    () => ({
      ...DEFAULT_REFERENCES,
      ...(data?.settings?.moduleReferences || {}),
    }),
    [data?.settings?.moduleReferences],
  );

  // Atualiza as configurações quando a conta muda.
  useEffect(() => {
    setConfig(getInitialConfig(currentUser));
    setSearch('');
  }, [currentUser]);

  // Persiste somente visibilidade e pesquisa no armazenamento local.
  // Referências são armazenadas no appData, não aqui.
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(currentUser), JSON.stringify(config));
    } catch {
      // Ignora falhas de armazenamento.
    }
  }, [config, currentUser]);

  // Fecha a janela com ESC.
  useEffect(() => {
    if (!showCustomizer) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowCustomizer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCustomizer]);

  const text = (key, fallback) => {
    try {
      const value = t(key);

      return value && typeof value === 'string' && value !== key
        ? value
        : fallback;
    } catch {
      return fallback;
    }
  };

  const getLabel = (section) =>
    cleanNavLabel(text(`nav.${section.id}`, section.fallback));

  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return SECTIONS.filter((section) => {
      if (section.id !== 'dashboard' && !config.visible[section.id]) {
        return false;
      }

      if (!normalizedSearch) return true;

      return (
        getLabel(section).toLowerCase().includes(normalizedSearch) ||
        section.id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [search, config.visible, t]);

  const allSections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        label: getLabel(section),
      })),
    [t],
  );

  function handleNavigate(sectionId) {
    setShowCustomizer(false);

    const navigate = onNavigate || setActiveSection;

    if (typeof navigate === 'function') {
      navigate(sectionId);
    }

    if (onClose && window.matchMedia('(max-width: 900px)').matches) {
      onClose();
    }
  }

  function updateVisibility(sectionId, value) {
    if (sectionId === 'dashboard') return;

    setConfig((previous) => ({
      ...previous,
      visible: {
        ...previous.visible,
        [sectionId]: value,
      },
    }));
  }

  // IMPORTANTE:
  // Salva as referências diretamente no useAppData.
  function updateReference(sectionId, value) {
    if (typeof save !== 'function' || !data) {
      console.error(
        '[Sidebar] Passe as propriedades data e save do useAppData.',
      );
      return;
    }

    const currentSettings = data.settings || {};

    const currentReferences = {
      ...DEFAULT_REFERENCES,
      ...(currentSettings.moduleReferences || {}),
    };

    const updatedData = {
      ...data,
      settings: {
        ...currentSettings,
        moduleReferences: {
          ...currentReferences,
          [sectionId]: value,
        },
      },
    };

    save(updatedData);
  }

  function toggleReference(sectionId) {
    updateReference(sectionId, !references[sectionId]);
  }

  function updateSearchVisibility(value) {
    setConfig((previous) => ({
      ...previous,
      searchVisible: value,
    }));

    if (!value) setSearch('');
  }

  function showAll() {
    const visible = {};

    SECTIONS.forEach((section) => {
      visible[section.id] = true;
    });

    setConfig((previous) => ({
      ...previous,
      visible,
    }));
  }

  function hideOptional() {
    setConfig((previous) => ({
      ...previous,
      visible: { ...DEFAULT_VISIBLE },
    }));
  }

  function restoreDefaults() {
    setConfig({
      visible: { ...DEFAULT_VISIBLE },
      searchVisible: true,
    });

    // Restaura as referências no appData.
    if (typeof save === 'function' && data) {
      save({
        ...data,
        settings: {
          ...(data.settings || {}),
          moduleReferences: { ...DEFAULT_REFERENCES },
        },
      });
    }
  }

  const visibleCount = SECTIONS.filter(
    (section) => config.visible[section.id],
  ).length;

  const referenceCount = SECTIONS.filter(
    (section) => references[section.id],
  ).length;

  const sidebarClassName = [
    'sidebar',
    isOpen ? 'sidebar-open' : 'sidebar-closed',
  ].join(' ');

  return (
    <>
      {isOpen && (
        <button
          type='button'
          className='sidebar-overlay'
          aria-label='Fechar menu'
          onClick={onClose}
        />
      )}

      <aside className={sidebarClassName}>
        <div className='sidebar-inner'>
          {/* IDENTIDADE */}

          <div className='sidebar-brand'>
            <button
              type='button'
              className='sidebar-brand-button'
              onClick={() => handleNavigate('dashboard')}
              aria-label='Abrir Dashboard'
            >
              <div className='logo'>
                <img src={brandIcon} alt='Meu Assistente' />
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
              aria-label='Fechar menu'
            >
              ×
            </button>
          </div>

          {/* PESQUISA */}

          {config.searchVisible && (
            <div className='sidebar-search'>
              <label htmlFor='sidebar-search' className='sr-only'>
                Pesquisar no menu
              </label>

              <span className='sidebar-search-icon' aria-hidden='true'>
                <svg viewBox='0 0 24 24' focusable='false'>
                  <circle cx='10.8' cy='10.8' r='6.8' />
                  <path d='m16 16 4.2 4.2' />
                </svg>
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
                  aria-label='Limpar pesquisa'
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* NAVEGAÇÃO */}

          <nav className='sidebar-nav' aria-label='Navegação principal'>
            {filteredSections.length > 0 ? (
              <div className='sidebar-section-list'>
                {filteredSections.map((section) => {
                  const label = getLabel(section);
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type='button'
                      className={[
                        'sidebar-nav-item',
                        isActive ? 'active' : '',
                      ].join(' ')}
                      onClick={() => handleNavigate(section.id)}
                      aria-current={isActive ? 'page' : undefined}
                      title={label}
                    >
                      <span className='sidebar-nav-icon'>{section.icon}</span>

                      <span className='sidebar-nav-label'>{label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className='sidebar-empty'>
                <span>🔎</span>
                <strong>Nenhum resultado</strong>
                <span>Tente outro termo de pesquisa.</span>
              </div>
            )}
          </nav>

          {/* PERSONALIZAÇÃO */}

          <div className='sidebar-customize'>
            <button
              type='button'
              className='sidebar-customize-button'
              onClick={() => {
                setCustomizerTab('visibility');
                setShowCustomizer(true);
              }}
            >
              <span className='sidebar-customize-icon'>⚙️</span>
              <span>Personalizar menu</span>
            </button>
          </div>

          {/* RODAPÉ */}

          <div className='sidebar-footer'>
            <div className='sidebar-footer-stats'>
              <span>
                {visibleCount}/{SECTIONS.length} visíveis
              </span>

              <span>
                {referenceCount}/{SECTIONS.length} referências
              </span>
            </div>

            <div className='sidebar-footer-actions'>
              <button
                type='button'
                className='sidebar-theme-toggle'
                onClick={() => setDarkMode?.(!darkMode)}
                aria-pressed={Boolean(darkMode)}
              >
                <span>{darkMode ? '☀️' : '🌙'}</span>
                <span>{darkMode ? 'Modo claro' : 'Modo escuro'}</span>
              </button>

              <button
                type='button'
                className='sidebar-logout-button'
                onClick={onLogout}
                disabled={!onLogout}
              >
                <span>↪</span>
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* PERSONALIZADOR */}

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
            {/* CABEÇALHO */}

            <div className='sidebar-customizer-header'>
              <div>
                <span className='sidebar-customizer-eyebrow'>
                  PERSONALIZAÇÃO
                </span>

                <h2 id='sidebar-customizer-title'>Personalizar menu</h2>

                <p>
                  Escolha como os módulos aparecem no seu menu. Feche esta
                  janela para voltar à navegação.
                </p>
              </div>

              <button
                type='button'
                className='sidebar-customizer-close'
                onClick={() => setShowCustomizer(false)}
                aria-label='Fechar'
              >
                ×
              </button>
            </div>

            {/* ABAS */}

            <div className='sidebar-customizer-tabs'>
              <button
                type='button'
                className={customizerTab === 'visibility' ? 'active' : ''}
                onClick={() => setCustomizerTab('visibility')}
              >
                👁️ Visibilidade
              </button>

              <button
                type='button'
                className={customizerTab === 'references' ? 'active' : ''}
                onClick={() => setCustomizerTab('references')}
              >
                🔗 Referências
              </button>
            </div>

            {/* VISIBILIDADE */}

            {customizerTab === 'visibility' && (
              <div className='sidebar-customizer-content'>
                <div className='sidebar-customizer-info'>
                  <div>
                    <strong>Visibilidade dos módulos</strong>
                    <p>Defina quais áreas aparecem no menu lateral.</p>
                  </div>

                  <span className='sidebar-customizer-counter'>
                    {visibleCount}/{SECTIONS.length}
                  </span>
                </div>

                {/* CONTROLE DA PESQUISA */}

                <div className='sidebar-search-setting'>
                  <div className='sidebar-search-setting-info'>
                    <div className='sidebar-search-setting-icon'>
                      <span className='sidebar-search-setting-icon-symbol'>
                        <svg viewBox='0 0 24 24'>
                          <circle cx='10.8' cy='10.8' r='6.8' />
                          <path d='m16 16 4.2 4.2' />
                        </svg>
                      </span>

                      <span>
                        <strong>Barra de pesquisa</strong>
                        <small>
                          {config.searchVisible
                            ? 'Visível no menu lateral'
                            : 'Oculta do menu lateral'}
                        </small>
                      </span>
                    </div>
                  </div>

                  <label className='sidebar-switch-label'>
                    <input
                      type='checkbox'
                      checked={config.searchVisible}
                      onChange={(event) =>
                        updateSearchVisibility(event.target.checked)
                      }
                      aria-label='Mostrar barra de pesquisa'
                    />

                    <span className='sidebar-switch'>
                      <span />
                    </span>
                  </label>
                </div>

                <div className='sidebar-customizer-actions'>
                  <button type='button' onClick={showAll}>
                    Mostrar todos
                  </button>

                  <button type='button' onClick={hideOptional}>
                    Restaurar padrão
                  </button>
                </div>

                <div className='sidebar-customizer-list'>
                  {allSections.map((section) => {
                    const enabled = Boolean(config.visible[section.id]);

                    // Somente o Dashboard é obrigatório.
                    const isRequired = section.id === 'dashboard';

                    return (
                      <div
                        key={section.id}
                        className={[
                          'sidebar-customizer-row',
                          enabled ? 'enabled' : 'disabled',
                        ].join(' ')}
                      >
                        <div className='sidebar-customizer-row-main'>
                          <span className='sidebar-customizer-row-icon'>
                            {section.icon}
                          </span>

                          <div>
                            <strong>{section.label}</strong>

                            <small>
                              {isRequired
                                ? 'Sempre disponível'
                                : enabled
                                  ? 'Visível no menu'
                                  : 'Oculto do menu'}
                            </small>
                          </div>
                        </div>

                        <button
                          type='button'
                          className={[
                            'sidebar-switch',
                            enabled ? 'on' : 'off',
                          ].join(' ')}
                          disabled={isRequired}
                          onClick={() => updateVisibility(section.id, !enabled)}
                          aria-pressed={enabled}
                        >
                          <span />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REFERÊNCIAS */}

            {customizerTab === 'references' && (
              <div className='sidebar-customizer-content'>
                <div className='sidebar-customizer-info'>
                  <div>
                    <strong>Referências entre módulos</strong>

                    <p>
                      Controle quais módulos podem aparecer como referência em
                      outras áreas.
                    </p>
                  </div>

                  <span className='sidebar-customizer-counter'>
                    {referenceCount}/{SECTIONS.length}
                  </span>
                </div>

                <div className='sidebar-customizer-list'>
                  {allSections.map((section) => {
                    const enabled = Boolean(references[section.id]);

                    return (
                      <div
                        key={section.id}
                        className={[
                          'sidebar-customizer-row',
                          enabled ? 'enabled' : 'disabled',
                        ].join(' ')}
                      >
                        <div className='sidebar-customizer-row-main'>
                          <span className='sidebar-customizer-row-icon'>
                            {section.icon}
                          </span>

                          <div>
                            <strong>{section.label}</strong>

                            <small>
                              {enabled
                                ? 'Pode ser usado como referência'
                                : 'Referência desativada'}
                            </small>
                          </div>
                        </div>

                        <button
                          type='button'
                          className={[
                            'sidebar-switch',
                            enabled ? 'on' : 'off',
                          ].join(' ')}
                          onClick={() => toggleReference(section.id)}
                          aria-pressed={enabled}
                          aria-label={
                            enabled
                              ? `Desativar referência de ${section.label}`
                              : `Ativar referência de ${section.label}`
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

            {/* RODAPÉ */}

            <div className='sidebar-customizer-footer'>
              <button
                type='button'
                className='sidebar-customizer-reset'
                onClick={restoreDefaults}
              >
                ↺ Restaurar configurações
              </button>

              <button
                type='button'
                className='sidebar-customizer-done'
                onClick={() => setShowCustomizer(false)}
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
