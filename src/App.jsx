import React, { useEffect, useState } from 'react';

import { clearSession, getCurrentUser } from './services/api';
import { useAppData } from './hooks/useAppData';

// Autenticação e navegação
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Perfil from './components/Perfil';

// Painel principal
import PainelPrincipal from './components/PainelPrincipal';

// Organização pessoal
import SmartCalendar from './components/SmartCalendar';
import Diario from './components/Diario';
import Estudos from './components/Estudos';
import Goals from './components/Goals';
import HabitsPage from './components/HabitsPage';

// Coleções e conquistas
import ColecoesConquistas from './components/ColecoesConquistas';

// Ciência de dados
import DataDashboard from './components/DataDashboard';
import AdvancedDataScience from './components/AdvancedDataScience';

// Finanças
import Finance from './components/Finance';
import Investments from './components/Investments';

// Projetos e tarefas
import Tasks from './components/Tasks';
import ProjetosColaborativos from './components/ProjetosColaborativos';

// Assistente e gamificação
import Assistant from './components/Assistant';
import Gamification from './components/Gamification';
import Connections from './components/Connections';
import Foguinho from './components/Foguinho';
import Grupos from './components/Grupos';

export default function App() {
  // =========================================
  // USUÁRIO E SESSÃO DO BACKEND
  // =========================================
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const user = await getCurrentUser();

        if (active) {
          setCurrentUser(user);
        }
      } catch (error) {
        if (active) {
          setCurrentUser(null);

          if (error.status !== 401 && error.status !== 404) {
            setAuthError(
              error.message || 'Não foi possível verificar sua sessão.',
            );
          }
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  // O hook recebe o usuário completo.
  const appDataHook = useAppData(currentUser);

  const {
    data,
    save,
    period,
    setPeriod,
    daily,
    levelInfo,
    productivityScore,
    bestHour,
    pendingTasks,
    completedTasks,
    completion,
    records,
    moodAverage,
    totalXP,
    totalDone,
    spent,
    overload,
    completeTask,
    updateHistory,
    cloudReady,
    syncError,
    syncStatus,
  } = appDataHook;

  // =========================================
  // ESTADO DA INTERFACE
  // =========================================
  const [activeSection, setActiveSection] = useState('dashboard');

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('assistant_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [answer, setAnswer] = useState('');
  const [askText, setAskText] = useState('');

  // =========================================
  // MODO FOCO
  // =========================================
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusCompleted, setFocusCompleted] = useState(false);

  useEffect(() => {
    if (!focusRunning) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setFocusSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          setFocusRunning(false);
          setFocusCompleted(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [focusRunning]);

  function openFocusMode() {
    setFocusTaskId('');
    setFocusMinutes(25);
    setFocusSeconds(25 * 60);
    setFocusRunning(false);
    setFocusCompleted(false);
    setFocusOpen(true);
  }

  function closeFocusMode() {
    setFocusRunning(false);
    setFocusOpen(false);
  }

  function resetFocusTimer() {
    setFocusRunning(false);
    setFocusCompleted(false);
    setFocusSeconds(focusMinutes * 60);
  }

  const formattedFocusTime = `${String(Math.floor(focusSeconds / 60)).padStart(
    2,
    '0',
  )}:${String(focusSeconds % 60).padStart(2, '0')}`;

  // =========================================
  // MODO ESCURO
  // =========================================
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);

    try {
      localStorage.setItem('assistant_dark_mode', String(darkMode));
    } catch {
      // Continua funcionando sem localStorage.
    }

    return () => {
      document.body.classList.remove('dark');
    };
  }, [darkMode]);

  // =========================================
  // LOGOUT
  // =========================================
  function handleLogout() {
    clearSession();

    setCurrentUser(null);
    setActiveSection('dashboard');
    setAnswer('');
    setAskText('');
  }

  // =========================================
  // AUTENTICAÇÃO
  // =========================================
  if (checkingSession) {
    return (
      <div className='auth-loading' role='status'>
        Verificando sua sessão...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        {authError && (
          <p role='alert' className='auth-error'>
            {authError}
          </p>
        )}

        <Auth onLogin={setCurrentUser} />
      </>
    );
  }

  // =========================================
  // DADOS AUXILIARES
  // =========================================
  const safeRecords = Array.isArray(records) ? records : [];

  const safePendingTasks = Array.isArray(pendingTasks) ? pendingTasks : [];

  const focusTask = safePendingTasks.find(
    (task) => String(task.id) === String(focusTaskId),
  );

  const safeCompletedTasks = Array.isArray(completedTasks)
    ? completedTasks
    : [];

  const assistantPriority = safePendingTasks.slice(0, 3);

  const assistantAdvice = overload
    ? 'Sua lista está pesada. Priorize apenas as 3 tarefas essenciais hoje.'
    : 'Seu próximo melhor passo é avançar nas tarefas de maior impacto.';

  const insights = [
    moodAverage
      ? `😊 Humor médio: ${moodAverage}/5 no período.`
      : '😊 Registre seu humor diariamente.',

    totalXP
      ? `⭐ Você registrou ${totalXP} XP no período.`
      : '⭐ Ainda não há XP histórico suficiente.',

    totalDone
      ? `✅ Você concluiu ${totalDone} tarefa(s).`
      : '✅ Conclua tarefas para medir sua produtividade.',

    spent
      ? `🎮 Você gastou ${spent} moedas em recompensas.`
      : '🎮 Nenhuma moeda gasta em recompensas.',
  ];

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  // =========================================
  // RENDERIZAÇÃO
  // =========================================
  return (
    <div id='app' className='app-layout'>
      <Sidebar
        currentUser={currentUser}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
      />

      <main className='main-content'>
        <header className='main-header'>
          <div>
            <h1>
              Meu Assistente{' '}
              <small
                style={{
                  fontSize: 13,
                  color: 'var(--site-primary)',
                }}
              >
                ({currentUser.email || 'Usuário'})
              </small>
            </h1>

            <div className='subtitle'>{todayLabel}</div>

            <div className='subtitle' role='status' aria-live='polite'>
              {syncStatus === 'loading' && '☁️ Carregando dados...'}

              {syncStatus === 'local' && '💾 Modo local'}

              {syncStatus === 'synced' && '☁️ Dados sincronizados'}

              {syncStatus === 'error' && '⚠️ Erro na sincronização'}
            </div>

            {syncError && (
              <p role='alert' className='auth-error'>
                {syncError}
              </p>
            )}

            {authError && (
              <p role='alert' className='auth-error'>
                {authError}
              </p>
            )}
          </div>

          <div className='actions'>
            <button type='button' className='ghost' onClick={openFocusMode}>
              🎯 Modo foco
            </button>

            <button
              type='button'
              className='ghost'
              onClick={handleLogout}
              style={{
                color: 'var(--site-danger)',
                borderColor: 'var(--site-danger)',
              }}
            >
              🚪 Sair
            </button>
          </div>
        </header>

        {/* =========================================
            PAINEL PRINCIPAL
        ========================================= */}
        {activeSection === 'dashboard' && (
          <PainelPrincipal
            data={data}
            completion={completion}
            level={levelInfo?.level ?? 1}
            nextXP={levelInfo?.nextXP ?? 0}
            progress={levelInfo?.progress ?? 0}
            daily={daily}
            productivityScore={productivityScore}
            bestHour={bestHour}
            pendingTasks={safePendingTasks}
          />
        )}

        {/* =========================================
            CALENDÁRIO
        ========================================= */}
        {activeSection === 'calendar' && (
          <SmartCalendar data={data} save={save} />
        )}

        {/* =========================================
            DIÁRIO
        ========================================= */}
        {activeSection === 'diario' && <Diario data={data} save={save} />}

        {/* =========================================
            ESTUDOS
        ========================================= */}
        {activeSection === 'estudos' && <Estudos />}

        {/* =========================================
            OBJETIVOS
        ========================================= */}
        {activeSection === 'goals' && <Goals data={data} save={save} />}

        {/* =========================================
            HÁBITOS
        ========================================= */}
        {activeSection === 'habits' && <HabitsPage data={data} save={save} />}

        {/* =========================================
            TAREFAS
        ========================================= */}
        {activeSection === 'tasks' && (
          <Tasks data={data} save={save} completeTask={completeTask} />
        )}

        {/* =========================================
            PROJETOS
            PÁGINA INDEPENDENTE
        ========================================= */}
        {activeSection === 'projects' && <ProjetosColaborativos />}

        {/* =========================================
            GRUPOS
            PÁGINA INDEPENDENTE
        ========================================= */}
        {activeSection === 'groups' && <Grupos />}

        {/* =========================================
            MEU PERFIL
        ========================================= */}
        {activeSection === 'profile' && (
          <Perfil currentUser={currentUser} setCurrentUser={setCurrentUser} />
        )}

        {/* =========================================
            COLEÇÕES E CONQUISTAS
        ========================================= */}
        {activeSection === 'collections' && (
          <ColecoesConquistas data={data} save={save} />
        )}

        {/* =========================================
            CIÊNCIA DE DADOS
        ========================================= */}
        {activeSection === 'fase12' && (
          <>
            <DataDashboard
              period={period}
              setPeriod={setPeriod}
              records={safeRecords}
              totalXP={totalXP}
              totalDone={totalDone}
              moodAverage={moodAverage}
              spent={spent}
              maxXP={Math.max(
                1,
                ...safeRecords.map((record) => Number(record.xp) || 0),
              )}
              maxDone={Math.max(
                1,
                ...safeRecords.map((record) => Number(record.completed) || 0),
              )}
              insights={insights}
            />

            <AdvancedDataScience data={data} />
          </>
        )}

        {/* =========================================
            FINANÇAS
        ========================================= */}
        {activeSection === 'fase13' && <Finance data={data} save={save} />}

        {/* =========================================
            INVESTIMENTOS
        ========================================= */}
        {activeSection === 'investments' && (
          <Investments data={data} save={save} />
        )}

        {/* =========================================
            GAMIFICAÇÃO
        ========================================= */}
        {activeSection === 'gamification' && (
          <Gamification
            data={data}
            completedTasks={safeCompletedTasks}
            save={save}
          />
        )}

        {/* =========================================
            CONEXÕES
        ========================================= */}
        {activeSection === 'connections' && <Connections />}

        {/* =========================================
            FOGUINHO
        ========================================= */}
        {activeSection === 'foguinho' && <Foguinho currentUser={currentUser} />}

        {/* =========================================
            ASSISTENTE
        ========================================= */}
        {activeSection === 'assistant' && (
          <Assistant
            data={data}
            pendingTasks={safePendingTasks}
            assistantPriority={assistantPriority}
            assistantAdvice={assistantAdvice}
            overload={overload}
            save={save}
          />
        )}

        {/* =========================================
            MODAL MODO FOCO
        ========================================= */}
        {focusOpen && (
          <div
            role='presentation'
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeFocusMode();
              }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'grid',
              placeItems: 'center',
              padding: 16,
              background: 'rgba(0, 0, 0, 0.72)',
            }}
          >
            <section
              role='dialog'
              aria-modal='true'
              aria-labelledby='focus-mode-title'
              style={{
                width: 'min(100%, 480px)',
                padding: 28,
                borderRadius: 20,
                color: 'var(--site-text, #f8fafc)',
                background: 'var(--site-card-bg, #172033)',
                border: '1px solid var(--site-border, #334155)',
                boxShadow: '0 24px 80px rgba(0,0,0,.35)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--site-primary)',
                      fontWeight: 800,
                    }}
                  >
                    SESSÃO DE PRODUTIVIDADE
                  </div>

                  <h2
                    id='focus-mode-title'
                    style={{
                      margin: '6px 0 4px',
                    }}
                  >
                    🎯 Modo foco
                  </h2>

                  <p
                    className='subtitle'
                    style={{
                      margin: 0,
                    }}
                  >
                    Uma tarefa por vez. Evite trocar de contexto.
                  </p>
                </div>

                <button
                  type='button'
                  className='ghost'
                  onClick={closeFocusMode}
                  aria-label='Fechar modo foco'
                >
                  ✕
                </button>
              </div>

              <label
                htmlFor='focus-task'
                style={{
                  display: 'block',
                  marginTop: 22,
                  marginBottom: 7,
                  fontWeight: 700,
                }}
              >
                O que você vai fazer?
              </label>

              <select
                id='focus-task'
                value={focusTaskId}
                disabled={focusRunning}
                onChange={(event) => setFocusTaskId(event.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  color: 'var(--site-text, #f8fafc)',
                  background: 'var(--site-background, #0f172a)',
                  border: '1px solid var(--site-border, #334155)',
                }}
              >
                <option value=''>Foco livre / estudo</option>

                {safePendingTasks.map((task) => (
                  <option key={task.id} value={String(task.id)}>
                    {task.title ||
                      task.name ||
                      task.text ||
                      'Tarefa sem título'}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '28px 0 20px',
                }}
              >
                <div
                  aria-live='polite'
                  style={{
                    width: 210,
                    height: 210,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    border: '8px solid var(--site-primary, #6366f1)',
                    boxShadow:
                      '0 0 0 8px color-mix(in srgb, var(--site-primary, #6366f1) 14%, transparent)',
                    fontSize: 48,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formattedFocusTime}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {[15, 25, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type='button'
                    className={focusMinutes === minutes ? 'primary' : 'ghost'}
                    disabled={focusRunning}
                    onClick={() => {
                      setFocusMinutes(minutes);
                      setFocusSeconds(minutes * 60);
                      setFocusCompleted(false);
                    }}
                    style={{
                      minWidth: 58,
                    }}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>

              {focusCompleted && (
                <p
                  role='status'
                  style={{
                    textAlign: 'center',
                    color: 'var(--site-primary)',
                    fontWeight: 800,
                    marginTop: 18,
                  }}
                >
                  🎉 Sessão concluída! Bom trabalho.
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 22,
                }}
              >
                <button
                  type='button'
                  className='primary'
                  onClick={() => {
                    if (focusSeconds <= 0) {
                      resetFocusTimer();
                    }

                    setFocusCompleted(false);

                    setFocusRunning((running) => !running);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 44,
                  }}
                >
                  {focusRunning
                    ? 'Pausar'
                    : focusSeconds === 0
                      ? 'Recomeçar'
                      : 'Iniciar foco'}
                </button>

                <button
                  type='button'
                  className='ghost'
                  onClick={resetFocusTimer}
                  style={{
                    minHeight: 44,
                  }}
                >
                  Reiniciar
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
