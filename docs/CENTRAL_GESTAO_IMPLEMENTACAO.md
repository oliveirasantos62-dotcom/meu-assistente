# Central de Gestão Pessoal — atualização

## Entregue nesta versão

- Estrutura central de tags no `appData`, com página de gerenciamento e histórico de usos.
- Ciclo de Estudos com prioridade, tempo disponível/estudado, sessões, progresso, dificuldade, próxima revisão, tags e meta relacionada.
- Sessões registradas na página Estudos também alimentam `studySessions` da fonte central para relatórios.
- Relatórios filtráveis por período, área e tag, com métricas, evolução e conclusões baseadas nos dados disponíveis.
- Exportação do relatório pelo diálogo de impressão do navegador, permitindo **Salvar como PDF**.
- Personalização de módulos e configuração de pesquisa web do Assistente.
- Sidebar passa a respeitar módulos desativados.
- Upload de PNG/JPEG nas Coleções, com validação de tipo/tamanho, preview, remoção e redução automática para evitar imagens gigantes no JSON.
- CSS consolidado em `src/styles.css`; os antigos arquivos CSS de páginas foram incorporados.
- Novos utilitários analíticos centralizados em `src/utils/analytics.js`.

## Fonte única de verdade

As novas estruturas ficam dentro do `appData` principal:

- `tags`
- `studyCycles`
- `settings.modules`
- `settings.assistant`
- `studySessions`

Isso mantém a sincronização existente com o backend e evita criar um segundo armazenamento para as novas páginas.

## Observação sobre PDF

A exportação usa o mecanismo de impressão do navegador. Ao clicar em **Exportar / Salvar PDF**, escolha **Salvar como PDF** no diálogo do navegador. Isso evita adicionar uma dependência pesada de geração de PDF ao frontend.

## Próxima evolução recomendada

A próxima etapa pode mover imagens das Coleções para um storage de objetos e criar endpoints analíticos dedicados no backend. Isso é recomendado quando o volume de imagens ou histórico crescer significativamente.
