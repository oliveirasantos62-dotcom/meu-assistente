# Meu Assistente Pessoal

Aplicação de produtividade e organização pessoal construída com **React + Vite**, com API complementar em **Node.js/Express** e banco **MySQL**. O projeto também mantém integração com serviços do Supabase conforme a configuração do frontend.

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
- Persistência local e sincronização/serviços de nuvem conforme configuração.
- API de autenticação e recursos sociais com JWT e MySQL.

> A disponibilidade de cada integração depende das variáveis de ambiente, do banco e dos serviços externos configurados.

## Módulo Processos

A página **Processos** é integrada à navegação principal e permite criar mapas mentais e fluxogramas em uma área visual. Ela inclui elementos de etapa, início/fim, decisão e texto; conexões entre elementos; edição de cores e dimensões; modelos iniciais; desfazer/refazer; zoom e exportação em SVG.

Os processos são armazenados no campo `processes` dos dados da aplicação, usando o mecanismo de persistência já utilizado por `useAppData` e `storageService`. Essa implementação não cria tabelas, não executa migrações e não altera registros de serviços externos. Se a sincronização em nuvem for habilitada futuramente para os dados gerais da aplicação, o campo `processes` poderá acompanhar o mesmo fluxo, sem exigir uma tabela nova.

## Tecnologias

**Frontend:** React 18, Vite 6, JavaScript, CSS e Vitest.  
**Backend:** Node.js, Express 5, MySQL2, JWT, bcryptjs, CORS e dotenv.  
**Serviços:** Supabase (quando configurado).  
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
│   ├── services/             # API, armazenamento e Supabase
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
- MySQL 8 ou compatível, caso utilize a API.
- Conta/projeto Supabase apenas para os recursos que dependem dele.

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

Se utilizar recursos Supabase, configure também as variáveis exigidas pelo arquivo `src/services/supabase.js`. Nunca coloque chave `service_role` ou segredo privado em variáveis `VITE_*`, pois elas são expostas ao navegador.

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

Copie `backend/.env.example` para `backend/.env` e configure os dados reais do MySQL e um segredo JWT forte:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=meu_assistente
JWT_SECRET=gere-um-segredo-longo-e-aleatorio
FRONTEND_URL=http://localhost:5173
```

Crie o banco `meu_assistente` no MySQL e aplique os scripts SQL necessários que estão em `backend/src/db/`, respeitando a sequência/fase indicada no nome dos arquivos e a estrutura já existente do banco.

Inicie a API:

```bash
npm run dev
```

A rota `http://localhost:3001/api/health` permite verificar se a API está respondendo.

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
- Revisar políticas RLS do Supabase para tabelas acessadas pelo cliente.
- Fazer backup antes de executar scripts de alteração do banco.

## Convenções para manutenção

- Preserve os identificadores de seções usados pelo `Sidebar` e pelo `App.jsx`.
- Antes de alterar persistência, confira `src/hooks/useAppData.js` e os serviços em `src/services/`.
- Centralize estilos compartilhados em `src/styles.css`; evite regras duplicadas e seletores globais muito abrangentes.
- Ao adicionar uma tela, verifique navegação, tema claro/escuro, responsividade e estados vazios.
- Rode `npx vitest run` e `npm run build` antes de integrar mudanças.

---

**Meu Assistente Pessoal** — organização, produtividade e desenvolvimento contínuo.
