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
import { getReferenceData } from './utils/moduleReferences';

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

  // Dados filtrados apenas para telas agregadoras. Cada página continua
  // usando seus dados completos; referências bloqueadas não aparecem fora dela.
  const referenceData = getReferenceData(data);
  const pageData = (moduleId) => getReferenceData(data, moduleId);
  const referencePendingTasks = Array.isArray(referenceData?.tasks)
    ? referenceData.tasks.filter((task) => !task.done)
    : [];
  const gamificationReferenceData = getReferenceData(data, 'gamification');
  const gamificationCompletedTasks = Array.isArray(gamificationReferenceData?.tasks)
    ? gamificationReferenceData.tasks.filter((task) => task.done)
    : [];
  const dashboardTasks = Array.isArray(referenceData?.tasks) ? referenceData.tasks : [];
  const dashboardHabits = Array.isArray(referenceData?.habits) ? referenceData.habits : [];
  const dashboardGoals = Array.isArray(referenceData?.goals) ? referenceData.goals : [];

  // Progresso do dia: considera apenas compromissos realmente relacionados
  // a hoje. Não usa o total histórico de tarefas, pois isso distorcia o
  // percentual do dia.
  const isSameDay = (value) => {
    if (!value) return false;
    return String(value).slice(0, 10) === String(today).slice(0, 10);
  };

  const todayDashboardTasks = dashboardTasks.filter((task) => {
    if (!task || task.cancelled || task.canceled || task.status === 'cancelled') return false;

    // Tarefas sem data também entram no planejamento do dia.
    // Antes, o painel exigia `date` ou `deadline` e acabava mostrando
    // 0% e 0 XP mesmo quando havia várias tarefas registradas.
    const hasDate = Boolean(task.date || task.deadline);
    return !hasDate || isSameDay(task.date) || isSameDay(task.deadline);
  });

  const todayDashboardHabits = dashboardHabits.filter((habit) => {
    if (!habit || habit.active === false || habit.isActive === false) return false;
    // Hábitos são considerados compromissos diários por padrão.
    const frequency = String(habit.frequency || habit.frequencyType || 'daily').toLowerCase();
    return frequency === 'daily' || frequency === 'diaria' || frequency === 'diário' || frequency === '1x';
  });

  const todayDashboardGoals = dashboardGoals.filter((goal) => {
    if (!goal || !isSameDay(goal.deadline)) return false;
    return !(goal.done || ['completed', 'concluido', 'concluida'].includes(String(goal.status || '').toLowerCase()));
  });

  const dailyTotalItems = todayDashboardTasks.length + todayDashboardHabits.length + todayDashboardGoals.length;
  const dailyDoneItems =
    todayDashboardTasks.filter((task) => Boolean(task.done)).length +
    todayDashboardHabits.filter((habit) => Boolean(habit.history?.[today] ?? habit.done)).length +
    dashboardGoals.filter((goal) => isSameDay(goal.deadline) && (goal.done || ['completed', 'concluido', 'concluida'].includes(String(goal.status || '').toLowerCase()))).length;

  const dashboardCompletion = dailyTotalItems
    ? Math.round((dailyDoneItems / dailyTotalItems) * 100)
    : 0;

  const dailyXpMax =
    todayDashboardTasks.reduce((sum, task) => sum + Math.max(0, Number(task.xp) || 0), 0) +
    todayDashboardHabits.reduce((sum, habit) => sum + Math.max(0, Number(habit.xp ?? habit.xpReward ?? 20) || 20), 0) +
    todayDashboardGoals.reduce((sum, goal) => sum + Math.max(0, Number(goal.xpReward ?? goal.xp ?? 100) || 100), 0);

  const dailyXpDone =
    todayDashboardTasks.filter((task) => task.done).reduce((sum, task) => sum + Math.max(0, Number(task.xp) || 0), 0) +
    todayDashboardHabits.filter((habit) => Boolean(habit.history?.[today] ?? habit.done)).reduce((sum, habit) => sum + Math.max(0, Number(habit.xp ?? habit.xpReward ?? 20) || 20), 0) +
    dashboardGoals.filter((goal) => isSameDay(goal.deadline) && (goal.done || ['completed', 'concluido', 'concluida'].includes(String(goal.status || '').toLowerCase()))).reduce((sum, goal) => sum + Math.max(0, Number(goal.xpReward ?? goal.xp ?? 100) || 100), 0);
  const dashboardGamificationEnabled = gamificationReferenceData?.xp !== 0 || getReferenceData(data).settings?.moduleReferences?.gamification !== false;
  const dashboardLevel = dashboardGamificationEnabled ? (levelInfo?.level ?? 1) : 1;
  const dashboardNextXP = dashboardGamificationEnabled ? (levelInfo?.nextXP ?? 0) : 0;
  const dashboardProgress = dashboardGamificationEnabled ? (levelInfo?.progress ?? 0) : 0;

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

  const assistantPriority = referencePendingTasks.slice(0, 3);

  const assistantOverload = referencePendingTasks.length >= 6;
  const assistantAdvice = assistantOverload
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
        save={save}
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
            data={referenceData}
            completion={dashboardCompletion}
            dailyXpDone={dailyXpDone}
            dailyXpMax={dailyXpMax}
            level={dashboardLevel}
            nextXP={dashboardNextXP}
            progress={dashboardProgress}
            daily={daily}
            productivityScore={productivityScore}
            bestHour={bestHour}
            pendingTasks={referencePendingTasks}
            today={today}
            save={save}
            sourceData={data}
            onToggleTask={handleDashboardToggleTask}
            onToggleHabit={handleDashboardToggleHabit}
          />
        )}

        {/* =====================================================
            CALENDÁRIO
        ===================================================== */}

        {activeSection === 'calendar' && (
          <SmartCalendar data={pageData('calendar')} save={save} completeTask={completeTask} />
        )}

        {/* =====================================================
            DIÁRIO
        ===================================================== */}

        {activeSection === 'diario' && <Diario data={pageData('diario')} save={save} />}

        {/* =====================================================
            ESTUDOS
        ===================================================== */}

        {activeSection === 'estudos' && <Estudos data={pageData('estudos')} save={save} />}

        {/* =====================================================
            OBJETIVOS
        ===================================================== */}

        {activeSection === 'goals' && <Goals data={pageData('goals')} save={save} />}

        {/* =====================================================
            HÁBITOS
        ===================================================== */}

        {activeSection === 'habits' && <HabitsPage data={pageData('habits')} save={save} />}

        {/* =====================================================
            TAREFAS
        ===================================================== */}

        {activeSection === 'tasks' && (
          <Tasks data={pageData('tasks')} save={save} completeTask={completeTask} />
        )}

        {/* =====================================================
            PROCESSOS
        ===================================================== */}

        {activeSection === 'processos' && <Processos data={pageData('processos')} save={save} />}

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

        {activeSection === 'evolucao' && <Evolucao data={pageData('evolucao')} save={save} />}

        {/* =====================================================
            COLEÇÕES / CONQUISTAS
        ===================================================== */}

        {activeSection === 'collections' && (
          <ColecoesConquistas data={pageData('collections')} save={save} />
        )}

        {/* =====================================================
            CIÊNCIA DE DADOS
        ===================================================== */}

        {activeSection === 'fase12' && (
          <>
            <DataDashboard
              data={pageData('reports')}
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

            <AdvancedDataScience data={pageData('reports')} />
          </>
        )}

        {activeSection === 'reports' && <Reports data={pageData('reports')} />}

        {activeSection === 'tags' && <TagsManager data={pageData('tags')} save={save} />}

        {/* =====================================================
            FINANÇAS
        ===================================================== */}

        {activeSection === 'fase13' && <Finance data={pageData('finance')} save={save} />}

        {/* =====================================================
            INVESTIMENTOS
        ===================================================== */}

        {activeSection === 'investments' && (
          <Investments data={pageData('investments')} save={save} />
        )}

        {/* =====================================================
            GAMIFICAÇÃO
        ===================================================== */}

        {activeSection === 'gamification' && (
          <Gamification
            data={pageData('gamification')}
            completedTasks={gamificationCompletedTasks}
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
            data={pageData('assistant')}
            pendingTasks={referencePendingTasks}
            assistantPriority={assistantPriority}
            assistantAdvice={assistantAdvice}
            overload={assistantOverload}
            save={save}
          />
        )}
      </main>
    </div>
  );
}
