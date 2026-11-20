# Neo-Life — cidade explorável

## Controles
- `W`, `A`, `S`, `D` ou setas do teclado: movimentar o personagem.
- No celular/tablet: usar o direcional na tela.
- Pressionar o botão `🚪` em frente/ao lado de um edifício para entrar.
- `Esc` ou `Sair para a cidade` para deixar um interior.

## Mundo incluído
- Núcleo Central: central de operações e missões.
- Universidade Neon: biblioteca, laboratório e sala de estudos.
- Estufa BioTech: jardim de foco, laboratório botânico e sementes.
- Laboratório de Inovação: oficina, planejamento e robótica.
- Mercado Neon: decoração, roupas e trocas.
- Arcade 88: jogos de memória, ritmo e enigmas (salas preparadas para expansão).

## Progressão e persistência
O acesso aos distritos usa os indicadores reais já existentes no Meu Assistente (tarefas, minutos de estudo, hábitos, projetos, metas e XP). A posição do personagem é salva em `neoCity.world.player`. Nenhuma tarefa, moeda ou conquista é criada artificialmente por caminhar ou visitar edifícios.

## Implementação
A primeira versão usa React e CSS, sem adicionar dependências. O mapa é uma grade 2D com colisões simples, personagem controlável, portas clicáveis, seis prédios e interiores temáticos. É a base para evoluir depois para sprites pixel-art, animações, NPCs com rotinas e interações dentro dos prédios.
