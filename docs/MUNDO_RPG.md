# Mundo — experiência de evolução pessoal

O módulo `World.jsx` apresenta uma camada de aventura conectada aos dados reais do Meu Assistente. Ele não substitui Tarefas, Estudos, Hábitos ou Objetivos: oferece um mapa e uma visão lúdica do progresso que já acontece nesses módulos.

## Integração

- XP e moedas usam os campos centrais `data.xp` e `data.coins` já existentes.
- O XP de tarefas e objetivos continua sendo concedido pelos fluxos existentes; o Mundo não concede novamente essas recompensas.
- Missões diárias opcionais concedem bônus pequenos, uma única vez por dia e por missão, após verificar as atividades registradas.
- Explorar uma região desbloqueada concede 15 moedas uma única vez por região.
- Itens cosméticos comprados ficam registrados em `data.world.ownedCosmetics`.

## Dados adicionados (compatíveis)

```js
world: {
  missionClaims: {},
  discoveries: [],
  ownedCosmetics: []
}
```

A normalização do `useAppData` fornece valores padrão para contas antigas. Nenhuma tarefa, hábito, sessão, meta ou conquista existente é removida ou reescrita.

## Desbloqueio das regiões

| Região | XP total necessário |
|---|---:|
| Vale do Começo | 0 |
| Bosque do Saber | 100 |
| Montanhas da Forja | 300 |
| Costa da Aurora | 600 |
| Observatório Celeste | 1.000 |
| Reino das Lendas | 1.600 |

As missões do dia são opcionais. Não há perda de XP, moedas ou regiões por descansar ou deixar de cumprir uma missão.
