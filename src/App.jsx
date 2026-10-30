import React, { useEffect, useState } from 'react';

import { clearSession, getCurrentUser } from './services/api';
import { useAppData } from './hooks/useAppData';

// Autenticação e navegação
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';

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
        if (active) setCurrentUser(user);
      } catch (error) {
        if (active) {
          setCurrentUser(null);
          if (error.status !== 401 && error.status !== 404) {
            setAuthError(error.message || 'Não foi possível verificar sua sessão.');
          }
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    loadSession();
    return () => { active = false; };
  }, []);

  // O hook recebe o usuário completo, incluindo o UUID do Supabase.
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
  const [focusMode, setFocusMode] = useState(false);

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
  // MODO ESCURO
  // =========================================
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);

    try {
      localStorage.setItem('assistant_dark_mode', String(darkMode));
    } catch {
      // O aplicativo continua funcionando sem localStorage.
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
  // ESTADOS DE AUTENTICAÇÃO
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
    <div id='app' className={`app-layout ${focusMode ? 'focus-mode' : ''}`}>
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
            <button type='button' className={`ghost focus-mode-toggle ${focusMode ? 'is-active' : ''}`}
              onClick={() => setFocusMode(active => !active)} aria-pressed={focusMode}>
              {focusMode ? '↩️ Sair do foco' : '🎯 Modo foco'}
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

        {/* PAINEL PRINCIPAL */}
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

        {/* CALENDÁRIO */}
        {activeSection === 'calendar' && (
          <SmartCalendar data={data} save={save} />
        )}

        {/* DIÁRIO */}
        {activeSection === 'diario' && <Diario data={data} save={save} />}

        {/* ESTUDOS + LEITURA */}
        {activeSection === 'estudos' && <Estudos appData={data} saveAppData={save} />}

        {/* OBJETIVOS */}
        {activeSection === 'goals' && <Goals data={data} save={save} />}

        {/* HÁBITOS */}
        {activeSection === 'habits' && <HabitsPage data={data} save={save} />}

        {/* TAREFAS */}
        {activeSection === 'tasks' && (
          <Tasks data={data} save={save} completeTask={completeTask} />
        )}

        {/* PROJETOS */}
        {activeSection === 'projects' && <ProjetosColaborativos />}

        {/* COLEÇÕES E CONQUISTAS */}
        {activeSection === 'collections' && (
          <ColecoesConquistas data={data} save={save} />
        )}

        {/* CIÊNCIA DE DADOS */}
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

        {/* FINANÇAS */}
        {activeSection === 'fase13' && <Finance data={data} save={save} />}

        {/* INVESTIMENTOS */}
        {activeSection === 'investments' && (
          <Investments data={data} save={save} />
        )}

        {/* GAMIFICAÇÃO */}
        {activeSection === 'gamification' && (
          <Gamification
            data={data}
            completedTasks={safeCompletedTasks}
            save={save}
          />
        )}

        {/* CONEXÕES */}
        {activeSection === 'connections' && <Connections />}

        {/* FOGUINHO */}
        {activeSection === 'foguinho' && <Foguinho currentUser={currentUser} />}
        {activeSection === 'groups' && <Grupos />}

        {/* ASSISTENTE */}
        {activeSection === 'assistant' && (
          <Assistant
            data={data}
            pendingTasks={safePendingTasks}
            assistantPriority={assistantPriority}
            assistantAdvice={assistantAdvice}
            overload={overload}
          />
        )}
      </main>
    </div>
  );
}
