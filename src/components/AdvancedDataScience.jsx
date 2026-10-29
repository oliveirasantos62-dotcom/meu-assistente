import React, { useMemo, useState } from 'react';

const MOOD_VALUES = {
  '😞': 1,
  '😕': 2,
  '😐': 3,
  '🙂': 4,
  '😄': 5,
  '😢': 1,
  '😡': 1,
  '😴': 2,
  '😊': 5,
};

const formatNumber = (value, decimals = 1) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const average = (values) => {
  const valid = values.map(Number).filter((value) => Number.isFinite(value));

  if (!valid.length) return 0;

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const standardDeviation = (values) => {
  if (!values.length) return 0;

  const avg = average(values);

  const variance =
    values.reduce((sum, value) => sum + Math.pow(Number(value) - avg, 2), 0) /
    values.length;

  return Math.sqrt(variance);
};

const correlation = (xValues, yValues) => {
  const pairs = [];

  for (let i = 0; i < Math.min(xValues.length, yValues.length); i += 1) {
    const x = Number(xValues[i]);
    const y = Number(yValues[i]);

    if (Number.isFinite(x) && Number.isFinite(y)) {
      pairs.push([x, y]);
    }
  }

  if (pairs.length < 3) {
    return null;
  }

  const x = pairs.map((pair) => pair[0]);
  const y = pairs.map((pair) => pair[1]);

  const xAvg = average(x);
  const yAvg = average(y);

  const numerator = pairs.reduce(
    (sum, [, value], index) => sum + (x[index] - xAvg) * (value - yAvg),
    0,
  );

  const denominatorX = Math.sqrt(
    x.reduce((sum, value) => sum + Math.pow(value - xAvg, 2), 0),
  );

  const denominatorY = Math.sqrt(
    y.reduce((sum, value) => sum + Math.pow(value - yAvg, 2), 0),
  );

  if (!denominatorX || !denominatorY) {
    return null;
  }

  return numerator / (denominatorX * denominatorY);
};

const getCorrelationLabel = (value) => {
  if (value === null) return 'Dados insuficientes';

  const absolute = Math.abs(value);

  if (absolute >= 0.7) {
    return value > 0
      ? 'Forte associação positiva'
      : 'Forte associação negativa';
  }

  if (absolute >= 0.4) {
    return value > 0
      ? 'Associação moderada positiva'
      : 'Associação moderada negativa';
  }

  if (absolute >= 0.2) {
    return value > 0
      ? 'Associação fraca positiva'
      : 'Associação fraca negativa';
  }

  return 'Associação muito fraca';
};

const getCorrelationColorClass = (value) => {
  if (value === null) return '';

  if (Math.abs(value) >= 0.4) {
    return value > 0 ? 'profit-positive' : 'profit-negative';
  }

  return '';
};

const formatDate = (date) => {
  if (!date) return '—';

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('pt-BR');
};

const getMoodValue = (mood) => {
  if (typeof mood === 'number') {
    return mood;
  }

  return MOOD_VALUES[mood] || 0;
};

const getDayName = (date) => {
  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });
};

export default function AdvancedDataScience({ data }) {
  const [period, setPeriod] = useState(30);

  const history = data?.history || {};

  /*
   * =========================================================
   * PREPARAÇÃO DOS DADOS
   * =========================================================
   */

  const allRecords = useMemo(() => {
    return Object.entries(history)
      .map(([date, record]) => ({
        date,
        ...record,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  const records = useMemo(() => {
    if (!allRecords.length) {
      return [];
    }

    return allRecords.slice(-period);
  }, [allRecords, period]);

  /*
   * =========================================================
   * QUALIDADE DOS DADOS
   * =========================================================
   */

  const dataQuality = useMemo(() => {
    if (!records.length) {
      return {
        score: 0,
        complete: 0,
        total: 0,
      };
    }

    let fieldsFilled = 0;
    let fieldsExpected = 0;

    records.forEach((record) => {
      const fields = [
        'sleep',
        'energy',
        'focus',
        'completed',
        'habits',
        'mood',
      ];

      fields.forEach((field) => {
        fieldsExpected += 1;

        if (
          record[field] !== undefined &&
          record[field] !== null &&
          record[field] !== ''
        ) {
          fieldsFilled += 1;
        }
      });
    });

    return {
      score: fieldsExpected > 0 ? (fieldsFilled / fieldsExpected) * 100 : 0,
      complete: fieldsFilled,
      total: fieldsExpected,
    };
  }, [records]);

  /*
   * =========================================================
   * MÉTRICAS PRINCIPAIS
   * =========================================================
   */

  const metrics = useMemo(() => {
    const sleep = records.map((record) => Number(record.sleep) || 0);

    const energy = records.map((record) => Number(record.energy) || 0);

    const focus = records.map((record) => Number(record.focus) || 0);

    const completed = records.map((record) => Number(record.completed) || 0);

    const habits = records.map((record) => Number(record.habits) || 0);

    const mood = records.map((record) => getMoodValue(record.mood));

    const xp = records.map((record) => Number(record.xp) || 0);

    return {
      avgSleep: average(sleep),
      avgEnergy: average(energy),
      avgFocus: average(focus),
      avgCompleted: average(completed),
      avgHabits: average(habits),
      avgMood: average(mood),
      totalCompleted: completed.reduce((sum, value) => sum + value, 0),
      totalXP: xp.reduce((sum, value) => sum + value, 0),
      sleepDeviation: standardDeviation(sleep),
      productivityDeviation: standardDeviation(completed),
    };
  }, [records]);

  /*
   * =========================================================
   * CORRELAÇÕES
   * =========================================================
   */

  const correlations = useMemo(() => {
    const sleep = records.map((record) => Number(record.sleep) || 0);

    const energy = records.map((record) => Number(record.energy) || 0);

    const focus = records.map((record) => Number(record.focus) || 0);

    const habits = records.map((record) => Number(record.habits) || 0);

    const mood = records.map((record) => getMoodValue(record.mood));

    const productivity = records.map((record) => Number(record.completed) || 0);

    return {
      sleep: correlation(sleep, productivity),
      energy: correlation(energy, productivity),
      focus: correlation(focus, productivity),
      habits: correlation(habits, productivity),
      mood: correlation(mood, productivity),
    };
  }, [records]);

  /*
   * =========================================================
   * COMPARAÇÃO: COM HÁBITOS × SEM HÁBITOS
   * =========================================================
   */

  const habitAnalysis = useMemo(() => {
    const withHabits = records.filter((record) => Number(record.habits) > 0);

    const withoutHabits = records.filter(
      (record) => Number(record.habits) === 0,
    );

    const withAverage = average(
      withHabits.map((record) => Number(record.completed) || 0),
    );

    const withoutAverage = average(
      withoutHabits.map((record) => Number(record.completed) || 0),
    );

    const difference = withAverage - withoutAverage;

    return {
      withHabits: withAverage,
      withoutHabits: withoutAverage,
      difference,
      daysWith: withHabits.length,
      daysWithout: withoutHabits.length,
    };
  }, [records]);

  /*
   * =========================================================
   * MELHOR DIA
   * =========================================================
   */

  const bestDay = useMemo(() => {
    if (!records.length) return null;

    return [...records].sort(
      (a, b) => (Number(b.completed) || 0) - (Number(a.completed) || 0),
    )[0];
  }, [records]);

  /*
   * =========================================================
   * PIOR DIA
   * =========================================================
   */

  const worstDay = useMemo(() => {
    if (!records.length) return null;

    return [...records].sort(
      (a, b) => (Number(a.completed) || 0) - (Number(b.completed) || 0),
    )[0];
  }, [records]);

  /*
   * =========================================================
   * MELHOR COMBINAÇÃO
   * =========================================================
   */

  const idealPattern = useMemo(() => {
    if (!records.length) {
      return null;
    }

    const candidates = records.filter((record) => Number(record.completed) > 0);

    if (!candidates.length) {
      return null;
    }

    return [...candidates].sort(
      (a, b) => (Number(b.completed) || 0) - (Number(a.completed) || 0),
    )[0];
  }, [records]);

  /*
   * =========================================================
   * FATORES DE DESEMPENHO
   * =========================================================
   */

  const factorRanking = useMemo(() => {
    const factors = [
      {
        name: 'Foco',
        icon: '🎯',
        value: correlations.focus,
      },
      {
        name: 'Energia',
        icon: '⚡',
        value: correlations.energy,
      },
      {
        name: 'Sono',
        icon: '😴',
        value: correlations.sleep,
      },
      {
        name: 'Hábitos',
        icon: '🔥',
        value: correlations.habits,
      },
      {
        name: 'Humor',
        icon: '😊',
        value: correlations.mood,
      },
    ];

    return factors
      .filter((factor) => factor.value !== null)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [correlations]);

  /*
   * =========================================================
   * TENDÊNCIA
   * =========================================================
   */

  const trend = useMemo(() => {
    if (records.length < 6) {
      return {
        type: 'insufficient',
        difference: 0,
      };
    }

    const middle = Math.floor(records.length / 2);

    const firstHalf = records.slice(0, middle);
    const secondHalf = records.slice(middle);

    const firstAverage = average(
      firstHalf.map((record) => Number(record.completed) || 0),
    );

    const secondAverage = average(
      secondHalf.map((record) => Number(record.completed) || 0),
    );

    const difference = secondAverage - firstAverage;

    if (difference > 0.3) {
      return {
        type: 'up',
        difference,
      };
    }

    if (difference < -0.3) {
      return {
        type: 'down',
        difference,
      };
    }

    return {
      type: 'stable',
      difference,
    };
  }, [records]);

  /*
   * =========================================================
   * INSIGHTS AUTOMÁTICOS
   * =========================================================
   */

  const insights = useMemo(() => {
    const result = [];

    if (!records.length) {
      return [
        {
          icon: '📊',
          title: 'Comece a registrar dados',
          text: 'Registre sono, energia, foco, humor, hábitos e tarefas concluídas para que o sistema possa encontrar padrões.',
          type: 'neutral',
        },
      ];
    }

    if (correlations.focus !== null && correlations.focus >= 0.4) {
      result.push({
        icon: '🎯',
        title: 'Foco é um fator importante',
        text: `Nos seus registros, foco apresenta uma associação positiva de ${correlations.focus.toFixed(2)} com tarefas concluídas.`,
        type: 'positive',
      });
    }

    if (correlations.sleep !== null && correlations.sleep >= 0.4) {
      result.push({
        icon: '😴',
        title: 'Sono aparece associado ao desempenho',
        text: `Existe uma associação positiva de ${correlations.sleep.toFixed(2)} entre sono e produtividade.`,
        type: 'positive',
      });
    }

    if (correlations.energy !== null && correlations.energy >= 0.4) {
      result.push({
        icon: '⚡',
        title: 'Energia acompanha sua produtividade',
        text: `Energia apresenta associação de ${correlations.energy.toFixed(2)} com tarefas concluídas.`,
        type: 'positive',
      });
    }

    if (
      habitAnalysis.difference > 0.5 &&
      habitAnalysis.daysWith >= 2 &&
      habitAnalysis.daysWithout >= 2
    ) {
      result.push({
        icon: '🔥',
        title: 'Hábitos parecem ajudar',
        text: `Nos dias com hábitos registrados, você concluiu em média ${formatNumber(
          habitAnalysis.withHabits,
        )} tarefas contra ${formatNumber(
          habitAnalysis.withoutHabits,
        )} nos dias sem hábitos.`,
        type: 'positive',
      });
    }

    if (correlations.focus !== null && correlations.focus < -0.3) {
      result.push({
        icon: '⚠️',
        title: 'Foco merece investigação',
        text: 'Seu foco apresentou associação negativa com tarefas concluídas. Isso não significa causalidade; pode indicar que outros fatores estão interferindo.',
        type: 'warning',
      });
    }

    if (metrics.avgSleep > 0 && metrics.avgSleep < 6) {
      result.push({
        icon: '🛌',
        title: 'Sono abaixo do ideal',
        text: `Sua média registrada foi de ${formatNumber(metrics.avgSleep)}h.`,
        type: 'warning',
      });
    }

    if (trend.type === 'up') {
      result.push({
        icon: '📈',
        title: 'Produtividade em alta',
        text: `A segunda metade do período apresenta média aproximadamente ${formatNumber(
          Math.abs(trend.difference),
        )} tarefa(s) maior por dia.`,
        type: 'positive',
      });
    }

    if (trend.type === 'down') {
      result.push({
        icon: '📉',
        title: 'Produtividade em queda',
        text: `A segunda metade do período apresenta redução média de ${formatNumber(
          Math.abs(trend.difference),
        )} tarefa(s) por dia.`,
        type: 'warning',
      });
    }

    if (!result.length) {
      result.push({
        icon: '🔎',
        title: 'Ainda procurando padrões',
        text: 'Seus dados ainda não mostram associações suficientemente fortes. Continue registrando diariamente.',
        type: 'neutral',
      });
    }

    return result.slice(0, 6);
  }, [records, correlations, habitAnalysis, metrics, trend]);

  /*
   * =========================================================
   * ESTADO VAZIO
   * =========================================================
   */

  if (!records.length) {
    return (
      <div className='card'>
        <div className='section-label'>CIÊNCIA DE DADOS</div>

        <h2>📊 Laboratório Pessoal</h2>

        <p className='subtitle'>
          Transforme seus registros diários em informações úteis para entender
          seu comportamento e produtividade.
        </p>

        <div className='investment-empty investment-empty-large'>
          <span>📊</span>

          <strong>Ainda não existem dados suficientes.</strong>

          <small>
            Comece registrando sono, energia, foco, humor, hábitos e tarefas
            concluídas.
          </small>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className='card'>
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className='investment-header'>
        <div>
          <div className='section-label'>
            CIÊNCIA DE DADOS · ANÁLISE PESSOAL
          </div>

          <h2>📊 Laboratório Pessoal</h2>

          <p className='subtitle'>
            Descubra padrões entre seus hábitos, estado pessoal e produtividade.
          </p>
        </div>

        <div className='investment-header-actions'>
          <select
            className='investment-small-select'
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={14}>Últimos 14 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={60}>Últimos 60 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={365}>Último ano</option>
          </select>
        </div>
      </div>

      {/* =====================================================
          KPIs
      ====================================================== */}

      <div className='investment-kpis'>
        <div className='investment-kpi'>
          <small>Sono médio</small>

          <strong>{formatNumber(metrics.avgSleep)}h</strong>

          <span>± {formatNumber(metrics.sleepDeviation)}h</span>
        </div>

        <div className='investment-kpi'>
          <small>Energia média</small>

          <strong>{formatNumber(metrics.avgEnergy)}/5</strong>

          <span>período analisado</span>
        </div>

        <div className='investment-kpi'>
          <small>Foco médio</small>

          <strong>{formatNumber(metrics.avgFocus)}/5</strong>

          <span>período analisado</span>
        </div>

        <div className='investment-kpi'>
          <small>Produtividade</small>

          <strong>{formatNumber(metrics.avgCompleted)}</strong>

          <span>tarefas/dia</span>
        </div>
      </div>

      {/* =====================================================
          RESUMO
      ====================================================== */}

      <div className='investment-mini-stats'>
        <div>
          <span>😊 Humor médio</span>

          <strong>{formatNumber(metrics.avgMood)}/5</strong>
        </div>

        <div>
          <span>🔥 Hábitos/dia</span>

          <strong>{formatNumber(metrics.avgHabits)}</strong>
        </div>

        <div>
          <span>✅ Tarefas concluídas</span>

          <strong>{metrics.totalCompleted}</strong>
        </div>

        <div>
          <span>⭐ XP registrado</span>

          <strong>{metrics.totalXP}</strong>
        </div>
      </div>

      {/* =====================================================
          QUALIDADE DOS DADOS
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🧪 Qualidade dos dados</strong>

            <small>
              Quanto dos registros possui informações suficientes para análise.
            </small>
          </div>

          <strong>{formatNumber(dataQuality.score, 0)}%</strong>
        </div>

        <div className='progress' style={{ height: 10 }}>
          <span
            style={{
              width: `${dataQuality.score}%`,
            }}
          />
        </div>

        <small className='subtitle'>
          {dataQuality.complete} de {dataQuality.total} campos preenchidos.
        </small>
      </div>

      {/* =====================================================
          TENDÊNCIA
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>📈 Tendência de produtividade</strong>

            <small>
              Comparação entre a primeira e a segunda metade do período.
            </small>
          </div>
        </div>

        {trend.type === 'up' && (
          <div className='investment-alert investment-alert-success'>
            📈 Sua produtividade está apresentando tendência de alta.
          </div>
        )}

        {trend.type === 'down' && (
          <div className='investment-alert investment-alert-error'>
            📉 Sua produtividade está apresentando tendência de queda.
          </div>
        )}

        {trend.type === 'stable' && (
          <div className='investment-alert'>
            ➡️ Sua produtividade está relativamente estável neste período.
          </div>
        )}

        {trend.type === 'insufficient' && (
          <div className='investment-alert'>
            📊 Registre mais dias para calcular uma tendência confiável.
          </div>
        )}
      </div>

      {/* =====================================================
          CORRELAÇÕES
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🔗 Fatores associados à produtividade</strong>

            <small>Correlação entre cada variável e tarefas concluídas.</small>
          </div>
        </div>

        <div className='allocation-list'>
          {[
            {
              name: 'Foco',
              icon: '🎯',
              value: correlations.focus,
            },
            {
              name: 'Energia',
              icon: '⚡',
              value: correlations.energy,
            },
            {
              name: 'Sono',
              icon: '😴',
              value: correlations.sleep,
            },
            {
              name: 'Hábitos',
              icon: '🔥',
              value: correlations.habits,
            },
            {
              name: 'Humor',
              icon: '😊',
              value: correlations.mood,
            },
          ].map((item) => {
            const normalized =
              item.value === null
                ? 0
                : Math.min(100, Math.abs(item.value) * 100);

            return (
              <div className='allocation-row' key={item.name}>
                <strong>
                  {item.icon} {item.name}
                </strong>

                <div className='allocation-track'>
                  <span
                    style={{
                      width: `${normalized}%`,
                    }}
                  />
                </div>

                <strong className={getCorrelationColorClass(item.value)}>
                  {item.value === null ? '—' : item.value.toFixed(2)}
                </strong>

                <small>{getCorrelationLabel(item.value)}</small>
              </div>
            );
          })}
        </div>

        <small className='subtitle'>
          ⚠️ Correlação não significa causalidade. O sistema identifica
          associações nos seus registros, não prova que um fator causou outro.
        </small>
      </div>

      {/* =====================================================
          RANKING DE FATORES
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🏆 Ranking de fatores</strong>

            <small>
              Variáveis com maior associação absoluta com sua produtividade.
            </small>
          </div>
        </div>

        {factorRanking.length ? (
          <div className='portfolio-history-table'>
            {factorRanking.map((factor, index) => (
              <div className='history-row' key={factor.name}>
                <span>
                  <strong>
                    #{index + 1} {factor.icon} {factor.name}
                  </strong>
                </span>

                <span>{getCorrelationLabel(factor.value)}</span>

                <strong className={getCorrelationColorClass(factor.value)}>
                  {factor.value >= 0 ? '+' : ''}
                  {factor.value.toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p className='subtitle'>Dados insuficientes para montar o ranking.</p>
        )}
      </div>

      {/* =====================================================
          HÁBITOS
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🔥 Hábitos × Produtividade</strong>

            <small>Comparação entre dias com e sem hábitos registrados.</small>
          </div>
        </div>

        <div className='investment-mini-stats'>
          <div>
            <span>🔥 Com hábitos</span>

            <strong>{formatNumber(habitAnalysis.withHabits)}</strong>

            <small>tarefas/dia</small>
          </div>

          <div>
            <span>⭕ Sem hábitos</span>

            <strong>{formatNumber(habitAnalysis.withoutHabits)}</strong>

            <small>tarefas/dia</small>
          </div>

          <div>
            <span>📊 Diferença</span>

            <strong
              className={
                habitAnalysis.difference >= 0
                  ? 'profit-positive'
                  : 'profit-negative'
              }
            >
              {habitAnalysis.difference >= 0 ? '+' : ''}
              {formatNumber(habitAnalysis.difference)}
            </strong>
          </div>

          <div>
            <span>📅 Amostra</span>

            <strong>
              {habitAnalysis.daysWith + habitAnalysis.daysWithout}
            </strong>

            <small>dias</small>
          </div>
        </div>
      </div>

      {/* =====================================================
          MELHOR / PIOR DIA
      ====================================================== */}

      <div className='portfolio-chart-grid'>
        <div className='portfolio-chart'>
          <div className='investment-section-title'>
            <div>
              <strong>🏆 Melhor dia</strong>

              <small>Maior número de tarefas concluídas.</small>
            </div>
          </div>

          {bestDay ? (
            <div className='investment-empty'>
              <span>🏆</span>

              <strong>{formatDate(bestDay.date)}</strong>

              <small>{getDayName(bestDay.date)}</small>

              <strong>
                {Number(bestDay.completed) || 0} tarefas concluídas
              </strong>
            </div>
          ) : (
            <p className='subtitle'>Sem dados.</p>
          )}
        </div>

        <div className='portfolio-chart'>
          <div className='investment-section-title'>
            <div>
              <strong>⚠️ Dia de menor produtividade</strong>

              <small>Menor número de tarefas concluídas.</small>
            </div>
          </div>

          {worstDay ? (
            <div className='investment-empty'>
              <span>📉</span>

              <strong>{formatDate(worstDay.date)}</strong>

              <small>{getDayName(worstDay.date)}</small>

              <strong>
                {Number(worstDay.completed) || 0} tarefas concluídas
              </strong>
            </div>
          ) : (
            <p className='subtitle'>Sem dados.</p>
          )}
        </div>
      </div>

      {/* =====================================================
          PADRÃO IDEAL
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🧠 Padrão de maior produtividade</strong>

            <small>Exemplo do seu melhor registro no período.</small>
          </div>
        </div>

        {idealPattern ? (
          <div className='investment-mini-stats'>
            <div>
              <span>📅 Data</span>

              <strong>{formatDate(idealPattern.date)}</strong>
            </div>

            <div>
              <span>😴 Sono</span>

              <strong>{Number(idealPattern.sleep) || 0}h</strong>
            </div>

            <div>
              <span>⚡ Energia</span>

              <strong>
                {Number(idealPattern.energy) || 0}
                /5
              </strong>
            </div>

            <div>
              <span>🎯 Foco</span>

              <strong>
                {Number(idealPattern.focus) || 0}
                /5
              </strong>
            </div>

            <div>
              <span>🔥 Hábitos</span>

              <strong>{Number(idealPattern.habits) || 0}</strong>
            </div>

            <div>
              <span>✅ Tarefas</span>

              <strong>{Number(idealPattern.completed) || 0}</strong>
            </div>
          </div>
        ) : (
          <p className='subtitle'>Ainda não há dados suficientes.</p>
        )}
      </div>

      {/* =====================================================
          INSIGHTS
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🤖 Insights automáticos</strong>

            <small>Observações geradas a partir dos seus dados.</small>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
          {insights.map((insight, index) => (
            <div
              key={`${insight.title}-${index}`}
              style={{
                padding: 14,
                border: '1px solid var(--site-border)',
                borderRadius: 12,
                background: 'var(--site-surface)',
              }}
            >
              <strong>
                {insight.icon} {insight.title}
              </strong>

              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 14,
                }}
              >
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          HISTÓRICO
      ====================================================== */}

      <div className='focus investment-history-list'>
        <div className='investment-section-title'>
          <div>
            <strong>📅 Dados analisados</strong>

            <small>Registros utilizados nesta análise.</small>
          </div>

          <strong>{records.length} dias</strong>
        </div>

        <div className='portfolio-history-table'>
          {[...records]
            .reverse()
            .slice(0, 10)
            .map((record) => (
              <div className='history-row' key={record.date}>
                <span>📅 {formatDate(record.date)}</span>

                <span>😴 {Number(record.sleep) || 0}h</span>

                <span>⚡ {Number(record.energy) || 0}/5</span>

                <span>🎯 {Number(record.focus) || 0}/5</span>

                <strong>✅ {Number(record.completed) || 0}</strong>
              </div>
            ))}
        </div>
      </div>

      {/* =====================================================
          METODOLOGIA
      ====================================================== */}

      <div className='focus' style={{ fontSize: 12 }}>
        <strong>🧪 Como esta análise funciona</strong>

        <p>
          O sistema compara seus registros históricos utilizando médias, desvio
          padrão, tendências e correlação de Pearson. Os resultados representam
          associações encontradas nos dados registrados e não devem ser
          interpretados como prova de causalidade.
        </p>

        <p>
          Quanto mais consistentes e completos forem seus registros, maior será
          a utilidade das análises.
        </p>
      </div>
    </div>
  );
}
