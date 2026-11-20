# Neo-Life — cidade cyberpunk conectada à rotina

O módulo `src/components/NeoLifeCity.jsx` adiciona uma camada de simulação ao Meu Assistente. Ele não substitui Tarefas, Estudos, Hábitos, Metas ou Projetos: lê os dados desses módulos e apresenta a evolução em uma cidade futurista.

## Funcionalidades

- Seis distritos com progresso derivado dos registros reais: Núcleo Central, Distrito Acadêmico, Jardins BioTech, Distrito de Inovação, Mercado Neon e Arcade 88.
- Cinco moradores com diálogos contextuais baseados em tarefas concluídas, minutos estudados, hábitos, leituras e moedas atuais.
- Mercado com preços fixos em moedas do aplicativo e inventário persistente.
- Minijogo de memória com uma tentativa diária: entrada de 5 moedas e prêmio fixo de 12 moedas em caso de vitória.
- Histórico de conversas, itens e tentativa do Arcade armazenados em `data.neoCity`.

## Economia e integridade

- O módulo usa `data.coins` e `data.xp` existentes; não cria uma segunda carteira.
- Não concede XP novamente por tarefas, estudos, hábitos, metas ou projetos.
- As compras descontam moedas e registram o item no inventário.
- O Arcade informa o custo e a recompensa antes de jogar, não usa dinheiro real nem sorteios.
- Não há perda de progresso por ausência ou descanso.

## Estrutura persistida

```js
neoCity: {
  inventory: [],
  talks: {},
  arcade: { lastAttemptDate: null, lastWinDate: null }
}
```

O campo tem valor padrão em `emptyAppData`; contas existentes continuam compatíveis por causa da normalização e do merge já usados pelo aplicativo.
