# Neo-Life — expansão do mundo pessoal

Esta versão amplia o módulo Neo-Life já integrado ao Meu Assistente.

## Funcionalidades adicionadas
- Estado visual da cidade calculado pelos minutos de estudo/foco registrados nos últimos sete dias: próspera, estável, enfraquecida ou adormecida.
- A cidade pode perder vitalidade visual, mas não apaga edifícios, inventário ou conquistas durante pausas.
- Casa pessoal com espaço visual e posicionamento de itens comprados no Mercado Neon.
- Sala de conquistas com marcos derivados de tarefas, estudos, hábitos, metas e projetos já registrados.
- Jardim de foco com estágios de crescimento baseados nos minutos acumulados em sessões de estudo.
- Evolução do personagem baseada no XP existente e atributos derivados das atividades reais.
- NPCs com histórias, rotinas e missões com progresso calculado a partir dos dados do usuário.
- Eventos temáticos que encaminham para atividades já existentes.
- Coleções raras desbloqueadas por marcos de estudo, leitura e projetos.
- Minigame adicional de lógica matemática, gratuito e sem alterar moedas ou XP.
- Inventário, casa e jardim preparados no estado padrão `neoCity`.

## Dados e compatibilidade
Os novos dados ficam dentro de `data.neoCity` (`home`, `garden`, `character`, `collections`) e mantêm compatibilidade com o inventário, conversas e arcade já existentes. O XP e as moedas continuam usando os campos existentes do Meu Assistente; esta expansão não cria uma segunda carteira nem concede XP duplicado.

## Observação
Os eventos e as rotinas de NPC nesta versão são conteúdo local do jogo. Visitas multiplayer entre contas, sincronização em tempo real e calendário de eventos online exigem implementação adicional no backend.
