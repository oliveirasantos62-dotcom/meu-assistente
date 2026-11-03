CORREÇÃO — INVESTIMENTOS

Correções incluídas:
1. Backend cria automaticamente as tabelas de investimentos se elas não existirem.
2. Corrige suporte a snapshots com data local válida.
3. Adiciona cotação por mercado:
   - BR = B3 via brapi.dev
   - US = Estados Unidos via Yahoo Finance
   - GLOBAL = outros mercados via símbolos compatíveis com Yahoo Finance (ex.: AAPL, SAP.DE, VOD.L)
4. Armazena mercado, moeda e valores convertidos para BRL para não somar USD/EUR diretamente como BRL.
5. Atualização dos ativos usa o mesmo mercado salvo no ativo.
6. Para a brapi, configure BRAPI_TOKEN no Render se o seu plano/ticker exigir autenticação.

ARQUIVOS:
- backend/src/controllers/investmentController.js
- backend/src/routes/investmentRoutes.js
- src/services/api.js
- src/components/Investments.jsx

IMPORTANTE:
Depois de substituir os arquivos do backend/frontend, faça novo deploy.
No Render, adicione BRAPI_TOKEN como variável de ambiente se você tiver uma chave da brapi.
A brapi é voltada para ativos da B3; TSLA não deve ser consultada nela. Para TSLA use o mercado EUA.
