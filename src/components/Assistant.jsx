import React, { useMemo, useState } from 'react';

export default function Assistant({
  data = {},
  pendingTasks = [],
  assistantPriority = [],
  assistantAdvice = '',
  overload = false,
  save,
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerTitle, setAnswerTitle] = useState('');

  const tasks = Array.isArray(pendingTasks) ? pendingTasks : [];
  const priorities = Array.isArray(assistantPriority) ? assistantPriority : [];

  const xp = Number(data.xp || 0);
  const coins = Number(data.coins || 0);
  const level = Math.floor(xp / 100) + 1;

  const today = getTodayKey();
  const completedToday = Number(data.history?.[today]?.completed || 0);

  const financialStats = useMemo(() => {
    const transactions = Array.isArray(data.finance?.transactions)
      ? data.finance.transactions
      : [];

    const month = today.slice(0, 7);
    const monthTransactions = transactions.filter(
      (item) => String(item.date || '').slice(0, 7) === month,
    );

    const income = monthTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expenses = monthTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [data.finance, today]);

  const investmentStats = useMemo(() => {
    const investments = Array.isArray(data.investments) ? data.investments : [];

    const invested = investments.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.buyPrice || 0),
      0,
    );

    const current = investments.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.currentPrice || item.buyPrice || 0),
      0,
    );

    return {
      invested,
      current,
      profit: current - invested,
    };
  }, [data.investments]);

  const stats = useMemo(() => {
    const totalXP = tasks.reduce(
      (total, task) => total + Number(task.xp || 0),
      0,
    );

    const highPriority = tasks.filter((task) => {
      const priority = String(
        task.priority || task.prioridade || '',
      ).toLowerCase();

      return ['alta', 'high', 'urgente', 'alta prioridade'].includes(priority);
    }).length;

    const overdue = tasks.filter((task) => {
      const deadline = task.deadline || task.dueDate || task.dataLimite;

      if (!deadline) return false;

      const date = new Date(`${deadline}T00:00:00`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      return !Number.isNaN(date.getTime()) && date < now;
    }).length;

    return {
      total: tasks.length,
      totalXP,
      highPriority,
      overdue,
    };
  }, [tasks]);

  const suggestions = [
    {
      icon: '🎯',
      label: 'O que devo priorizar?',
      question: 'O que devo priorizar hoje?',
    },
    {
      icon: '⚖️',
      label: 'Estou sobrecarregado?',
      question: 'Estou com sobrecarga?',
    },
    {
      icon: '📊',
      label: 'Analisar meu progresso',
      question: 'Faça uma análise do meu progresso.',
    },
    {
      icon: '🧠',
      label: 'Como melhorar meu foco?',
      question: 'Como posso melhorar meu foco?',
    },
    {
      icon: '🌿',
      label: 'Preciso de uma pausa?',
      question: 'Devo fazer uma pausa?',
    },
    {
      icon: '🏆',
      label: 'Como evoluir de nível?',
      question: 'Como posso ganhar XP e evoluir de nível?',
    },
    {
      icon: '💰',
      label: 'Como estão minhas finanças?',
      question: 'Como estão minhas finanças este mês?',
    },
    {
      icon: '📈',
      label: 'Como estão meus investimentos?',
      question: 'Como estão meus investimentos?',
    },
  ];

  function respond(title, text) {
    setAnswerTitle(title);
    setAnswer(text);
  }

  function ask(customQuestion = question) {
    const text = String(customQuestion || '').trim();

    if (!text) {
      respond(
        'Faça uma pergunta',
        'Digite uma pergunta ou selecione uma das sugestões rápidas.',
      );
      return;
    }

    const q = text.toLowerCase();
    let response = '';
    let title = '💡 Sugestão para você';

    const asksOverload =
      q.includes('sobrecarga') ||
      q.includes('sobrecarregado') ||
      q.includes('cansado') ||
      q.includes('estresse') ||
      q.includes('muito trabalho');

    const asksAnalysis =
      q.includes('progresso') ||
      q.includes('análise') ||
      q.includes('analise') ||
      q.includes('estado geral') ||
      q.includes('resumo');

    const asksFocus =
      q.includes('foco') ||
      q.includes('concentração') ||
      q.includes('concentracao') ||
      q.includes('distrair');

    const asksBreak =
      q.includes('pausa') || q.includes('descansar') || q.includes('descanso');

    const asksXP =
      q.includes('xp') ||
      q.includes('nível') ||
      q.includes('nivel') ||
      q.includes('moedas') ||
      q.includes('recompensa');

    const asksPriority =
      q.includes('prioridade') ||
      q.includes('priorizar') ||
      q.includes('fazer primeiro') ||
      q.includes('começar') ||
      q.includes('comecar') ||
      q.includes('organizar');

    const asksFinance =
      q.includes('finança') ||
      q.includes('financa') ||
      q.includes('gasto') ||
      q.includes('dinheiro') ||
      q.includes('orçamento') ||
      q.includes('orcamento');

    const asksInvestments =
      q.includes('investimento') ||
      q.includes('carteira') ||
      q.includes('ação') ||
      q.includes('acoes') ||
      q.includes('fii');

    if (asksFinance) {
      title = '💰 Resumo financeiro';
      response =
        `Entradas no mês: ${formatMoney(financialStats.income)}\n` +
        `Gastos no mês: ${formatMoney(financialStats.expenses)}\n` +
        `Saldo do mês: ${formatMoney(financialStats.balance)}\n\n` +
        (financialStats.balance >= 0
          ? '✅ Seu fluxo está positivo neste período.'
          : '⚠️ Seus gastos superaram suas entradas neste período.');
    } else if (asksInvestments) {
      title = '📈 Resumo dos investimentos';
      response =
        `Valor investido: ${formatMoney(investmentStats.invested)}\n` +
        `Valor atual: ${formatMoney(investmentStats.current)}\n` +
        `Resultado: ${formatMoney(investmentStats.profit)}\n\n` +
        'Use o módulo Investimentos para atualizar cotações e acompanhar a alocação.';
    } else if (asksOverload) {
      title = '⚖️ Análise da sua carga';

      response = overload
        ? '⚠️ Seu aplicativo sinalizou uma possível sobrecarga.\n\n' +
          'Experimente:\n' +
          '1. Escolher no máximo três prioridades essenciais.\n' +
          '2. Dividir tarefas grandes em etapas menores.\n' +
          '3. Reagendar o que não for urgente.\n' +
          '4. Reservar tempo para descanso e pausas.\n\n' +
          'Você não precisa resolver tudo de uma vez.'
        : '✅ Sua carga não está marcada como sobrecarga.\n\n' +
          'Isso não significa que você não possa estar cansado. ' +
          'Observe sua energia, faça pausas e ajuste a agenda ' +
          'se perceber que o ritmo está excessivo.';
    } else if (asksAnalysis) {
      title = '📊 Seu progresso atual';

      response =
        `Tarefas pendentes: ${stats.total}\n` +
        `XP nas tarefas pendentes: ${stats.totalXP}\n` +
        `Tarefas com prioridade alta: ${stats.highPriority}\n` +
        `Prazos vencidos: ${stats.overdue}\n` +
        `Tarefas concluídas hoje: ${completedToday}\n\n` +
        `Nível atual: ${level}\n` +
        `XP acumulado: ${xp}\n` +
        `Moedas disponíveis: ${coins}\n\n` +
        (overload
          ? '⚠️ Recomendação: reduza o escopo do dia e concentre-se no essencial.'
          : '✅ Recomendação: escolha uma prioridade e avance nela antes de trocar de atividade.');
    } else if (asksFocus) {
      title = '🧠 Plano para recuperar o foco';

      response =
        'Experimente este ciclo:\n\n' +
        '1. Escolha apenas uma tarefa.\n' +
        '2. Deixe de lado as distrações.\n' +
        '3. Trabalhe por 20 minutos.\n' +
        '4. Faça uma pausa curta.\n' +
        '5. Registre o que conseguiu avançar.\n\n' +
        'Se estiver difícil começar, trabalhe apenas cinco minutos. ' +
        'O objetivo inicial é começar, não terminar tudo imediatamente.';
    } else if (asksBreak) {
      title = '🌿 Hora de avaliar seu ritmo';

      response = overload
        ? 'Uma pausa parece uma boa opção. Levante, beba água, ' +
          'alongue-se ou fique alguns minutos longe da tela. ' +
          'Depois, reavalie sua energia antes de retomar as tarefas.'
        : 'Se você está cansado ou perdeu a concentração, faça uma pausa curta. ' +
          'Se ainda estiver bem, conclua uma pequena etapa e depois descanse. ' +
          'Respeite seus limites.';
    } else if (asksXP) {
      title = '🏆 Sua evolução';

      response =
        `Você está no nível ${level}, com ${xp} XP e ${coins} moedas.\n\n` +
        `Faltam ${100 - (xp % 100)} XP para o próximo nível.\n\n` +
        'Consulte a página de Gamificação para acompanhar suas conquistas. ' +
        'O XP e as moedas dependem das regras configuradas no aplicativo.';
    } else if (asksPriority || q.includes('fazer')) {
      title = '🎯 Próximas ações recomendadas';

      if (priorities.length > 0) {
        const list = priorities
          .slice(0, 3)
          .map((task, index) => {
            const name = task.name || task.title || 'Tarefa sem título';
            const taskXP = task.xp != null ? ` — ${task.xp} XP` : '';

            return `${index + 1}. ${name}${taskXP}`;
          })
          .join('\n');

        response =
          (assistantAdvice ? `${assistantAdvice}\n\n` : '') +
          `${list}\n\n` +
          'Comece pela primeira tarefa e tente concluir uma etapa concreta ' +
          'antes de passar para a próxima.';
      } else if (tasks.length > 0) {
        response =
          `Você tem ${tasks.length} tarefas pendentes, mas nenhuma prioridade ` +
          'foi fornecida pelo sistema.\n\n' +
          'Escolha a tarefa mais importante ou com prazo mais próximo. ' +
          'Se estiver muito grande, transforme-a em uma ação pequena.';
      } else {
        response =
          'Você não tem tarefas pendentes registradas. ' +
          'Você pode revisar seus objetivos, planejar o dia seguinte ou descansar.';
      }
    } else {
      title = '💬 Vamos organizar isso';

      response =
        `Entendi sua pergunta: "${text}"\n\n` +
        'Posso ajudar com prioridades, foco, pausas, sobrecarga e progresso. ' +
        'Tente reformular sua pergunta usando um desses temas ou escolha ' +
        'uma sugestão rápida.';
    }

    respond(title, response);
    setQuestion('');
  }

  function analyze() {
    setQuestion('');
    setAnswerTitle('📊 Análise do seu estado geral');

    const plan = priorities.length
      ? priorities
          .slice(0, 3)
          .map(
            (task, index) =>
              `${index + 1}. ${task.name || task.title || 'Tarefa sem título'}`,
          )
          .join('\n')
      : '1. Escolha uma prioridade principal.\n' +
        '2. Divida-a em uma etapa pequena.\n' +
        '3. Faça uma pausa após a sessão de foco.';

    setAnswer(
      `RESUMO\n\n` +
        `• ${stats.total} tarefa(s) pendente(s)\n` +
        `• ${stats.highPriority} prioridade(s) alta(s)\n` +
        `• ${stats.overdue} prazo(s) vencido(s)\n` +
        `• ${completedToday} tarefa(s) concluída(s) hoje\n` +
        `• Nível ${level} · ${xp} XP\n` +
        `• ${coins} moeda(s) disponíveis\n\n` +
        `SITUAÇÃO\n\n` +
        (overload
          ? '⚠️ O aplicativo sinalizou possível sobrecarga. Reduza as prioridades e reavalie os prazos.'
          : '✅ Não há sinalização de sobrecarga nos dados recebidos. Continue monitorando sua energia.') +
        `\n\nPRÓXIMOS PASSOS\n\n${plan}`,
    );
  }

  return (
    <main className='assistant-page'>
      <style>{styles}</style>

      <header className='assistant-header'>
        <div className='assistant-title-group'>
          <div className='assistant-avatar'>🤖</div>

          <div>
            <span className='assistant-eyebrow'>SEU PARCEIRO DE ROTINA</span>

            <h1>Assistente pessoal</h1>

            <p>
              Organize prioridades, acompanhe seu progresso e descubra seu
              próximo passo.
            </p>
          </div>
        </div>

        <div className={`assistant-status ${overload ? 'warning' : 'ready'}`}>
          <span className='status-dot' />
          {overload ? 'Atenção à carga' : 'Pronto para ajudar'}
        </div>
      </header>

      <section className='assistant-overview'>
        <Metric icon='📌' value={stats.total} label='Pendentes' />
        <Metric icon='⚡' value={stats.totalXP} label='XP nas pendentes' />
        <Metric icon='🏆' value={level} label='Nível atual' />
        <Metric icon='🪙' value={coins} label='Moedas' />
      </section>

      <div className='assistant-layout'>
        <section className='assistant-panel'>
          <div className='panel-heading'>
            <span className='panel-icon'>💬</span>

            <div>
              <h2>Como posso ajudar?</h2>
              <p>Escolha um tema ou escreva sua pergunta.</p>
            </div>
          </div>

          <div className='quick-prompts'>
            {suggestions.map((item) => (
              <button
                type='button'
                key={item.label}
                className='quick-prompt'
                onClick={() => ask(item.question)}
              >
                <span>{item.icon}</span>
                {item.label}
                <span className='prompt-arrow'>↗</span>
              </button>
            ))}
          </div>

          <form
            className='assistant-input-row'
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder='Ex.: Como organizo meu dia?'
              aria-label='Digite sua pergunta'
            />

            <button className='assistant-send' type='submit'>
              Perguntar <span>➤</span>
            </button>
          </form>

          {answer && (
            <section className='assistant-answer' aria-live='polite'>
              <div className='answer-heading'>
                <strong>{answerTitle}</strong>

                <button
                  type='button'
                  onClick={() => setAnswer('')}
                  aria-label='Fechar resposta'
                >
                  ×
                </button>
              </div>

              <p>{answer}</p>
            </section>
          )}
        </section>

        <aside className='assistant-side'>
          <section className='assistant-panel'>
            <div className='panel-heading'>
              <span className='panel-icon'>🎯</span>

              <div>
                <h2>Prioridades sugeridas</h2>
                <p>Concentre-se em uma coisa de cada vez.</p>
              </div>
            </div>

            {priorities.length > 0 ? (
              <div className='priority-list'>
                {priorities.slice(0, 3).map((task, index) => (
                  <article
                    className='priority-item'
                    key={task.id ?? `${task.name}-${index}`}
                  >
                    <span className='priority-number'>{index + 1}</span>

                    <div>
                      <strong>
                        {task.name || task.title || 'Tarefa sem título'}
                      </strong>

                      <small>
                        {task.xp != null
                          ? `${task.xp} XP`
                          : 'Prioridade recomendada'}
                      </small>
                    </div>
                  </article>
                ))}

                {assistantAdvice && (
                  <p className='assistant-advice'>{assistantAdvice}</p>
                )}
              </div>
            ) : (
              <p className='assistant-empty'>
                Nenhuma prioridade foi sugerida. Revise suas tarefas ou
                aproveite para descansar.
              </p>
            )}
          </section>

          <section
            className={`assistant-panel workload-panel ${overload ? 'workload-warning' : 'workload-balanced'}`}
          >
            <span className='workload-icon'>{overload ? '⚠️' : '🌿'}</span>

            <div>
              <h2>{overload ? 'Possível sobrecarga' : 'Carga de trabalho'}</h2>

              <p>
                {overload
                  ? 'Considere reduzir o escopo do dia, reagendar tarefas não urgentes e fazer uma pausa.'
                  : 'Sua carga não está sinalizada como sobrecarga. Continue respeitando seus limites e intervalos.'}
              </p>
            </div>
          </section>

          <button
            type='button'
            className='assistant-analysis-button'
            onClick={analyze}
          >
            <span>🧠</span>

            <span>
              <strong>Analisar meu estado geral</strong>
              <small>Ver tarefas, progresso e próximos passos</small>
            </span>

            <span className='analysis-arrow'>→</span>
          </button>
        </aside>
      </div>

      <section className='assistant-integrated-summary'>
        <div>
          <span>💰</span>
          <strong>Finanças</strong>
          <small>{formatMoney(financialStats.balance)} de saldo no mês</small>
        </div>
        <div>
          <span>📈</span>
          <strong>Investimentos</strong>
          <small>{formatMoney(investmentStats.current)} em carteira</small>
        </div>
        <div>
          <span>🔥</span>
          <strong>Hoje</strong>
          <small>{completedToday} tarefa(s) concluída(s)</small>
        </div>
      </section>

      <p className='assistant-disclaimer'>
        As sugestões são calculadas a partir dos dados disponíveis no
        aplicativo. Ajuste prioridades e pausas conforme sua realidade.
      </p>
    </main>
  );
}

function Metric({ icon, value, label }) {
  return (
    <article className='assistant-metric'>
      <span>{icon}</span>

      <div>
        <strong>{Number(value).toLocaleString('pt-BR')}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}


function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getTodayKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const styles = `
.assistant-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text, #202436);
  font-family: inherit;
}

.assistant-page * {
  box-sizing: border-box;
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.assistant-title-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.assistant-avatar {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  background: linear-gradient(135deg, #eeeaff, #e1f8f1);
  border-radius: 20px;
  flex-shrink: 0;
}

.assistant-eyebrow {
  font-size: .7rem;
  letter-spacing: .13em;
  font-weight: 800;
  color: #7667e8;
}

.assistant-header h1 {
  font-size: clamp(1.7rem, 3vw, 2.25rem);
  margin: 5px 0;
}

.assistant-header p {
  margin: 0;
  color: var(--muted, #777d91);
  line-height: 1.5;
}

.assistant-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 13px;
  border-radius: 999px;
  font-size: .8rem;
  font-weight: 750;
  white-space: nowrap;
}

.assistant-status.ready {
  background: #eaf8f0;
  color: #24734f;
}

.assistant-status.warning {
  background: #fff1e7;
  color: #a94e1d;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: currentColor;
  border-radius: 50%;
}

.assistant-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 18px;
}

.assistant-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 17px;
  border: 1px solid var(--border, #e9eaf2);
  border-radius: 17px;
  background: var(--card, #fff);
  min-width: 0;
}

.assistant-metric > span {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #f1efff;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.assistant-metric strong {
  display: block;
  font-size: 1.4rem;
}

.assistant-metric small {
  display: block;
  color: var(--muted, #777d91);
  font-size: .77rem;
  margin-top: 3px;
}

.assistant-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, .85fr);
  gap: 18px;
  align-items: start;
}

.assistant-side {
  display: grid;
  gap: 15px;
}

.assistant-panel {
  padding: 21px;
  background: var(--card, #fff);
  border: 1px solid var(--border, #e9eaf2);
  border-radius: 20px;
  min-width: 0;
}

.panel-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 17px;
}

.panel-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #f1efff;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.panel-heading h2,
.workload-panel h2 {
  font-size: 1.02rem;
  margin: 0 0 4px;
}

.panel-heading p {
  font-size: .82rem;
  color: var(--muted, #777d91);
  margin: 0;
  line-height: 1.45;
}

.quick-prompts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 18px;
}

.quick-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  padding: 12px;
  border: 1px solid var(--border, #e9eaf2);
  background: var(--surface, #fafaff);
  color: inherit;
  border-radius: 12px;
  font: inherit;
  font-size: .82rem;
  cursor: pointer;
  transition: transform .15s, border-color .15s;
}

.quick-prompt:hover {
  border-color: #b9afff;
  transform: translateY(-1px);
}

.prompt-arrow {
  margin-left: auto;
  color: #8375e9;
}

.assistant-input-row {
  display: flex;
  gap: 9px;
}

.assistant-input-row input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--border, #dfe1eb);
  border-radius: 12px;
  padding: 13px 14px;
  background: var(--card, #fff);
  color: inherit;
  font: inherit;
}

.assistant-input-row input:focus {
  outline: 2px solid #8b7ff0;
  outline-offset: 1px;
}

.assistant-send {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 12px;
  padding: 0 16px;
  background: #7667e8;
  color: white;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}

.assistant-answer {
  margin-top: 17px;
  padding: 16px;
  border: 1px solid #e4dfff;
  border-radius: 15px;
  background: linear-gradient(135deg, #faf9ff, #f5fbf8);
}

.answer-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6658c8;
  font-weight: 800;
}

.answer-heading button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.35rem;
  cursor: pointer;
}

.assistant-answer p {
  white-space: pre-line;
  line-height: 1.65;
  font-size: .9rem;
  margin: 10px 0 0;
}

.priority-list {
  display: grid;
  gap: 11px;
}

.priority-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.priority-number {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #f0efff;
  color: #7667e8;
  font-weight: 850;
  flex-shrink: 0;
}

.priority-item > div {
  min-width: 0;
}

.priority-item strong {
  display: block;
  font-size: .87rem;
  overflow-wrap: anywhere;
}

.priority-item small {
  display: block;
  color: var(--muted, #777d91);
  font-size: .76rem;
  margin-top: 4px;
}

.assistant-advice,
.assistant-empty {
  font-size: .84rem;
  line-height: 1.55;
  padding: 11px;
  border-radius: 11px;
  background: var(--surface, #f8f8fc);
  color: var(--muted, #656b7e);
  white-space: pre-line;
}

.assistant-empty {
  margin: 0;
}

.workload-panel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.workload-icon {
  font-size: 1.5rem;
}

.workload-panel h2 {
  margin: 1px 0 6px;
}

.workload-panel p {
  font-size: .83rem;
  line-height: 1.55;
  margin: 0;
}

.workload-warning {
  background: #fff8f3;
  border-color: #f5ddce;
}

.workload-warning h2 {
  color: #a94e1d;
}

.workload-balanced {
  background: #f4fbf7;
  border-color: #dcefe4;
}

.workload-balanced h2 {
  color: #24734f;
}

.assistant-analysis-button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 16px;
  border: 1px solid #ded9ff;
  background: #f8f7ff;
  color: inherit;
  border-radius: 16px;
  cursor: pointer;
}

.assistant-analysis-button > span:first-child {
  font-size: 1.55rem;
}

.assistant-analysis-button > span:nth-child(2) {
  flex: 1;
}

.assistant-analysis-button strong,
.assistant-analysis-button small {
  display: block;
}

.assistant-analysis-button strong {
  font-size: .88rem;
}

.assistant-analysis-button small {
  font-size: .75rem;
  color: var(--muted, #777d91);
  margin-top: 4px;
}

.analysis-arrow {
  font-size: 1.3rem;
  color: #7667e8;
}

.assistant-disclaimer {
  font-size: .75rem;
  color: var(--muted, #85899a);
  line-height: 1.5;
  margin: 15px 2px 0;
}


.assistant-integrated-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
.assistant-integrated-summary>div{padding:14px;border:1px solid var(--site-border,#e4e5ee);border-radius:15px;background:var(--site-card-bg,#fff);display:grid;grid-template-columns:auto 1fr;column-gap:9px;align-items:center}
.assistant-integrated-summary span{grid-row:span 2;font-size:1.35rem}
.assistant-integrated-summary strong{font-size:.85rem}
.assistant-integrated-summary small{color:var(--site-text-muted,#777d91);font-size:.74rem;margin-top:2px}
body.dark .assistant-integrated-summary>div{background:var(--site-card-bg)}
@media(max-width:700px){.assistant-integrated-summary{grid-template-columns:1fr}}
@media (max-width: 900px) {
  .assistant-layout {
    grid-template-columns: 1fr;
  }

  .assistant-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .assistant-page {
    padding: 14px;
  }

  .assistant-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .assistant-title-group {
    align-items: flex-start;
  }

  .assistant-avatar {
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }

  .assistant-overview {
    gap: 9px;
  }

  .assistant-metric {
    padding: 13px;
    gap: 9px;
  }

  .assistant-metric > span {
    width: 36px;
    height: 36px;
  }

  .assistant-metric strong {
    font-size: 1.2rem;
  }

  .assistant-metric small {
    font-size: .7rem;
  }

  .assistant-panel {
    padding: 16px;
  }

  .quick-prompts {
    grid-template-columns: 1fr;
  }

  .assistant-input-row {
    flex-direction: column;
  }

  .assistant-send {
    justify-content: center;
    padding: 12px;
  }
}
`;
