---
title: "ADR-0003 — Migração cria Actors novos"
created: 2026-09-29
status: aceito
type: adr
projeto: night-assassins-system
etapa: passo-2
tags:
  - night-assassins
  - adr
  - migracao
  - foundry-vtt
---

# ADR-0003 — Migração cria Actors novos

- **Status:** Aceito
- **Data:** 2026-09-29
- **Passo:** 2 (Documentação SDD; implementação no Passo 13)
- **Relacionado:** [ADR-0001](ADR-0001-repo-novo-em-vez-de-fork.md), [ADR-0002](ADR-0002-datamodel-em-vez-de-csb.md)

## Contexto

Mundos existentes têm Actors do CSB com dados em `system.props` e Items
embutidos remapeados pelo CSB. No Foundry, o `type` de um Actor não é algo que
se troca com um `update` simples: alterar o `type` de um documento existente
pode corromper os dados e quebrar referências. Os tokens em cenas apontam para
`actorId`, então qualquer troca de documento precisa reapontá-los.

## Decisão

A migração de mundos CSB para o sistema **cria Actors novos**:

1. O migrador cria um Actor **novo** do tipo certo, copiando nome, imagem, token,
   efeitos, pasta, propriedade e flags, e convertendo `props` para `system.*`
   via `mapping.json`.
2. Os Items são recriados a partir dos Compêndios com sobrescritas de dados.
3. O tipo (slayer, oni, minion, npc) é decidido pela lógica de `actor-kind` do
   legado.
4. Os **tokens das cenas são reapontados** para os Actors novos.
5. Os Actors antigos são movidos para a pasta **"Legado CSB"** e **nunca são
   apagados**.
6. Antes de aplicar, exporta-se um **backup JSON** dos Actors e Items afetados.
7. O migrador tem modo **dry-run** (relatório sem escrita) e modo **aplicar**, e
   é **idempotente**: rodar de novo não duplica nada.
8. Cada Actor migrado recebe `flags.night-assassins.migratedFrom` com a versão do
   módulo e a data.

## Consequências

- O rollback é natural: como nada é apagado e há backup JSON, reverter é
  reapontar tokens/restaurar a pasta, não recuperar dados destruídos.
- `mapping.json` passa a ser fonte única para os DataModels (passo 5) e para o
  migrador (passo 13); mudar o mapping exige reexecutar os testes de ambos.
- O passo 13 exige validação em **mundo clonado**, com comparação de derivados
  antes e depois e segunda execução sem alterações.

## Relações

- [ADR-0001 — Repositório novo em vez de fork](ADR-0001-repo-novo-em-vez-de-fork.md)
- [ADR-0002 — DataModel em vez de CSB](ADR-0002-datamodel-em-vez-de-csb.md)
- [Blueprint — Passo 13](../../plans/night-assassins-system-blueprint.md)
