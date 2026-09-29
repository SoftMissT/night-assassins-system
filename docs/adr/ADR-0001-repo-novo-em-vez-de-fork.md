---
title: "ADR-0001 — Repositório novo em vez de fork"
created: 2026-09-29
status: aceito
type: adr
projeto: night-assassins-system
etapa: passo-2
tags:
  - night-assassins
  - adr
  - arquitetura
---

# ADR-0001 — Repositório novo em vez de fork

- **Status:** Aceito
- **Data:** 2026-09-29
- **Passo:** 2 (Documentação SDD)
- **Relacionado:** [ADR-0002](ADR-0002-datamodel-em-vez-de-csb.md), [ADR-0003](ADR-0003-migracao-actors-novos.md)

## Contexto

O Night Assassins existe hoje como **módulo sobre o Custom System Builder (CSB)**,
em `night-assassins-csb-automation` (v0.11.84). O objetivo do projeto é migrar
para um **Sistema próprio do Foundry VTT v14**, com DataModels, fichas em
ApplicationV2 e migrador de mundos.

Havia duas alternativas: (a) fazer um *fork* do módulo legado e transformá-lo em
sistema sobre CSB; ou (b) criar um **repositório novo** de sistema nativo,
mantendo o legado intocado.

## Decisão

Criar o repositório novo `night-assassins-system`, com `id` de sistema
`night-assassins`, independente do módulo legado. O repositório
`night-assassins-csb-automation` **permanece intocado e consultável** como fonte
de requisitos, referência de mecânica e origem dos dados a migrar.

O legado não é declarado como dependência do sistema novo: deixa de ser módulo
sobre CSB, então o CSB não entra em `relationships.systems`.

## Consequências

- O sistema novo não herda restrições do CSB (`system.props`, `template.json`,
  componentes visuais do editor do CSB).
- Os números do legado (69 arquivos em `scripts/`, ~31,7 mil linhas; 100
  arquivos de teste; 1088 testes) seguem disponíveis como referência de
  portação, mas não como código de produção.
- O legado continua publicável enquanto o sistema novo não fecha a v1.0.0; uma
  última versão 0.11.x pode avisar da descontinuação apontando para o sistema.
- As decisões D1 (id) e D7 (autoria) do blueprint são registradas aqui como
  consequência direta da separação.

## Relações

- [ADR-0002 — DataModel em vez de CSB](ADR-0002-datamodel-em-vez-de-csb.md)
- [Constituição](../00-constitution.md)
- [Blueprint](../../plans/night-assassins-system-blueprint.md)
