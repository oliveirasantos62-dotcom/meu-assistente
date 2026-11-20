# NeoLifeCity — sincronização local da vida real

## O que foi implementado

- O mapa principal continua sendo `public/maps/cyberpunk-metropolis.webp`, já referenciado pelo CSS do NeoLifeCity.
- O NeoLifeCity observa automaticamente alterações nos dados que o Meu Assistente já mantém: tarefas concluídas, minutos de estudo, hábitos registrados, leituras/conhecimentos, metas concluídas e projetos.
- Quando detecta progresso novo, atualiza a afinidade local dos NPCs relacionados:
  - Luna: estudos e leituras.
  - Kai: tarefas e projetos.
  - Nox: hábitos.
  - Maya: metas concluídas.
- A sincronização e as afinidades derivadas dela ficam em `localStorage`, na chave `neolifecity_life_sync_v1`.
- A interface informa que a sincronização é local e mostra a reação mais recente.

## Limites importantes

Esta versão não lê automaticamente passos, frequência cardíaca, exercícios ou sono do Google Fit, Health Connect ou Apple Health. O projeto não tinha integração nativa com essas fontes, e a opção de privacidade local foi respeitada: nenhum serviço externo novo foi conectado. A automação usa os registros já feitos dentro do Meu Assistente.

Para sincronizar dados de sensores do celular no futuro, será necessário implementar e testar uma integração nativa (por exemplo, Health Connect no Android), solicitar permissões explícitas e manter o armazenamento local como padrão.

## Teste

Na primeira abertura, a aplicação registra uma linha de base local. A partir daí, novos registros ou conclusões feitos nos módulos do Meu Assistente atualizam os NPCs. Dados antigos não geram recompensas retroativas.
