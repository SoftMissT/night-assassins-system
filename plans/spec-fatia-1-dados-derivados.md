---
tipo: spec
projeto: night-assassins-system
fatia: 1
criado: 2026-11-12
status: rascunho-aguardando-respostas
fontes:
  - plans/night-assassins-criacao-atributos-progressao.md (fonte fechada de criação e progressão)
  - Sistema_NAS_Compendio.md §1 Fôlego de Combate
  - Mecanicas_Centrais.md §Tipos de Ação
  - Mecânica de Vida e Morte.md §2, §10
  - legado night-assassins-csb-automation (slayer-template.json, roll-service.mjs)
---

# Spec: fatia 1, dados da ficha Slayer

## Objetivo

Trocar os "—" da ficha por valores calculados das regras, e guardar no Actor só o que o jogador escolhe ou gasta. Nada de rolagem nesta fatia (é a fatia 3).

## O que passa a ser persistido (`SlayerData`)

| Campo | Tipo | Por quê |
|---|---|---|
| `attributes.{7}` | inteiro ≥ 1 | **valor de criação** (array, 7d4 ou Discord). Ver pergunta 10 |
| `progression.gain3`, `progression.gain7` | sigla do atributo ou vazio | `+1` dos níveis 3 e 7 (fonte §2.1) |
| `progression.level14` | `""`, `"pdv"` ou `"pdr"` | escolha permanente do nível 14 (fonte §6.2) |
| `gift` | id do Dom ou vazio | Dom do Sangue (fonte §4) |
| `resources.{pdv,pdr,folego}.value` | inteiro ≥ 0 | valor atual; o máximo vira derivado |
| `death.marks` | 0–3 | Marcas de Morte |
| `death.falls` | inteiro ≥ 0 | quedas neste combate |
| `actions.{movimento,ataque,especial,unica,completa,reacao}` | booleano "usada" | contadores do turno |
| `epic.usedThisArc` | booleano | Ação Épica, 1 por arco |

## O que passa a ser derivado (`prepareDerivedData`)

| Derivado | Fórmula | Fonte |
|---|---|---|
| Atributo atual | criação + gain3 (nível ≥ 3) + gain7 (nível ≥ 7) | §2.1 |
| Snapshots VIT/FDV | nível 1–2 → criação; 3–6 → snapshot 3; 7–14 → snapshot 7 | §6.1 |
| PDV máximo | `PDV(1) = OrigemPDV + VIT(1) + habPDV`; `PDV(N) = PDV(N-1) + OrigemPDV + VIT(t) + habPDV`; + nível 14 opção A (`VIT×3`) | §6.1–6.2 |
| PDR máximo | `PDR(1) = OrigemPDR + FDV(1) + habPDR`; `PDR(N) = PDR(N-1) + 1 + FDV(t) + habPDR`; + nível 14 opção B (`FDV×2`) | §6.1–6.2 |
| habPDV / habPDR | Tsuyoi +2/+3/+4 PDV por nível (1–5 / 6–11 / 12+); Marechi +1 PDR; Ōketsu +2 PDR; retroativos | §4.5, §6.4 |
| Fôlego máximo | `2 + FDV` | Compêndio §1 |
| Rank da Classe | nível 4 C, 6 B, 8 A, 11 S, 12 SS | §5.1 |
| Testes de combate (rótulo) | Bloqueio `1d20 + FOR`; Esquiva `1d20 + DEX`; Acerto `1d20 + FOR ou DEX` (pela arma) | legado `slayer-template.json` |

Origem sem escolha → PDV/PDR máximos ficam `—`, sem chutar.

Fora desta fatia: Marca do Destino (+2/+3 em atributo escolhido), Mestre de Batalha Rank S (`2d6` único) e Metal & Cor Rosa. Eles exigem campos de escolha e rolagem; entram com a fatia 3.

## Onde fica o código

- `module/core/progression.mjs`: funções puras (tabela de Origens, snapshots, PDV, PDR, Fôlego, habPDV/habPDR). Nenhum global do Foundry (invariante do blueprint).
- `module/data/slayer.mjs`: schema novo + `prepareDerivedData` chamando o core.
- Ficha: troca os "—" pelos derivados; os máximos deixam de ser campo editável.

## Testes (Node, sem Foundry)

- **Dourado:** o exemplo Ninja da fonte §6.3, níveis 1 a 14, PDV `16 … 244` e PDR `16 … 63`, mais as opções A (`259`) e B (`69`) do nível 14.
- Snapshots: ganho no nível 3 só entra a partir do 3; ganho do 7 só a partir do 7.
- Tsuyoi retroativo: o bônus muda de faixa nos níveis 6 e 12 e recalcula todos os níveis anteriores.
- Fôlego `2 + FDV` com FDV atual.
- Invariante: `module/core/` sem `game.`, `ui.`, `Hooks`, `foundry.`, `canvas.`, `CONFIG.`.

## Migração

Só existem Actors de teste (0.0.x). Os campos `resources.*.max` persistidos saem do schema. O `max` antigo é ignorado e não é preciso migrador.

## Gate

`npm test` verde, instância 30001 com o mesmo Actor de QA: trocar nível, Origem e ganhos e ver os máximos batendo com a tabela Ninja.

## Pendências para aprovar a spec

Perguntas 10 a 15 em `plans/perguntas-abertas.md`.
