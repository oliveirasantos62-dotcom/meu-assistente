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
import Evolucao from './components/Evolucao';

// Coleções e conquistas
import ColecoesConquistas from './components/ColecoesConquistas';

// Ciência de dados
import DataDashboard from './components/DataDashboard';
import AdvancedDataScience from './components/AdvancedDataScience';
import Reports from './components/Reports';
import TagsManager from './components/TagsManager';
import Personalization from './components/Personalization';

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
import Processos from './components/Processos';

export default function App() {
  // =========================================================
  // AUTENTICAÇÃO
  // =========================================================

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

  // =========================================================
  // DADOS PRINCIPAIS
  // =========================================================

  const appDataHook = useAppData(currentUser);

  const {
    data,
    save,
    period,
    setPeriod,
    today,
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

  // =========================================================
  // NAVEGAÇÃO
  // =========================================================

  const [activeSection, setActiveSection] = useState('dashboard');

  // =========================================================
  // TEMA
  // =========================================================

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('assistant_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  // =========================================================
  // ASSISTENTE
  // =========================================================

  const [answer, setAnswer] = useState('');
  const [askText, setAskText] = useState('');

  // =========================================================
  // MODO FOCO
  // =========================================================

  const [focusOpen, setFocusOpen] = useState(false);

  // ID da atividade selecionada.
  // Pode ser tarefa ou hábito.
  const [focusTaskId, setFocusTaskId] = useState('');

  // Tipo da atividade selecionada:
  // "task" ou "habit"
  const [focusItemType, setFocusItemType] = useState('');

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusCompleted, setFocusCompleted] = useState(false);

  // =========================================================
  // TIMER DO MODO FOCO
  // =========================================================

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

  // =========================================================
  // ABRIR MODO FOCO
  // =========================================================

  function openFocusMode() {
    setFocusTaskId('');
    setFocusItemType('');

    setFocusMinutes(25);
    setFocusSeconds(25 * 60);

    setFocusRunning(false);
    setFocusCompleted(false);

    setFocusOpen(true);

    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  }

  // =========================================================
  // FECHAR MODO FOCO
  // =========================================================

  function closeFocusMode() {
    setFocusRunning(false);
    setFocusOpen(false);

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    });
  }

  // =========================================================
  // RESET TIMER
  // =========================================================

  function resetFocusTimer() {
    setFocusRunning(false);
    setFocusCompleted(false);
    setFocusSeconds(focusMinutes * 60);
  }

  // =========================================================
  // TEMPO FORMATADO
  // =========================================================

  const formattedFocusTime = `${String(Math.floor(focusSeconds / 60)).padStart(
    2,
    '0',
  )}:${String(focusSeconds % 60).padStart(2, '0')}`;

  // =========================================================
  // TEMA
  // =========================================================

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

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    clearSession();

    setCurrentUser(null);
    setActiveSection('dashboard');

    setAnswer('');
    setAskText('');

    setFocusOpen(false);
    setFocusRunning(false);
    setFocusTaskId('');
    setFocusItemType('');
  }

  // =========================================================
  // AÇÕES DO PAINEL PRINCIPAL
  // =========================================================

  function handleDashboardToggleTask(taskId) {
    completeTask(taskId);
  }

  function handleDashboardToggleHabit(habitId) {
    const currentHabits = Array.isArray(data?.habits) ? data.habits : [];

    const currentToday = today || new Date().toISOString().slice(0, 10);

    const updatedHabits = currentHabits.map((habit) => {
      if (String(habit.id) !== String(habitId)) {
        return habit;
      }

      const history = {
        ...(habit.history || {}),
      };

      const hasToday = Object.prototype.hasOwnProperty.call(
        history,
        currentToday,
      );

      const currentDone = hasToday
        ? Boolean(history[currentToday])
        : Boolean(habit.done);

      const nextDone = !currentDone;

      history[currentToday] = nextDone;

      return {
        ...habit,
        history,
        done: nextDone,
      };
    });

    save({
      ...data,
      habits: updatedHabits,
    });
  }

  // =========================================================
  // LOADING / AUTENTICAÇÃO
  // =========================================================

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

  // =========================================================
  // DADOS SEGUROS
  // =========================================================

  const safeRecords = Array.isArray(records) ? records : [];

  const safePendingTasks = Array.isArray(pendingTasks) ? pendingTasks : [];

  const safeCompletedTasks = Array.isArray(completedTasks)
    ? completedTasks
    : [];

  // =========================================================
  // HÁBITOS PENDENTES
  //
  // Um hábito só aparece no Modo Foco se ainda não tiver
  // sido concluído hoje.
  // =========================================================

  const safeHabits = Array.isArray(data?.habits) ? data.habits : [];

  const pendingHabits = safeHabits.filter((habit) => {
    const history =
      habit.history && typeof habit.history === 'object' ? habit.history : {};

    const hasToday = Object.prototype.hasOwnProperty.call(history, today);

    const completedToday = hasToday
      ? Boolean(history[today])
      : Boolean(habit.done);

    return !completedToday;
  });

  // =========================================================
  // ATIVIDADE SELECIONADA NO MODO FOCO
  // =========================================================

  const focusTask =
    focusItemType === 'task'
      ? safePendingTasks.find((task) => String(task.id) === String(focusTaskId))
      : null;

  const focusHabit =
    focusItemType === 'habit'
      ? pendingHabits.find((habit) => String(habit.id) === String(focusTaskId))
      : null;

  // =========================================================
  // DADOS DO ASSISTENTE
  // =========================================================

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

  // =========================================================
  // MODO FOCO — TELA INDEPENDENTE
  // =========================================================

  if (focusOpen) {
    return (
      <div className='focus-page'>
        <div className='focus-page-inner'>
          {/* HEADER */}

          <header className='focus-page-header'>
            <div>
              <span className='focus-eyebrow'>MODO FOCO</span>

              <h1>
                {focusCompleted
                  ? 'Sessão concluída 🎉'
                  : 'Concentre-se no que importa'}
              </h1>

              <p>Escolha uma tarefa ou hábito pendente e concentre-se nele.</p>
            </div>

            <button
              type='button'
              className='focus-page-close'
              onClick={closeFocusMode}
            >
              ← Voltar
            </button>
          </header>

          {/* CONTEÚDO */}

          <section className='focus-page-content'>
            {/* TIMER */}

            <div className='focus-timer'>{formattedFocusTime}</div>

            {/* CONTROLES */}

            <div className='focus-controls'>
              <button
                type='button'
                className='focus-primary-button'
                onClick={() => {
                  if (focusCompleted) {
                    resetFocusTimer();
                  } else {
                    setFocusRunning((current) => !current);
                  }
                }}
              >
                {focusCompleted
                  ? '↻ Reiniciar'
                  : focusRunning
                    ? '⏸ Pausar'
                    : '▶ Iniciar'}
              </button>

              <button
                type='button'
                className='focus-secondary-button'
                onClick={resetFocusTimer}
              >
                Reiniciar
              </button>
            </div>

            {/* SELETOR DE ATIVIDADE */}

            <div className='focus-task-selector'>
              <label htmlFor='focus-item'>O que você quer focar?</label>

              <select
                id='focus-item'
                value={
                  focusItemType && focusTaskId
                    ? `${focusItemType}:${focusTaskId}`
                    : ''
                }
                onChange={(event) => {
                  const value = event.target.value;

                  if (!value) {
                    setFocusItemType('');
                    setFocusTaskId('');
                    return;
                  }

                  const separatorIndex = value.indexOf(':');

                  const type = value.slice(0, separatorIndex);

                  const id = value.slice(separatorIndex + 1);

                  setFocusItemType(type);
                  setFocusTaskId(id);
                }}
              >
                <option value=''>Escolha uma atividade</option>

                {/* TAREFAS PENDENTES */}

                {safePendingTasks.length > 0 && (
                  <optgroup label='📋 Tarefas pendentes'>
                    {safePendingTasks.map((task) => (
                      <option key={`task:${task.id}`} value={`task:${task.id}`}>
                        {task.name || task.title || 'Tarefa'}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* HÁBITOS PENDENTES */}

                {pendingHabits.length > 0 && (
                  <optgroup label='🔥 Hábitos pendentes hoje'>
                    {pendingHabits.map((habit) => (
                      <option
                        key={`habit:${habit.id}`}
                        value={`habit:${habit.id}`}
                      >
                        {habit.name || habit.title || 'Hábito'}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* NENHUMA ATIVIDADE */}

                {safePendingTasks.length === 0 &&
                  pendingHabits.length === 0 && (
                    <option disabled>Nenhuma atividade pendente hoje</option>
                  )}
              </select>
            </div>

            {/* ATIVIDADE SELECIONADA */}

            {(focusTask || focusHabit) && (
              <div className='focus-current-task'>
                <span>
                  {focusItemType === 'habit'
                    ? '🔥 Focando neste hábito'
                    : '📋 Focando nesta tarefa'}
                </span>

                <strong>
                  {focusItemType === 'habit'
                    ? focusHabit?.name ||
                      focusHabit?.title ||
                      'Hábito selecionado'
                    : focusTask?.name ||
                      focusTask?.title ||
                      'Tarefa selecionada'}
                </strong>
              </div>
            )}

            {/* DURAÇÃO */}

            <div className='focus-duration'>
              <span>Duração</span>

              <div className='focus-duration-buttons'>
                {[15, 25, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type='button'
                    className={focusMinutes === minutes ? 'active' : ''}
                    onClick={() => {
                      setFocusMinutes(minutes);
                      setFocusRunning(false);
                      setFocusCompleted(false);
                      setFocusSeconds(minutes * 60);
                    }}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =========================================================
  // INTERFACE PRINCIPAL
  // =========================================================

  return (
    <div id='app' className='app-layout'>
      {/* SIDEBAR */}

      <Sidebar
        currentUser={currentUser}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        data={data}
      />

      {/* CONTEÚDO */}

      <main className='main-content'>
        {/* HEADER */}

        <header className='main-header'>
          <div className='main-header-left'>
            <div>
              <span className='main-header-eyebrow'>Meu Assistente</span>

              <h1>
                {activeSection === 'dashboard' ? 'Visão geral' : activeSection}
              </h1>

              <p>{todayLabel}</p>
            </div>
          </div>

          {/* MODO FOCO */}

          <div className='main-header-actions'>
            <button
              type='button'
              className='header-focus-button'
              onClick={openFocusMode}
            >
              🎯 Modo foco
            </button>
          </div>
        </header>

        {/* =====================================================
            PAINEL PRINCIPAL
        ===================================================== */}

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
            today={today}
            onToggleTask={handleDashboardToggleTask}
            onToggleHabit={handleDashboardToggleHabit}
          />
        )}

        {/* =====================================================
            CALENDÁRIO
        ===================================================== */}

        {activeSection === 'calendar' && (
          <SmartCalendar data={data} save={save} completeTask={completeTask} />
        )}

        {/* =====================================================
            DIÁRIO
        ===================================================== */}

        {activeSection === 'diario' && <Diario data={data} save={save} />}

        {/* =====================================================
            ESTUDOS
        ===================================================== */}

        {activeSection === 'estudos' && <Estudos data={data} save={save} />}


        {/* =====================================================
            OBJETIVOS
        ===================================================== */}

        {activeSection === 'goals' && <Goals data={data} save={save} />}

        {/* =====================================================
            HÁBITOS
        ===================================================== */}

        {activeSection === 'habits' && <HabitsPage data={data} save={save} />}

        {/* =====================================================
            TAREFAS
        ===================================================== */}

        {activeSection === 'tasks' && (
          <Tasks data={data} save={save} completeTask={completeTask} />
        )}

        {/* =====================================================
            PROCESSOS
        ===================================================== */}

        {activeSection === 'processos' && <Processos data={data} save={save} />}

        {/* =====================================================
            PROJETOS
        ===================================================== */}

        {activeSection === 'projects' && <ProjetosColaborativos />}

        {/* =====================================================
            GRUPOS
        ===================================================== */}

        {activeSection === 'groups' && <Grupos />}

        {/* =====================================================
            PERFIL
        ===================================================== */}

        {activeSection === 'profile' && (
          <Perfil currentUser={currentUser} setCurrentUser={setCurrentUser} />
        )}

        {/* =====================================================
            EVOLUÇÃO
        ===================================================== */}

        {activeSection === 'evolucao' && <Evolucao data={data} save={save} />}

        {/* =====================================================
            COLEÇÕES / CONQUISTAS
        ===================================================== */}

        {activeSection === 'collections' && (
          <ColecoesConquistas data={data} save={save} />
        )}

        {/* =====================================================
            CIÊNCIA DE DADOS
        ===================================================== */}

        {activeSection === 'fase12' && (
          <>
            <DataDashboard
              data={data}
              records={safeRecords}
              period={period}
              setPeriod={setPeriod}
              daily={daily}
              productivityScore={productivityScore}
              bestHour={bestHour}
              completion={completion}
              moodAverage={moodAverage}
              totalXP={totalXP}
              totalDone={totalDone}
            />

            <AdvancedDataScience data={data} />
          </>
        )}

        {activeSection === 'reports' && <Reports data={data} />}

        {activeSection === 'tags' && <TagsManager data={data} save={save} />}

        {activeSection === 'personalization' && <Personalization data={data} save={save} />}

        {/* =====================================================
            FINANÇAS
        ===================================================== */}

        {activeSection === 'fase13' && <Finance data={data} save={save} />}

        {/* =====================================================
            INVESTIMENTOS
        ===================================================== */}

        {activeSection === 'investments' && (
          <Investments data={data} save={save} />
        )}

        {/* =====================================================
            GAMIFICAÇÃO
        ===================================================== */}

        {activeSection === 'gamification' && (
          <Gamification
            data={data}
            completedTasks={safeCompletedTasks}
            save={save}
          />
        )}

        {/* =====================================================
            CONEXÕES
        ===================================================== */}

        {activeSection === 'connections' && <Connections />}

        {/* =====================================================
            FOGUINHO
        ===================================================== */}

        {activeSection === 'foguinho' && <Foguinho currentUser={currentUser} />}

        {/* =====================================================
            ASSISTENTE
        ===================================================== */}

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
      </main>
    </div>
  );
}
