import React, { useState } from 'react';

const DEFAULT_REWARDS = [
  { id: 1, name: '☕ Café Especial', price: 100 },
  { id: 2, name: '🎮 1h de Jogo / Lazer', price: 150 },
  { id: 3, name: '🎬 Assistir a um Filme/Série', price: 200 },
];

export default function Shop({ data = {}, save }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [message, setMessage] = useState('');

  const rewards = Array.isArray(data.rewards) ? data.rewards : DEFAULT_REWARDS;
  const coins = Number(data.coins || 0);

  const showNotification = (msg) => {
    setMessage(msg);
  };

  const persist = (updatedData, successMessage) => {
    if (typeof save !== 'function') {
      showNotification('⚠️ Não foi possível salvar: a função save não foi fornecida.');
      return false;
    }
    save(updatedData);
    showNotification(successMessage);
    return true;
  };

  const handleRedeem = (reward) => {
    if (coins < reward.price) {
      showNotification(`❌ Moedas insuficientes! Precisa de mais ${reward.price - coins} moedas.`);
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const historyToday = data.history?.[todayKey] || {};

    persist({
      ...data,
      coins: coins - reward.price,
      history: {
        ...(data.history || {}),
        [todayKey]: {
          ...historyToday,
          spent: (historyToday.spent || 0) + reward.price,
        },
      },
    }, `🎉 Recompensa "${reward.name}" resgatada! −${reward.price} 🪙`);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || !price || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showNotification('Informe um nome e um preço maior que zero.');
      return;
    }

    const newReward = { id: Date.now(), name: name.trim(), price: parsedPrice };
    if (persist({ ...data, rewards: [...rewards, newReward] }, '✅ Nova recompensa adicionada à loja!')) {
      setName('');
      setPrice('');
    }
  };

  const handleDelete = (id) => {
    persist({ ...data, rewards: rewards.filter((reward) => reward.id !== id) }, '🗑️ Recompensa removida.');
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (reward) => {
    setEditingId(reward.id);
    setEditName(reward.name);
    setEditPrice(String(reward.price));
    setMessage('');
  };

  const handleSaveEdit = (id) => {
    const parsedPrice = Number(editPrice);
    if (!editName.trim() || !editPrice || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showNotification('Informe um nome e um preço maior que zero.');
      return;
    }

    const updatedRewards = rewards.map((reward) =>
      reward.id === id ? { ...reward, name: editName.trim(), price: parsedPrice } : reward
    );

    if (persist({ ...data, rewards: updatedRewards }, '✏️ Recompensa atualizada com sucesso!')) {
      setEditingId(null);
    }
  };

  return (
    <div className="card">
      {message && <div className="shop-notification" role="status">{message}</div>}

      <div className="focus" style={{ marginBottom: 18 }}>
        <strong>➕ Adicionar nova recompensa</strong>
        <form onSubmit={handleAdd} className="shop-form">
          <input
            placeholder="Nome da recompensa (ex.: Sobremesa)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Preço (🪙)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <button type="submit" className="primary">Criar</button>
        </form>
      </div>

      <div>
        <h3>📋 Recompensas disponíveis</h3>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {rewards.map((reward) => (
            <div key={reward.id} className="task" style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: 'var(--site-background, var(--surface, #f8f8fc))',
              borderRadius: 12,
            }}>
              {editingId === reward.id ? (
                <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ margin: 0, flex: '2 1 180px' }}
                    maxLength={100}
                    aria-label="Nome da recompensa"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{ margin: 0, flex: '1 1 100px' }}
                    aria-label="Preço da recompensa"
                  />
                  <button type="button" className="primary" onClick={() => handleSaveEdit(reward.id)}>Salvar</button>
                  <button type="button" className="ghost" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              ) : (
                <>
                  <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <strong>{reward.name}</strong>
                    <span className="tag" style={{ marginLeft: 10 }}>{reward.price} 🪙</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => handleRedeem(reward)}
                      disabled={coins < reward.price}
                      title={coins < reward.price ? 'Você não tem moedas suficientes' : 'Resgatar recompensa'}
                    >Resgatar</button>
                    <button type="button" className="ghost" onClick={() => startEdit(reward)} aria-label={`Editar ${reward.name}`}>✏️</button>
                    <button type="button" className="ghost" onClick={() => handleDelete(reward.id)} aria-label={`Excluir ${reward.name}`}>×</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {rewards.length === 0 && <p className="subtitle">Nenhuma recompensa cadastrada na loja.</p>}
        </div>
      </div>
    </div>
  );
}
