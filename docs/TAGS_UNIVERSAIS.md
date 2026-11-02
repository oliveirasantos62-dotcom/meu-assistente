# Tags universais

As tags são uma entidade central do Meu Assistente. Elas não pertencem apenas a tarefas.

Podem ser aplicadas a registros como tarefas, hábitos, objetivos, projetos, diário, sessões de estudo, conhecimentos, banco de erros, reflexões, ciclo de estudos, calendário, processos, áreas, itens de coleções, transações financeiras e investimentos.

Cada registro guarda somente os IDs das tags em `tags`. A definição da tag (nome, cor e metadados) fica em `data.tags`, evitando duplicação.

O componente `src/components/TagPicker.jsx` é o seletor reutilizável para criar, pesquisar e aplicar múltiplas tags.

A página Tags agrega o uso por origem e permite filtrar, abrir associações e remover a tag sem apagar os registros; a remoção destrutiva exige confirmação.
