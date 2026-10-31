import React, { useMemo, useState } from 'react';

const uid = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const today = () => new Date().toISOString().slice(0, 10);

function formatDate(date) {
  if (!date) return '-';

  const parsed = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('pt-BR');
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return '-';

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(2).replace(/\.00$/, '');
}

function formatValue(value, unit = '') {
  if (value === '' || value == null) return '-';

  const text = formatNumber(value);

  return unit ? `${text} ${unit}` : text;
}

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO
|--------------------------------------------------------------------------
|
| Estrutura:
|
| evolutions
|   └── áreas
|        └── itens
|             └── campos
|             └── registros
|
| Exemplo:
|
| Academia
|   └── Supino reto
|        ├── Peso
|        ├── Séries
|        └── Repetições
|
*/

function normalizeField(field) {
  return {
    id: field.id || uid('field'),
    name: field.name || 'Valor',
    unit: field.unit || '',
    type: field.type || 'number',
    goal: field.goal === '' || field.goal == null ? '' : Number(field.goal),
    better: field.better === 'lower' ? 'lower' : 'higher',
  };
}

function normalizeItem(item) {
  return {
    id: item.id || uid('item'),
    name: item.name || 'Novo item',
    icon: item.icon || '📊',
    color: item.color || '#6366f1',
    description: item.description || '',
    fields: Array.isArray(item.fields) ? item.fields.map(normalizeField) : [],
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

function normalizeArea(area) {
  return {
    id: area.id || uid('area'),
    name: area.name || 'Nova área',
    icon: area.icon || '📈',
    color: area.color || '#6366f1',
    description: area.description || '',
    items: Array.isArray(area.items) ? area.items.map(normalizeItem) : [],
  };
}

/*
|--------------------------------------------------------------------------
| GRÁFICO
|--------------------------------------------------------------------------
*/

function LineChart({ points, color, unit = '', better = 'higher' }) {
  if (!points.length) {
    return (
      <div className='evolution-empty-chart'>Nenhum registro para exibir.</div>
    );
  }

  if (points.length === 1) {
    return (
      <div className='evolution-chart-single'>
        <div
          className='evolution-chart-single-dot'
          style={{ background: color }}
        />

        <strong>{formatValue(points[0].value, unit)}</strong>

        <span>{formatDate(points[0].date)}</span>

        <small>Registre mais valores para visualizar a evolução.</small>
      </div>
    );
  }

  const width = 700;
  const height = 270;
  const padX = 45;
  const padY = 30;

  const values = points.map((point) => Number(point.value));

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((point, index) => ({
    ...point,

    x: padX + (index / (points.length - 1)) * (width - padX * 2),

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
              y={point.y - 13}
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

/*
|--------------------------------------------------------------------------
| COMPONENTE PRINCIPAL
|--------------------------------------------------------------------------
*/

export default function Evolucao({ data, save }) {
  const savedAreas = Array.isArray(data?.evolutions) ? data.evolutions : [];

  const areas = useMemo(() => savedAreas.map(normalizeArea), [savedAreas]);

  /*
  |--------------------------------------------------------------------------
  | NAVEGAÇÃO
  |--------------------------------------------------------------------------
  */

  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');

  /*
  |--------------------------------------------------------------------------
  | MODAIS
  |--------------------------------------------------------------------------
  */

  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | EDIÇÃO
  |--------------------------------------------------------------------------
  */

  const [editingArea, setEditingArea] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingField, setEditingField] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FORMULÁRIO DA ÁREA
  |--------------------------------------------------------------------------
  */

  const [areaForm, setAreaForm] = useState({
    name: '',
    icon: '📈',
    color: '#6366f1',
    description: '',
  });

  /*
  |--------------------------------------------------------------------------
  | FORMULÁRIO DO ITEM
  |--------------------------------------------------------------------------
  */

  const [itemForm, setItemForm] = useState({
    name: '',
    icon: '📊',
    color: '#6366f1',
    description: '',
  });

  /*
  |--------------------------------------------------------------------------
  | FORMULÁRIO DO CAMPO
  |--------------------------------------------------------------------------
  */

  const [fieldForm, setFieldForm] = useState({
    name: '',
    unit: '',
    goal: '',
    better: 'higher',
  });

  /*
  |--------------------------------------------------------------------------
  | FORMULÁRIO DO REGISTRO
  |--------------------------------------------------------------------------
  */

  const [recordForm, setRecordForm] = useState({
    date: today(),
    values: {},
    note: '',
  });

  /*
  |--------------------------------------------------------------------------
  | SELECIONADOS
  |--------------------------------------------------------------------------
  */

  const selectedArea = areas.find((area) => area.id === selectedAreaId) || null;

  const selectedItem =
    selectedArea?.items.find((item) => item.id === selectedItemId) || null;

  /*
  |--------------------------------------------------------------------------
  | SALVAR
  |--------------------------------------------------------------------------
  */

  function persist(nextAreas) {
    save({
      ...data,
      evolutions: nextAreas,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | ABRIR ÁREA
  |--------------------------------------------------------------------------
  */

  function openArea(area) {
    setSelectedAreaId(area.id);
    setSelectedItemId('');
  }

  function backToAreas() {
    setSelectedAreaId('');
    setSelectedItemId('');
  }

  /*
  |--------------------------------------------------------------------------
  | ABRIR ITEM
  |--------------------------------------------------------------------------
  */

  function openItem(item) {
    setSelectedItemId(item.id);
  }

  function backToItems() {
    setSelectedItemId('');
  }

  /*
  |--------------------------------------------------------------------------
  | NOVA ÁREA
  |--------------------------------------------------------------------------
  */

  function openNewArea() {
    setEditingArea(null);

    setAreaForm({
      name: '',
      icon: '📈',
      color: '#6366f1',
      description: '',
    });

    setShowAreaForm(true);
  }

  function openEditArea() {
    if (!selectedArea) return;

    setEditingArea(selectedArea);

    setAreaForm({
      name: selectedArea.name,
      icon: selectedArea.icon,
      color: selectedArea.color,
      description: selectedArea.description,
    });

    setShowAreaForm(true);
  }

  function saveArea(event) {
    event.preventDefault();

    if (!areaForm.name.trim()) return;

    let nextAreas;

    if (editingArea) {
      nextAreas = areas.map((area) =>
        area.id === editingArea.id
          ? {
              ...area,
              ...areaForm,
              name: areaForm.name.trim(),
            }
          : area,
      );

      setSelectedAreaId(editingArea.id);
    } else {
      const newArea = normalizeArea({
        id: uid('area'),
        ...areaForm,
        name: areaForm.name.trim(),
        items: [],
      });

      nextAreas = [...areas, newArea];

      setSelectedAreaId(newArea.id);
      setSelectedItemId('');
    }

    persist(nextAreas);
    setShowAreaForm(false);
  }

  /*
  |--------------------------------------------------------------------------
  | EXCLUIR ÁREA
  |--------------------------------------------------------------------------
  */

  function deleteArea() {
    if (!selectedArea) return;

    const confirmed = window.confirm(
      `Excluir a área "${selectedArea.name}" e todos os itens e registros dela?`,
    );

    if (!confirmed) return;

    const nextAreas = areas.filter((area) => area.id !== selectedArea.id);

    persist(nextAreas);

    setSelectedAreaId('');
    setSelectedItemId('');
  }

  /*
  |--------------------------------------------------------------------------
  | NOVO ITEM
  |--------------------------------------------------------------------------
  */

  function openNewItem() {
    if (!selectedArea) return;

    setEditingItem(null);

    setItemForm({
      name: '',
      icon: '📊',
      color: selectedArea.color || '#6366f1',
      description: '',
    });

    setShowItemForm(true);
  }

  function openEditItem() {
    if (!selectedItem) return;

    setEditingItem(selectedItem);

    setItemForm({
      name: selectedItem.name,
      icon: selectedItem.icon,
      color: selectedItem.color,
      description: selectedItem.description,
    });

    setShowItemForm(true);
  }

  function saveItem(event) {
    event.preventDefault();

    if (!selectedArea || !itemForm.name.trim()) {
      return;
    }

    let nextAreas;
    let itemId;

    if (editingItem) {
      itemId = editingItem.id;

      nextAreas = areas.map((area) => {
        if (area.id !== selectedArea.id) {
          return area;
        }

        return {
          ...area,

          items: area.items.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  ...itemForm,
                  name: itemForm.name.trim(),
                }
              : item,
          ),
        };
      });
    } else {
      const newItem = normalizeItem({
        id: uid('item'),
        ...itemForm,
        name: itemForm.name.trim(),
        fields: [],
        records: [],
      });

      itemId = newItem.id;

      nextAreas = areas.map((area) =>
        area.id === selectedArea.id
          ? {
              ...area,
              items: [...area.items, newItem],
            }
          : area,
      );
    }

    persist(nextAreas);

    setSelectedItemId(itemId);
    setShowItemForm(false);
  }

  /*
  |--------------------------------------------------------------------------
  | EXCLUIR ITEM
  |--------------------------------------------------------------------------
  */

  function deleteItem() {
    if (!selectedArea || !selectedItem) return;

    const confirmed = window.confirm(
      `Excluir "${selectedItem.name}" e todos os seus registros?`,
    );

    if (!confirmed) return;

    const nextAreas = areas.map((area) =>
      area.id === selectedArea.id
        ? {
            ...area,
            items: area.items.filter((item) => item.id !== selectedItem.id),
          }
        : area,
    );

    persist(nextAreas);

    setSelectedItemId('');
  }

  /*
  |--------------------------------------------------------------------------
  | CAMPOS DO ITEM
  |--------------------------------------------------------------------------
  |
  | Exemplo Supino:
  |
  | Peso       kg
  | Séries     séries
  | Repetições reps
  |
  */

  function openNewField() {
    setEditingField(null);

    setFieldForm({
      name: '',
      unit: '',
      goal: '',
      better: 'higher',
    });

    setShowFieldForm(true);
  }

  function openEditField(field) {
    setEditingField(field);

    setFieldForm({
      name: field.name,
      unit: field.unit,
      goal: field.goal,
      better: field.better,
    });

    setShowFieldForm(true);
  }

  function saveField(event) {
    event.preventDefault();

    if (!selectedArea || !selectedItem) return;
    if (!fieldForm.name.trim()) return;

    const field = normalizeField({
      id: editingField?.id || uid('field'),
      name: fieldForm.name.trim(),
      unit: fieldForm.unit.trim(),
      goal: fieldForm.goal === '' ? '' : Number(fieldForm.goal),
      better: fieldForm.better,
    });

    const nextAreas = areas.map((area) => {
      if (area.id !== selectedArea.id) {
        return area;
      }

      return {
        ...area,

        items: area.items.map((item) => {
          if (item.id !== selectedItem.id) {
            return item;
          }

          const fields = editingField
            ? item.fields.map((current) =>
                current.id === editingField.id ? field : current,
              )
            : [...item.fields, field];

          return {
            ...item,
            fields,
          };
        }),
      };
    });

    persist(nextAreas);
    setShowFieldForm(false);
  }

  /*
  |--------------------------------------------------------------------------
  | EXCLUIR CAMPO
  |--------------------------------------------------------------------------
  */

  function deleteField(fieldId) {
    if (!selectedArea || !selectedItem) return;

    const field = selectedItem.fields.find((item) => item.id === fieldId);

    if (!field) return;

    const confirmed = window.confirm(
      `Excluir "${field.name}"? Os valores registrados nesse campo também serão removidos.`,
    );

    if (!confirmed) return;

    const nextAreas = areas.map((area) => {
      if (area.id !== selectedArea.id) {
        return area;
      }

      return {
        ...area,

        items: area.items.map((item) => {
          if (item.id !== selectedItem.id) {
            return item;
          }

          return {
            ...item,

            fields: item.fields.filter((current) => current.id !== fieldId),

            records: item.records.map((record) => {
              const values = {
                ...record.values,
              };

              delete values[fieldId];

              return {
                ...record,
                values,
              };
            }),
          };
        }),
      };
    });

    persist(nextAreas);
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTRO
  |--------------------------------------------------------------------------
  */

  function openRecordForm() {
    if (!selectedItem) return;

    if (!selectedItem.fields.length) {
      setShowFieldForm(true);
      return;
    }

    setRecordForm({
      date: today(),
      values: {},
      note: '',
    });

    setShowRecordForm(true);
  }

  function saveRecord(event) {
    event.preventDefault();

    if (!selectedArea || !selectedItem) {
      return;
    }

    const values = {};

    selectedItem.fields.forEach((field) => {
      const value = recordForm.values[field.id];

      if (value !== '' && value != null && Number.isFinite(Number(value))) {
        values[field.id] = Number(value);
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

    const nextAreas = areas.map((area) => {
      if (area.id !== selectedArea.id) {
        return area;
      }

      return {
        ...area,

        items: area.items.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,

                records: [...item.records, record].sort((a, b) =>
                  a.date.localeCompare(b.date),
                ),
              }
            : item,
        ),
      };
    });

    persist(nextAreas);

    setShowRecordForm(false);
  }

  /*
  |--------------------------------------------------------------------------
  | EXCLUIR REGISTRO
  |--------------------------------------------------------------------------
  */

  function deleteRecord(recordId) {
    if (!selectedArea || !selectedItem) {
      return;
    }

    const nextAreas = areas.map((area) =>
      area.id === selectedArea.id
        ? {
            ...area,

            items: area.items.map((item) =>
              item.id === selectedItem.id
                ? {
                    ...item,

                    records: item.records.filter(
                      (record) => record.id !== recordId,
                    ),
                  }
                : item,
            ),
          }
        : area,
    );

    persist(nextAreas);
  }

  /*
  |--------------------------------------------------------------------------
  | ÚLTIMO VALOR
  |--------------------------------------------------------------------------
  */

  const latestByField = useMemo(() => {
    const result = {};

    if (!selectedItem) {
      return result;
    }

    selectedItem.fields.forEach((field) => {
      const records = [...selectedItem.records]
        .filter((record) => record.values[field.id] != null)
        .sort((a, b) => b.date.localeCompare(a.date));

      result[field.id] = records[0]?.values?.[field.id] ?? null;
    });

    return result;
  }, [selectedItem]);

  /*
  |--------------------------------------------------------------------------
  | MELHOR VALOR
  |--------------------------------------------------------------------------
  */

  function getBestValue(field) {
    if (!selectedItem) return null;

    const values = selectedItem.records
      .map((record) => record.values[field.id])
      .filter((value) => Number.isFinite(Number(value)))
      .map(Number);

    if (!values.length) {
      return null;
    }

    return field.better === 'lower' ? Math.min(...values) : Math.max(...values);
  }

  /*
  |--------------------------------------------------------------------------
  | PONTOS DO GRÁFICO
  |--------------------------------------------------------------------------
  */

  function getFieldPoints(field) {
    if (!selectedItem) return [];

    return [...selectedItem.records]
      .filter((record) => record.values[field.id] != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((record) => ({
        id: record.id,
        date: record.date,
        value: record.values[field.id],
      }));
  }

  /*
  |--------------------------------------------------------------------------
  | PROGRESSO DA META
  |--------------------------------------------------------------------------
  */

  function getProgress(field) {
    const current = Number(latestByField[field.id]);

    const goal = Number(field.goal);

    if (!Number.isFinite(current) || !Number.isFinite(goal) || goal <= 0) {
      return null;
    }

    const percentage =
      field.better === 'lower'
        ? (goal / Math.max(current, 0.0001)) * 100
        : (current / goal) * 100;

    return Math.max(0, Math.min(100, percentage));
  }

  /*
  |--------------------------------------------------------------------------
  | ESTATÍSTICAS DA ÁREA
  |--------------------------------------------------------------------------
  */

  const areaStats = selectedArea
    ? {
        items: selectedArea.items.length,

        records: selectedArea.items.reduce(
          (total, item) => total + item.records.length,
          0,
        ),

        fields: selectedArea.items.reduce(
          (total, item) => total + item.fields.length,
          0,
        ),
      }
    : null;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section className='page evolution-page'>
      {/* =========================================================
          CABEÇALHO
      ========================================================= */}

      <div className='evolution-header'>
        <div>
          <span className='section-kicker'>PROGRESSO PESSOAL</span>

          <h2>📈 Evolução & Progresso</h2>

          <p>Crie áreas para acompanhar sua evolução em qualquer atividade.</p>
        </div>

        {!selectedArea && (
          <button type='button' className='primary' onClick={openNewArea}>
            ＋ Nova área
          </button>
        )}

        {selectedArea && !selectedItem && (
          <button type='button' className='primary' onClick={openNewItem}>
            ＋ Adicionar item
          </button>
        )}

        {selectedItem && (
          <button type='button' className='primary' onClick={openRecordForm}>
            ＋ Registrar progresso
          </button>
        )}
      </div>

      {/* =========================================================
          NÍVEL 1 — ÁREAS
      ========================================================= */}

      {!selectedArea && (
        <>
          {areas.length === 0 ? (
            <div className='evolution-empty-state'>
              <div className='evolution-empty-icon'>📈</div>

              <h3>Sua evolução começa aqui</h3>

              <p>Crie uma área para começar a acompanhar seu progresso.</p>

              <button type='button' className='primary' onClick={openNewArea}>
                ＋ Criar primeira área
              </button>

              <div className='evolution-empty-examples'>
                <span>🏋️ Academia</span>
                <span>🤸 Calistenia</span>
                <span>🏃 Corrida</span>
                <span>🧩 Cubo mágico</span>
                <span>♟️ Xadrez</span>
                <span>💻 Programação</span>
              </div>
            </div>
          ) : (
            <div className='evolution-area-section'>
              <div className='evolution-section-heading'>
                <div>
                  <h3>Minhas áreas</h3>

                  <span>Escolha uma área para visualizar seus itens.</span>
                </div>
              </div>

              <div className='evolution-area-grid'>
                {areas.map((area) => {
                  const records = area.items.reduce(
                    (total, item) => total + item.records.length,
                    0,
                  );

                  return (
                    <button
                      key={area.id}
                      type='button'
                      className='evolution-area-card'
                      onClick={() => openArea(area)}
                      style={{
                        '--area-color': area.color,
                      }}
                    >
                      <div className='evolution-area-icon'>{area.icon}</div>

                      <div className='evolution-area-content'>
                        <strong>{area.name}</strong>

                        <span>
                          {area.description ||
                            'Acompanhe sua evolução nesta área.'}
                        </span>

                        <small>
                          {area.items.length}{' '}
                          {area.items.length === 1 ? 'item' : 'itens'} ·{' '}
                          {records} {records === 1 ? 'registro' : 'registros'}
                        </small>
                      </div>

                      <div className='evolution-area-arrow'>→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          NÍVEL 2 — ÁREA
      ========================================================= */}

      {selectedArea && !selectedItem && (
        <div className='evolution-area-view'>
          <button
            type='button'
            className='ghost evolution-back-button'
            onClick={backToAreas}
          >
            ← Voltar para áreas
          </button>

          <div
            className='evolution-area-banner'
            style={{
              '--area-color': selectedArea.color,
            }}
          >
            <div className='evolution-area-banner-icon'>
              {selectedArea.icon}
            </div>

            <div className='evolution-area-banner-content'>
              <div className='evolution-title-row'>
                <div>
                  <span className='section-kicker'>ÁREA DE EVOLUÇÃO</span>

                  <h2>{selectedArea.name}</h2>

                  <p>
                    {selectedArea.description ||
                      'Acompanhe seu desempenho e evolução.'}
                  </p>
                </div>

                <div className='evolution-actions'>
                  <button
                    type='button'
                    className='ghost'
                    onClick={openEditArea}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    type='button'
                    className='ghost danger'
                    onClick={deleteArea}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className='evolution-stats'>
                <div>
                  <span>Itens</span>
                  <strong>{areaStats.items}</strong>
                </div>

                <div>
                  <span>Campos</span>
                  <strong>{areaStats.fields}</strong>
                </div>

                <div>
                  <span>Registros</span>
                  <strong>{areaStats.records}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className='evolution-toolbar'>
            <div>
              <h3>📊 O que você acompanha?</h3>

              <span>
                Crie itens como Supino, Agachamento, Barra fixa, 5 km, Rating
                etc.
              </span>
            </div>

            <button type='button' className='primary' onClick={openNewItem}>
              ＋ Novo item
            </button>
          </div>

          {selectedArea.items.length === 0 ? (
            <div className='evolution-empty-inline'>
              <div className='evolution-empty-icon'>📊</div>

              <strong>Nenhum item nesta área</strong>

              <span>Adicione o primeiro item que você deseja acompanhar.</span>

              <button type='button' className='primary' onClick={openNewItem}>
                ＋ Criar primeiro item
              </button>
            </div>
          ) : (
            <div className='evolution-item-grid'>
              {selectedArea.items.map((item) => {
                const latestField = item.fields[0];

                const latest = latestField
                  ? [...item.records]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .find((record) => record.values[latestField.id] != null)
                  : null;

                return (
                  <button
                    key={item.id}
                    type='button'
                    className='evolution-item-card'
                    onClick={() => openItem(item)}
                    style={{
                      '--item-color': item.color,
                    }}
                  >
                    <div className='evolution-item-icon'>{item.icon}</div>

                    <div className='evolution-item-content'>
                      <strong>{item.name}</strong>

                      <span>
                        {item.description ||
                          `${item.fields.length} campos · ${item.records.length} registros`}
                      </span>

                      {latest && latestField && (
                        <small>
                          Último:{' '}
                          <b>
                            {formatValue(
                              latest.values[latestField.id],
                              latestField.unit,
                            )}
                          </b>
                        </small>
                      )}
                    </div>

                    <div className='evolution-item-arrow'>→</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          NÍVEL 3 — ITEM
      ========================================================= */}

      {selectedItem && selectedArea && (
        <div className='evolution-item-view'>
          <div className='evolution-breadcrumbs'>
            <button type='button' onClick={backToAreas}>
              Evolução
            </button>

            <span>›</span>

            <button type='button' onClick={backToItems}>
              {selectedArea.name}
            </button>

            <span>›</span>

            <strong>{selectedItem.name}</strong>
          </div>

          <div
            className='evolution-item-banner'
            style={{
              '--item-color': selectedItem.color,
            }}
          >
            <div className='evolution-item-banner-icon'>
              {selectedItem.icon}
            </div>

            <div className='evolution-item-banner-content'>
              <div className='evolution-title-row'>
                <div>
                  <span className='section-kicker'>
                    {selectedArea.name.toUpperCase()}
                  </span>

                  <h2>{selectedItem.name}</h2>

                  <p>
                    {selectedItem.description ||
                      'Acompanhe sua evolução ao longo do tempo.'}
                  </p>
                </div>

                <div className='evolution-actions'>
                  <button
                    type='button'
                    className='ghost'
                    onClick={openEditItem}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    type='button'
                    className='ghost danger'
                    onClick={deleteItem}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className='evolution-stats'>
                <div>
                  <span>Campos</span>

                  <strong>{selectedItem.fields.length}</strong>
                </div>

                <div>
                  <span>Registros</span>

                  <strong>{selectedItem.records.length}</strong>
                </div>

                <div>
                  <span>Último registro</span>

                  <strong>
                    {selectedItem.records.length
                      ? formatDate(
                          [...selectedItem.records].sort((a, b) =>
                            b.date.localeCompare(a.date),
                          )[0].date,
                        )
                      : '-'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              CAMPOS
          ===================================================== */}

          <div className='evolution-toolbar'>
            <div>
              <h3>📊 Dados que você acompanha</h3>

              <span>Defina quais valores serão registrados neste item.</span>
            </div>

            <button type='button' className='ghost' onClick={openNewField}>
              ＋ Campo
            </button>
          </div>

          {selectedItem.fields.length === 0 ? (
            <div className='evolution-empty-inline'>
              <div className='evolution-empty-icon'>📝</div>

              <strong>Configure os dados deste item</strong>

              <span>
                Por exemplo, em Supino você pode adicionar Peso, Séries e
                Repetições.
              </span>

              <button type='button' className='primary' onClick={openNewField}>
                ＋ Criar primeiro campo
              </button>
            </div>
          ) : (
            <>
              <div className='evolution-fields-list'>
                {selectedItem.fields.map((field) => {
                  const current = latestByField[field.id];

                  const best = getBestValue(field);

                  const progress = getProgress(field);

                  return (
                    <div className='evolution-field-summary' key={field.id}>
                      <div className='evolution-field-summary-main'>
                        <span className='evolution-field-icon'>📊</span>

                        <div>
                          <strong>{field.name}</strong>

                          <small>{field.unit || 'valor numérico'}</small>
                        </div>
                      </div>

                      <div className='evolution-field-values'>
                        <div>
                          <small>Atual</small>

                          <strong>{formatValue(current, field.unit)}</strong>
                        </div>

                        <div>
                          <small>Melhor</small>

                          <strong>{formatValue(best, field.unit)}</strong>
                        </div>

                        {progress != null && (
                          <div>
                            <small>Meta</small>

                            <strong>{Math.round(progress)}%</strong>
                          </div>
                        )}
                      </div>

                      <div className='evolution-card-actions'>
                        <button
                          type='button'
                          onClick={() => openEditField(field)}
                        >
                          ✏️
                        </button>

                        <button
                          type='button'
                          onClick={() => deleteField(field.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* =================================================
                  GRÁFICOS
              ================================================= */}

              <div className='evolution-charts-section'>
                <div className='evolution-toolbar'>
                  <div>
                    <h3>📈 Evolução</h3>

                    <span>
                      Veja como seus números mudaram ao longo do tempo.
                    </span>
                  </div>
                </div>

                <div className='evolution-chart-grid'>
                  {selectedItem.fields.map((field) => {
                    const points = getFieldPoints(field);

                    const current = latestByField[field.id];

                    const best = getBestValue(field);

                    const progress = getProgress(field);

                    return (
                      <article className='evolution-chart-card' key={field.id}>
                        <div className='evolution-chart-card-header'>
                          <div>
                            <span>{field.name}</span>

                            <strong>{formatValue(current, field.unit)}</strong>
                          </div>

                          {progress != null && (
                            <div className='evolution-mini-goal'>
                              <small>Meta</small>

                              <strong>{Math.round(progress)}%</strong>
                            </div>
                          )}
                        </div>

                        <LineChart
                          points={points}
                          color={selectedItem.color}
                          unit={field.unit}
                          better={field.better}
                        />

                        <div className='evolution-chart-footer'>
                          <span>
                            Melhor:{' '}
                            <strong>{formatValue(best, field.unit)}</strong>
                          </span>

                          <span>
                            {points.length}{' '}
                            {points.length === 1 ? 'registro' : 'registros'}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* =====================================================
              HISTÓRICO
          ===================================================== */}

          <div className='evolution-records-section'>
            <div className='evolution-toolbar'>
              <div>
                <h3>📝 Histórico</h3>

                <span>Todos os registros deste item.</span>
              </div>

              {selectedItem.fields.length > 0 && (
                <button
                  type='button'
                  className='primary'
                  onClick={openRecordForm}
                >
                  ＋ Registrar progresso
                </button>
              )}
            </div>

            {selectedItem.records.length === 0 ? (
              <div className='evolution-empty-inline'>
                <div className='evolution-empty-icon'>📝</div>

                <strong>Nenhum registro ainda</strong>

                <span>
                  Registre seu primeiro resultado para começar a construir seu
                  histórico.
                </span>

                {selectedItem.fields.length > 0 && (
                  <button
                    type='button'
                    className='primary'
                    onClick={openRecordForm}
                  >
                    ＋ Primeiro registro
                  </button>
                )}
              </div>
            ) : (
              <div className='evolution-records'>
                {[...selectedItem.records]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((record) => (
                    <div className='evolution-record' key={record.id}>
                      <div className='evolution-record-date'>
                        <strong>{formatDate(record.date)}</strong>

                        <small>{record.note || 'Sem observação'}</small>
                      </div>

                      <div className='evolution-record-values'>
                        {selectedItem.fields.map(
                          (field) =>
                            record.values[field.id] != null && (
                              <span key={field.id}>
                                <small>{field.name}</small>

                                <strong>
                                  {formatValue(
                                    record.values[field.id],
                                    field.unit,
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

      {/* =========================================================
          MODAL — NOVA ÁREA
      ========================================================= */}

      {showAreaForm && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAreaForm(false);
            }
          }}
        >
          <form className='evolution-modal' onSubmit={saveArea}>
            <div className='evolution-modal-header'>
              <div>
                <span>ÁREA DE EVOLUÇÃO</span>

                <h3>{editingArea ? 'Editar área' : 'Nova área'}</h3>
              </div>

              <button type='button' onClick={() => setShowAreaForm(false)}>
                ×
              </button>
            </div>

            <label>
              Nome da área
              <input
                value={areaForm.name}
                onChange={(event) =>
                  setAreaForm({
                    ...areaForm,
                    name: event.target.value,
                  })
                }
                placeholder='Ex.: Academia'
                autoFocus
              />
            </label>

            <div className='evolution-form-row'>
              <label>
                Ícone
                <input
                  value={areaForm.icon}
                  onChange={(event) =>
                    setAreaForm({
                      ...areaForm,
                      icon: event.target.value,
                    })
                  }
                  placeholder='🏋️'
                />
              </label>

              <label>
                Cor
                <input
                  type='color'
                  value={areaForm.color}
                  onChange={(event) =>
                    setAreaForm({
                      ...areaForm,
                      color: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              Descrição
              <textarea
                value={areaForm.description}
                onChange={(event) =>
                  setAreaForm({
                    ...areaForm,
                    description: event.target.value,
                  })
                }
                placeholder='Ex.: Acompanhar meu progresso na musculação.'
                rows='3'
              />
            </label>

            <div className='evolution-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowAreaForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                Salvar área
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL — NOVO ITEM
      ========================================================= */}

      {showItemForm && selectedArea && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowItemForm(false);
            }
          }}
        >
          <form className='evolution-modal' onSubmit={saveItem}>
            <div className='evolution-modal-header'>
              <div>
                <span>{selectedArea.name.toUpperCase()}</span>

                <h3>{editingItem ? 'Editar item' : 'Novo item'}</h3>
              </div>

              <button type='button' onClick={() => setShowItemForm(false)}>
                ×
              </button>
            </div>

            <label>
              Nome
              <input
                value={itemForm.name}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    name: event.target.value,
                  })
                }
                placeholder='Ex.: Supino reto'
                autoFocus
              />
            </label>

            <div className='evolution-form-row'>
              <label>
                Ícone
                <input
                  value={itemForm.icon}
                  onChange={(event) =>
                    setItemForm({
                      ...itemForm,
                      icon: event.target.value,
                    })
                  }
                  placeholder='🏋️'
                />
              </label>

              <label>
                Cor
                <input
                  type='color'
                  value={itemForm.color}
                  onChange={(event) =>
                    setItemForm({
                      ...itemForm,
                      color: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              Descrição
              <textarea
                value={itemForm.description}
                onChange={(event) =>
                  setItemForm({
                    ...itemForm,
                    description: event.target.value,
                  })
                }
                placeholder='Ex.: Acompanhar minha carga no supino.'
                rows='3'
              />
            </label>

            <div className='evolution-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowItemForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                Salvar item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL — NOVO CAMPO
      ========================================================= */}

      {showFieldForm && selectedItem && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowFieldForm(false);
            }
          }}
        >
          <form className='evolution-modal' onSubmit={saveField}>
            <div className='evolution-modal-header'>
              <div>
                <span>DADO DO ITEM</span>

                <h3>{editingField ? 'Editar campo' : 'Novo campo'}</h3>
              </div>

              <button type='button' onClick={() => setShowFieldForm(false)}>
                ×
              </button>
            </div>

            <p className='evolution-modal-help'>
              Defina um valor que você deseja registrar neste item.
            </p>

            <label>
              Nome do campo
              <input
                value={fieldForm.name}
                onChange={(event) =>
                  setFieldForm({
                    ...fieldForm,
                    name: event.target.value,
                  })
                }
                placeholder='Ex.: Peso'
                autoFocus
              />
            </label>

            <div className='evolution-form-row'>
              <label>
                Unidade
                <input
                  value={fieldForm.unit}
                  onChange={(event) =>
                    setFieldForm({
                      ...fieldForm,
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
                  value={fieldForm.goal}
                  onChange={(event) =>
                    setFieldForm({
                      ...fieldForm,
                      goal: event.target.value,
                    })
                  }
                  placeholder='Opcional'
                />
              </label>
            </div>

            <label>
              Como saber se melhorou?
              <select
                value={fieldForm.better}
                onChange={(event) =>
                  setFieldForm({
                    ...fieldForm,
                    better: event.target.value,
                  })
                }
              >
                <option value='higher'>Quanto maior, melhor</option>

                <option value='lower'>Quanto menor, melhor</option>
              </select>
            </label>

            <div className='evolution-modal-footer'>
              <button
                type='button'
                className='ghost'
                onClick={() => setShowFieldForm(false)}
              >
                Cancelar
              </button>

              <button type='submit' className='primary'>
                Salvar campo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL — REGISTRAR PROGRESSO
      ========================================================= */}

      {showRecordForm && selectedItem && (
        <div
          className='evolution-modal-overlay'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRecordForm(false);
            }
          }}
        >
          <form
            className='evolution-modal evolution-record-modal'
            onSubmit={saveRecord}
          >
            <div className='evolution-modal-header'>
              <div>
                <span>{selectedItem.name.toUpperCase()}</span>

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
              {selectedItem.fields.map((field) => (
                <label key={field.id}>
                  <span>
                    {field.name}

                    {field.unit && <small>{field.unit}</small>}
                  </span>

                  <input
                    type='number'
                    step='any'
                    value={recordForm.values[field.id] ?? ''}
                    onChange={(event) =>
                      setRecordForm({
                        ...recordForm,

                        values: {
                          ...recordForm.values,

                          [field.id]: event.target.value,
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
