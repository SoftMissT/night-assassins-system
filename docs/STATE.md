# STATE — Night Assassins System

Memória de sessão por feature. Atualizado ao fim de cada passo.

## Passo atual

**Passo 1 — Bootstrap do repositório.** Status: **spec conforme, aguardando
revisão.**

Criação do esqueleto do Sistema Foundry v14: manifesto (`system.json`), módulo
mínimo, i18n, mocks de teste, CI e esqueleto de release.

## Decisões confirmadas

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

## Verificações automatizadas (rodam a cada passo)

- `npm test` (runner `node --test`, escopo `tests/**/*.test.mjs`), todos
  verdes, nenhum teste desativado.
- Parse de `system.json` e `lang/pt-BR.json`.
- Invariantes do projeto (globals proibidos em `module/core/`, strings em
  i18n, `system.props` só em `module/migration/`).

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
