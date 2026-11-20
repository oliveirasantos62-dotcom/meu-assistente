# NeoLifeCity — Etapa 3: estética pixel-art viva

## Direção visual
- Referência híbrida: aconchego e leitura de mundo de fazenda/RPG 2D (Stardew Valley), exploração e personagens em sprites clássicos de RPG portátil (Pokémon antigo), com paleta e cenário futurista neon.
- O mapa `public/maps/cyberpunk-metropolis.webp` permanece como arte-base integral.
- NPCs passam a usar os assets originais individuais em `public/assets/characters/` e spritesheets runtime transparentes gerados em `public/assets/characters/runtime/`.

## NPCs mapeados
- Luna: `student.png`
- Kai: `engineer.png`
- Maya: `merchant.png`
- Nox: `mechanic.png`
- Íris: `scientist.png`

Os sprites runtime usam quatro quadros frontais/alternados por personagem, com transparência e escala padronizada de 48×48 px. As interações e os diálogos existentes foram preservados.

## Cidade viva
Foram adicionados elementos ambientais animados em CSS sobre o WEBP: veículos voadores em rotas, drones e pulsos de luz holográfica. Eles não interceptam cliques e respeitam `prefers-reduced-motion`.

## Validação
A instalação das dependências (`npm ci`) excedeu o tempo disponível neste ambiente e, por isso, `npm run build` não pôde ser executado. Validar localmente com:

```bash
npm install
npm run build
npm run dev
```
