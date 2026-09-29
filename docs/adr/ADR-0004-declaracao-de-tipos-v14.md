# ADR-0004 — Declaração de tipos de documento no Foundry VTT v14

- **Status:** Aceito
- **Data:** 2026-09-29
- **Passo:** 1 (Bootstrap do repositório)
- **Relacionado:** D2/D3 (tipos reais de Actor/Item entram nos passos 4/5)

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
- O passo 2 (ADRs 0001..0003) e os passos 4/5 devem reconciliar esta decisão ao
  definir os tipos concretos.
