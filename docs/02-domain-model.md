# Modelo de domínio — Slayer

> Fonte do schema do `SlayerDataModel` (ADR-0002). Este documento descreve o
> **domínio**, não as chaves do CSB. O contrato legado só entra aqui na coluna
> "origem legado", usada depois pelo migrador (passo 13).
>
> Escopo desta fatia: **Actor tipo `slayer`**, do N1 ao N20, com o mínimo para a
> ficha viver no Foundry. Oni, Oni Minion, NPC, diagnóstico e migração estão fora.

## 0. Regras de leitura

| Classe | Significado |
| --- | --- |
| **G** | Gravado no `system.*` do Actor. Fonte de verdade. |
| **D** | Derivado em `prepareDerivedData()` / resolvedor puro. **Nunca persistido** (REQ-023). |
| **E** | Efêmero — diálogo, rolagem, estado de combate. Vive no request, não no ator. |

Tipos: todo valor numérico é `number`, nunca HTML nem string formatada
(constituição 8). `*_display` do CSB vira formatação na renderização, não dado.

## 1. Identidade e progressão

| Campo | Tipo | C/D | Origem legado |
| --- | --- | --- | --- |
| `level` | `1..20` | G | `nvl_pj` |
| `class` | enum 5 classes | G | classe escolhida no N4 (REQ-004) |
| `rank` | enum C/B/A/S/SS | D | derivado do `level` (REQ-004) |
| `origin` | enum 12 origens | G | REQ-006 |
| `bloodGift` | enum 10 dons | G | `hab_escolhida` / `hab_escolhida_base` (REQ-006) |
| `level14Choice` | `'pdv' \| 'pdr' \| null` | G | `nvl_14_bonus_choice` (REQ-003) |
| `hpGains` | `Record<level, number>` | G | ganhos N2–N12 rolados **uma vez** (REQ-008) |
| `level11BattleMasterRoll` | `number \| null` | G | `2d6` rodo uma vez no N11 (REQ-005) |
| `attributeSnapshots` | `{ n1, n3, n7 }` | G | snapshots do criador de atributos (REQ-002) |

**Invariante:** campos de rolagem única (`hpGains`, `level11BattleMasterRoll`,
`snapshots`) são gravados na primeira vez e **nunca recalculados** ao renderizar
ou trocar nível temporariamente.

## 2. Atributos

Sete chaves neutras, sem namespace de espécie (REQ-001):
`vit`, `dex`, `for`, `car`, `fdv`, `int`, `sab`.

| Campo | Tipo | C/D |
| --- | --- | --- |
| `attributes.<attr>.value` | `number` | G |
| `attributes.<attr>.bonus` | `number` | G (mods explícitos: classe, nível 16, etc.) |
| `attributes.<attr>.final` | `number` | D |

REQ-001 na prática: existe **um único acessor** `finalAttribute('vit')`. No CSB
isso era resolvido lendo `vit_display` com fallback para `*_config` porque o dado
era HTML. Com dado numérico, `display` deixa de existir — o acessor lê `value +
bonus`. Mesma intenção, sem o workaround.

## 3. Recursos

| Campo | Tipo | C/D | Origem |
| --- | --- | --- | --- |
| `hp.base` | `number` | G | `total_conta` (soma rolada, REQ-008) |
| `hp.damage` | `number` | G | `pdv_slayer_dano_tomado` (REQ-042) |
| `hp.wound` | `number` | G | `pdv_slayer_dano_ferida` (REQ-042) |
| `hp.extra` | `number` | G | ganhos de fonte (`+extra`, REQ-058) |
| `hp.max` | `number` | D | `base − wound + extra` (REQ-058) |
| `hp.current` | `number` | D | `max − damage` |
| `pdr.max` | `number` | D | fórmula da classe/nível |
| `pdr.spent` | `number` | G | `pdr_slayer_gasto_valor` |
| `breath.current` | `number` | G | fôlego gasto/restaurado |
| `breath.max` | `number` | D | `2 + fdvFinal` (REQ-009) |
| `speed` | `number` | D | `7 + dexFinal` metros (REQ-009) |

**Invariante:** `damage ≥ 0`, `wound ≥ 0`. Ferida reduz o **máximo**, dano comum
reduz o **atual** — campos separados, nunca um só acumulador (REQ-042).

## 4. Economia de ações

| Campo | Tipo | C/D | Reset |
| --- | --- | --- | --- |
| `actions.movement` / `.attack` / `.special` | `number` (base 1) | G | início do turno |
| `actions.unique` / `.reaction` | `number` (base 1) | G | por rodada |
| `actions.complete` | n/a | D | consome `movement` + `attack` atomicamente |
| `actions.free` / `.defense` | sem contador | — | REQ-014 |

Gravado porque o **GM autoritativo** restaura via hooks do Combat nativo
(REQ-014) — não depende de UI. Ações Épica/Lendária/Covil/Vilão ficam fora do
contador (REQ-015) e não têm campo aqui.

## 5. Respiração

| Campo | Tipo | C/D | Origem |
| --- | --- | --- | --- |
| `breathing.form` | id da Forma ativa | G | REQ-019/026 |
| `breathing.weaponState` | `Record<weaponId, …>` | G | estado por arma (REQ-030) |
| `breathing.accumulators` | `Record<string, number>` | G | acúmulos por Forma (REQ-030) |
| `breathing.temporaryBonuses` | array `{ source, field, value }` | G | bônus temporários (REQ-029) |

O conteúdo das seis Respirações (2,4 MB de `breathing.json`) é **catálogo de
Item/conteúdo**, não dado do Actor — fica em `packs/`, não neste schema.

## 6. Status

| Campo | Tipo | C/D | Origem |
| --- | --- | --- | --- |
| `status.active` | `string[]` | G | contrato versionado (REQ-043) |
| `status.exhaustion` | `0..8` inteiro | G | REQ-045 |
| `status.effects` | array com payload | G | só status que exigem dados |
| `status.resistances` | tipo[] oficiais | G | REQ-041, nunca booleano |

`*_display`/`*_resumo` do CSB viram derivados de renderização. Duração
(`*_turnos`) só existe quando a fonte define (REQ-048).

## 7. Vida e Morte

| Campo | Tipo | C/D | Origem |
| --- | --- | --- | --- |
| `death.state` | `'ok' \| 'edge' \| 'dead'` | G | REQ-052 |
| `death.falls` | `number` | G | quedas do combate (REQ-052) |
| `death.marks` | `number` | G | Marcas de Morte (REQ-053/054) |
| `death.stabilized` | `boolean` | G | REQ-053 |
| `death.determinationUsed` | `boolean` | G | Ajuda de Vínculo uma vez/combate (REQ-056) |

Idempotência por chave `combatId:round:turn:combatantId` (REQ-047) é
**efêmera** — vive num `Set` do motor, não no ator.

## 8. Derivados (resolvedor puro)

`acerto`, `bloqueio`, `esquiva`, `percepção`, `dano` por parcela tipada
(REQ-023), crítico pelo perfil da arma (REQ-010), rank. **Nenhum total derivado
é gravado** — sem dupla contagem de Respiração/Status.

## 9. Itens da fatia

| Tipo | Precisa agora | Para depois |
| --- | --- | --- |
| `weapon` | sim (perfil, crítico, dano) | — |
| `breathingForm` | parcial (só a Forma ativa) | catálogo completo |
| `specialWeapon`, `kekkijutsu`, `breathing` | não | Oni / conteúdo |

## 10. Decisões abertas

1. **Naming dos campos**: proposta `pdv`/`pdr`/`folego`/`exaustao` em pt-BR
   curto (mesmo vocabulário do jogo e do legado → migração mais simples) contra
   `hp`/`pdr`/`breath`/`exhaustion` em inglês. **Precisa do seu voto.**
2. **`*_display` fora do schema**: confirmar que REQ-001 é reinterpretado como
   "um único acessor" (ver §2). Muda a redação do REQ-001.
3. **Formatação de Atributos**: onde vive o HTML de exibição — `system` não
   guarda mais; proposta: helper Handlebars na ficha.

## Rastreabilidade

REQ-001…009 → §1–3; REQ-010, 014, 015, 023 → §4, §8; REQ-019, 026, 029, 030 → §5;
REQ-041, 043, 045, 048 → §6; REQ-052…058 → §7. Campos sem REQ correspondente
estão marcados como proposta.
