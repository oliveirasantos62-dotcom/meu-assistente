import { useMemo, useState } from 'react';
import TagPicker from './TagPicker';

const novaCategoria = {
  nome: '',
  descricao: '',
  icone: '✦',
  cor: '#7868e6',
  controlarStatus: true,
  avaliar: false,
  usarImagem: true,
  usarDescricao: true,
  usarData: true,
  tags: [],
};

const novoItem = {
  titulo: '',
  descricao: '',
  imagem: '',
  data: '',
  status: 'a-fazer',
  avaliacao: '',
  tags: [],
};

function idNovo() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ColecoesConquistas({ data, save }) {
  // Os dados vêm do armazenamento principal do aplicativo.
  const categorias = Array.isArray(data?.collections) ? data.collections : [];

  // Atualiza as coleções sem criar outro armazenamento.
  function atualizarColecoes(novasColecoes) {
    const resultado =
      typeof novasColecoes === 'function'
        ? novasColecoes(categorias)
        : novasColecoes;

    save({
      ...data,
      collections: resultado,
    });
  }

  const [categoriaAtual, setCategoriaAtual] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');

  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalItem, setModalItem] = useState(false);

  const [idEditandoCategoria, setIdEditandoCategoria] = useState(null);
  const [idEditandoItem, setIdEditandoItem] = useState(null);

  const [formCategoria, setFormCategoria] = useState({ ...novaCategoria });
  const [formItem, setFormItem] = useState({ ...novoItem });

  const categoria = categorias.find((c) => c.id === categoriaAtual);

  const itens = Array.isArray(categoria?.itens) ? categoria.itens : [];

  const feitos = itens.filter((i) => i.status === 'feito').length;
  const pendentes = itens.length - feitos;

  const progresso = itens.length
    ? Math.round((feitos / itens.length) * 100)
    : 0;

  const itensVisiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    return itens.filter((item) => {
      const correspondeFiltro =
        filtro === 'todos' ||
        (filtro === 'feitos' && item.status === 'feito') ||
        (filtro === 'a-fazer' && item.status === 'a-fazer');

      const correspondeBusca = `${item.titulo || ''} ${item.descricao || ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(termo);

      return correspondeFiltro && correspondeBusca;
    });
  }, [itens, filtro, busca]);

  function abrirNovaCategoria() {
    setIdEditandoCategoria(null);
    setFormCategoria({ ...novaCategoria });
    setModalCategoria(true);
  }

  function editarCategoria(c) {
    setIdEditandoCategoria(c.id);

    setFormCategoria({
      ...novaCategoria,
      ...c,
    });

    setModalCategoria(true);
  }

  function salvarCategoria(event) {
    event.preventDefault();

    const nome = formCategoria.nome.trim();

    if (!nome) return;

    if (idEditandoCategoria) {
      atualizarColecoes((lista) =>
        lista.map((c) =>
          c.id === idEditandoCategoria ? { ...c, ...formCategoria, nome } : c,
        ),
      );
    } else {
      const nova = {
        ...formCategoria,
        nome,
        id: idNovo(),
        itens: [],
      };

      atualizarColecoes((lista) => [...lista, nova]);

      setCategoriaAtual(nova.id);
      setFiltro('todos');
      setBusca('');
    }

    setModalCategoria(false);
  }

  function excluirCategoria(c) {
    const quantidade = Array.isArray(c.itens) ? c.itens.length : 0;

    const mensagem = quantidade
      ? `Excluir "${c.nome}" e todos os seus ${quantidade} itens?`
      : `Excluir a categoria "${c.nome}"?`;

    if (!window.confirm(mensagem)) return;

    atualizarColecoes((lista) => lista.filter((x) => x.id !== c.id));

    if (categoriaAtual === c.id) {
      setCategoriaAtual(null);
    }
  }

  function abrirNovoItem() {
    setIdEditandoItem(null);
    setFormItem({ ...novoItem });
    setModalItem(true);
  }

  function editarItem(item) {
    setIdEditandoItem(item.id);

    setFormItem({
      ...novoItem,
      ...item,
    });

    setModalItem(true);
  }

  function salvarItem(event) {
    event.preventDefault();

    if (!categoria || !formItem.titulo.trim()) return;

    const item = {
      ...formItem,
      titulo: formItem.titulo.trim(),
      id: idEditandoItem || idNovo(),
      descricao: categoria.usarDescricao ? formItem.descricao : '',
      imagem: categoria.usarImagem ? formItem.imagem : '',
      data: categoria.usarData ? formItem.data : '',
      avaliacao: categoria.avaliar ? formItem.avaliacao : '',
      status: categoria.controlarStatus ? formItem.status : 'feito',
    };

    atualizarColecoes((lista) =>
      lista.map((c) => {
        if (c.id !== categoria.id) return c;

        const itensAtuais = Array.isArray(c.itens) ? c.itens : [];

        const itensAtualizados = idEditandoItem
          ? itensAtuais.map((i) => (i.id === idEditandoItem ? item : i))
          : [...itensAtuais, item];

        return {
          ...c,
          itens: itensAtualizados,
        };
      }),
    );

    setModalItem(false);
  }

  function excluirItem(item) {
    if (!window.confirm(`Excluir "${item.titulo}"?`)) return;

    atualizarColecoes((lista) =>
      lista.map((c) =>
        c.id === categoria.id
          ? {
              ...c,
              itens: (c.itens || []).filter((i) => i.id !== item.id),
            }
          : c,
      ),
    );
  }

  function alternarStatus(item) {
    const novoStatus = item.status === 'feito' ? 'a-fazer' : 'feito';

    atualizarColecoes((lista) =>
      lista.map((c) =>
        c.id === categoria.id
          ? {
              ...c,
              itens: (c.itens || []).map((i) =>
                i.id === item.id ? { ...i, status: novoStatus } : i,
              ),
            }
          : c,
      ),
    );
  }

  return (
    <main className='colecoes'>
      <header className='colecoes-header'>
        <div>
          <span className='colecoes-eyebrow'>SEU ESPAÇO PESSOAL</span>
          <h1>Coleções &amp; Conquistas</h1>
          <p>Organize suas metas, experiências e conquistas do seu jeito.</p>
        </div>

        <button className='cc-btn cc-primary' onClick={abrirNovaCategoria}>
          ＋ Nova categoria
        </button>
      </header>

      {!categoria ? (
        <>
          {categorias.length === 0 ? (
            <section className='cc-vazio'>
              <div className='cc-vazio-icone'>✦</div>
              <h2>Sua história começa aqui</h2>
              <p>
                Você ainda não criou nenhuma categoria. Crie a primeira e
                organize tudo como preferir.
              </p>
              <button
                className='cc-btn cc-primary'
                onClick={abrirNovaCategoria}
              >
                Criar primeira categoria
              </button>
            </section>
          ) : (
            <section>
              <h2 className='cc-titulo-secao'>Minhas categorias</h2>

              <div className='cc-categorias'>
                {categorias.map((c) => (
                  <article className='cc-categoria' key={c.id}>
                    <button
                      className='cc-categoria-abrir'
                      onClick={() => {
                        setCategoriaAtual(c.id);
                        setFiltro('todos');
                        setBusca('');
                      }}
                    >
                      <span
                        className='cc-icone-categoria'
                        style={{
                          color: c.cor,
                          background: `${c.cor}20`,
                        }}
                      >
                        {c.icone || '✦'}
                      </span>

                      <strong>{c.nome}</strong>
                      <p>{c.descricao || 'Coleção personalizada'}</p>

                      <span className='cc-muted'>
                        {(c.itens || []).length} itens
                      </span>
                    </button>

                    <div className='cc-acoes-categoria'>
                      <button onClick={() => editarCategoria(c)}>Editar</button>

                      <button
                        className='cc-excluir'
                        onClick={() => excluirCategoria(c)}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section>
          <button className='cc-voltar' onClick={() => setCategoriaAtual(null)}>
            ← Todas as categorias
          </button>

          <div className='cc-cabecalho-categoria'>
            <div>
              <span
                className='cc-icone-categoria cc-icone-grande'
                style={{
                  color: categoria.cor,
                  background: `${categoria.cor}20`,
                }}
              >
                {categoria.icone || '✦'}
              </span>

              <h2>{categoria.nome}</h2>

              {categoria.descricao && <p>{categoria.descricao}</p>}
            </div>

            <div className='cc-acoes'>
              <button
                className='cc-btn cc-secundario'
                onClick={() => editarCategoria(categoria)}
              >
                Editar categoria
              </button>

              <button className='cc-btn cc-primary' onClick={abrirNovoItem}>
                ＋ Adicionar item
              </button>
            </div>
          </div>

          {categoria.controlarStatus && (
            <section className='cc-progresso'>
              <div className='cc-estatisticas'>
                <div>
                  <span>Total</span>
                  <strong>{itens.length}</strong>
                </div>

                <div>
                  <span>Feitos</span>
                  <strong>{feitos}</strong>
                </div>

                <div>
                  <span>A fazer</span>
                  <strong>{pendentes}</strong>
                </div>

                <div>
                  <span>Progresso</span>
                  <strong>{progresso}%</strong>
                </div>
              </div>

              <div
                className='cc-barra'
                role='progressbar'
                aria-valuenow={progresso}
                aria-valuemin='0'
                aria-valuemax='100'
                aria-label='Progresso da coleção'
              >
                <div style={{ width: `${progresso}%` }} />
              </div>
            </section>
          )}

          {itens.length > 0 && (
            <div className='cc-ferramentas'>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder='Pesquisar itens...'
                aria-label='Pesquisar itens'
              />

              {categoria.controlarStatus && (
                <div className='cc-filtros'>
                  {[
                    ['todos', 'Todos'],
                    ['a-fazer', 'A fazer'],
                    ['feitos', 'Feitos'],
                  ].map(([valor, texto]) => (
                    <button
                      key={valor}
                      className={filtro === valor ? 'ativo' : ''}
                      onClick={() => setFiltro(valor)}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {itensVisiveis.length === 0 ? (
            <div className='cc-vazio cc-vazio-menor'>
              <div className='cc-vazio-icone'>＋</div>

              <h3>
                {itens.length
                  ? 'Nenhum item encontrado'
                  : 'Sua coleção está vazia'}
              </h3>

              <p>
                Adicione seu primeiro item e escolha as informações que deseja
                acompanhar.
              </p>

              {!itens.length && (
                <button className='cc-btn cc-primary' onClick={abrirNovoItem}>
                  Adicionar primeiro item
                </button>
              )}
            </div>
          ) : (
            <div className='cc-itens'>
              {itensVisiveis.map((item) => (
                <article className='cc-item' key={item.id}>
                  {item.imagem && (
                    <img
                      className='cc-imagem-item'
                      src={item.imagem}
                      alt=''
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}

                  <div className='cc-item-corpo'>
                    <div className='cc-item-titulo'>
                      <h3>{item.titulo}</h3>

                      <div className='cc-item-acoes'>
                        <button
                          title='Editar item'
                          aria-label={`Editar ${item.titulo}`}
                          onClick={() => editarItem(item)}
                        >
                          ✎
                        </button>

                        <button
                          title='Excluir item'
                          aria-label={`Excluir ${item.titulo}`}
                          onClick={() => excluirItem(item)}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {categoria.controlarStatus && (
                      <button
                        className={`cc-status ${
                          item.status === 'feito'
                            ? 'cc-status-feito'
                            : 'cc-status-pendente'
                        }`}
                        onClick={() => alternarStatus(item)}
                        title='Clique para mudar o status'
                      >
                        {item.status === 'feito' ? '✓ Feito' : '○ A fazer'}
                      </button>
                    )}

                    {item.descricao && (
                      <p className='cc-descricao'>{item.descricao}</p>
                    )}

                    {item.data && (
                      <p className='cc-meta'>
                        ◷{' '}
                        {new Date(`${item.data}T12:00:00`).toLocaleDateString(
                          'pt-BR',
                        )}
                      </p>
                    )}

                    {categoria.avaliar && item.avaliacao && (
                      <p className='cc-estrelas'>
                        {'★'.repeat(Number(item.avaliacao))}
                        <span>
                          {'★'.repeat(Math.max(0, 5 - Number(item.avaliacao)))}
                        </span>
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {modalCategoria && (
        <div
          className='cc-overlay'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModalCategoria(false);
            }
          }}
        >
          <section
            className='cc-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='cc-modal-categoria'
          >
            <div className='cc-modal-topo'>
              <h2 id='cc-modal-categoria'>
                {idEditandoCategoria ? 'Editar categoria' : 'Nova categoria'}
              </h2>

              <button
                className='cc-fechar'
                onClick={() => setModalCategoria(false)}
                aria-label='Fechar'
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarCategoria}>
              <label className='cc-campo'>
                Nome *
                <input
                  required
                  maxLength={60}
                  value={formCategoria.nome}
                  onChange={(e) =>
                    setFormCategoria({
                      ...formCategoria,
                      nome: e.target.value,
                    })
                  }
                  placeholder='Ex.: Livros que quero ler'
                />
              </label>

              <label className='cc-campo'>
                Descrição
                <textarea
                  rows='2'
                  value={formCategoria.descricao}
                  onChange={(e) =>
                    setFormCategoria({
                      ...formCategoria,
                      descricao: e.target.value,
                    })
                  }
                  placeholder='O que você vai organizar aqui?'
                />
              </label>

              <div className='cc-duas-colunas'>
                <label className='cc-campo'>
                  Ícone ou emoji
                  <input
                    maxLength={8}
                    value={formCategoria.icone}
                    onChange={(e) =>
                      setFormCategoria({
                        ...formCategoria,
                        icone: e.target.value,
                      })
                    }
                  />
                </label>

                <label className='cc-campo'>
                  Cor
                  <input
                    type='color'
                    value={formCategoria.cor}
                    onChange={(e) =>
                      setFormCategoria({
                        ...formCategoria,
                        cor: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className='cc-personalizacao'>
                <strong>Personalizar campos</strong>

                {[
                  ['controlarStatus', 'Acompanhar feitos e a fazer'],
                  ['usarImagem', 'Permitir imagem nos itens'],
                  ['usarDescricao', 'Permitir descrição ou texto'],
                  ['usarData', 'Permitir data'],
                  ['avaliar', 'Permitir avaliação por estrelas'],
                ].map(([campo, texto]) => (
                  <label key={campo}>
                    <input
                      type='checkbox'
                      checked={formCategoria[campo]}
                      onChange={(e) =>
                        setFormCategoria({
                          ...formCategoria,
                          [campo]: e.target.checked,
                        })
                      }
                    />
                    {texto}
                  </label>
                ))}
              </div>

              <div className='cc-modal-rodape'>
                <button
                  type='button'
                  className='cc-btn cc-secundario'
                  onClick={() => setModalCategoria(false)}
                >
                  Cancelar
                </button>

                <button type='submit' className='cc-btn cc-primary'>
                  Salvar categoria
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modalItem && categoria && (
        <div
          className='cc-overlay'
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModalItem(false);
            }
          }}
        >
          <section
            className='cc-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='cc-modal-item'
          >
            <div className='cc-modal-topo'>
              <div>
                <span className='colecoes-eyebrow'>{categoria.nome}</span>

                <h2 id='cc-modal-item'>
                  {idEditandoItem ? 'Editar item' : 'Novo item'}
                </h2>
              </div>

              <button
                className='cc-fechar'
                onClick={() => setModalItem(false)}
                aria-label='Fechar'
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarItem}>
              <label className='cc-campo'>
                Título *
                <input
                  required
                  maxLength={100}
                  value={formItem.titulo}
                  onChange={(e) =>
                    setFormItem({
                      ...formItem,
                      titulo: e.target.value,
                    })
                  }
                  placeholder='Nome do item ou conquista'
                />
              </label>

              {categoria.usarImagem && (
                <label className='cc-campo'>
                  Imagem (PNG/JPEG)
                  <input
                    type='file'
                    accept='image/png,image/jpeg,.png,.jpg,.jpeg'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!['image/png','image/jpeg'].includes(file.type)) {
                        window.alert('Use somente PNG ou JPEG/JPG.');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > 3 * 1024 * 1024) {
                        window.alert('A imagem deve ter no máximo 3 MB.');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const image = new Image();
                        image.onload = () => {
                          const max = 1000;
                          const scale = Math.min(1, max / Math.max(image.width, image.height));
                          const canvas = document.createElement('canvas');
                          canvas.width = Math.max(1, Math.round(image.width * scale));
                          canvas.height = Math.max(1, Math.round(image.height * scale));
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                          setFormItem({ ...formItem, imagem: canvas.toDataURL('image/jpeg', 0.82) });
                        };
                        image.src = String(reader.result || '');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {formItem.imagem && (
                    <div className='cc-image-preview'>
                      <img src={formItem.imagem} alt='Pré-visualização da coleção' />
                      <button type='button' onClick={() => setFormItem({ ...formItem, imagem: '' })}>Remover imagem</button>
                    </div>
                  )}
                  <small>PNG/JPEG, até 3 MB. A imagem é salva junto ao item e exibida no card.</small>
                </label>
              )}

              {categoria.usarDescricao && (
                <label className='cc-campo'>
                  Descrição ou comentário
                  <textarea
                    rows='3'
                    value={formItem.descricao}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        descricao: e.target.value,
                      })
                    }
                    placeholder='Escreva detalhes ou uma lembrança...'
                  />
                </label>
              )}

              <div className='cc-duas-colunas'>
                {categoria.usarData && (
                  <label className='cc-campo'>
                    Data
                    <input
                      type='date'
                      value={formItem.data}
                      onChange={(e) =>
                        setFormItem({
                          ...formItem,
                          data: e.target.value,
                        })
                      }
                    />
                  </label>
                )}

                {categoria.avaliar && (
                  <label className='cc-campo'>
                    Avaliação
                    <select
                      value={formItem.avaliacao}
                      onChange={(e) =>
                        setFormItem({
                          ...formItem,
                          avaliacao: e.target.value,
                        })
                      }
                    >
                      <option value=''>Sem avaliação</option>
                      <option value='1'>★☆☆☆☆ — 1</option>
                      <option value='2'>★★☆☆☆ — 2</option>
                      <option value='3'>★★★☆☆ — 3</option>
                      <option value='4'>★★★★☆ — 4</option>
                      <option value='5'>★★★★★ — 5</option>
                    </select>
                  </label>
                )}
              </div>

              {categoria.controlarStatus && (
                <label className='cc-campo'>
                  Status
                  <select
                    value={formItem.status}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value='a-fazer'>A fazer</option>
                    <option value='feito'>Feito</option>
                  </select>
                </label>
              )}

              <TagPicker data={data} save={save} value={formItem.tags || []} onChange={(value) => setFormItem({ ...formItem, tags: value })} />

              <div className='cc-modal-rodape'>
                <button
                  type='button'
                  className='cc-btn cc-secundario'
                  onClick={() => setModalItem(false)}
                >
                  Cancelar
                </button>

                <button type='submit' className='cc-btn cc-primary'>
                  Salvar item
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
