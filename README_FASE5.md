# Fase 5 — Projetos colaborativos

A Fase 5 transforma a área de Projetos em um módulo colaborativo conectado ao backend/MySQL.

## Recursos

- criação de projetos colaborativos;
- privacidade privada ou para conexões;
- convite de conexões aceitas;
- aceitar/recusar convites;
- lista de membros;
- tarefas por projeto;
- responsável por tarefa;
- status: a fazer, em andamento e concluída;
- prioridade e prazo;
- progresso de 0 a 100%;
- progresso médio do projeto;
- histórico de alterações das tarefas;
- notificações de convite e atribuição;
- exclusão do projeto pelo dono.

## Banco de dados

Execute no MySQL, depois das migrações anteriores:

```bat
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < src\\db\\phase5.sql
```

## Backend

```bat
cd backend
npm install
npm start
```

## Frontend

```bat
npm install
npm run build
```

Para produção, configure `VITE_API_URL` apontando para a API online.
