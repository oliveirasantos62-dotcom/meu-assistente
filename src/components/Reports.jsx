import React, { useMemo, useState } from 'react';
import { buildAnalytics, rangeDates, toDateKey } from '../utils/analytics';

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

export default function Reports({ data }) {
  const defaultStart = rangeDates(30)[0];
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(toDateKey(new Date()));
  const [tagId, setTagId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [type, setType] = useState('all');
  const report = useMemo(() => buildAnalytics(data, { start, end, tagId, areaId, type }), [data, start, end, tagId, areaId, type]);
  const days = Object.entries(report.daily);
  const max = Math.max(1, ...days.map(([,v])=>v));

  function printPdf() {
    const rows = days.map(([date, minutes]) => `<tr><td>${escapeHtml(date)}</td><td>${minutes} min</td></tr>`).join('');
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(`<html><head><title>Relatório - Meu Assistente</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#172033}h1{margin-bottom:4px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.k{padding:16px;border:1px solid #ddd;border-radius:12px}.chart{height:180px;display:flex;align-items:flex-end;gap:5px;border-bottom:1px solid #ddd;padding-top:20px}.bar{flex:1;background:#6366f1;min-width:4px}.insight{padding:10px 0;border-bottom:1px solid #eee}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}@media print{button{display:none}}</style></head><body><h1>Relatório de gestão pessoal</h1><p class='muted'>${escapeHtml(start)} → ${escapeHtml(end)}</p><div class='grid'><div class='k'><b>Tempo estudado</b><h2>${report.studyMinutes} min</h2></div><div class='k'><b>Tarefas concluídas</b><h2>${report.completed}</h2></div><div class='k'><b>Conclusão</b><h2>${report.completionRate}%</h2></div><div class='k'><b>Dias ativos</b><h2>${report.activeDays}</h2></div></div><h2>Evolução diária</h2><div class='chart'>${days.map(([d,v])=>`<div class='bar' title='${d}: ${v} min' style='height:${Math.max(4,Math.round((v/max)*160))}px'></div>`).join('')}</div><h2>Conclusões</h2>${report.insights.map(i=>`<div class='insight'>${escapeHtml(i)}</div>`).join('')}<h2>Dados</h2><table><thead><tr><th>Data</th><th>Estudo</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  }

  return <section className='central-page'><div className='page-hero'><div><span className='eyebrow'>CIÊNCIA DE DADOS</span><h2>📊 Relatórios</h2><p>Filtre dados reais e transforme registros em decisões. O relatório compara períodos e evita sugestões genéricas.</p></div><button className='primary-button' onClick={printPdf}>🖨 Exportar / Salvar PDF</button></div><div className='card'><div className='filters-grid'><label>Início<input type='date' value={start} onChange={e=>setStart(e.target.value)}/></label><label>Fim<input type='date' value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Área<select value={areaId} onChange={e=>setAreaId(e.target.value)}><option value=''>Todas</option>{(data.areas||[]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Tag<select value={tagId} onChange={e=>setTagId(e.target.value)}><option value=''>Todas</option>{(data.tags||[]).map(t=><option key={t.id} value={t.id}>#{t.name}</option>)}</select></label><label>Tipo<select value={type} onChange={e=>setType(e.target.value)}><option value='all'>Tudo</option><option value='study'>Estudos</option><option value='task'>Tarefas</option><option value='habit'>Hábitos</option></select></label></div></div><div className='stats-row report-stats'><div><small>Tempo total</small><strong>{report.studyMinutes} min</strong></div><div><small>Tarefas concluídas</small><strong>{report.completed}</strong></div><div><small>Taxa de conclusão</small><strong>{report.completionRate}%</strong></div><div><small>Dias ativos</small><strong>{report.activeDays}</strong></div></div><div className='central-grid two'><div className='card'><h3>Evolução do tempo</h3><div className='report-bars'>{days.map(([date,value])=><div className='report-bar-col' key={date}><span>{value}</span><div className='report-bar' style={{height:`${Math.max(5,(value/max)*180)}px`}}/><small>{date.slice(5)}</small></div>)}</div></div><div className='card'><h3>Conclusões e sugestões</h3>{report.insights.map((i,index)=><div className='insight-box' key={index}>💡 {i}</div>)}{report.studyChange !== null && <p className='muted'>Comparação com o período imediatamente anterior: <b>{report.studyChange > 0 ? '+' : ''}{report.studyChange}%</b> de tempo estudado.</p>}</div></div></section>;
}
