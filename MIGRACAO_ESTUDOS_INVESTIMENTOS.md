# Migração de Estudos e Investimentos

## 1. Banco de dados

No TiDB Cloud, abra o SQL Editor, selecione `meu_assistente` e execute:

`backend/src/db/phase7.sql`

Ele cria as tabelas dos Estudos e dos Investimentos. Não apaga as tabelas existentes.

## 2. Backend

O backend agora expõe:

- `/api/study/*`
- `/api/investments/*`

O Render deve ser atualizado com este backend.

## 3. Frontend

Estudos usa o backend e faz uma migração única dos dados antigos que estavam em `localStorage`.

Investimentos passa a usar o backend como fonte principal. Na primeira abertura, se a conta ainda não tiver investimentos no banco, os investimentos locais são enviados automaticamente.

A cópia local continua existindo como backup enquanto a migração é validada.
