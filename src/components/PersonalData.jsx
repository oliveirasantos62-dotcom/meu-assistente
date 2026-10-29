import React from 'react';

const moods = ['Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem'];
const moodToNumber = {
  'Muito mal': 1,
  Mal: 2,
  Neutro: 3,
  Bem: 4,
  'Muito bem': 5,
};

export default function PersonalData({
  data = {},
  save,
  daily = {},
  sleepValue = 0,
  energyValue = 0,
  focusValue = 0,
  productivityScore = 0,
  bestHour = null,
  setMood,
  setDailyMetric,
}) {
  // Diário armazena humor como número de 1 a 5; este componente exibe rótulos.
  const currentMood = typeof daily.mood === 'number'
    ? moods[Math.max(1, Math.min(5, daily.mood)) - 1]
    : daily.mood || data.mood || '';

  const updateMetric = (field, value) => {
    if (setDailyMetric) {
      setDailyMetric(field, value);
      return;
    }
    if (typeof save !== 'function') return;

    const today = getLocalDate();
    save({
      ...data,
      history: {
        ...(data.history || {}),
        [today]: { ...(data.history?.[today] || {}), [field]: value },
      },
    });
  };

  const handleMood = (mood) => {
    if (setMood) {
      setMood(mood);
      return;
    }
    if (typeof save !== 'function') return;

    const today = getLocalDate();
    save({
      ...data,
      mood,
      history: {
        ...(data.history || {}),
        [today]: { ...(data.history?.[today] || {}), mood },
      },
    });
  };

  return (
    <section className="personal-data card diary-card">
      <style>{`
        .personal-data { display:grid; gap:18px; }
        .personal-data .section-title { display:flex; justify-content:space-between; gap:12px; }
        .personal-data h2 { margin:0 0 6px; }
        .personal-data .subtitle { margin:0; opacity:.72; font-size:13px; line-height:1.55; }
        .personal-data .focus { padding:15px; border-radius:14px; background:rgba(120,120,120,.07); }
        .personal-data .mood-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; margin-top:12px; }
        .personal-data button { cursor:pointer; }
        .personal-data .mood-grid button, .personal-data .rating-grid button { min-width:0; padding:9px 10px; border-radius:10px; border:1px solid var(--border-color,rgba(120,120,120,.22)); }
        .personal-data .primary { background:var(--primary-color,#6366f1); color:white; border-color:transparent; }
        .personal-data .ghost { background:transparent; color:inherit; }
        .personal-data .metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
        .personal-data .reward { display:grid; gap:5px; padding:14px; border:1px solid var(--border-color,rgba(120,120,120,.18)); border-radius:12px; }
        .personal-data .reward strong { font-size:21px; }
        .personal-data .reward small { opacity:.7; }
        .personal-data .data-control { display:grid; gap:10px; }
        .personal-data .data-control-header { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .personal-data .data-control-header span { font-size:13px; opacity:.7; }
        .personal-data input[type=range] { width:100%; accent-color:var(--primary-color,#6366f1); }
        .personal-data .range-labels { display:flex; justify-content:space-between; opacity:.6; }
        .personal-data .rating-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; }
        .personal-data .personal-summary { display:grid; gap:8px; }
        .personal-data .summary-row { display:flex; justify-content:space-between; gap:16px; padding:9px 0; border-bottom:1px solid var(--border-color,rgba(120,120,120,.15)); font-size:13px; }
        .personal-data .summary-row:last-child { border-bottom:0; }
        .personal-data .summary-row strong { text-align:right; }
        @media(max-width:700px) { .personal-data .mood-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .personal-data .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } }
      `}</style>

      <div className="section-title">
        <div>
          <h2>🧠 Dados pessoais</h2>
          <p className="subtitle">Registre como você está para descobrir padrões de produtividade.</p>
        </div>
      </div>

      <div className="focus">
        <strong>😊 Como você está hoje?</strong>
        <div className="mood-grid">
          {moods.map((mood) => (
            <button key={mood} type="button" className={currentMood === mood ? 'primary' : 'ghost'} onClick={() => handleMood(mood)}>
              {getMoodEmoji(mood)} {mood}
            </button>
          ))}
        </div>
      </div>

      <div className="metrics personal-metrics">
        <div className="reward"><strong>{sleepValue || '—'}</strong><small>😴 horas de sono</small></div>
        <div className="reward"><strong>{energyValue || '—'}</strong><small>⚡ energia / 5</small></div>
        <div className="reward"><strong>{focusValue || '—'}</strong><small>🎯 foco / 5</small></div>
        <div className="reward"><strong>{productivityScore || 0}</strong><small>📈 produtividade</small></div>
      </div>

      <div className="data-control">
        <div className="data-control-header"><strong>😴 Sono</strong><span>{sleepValue ? `${sleepValue}h` : 'Não registrado'}</span></div>
        <input aria-label="Horas de sono" type="range" min="0" max="12" step="0.5" value={Number(sleepValue) || 0} onChange={(event) => updateMetric('sleep', Number(event.target.value))} />
        <div className="range-labels"><small>0h</small><small>6h</small><small>12h</small></div>
      </div>

      <div className="data-control">
        <div className="data-control-header"><strong>⚡ Energia</strong><span>{energyValue ? `${energyValue}/5` : 'Não registrada'}</span></div>
        <div className="rating-grid">{[1,2,3,4,5].map((value) => <button key={value} type="button" className={Number(energyValue) === value ? 'primary' : 'ghost'} onClick={() => updateMetric('energy', value)}>{value}</button>)}</div>
      </div>

      <div className="data-control">
        <div className="data-control-header"><strong>🎯 Foco</strong><span>{focusValue ? `${focusValue}/5` : 'Não registrado'}</span></div>
        <div className="rating-grid">{[1,2,3,4,5].map((value) => <button key={value} type="button" className={Number(focusValue) === value ? 'primary' : 'ghost'} onClick={() => updateMetric('focus', value)}>{value}</button>)}</div>
      </div>

      <div className="personal-summary">
        <div className="focus">
          <strong>📊 Resumo do dia</strong>
          <div className="summary-row"><span>Humor</span><strong>{currentMood ? `${getMoodEmoji(currentMood)} ${currentMood}` : 'Não registrado'}</strong></div>
          <div className="summary-row"><span>Sono</span><strong>{sleepValue ? `${sleepValue} horas` : 'Não registrado'}</strong></div>
          <div className="summary-row"><span>Energia</span><strong>{energyValue ? `${energyValue}/5` : 'Não registrada'}</strong></div>
          <div className="summary-row"><span>Foco</span><strong>{focusValue ? `${focusValue}/5` : 'Não registrado'}</strong></div>
          <div className="summary-row"><span>Produtividade</span><strong>{productivityScore || 0}/100</strong></div>
          <div className="summary-row"><span>Melhor horário</span><strong>{bestHour ? `${String(bestHour[0]).padStart(2,'0')}:00` : 'Coletando dados'}</strong></div>
        </div>
      </div>

      <div className="focus">
        <strong>🔎 Interpretação</strong>
        <p className="subtitle">{getInterpretation({ currentMood, sleepValue, energyValue, focusValue, productivityScore })}</p>
      </div>
    </section>
  );
}

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getMoodEmoji(mood) {
  const emojis = { 'Muito mal':'😞', Mal:'😕', Neutro:'😐', Bem:'🙂', 'Muito bem':'😄' };
  return emojis[mood] || '😐';
}

function getInterpretation({ currentMood, sleepValue, energyValue, focusValue, productivityScore }) {
  if (!currentMood && !sleepValue && !energyValue && !focusValue) {
    return 'Registre seus dados ao longo dos dias. Com o tempo, o sistema poderá identificar relações entre sono, humor, energia, foco e produtividade.';
  }
  const observations = [];
  if (sleepValue > 0) {
    if (sleepValue < 6) observations.push('Seu sono está abaixo de 6 horas; isso pode prejudicar sua energia e foco.');
    else if (sleepValue >= 7) observations.push('Seu tempo de sono está em uma faixa favorável para acompanhar sua produtividade.');
  }
  if (energyValue > 0) {
    if (energyValue <= 2) observations.push('Sua energia está baixa. Considere reduzir a quantidade de tarefas.');
    else if (energyValue >= 4) observations.push('Sua energia está alta. Pode ser um bom momento para tarefas importantes.');
  }
  if (focusValue > 0) {
    if (focusValue <= 2) observations.push('Seu foco está baixo. Tente trabalhar com blocos menores e menos distrações.');
    else if (focusValue >= 4) observations.push('Seu foco está bom. Aproveite para realizar uma tarefa de maior dificuldade.');
  }
  if (productivityScore >= 70) observations.push('Sua produtividade registrada hoje está alta.');
  else if (productivityScore > 0 && productivityScore < 40) observations.push('Sua produtividade registrada está baixa; priorize poucas tarefas importantes.');
  return observations.length ? observations.join(' ') : 'Continue registrando seus dados. Ainda precisamos de mais informações para identificar padrões confiáveis.';
}
