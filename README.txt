CORREÇÃO DEFINITIVA — INVESTIMENTOS / MERCADO GLOBAL

Substitua os quatro arquivos mantendo exatamente os caminhos:
- backend/src/controllers/investmentController.js
- backend/src/routes/investmentRoutes.js
- src/components/Investments.jsx
- src/services/api.js

O que foi corrigido:
1. Adicionado GET /api/investments/quote/:symbol?market=BR|US|GLOBAL.
2. B3 usa brapi.dev; EUA e outros mercados usam Yahoo Finance.
3. Dashboard cria/atualiza automaticamente o schema de investimentos quando necessário.
4. Schema internacional: market, currency, buy_price_brl e current_price_brl.
5. Snapshot aceita data YYYY-MM-DD e valida números.
6. JSON de targetAllocation é tratado de forma segura mesmo quando o driver retorna objeto.
7. O schema é inicializado uma vez e não recriado a cada requisição.
8. TSLA com market=US não deve mais retornar 404 por rota ausente.

IMPORTANTE:
- Faça deploy do BACKEND e do FRONTEND. Os dois precisam ser da mesma versão.
- No Render, configure BRAPI_TOKEN se sua conta/endpoint da brapi exigir token.
- Não coloque TSLA/PETR4 na mesma lógica de cotação: TSLA = US; PETR4 = BR.

Validação local feita:
- Sintaxe do controller: OK.
- Sintaxe das rotas: OK.
- Build do frontend não foi concluído neste ambiente porque o npm install excedeu o tempo disponível e o vite não ficou instalado.
