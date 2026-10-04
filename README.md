# Night Assassins System

Sistema próprio de **Night Assassins** para o Foundry Virtual Tabletop v14.

> **Em construção.** Esta branch é o reset documentado do **Night Assassins
> Rebirth**: existe a primeira ficha **Slayer nativa** em Foundry v14
> (`0.1.0-rebirth.1`, testes verdes), mas **ainda não é uma release
> instalável** — não há tag, release nem workflow de publicação. Para instalar
> o que existia antes desta reconstrução, use o snapshot
> [`archive/pre-rebirth-2026-10-03`](https://github.com/SoftMissT/night-assassins-system/tree/archive/pre-rebirth-2026-10-03).

## Onde estamos

| Documento | Conteúdo |
| --- | --- |
| [`docs/design/GUIA-VISUAL.md`](docs/design/GUIA-VISUAL.md) | Direção de arte e layout **aprovados** |
| [`docs/design/REFERENCIAS.md`](docs/design/REFERENCIAS.md) | Interpretação das 7 imagens aprovadas + regras de UX |
| [`plans/night-assassins-system-blueprint.md`](plans/night-assassins-system-blueprint.md) | Plano de construção em 14 passos |
| `system.json`, `module/`, `templates/`, `styles/`, `lang/` | Ficha **Slayer** nativa (rascunho funcional) |
| `tests/smoke.test.mjs` | `npm test` — 4 verificações de manifesto/layout/referências/formulário |
| `assets/` | Key art aprovada e ícones de respiração/armas/templates/macros |

O módulo legado construído sobre o Custom System Builder (CSB) existe apenas
no seu disco, em `night-assassins-csb-automation/` — é **gitignored e nunca é
versionado**.

## Requisitos (alvo)

- Foundry VTT v14
- Módulo [Dice So Nice!](https://foundryvtt.com/packages/dice-so-nice) (obrigatório em produção)

## Licença

MIT — ver [LICENSE](LICENSE).
