import React from 'react';

const MODULES = [
  ['tasks','Tarefas','✅'],['calendar','Calendário','📅'],['estudos','Estudos','📚'],['goals','Objetivos','🎯'],['habits','Hábitos','🔥'],['projects','Projetos','📁'],['collections','Coleções','🖼️'],['reports','Relatórios','📊'],['finance','Finanças','💵'],['investments','Investimentos','📈'],['assistant','Assistente','🤖'],['gamification','Gamificação','🏆'],
];
export default function Personalization({ data, save }) {
  const modules = data?.settings?.modules || {};
  const setModule = (key, value) => save({ ...data, settings: { ...(data.settings||{}), modules: { ...modules, [key]: value } } });
  const webResearch = Boolean(data?.settings?.assistant?.webResearch);
  return <section className='central-page'><div className='page-hero'><div><span className='eyebrow'>CONFIGURAÇÃO</span><h2>⚙️ Personalização</h2><p>Ative somente o que faz parte da sua rotina. O restante pode ser ocultado das referências e análises.</p></div></div><div className='card'><h3>Módulos utilizados</h3><div className='module-grid'>{MODULES.map(([id,label,icon])=><button key={id} className={`module-toggle ${modules[id] !== false ? 'enabled':''}`} onClick={()=>setModule(id, modules[id] === false)}><span>{icon}</span><div><strong>{label}</strong><small>{modules[id] === false ? 'Desativado' : 'Ativo'}</small></div><b>{modules[id] === false ? '○' : '●'}</b></button>)}</div></div><div className='card'><h3>Assistente</h3><label className='switch-row'><span><strong>Pesquisa na Web</strong><small>Permite combinar informações externas com os dados necessários da conta.</small></span><input type='checkbox' checked={webResearch} onChange={e=>save({ ...data, settings: { ...(data.settings||{}), assistant: { ...(data.settings?.assistant||{}), webResearch: e.target.checked } } })}/></label><p className='muted'>A pesquisa externa fica desativada por padrão. Quando ativada, o Assistente deve usar somente o contexto necessário para responder.</p></div></section>;
}
