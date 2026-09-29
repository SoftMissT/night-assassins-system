---
title: "ADR-0002 — DataModel em vez de CSB"
created: 2026-09-29
status: aceito
type: adr
projeto: night-assassins-system
etapa: passo-2
tags:
  - night-assassins
  - adr
  - datamodel
  - foundry-vtt
---

# ADR-0002 — DataModel em vez de CSB

- **Status:** Aceito
- **Data:** 2026-09-29
- **Passo:** 2 (Documentação SDD)
- **Relacionado:** [ADR-0001](ADR-0001-repo-novo-em-vez-de-fork.md), [ADR-0004](ADR-0004-declaracao-de-tipos-v14.md)

## Contexto

O legado define os dados de Actor e Item via `template.json` e os persiste em
`system.props` como um conjunto dinâmico de chaves. Parte da mecânica mora em
**fórmulas dentro dos labels do template** (54 no Slayer, 58 no Oni), não nos
scripts. Os scripts leem `actor.system.props.*`, inclusive com chaves dinâmicas
(`props[`${key}_display`]`), o que torna o contrato real difícil de enumerar
estaticamente.

No Foundry v14, o mecanismo moderno é o `TypeDataModel` com `defineSchema()` e
`prepareDerivedData()`, registrado no `init`.

## Decisão

O sistema novo usa **DataModels próprios**:

- `documentTypes` declarados no `system.json` (v14), e **não** via
  `template.json`;
- registro dos modelos no hook `init` com
  `Object.assign(CONFIG.Actor.dataModels, { … })` (e o equivalente para `Item`),
  preservando propriedades estáticas — **não** usar
  `foundry.utils.mergeObject`;
- os dados vivem em `actor.system.*` e `item.system.*`;
- `system.props` é **abandonado** no código novo, restrito a `module/migration/`
  e aos fixtures do legado;
- os cálculos migram dos labels do CSB para funções puras em `module/core/`,
  chamadas por `prepareDerivedData()`.

## Consequências

- O contrato de dados fica tipado e verificável; `mapping.json` (passo 4) é a
  fonte única que liga cada chave CSB a um `caminhoSystem`.
- A lógica antes escondida em fórmulas de label passa a ter teste unitário
  equivalente, exigido pela constituição ("teste antes de portar").
- Os fixtures dourados exportados do CSB fixam a equivalência: os derivados
  calculados pelos DataModels devem bater 100% com o export.
- `template.json` **não** é usado neste projeto; ver a verificação registrada em
  [ADR-0004](ADR-0004-declaracao-de-tipos-v14.md).

## Relações

- [ADR-0001 — Repositório novo em vez de fork](ADR-0001-repo-novo-em-vez-de-fork.md)
- [ADR-0004 — Declaração de tipos na v14](ADR-0004-declaracao-de-tipos-v14.md)
- [Constituição](../00-constitution.md)
