import React, { useEffect, useState } from 'react';

const PAGE_NAMES = { dashboard:'Painel', calendar:'Calendário', diario:'Diário', estudos:'Estudos', goals:'Objetivos', habits:'Hábitos', tasks:'Tarefas', processos:'Processos', projects:'Projetos', groups:'Grupos', profile:'Perfil', evolucao:'Evolução', collections:'Coleções', dataScience:'Ciência de dados', reports:'Relatórios', tags:'Tags', finance:'Finanças', investments:'Investimentos', gamification:'Gamificação', connections:'Conexões', foguinho:'Foguinho', assistant:'Assistente' };
const DEFAULT_STYLE = { accent:'#00f0ff', glow:0.35, grid:false, glass:0.12 };
function settingsOf(data){ return data?.settings?.cyberpunk || {}; }
function updateSettings(data, save, updater){ save({...data, settings:{...(data.settings||{}), cyberpunk:updater(settingsOf(data))}}); }

export default function FuturisticTools({ data, save, activeSection }) {
 const [customize,setCustomize]=useState(false), [placing,setPlacing]=useState(false), [editing,setEditing]=useState(null);
 const styles=settingsOf(data).pages || {}; const pageStyle={...DEFAULT_STYLE,...(styles[activeSection]||{})};
 const notes=settingsOf(data).clips || [];
 const persistStyle=(key,value)=>updateSettings(data,save,s=>({...s,pages:{...(s.pages||{}),[activeSection]:{...pageStyle,[key]:value}}}));
 const addClipAt=(x,y)=>{ const clip={id:`clip-${Date.now()}-${Math.random().toString(16).slice(2,6)}`,x:Math.max(8,Math.min(window.innerWidth-300,x)),y:Math.max(8,Math.min(window.innerHeight-180,y)),title:'Nota rápida',text:'',collapsed:false}; updateSettings(data,save,s=>({...s,clips:[...(s.clips||[]),clip]})); setEditing(clip.id); setPlacing(false); };
 useEffect(()=>{if(!placing)return;const click=e=>{if(e.target.closest('.cyber-tools,.cyber-custom-panel,.cyber-clip'))return;addClipAt(e.clientX,e.clientY);};const esc=e=>{if(e.key==='Escape')setPlacing(false)};document.addEventListener('click',click);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('click',click);document.removeEventListener('keydown',esc)};},[placing]);
 const patchClip=(id,patch)=>updateSettings(data,save,s=>({...s,clips:(s.clips||[]).map(c=>c.id===id?{...c,...patch}:c)}));
 const deleteClip=id=>updateSettings(data,save,s=>({...s,clips:(s.clips||[]).filter(c=>c.id!==id)}));
 const resetPage=()=>updateSettings(data,save,s=>({...s,pages:{...(s.pages||{}),[activeSection]:{...DEFAULT_STYLE}}}));
 return <>
  <div className={`cyber-tools ${placing?'placement-active':''}`}><button className={placing?'active':''} title={placing?'Clique na tela para posicionar a nota (Esc cancela)':'Adicionar nota rápida'} onClick={()=>setPlacing(v=>!v)}>＋ <span>{placing?'Clique onde colocar':'Clip'}</span></button><button className={customize?'active':''} title="Personalizar esta página" onClick={()=>setCustomize(v=>!v)}>◈ <span>Visual</span></button></div>
  {placing&&<div className="clip-placement-hint">✚ MODO DE POSICIONAMENTO — clique onde deseja colocar o clipe · Esc cancela</div>}
  {customize&&<aside className="cyber-custom-panel"><header><strong>Personalização · {PAGE_NAMES[activeSection]||activeSection}</strong><button onClick={()=>setCustomize(false)}>×</button></header>
   <label>Cor de destaque<input type="color" value={pageStyle.accent} onChange={e=>persistStyle('accent',e.target.value)}/></label>
   <label>Intensidade do brilho <input type="range" min="0" max="1" step="0.05" value={pageStyle.glow} onChange={e=>persistStyle('glow',Number(e.target.value))}/></label>
   <label>Transparência dos painéis <input type="range" min="0" max="0.4" step="0.02" value={pageStyle.glass} onChange={e=>persistStyle('glass',Number(e.target.value))}/></label>
   <label className="cyber-check"><input type="checkbox" checked={!!pageStyle.grid} onChange={e=>persistStyle('grid',e.target.checked)}/> Grade de fundo nesta página</label>
   <button className="cyber-reset" onClick={resetPage}>Restaurar página</button>
  </aside>}
  {notes.map(clip=><Clip key={clip.id} clip={clip} patch={patchClip} remove={deleteClip}/>)}
  <style>{`
   main.main-content{--page-accent:${pageStyle.accent};--page-glow:${pageStyle.glow};--page-glass:${pageStyle.glass};transition:background .25s,filter .25s;${pageStyle.grid?'background-image:linear-gradient(rgba(0,240,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.035) 1px,transparent 1px);background-size:28px 28px;':''}}
   main.main-content button:not(.clip-pin){border-color:color-mix(in srgb,${pageStyle.accent} calc(20% + ${pageStyle.glow*55}% ),transparent)}
   main.main-content :is(.card,.panel,.stat-card,.section-card){background-color:color-mix(in srgb,${pageStyle.accent} ${pageStyle.glass*35}%,var(--card-bg,transparent));}
  `}</style>
 </>;
}
function Clip({clip,patch,remove}){
 const [drag,setDrag]=useState(null); const [draft,setDraft]=useState({title:clip.title,text:clip.text});
 useEffect(()=>setDraft({title:clip.title,text:clip.text}),[clip.title,clip.text]);
 const start=e=>{if(e.target.closest('button,input,textarea'))return; setDrag({dx:e.clientX-clip.x,dy:e.clientY-clip.y});};
 useEffect(()=>{if(!drag)return;const move=e=>patch(clip.id,{x:Math.max(0,Math.min(window.innerWidth-50,e.clientX-drag.dx)),y:Math.max(0,Math.min(window.innerHeight-40,e.clientY-drag.dy))});const end=()=>setDrag(null);window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end)};},[drag,clip.id]);
 return <div className={`cyber-clip ${clip.collapsed?'collapsed':''}`} style={{left:clip.x,top:clip.y}} onPointerDown={start}>
  {clip.collapsed?<button className="clip-pin" onClick={()=>patch(clip.id,{collapsed:false})} title={clip.title||'Abrir nota'}>📎<span>{clip.title||'Nota'}</span></button>:<div className="clip-body"><header><span>📎 MEMO / {clip.title||'NOTA'}</span><div><button onClick={()=>patch(clip.id,{collapsed:true})} title="Minimizar">—</button><button onClick={()=>remove(clip.id)} title="Excluir">×</button></div></header><input className="clip-title" value={draft.title} onChange={e=>{setDraft(d=>({...d,title:e.target.value}));patch(clip.id,{title:e.target.value})}} placeholder="Título"/><textarea value={draft.text} onChange={e=>{setDraft(d=>({...d,text:e.target.value}));patch(clip.id,{text:e.target.value})}} placeholder="Escreva sua nota..."/><footer>Arraste pelo cabeçalho · salvamento automático</footer></div>}
 </div>;
}
