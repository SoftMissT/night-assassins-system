---
title: "Requisitos — Night Assassins System"
created: 2026-09-29
status: proposta
type: requisitos
projeto: night-assassins-system
blueprint: plans/night-assassins-system-blueprint.md
tags:
  - night-assassins
  - sdd
  - ears
  - requisitos
---

# Requisitos

Especificação em EARS dos requisitos do Night Assassins System. Este documento
precede o código: cada passo de implementação de 3 a 14 deriva de ao menos um
`REQ-###`. Requisitos são extraídos das fontes listadas abaixo, na ordem de
prioridade definida pelo controlador.

- **Sintaxe:** `WHEN <condição>, THE SYSTEM SHALL <comportamento>`, com
  `IF`/`WHILE` quando a fonte descrever condição ou estado.
- **IDs:** `REQ-###` únicos, sequenciais, agrupados por categoria.
- **Fonte:** todo requisito cita arquivo e, quando houver, versão declarada.

## Fontes

- **README.md:** `night-assassins-csb-automation/README.md`, versão declarada
  **v0.11.84**.
- **CHANGELOG.md:** `night-assassins-csb-automation/CHANGELOG.md`, até
  **v0.11.84** (SHA `d51152a`).
- **DECISIONS.md:** base canônica na Hive,
  `knowledge/projects/night-assassins-csb-automation/system/DECISIONS.md`.
- **MEMORY.md:** Hive, `system/MEMORY.md`.
- **STATE.md (Hive):** Hive, `system/STATE.md`.
- **TASK.md:** Hive, `tasks/TASK.md`.
- **lessons.md:** Hive, `tasks/lessons.md`.
- **specs/…:** Hive, `specs/<arquivo>.md`.
- **docs/specs/…:** Hive, `docs/specs/<arquivo>.md`.
- **docs/…:** Hive, `docs/<arquivo>.md`.
- **Blueprint:** `plans/night-assassins-system-blueprint.md`.

## 1. Atributos e progressão

### REQ-001 — Atributo final via display

WHEN uma rolagem ou fórmula precisar de um atributo final, THE SYSTEM SHALL ler
o valor de `*_display`, usando `*_config` como fallback, mantendo os sete
atributos compartilhados (`vit_display`, `dex_display`, `for_display`,
`car_display`, `fdv_display`, `int_display`, `sab_display`) em keys neutras, sem
namespace de espécie.

- **Fonte:** CHANGELOG.md v0.11.84 (0.5.6); specs/2026-08-07-namespaces-slayer-oni.md; DECISIONS.md ADR-002

### REQ-002 — Criação de atributos do Slayer

WHEN um Slayer alcançar o nível 1, THE SYSTEM SHALL abrir a criação de
atributos, exibir o pool rolado marcando cada ocorrência já usada, persistir os
snapshots dos níveis 1, 3 e 7 e encerrar silenciosamente ao cancelar, sem gravar
distribuição parcial.

- **Fonte:** specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-008); CHANGELOG.md v0.11.84 (0.2.5, 0.11.39)

### REQ-003 — Escolha única do nível 14 do Slayer

WHEN um Slayer alcançar o nível 14, THE SYSTEM SHALL oferecer uma escolha única
entre `PDV + VIT × 3` e `PDR + FDV × 2`, persistida em `nvl_14_bonus_choice`.

- **Fonte:** CHANGELOG.md v0.11.84 (0.11.45, 0.11.44)

### REQ-004 — Classes do Slayer e rank por nível

THE SYSTEM SHALL oferecer as cinco Classes do Slayer (Mestre de Batalha,
Usuário de Veneno, Kakushi, Companheiro de Oni e Usuário de Duas Respirações)
com rank derivado do nível — C em 4–5, B em 6–7, A em 8–10, S em 11 e SS em
12–14 — escolhidas no nível 4, exibindo Rank C já no nível 1 para as classes
Usuário de Duas Respirações e Companheiro de Oni.

- **Fonte:** docs/specs/class-mechanics-v1.md; docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-005 — Mestre de Batalha no nível 11

WHEN o Mestre de Batalha alcançar o nível 11 (Rank S), THE SYSTEM SHALL rolar
`2d6` de PDV uma única vez e persistir o ganho para impedir reaplicação ao
recarregar a ficha ou trocar temporariamente o nível.

- **Fonte:** docs/specs/class-mechanics-v1.md; CHANGELOG.md v0.11.84 (0.11.44)

### REQ-006 — Origens e Habilidades Especiais do Slayer

THE SYSTEM SHALL representar as 12 Origens do Slayer com duas habilidades cada
e as 10 Habilidades Especiais / Dons do Sangue com displays nos níveis 1, 6 e
12, usando o dropdown canônico `hab_escolhida` (chave base
`hab_escolhida_base`).

- **Fonte:** docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-007 — Criação de atributos do Oni

WHEN um Oni alcançar o nível 1, THE SYSTEM SHALL aceitar a distribuição
`4, 3, 2, 2, 1, 1, 1` ou sete `1d4` e, em seguida, exigir `+1` em exatamente
três características distintas, recusando escolha repetida, incompleta ou
inválida, e não gravando snapshot parcial ao cancelar qualquer etapa.

- **Fonte:** MEMORY.md; specs/2026-09-06-oni-criacao-tres-bonus.md; CHANGELOG.md v0.11.84 (0.11.69)

### REQ-008 — Progressão de nível N1–N20

THE SYSTEM SHALL progredir Slayer e Oni de N1 a N20, persistir cada ganho rolado
de PDV/PDK dos níveis 2–12 uma única vez (nunca rerrolado ao renderizar a
ficha) e aplicar os ganhos de atributo do Oni nos níveis 3, 4, 6, 8 e 11 (à
escolha), 12 (dois atributos), 13 (Corpo Demoníaco em VIT/FOR/DEX) e 16
(`+2 FDV` automático).

- **Fonte:** docs/specs/resource-bars-and-oni-foundation-v1.md; docs/ONI-MODELO-PDV-PDK-ATRIBUTOS.md; CHANGELOG.md v0.11.84 (0.6.0, 0.11.15)

### REQ-009 — Fôlego e deslocamento

THE SYSTEM SHALL calcular o Fôlego máximo do Slayer como `2 + FDV final` e o
deslocamento como `7 + DEX` metros.

- **Fonte:** docs/specs/rest-mechanics-v1.md; CHANGELOG.md v0.11.84 (0.5.10, 0.5.9)

## 2. Combate

### REQ-010 — Crítico pelo perfil da arma

WHEN um Acerto usar arma, THE SYSTEM SHALL obter o limiar de crítico do perfil
da arma — nunca fixá-lo globalmente em 20 — respeitando o piso mundial
configurável pelo GM.

- **Fonte:** README.md v0.11.84; docs/specs/weapon-templates-and-combat-pipeline-v2.md (RF-009); CHANGELOG.md v0.11.84 (0.11.13)

### REQ-011 — Acerto sequencial de 1 a 20

THE SYSTEM SHALL aceitar de 1 a 20 rolagens de Acerto independentes por técnica,
publicar cada resultado separadamente, não consumir a economia de ações por
rolagem e não gerar rolagem adicional ao encerrar ou cancelar a sequência.

- **Fonte:** specs/2026-08-07-economia-acoes-slayer.md; CHANGELOG.md v0.11.84 (0.5.1, 0.5.4, 0.5.7)

### REQ-012 — Dano em parcelas e crítico sobre o total

THE SYSTEM SHALL rolar dano em parcelas separadas, preservando tipo de ação,
tipos de dano, crítico, Marca do Caçador, Dice So Nice e total final, e WHEN o
ataque for crítico, THE SYSTEM SHALL duplicar o total final depois de dados e
bônus e antes da resistência, sem duplicar cada parcela isoladamente.

- **Fonte:** CHANGELOG.md v0.11.84 (0.5.7); tasks/lessons.md; docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-013 — Relay de dano e cura entre atores

WHEN dano ou cura atingir outro Actor, THE SYSTEM SHALL resolver o campo correto
por tipo (`*_dano_tomado`, `*_dano_ferida`, `*_curado`), aplicar diretamente se
houver ownership e, caso contrário, solicitar aprovação do GM pelo socket do
módulo; ao usar o botão de Dano, SHALL abrir a escolha "Dano ou Cura?" antes de
resolver contra o alvo, sem afetar fluxos automáticos.

- **Fonte:** README.md v0.11.84; CHANGELOG.md v0.11.84 (0.11.5); specs/2026-09-01-recuperacao-npc-minion-dano-fixo.md

### REQ-014 — Economia de ações e reset por hooks

THE SYSTEM SHALL controlar a economia de ações — Movimento, Ataque e Especial
com base 1 e reset no início do turno; Única e Reação com base 1 e reset por
rodada; Completa consumindo Movimento e Ataque atomicamente; Livre e Defesa sem
contador — e WHEN a rodada ou o turno mudar no Combat nativo, SHALL restaurar as
ações pelo GM autoritativo, sem depender da interface do Combat Tracker Dock.

- **Fonte:** specs/2026-08-07-economia-acoes-slayer.md; DECISIONS.md ADR-003

### REQ-015 — Ações especiais fora do contador comum

THE SYSTEM SHALL manter Ações Épica, Lendária, de Covil e de Vilão fora do
contador comum, com fluxo próprio de GM, custo e consequência.

- **Fonte:** specs/2026-08-07-economia-acoes-slayer.md; CHANGELOG.md v0.11.84 (0.5.0)

### REQ-016 — Consumo único de ação

WHEN uma técnica consumir uma ação, THE SYSTEM SHALL consumi-la exatamente uma
vez, impedindo novo consumo por fluxos internos que já consumiram ação e não
consumindo nada ao cancelar.

- **Fonte:** tasks/lessons.md; docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-017 — Ações do Oni em namespace próprio

THE SYSTEM SHALL persistir ações do Oni em `acoes_oni_dados`/`acoes_oni_resumo`,
sem escrever nenhuma key de ação do Slayer no atacante Oni.

- **Fonte:** CHANGELOG.md v0.11.84 ([Unreleased] Recuperação do contrato Oni); docs/specs/attack-builder-v1.md (RF-014)

### REQ-018 — Identidade do alvo

WHEN o alvo não tiver identidade Slayer/Oni, THE SYSTEM SHALL rejeitá-lo sem
atualização, em vez de tratá-lo automaticamente como Oni.

- **Fonte:** CHANGELOG.md v0.11.84 (0.9.2); docs/specs/attack-builder-v1.md (RF-016)

### REQ-019 — Montador de Ataque

THE SYSTEM SHALL montar o Ataque a partir de armas portadas com perfil
executável e Formas ativas com dano no nível selecionado, permitindo Arma sem
Forma, Forma sem Arma e Dano Manual, e não gastando ação, PDR ou rolagem ao
cancelar.

- **Fonte:** docs/specs/attack-builder-v1.md; CHANGELOG.md v0.11.84 (0.9.1)

### REQ-020 — Dano puramente fixo

WHEN uma entrada de dano for puramente fixa (`fixo: 5`, `dado: ""`), THE SYSTEM
SHALL produzir total 5 sem inventar dado.

- **Fonte:** specs/2026-09-01-recuperacao-npc-minion-dano-fixo.md; CHANGELOG.md v0.11.84 (0.11.41)

### REQ-021 — Perfis das armas normais

THE SYSTEM SHALL reproduzir os perfis oficiais das armas normais — Katana
Nitoryu com dois golpes fixos 5 (`-2` e sem FOR/DEX no segundo Acerto) e Morote
fixo 7; Double Blade Ryōtō com dois golpes fixos 5; Manoplas/Soqueiras com
`3 + floor(max(DEX, FOR) / 2)`; Cutelos Gêmeos com `4 + floor(max(DEX, FOR) / 2)`
e aparo por Reação CD 16 — e WHEN um golpe de Manoplas for crítico, SHALL
conceder `+1` cumulativo ao próximo Acerto e criar Acerto extra de
`1 + max(DEX, FOR)`; WHEN uma arma tiver múltiplos modos, SHALL pedir o modo e
persistir a escolha no Item embutido.

- **Fonte:** docs/specs/weapon-templates-and-combat-pipeline-v2.md (RF-007, RF-008, RF-013); CHANGELOG.md v0.11.84 (0.11.13)

### REQ-022 — Dice So Nice e modalidade dos diálogos

WHEN uma rolagem contiver dados, THE SYSTEM SHALL aguardar a animação do Dice So
Nice antes de publicar o resultado, sem preceder `ChatMessage.create` com
`rolls` de chamada manual que duplique a animação; THE SYSTEM SHALL abrir o
diálogo de dano como modal (`modal: true`), largura 720, scroll interno nas
entradas, rodapé fixo e nenhum diálogo aninhado.

- **Fonte:** tasks/lessons.md (lição 11); CHANGELOG.md v0.11.84 (0.11.41, 0.11.81, 0.11.84); specs/2026-09-28-presets-de-dano.md

### REQ-023 — Resolvedor de bônus derivados

THE SYSTEM SHALL centralizar bônus derivados (Acerto, Bloqueio, Esquiva,
Percepção e Dano) em um resolvedor puro, sem gravar totais derivados redundantes
e sem dupla contagem de Respiração ou Status, mantendo dano tipado em parcelas
separadas.

- **Fonte:** specs/2026-08-25-bonus-derivados-slayer.md; CHANGELOG.md v0.11.84 (0.11.14)

## 3. Respirações

### REQ-024 — Respirações publicadas

THE SYSTEM SHALL publicar somente as seis Respirações com motor dedicado —
Chamas, Pedra, Névoa, Metal, Neve e Vento — mantendo a Água fora do publicado.

- **Fonte:** README.md v0.11.84; CHANGELOG.md v0.11.84 (0.11.79); specs/2026-09-28-presets-de-dano.md

### REQ-025 — Conteúdo auditado por Respiração

THE SYSTEM SHALL distribuir os conteúdos auditados: Chamas (9 Estilos +
Esquentar), Pedra (5 Estilos), Névoa (8 Formas + 3 Padrões), Metal (5 Formas +
Martelo do Julgamento), Neve (7 Formas + Congelar) e Vento (9 Estilos + Sangue
Especial).

- **Fonte:** README.md v0.11.84

### REQ-026 — Campos das Formas

THE SYSTEM SHALL representar cada Forma com níveis 1–4, requisito, custo, ação,
dano, estados persistentes, recarga, cargas e usos diários conforme a fonte.

- **Fonte:** CHANGELOG.md v0.11.84 (0.5.16, 0.6.0); docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-027 — Passivas não são Formas ativas

THE SYSTEM SHALL identificar Formas passivas sem executá-las como ativas,
mantendo Esquentar automática, sem custo de ação ou PDR.

- **Fonte:** CHANGELOG.md v0.11.84 (0.8.3)

### REQ-028 — Dano tipado das Formas

WHEN uma Forma rolar dano, THE SYSTEM SHALL carregar e propagar o tipo de dano
(`tipo_dano_base`, `nvlN_tipos_dano`) para a resistência e o relay, em vez de
enviá-lo como "Sem tipo".

- **Fonte:** CHANGELOG.md v0.11.84 (0.5.19)

### REQ-029 — Bônus temporários de Respiração

THE SYSTEM SHALL persistir os bônus temporários de Respiração separados de Marca
e status e somá-los nos `*_display` correspondentes via
`*_resp_bonus_temp_slayer`.

- **Fonte:** specs/2026-08-08-respiracao-agua-campos-e-painel-gm.md

### REQ-030 — Estado por arma e acumuladores

THE SYSTEM SHALL rastrear o estado de Chamas e Pedra por arma sincronizada —
não globalmente no Actor — e manter, por Respiração, apenas passivas e
acumuladores (`resp_passivas_estado`), com custo, ação, calor e crítico
oficiais.

- **Fonte:** CHANGELOG.md v0.11.84 (0.11.7); specs/2026-09-28-presets-de-dano.md; CHANGELOG.md v0.11.84 (0.11.76)

### REQ-031 — Encadeamento de Forma

WHEN uma Forma permitir encadear, THE SYSTEM SHALL bloquear `Encadear Forma`
para Oni comum e liberá-lo somente ao Exterminador Corrompido.

- **Fonte:** CHANGELOG.md v0.11.84 (0.11.46); STATE.md (Hive)

## 4. Oni

### REQ-032 — Namespace de recursos do Oni

THE SYSTEM SHALL usar `pdv_oni_*` e `pdk_oni_*` no Oni, garantindo que nenhuma
key `pdr_oni` permaneça no template distribuído.

- **Fonte:** DECISIONS.md ADR-002; docs/specs/resource-bars-and-oni-foundation-v1.md

### REQ-033 — Cadeias literais de PDV/PDK

THE SYSTEM SHALL preservar literalmente as cadeias `pdv_oni_nvl1..20` e
`pdk_oni_nvl1..20` fornecidas pelo operador — inclusive referências repetidas de
VIT/FDV e constantes por nível — e WHEN a fórmula de PDV do nível N usar VIT,
SHALL referenciar exclusivamente `vit_oni_nvlN`, sem normalizar ou simplificar a
fórmula.

- **Fonte:** specs/2026-08-28-p0-oni-pdv-reset-sheet.md; specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-004, RF-005)

### REQ-034 — Regeneração do Oni

THE SYSTEM SHALL executar a Regeneração Oni uma vez por turno (teste CD 12 nos
níveis 2/5/9; cura por VIT no início do turno a partir do 13, nunca duas vezes no
mesmo turno), respeitar os bloqueadores (Solar, Glicínia, Nichirin, Regeneração
Suprimida) e recuperar PDK pela mordida.

- **Fonte:** README.md v0.11.84; docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md; CHANGELOG.md v0.11.84 (0.11.46, 0.10.0)

### REQ-035 — Oni fora das mecânicas de Slayer

THE SYSTEM SHALL não aplicar ao Oni a Vida e Morte, o Fôlego nem a Marca do
Caçador do Slayer.

- **Fonte:** README.md v0.11.84; docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-036 — Origens do Oni

THE SYSTEM SHALL representar as 21 Origens Oni com PDV/PDK iniciais, incluindo o
caso especial do Exterminador Corrompido.

- **Fonte:** CHANGELOG.md v0.11.84 (0.10.0); docs/ONI-MODELO-PDV-PDK-ATRIBUTOS.md

### REQ-037 — Especializações do Oni

THE SYSTEM SHALL representar as 10 Especializações Oni, cada uma com 20 graus e
ranks D a SS.

- **Fonte:** CHANGELOG.md v0.11.84 (0.10.0)

### REQ-038 — Pipeline de Kekkijutsu

THE SYSTEM SHALL validar nível, PDK e ação de um Kekkijutsu antes de usá-lo,
montar o ataque, registrar uso e potenciar, cobrando custo de PDK e ação uma
única vez e sem generalizar efeitos ausentes ou duplicar efeitos de
turno/rodada.

- **Fonte:** CHANGELOG.md v0.11.84 (0.10.0); specs/2026-08-22-kekkijutsu-ui-integration.md; docs/GUIA-DO-OPERADOR-FICHA-REGRAS-E-TESTES.md

### REQ-039 — Oni Minion

THE SYSTEM SHALL representar o Oni Minion com tipos, pacotes de atributos,
ataques, traços, fraquezas e PDV/PDK próprios.

- **Fonte:** README.md v0.11.84; CHANGELOG.md v0.11.84 (0.10.0)

### REQ-040 — Painel do GM

THE SYSTEM SHALL classificar Slayer/Oni/Minion/NPC no painel do GM, extrair
PDV/PDR/PDK de cada um e detectar bloqueadores de regeneração e ações lendárias.

- **Fonte:** CHANGELOG.md v0.11.84 (0.10.0); specs/2026-08-08-respiracao-agua-campos-e-painel-gm.md

## 5. Status e resistências

### REQ-041 — Resistência tipada

THE SYSTEM SHALL tratar Resistência como seleção de múltiplos tipos oficiais de
dano, persistida em `status_slayer_resistencias_dados` (CSV) e resumida em
`status_slayer_resistencias_resumo`/`_display`, nunca como booleano universal;
WHEN o dano recebido tiver tipo selecionado, SHALL reduzir metade do dano final
apenas nesse caso, e WHEN zero tipos forem salvos, SHALL gravar "Nenhuma
resistência" no resumo.

- **Fonte:** specs/2026-08-07-resistencias-slayer.md; DECISIONS.md ADR-003

### REQ-042 — Ferida como tipo de dano

THE SYSTEM SHALL tratar Ferida como tipo de dano que reduz o PDV máximo,
acumulando em `pdv_slayer_dano_ferida`/`pdv_oni_dano_ferida`, sem checkbox de
status paralelo, e SHALL acumular dano comum em `*_dano_tomado`, mantendo o dano
de Ferida em campo separado.

- **Fonte:** DECISIONS.md ADR-003; tasks/lessons.md (lição 5); specs/2026-08-07-resistencias-slayer.md; CHANGELOG.md v0.11.84 (0.2.4)

### REQ-043 — Status e contrato versionado

THE SYSTEM SHALL representar os 35 status oficiais do Slayer com gatilhos
distintos — aplicação, início do turno, fim do turno, dano recebido, descanso e
remoção manual — persistidos no contrato versionado `status_slayer_dados`
(`active`, `exhaustion`, `effects`), sem transformá-los em contador genérico e
criando entrada em `effects` somente para os status que exigem dados adicionais.

- **Fonte:** specs/2026-08-07-motor-status-slayer.md; specs/2026-08-07-status-slayer-base.md

### REQ-044 — Reaplicação de status

WHEN um status for reaplicado, THE SYSTEM SHALL seguir a regra própria — Corroído
empilha; Em Chamas reinicia a duração sem empilhar; dano contínuo usa a fórmula e
a duração da fonte.

- **Fonte:** specs/2026-08-07-motor-status-slayer.md

### REQ-045 — Exaustão de 0 a 8

THE SYSTEM SHALL tratar Exaustão como nível acumulativo de 0 a 8, com marcos
instantâneos 5 e 8 idempotentes, 3 bloqueando movimento, 6 dobrando dano, 7
retirando o turno sem bloquear Defesa e 8 decretando morte.

- **Fonte:** specs/2026-08-07-motor-status-slayer.md; CHANGELOG.md v0.11.84 (0.4.0)

### REQ-046 — Vulnerável

THE SYSTEM SHALL dobrar o dano recebido por Vulnerável depois do acerto e antes
de acumular o dano.

- **Fonte:** specs/2026-08-07-motor-status-slayer.md

### REQ-047 — Tick idempotente

THE SYSTEM SHALL processar turnos e efeitos persistentes pelo GM ativo de menor
ID, usando a chave `combatId:round:turn:combatantId` gravada antes da resolução
para impedir duplicidade.

- **Fonte:** specs/2026-08-07-motor-status-slayer.md

### REQ-048 — Duração só quando a fonte define

THE SYSTEM SHALL criar contador de duração somente quando a regra ou a fonte o
exigir, sem propor `*_turnos` para todas as condições.

- **Fonte:** tasks/lessons.md (lição 6); DECISIONS.md ADR-003

### REQ-049 — Efeitos no pós-resolução

WHEN resistência ou anulação decidir o ataque, THE SYSTEM SHALL aplicar efeitos
de contato apenas no pós-resolução, distinguindo anulação integral de parcela
reduzida a zero.

- **Fonte:** tasks/lessons.md (lição 12)

### REQ-050 — Passivas idempotentes por ação

WHEN uma passiva limitada por ação disparar, THE SYSTEM SHALL usar `actionId`
idempotente, impedindo duplicação por múltiplas parcelas ou ataques internos.

- **Fonte:** tasks/lessons.md (lição 13)

### REQ-051 — Namespaces de status e hooks do Combat

THE SYSTEM SHALL separar `status_slayer_*` de `status_oni_*` e integrar Status,
Resistência e Ferida aos hooks nativos do Combat, com um único GM autoritativo.

- **Fonte:** DECISIONS.md ADR-003; specs/2026-08-07-motor-status-slayer.md

## 6. Vida e Morte

### REQ-052 — Queda a 0 PDV e Queda Repetida

WHEN o PDV canônico do Slayer chegar a 0, THE SYSTEM SHALL entrar em "À Beira da
Morte", incrementar as quedas do combate e aplicar as Marcas iniciais pela Queda
Repetida (1ª queda em 0, 2ª em 1, 3ª em 2 e 4ª em morte imediata, salvo
intervenção narrativa do GM), além dos status negativos correspondentes.

- **Fonte:** specs/2026-08-11-vida-morte-automacao.md; docs/specs/life-and-death-mechanics-v1.md

### REQ-053 — Teste de Morte no início do turno

WHEN o turno do Slayer começar e ele não estiver estabilizado em "À Beira da
Morte", THE SYSTEM SHALL rolar um Teste de Morte `1d20` físico sem atributo: 1
natural desperta com `1d4 + VIT` e +1 Exaustão; 2–10 nada muda; 11–19 ganha +1
Marca; 20 oferece Determinação Final.

- **Fonte:** specs/2026-08-11-vida-morte-automacao.md

### REQ-054 — Dano em 0 PDV

WHEN o Slayer em "À Beira da Morte" receber dano, THE SYSTEM SHALL acrescentar
+1 Marca de Morte e, IF o dano for crítico, Dano de Ferida, decapitação ou
execução, SHALL abrir Determinação Final ou morte.

- **Fonte:** specs/2026-08-11-vida-morte-automacao.md; docs/specs/life-and-death-mechanics-v1.md

### REQ-055 — Cura em 0 PDV

WHEN o Slayer a 0 PDV receber cura, THE SYSTEM SHALL acordá-lo, zerar as Marcas
de Morte, aplicar +1 Exaustão, `desequilibrado` e `sem_reacao` até o início do
próximo turno, removendo `sem_reacao` quando a cura não vier de descanso.

- **Fonte:** specs/2026-08-11-vida-morte-automacao.md; docs/specs/life-and-death-mechanics-v1.md

### REQ-056 — Determinação Final

THE SYSTEM SHALL executar a Determinação Final por `DialogV2` com motivo, CD
15/18/20 ou personalizada pelo GM e Ajuda de Vínculo `+2` uma vez por combate,
retornando com 1 PDV, +2 Exaustão e `desorientado` em sucesso, morte em 1
natural e `1d4 + VIT` PDV com apenas +1 Exaustão em 20 natural.

- **Fonte:** specs/2026-08-11-vida-morte-automacao.md

### REQ-057 — Estabilização por aliado

WHEN um aliado estabilizar o Slayer caído, THE SYSTEM SHALL consumir Ação Única
e rolar `1d20 + INT ou SAB` contra CD 12, estabilizando em sucesso, removendo 1
Marca em 20 natural e adicionando 1 Marca em 1 natural.

- **Fonte:** specs/2026-08-11-vida-morte-automacao.md; docs/specs/life-and-death-mechanics-v1.md

### REQ-058 — Morte direta, PDV máximo e bloqueios

THE SYSTEM SHALL permitir ao GM declarar morte sem Teste pelo gerenciador,
calcular `slayerMaxPdv = total_conta − dano_ferida + extra` e bloquear ataques,
defesas, dano, Respiração, movimento e Reação enquanto o Slayer estiver "À Beira
da Morte" ou morto.

- **Fonte:** docs/specs/life-and-death-mechanics-v1.md; CHANGELOG.md v0.11.84 (0.8.1)

### REQ-059 — Pré-condições, autoridade e exclusão do Oni

WHEN o motor de Vida e Morte for acionado, THE SYSTEM SHALL exigir Slayer de
nível 1, sete snapshots N1 positivos e PDV total positivo, reagir somente a
mudanças relevantes, rodar apenas pelo GM primário com chaves idempotentes de
combate/turno e manter o Oni fora deste contrato.

- **Fonte:** CHANGELOG.md v0.11.84 (0.11.39, [Unreleased]); docs/specs/life-and-death-mechanics-v1.md; README.md v0.11.84

## 7. Descanso

### REQ-060 — Descanso de Campo

WHEN o jogador escolher Descanso de Campo (2h), THE SYSTEM SHALL rolar
`1d4 × VIT` (mínimo `1d4` com VIT 0 ou menor), recuperar até metade do PDR máximo
sem ultrapassá-lo, restaurar o Fôlego e oferecer somente os estados leves
permitidos.

- **Fonte:** docs/specs/rest-mechanics-v1.md; CHANGELOG.md v0.11.84 (0.5.11)

### REQ-061 — Descanso Completo

WHEN o jogador escolher Descanso Completo (8h), THE SYSTEM SHALL restaurar PDV,
PDR e Fôlego até o máximo e reduzir a Exaustão em 2.

- **Fonte:** docs/specs/rest-mechanics-v1.md

### REQ-062 — Recuperação Profunda

WHEN o jogador escolher Recuperação Profunda (24h+), THE SYSTEM SHALL restaurar
os recursos e permitir ao GM remover toda a Exaustão ou reduzi-la em 4.

- **Fonte:** docs/specs/rest-mechanics-v1.md

### REQ-063 — Interrupção rebaixa o benefício

WHEN um descanso for interrompido antes de completar a duração, THE SYSTEM SHALL
aplicar o rebaixamento oficial: Campo sem benefício; Completo com ao menos 2h
vira Campo; Profunda com ao menos 8h em local seguro vira Completo.

- **Fonte:** docs/specs/rest-mechanics-v1.md

### REQ-064 — Confirmação do GM e registro

THE SYSTEM SHALL exigir confirmação do GM primário em todo descanso (regra
antiabuso), gravar `descanso_slayer_dados` com tipo, duração concluída, horário
do mundo e marcador de cena, e não escrever no Actor quando não houver GM ativo,
houver recusa, fechamento do modal ou falha de validação.

- **Fonte:** docs/specs/rest-mechanics-v1.md; CHANGELOG.md v0.11.84 (0.5.11)

### REQ-065 — Recuperação limitada ao máximo

THE SYSTEM SHALL incrementar `pdv_slayer_curado` e `pdr_slayer_curado` com o
valor recuperado, limitando o resultado atual ao máximo e sem remover Ferida
automaticamente.

- **Fonte:** docs/specs/rest-mechanics-v1.md

### REQ-066 — Fadigas e atualização atômica

THE SYSTEM SHALL remover Fadiga Corporal, Espiritual e Mental apenas em Descanso
Completo e Recuperação Profunda (nunca no Campo), nunca remover `Ofegante` por
descanso e gravar recursos, status e `descanso_slayer_dados` em um único
`Actor#update`.

- **Fonte:** docs/specs/rest-mechanics-v1.md

## 8. Diagnóstico

### REQ-067 — Captura e Journal privado do GM

THE SYSTEM SHALL capturar erros atribuíveis ao Night Assassins nos clientes de
GM e de jogadores, transmiti-los pelo socket do módulo e consolidá-los em um
Journal visível somente para GMs.

- **Fonte:** specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-001); README.md v0.11.84

### REQ-068 — Fontes capturadas

THE SYSTEM SHALL capturar `Hooks.on("error")`, `window.error`,
`unhandledrejection`, `console.error` e `console.warn`.

- **Fonte:** specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-001)

### REQ-069 — Filtro por namespace

THE SYSTEM SHALL aceitar somente registros relacionados ao namespace, caminho,
macro, Compêndio ou prefixos do módulo e descartar mensagens exclusivas do core
Foundry e de outros módulos.

- **Fonte:** specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-001); CHANGELOG.md v0.11.84 (0.11.38)

### REQ-070 — Autoridade e ownership do Journal

THE SYSTEM SHALL permitir que apenas o GM primário crie e atualize o Journal,
com `ownership.default = NONE` e GMs ativos como `OWNER`.

- **Fonte:** specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-001)

### REQ-071 — Conteúdo do registro e deduplicação

THE SYSTEM SHALL registrar horário, usuário, Actor/token, cena, origem, mensagem,
stack, versões e ocorrência, agrupar repetições idênticas preservando primeira
ocorrência, última ocorrência e contador, e nunca persistir senhas, tokens de
sessão, cookies ou conteúdo de chat privado.

- **Fonte:** specs/2026-08-28-recuperacao-contrato-oni-e-diagnostico.md (RF-001)

### REQ-072 — Gerenciador e exportação do diagnóstico

THE SYSTEM SHALL oferecer ao GM ações para registrar erro, abrir o Journal e
exportar todas as páginas em Markdown ou JSON usando `saveDataToFile`, incluindo
páginas anteriores e aguardando a fila de gravação antes do download.

- **Fonte:** CHANGELOG.md v0.11.84 (0.11.47); README.md v0.11.84

### REQ-073 — Escape de texto narrativo

THE SYSTEM SHALL escapar nomes de Actor e texto narrativo escrito pelo usuário
antes de publicá-los em `ChatMessage`.

- **Fonte:** tasks/lessons.md (lição 15); CHANGELOG.md v0.11.84 (0.9.4)

## 9. Migração

### REQ-074 — Actors novos e antigos preservados

WHEN um mundo CSB for migrado, THE SYSTEM SHALL criar Actors novos do tipo
correto, mover os Actors antigos para a pasta "Legado CSB" e nunca apagá-los.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13); specs/2026-08-25-recuperacao-fichas-mundo.md

### REQ-075 — Backup antes de aplicar

WHEN o migrador for aplicar as alterações, THE SYSTEM SHALL exportar antes um
backup JSON dos Actors e Items afetados.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13)

### REQ-076 — Modo dry-run

THE SYSTEM SHALL oferecer modo dry-run que relata o que mudaria sem escrever
nada.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13)

### REQ-077 — Conversão por mapping e recriação de Items

WHEN migrar um Actor, THE SYSTEM SHALL converter `props` para `system.*` conforme
`mapping.json` e recriar os Items a partir dos Compêndios, aplicando sobrescritas
de dados.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13)

### REQ-078 — Reapontamento de tokens

WHEN os Actors novos forem criados, THE SYSTEM SHALL reapontar os tokens das
cenas para os Actors novos.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13)

### REQ-079 — Idempotência da migração

WHEN o migrador rodar de novo, THE SYSTEM SHALL não duplicar Actors, Items ou
escritas.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13)

### REQ-080 — Tipo por actor-kind e marcador de migração

THE SYSTEM SHALL decidir o tipo do Actor pela lógica de `actor-kind` do legado e
marcar `flags.night-assassins.migratedFrom` com a versão do módulo e a data.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13); CHANGELOG.md v0.11.84 (0.11.11)

### REQ-081 — Macro de migração com confirmação

THE SYSTEM SHALL expor uma macro GM "Migrar mundo CSB para o sistema" com
confirmação explícita antes de aplicar.

- **Fonte:** plans/night-assassins-system-blueprint.md (Passo 13)

### REQ-082 — Reidratação de dados legados

WHEN um Item legado tiver IDs de template remapeados ou propriedades apagadas,
THE SYSTEM SHALL reconhecê-lo pelos dados reais e reidratá-lo a partir do
catálogo canônico, com reparos idempotentes.

- **Fonte:** README.md v0.11.84; CHANGELOG.md v0.11.84 (0.11.53)

### REQ-083 — Fronteiras de compatibilidade

THE SYSTEM SHALL restringir a leitura de `system.props` a `module/migration/` e
aos fixtures do legado, mantendo o repositório legado intocado e consultável.

- **Fonte:** plans/night-assassins-system-blueprint.md (invariantes); ADR-0001

## Rastreabilidade Passos × REQ

Fundamentação de cada passo de implementação (3 a 14) nos requisitos acima.
Nenhum passo fica sem ao menos um `REQ`.

- **Passo 3 — Extrator de contrato dos templates CSB:** REQ-001, REQ-002, REQ-032, REQ-041, REQ-043, REQ-047
- **Passo 4 — Classificação do contrato e inventário de fórmulas:** REQ-005, REQ-008, REQ-033, REQ-036, REQ-038
- **Passo 5 — DataModel base e Slayer:** REQ-001, REQ-002, REQ-003, REQ-006, REQ-009
- **Passo 6 — DataModel Oni e Oni Minion:** REQ-032, REQ-036, REQ-037, REQ-039
- **Passo 7 — DataModel NPC e Items:** REQ-010, REQ-019, REQ-021, REQ-025, REQ-038
- **Passo 8 — Lógica pura:** REQ-008, REQ-023, REQ-033, REQ-035, REQ-043, REQ-047, REQ-050, REQ-051
- **Passo 9 — Serviços de combate:** REQ-011, REQ-012, REQ-013, REQ-014, REQ-016, REQ-018, REQ-022, REQ-023
- **Passo 10a — Respirações:** REQ-024, REQ-025, REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031
- **Passo 10b — Oni:** REQ-034, REQ-036, REQ-037, REQ-038, REQ-040
- **Passo 10c — Dupla Alma, armas especiais e estados avançados:** REQ-023, REQ-031, REQ-046, REQ-066
- **Passo 11 — Fichas e painéis (ApplicationV2):** REQ-001, REQ-002, REQ-006, REQ-009, REQ-040
- **Passo 12 — Compêndios e pipeline de build:** REQ-021, REQ-025, REQ-026, REQ-037
- **Passo 13 — Migrador de mundos CSB:** REQ-074, REQ-075, REQ-076, REQ-077, REQ-078, REQ-079, REQ-080, REQ-081, REQ-082, REQ-083
- **Passo 14 — Piloto, release v1.0.0 e transição:** REQ-012, REQ-014, REQ-022, REQ-045, REQ-052, REQ-056, REQ-067
