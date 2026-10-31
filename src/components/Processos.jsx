import React, { useEffect, useMemo, useRef, useState } from 'react';

const makeId = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function createProcess(title = 'Meu processo') {
  return {
    id: makeId(),
    title,
    description: '',
    updatedAt: new Date().toISOString(),
    elements: [],
    connections: [],
  };
}

function createElement(type, x, y) {
  const defaults = {
    rect: { label: 'Nova etapa', width: 170, height: 76, fill: '#eef2ff', stroke: '#6366f1' },
    ellipse: { label: 'Início / Fim', width: 150, height: 76, fill: '#dcfce7', stroke: '#16a34a' },
    diamond: { label: 'Decisão?', width: 160, height: 100, fill: '#fef3c7', stroke: '#d97706' },
    text: { label: 'Digite seu texto', width: 190, height: 48, fill: 'transparent', stroke: 'transparent' },
  };
  return { id: makeId(), type, x, y, ...defaults[type] };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default function Processos({ data, save }) {
  const processes = Array.isArray(data?.processes) ? data.processes : [];
  const [activeId, setActiveId] = useState(processes[0]?.id || null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [connectionStart, setConnectionStart] = useState(null);
  const [draft, setDraft] = useState(null);
  const [titleDraft, setTitleDraft] = useState(null);
  const [saveState, setSaveState] = useState('saved');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const activeProcess = processes.find((item) => item.id === activeId) || null;
  const selectedElement = activeProcess?.elements?.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    function handleShortcuts(event) {
      const target = event.target;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (typing) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedConnectionId) {
          event.preventDefault();
          deleteSelectedConnection();
        } else if (selectedId) {
          event.preventDefault();
          deleteSelected();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [selectedId, selectedConnectionId, activeProcess, undoStack, redoStack]);

  useEffect(() => {
    setTitleDraft(null);
  }, [activeId]);

  useEffect(() => {
    if (!activeId && processes.length) setActiveId(processes[0].id);
    if (activeId && !processes.some((item) => item.id === activeId)) {
      setActiveId(processes[0]?.id || null);
      setSelectedId(null);
    }
  }, [processes, activeId]);

  function persist(nextProcesses) {
    setSaveState('saving');
    save({ ...data, processes: nextProcesses });
    setSaveState('saved');
  }

  function commitProcess(nextProcess, remember = true) {
    if (!nextProcess) return;
    const previous = activeProcess ? clone(activeProcess) : null;
    const next = { ...nextProcess, updatedAt: new Date().toISOString() };
    const nextProcesses = processes.some((item) => item.id === next.id)
      ? processes.map((item) => item.id === next.id ? next : item)
      : [...processes, next];
    if (remember && previous) {
      setUndoStack((stack) => [...stack.slice(-39), previous]);
      setRedoStack([]);
    }
    persist(nextProcesses);
  }

  function createNewProcess() {
    const item = createProcess(`Processo ${processes.length + 1}`);
    persist([...processes, item]);
    setActiveId(item.id);
    setSelectedId(null);
    setSelectedConnectionId(null);
    setUndoStack([]);
    setRedoStack([]);
    setTool('select');
  }

  function createTemplate(kind) {
    const item = createProcess(kind === 'mind' ? 'Novo mapa mental' : 'Novo fluxograma');
    if (kind === 'mind') {
      const rootNode = { ...createElement('ellipse', 500, 290), label: 'Tema central', width: 190, height: 90, fill: '#e0e7ff' };
      const branches = [
        { ...createElement('rect', 180, 120), label: 'Ideia principal 1' },
        { ...createElement('rect', 820, 120), label: 'Ideia principal 2' },
        { ...createElement('rect', 180, 470), label: 'Ideia principal 3' },
        { ...createElement('rect', 820, 470), label: 'Ideia principal 4' },
      ];
      item.elements = [rootNode, ...branches];
      item.connections = branches.map((node) => ({ id: makeId(), from: rootNode.id, to: node.id }));
    } else {
      const start = { ...createElement('ellipse', 500, 60), label: 'Início' };
      const step = { ...createElement('rect', 490, 200), label: 'Etapa 1' };
      const decision = { ...createElement('diamond', 495, 340), label: 'Decisão?' };
      const end = { ...createElement('ellipse', 500, 535), label: 'Fim' };
      item.elements = [start, step, decision, end];
      item.connections = [
        { id: makeId(), from: start.id, to: step.id },
        { id: makeId(), from: step.id, to: decision.id },
        { id: makeId(), from: decision.id, to: end.id },
      ];
    }
    persist([...processes, item]);
    setActiveId(item.id);
    setSelectedId(null);
    setSelectedConnectionId(null);
    setTool('select');
    setUndoStack([]);
    setRedoStack([]);
  }

  function updateElement(id, patch) {
    if (!activeProcess) return;
    commitProcess({
      ...activeProcess,
      elements: activeProcess.elements.map((item) => item.id === id ? { ...item, ...patch } : item),
    });
  }

  function addElement(type, x = 470, y = 280) {
    if (!activeProcess) {
      const item = createProcess();
      const element = createElement(type, x, y);
      item.elements.push(element);
      persist([...processes, item]);
      setActiveId(item.id);
      setSelectedId(element.id);
      setSelectedConnectionId(null);
    } else {
      const element = createElement(type, x, y);
      commitProcess({ ...activeProcess, elements: [...activeProcess.elements, element] });
      setSelectedId(element.id);
      setSelectedConnectionId(null);
    }
    setTool('select');
  }

  function handleCanvasClick(event) {
    if (!event.target.classList.contains('process-canvas-background') || !['rect', 'ellipse', 'diamond', 'text'].includes(tool)) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * (1200 / zoom);
    const y = ((event.clientY - rect.top) / rect.height) * (720 / zoom);
    addElement(tool, Math.max(20, x - 80), Math.max(20, y - 38));
  }

  function handleNodeClick(event, element) {
    event.stopPropagation();
    setSelectedConnectionId(null);
    if (tool === 'connect') {
      if (!connectionStart) {
        setConnectionStart(element.id);
        setSelectedId(element.id);
      } else if (connectionStart !== element.id && activeProcess) {
        const exists = activeProcess.connections.some((edge) =>
          (edge.from === connectionStart && edge.to === element.id) ||
          (edge.to === connectionStart && edge.from === element.id));
        if (!exists) {
          commitProcess({
            ...activeProcess,
            connections: [...activeProcess.connections, { id: makeId(), from: connectionStart, to: element.id }],
          });
        }
        setConnectionStart(null);
        setTool('select');
      }
      return;
    }
    setSelectedId(element.id);
  }

  function handleNodePointerDown(event, element) {
    if (tool !== 'select') return;
    event.stopPropagation();
    setSelectedId(element.id);
    setSelectedConnectionId(null);
    const rect = svgRef.current.getBoundingClientRect();
    dragRef.current = {
      id: element.id,
      startX: ((event.clientX - rect.left) / rect.width) * (1200 / zoom),
      startY: ((event.clientY - rect.top) / rect.height) * (720 / zoom),
      originalX: element.x,
      originalY: element.y,
    };
  }

  function handleCanvasPointerMove(event) {
    if (!dragRef.current || !activeProcess) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * (1200 / zoom);
    const y = ((event.clientY - rect.top) / rect.height) * (720 / zoom);
    const drag = dragRef.current;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    setDraft({
      id: drag.id,
      x: Math.max(0, drag.originalX + dx),
      y: Math.max(0, drag.originalY + dy),
    });
  }

  function handleCanvasPointerUp() {
    if (dragRef.current && draft && activeProcess) {
      commitProcess({
        ...activeProcess,
        elements: activeProcess.elements.map((item) =>
          item.id === draft.id ? { ...item, x: draft.x, y: draft.y } : item),
      });
    }
    dragRef.current = null;
    setDraft(null);
  }

  function deleteSelected() {
    if (!activeProcess || !selectedId) return;
    commitProcess({
      ...activeProcess,
      elements: activeProcess.elements.filter((item) => item.id !== selectedId),
      connections: activeProcess.connections.filter((edge) => edge.from !== selectedId && edge.to !== selectedId),
    });
    setSelectedId(null);
    setSelectedConnectionId(null);
  }

  function deleteSelectedConnection() {
    if (!activeProcess || !selectedConnectionId) return;
    commitProcess({
      ...activeProcess,
      connections: activeProcess.connections.filter((edge) => edge.id !== selectedConnectionId),
    });
    setSelectedConnectionId(null);
  }


  function undo() {
    if (!activeProcess || !undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, clone(activeProcess)]);
    commitProcess(previous, false);
  }

  function redo() {
    if (!activeProcess || !redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, clone(activeProcess)]);
    commitProcess(next, false);
  }

  function removeProcess() {
    if (!activeProcess || !window.confirm(`Excluir "${activeProcess.title}"?`)) return;
    const remaining = processes.filter((item) => item.id !== activeId);
    persist(remaining);
    setActiveId(remaining[0]?.id || null);
    setSelectedId(null);
  }

  function exportSvg() {
    if (!svgRef.current || !activeProcess) return;
    const source = svgRef.current.cloneNode(true);
    source.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    source.setAttribute('width', '1200');
    source.setAttribute('height', '720');
    const xml = new XMLSerializer().serializeToString(source);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProcess.title.trim().replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'processo'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const elementMap = useMemo(
    () => new Map((activeProcess?.elements || []).map((item) => [item.id, item])),
    [activeProcess],
  );

  function center(item) {
    return { x: item.x + item.width / 2, y: item.y + item.height / 2 };
  }

  const selectedToolLabel = tool === 'connect'
    ? 'Conectar: selecione o primeiro e o segundo elemento'
    : tool === 'select' ? 'Selecione e arraste os elementos'
      : `Clique na tela para adicionar: ${tool === 'rect' ? 'etapa' : tool === 'ellipse' ? 'início/fim' : tool === 'diamond' ? 'decisão' : 'texto'}`;

  return (
    <section className="process-page">
      <div className="process-heading">
        <div>
          <span className="process-eyebrow">ÁREA DE CRIAÇÃO</span>
          <h1>Processos</h1>
          <p>Desenhe mapas mentais, fluxogramas e diagramas em uma tela livre.</p>
        </div>
        <div className="process-heading-actions">
          <button className="ghost" type="button" onClick={() => createTemplate('mind')}>＋ Mapa mental</button>
          <button className="ghost" type="button" onClick={() => createTemplate('flow')}>＋ Fluxograma</button>
          <button className="primary process-new-button" type="button" onClick={createNewProcess}>＋ Em branco</button>
        </div>
      </div>

      <div className="process-workspace">
        <aside className="process-library">
          <div className="process-panel-title"><span>Meus processos</span><span>{processes.length}</span></div>
          <div className="process-document-list">
            {processes.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`process-document ${item.id === activeId ? 'active' : ''}`}
                onClick={() => { setActiveId(item.id); setSelectedId(null); setTool('select'); setUndoStack([]); setRedoStack([]); }}
              >
                <span className="process-document-icon">▤</span>
                <span className="process-document-text"><strong>{item.title || 'Sem título'}</strong><small>{item.elements?.length || 0} elementos</small></span>
              </button>
            ))}
            {!processes.length && <p className="process-empty-small">Seus desenhos aparecerão aqui.</p>}
          </div>
          <div className="process-library-bottom">
            <span className="process-save-indicator"><i className={saveState === 'saving' ? 'is-saving' : ''} />{saveState === 'saving' ? 'Salvando...' : 'Salvo no assistente'}</span>
          </div>
        </aside>

        <div className="process-editor">
          <div className="process-editor-top">
            <div className="process-title-area">
              <input
                aria-label="Nome do processo"
                value={activeProcess ? (titleDraft ?? activeProcess.title ?? '') : ''}
                disabled={!activeProcess}
                placeholder="Nome do processo"
                onChange={(event) => {
                  if (!activeProcess) return;
                  setTitleDraft(event.target.value);
                }}
                onBlur={(event) => {
                  if (activeProcess && titleDraft !== null) {
                    commitProcess({ ...activeProcess, title: event.target.value }, false);
                    setTitleDraft(null);
                  }
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              />
              <small>{activeProcess ? `${activeProcess.elements.length} elementos • atualizado agora` : 'Crie um processo para começar'}</small>
            </div>
            <div className="process-top-actions">
              <button type="button" className="ghost" onClick={undo} disabled={!undoStack.length} title="Desfazer">↶</button>
              <button type="button" className="ghost" onClick={redo} disabled={!redoStack.length} title="Refazer">↷</button>
              <button type="button" className="ghost" onClick={() => setZoom((v) => Math.max(.5, +(v - .1).toFixed(2)))} title="Diminuir zoom">−</button>
              <span className="process-zoom">{Math.round(zoom * 100)}%</span>
              <button type="button" className="ghost" onClick={() => setZoom((v) => Math.min(1.8, +(v + .1).toFixed(2)))} title="Aumentar zoom">＋</button>
              <button type="button" className="ghost" onClick={exportSvg} disabled={!activeProcess} title="Exportar SVG">Exportar</button>
            </div>
          </div>

          <div className="process-tools">
            {[
              ['select', '↖', 'Selecionar'],
              ['rect', '▭', 'Etapa'],
              ['ellipse', '◯', 'Início/fim'],
              ['diamond', '◇', 'Decisão'],
              ['text', 'T', 'Texto'],
              ['connect', '↗', 'Conectar'],
            ].map(([id, icon, label]) => (
              <button key={id} type="button" className={`process-tool ${tool === id ? 'active' : ''}`}
                onClick={() => { setTool(id); setConnectionStart(null); }}>
                <b>{icon}</b><span>{label}</span>
              </button>
            ))}
            <span className="process-tool-hint">{selectedToolLabel}</span>
          </div>

          <div className="process-canvas-wrap">
            {activeProcess ? (
              <svg
                ref={svgRef}
                className="process-canvas"
                viewBox={`0 0 ${1200 / zoom} ${720 / zoom}`}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerUp}
                role="img"
                aria-label="Área de desenho dos processos"
              >
                <defs>
                  <pattern id="process-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="var(--process-grid-dot)" />
                  </pattern>
                  <marker id="process-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="var(--process-line)" />
                  </marker>
                </defs>
                <rect className="process-canvas-background" x="0" y="0" width="1200" height="720" fill="url(#process-grid)" onClick={handleCanvasClick} />
                {(activeProcess.connections || []).map((edge) => {
                  const from = elementMap.get(edge.from);
                  const to = elementMap.get(edge.to);
                  if (!from || !to) return null;
                  const a = center(from);
                  const b = center(to);
                  const selected = selectedConnectionId === edge.id;
                  return <path key={edge.id} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                    className={`process-connection ${selected ? 'is-selected' : ''}`}
                    markerEnd="url(#process-arrow)" role="button" tabIndex="0"
                    aria-label="Selecionar conexão"
                    onClick={(event) => { event.stopPropagation(); setSelectedId(null); setSelectedConnectionId(edge.id); setTool('select'); }} />;
                })}
                {activeProcess.elements.map((element) => {
                  const current = draft?.id === element.id ? { ...element, x: draft.x, y: draft.y } : element;
                  const selected = selectedId === element.id;
                  const common = {
                    fill: current.fill,
                    stroke: selected ? 'var(--process-selected)' : current.stroke,
                    strokeWidth: selected ? 3 : 2,
                  };
                  return (
                    <g key={element.id} className={`process-node ${tool === 'select' ? 'is-movable' : ''}`}
                      transform={`translate(${current.x} ${current.y})`}
                      onClick={(event) => handleNodeClick(event, element)}
                      onPointerDown={(event) => handleNodePointerDown(event, element)}>
                      {current.type === 'ellipse' && <ellipse cx={current.width / 2} cy={current.height / 2} rx={current.width / 2} ry={current.height / 2} {...common} />}
                      {current.type === 'diamond' && <polygon points={`${current.width / 2},0 ${current.width},${current.height / 2} ${current.width / 2},${current.height} 0,${current.height / 2}`} {...common} />}
                      {(current.type === 'rect' || current.type === 'text') && <rect width={current.width} height={current.height} rx={current.type === 'text' ? 5 : 12} {...common} />}
                      <text x={current.width / 2} y={current.height / 2} textAnchor="middle" dominantBaseline="middle"
                        className={`process-node-label ${current.type === 'text' ? 'is-text' : ''}`}
                        style={{ fill: current.textColor || (current.type === 'text' ? 'var(--process-text)' : '#243047') }}>
                        {String(current.label || '').length > 25
                          ? `${String(current.label).slice(0, 24)}…`
                          : current.label}
                      </text>
                      {selected && <rect x="-5" y="-5" width={current.width + 10} height={current.height + 10} rx="14" className="process-selection-outline" />}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="process-first-empty">
                <div className="process-empty-illustration">◇</div>
                <h2>Seu espaço de criação está pronto</h2>
                <p>Crie seu primeiro processo para começar a desenhar.</p>
                <button className="primary" type="button" onClick={createNewProcess}>Criar primeiro processo</button>
              </div>
            )}
          </div>

          <div className="process-editor-footer">
            <span>💡 Dica: escolha uma ferramenta e clique na tela para adicionar elementos.</span>
            {activeProcess && <button type="button" className="process-delete-document" onClick={removeProcess}>Excluir processo</button>}
          </div>
        </div>

        <aside className="process-properties">
          <div className="process-panel-title">Propriedades</div>
          {selectedElement ? (
            <div className="process-property-fields">
              <label>Texto do elemento<input value={selectedElement.label} onChange={(event) => {
                const value = event.target.value;
                const updated = { ...activeProcess, elements: activeProcess.elements.map((item) => item.id === selectedId ? { ...item, label: value } : item) };
                persist(processes.map((item) => item.id === activeId ? updated : item));
              }} /></label>
              <label>Cor de preenchimento<input type="color" value={selectedElement.fill === 'transparent' ? '#ffffff' : selectedElement.fill} onChange={(event) => updateElement(selectedId, { fill: event.target.value })} /></label>
              <label>Cor da borda<input type="color" value={selectedElement.stroke === 'transparent' ? '#ffffff' : selectedElement.stroke} onChange={(event) => updateElement(selectedId, { stroke: event.target.value })} /></label>
              <label>Cor das letras<input type="color" value={selectedElement.textColor || '#243047'} onChange={(event) => updateElement(selectedId, { textColor: event.target.value })} /></label>
              <label>Largura<input type="range" min="90" max="280" value={selectedElement.width} onChange={(event) => updateElement(selectedId, { width: Number(event.target.value) })} /></label>
              <label>Altura<input type="range" min="45" max="180" value={selectedElement.height} onChange={(event) => updateElement(selectedId, { height: Number(event.target.value) })} /></label>
              <button type="button" className="ghost process-remove-element" onClick={deleteSelected}>Remover elemento</button>
            </div>
          ) : selectedConnectionId ? (
            <div className="process-property-fields">
              <strong>Conexão selecionada</strong>
              <p className="process-connection-help">Esta ligação conecta dois elementos do seu processo.</p>
              <button type="button" className="ghost process-remove-element" onClick={deleteSelectedConnection}>Apagar conexão</button>
            </div>
          ) : (
            <div className="process-property-empty">
              <span>⌖</span>
              <strong>Nenhum elemento selecionado</strong>
              <p>Selecione uma forma na tela para editar texto, cores e tamanho.</p>
            </div>
          )}
          <div className="process-shape-help">
            <strong>Atalhos rápidos</strong>
            <p><kbd>Delete</kbd> remover elemento ou conexão selecionada</p>
            <p><kbd>Ctrl</kbd> + <kbd>Z</kbd> desfazer</p>
            <p><kbd>Ctrl</kbd> + <kbd>Y</kbd> refazer</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
