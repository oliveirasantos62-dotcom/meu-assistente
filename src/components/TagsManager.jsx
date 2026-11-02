import React, { useMemo, useState } from 'react';
import { collectTagUsage, getTagIds } from '../utils/analytics';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const TYPES = [
  ['tasks', 'Tarefas'],
  ['habits', 'Hábitos'],
  ['goals', 'Objetivos'],
  ['projects', 'Projetos'],
  ['diaryEntries', 'Diário'],
  ['studySessions', 'Sessões de estudo'],
  ['knowledgeItems', 'Conhecimentos'],
  ['errors', 'Banco de erros'],
  ['weeklyReflections', 'Reflexões'],
  ['studyCycles', 'Ciclo de estudos'],
  ['calendarEvents', 'Calendário'],
  ['processes', 'Processos'],
  ['areas', 'Áreas'],
  ['collections', 'Coleções'],
  ['financeTransactions', 'Financeiro'],
  ['investments', 'Investimentos'],
];

function itemName(item) {
  return item?.name || item?.title || item?.titulo || item?.subject || item?.description || 'Item';
}

function getSourceItems(data, key) {
  if (key === 'collections') return (data.collections || []).flatMap((collection) => collection.itens || []);
  if (key === 'financeTransactions') return data.finance?.transactions || [];
  return data[key] || [];
}

function updateSourceItems(data, key, updater) {
  if (key === 'collections') {
    return {
      ...data,
      collections: (data.collections || []).map((collection) => ({ ...collection, itens: updater(collection.itens) })),
    };
  }
  if (key === 'financeTransactions') {
    return { ...data, finance: { ...(data.finance || {}), transactions: updater(data.finance?.transactions) } };
  }
  return { ...data, [key]: updater(data[key]) };
}

export default function TagsManager({ data, save }) {
  const tags = Array.isArray(data?.tags) ? data.tags : [];
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const usage = useMemo(() => collectTagUsage(data), [data]);
  const tag = tags.find((t) => String(t.id) === String(selected));

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...tags]
      .filter((t) => !query || String(t.name || '').toLowerCase().includes(query))
      .filter((t) => {
        if (sourceFilter === 'all') return true;
        return usage.get(t.id)?.sources?.has(sourceFilter);
      })
      .sort((a, b) => {
        const countDiff = (usage.get(b.id)?.count || 0) - (usage.get(a.id)?.count || 0);
        if (countDiff) return countDiff;
        return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
      });
  }, [tags, search, sourceFilter, usage]);

  const associations = useMemo(() => {
    if (!tag) return [];

    return TYPES.flatMap(([key, label]) => {
      const items = getSourceItems(data, key);

      return items
        .filter((item) => getTagIds(item).map(String).includes(String(tag.id)))
        .map((item) => ({
          key,
          label,
          id: item.id,
          name: itemName(item),
        }));
    });
  }, [data, tag]);

  function createTag(event) {
    event.preventDefault();
    const clean = name.trim().replace(/^#/, '');
    if (!clean) return;

    if (tags.some((t) => String(t.name || '').toLowerCase() === clean.toLowerCase())) {
      return;
    }

    const next = {
      id: uid(),
      name: clean,
      color,
      createdAt: new Date().toISOString(),
    };

    save({ ...data, tags: [...tags, next] });
    setName('');
    setSelected(next.id);
  }

  function countIn(key, currentTag) {
    return getSourceItems(data, key).filter((item) =>
      getTagIds(item).map(String).includes(String(currentTag.id)),
    ).length;
  }

  function removeTag() {
    if (!tag) return;

    const affected = TYPES.reduce((sum, [key]) => sum + countIn(key, tag), 0);
    const keepItems = window.confirm(
      affected
        ? `Excluir #${tag.name}?\n\nOK = excluir somente a tag e manter todos os itens.\nCancelar = abrir a confirmação para excluir também os itens associados.`
        : `Excluir a tag #${tag.name}?`,
    );

    if (affected && !keepItems) {
      const destructive = window.confirm(
        `ATENÇÃO: isso excluirá ${affected} item(ns) associados à tag #${tag.name}.\n\nDeseja realmente continuar?`,
      );
      if (!destructive) return;
    }

    const tagId = String(tag.id);
    const cleanItems = (items) => (items || []).filter((item) => {
      if (keepItems) return true;
      return !getTagIds(item).map(String).includes(tagId);
    }).map((item) => ({
      ...item,
      tags: getTagIds(item).map(String).filter((id) => id !== tagId),
    }));

    let next = {
      ...data,
      tags: tags.filter((item) => String(item.id) !== tagId),
    };

    TYPES.forEach(([key]) => {
      next = updateSourceItems(next, key, (items) => (items || []).filter((item) => {
        if (keepItems) return true;
        return !getTagIds(item).map(String).includes(tagId);
      }).map((item) => ({
        ...item,
        tags: getTagIds(item).map(String).filter((id) => id !== tagId),
      })));
    });

    save(next);
    setSelected('');
  }

  function toggleAssociation(key, itemId) {
    if (!tag) return;
    const tagId = String(tag.id);

    const updateItems = (items) => (items || []).map((item) => {
      if (String(item.id) !== String(itemId)) return item;
      const ids = getTagIds(item).map(String);
      const next = ids.includes(tagId)
        ? ids.filter((id) => id !== tagId)
        : [...ids, tagId];
      return { ...item, tags: Array.from(new Set(next)) };
    });

    save(updateSourceItems(data, key, updateItems));
  }

  const selectedUsage = tag ? usage.get(tag.id) : null;

  return (
    <section className='central-page'>
      <div className='page-hero'>
        <div>
          <span className='eyebrow'>ESTRUTURA CENTRAL</span>
          <h2>🏷 Tags</h2>
          <p>
            Use tags como conexões reutilizáveis entre tarefas, hábitos, objetivos, diário, estudos, projetos, finanças,
            calendário, coleções e outros registros.
          </p>
        </div>
        <div className='metric-pill'>{tags.length} tags</div>
      </div>

      <div className='central-grid two'>
        <div className='card'>
          <h3>Nova tag</h3>
          <form className='form-grid' onSubmit={createTag}>
            <label>
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='#Concurso'
                maxLength={50}
              />
            </label>
            <label>
              Cor
              <input
                type='color'
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
            <div>
              <button className='primary-button' type='submit'>
                Criar tag
              </button>
            </div>
          </form>

          <input
            className='central-search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Pesquisar tags...'
          />

          <select
            className='central-search'
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            aria-label='Filtrar tags por tipo de aplicação'
          >
            <option value='all'>Todas as aplicações</option>
            {TYPES.map(([key, label]) => (
              <option key={key} value={label}>{label}</option>
            ))}
          </select>

          <div className='tag-list'>
            {visible.map((item) => (
              <button
                key={item.id}
                type='button'
                className={`tag-chip ${String(selected) === String(item.id) ? 'active' : ''}`}
                onClick={() => setSelected(item.id)}
              >
                <span style={{ background: item.color }} />
                #{item.name}
                <b>{usage.get(item.id)?.count || 0}</b>
              </button>
            ))}
          </div>
        </div>

        <div className='card'>
          {tag ? (
            <>
              <div className='detail-head'>
                <div>
                  <span className='tag-chip active'>
                    <span style={{ background: tag.color }} />#{tag.name}
                  </span>
                  <h3>Aplicações e conexões</h3>
                </div>
                <button className='danger-button' onClick={removeTag} type='button'>
                  Excluir tag
                </button>
              </div>

              <div className='stats-row'>
                <div><small>Usos</small><strong>{selectedUsage?.count || 0}</strong></div>
                <div><small>Tipos</small><strong>{selectedUsage?.sources?.size || 0}</strong></div>
                <div><small>Última utilização</small><strong>{selectedUsage?.lastUsed ? new Date(selectedUsage.lastUsed).toLocaleDateString('pt-BR') : '—'}</strong></div>
              </div>

              <div className='tag-application-summary'>
                {TYPES.map(([key, label]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{countIn(key, tag)}</strong>
                  </div>
                ))}
              </div>

              <h4>Itens associados</h4>
              <div className='association-list'>
                {associations.length ? (
                  associations.map((association) => (
                    <div
                      key={`${association.key}-${association.id}`}
                      className='association-item'
                    >
                      <span>{association.label}</span>
                      <strong>{association.name}</strong>
                      <button
                        type='button'
                        onClick={() => toggleAssociation(association.key, association.id)}
                      >
                        Desassociar
                      </button>
                    </div>
                  ))
                ) : (
                  <p className='empty-state'>
                    Nenhuma aplicação ainda. Você pode aplicar esta tag diretamente ao criar ou editar uma tarefa.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className='empty-state'>
              <div className='empty-icon'>🔗</div>
              <h3>Selecione uma tag</h3>
              <p>Veja onde ela é usada, quantas vezes aparece e quais itens estão conectados.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
