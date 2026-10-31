import React, { useMemo, useState } from 'react';

const uid = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const today = () => new Date().toISOString().slice(0, 10);

function formatValue(value, unit) {
  const number = Number(value);

  if (!Number.isFinite(number)) return '-';

  const text = Number.isInteger(number) ? String(number) : number.toFixed(2);

  return unit ? `${text} ${unit}` : text;
}

function formatDate(date) {
  if (!date) return '-';

  const parsed = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('pt-BR');
}

function normalizeEvolution(item) {
  return {
    id: item.id || uid('evo'),

    name: item.name || 'Nova evolução',

    icon: item.icon || '📈',

    color: item.color || '#6366f1',

    description: item.description || '',

    metrics: Array.isArray(item.metrics)
      ? item.metrics.map((metric) => ({
          id: metric.id || uid('metric'),

          name: metric.name || 'Métrica',

          unit: metric.unit || '',

          type: metric.type || 'number',

          goal:
            metric.goal === '' || metric.goal == null
              ? ''
              : Number(metric.goal),

          better: metric.better === 'lower' ? 'lower' : 'higher',
        }))
      : [],

    records: Array.isArray(item.records)
      ? item.records.map((record) => ({
          id: record.id || uid('record'),

          date: record.date || today(),

          values:
            record.values && typeof record.values === 'object'
              ? record.values
              : {},

          note: record.note || '',
        }))
      : [],
  };
}

function LineChart({ points, color, better = 'higher', unit = '' }) {
  if (!points.length) {
    return (
      <div className='evolution-empty-chart'>
        Registre pelo menos dois valores para visualizar a evolução.
      </div>
    );
  }

  const width = 700;
  const height = 250;
  const padX = 42;
  const padY = 28;

  const values = points.map((point) => Number(point.value));

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((point, index) => ({
    ...point,

    x:
      points.length === 1
        ? width / 2
        : padX + (index / (points.length - 1)) * (width - padX * 2),

    y:
      height -
      padY -
      ((Number(point.value) - min) / range) * (height - padY * 2),
  }));

  const path = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const best = better === 'lower' ? Math.min(...values) : Math.max(...values);

  return (
    <div className='evolution-chart-wrap'>
      <svg
        className='evolution-chart'
        viewBox={`0 0 ${width} ${height}`}
        role='img'
        aria-label='Gráfico de evolução'
      >
        <line
          x1={padX}
          x2={padX}
          y1={padY}
          y2={height - padY}
          className='chart-axis'
        />

        <line
          x1={padX}
          x2={width - padX}
          y1={height - padY}
          y2={height - padY}
          className='chart-axis'
        />

        <path
          d={path}
          fill='none'
          stroke={color}
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />

        {coords.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r='6' fill={color} />

            <text
              x={point.x}
              y={point.y - 12}
              textAnchor='middle'
              className='chart-value'
            >
              {formatValue(point.value, unit)}
            </text>

            <text
              x={point.x}
              y={height - 8}
              textAnchor='middle'
              className='chart-label'
            >
              {formatDate(point.date).slice(0, 5)}
            </text>
          </g>
        ))}
      </svg>

      <div className='evolution-chart-summary'>
        <span>Menor: {formatValue(min, unit)}</span>

        <strong>Melhor: {formatValue(best, unit)}</strong>

        <span>Maior: {formatValue(max, unit)}</span>
      </div>
    </div>
  );
}

export default function Evolucao({ data, save }) {
  const saved = Array.isArray(data?.evolutions) ? data.evolutions : [];

  const evolutions = useMemo(() => saved.map(normalizeEvolution), [saved]);

  const [selectedId, setSelectedId] = useState(evolutions[0]?.id || '');

  const [showEvolutionForm, setShowEvolutionForm] = useState(false);

  const [showMetricForm, setShowMetricForm] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState(false);

  const [editingEvolution, setEditingEvolution] = useState(null);

  const [editingMetric, setEditingMetric] = useState(null);

  const [evolutionForm, setEvolutionForm] = useState({
    name: '',
    icon: '📈',
    color: '#6366f1',
    description: '',
  });

  const [metricForm, setMetricForm] = useState({
    name: '',
    unit: '',
    goal: '',
    better: 'higher',
  });

  const [recordForm, setRecordForm] = useState({
    date: today(),
    values: {},
    note: '',
  });

  const [activeMetricId, setActiveMetricId] = useState('');

  const selected =
    evolutions.find((item) => item.id === selectedId) || evolutions[0] || null;

  const persist = (next) => {
    save({
      ...data,
      evolutions: next,
    });
  };

  const selectEvolution = (id) => {
    setSelectedId(id);
    setShowRecordForm(false);
    setShowMetricForm(false);
  };

  // =========================================
  // NOVA EVOLUÇÃO
  // =========================================
  const openNewEvolution = () => {
    setEditingEvolution(null);

    setEvolutionForm({
      name: '',
      icon: '📈',
      color: '#6366f1',
      description: '',
    });

    setShowEvolutionForm(true);
  };

  // =========================================
  // EDITAR EVOLUÇÃO
  // =========================================
  const openEditEvolution = () => {
    if (!selected) return;

    setEditingEvolution(selected);

    setEvolutionForm({
      name: selected.name,
      icon: selected.icon,
      color: selected.color,
      description: selected.description,
    });

    setShowEvolutionForm(true);
  };

  // =========================================
  // SALVAR EVOLUÇÃO
  // =========================================
  const saveEvolution = (event) => {
    event.preventDefault();

    if (!evolutionForm.name.trim()) return;

    let next;

    if (editingEvolution) {
      next = evolutions.map((item) =>
        item.id === editingEvolution.id
          ? {
              ...item,
              ...evolutionForm,
              name: evolutionForm.name.trim(),
            }
          : item,
      );

      setSelectedId(editingEvolution.id);
    } else {
      const item = normalizeEvolution({
        ...evolutionForm,

        name: evolutionForm.name.trim(),

        metrics: [],

        records: [],
      });

      next = [...evolutions, item];

      setSelectedId(item.id);
    }

    persist(next);

    setShowEvolutionForm(false);
  };

  // =========================================
  // EXCLUIR EVOLUÇÃO
  // =========================================
  const deleteEvolution = () => {
    if (!selected) return;

    if (
      !window.confirm(
        `Excluir a evolução "${selected.name}" e todos os seus registros?`,
      )
    ) {
      return;
    }

    const next = evolutions.filter((item) => item.id !== selected.id);

    persist(next);

    setSelectedId(next[0]?.id || '');
  };

  // =========================================
  // FORMULÁRIO DE MÉTRICA
  // =========================================
  const openMetricForm = (metric = null) => {
    setEditingMetric(metric);

    setMetricForm({
      name: metric?.name || '',
      unit: metric?.unit || '',
      goal: metric?.goal ?? '',
      better: metric?.better || 'higher',
    });

    setShowMetricForm(true);
  };

  // =========================================
  // SALVAR MÉTRICA
  // =========================================
  const saveMetric = (event) => {
    event.preventDefault();

    if (!selected || !metricForm.name.trim()) {
      return;
    }

    const metric = {
      id: editingMetric?.id || uid('metric'),

      name: metricForm.name.trim(),

      unit: metricForm.unit.trim(),

      type: 'number',

      goal: metricForm.goal === '' ? '' : Number(metricForm.goal),

      better: metricForm.better,
    };

    const next = evolutions.map((item) => {
      if (item.id !== selected.id) {
        return item;
      }

      const metrics = editingMetric
        ? item.metrics.map((current) =>
            current.id === editingMetric.id ? metric : current,
          )
        : [...item.metrics, metric];

      return {
        ...item,
        metrics,
      };
    });

    persist(next);

    setActiveMetricId(metric.id);

    setShowMetricForm(false);
  };

  // =========================================
  // EXCLUIR MÉTRICA
  // =========================================
  const deleteMetric = (metricId) => {
    if (!selected) return;

    const metric = selected.metrics.find((item) => item.id === metricId);

    if (
      !metric ||
      !window.confirm(
        `Excluir a métrica "${metric.name}"? Os valores registrados nela também serão removidos.`,
      )
    ) {
      return;
    }

    const next = evolutions.map((item) =>
      item.id !== selected.id
        ? item
        : {
            ...item,

            metrics: item.metrics.filter(
              (itemMetric) => itemMetric.id !== metricId,
            ),

            records: item.records.map((record) => {
              const values = {
                ...record.values,
              };

              delete values[metricId];

              return {
                ...record,
                values,
              };
            }),
          },
    );

    persist(next);

    if (activeMetricId === metricId) {
      setActiveMetricId('');
    }
  };

  // =========================================
  // NOVO REGISTRO
  // =========================================
  const openRecordForm = () => {
    if (!selected?.metrics.length) {
      setShowMetricForm(true);
      return;
    }

    setRecordForm({
      date: today(),
      values: {},
      note: '',
    });

    setShowRecordForm(true);
  };

  // =========================================
  // SALVAR REGISTRO
  // =========================================
  const saveRecord = (event) => {
    event.preventDefault();

    if (!selected) return;

    const values = {};

    selected.metrics.forEach((metric) => {
      const value = recordForm.values[metric.id];

      if (value !== '' && value != null && Number.isFinite(Number(value))) {
        values[metric.id] = Number(value);
      }
    });

    if (!Object.keys(values).length) {
      return;
    }

    const record = {
      id: uid('record'),

      date: recordForm.date || today(),

      values,

      note: recordForm.note.trim(),
    };

    const next = evolutions.map((item) =>
      item.id === selected.id
        ? {
            ...item,

            records: [...item.records, record].sort((a, b) =>
              a.date.localeCompare(b.date),
            ),
          }
        : item,
    );

    persist(next);

    setShowRecordForm(false);
  };

  // =========================================
  // EXCLUIR REGISTRO
  // =========================================
  const deleteRecord = (recordId) => {
    if (!selected) return;

    const next = evolutions.map((item) =>
      item.id === selected.id
        ? {
            ...item,

            records: item.records.filter((record) => record.id !== recordId),
          }
        : item,
    );

    persist(next);
  };

  // =========================================
  // ÚLTIMO VALOR DE CADA MÉTRICA
  // =========================================
  const latestByMetric = useMemo(() => {
    const result = {};

    if (!selected) return result;

    selected.metrics.forEach((metric) => {
      const records = selected.records
        .filter((record) => record.values[metric.id] != null)
        .sort((a, b) => b.date.localeCompare(a.date));

      result[metric.id] = records[0]?.values?.[metric.id] ?? null;
    });

    return result;
  }, [selected]);

  // =========================================
  // PONTOS DO GRÁFICO
  // =========================================
  const metricPoints = (metric) =>
    selected?.records
      .filter((record) => record.values[metric.id] != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((record) => ({
        id: record.id,
        date: record.date,
        value: record.values[metric.id],
      })) || [];

  // =========================================
  // PROGRESSO DA META
  // =========================================
  const progress = (metric) => {
    const current = Number(latestByMetric[metric.id]);

    const goal = Number(metric.goal);

    if (!Number.isFinite(current) || !Number.isFinite(goal) || goal <= 0) {
      return null;
    }

    const percent =
      metric.better === 'lower'
        ? (goal / Math.max(current, 0.0001)) * 100
        : (current / goal) * 100;

    return Math.max(0, Math.min(100, percent));
  };

  return (
    <section className='page evolution-page'>
      {/* =========================================
          CABEÇALHO
      ========================================= */}
      <div className='evolution-header'>
        <div>
          <span className='section-kicker'>PROGRESSO PESSOAL</span>

          <h2>📈 Evolução & Progresso</h2>

          <p>
            Registre seu progresso em treinos, habilidades, esportes ou qualquer
            objetivo mensurável.
          </p>
        </div>

        <button type='button' className='primary' onClick={openNewEvolution}>
          ＋ Nova evolução
        </button>
      </div>

      {/* =========================================
          ESTADO VAZIO
      ========================================= */}
      {evolutions.length === 0 ? (
        <div className='evolution-empty-state'>
          <div className='evolution-empty-icon'>📈</div>

          <h3>Comece a acompanhar sua evolução</h3>

          <p>
            Crie uma evolução para acompanhar qualquer coisa que seja importante
            para você.
          </p>

          <button type='button' className='primary' onClick={openNewEvolution}>
            ＋ Criar minha primeira evolução
          </button>
        </div>
      ) : (
        <>
          {/* =========================================
              LAYOUT PRINCIPAL
          ========================================= */}
          <div className='evolution-layout'>
            {/* =========================================
                LISTA DE EVOLUÇÕES
            ========================================= */}
            <aside className='evolution-list'>
              <div className='evolution-list-title'>Minhas evoluções</div>

              {evolutions.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  className={`evolution-list-item ${
                    selected?.id === item.id ? 'active' : ''
                  }`}
                  onClick={() => selectEvolution(item.id)}
                >
                  <span
                    className='evolution-list-icon'
                    style={{
                      background: `${item.color}22`,
                      borderColor: `${item.color}55`,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span>
                    <strong>{item.name}</strong>

                    <small>
                      {item.metrics.length} métricas · {item.records.length}{' '}
                      registros
                    </small>
                  </span>
                </button>
              ))}
            </aside>

            {/* =========================================
                EVOLUÇÃO SELECIONADA
            ========================================= */}
            {selected && (
              <div className='evolution-main'>
                {/* =========================================
                    VISÃO GERAL
                ========================================= */}
                <div
                  className='evolution-overview-card'
                  style={{
                    '--evolution-color': selected.color,
                  }}
                >
                  <div className='evolution-overview-icon'>{selected.icon}</div>

                  <div className='evolution-overview-content'>
                    <div className='evolution-title-row'>
                      <div>
                        <h3>{selected.name}</h3>

                        <p>
                          {selected.description ||
                            'Acompanhe seus números e veja sua evolução ao longo do tempo.'}
                        </p>
                      </div>

                      <div className='evolution-actions'>
                        <button
                          type='button'
                          className='ghost'
                          onClick={openEditEvolution}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type='button'
                          className='ghost danger'
                          onClick={deleteEvolution}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className='evolution-stats'>
                      <div>
                        <span>Registros</span>

                        <strong>{selected.records.length}</strong>
                      </div>

                      <div>
                        <span>Métricas</span>

                        <strong>{selected.metrics.length}</strong>
                      </div>

                      <div>
                        <span>Último registro</span>

                        <strong>
                          {selected.records.length
                            ? formatDate(
                                [...selected.records].sort((a, b) =>
                                  b.date.localeCompare(a.date),
                                )[0].date,
                              )
                            : '-'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================
                    BARRA DE MÉTRICAS
                ========================================= */}
                <div className='evolution-toolbar'>
                  <div>
                    <h3>📊 Métricas</h3>

                    <span>Escolha o que você quer medir.</span>
                  </div>

                  <div className='evolution-actions'>
                    <button
                      type='button'
                      className='ghost'
                      onClick={() => openMetricForm()}
                    >
                      ＋ Métrica
                    </button>

                    <button
                      type='button'
                      className='primary'
                      onClick={openRecordForm}
                    >
                      ＋ Registrar progresso
                    </button>
                  </div>
                </div>

                {/* =========================================
                    SEM MÉTRICAS
                ========================================= */}
                {!selected.metrics.length ? (
                  <div className='evolution-empty-inline'>
                    <strong>Você ainda não criou nenhuma métrica.</strong>

                    <span>
                      Adicione peso, repetições, tempo, distância, rating ou
                      qualquer valor numérico.
                    </span>

                    <button
                      type='button'
                      className='primary'
                      onClick={() => openMetricForm()}
                    >
                      Criar primeira métrica
                    </button>
                  </div>
                ) : (
                  <div className='evolution-metric-grid'>
                    {selected.metrics.map((metric) => {
                      const points = metricPoints(metric);

                      const current = latestByMetric[metric.id];

                      const percent = progress(metric);

                      return (
                        <article
                          className={`evolution-metric-card ${
                            activeMetricId === metric.id ? 'selected' : ''
                          }`}
                          key={metric.id}
                          onClick={() => setActiveMetricId(metric.id)}
                        >
                          <div className='evolution-metric-head'>
                            <div>
                              <span>{metric.name}</span>

                              <strong>
                                {current == null
                                  ? '-'
                                  : formatValue(current, metric.unit)}
                              </strong>
                            </div>

                            <div className='evolution-card-actions'>
                              <button
                                type='button'
                                onClick={(event) => {
                                  event.stopPropagation();

                                  openMetricForm(metric);
                                }}
                              >
                                ✏️
                              </button>

                              <button
                                type='button'
                                onClick={(event) => {
                                  event.stopPropagation();

                                  deleteMetric(metric.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          {percent != null && (
                            <div className='evolution-progress'>
                              <div>
                                <span>
                                  Meta: {formatValue(metric.goal, metric.unit)}
                                </span>

                                <strong>{Math.round(percent)}%</strong>
                              </div>

                              <div className='evolution-progress-track'>
                                <span
                                  style={{
                                    width: `${percent}%`,
                                    background: selected.color,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <LineChart
                            points={points}
                            color={selected.color}
                            better={metric.better}
                            unit={metric.unit}
                          />
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* =========================================
                    HISTÓRICO
                ========================================= */}
                <div className='evolution-records-section'>
                  <div className='evolution-toolbar'>
                    <div>
                      <h3>📝 Histórico</h3>

                      <span>Todos os registros desta evolução.</span>
                    </div>
                  </div>

                  {selected.records.length === 0 ? (
                    <div className='evolution-empty-inline'>
                      Nenhum registro ainda. Clique em{' '}
                      <strong>Registrar progresso</strong> para começar.
                    </div>
                  ) : (
                    <div className='evolution-records'>
                      {[...selected.records]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((record) => (
                          <div className='evolution-record' key={record.id}>
                            <div className='evolution-record-date'>
                              <strong>{formatDate(record.date)}</strong>

                              <small>{record.note || 'Sem observação'}</small>
                            </div>

                            <div className='evolution-record-values'>
                              {selected.metrics.map(
                                (metric) =>
                                  record.values[metric.id] != null && (
                                    <span key={metric.id}>
                                      <small>{metric.name}</small>

                                      <strong>
                                        {formatValue(
                                          record.values[metric.id],
                                          metric.unit,
                                        )}
                                      </strong>
                                    </span>
                                  ),
                              )}
                            </div>

                            <button
                              type='button'
                              className='ghost danger'
                              onClick={() => deleteRecord(record.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================
          MODAL — NOVA/EDITAR EVOLUÇÃO
      ========================================= */}
      {showEvolutionForm && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowEvolutionForm(false)
          }
        >
          <form className='evolution-modal' onSubmit={saveEvolution}>
            <div className='evolution-modal-header'>
              <div>
                <span>CONFIGURAÇÃO</span>

                <h3>
                  {editingEvolution ? 'Editar evolução' : 'Nova evolução'}
                </h3>
              </div>

              <button type='button' onClick={() => setShowEvolutionForm(false)}>
                ×
              </button>
            </div>

            <label>
              Nome
              <input
                value={evolutionForm.name}
                onChange={(event) =>
                  setEvolutionForm({
                    ...evolutionForm,
                    name: event.target.value,
                  })
                }
                placeholder='Ex.: Calistenia'
                autoFocus
              />
            </label>

            <div className='evolution-form-row'>
              <label>
                Ícone
                <input
                  value={evolutionForm.icon}
                  onChange={(event) =>
                    setEvolutionForm({
                      ...evolutionForm,
                      icon: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Cor
                <input
                  type='color'
                  value={evolutionForm.color}
                  onChange={(event) =>
                    setEvolutionForm({
                      ...evolutionForm,
                      color: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              Descrição
              <textarea
                value={evolutionForm.description}
                onChange={(event) =>
                  setEvolutionForm({
                    ...evolutionForm,
                    description: event.target.value,
                  })
                }
                placeholder='O que você quer acompanhar?'
                rows='3'
              />
            </label>

            <div className='evolution-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowEvolutionForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================
          MODAL — MÉTRICA
      ========================================= */}
      {showMetricForm && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowMetricForm(false)
          }
        >
          <form className='evolution-modal' onSubmit={saveMetric}>
            <div className='evolution-modal-header'>
              <div>
                <span>MÉTRICA</span>

                <h3>{editingMetric ? 'Editar métrica' : 'Nova métrica'}</h3>
              </div>

              <button type='button' onClick={() => setShowMetricForm(false)}>
                ×
              </button>
            </div>

            <label>
              Nome
              <input
                value={metricForm.name}
                onChange={(event) =>
                  setMetricForm({
                    ...metricForm,
                    name: event.target.value,
                  })
                }
                placeholder='Ex.: Barra fixa'
                autoFocus
              />
            </label>

            <div className='evolution-form-row'>
              <label>
                Unidade
                <input
                  value={metricForm.unit}
                  onChange={(event) =>
                    setMetricForm({
                      ...metricForm,
                      unit: event.target.value,
                    })
                  }
                  placeholder='kg, reps, segundos...'
                />
              </label>

              <label>
                Meta
                <input
                  type='number'
                  step='any'
                  value={metricForm.goal}
                  onChange={(event) =>
                    setMetricForm({
                      ...metricForm,
                      goal: event.target.value,
                    })
                  }
                  placeholder='Opcional'
                />
              </label>
            </div>

            <label>
              O que representa melhora?
              <select
                value={metricForm.better}
                onChange={(event) =>
                  setMetricForm({
                    ...metricForm,
                    better: event.target.value,
                  })
                }
              >
                <option value='higher'>
                  Quanto maior, melhor (peso, reps, distância)
                </option>

                <option value='lower'>
                  Quanto menor, melhor (tempo, erros)
                </option>
              </select>
            </label>

            <div className='evolution-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowMetricForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                Salvar métrica
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================
          MODAL — REGISTRAR PROGRESSO
      ========================================= */}
      {showRecordForm && selected && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowRecordForm(false)
          }
        >
          <form
            className='evolution-modal evolution-record-modal'
            onSubmit={saveRecord}
          >
            <div className='evolution-modal-header'>
              <div>
                <span>REGISTRO</span>

                <h3>Registrar progresso</h3>
              </div>

              <button type='button' onClick={() => setShowRecordForm(false)}>
                ×
              </button>
            </div>

            <label>
              Data
              <input
                type='date'
                value={recordForm.date}
                onChange={(event) =>
                  setRecordForm({
                    ...recordForm,
                    date: event.target.value,
                  })
                }
              />
            </label>

            <div className='evolution-record-inputs'>
              {selected.metrics.map((metric) => (
                <label key={metric.id}>
                  {metric.name}

                  {metric.unit && <small>{metric.unit}</small>}

                  <input
                    type='number'
                    step='any'
                    value={recordForm.values[metric.id] ?? ''}
                    onChange={(event) =>
                      setRecordForm({
                        ...recordForm,

                        values: {
                          ...recordForm.values,

                          [metric.id]: event.target.value,
                        },
                      })
                    }
                    placeholder='Valor'
                  />
                </label>
              ))}
            </div>

            <label>
              Observação
              <textarea
                value={recordForm.note}
                onChange={(event) =>
                  setRecordForm({
                    ...recordForm,
                    note: event.target.value,
                  })
                }
                placeholder='Como foi? O que mudou?'
                rows='3'
              />
            </label>

            <div className='evolution-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowRecordForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                💾 Salvar registro
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
