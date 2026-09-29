---
title: "ADR-0004 — Declaração de tipos de documento no Foundry VTT v14"
created: 2026-09-29
status: aceito
type: adr
projeto: night-assassins-system
etapa: passo-1
tags:
  - night-assassins
  - adr
  - foundry-vtt
  - documenttypes
---

# ADR-0004 — Declaração de tipos de documento no Foundry VTT v14

- **Status:** Aceito
- **Data:** 2026-09-29
- **Passo:** 1 (Bootstrap do repositório); reconciliado no Passo 2
- **Relacionado:** [ADR-0001](ADR-0001-repo-novo-em-vez-de-fork.md),
  [ADR-0002](ADR-0002-datamodel-em-vez-de-csb.md),
  [ADR-0003](ADR-0003-migracao-actors-novos.md); D2/D3 (tipos reais de
  Actor/Item entram nos passos 4/5)

## Contexto

O sistema precisa declarar seus subtipos de documento (Actor e Item) para que o
Foundry v14 não descarte os dados do campo `system` ao carregar um mundo. O
legado `night-assassins-csb-automation` define tipos via `template.json`, que é
o mecanismo pré-v10.

Antes de escrever `system.json`, foi consultada a documentação oficial:

- <https://foundryvtt.com/article/system-development>
- <https://foundryvtt.com/article/system-data-models>

## Decisão

1. Declarar os subtipos no `system.json` via `documentTypes`, e **não** via
   `template.json`:

   ```json
   "documentTypes": { "Actor": {}, "Item": {} }
   ```

   O mecanismo aceita `htmlFields` (ex.: `["background.biography"]`) e
   `filePathFields` (ex.: `{ "crest": ["IMAGE"] }`). Neste passo as chaves
   ficam vazias; os tipos reais (Slayer, Oni, Oni Minion, NPC, ...) entram nos
   passos 4/5.
2. Registrar os DataModels no hook `init` com
   `Object.assign(CONFIG.Actor.dataModels, { ... })` (e o equivalente para
   `Item`), para preservar propriedades estáticas — **não** usar
   `foundry.utils.mergeObject`.
3. `template.json` **não** será usado neste projeto.

## Consequências

- O mecanismo moderno (`documentTypes` + `TypeDataModel`) é a única fonte de
  verdade dos subtipos; qualquer leitura de `system.props` do legado fica
  restrita a `module/migration/` e aos fixtures do legado.
- `packs` de Actor/Item/Adventure exigem o campo `system` desde a v10 —
  relevante quando os packs forem criados (passo 14).
- Os passos 4/5 definem os tipos concretos de Actor/Item sobre este mecanismo.
- [ADR-0002](ADR-0002-datamodel-em-vez-de-csb.md) confirma o registro por
  `Object.assign(CONFIG.Actor.dataModels, …)` e o abandono de `system.props`;
  [ADR-0001](ADR-0001-repo-novo-em-vez-de-fork.md) fixa que este projeto é um
  repositório novo, sem `template.json`; [ADR-0003](ADR-0003-migracao-actors-novos.md)
  define a migração que cria Actors novos.

## Reconciliação — Passo 2

O Passo 2 reconciliou esta decisão com os ADRs 0001..0003 **sem nova pesquisa**:
o achado permanece o mesmo (`documentTypes` no `system.json` na v14, e não
`template.json`; `htmlFields`/`filePathFields`; registro de DataModel via
`Object.assign(CONFIG.Actor.dataModels, …)`). A única alteração é de coerência
de referências entre os ADRs.
