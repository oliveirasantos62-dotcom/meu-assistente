# Meu Assistente — Backend Fase 2 (MySQL)

Backend independente do frontend atual.

## Requisitos

- Node.js
- MySQL 8+
- npm

## Instalação

```bash
cd backend
npm install
```

Crie o `.env`:

```bash
copy .env.example .env
```

Configure:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=meu_assistente

JWT_SECRET=uma-chave-grande-e-secreta

FRONTEND_URL=http://localhost:5173
```

## Criar banco e tabelas

Abra o MySQL:

```bash
mysql -u root -p
```

Depois execute:

```sql
source src/db/schema.sql;
```

Ou, no Windows:

```bash
mysql -u root -p < src/db/schema.sql
```

## Iniciar

Desenvolvimento:

```bash
npm run dev
```

Produção:

```bash
npm start
```

API:

```text
http://localhost:3001
```

Teste:

```text
GET http://localhost:3001/api/health
```

Resposta esperada:

```json
{
  "ok": true,
  "service": "meu-assistente-api",
  "database": "mysql"
}
```

## Endpoints da Fase 2

### Autenticação

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Conexões

```text
GET   /api/connections
GET   /api/connections/search?q=gabriel
POST  /api/connections
PATCH /api/connections/:id
```

Os endpoints protegidos usam:

```text
Authorization: Bearer SEU_TOKEN
```

## Importante

Este backend não substitui o frontend atual.

O frontend da Fase 2 já usa estes endpoints para cadastro, login, sessão e conexões. O próximo grande passo do projeto é a Fase 3 (🔥 Foguinho).

## Fase 3 — Foguinho

Execute também `src/db/phase3.sql` no mesmo banco `meu_assistente` depois do `schema.sql`.

A API adiciona:
- `/api/foguinho/activities`
- `/api/foguinho/activities/:id/invite`
- `/api/foguinho/invitations`
- `/api/foguinho/activities/:id/log`
- `/api/foguinho/activities/:id/history`
- `/api/foguinho/notifications`
- `/api/foguinho/notifications/:id/read`

O Foguinho usa as conexões aceitas da Fase 2 para controlar quem pode ser convidado.

## Fase 4 — Estudos, leitura e revisão espaçada

Execute uma vez no MySQL:

```bat
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < src\db\phase4.sql
```

Endpoints protegidos por JWT em `/api/study`:
- `GET /dashboard`
- `POST /sessions`
- `POST /readings`
- `PATCH /readings/:id`
- `POST /reviews`
- `POST /reviews/:id/review`
- `POST /errors`
- `PATCH /errors/:id/toggle`
