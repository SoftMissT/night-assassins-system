# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não publicado]

## [0.0.3] - 2026-11-13

### Adicionado

- **Lembretes de bônus:** lista no ator (aba Estados) com nome, escopo (Acerto, Defesa, Testes, Iniciativa, Dano, Toda rolagem), Vantagem/Desvantagem, bônus e usos; aparecem marcados no diálogo da rolagem certa e somem quando gastos. O diálogo também nomeia os status que causam Vantagem/Desvantagem (`statusRollFlags` devolve as fontes).
- **Acerto em sequência (legado hit-dialog):** 1–20 tentativas, cada resultado confirmado (Acertou/Errou/Encerrar), Acertou abre o dano; Ataque gasto uma vez; acerto sem arma usa o mesmo fluxo (crítico 20). CD opcional e visibilidade (`messageMode`, v14) em testes, ataques e dano.
- **Diálogo de dano (legado damage-dialog):** entradas com fórmula livre (dados, kh/kl, `@atributo`, sob whitelist), fixo, atributos e tipos de dano; "Dano da arma"; presets salvos no ator; PDR a gastar; crítico; prévia ao vivo. Botão "Rolar dano" no Combate.
- **Passivas das Respirações:** as 23 passivas do catálogo saem da tabela de Técnicas (nunca "Usar") e ficam numa seção Passivas com texto e estado. Automatizadas: Chamas · Esquentar (Fogo Fátuo na arma), Metal · Martelo do Julgamento, Vento · Sangue Especial (Cicatrizes/Resistência Vital no descanso longo), Neve · Congelar, Pedra · Quebra. As outras 19 continuam manuais (lista em `plans/plano-automacao-pendente.md`).
- **Armas e inventário:** tipos de Item `weapon` (43 armas do legado: 26 Nichirin e 17 especiais com dado evolutivo por Rank, via `tools/port-legacy-catalogs.mjs` → `module/catalogs/weapons.json`) e `gear` (consumível, equipamento, material, missão), com ficha própria (`module/sheets/item-sheet.mjs`).
- **Aba Inventário (mockup 05):** busca, filtros Todos/Armas/Equipamentos/Consumíveis/Materiais/Missão e seleção sem re-render, peso total, tabela com ações, painel de detalhes (Equipar, Atacar, Usar, Editar, Descartar com confirmação), "Arma do catálogo" e "Novo item"; uma arma equipada por vez.
- **Ataque com arma e crítico:** diálogo com atributo da arma (FOR/DEX), bônus manual e modo; proficiência pelo nome; gasta Ataque; crítico pela margem da arma (teto 20; Fadiga Corporal bloqueia); cartão "Acertou: rolar dano" com dano ×2 e +1 Fôlego no crítico; 2º golpe do Nitoryu (−2, sem atributo, dano fixo). Painel "Arma equipada" no Combate com troca de perfil.
- **Consumíveis:** "Usar" gasta 1 unidade, rola a cura nos alvos (ou em quem usa) e manda o efeito ao chat.
- **Passiva da Pedra (Quebra):** +1 por ação com dano de Concussão da arma, até FOR; cada Quebra baixa 1 na margem de crítico; zera no fim do combate.
- **Automação de combate** (`module/apps/combat-actions.mjs`): iniciativa (proposta 1d20 + DEX + bônus), Fôlego cheio no início/fim do combate e +1 no início do turno, ações zeradas no turno, Acerto gasta Ataque, crítico dá +1 Fôlego, cartão de dano com Aplicar/Metade/Curar, 0 PDV → À Beira da Morte com Queda Repetida. Só o cliente do Mestre ativo escreve nos ganchos.
- **Níveis da Forma à escolha:** o nível de Respiração N libera os níveis 1..N que a Forma define (Formas que pulam nível listam só os definidos); ao usar, um diálogo mostra custo/dano de cada nível e o jogador escolhe. Nível e PDR são revalidados no `useForm`. Tabela mostra faixa de níveis e de PDR.
- **Bônus manual em toda rolagem:** testes de atributo, perícias, Acerto/Bloqueio/Esquiva, iniciativa e dano de Forma abrem um diálogo com bônus automáticos e suas fontes, campo de bônus manual (`+2`, `-1`, `1d4`; só dados e números passam) e modo; Shift-clique rola direto.
- **Respirações:** 300 Formas portadas do legado (`tools/port-legacy-catalogs.mjs` → `module/catalogs/`), liberadas pelo nível de Respiração, gastando PDR e ação e rolando dano; 43 Respirações na escolha.
- **Bônus do legado:** 10 canais (Dom, Metal/Cor, bônus fixos) em `module/core/bonuses.mjs`; atributos totais com origem de cada parcela.
- **Patente, nível de Respiração e marcos por nível** do catálogo do legado (`module/core/levels.mjs`).
- **40 status** do sistema em `CONFIG.statusEffects`; Vantagem/Desvantagem e Fadiga Mental ajustam a rolagem.
- Criação: Origem com 2 chances, pergunta "o Mestre deixou escolher?" no fluxo (aviso no chat), Respiração em lista, atributo da Marca do Destino.

- Capa neutra (placeholder tipográfico) nos tipos `setup` (16:9) e `cover` (2:1) do manifesto.
- Fonte Cinzel empacotada (`assets/fonts/cinzel-latin.woff2`, SIL OFL 1.1 em `Cinzel-OFL.txt`), com Georgia de fallback.
- Bloco próprio da Ação Épica (1 por arco) na aba Estados, com custo, efeito e consequência da regra.
- Testes: mídia do manifesto existe no pacote; fonte e licença empacotadas.

- **Mecânica (fatia 1):** `module/core/progression.mjs` (Origens d12, Dons d100, snapshots 1/3/7, PDV/PDR máximos, Fôlego = 2 + FDV, Rank da Classe) e `prepareDerivedData` no `SlayerData`; teste dourado Ninja níveis 1–14.
- **Rolagens:** `module/core/checks.mjs`; testes de atributo e perícia `1d20 + atributo`, Bloqueio (FOR), Esquiva (DEX) e Acerto (FOR ou DEX por diálogo), com Normal/Vantagem/Desvantagem, no chat com Dice So Nice.
- **Ficha:** painel Progressão (+1 nos níveis 3 e 7, escolha do nível 14, Dom do Sangue), contadores de ação com "Novo turno", Marcas de Morte (0–3) e quedas, Ação Épica marcável, Ajuste do Mestre nos máximos.

- **Criação nível 0 → 1** (assistente `module/apps/slayer-creation.mjs`): atributos por valores padrão, 7d4 (até 3 tentativas, a 3ª obrigatória) ou Discord, com distribuição que usa cada valor uma vez; Origem por 1d12; Dom do Sangue por 2d100 (3d100 para Descendente Perdido ou sangue antigo), fica o maior; Respiração Primária e arma proficiente; resumo com PDV/PDR/Fôlego do nível 1. Toda rolagem vai ao chat e espera o Dice So Nice.
- **Subir de nível** (`module/apps/level-up.mjs`): prévia do ganho de PDV/PDR, +1 obrigatório nos níveis 3 e 7, Classe no nível 4 (Rank C), escolha do nível 14; o PDV/PDR atual sobe junto com o ganho; resumo no chat.
- **Permissões do Mestre** (configurações do mundo): jogadores escolherem Origem, escolherem Dom, exceção de Classe no nível 1. O Mestre sempre pode escolher e marcar "sangue antigo".
- `module/core/creation.mjs` (tabelas d12/d100, tentativas de 7d4, contador do Discord, distribuição) e `module/core/oni.mjs` (PDV/PDK do Oni por nível, 20 Origens Oni), com testes.

### Corrigido

- Ícones do cabeçalho da janela (menu, ficha, fechar) apareciam como quadrados: o reset de fonte da ficha pegava os botões da moldura; agora vale só em `.window-content`.
- Item ativo do trilho com dois círculos (outline e sombra do `button.active` do core).
- Passivas (Esquentar, Sangue Especial...) apareciam como Formas com "Usar".
- Títulos de painel quebravam em duas linhas ("Combate rápido"); botões desabilitados pareciam ativos.
- PDV/PDR/Fôlego atuais nunca passam do máximo (`clampToMax` no `prepareDerivedData` e no `_preUpdate`); a ficha mostrava PDR 39/35.
- Tipos de dano das armas especiais vinham como texto, não lista.

### Alterado

- Barras de PDV/PDR/Fôlego no padrão dos mockups: barra grossa com brilho, "atual / máximo" em texto, valor atual editável sem caixa. Emblema da seção em hexágono; título de Técnicas não quebra mais.
- Abas pelo `changeTab` nativo (sem re-render); atributos não são mais digitados (correção só pelo Mestre); painel Progressão trocado por Marcos do nível; Classe só aparece no nível 4 (ou exceção); token do Caçador nasce vinculado.
- Nível começa em 0 (não criado); nível, Origem, Dom e ganhos de progressão só o Mestre edita à mão.
- `attributes` passa a guardar o valor de criação; o atual é derivado. Máximos de PDV/PDR/Fôlego deixam de ser digitados.
- Ação Épica saiu do bloco de ações do turno.
- Capa com arte de terceiros fica só local (`.gitignore`), fora do commit e do zip.

### Validação

- Foundry 14.367 isolado, rodada 2 (2026-11-13):
  - cabeçalho com ícones Font Awesome e trilho com um círculo só;
  - SAB com Fadiga Mental mostra "Desvantagem: Fadiga Mental (status)" e rola `2d20kl + 1 + 1` com a Bênção, mais o cartão de CD;
  - sequência de 2 acertos: Vantagem do lembrete, dano com "+2", Ataque gasto uma vez, lembretes de uso único consumidos e cartões sem o botão de dano duplicado;
  - diálogo de dano: `(2d6 + 4 + 2 + 5) * 2`, PDR 35 → 33, preset salvo;
  - Chamas: calor 28 → 30, técnica `2d4 + 1d6`, acerto "Fogo Fátuo +2", queima de 2 PDV por turno com calor 60, zerando no fim do combate;
  - Metal: Martelo `ceil((5) / 2)` sem gastar Ataque;
  - Vento: "Aplicar dano" com tipo Cortante soma 7, descanso longo dá Cicatriz +1 e o CAR soma;
  - Neve: Congelar só no "Acertou", e com 5 acúmulos aplica Restrição de Movimentos no alvo e gasta a Ação Única;
  - dano de Forma consome o lembrete "+3".
- Foundry 14.367 isolado (2026-11-13), mundo relançado com os tipos de Item novos:
  - inventário: filtro, busca e seleção sem re-render; uma arma equipada por vez; drop de Item;
  - ataque com Shift no maior atributo (DEX 7 > FOR 4);
  - 2º golpe Nitoryu `1d20 - 2`; crítico pelo botão do chat `(5) * 2` com Fôlego 2 → 3;
  - Quebra da Pedra 19 → 18 → 17, zerando no fim do combate;
  - Bandagens 5 → 4 com cura; PDV 999 limitado a 122;
  - 0 erros do sistema no console.
- Foundry 14.367 isolado: Ninja nível 7 dá PDV 117 / PDR 35 / Fôlego 5 na ficha; rolagens, contadores, Marcas e Ajuste do Mestre conferidos; antes disso, 7 abas, persistência de 15 campos ao fechar/reabrir, FilePicker do retrato, jogador dono edita; 0 erros de console.

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
