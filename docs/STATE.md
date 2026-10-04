# STATE — Night Assassins System

Memória de sessão por feature. Atualizado ao fim de cada passo.

## Passo atual

**Rebirth — Missão 02.** Status: **primeira ficha Slayer nativa entregue,
testes verdes, PR #2 em draft (sem merge).**

A branch `rebirth/clean-slate-2026-10-03` contém agora o sistema mínimo
Foundry v14: manifesto (`system.json` `0.1.0-rebirth.1`), `module/` (init,
`SlayerData`, `SlayerSheet`), `templates/actor/slayer-sheet.hbs`,
`styles/night-assassins.css`, `lang/pt-BR.json`, `package.json` e
`tests/smoke.test.mjs`. Os 7 PNGs de referência aprovada e 5 de iteração
estão em `docs/design/references/`.

- Commit: `adef9a4` (pushado apenas na branch rebirth).
- `npm test`: 4 pass / 0 fail.
- Validação de API feita contra o **Foundry 14.367.0 local** (fonte do core
  lida), **não** por execução no Foundry — ver gate manual abaixo.
- Correção aplicada: `data-action="editImage"` movido de `<button>` para
  `<img data-edit="img">` (o core rejeita botão).
- Ainda **não** há tag/release/CI nesta branch; `manifest` aponta para
  `releases/latest` inexistente.

## Decisões confirmadas (herdadas do reset)

- **D1:** `id` do sistema = `night-assassins`.
- **D4:** `dice-so-nice` obrigatório em `relationships.requires` (tipo
  `module`). O sistema CSB **não** é declarado em `relationships.systems`
  (não é mais módulo sobre CSB).
- **D7:** autoria = `{ "name": "SoftMissT", "url": "https://github.com/SoftMissT" }`.
- Tipos de documento declarados via `documentTypes` no `system.json` (v14),
  não via `template.json` — ver [ADR-0004](adr/ADR-0004-declaracao-de-tipos-v14.md).

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

## Verificações automatizadas (o que existe hoje)

- `npm test` (runner `node --test`, escopo `tests/**/*.test.mjs`): verde, sem
  testes desativados.
- Parse de `system.json` e `lang/pt-BR.json`.

Os demais invariantes do projeto (globals proibidos em `module/core/`, strings
de interface em i18n, `system.props` restrito a `module/migration/`) ainda
**não** têm teste. Eles serão convertidos em teste nos passos que os
introduzem — o teste de invariante "sem globals em `module/core/`" entra no
Passo 8.

## Pendências

- [ ] **Gate manual do Foundry — PENDENTE.** Nenhum subagente tem o Foundry
      rodando; a verificação "instalar a pasta em `Data/systems/` e criar um
      mundo vazio sem erros no console" só pode ser fechada pelo autor.
      Roteiro:
      1. Copiar a pasta do repositório para `Data/systems/night-assassins/`
         (ou zipar e instalar pela UI).
      2. Abrir o Foundry v14 e confirmar que o sistema aparece em
         "Game Systems".
      3. Criar um mundo novo com o sistema `Night Assassins`.
      4. Confirmar no console (F12) a linha
         `night-assassins | Night Assassins 0.1.0 inicializado.` e a ausência
         de erros.
- [ ] Passo 2 — ADRs 0001..0003 e reconciliação deste ADR-0004.
- [ ] `Dice So Nice` instalado/ativo é requisito de runtime (D4).

> NUNCA marcar o gate manual acima como concluído por inferência: só o autor
> com o Foundry aberto pode fechá-lo.
