import React, { useMemo, useState } from 'react';

const uid = () => `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function TagPicker({ data, save, value = [], onChange, label = '🏷 Tags', compact = false }) {
  const tags = Array.isArray(data?.tags) ? data.tags : [];
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const selected = Array.isArray(value) ? value.map(String) : [];

  const visibleTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tags.filter((tag) => !q || String(tag.name || '').toLowerCase().includes(q));
  }, [tags, search]);

  const toggle = (id) => {
    const key = String(id);
    onChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key]);
  };

  const createTag = () => {
    const clean = newName.trim().replace(/^#/, '');
    if (!clean) return;
    const existing = tags.find((tag) => String(tag.name || '').trim().toLowerCase() === clean.toLowerCase());
    if (existing) {
      if (!selected.includes(String(existing.id))) onChange([...selected, String(existing.id)]);
      setNewName('');
      return;
    }
    const tag = { id: uid(), name: clean, color: '#6366f1', createdAt: new Date().toISOString() };
    save({ ...data, tags: [...tags, tag] });
    onChange([...selected, String(tag.id)]);
    setNewName('');
  };

  return (
    <div className={`tag-picker ${compact ? 'tag-picker-compact' : ''}`}>
      <div className='tag-picker-head'>
        <strong>{label}</strong>
        <span>{selected.length} selecionada{selected.length === 1 ? '' : 's'}</span>
      </div>
      <div className='tag-picker-create'>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createTag(); } }} placeholder='#Concurso, #React...' />
        <button type='button' className='ghost' onClick={createTag}>＋ Criar</button>
      </div>
      {tags.length > 6 && <input className='tag-picker-search' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Filtrar tags...' />}
      <div className='tag-picker-list'>
        {visibleTags.map((tag) => {
          const active = selected.includes(String(tag.id));
          return (
            <button type='button' key={tag.id} className={`tag-picker-chip ${active ? 'active' : ''}`} onClick={() => toggle(tag.id)}>
              <span className='tag-picker-dot' style={{ background: tag.color || '#6366f1' }} />
              #{tag.name}
              {active && <span aria-hidden='true'>✓</span>}
            </button>
          );
        })}
        {!visibleTags.length && <span className='tag-picker-empty'>Nenhuma tag criada ainda. Digite acima para criar.</span>}
      </div>
    </div>
  );
}
