import React from 'react';

const MODULES = [
  ['tasks','Tarefas','✅'],['calendar','Calendário','📅'],['estudos','Estudos','📚'],['goals','Objetivos','🎯'],['habits','Hábitos','🔥'],['projects','Projetos','📁'],['collections','Coleções','🖼️'],['reports','Relatórios','📊'],['finance','Finanças','💵'],['investments','Investimentos','📈'],['assistant','Assistente','🤖'],['gamification','Gamificação','🏆'],
];
export default function Personalization({ data, save }) {
  const modules = data?.settings?.modules || {};
  const moduleReferences = data?.settings?.moduleReferences || {};

  const setModule = (key, value) => save({
    ...data,
    settings: {
      ...(data.settings || {}),
      modules: { ...modules, [key]: value },
      moduleReferences: { ...moduleReferences, [key]: value ? (moduleReferences[key] !== false) : false },
    },
  });

  const setReferences = (key, value) => save({
    ...data,
    settings: {
      ...(data.settings || {}),
      modules: { ...modules },
      moduleReferences: { ...moduleReferences, [key]: value },
    },
  });
  const webResearch = Boolean(data?.settings?.assistant?.webResearch);
  return <section className='central-page'><div className='page-hero'><div><span className='eyebrow'>CONFIGURAÇÃO</span><h2>⚙️ Personalização</h2><p>Ative somente o que faz parte da sua rotina. O restante pode ser ocultado das referências e análises.</p></div></div><div className='card'><h3>Módulos utilizados</h3><div className='module-grid'>{MODULES.map(([id,label,icon])=>{
          const enabled = modules[id] !== false;
          const references = enabled && moduleReferences[id] !== false;
          return (
            <div key={id} className={`module-setting ${enabled ? 'enabled' : 'disabled'}`}>
              <div className='module-setting-main'>
                <span className='module-setting-icon'>{icon}</span>
                <div><strong>{label}</strong><small>{enabled ? 'Módulo ativo' : 'Módulo desativado'}</small></div>
              </div>
              <div className='module-setting-actions'>
                <button type='button' className={`module-toggle ${enabled ? 'enabled' : ''}`} onClick={()=>setModule(id, !enabled)} aria-pressed={enabled}>
                  <span>{enabled ? '●' : '○'}</span>
                  <div><strong>{enabled ? 'Usar módulo' : 'Módulo oculto'}</strong><small>{enabled ? 'A página fica disponível' : 'Não aparece no menu'}</small></div>
                </button>
                <button type='button' className={`module-toggle module-reference-toggle ${references ? 'enabled' : ''}`} onClick={()=>enabled && setReferences(id, !references)} disabled={!enabled} aria-pressed={references}>
                  <span>{references ? '◉' : '○'}</span>
                  <div><strong>Referências em outras páginas</strong><small>{enabled ? (references ? 'Pode aparecer no painel, relatórios e sugestões' : 'Fica isolado de outras páginas') : 'Ative o módulo primeiro'}</small></div>
                </button>
              </div>
            </div>
          );
        })}</div></div><div className='card'><h3>Assistente</h3><label className='switch-row'><span><strong>Pesquisa na Web</strong><small>Permite combinar informações externas com os dados necessários da conta.</small></span><input type='checkbox' checked={webResearch} onChange={e=>save({ ...data, settings: { ...(data.settings||{}), assistant: { ...(data.settings?.assistant||{}), webResearch: e.target.checked } } })}/></label><p className='muted'>A pesquisa externa fica desativada por padrão. Quando ativada, o Assistente deve usar somente o contexto necessário para responder.</p></div></section>;
}
