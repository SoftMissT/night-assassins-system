---
title: "STATE — Night Assassins System"
created: 2026-09-29
updated: 2026-09-29
status: ativo
type: estado
projeto: night-assassins-system
blueprint: plans/night-assassins-system-blueprint.md
tags:
  - night-assassins
  - sdd
  - state
---

# STATE — Night Assassins System

Memória de sessão por feature. Atualizado ao fim de cada passo.

## Passo atual

**Passo 2 — Documentação SDD.** Status: **spec conforme, aguardando revisão do
autor.**

Criadas a constituição, a especificação de requisitos em EARS, os ADRs 0001 a
0003 e reconciliado o ADR-0004. O critério de saída do passo é a revisão da
constituição e dos requisitos pelo autor.

## Decisões confirmadas

- **D1:** `id` do sistema = `night-assassins`.
- **D4:** `dice-so-nice` obrigatório em `relationships.requires` (tipo
  `module`). O sistema CSB **não** é declarado em `relationships.systems`
  (não é mais módulo sobre CSB).
- **D7:** autoria = `{ "name": "SoftMissT", "url": "https://github.com/SoftMissT" }`.
- Tipos de documento declarados via `documentTypes` no `system.json` (v14),
  não via `template.json` — ver [ADR-0004](adr/ADR-0004-declaracao-de-tipos-v14.md).
- **Mudança de método no Passo 2:** os requisitos de `docs/01-requirements.md`
  foram extraídos não só do README e do CHANGELOG do legado (como o blueprint
  previa), mas também da **base canônica do projeto na Hive** — `DECISIONS.md`,
  `MEMORY.md`, `STATE.md`, `tasks/TASK.md`, `tasks/lessons.md`, `specs/*` e
  `docs/specs/*`. A prioridade das fontes é a definida pelo controlador: base
  canônica da Hive primeiro, depois repositório legado, depois blueprint.
  `tasks/todo.md` foi ignorado por ser explicitamente histórico/deprecado.
- **Repositório novo em vez de fork:** ver
  [ADR-0001](adr/ADR-0001-repo-novo-em-vez-de-fork.md).
- **DataModel em vez de CSB (`system.props` abandonado):** ver
  [ADR-0002](adr/ADR-0002-datamodel-em-vez-de-csb.md).
- **Migração cria Actors novos, nunca apaga:** ver
  [ADR-0003](adr/ADR-0003-migracao-actors-novos.md).

## Desvio de interpretação consciente — 2026-09-29

**O quê:** o script `test` do `package.json` ficou
`node --test "tests/**/*.test.mjs"` em vez de `node --test` cru.

**Motivo:** o repositório legado está embutido fisicamente em
`night-assassins-csb-automation/` no checkout local (nunca versionado, ausente
em CI/clone limpo). O runner `node --test` sem escopo varre
`night-assassins-csb-automation/tests/` e fica vermelho (os testes do legado
esperam paths relativos à raiz dele). Node 24.19 não respeita
`.gitignore`/`.git/info/exclude` na descoberta de testes e não há flag de
exclusão por caminho. O escopo `tests/**/*.test.mjs` usa o mesmo runner
embutido, com zero dependências, e mantém `tests/` como raiz canônica de
testes (citada nos passos 3–14 do blueprint).

**Invariante protegido:** "`node --test` passa" no ambiente real de
desenvolvimento, o mesmo que roda `npm test` em CI.

**Observação:** `node --test tests/` (diretório como argumento) **não**
funciona no Node 24 — o runner trata argumentos posicionais como arquivos ou
globs. Daí a forma com glob.

## Base de branch

O Passo 1 vive na branch `passo-1-bootstrap` (PR #1, **não mergeado** em
`main`). Como o Passo 2 depende do Passo 1 e reaproveita `docs/STATE.md` e
`docs/adr/ADR-0004-*.md` criados nele, a branch do Passo 2
(`passo-2-docs-sdd`) foi criada **a partir de `passo-1-bootstrap`**, e não de
`main` — ver pergunta em aberto abaixo.

## Verificações automatizadas (o que existe hoje)

- `npm test` (runner `node --test`, escopo `tests/**/*.test.mjs`): verde, sem
  testes desativados.
- Parse de `system.json` e `lang/pt-BR.json`.

Os demais invariantes do projeto (globals proibidos em `module/core/`, strings
de interface em i18n, `system.props` restrito a `module/migration/`) ainda
**não** têm teste. Eles serão convertidos em teste nos passos que os
introduzem — o teste de invariante "sem globals em `module/core/`" entra no
Passo 8.

## Entregas do Passo 2

- `docs/00-constitution.md` — 12 princípios não-negociáveis.
- `docs/01-requirements.md` — 83 requisitos `REQ-001`..`REQ-083` em EARS, em
  nove categorias, cada um com `**Fonte:**`, mais a seção
  "Rastreabilidade Passos × REQ".
- `docs/adr/ADR-0001-repo-novo-em-vez-de-fork.md`.
- `docs/adr/ADR-0002-datamodel-em-vez-de-csb.md`.
- `docs/adr/ADR-0003-migracao-actors-novos.md`.
- `docs/adr/ADR-0004-declaracao-de-tipos-v14.md` — reconciliado (achado
  mantido; referências ajustadas; frontmatter adicionado).
- `docs/STATE.md` — este arquivo.

## Pendências

- [ ] **Gate manual do Foundry — PENDENTE (Passo 1).** Nenhum subagente tem o
      Foundry rodando; a verificação "instalar a pasta em `Data/systems/` e criar
      um mundo vazio sem erros no console" só pode ser fechada pelo autor.
      Roteiro:
      1. Copiar a pasta do repositório para `Data/systems/night-assassins/`
         (ou zipar e instalar pela UI).
      2. Abrir o Foundry v14 e confirmar que o sistema aparece em
         "Game Systems".
      3. Criar um mundo novo com o sistema `Night Assassins`.
      4. Confirmar no console (F12) a linha
         `night-assassins | Night Assassins 0.1.0 inicializado.` e a ausência
         de erros.
- [ ] **Passo 2 — aprovação do autor** da constituição e dos requisitos
      (critério de saída do passo).
- [ ] `Dice So Nice` instalado/ativo é requisito de runtime (D4).
- [x] ADRs 0001..0003 criados e ADR-0004 reconciliado (Passo 2).

## Perguntas em aberto para o autor

Lista única de ambiguidades e contradições entre as fontes. Nenhuma foi
resolvida por inferência. Perguntas não bloqueiam o passo.

1. **Bônus permanentes de atributo por Origem Oni.** `docs/ONI-MODELO-PDV-PDK-ATRIBUTOS.md`
   afirma que as Origens Oni **não** concedem bônus permanente de atributo e
   registra uma "decisão necessária do Operador" para remover
   `origem_oni_bonus_*`. O CHANGELOG v0.11.84 (v0.10.0, v0.11.23) descreve os
   campos `origem_oni_bonus_*` como implementados e ativos no template. As
   fontes se contradizem: o sistema novo mantém ou remove os bônus de atributo
   por Origem Oni?
2. **Número de Origens Oni.** O CHANGELOG fala em **21** Origens Oni
   (`catalogs/oni-origins.json`), enquanto a tabela auditada de
   `docs/ONI-MODELO-PDV-PDK-ATRIBUTOS.md` enumera **19** Origens + Exterminador
   Corrompido = 20. Qual contagem é a canônica?
3. **Divergência entre export e fórmulas literais de PDV/PDK do Oni.**
   `specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md` diz que somente
   PDV N2/N5 do template divergem do export oficial "para obedecer literalmente
   às fórmulas fornecidas". Quando o export oficial e a fórmula literal do
   operador divergirem, a fórmula literal é sempre a autoridade?
4. **Divergência documental das Classes Slayer.** `Regras de Level Up Exterminadores.md`
   lista três Classes na escolha do nível 4, enquanto `Classes.md` também define
   Companheiro de Oni e Usuário de Duas Respirações. O módulo mantém as cinco.
   Confirmar que as cinco permanecem e que a divergência fica apenas
   registrada.
5. **Base de integração do Passo 2.** O Passo 2 foi ramificado de
   `passo-1-bootstrap` (PR #1 não mergeado), não de `main`, porque só aquela
   branch contém `docs/STATE.md` e `ADR-0004`. Confirma-se que a integração é
   Passo 1 → Passo 2 em sequência, sem rebase sobre `main` antes do merge do
   PR #1?
6. **Escopo das armas especiais (D6).** O blueprint determina portar o código
   mas não publicar as armas especiais como mecânica concluída. Confirmar que,
   no sistema novo, elas seguem fora do publicado até uma decisão explícita —
   inclusive para efeito de compêndios e do critério de saída do Passo 10c.

> NUNCA marcar o gate manual do Foundry como concluído por inferência: só o
> autor com o Foundry aberto pode fechá-lo.
