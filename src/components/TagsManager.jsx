import React, { useMemo, useState } from 'react';
import { collectTagUsage, getTagIds } from '../utils/analytics';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const TYPES = [
  ['tasks', 'Tarefas'], ['habits', 'Hábitos'], ['goals', 'Objetivos'],
  ['projects', 'Projetos'], ['studySessions', 'Estudos'], ['collections', 'Coleções'],
];

export default function TagsManager({ data, save }) {
  const tags = Array.isArray(data?.tags) ? data.tags : [];
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [search, setSearch] = useState('');
  const usage = useMemo(() => collectTagUsage(data), [data]);
  const visible = tags.filter((t) => (t.name || '').toLowerCase().includes(search.toLowerCase()));
  const tag = tags.find((t) => String(t.id) === String(selected));

  function createTag(e) {
    e.preventDefault();
    const clean = name.trim().replace(/^#/, '');
    if (!clean || tags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) return;
    const next = { id: uid(), name: clean, color, createdAt: new Date().toISOString() };
    save({ ...data, tags: [...tags, next] });
    setName(''); setSelected(next.id);
  }

  function removeTag() {
    if (!tag) return;
    const affected = TYPES.reduce((sum, [key]) => sum + countIn(key, tag), 0);
    const mode = affected && window.confirm(`A tag #${tag.name} está associada a ${affected} item(ns). OK = remover somente a tag; Cancelar = manter a tag.`);
    if (affected && mode === false) return;
    const clean = (items) => (items || []).map((item) => ({ ...item, tags: getTagIds(item).filter((id) => id !== String(tag.id)) }));
    const collections = (data.collections || []).map((c) => ({ ...c, itens: (c.itens || []).map((item) => ({ ...item, tags: getTagIds(item).filter((id) => id !== String(tag.id)) })) }));
    save({ ...data, tags: tags.filter((t) => String(t.id) !== String(tag.id)), tasks: clean(data.tasks), habits: clean(data.habits), goals: clean(data.goals), projects: clean(data.projects), studySessions: clean(data.studySessions), collections });
    setSelected('');
  }

  function countIn(key, currentTag) {
    if (key === 'collections') return (data.collections || []).reduce((n, c) => n + (c.itens || []).filter((i) => getTagIds(i).includes(String(currentTag.id))).length, 0);
    return (data[key] || []).filter((item) => getTagIds(item).includes(String(currentTag.id))).length;
  }

  function toggleAssociation(key, itemId) {
    if (!tag) return;
    const updateItems = (items) => (items || []).map((item) => {
      if (String(item.id) !== String(itemId)) return item;
      const ids = getTagIds(item);
      const next = ids.includes(String(tag.id)) ? ids.filter((id) => id !== String(tag.id)) : [...ids, String(tag.id)];
      return { ...item, tags: next };
    });
    if (key === 'collections') {
      save({ ...data, collections: (data.collections || []).map((c) => ({ ...c, itens: updateItems(c.itens) })) });
    } else save({ ...data, [key]: updateItems(data[key]) });
  }

  const associations = tag ? TYPES.flatMap(([key, label]) => {
    const items = key === 'collections' ? (data.collections || []).flatMap((c) => c.itens || []) : (data[key] || []);
    return items.filter((i) => getTagIds(i).includes(String(tag.id))).map((i) => ({ key, label, id: i.id, name: i.name || i.title || i.titulo || i.subject || 'Item' }));
  }) : [];

  return <section className='central-page'>
    <div className='page-hero'><div><span className='eyebrow'>ESTRUTURA CENTRAL</span><h2>🏷 Tags</h2><p>Conecte tarefas, hábitos, objetivos, estudos, projetos e coleções com uma única referência.</p></div><div className='metric-pill'>{tags.length} tags</div></div>
    <div className='central-grid two'>
      <div className='card'><h3>Nova tag</h3><form className='form-grid' onSubmit={createTag}><label>Nome<input value={name} onChange={e => setName(e.target.value)} placeholder='#Concurso' /></label><label>Cor<input type='color' value={color} onChange={e => setColor(e.target.value)} /></label><div><button className='primary-button' type='submit'>Criar tag</button></div></form><input className='central-search' value={search} onChange={e => setSearch(e.target.value)} placeholder='Pesquisar tags...' />
        <div className='tag-list'>{visible.map(t => <button key={t.id} className={`tag-chip ${selected === t.id ? 'active' : ''}`} onClick={() => setSelected(t.id)}><span style={{ background: t.color }} />#{t.name}<b>{usage.get(t.id)?.count || 0}</b></button>)}</div>
      </div>
      <div className='card'>{tag ? <><div className='detail-head'><div><span className='tag-chip active'><span style={{ background: tag.color }} />#{tag.name}</span><h3>Histórico e conexões</h3></div><button className='danger-button' onClick={removeTag}>Excluir tag</button></div><div className='stats-row'><div><small>Usos</small><strong>{usage.get(tag.id)?.count || 0}</strong></div><div><small>Tipos</small><strong>{usage.get(tag.id)?.sources?.size || 0}</strong></div><div><small>Última utilização</small><strong>{usage.get(tag.id)?.lastUsed ? new Date(usage.get(tag.id).lastUsed).toLocaleDateString('pt-BR') : '—'}</strong></div></div><h4>Itens associados</h4><div className='association-list'>{associations.length ? associations.map(a => <div key={`${a.key}-${a.id}`} className='association-item'><span>{a.label}</span><strong>{a.name}</strong><button onClick={() => toggleAssociation(a.key, a.id)}>Desassociar</button></div>) : <p className='empty-state'>Nenhuma associação ainda. Abra uma entidade pelo botão de edição abaixo.</p>}</div></> : <div className='empty-state'><div className='empty-icon'>🔗</div><h3>Selecione uma tag</h3><p>Veja o histórico, as conexões e os itens relacionados.</p></div>}</div>
    </div>
  </section>;
}
