CORREÇÃO DOS INVESTIMENTOS — BACKEND

Arquivos alterados:
- backend/src/controllers/investmentController.js
- backend/src/routes/investmentRoutes.js

Correções:
1. GET /api/investments/quote/:symbol?market=US|BR|GLOBAL
2. Mercado EUA/Global não usa mais Brapi.
3. Fallback Brapi -> Yahoo para B3.
4. Yahoo como provedor para EUA/Global.
5. Cache curto para reduzir 429/rate limit.
6. Snapshots aceitam date, snapshotDate ou snapshot_date; sem data usa o dia atual.
7. Migração automática de colunas market/currency e tabelas de investimentos.
8. Dashboard não depende de as tabelas terem sido criadas manualmente.

IMPORTANTE:
- Substitua os dois arquivos no backend do projeto.
- Faça commit/push e aguarde o Render concluir o deploy.
- O código foi validado com `node --check`; não foi possível testar a API externa neste ambiente.
