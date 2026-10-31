# Meu Assistente Pessoal

Aplicação de produtividade e organização pessoal construída com **React + Vite**, com API complementar em **Node.js/Express** e banco **TiDB Cloud** (compatível com o protocolo MySQL). Os dados principais do aplicativo são carregados e salvos pela API no TiDB.

## Funcionalidades

- Painel principal e acompanhamento de produtividade.
- Tarefas, calendário, diário, estudos, objetivos e hábitos.
- Projetos colaborativos, grupos e conexões entre usuários.
- Coleções, conquistas, gamificação e Foguinho.
- Finanças pessoais e investimentos.
- Assistente e recursos de ciência de dados.
- Personalização da navegação: ativar/desativar e reordenar páginas.
- Tema claro/escuro com preferência salva no navegador.
- Modo foco com temporizador.
- Persistência centralizada no TiDB para contas autenticadas; armazenamento local usado como cache e migração inicial.
- API de autenticação e recursos sociais com JWT e MySQL.

> A disponibilidade de cada integração depende das variáveis de ambiente, do banco e dos serviços externos configurados.

## Módulo Processos

A página **Processos** é integrada à navegação principal e permite criar mapas mentais e fluxogramas em uma área visual. Ela inclui elementos de etapa, início/fim, decisão e texto; conexões entre elementos; edição de cores e dimensões; modelos iniciais; desfazer/refazer; zoom e exportação em SVG.

Os processos são armazenados no campo `processes` dos dados da aplicação, usando o mecanismo de persistência já utilizado por `useAppData` e `storageService`. Essa implementação não cria tabelas, não executa migrações e não altera registros de serviços externos. Se a sincronização em nuvem for habilitada futuramente para os dados gerais da aplicação, o campo `processes` poderá acompanhar o mesmo fluxo, sem exigir uma tabela nova.

## Tecnologias

**Frontend:** React 18, Vite 6, JavaScript, CSS e Vitest.  
**Backend:** Node.js, Express 5, MySQL2, JWT, bcryptjs, CORS e dotenv.  
**Banco:** TiDB Cloud (compatibilidade MySQL, conexão TLS).  
**Ferramentas:** Git, GitHub e Vercel (frontend).

## Estrutura

```text
meu-assistente/
├── backend/
│   ├── docs/                   # Roteiro e notas de migração
├── src/
│   │   ├── controllers/     # Regras das rotas
│   │   ├── db/               # Conexão e scripts SQL
│   │   ├── middleware/       # Autenticação
│   │   ├── routes/           # Endpoints da API
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── docs/                   # Roteiro e notas de migração
├── src/
│   ├── components/           # Telas e componentes React
│   ├── hooks/                # Hooks e testes
│   ├── services/             # API e armazenamento local
│   ├── utils/                # Funções auxiliares
│   ├── App.jsx
│   └── styles.css
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Requisitos

- Node.js LTS e npm.
- Uma instância TiDB Cloud com banco criado e credenciais de conexão.
- Conta TiDB Cloud com banco de dados criado.

Confira as versões instaladas:

```bash
node --version
npm --version
```

## Configuração e execução

### 1. Frontend

Na pasta raiz do projeto:

```bash
npm install
```

Copie `.env.example` para `.env` e ajuste as variáveis necessárias:

```env
VITE_API_URL=http://localhost:3001
```

As credenciais do TiDB devem existir somente no `.env` da raiz (lido pelo backend como alternativa) ou em `backend/.env`. Nunca use o prefixo `VITE_` em credenciais do banco, pois variáveis com esse prefixo são expostas ao navegador.

Inicie:

```bash
npm run dev
```

O Vite normalmente disponibiliza o frontend em `http://localhost:5173`.

### 2. Backend (opcional, para autenticação e recursos da API)

Abra outro terminal:

```bash
cd backend
npm install
```

Copie `backend/.env.example` para `backend/.env` e configure os dados de conexão do TiDB Cloud (TiDB Cloud Console → Connect → General) e um segredo JWT forte. Em desenvolvimento, o backend também lê as variáveis do `.env` da raiz como alternativa:

```env
PORT=3001
DB_HOST=gateway01.<regiao>.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=seu_usuario_tidb
DB_PASSWORD=sua_senha_tidb
DB_NAME=nome_do_banco
JWT_SECRET=gere-um-segredo-longo-e-aleatorio
FRONTEND_URL=http://localhost:5173
```

Crie/selecione o banco no TiDB Cloud antes de iniciar a API. No editor SQL do TiDB, selecione o schema no seletor de database ou execute `USE nome_do_banco;` antes de rodar comandos manualmente — isso evita o erro `No database selected` da imagem. A tabela `user_app_data` é criada automaticamente na inicialização; ela armazena o estado completo das telas por usuário em JSON. As tabelas de autenticação, conexões, estudos, investimentos, projetos, grupos e Foguinho continuam sendo usadas pelas rotas existentes. Se o banco ainda não tiver essas tabelas, aplique os scripts SQL de `backend/src/db/` na ordem das fases documentadas, após backup.

Inicie a API:

```bash
npm run dev
```

A rota `http://localhost:3001/api/health` verifica também a conexão com o TiDB. O frontend envia os dados pela API autenticada; as credenciais do TiDB ficam exclusivamente no backend, nunca em variáveis `VITE_*`.

Para executar em modo normal:

```bash
npm start
```

## Testes e build

Na raiz do frontend:

```bash
npm test
npx vitest run
npm run build
npm run preview
```

- `npm test`: inicia o Vitest em modo interativo.
- `npx vitest run`: executa os testes uma vez.
- `npm run build`: gera a versão de produção em `dist/`.
- `npm run preview`: serve localmente a build gerada.

O backend atualmente não possui script de testes automatizados configurado.

## Publicação

### Frontend na Vercel

1. Envie o repositório ao GitHub sem arquivos `.env`.
2. Importe o repositório na Vercel.
3. Defina as variáveis de ambiente do frontend no painel da Vercel.
4. Use `npm run build` como comando de build e `dist` como diretório de saída.
5. Publique e valide autenticação, navegação e persistência.

A API Express/MySQL precisa ser hospedada separadamente em um ambiente que suporte Node.js e tenha acesso ao banco. Atualize `VITE_API_URL` para a URL pública da API e configure `FRONTEND_URL` no backend com o domínio publicado do frontend.

## Segurança e dados

- Não versionar `.env`, senhas, tokens ou credenciais privadas.
- Manter `.env.example` apenas com nomes de variáveis e valores ilustrativos.
- Não expor segredos em variáveis `VITE_*`.
- Usar senha forte para o MySQL e `JWT_SECRET` aleatório e exclusivo.
- Aplicar controles de acesso e validação no backend.
- Não expor credenciais do TiDB no frontend nem versionar arquivos `.env`.
- Fazer backup antes de executar scripts de alteração do banco.

## Convenções para manutenção

- Preserve os identificadores de seções usados pelo `Sidebar` e pelo `App.jsx`.
- Antes de alterar persistência, confira `src/hooks/useAppData.js` e os serviços em `src/services/`.
- Centralize estilos compartilhados em `src/styles.css`; evite regras duplicadas e seletores globais muito abrangentes.
- Ao adicionar uma tela, verifique navegação, tema claro/escuro, responsividade e estados vazios.
- Rode `npx vitest run` e `npm run build` antes de integrar mudanças.

---

**Meu Assistente Pessoal** — organização, produtividade e desenvolvimento contínuo.
