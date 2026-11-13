# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.0.2] - 2026-11-12

### Adicionado

- Casca visual das 7 abas da ficha Slayer (Personagem, Combate, Testes, Estados, Inventário, Diário, Configurações) a partir dos mockups aprovados em `assets/references/`.
- Paleta amostrada dos mockups, trilho lateral com ícones, selo da aba ativa e janela estreita com trilho só de ícones.
- Ícone da Respiração a partir de `assets/icons/breathing/` quando o nome bate.
- Ações Completa e Épica e o teto de 3 Marcas de Morte, conforme as regras do sistema.
- `plans/ficha-slayer-escopo-visual.md`: campos pendentes por aba e a fonte de regra de cada um.

### Corrigido

- Retrato: `data-action="editImage"` com `data-edit="img"` (o template anterior usava `data-field`, que o handler do core não lê).

### Observações

- Sem mecânica: valores sem fórmula aparecem como "—" e nenhum dado de exemplo dos mockups foi usado.
- Validação visual feita em harness local; runtime no Foundry pendente.

## [0.1.0] - 2026-09-29

### Adicionado

- Bootstrap do repositório como Sistema do Foundry VTT v14 (`system.json`).
- Módulo mínimo (`module/night-assassins.mjs`) com hook `init` e log de versão.
- Internacionalização pt-BR (`lang/pt-BR.json`).
- Folha de estilo base vazia (`styles/night-assassins.css`).
- Mocks do Foundry e teste de fumaça (`tests/`).
- Workflows de CI e de release por tag `v*` (`.github/workflows/`).
- ADR-0004 sobre declaração de tipos de documento via `documentTypes`.
