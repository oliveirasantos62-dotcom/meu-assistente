# 🧠 Meu Assistente Pessoal

Aplicação web desenvolvida para centralizar a organização pessoal, o gerenciamento de tarefas e o acompanhamento de objetivos em um único lugar.

O projeto utiliza React e Vite no frontend, com integração ao Supabase para autenticação e armazenamento de dados na nuvem.

## ✨ Funcionalidades

- 🔐 Autenticação de usuários com Supabase.
- ☁️ Integração com armazenamento em nuvem.
- ✅ Organização e gerenciamento de tarefas.
- 📋 Centralização de informações pessoais.
- 📱 Interface web acessível pelo navegador.
- 🚀 Preparação para publicação na Vercel.

> Observação: as funcionalidades disponíveis dependem da implementação atual do projeto e da configuração do Supabase.

## 🛠️ Tecnologias utilizadas

- **React** — construção da interface.
- **Vite** — ambiente de desenvolvimento e compilação.
- **JavaScript** — lógica da aplicação.
- **Supabase** — autenticação e serviços de banco de dados.
- **Vitest** — testes automatizados.
- **Git e GitHub** — controle de versão e hospedagem do código.
- **Vercel** — publicação da aplicação.

## 📁 Estrutura do projeto

```text
meu-assistente/
├── public/
├── src/
│   ├── components/
│   │   └── Auth.jsx
│   ├── hooks/
│   │   ├── useAppData.js
│   │   └── useAppData.test.jsx
│   ├── services/
│   │   ├── storage.js
│   │   ├── cloudStorage.js
│   │   └── supabase.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

_Alguns arquivos e pastas podem variar conforme a versão atual do projeto._

## ⚙️ Requisitos

Antes de executar o projeto, instale:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- Uma conta no [Supabase](https://supabase.com/), para utilizar os recursos de nuvem.

## 🚀 Como executar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/meu-assistente-pessoal.git
```

Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub.

### 2. Entrar na pasta

```bash
cd meu-assistente-pessoal
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Obtenha os valores nas configurações do seu projeto Supabase. Utilize a URL da API e uma chave pública `sb_publishable_...`, não o endereço do painel administrativo.

**Importante:** não envie o arquivo `.env` para o GitHub. Nunca coloque chaves secretas ou `service_role` no frontend.

### 5. Iniciar o servidor

```bash
npm run dev
```

Abra no navegador o endereço apresentado pelo Vite, geralmente:

```text
http://localhost:5173
```

## 🧪 Testes

Para executar os testes automatizados:

```bash
npx vitest run
```

## 📦 Compilação para produção

Para verificar se a aplicação compila corretamente:

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`.

Para testar a versão compilada localmente:

```bash
npm run preview
```

## ☁️ Publicação na Vercel

1. Envie o projeto para um repositório no GitHub.
2. Acesse [Vercel](https://vercel.com/).
3. Importe o repositório.
4. Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` nas configurações do projeto.
5. Execute a publicação.

Configuração padrão para Vite:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Após a publicação, o Vercel fornecerá um endereço para acessar a aplicação.

## 🔒 Segurança e armazenamento

- O GitHub armazena o código-fonte e o histórico de alterações.
- A Vercel hospeda a aplicação web.
- O Supabase pode armazenar dados na nuvem, desde que o aplicativo esteja configurado para gravá-los no banco de dados.
- As tabelas que contêm dados pessoais devem utilizar políticas de segurança adequadas, como Row Level Security (RLS).
- As credenciais dos usuários devem ser gerenciadas pelo sistema de autenticação, nunca armazenadas em texto puro pelo aplicativo.
- O arquivo `.env` deve permanecer fora do controle de versão.

## 🗺️ Próximas melhorias

- [ ] Aprimorar a organização das tarefas.
- [ ] Garantir a persistência dos dados na nuvem.
- [ ] Validar o isolamento dos dados entre usuários.
- [ ] Melhorar a experiência em dispositivos móveis.
- [ ] Ampliar a cobertura de testes.
- [ ] Documentar novas funcionalidades.

## 👨‍💻 Desenvolvimento

Projeto pessoal desenvolvido com o objetivo de praticar desenvolvimento web, React, integração com serviços de backend, testes automatizados e publicação de aplicações.

---

**Meu Assistente Pessoal** — organização, tecnologia e produtividade em um só lugar.

## Fase 2 — Contas e Conexões

A Fase 2 usa uma API Node/Express separada com MySQL e JWT.

### Frontend

Configure `.env` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:3001
```

O frontend implementa:

- cadastro com nome, e-mail, senha e nome de usuário;
- login;
- sessão persistida por JWT;
- recuperação da sessão com `/api/auth/me`;
- logout local;
- pesquisa de usuários;
- envio de convite de conexão;
- aceitar/recusar convite;
- bloqueio de conexão pela API;
- menu lateral personalizado por conta.

### Backend

O backend fica na pasta separada `backend/` do projeto de desenvolvimento e não deve ser enviado para o deploy do frontend na Vercel.

Para desenvolvimento local, mantenha a API em `http://localhost:3001` e o frontend em `http://localhost:5173`.

### Limite desta fase

As informações dos módulos pessoais (tarefas, hábitos, diário, calendário, finanças etc.) ainda usam a persistência local existente. A migração desses dados para MySQL será uma etapa posterior.
