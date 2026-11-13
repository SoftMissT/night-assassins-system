---
tipo: plano
projeto: night-assassins-system
criado: 2026-11-13
status: aberto
---

# Automação: o que já roda e o que falta

## Já roda (validado no Foundry 14.367 isolado, porta 30001)

- Criação nível 0 → 1: atributos (padrão / 7d4 com 3 tentativas / Discord), Origem 1d12 com 2 chances, Dom 2–3d100, "o Mestre deixou escolher?", Respiração (43), arma.
- Subir de nível: ganho de PDV/PDR, patente, nível de Respiração e marcos do nível (catálogo do legado), +1 nos níveis 3 e 7, Classe no 4, escolha do 14.
- Atributos totais (criação + nível + Dom + temporário), patente e Classe automáticas.
- Canais de bônus do legado: Acerto, Bloqueio, Esquiva, Percepção visual/auditiva, Social, Dano fixo, Iniciativa, PDR máximo, Testes (Dom, Metal/Cor, bônus fixos).
- Formas de Respiração (300 do legado): gastam PDR e a ação, rolam dano; cartão com Aplicar/Metade/Curar nos alvos.
- Dano até 0 PDV: À Beira da Morte, Queda Repetida (0/1/2 Marcas, 4ª = morte); cura tira o status.
- Combate: iniciativa (proposta 1d20 + DEX + bônus), Fôlego cheio no início/fim, +1 no início do turno, ações zeradas no turno, crítico em ataque/defesa dá +1 Fôlego, Acerto gasta Ataque.
- 40 status do sistema (token HUD e aba Estados); Vantagem/Desvantagem e Fadiga Mental mudam a rolagem.
- Armas (43 do legado: 26 Nichirin + 17 especiais) como Item `weapon`; inventário `gear` (consumível, equipamento, material, missão) na aba Inventário.
- Ataque com arma: atributo FOR/DEX conforme a arma, proficiência (sem ela, nem atributo no acerto nem no dano), canal Acerto, bônus manual, modo; gasta Ataque; 2º golpe do Nitoryu (−2, sem atributo, dano fixo).
- Crítico por arma: natural ≥ margem da arma (teto 20), Fadiga Corporal bloqueia; "Acertou" rola dano ×2 e dá +1 Fôlego. Dado evolutivo por Rank (D 2, C 4, B 6, A 8, S 11, SS 12) nas especiais.
- Consumível: gasta 1, rola a cura nos alvos (ou em quem usa) e manda o efeito ao chat.
- Passiva da Pedra (Quebra): +1 por ação com Concussão de arma, teto FOR, −1 na margem de crítico por Quebra; zera no fim do combate.
- Passivas classificadas: as 23 do catálogo saem da tabela de Técnicas (nunca "Usar", `useForm` recusa) e aparecem na seção Passivas com o texto e o estado.
- Chamas · Esquentar (Fogo Fátuo): cada técnica esquenta a arma equipada (pontos do legado); faixas dão acerto, dano da arma, +1d6 nas técnicas (30+), ×1,5 e 2 Concussivo por turno no usuário (60); zera no fim do combate.
- Metal · Martelo do Julgamento: crítico de ataque → cartão com ataque extra na mesma ação (não gasta Ataque), dano pela metade arredondado para cima, ignora resistências.
- Vento · Sangue Especial: conta Cortante/Perfurante e Sangramento/Infecção recebidos (via "Aplicar dano" com tipos); botão Descanso longo converte em Cicatrizes (+CAR) e Resistência Vital (+VIT), máx. +4 cada; somados nos testes.
- Neve · Congelar: a 1ª Forma dá 1 acúmulo; com 5, botão gasta Ação Única e aplica Restrição de Movimentos nos alvos (escape FOR vs CD 8 + CAR).
- Lembretes de bônus: lista no ator (manual ou de passiva), por escopo (acerto, defesa, teste, iniciativa, dano, todos), com Vantagem/Desvantagem, bônus e usos; marcados no diálogo, gastos ao rolar. Status que mudam o modo aparecem nomeados.
- Acerto em sequência (1–20 tentativas, cada uma confirmada), CD opcional, visibilidade (`messageMode` do v14) em testes, ataques e dano.
- Diálogo de dano: entradas com fórmula livre (dados, kh/kl, @atributo, sob whitelist), fixo, atributos e tipos; "Dano da arma"; presets salvos no ator; PDR a gastar; crítico; prévia.

## Falta (próximas fatias)

| Item | Por quê não entrou | Fonte para fazer |
|---|---|---|
| Gatilhos das habilidades de Origem (ex.: Cadeia de Impacto, Oito Portões) | cada uma é uma automação própria com estado | legado `catalogs/slayer/origins.json` |
| Habilidades de Classe por Rank (C/B/A/S/SS) | idem; Mestre de Batalha Rank S rola 2d6 de PDV | legado `catalogs/slayer/classes.json` |
| Marcos 6/12 dos Dons que não são bônus fixo (Recusa Biológica etc.) | texto narrativo, sem número | `Habilidades Especiais.md` |
| Dano contínuo por turno (Sangramento, Em Chamas, Corroído) | precisa de valores por status | `Tipos de Status.md` |
| Resistência/Vulnerável por tipo de dano no "Aplicar" | precisa dos tipos no cartão + status por tipo | `Tipos de Dano.md`, `Tipos de Status.md` |
| Manobras de Combate com Fôlego | 26 manobras do legado | legado manobras + `Manobras de Combate.md` |
| Descanso (Campo / Completo / Recuperação Profunda) | botões e regra anti-abuso | `Mecanica de Descanso.md` |
| Teste de Morte no início do turno À Beira da Morte | rolagem e resultados 20/1 | `Mecânica de Vida e Morte.md` §3–5 |
| Passivas ainda manuais (texto visível na seção Passivas, sem "Usar"): Grama (Planície da Tranquilidade), Luz (Reflexo Inalcançável, Vertigem), Madeira (Sexto Sentido Natural), Raposa (Olhos Escarlate), Serpente (Cobra Familiar), Sombras (Ceifador das Trevas), Amor e Corvo (Kasugai de Batalha, Imitação, Dom Natural), Cristal (Lótus Prismática), Sangue (Aura de Sangue), Sonhos (Troca Equivalente), Vagalume (Acúmulo de Centelha), Veneno (Artista do Venefício), Insetos (Ferrão Venenoso) | cada uma tem gatilho próprio; muitas são narrativas | texto no catálogo de Formas |
| Chamas: Brasas Ardentes (pontos no inimigo: Exaustão, dano, Atordoamento) | o estado fica no ator do inimigo, que é de outro dono (precisa de socket/Mestre) | `Esquentar` no catálogo |
| Metal: sinergia do Martelo (aliado gasta 1 PDR para dano total) | o cartão avisa; o aliado aplica o dano total à mão | `Martelo do Julgamento` |
| Pedra: Sangramento e Reflexão; Neve/Névoa: estados de Forma (Coração de Gelo, Neblina) | estado de Forma, não passiva; entram como lembretes quando a Forma for automatizada | legado `stone/snow/mist-breathing-service.mjs` |
| Dupla Alma das armas especiais (entidade, demônio, regra de crítico própria) | o texto já vem no Item; a automação é por arma | legado `catalogs/special-weapons.json` |
| Capacidade de carga (o mockup mostra "24 / 60 kg" e "Espaços 9 / 40") | sem regra de capacidade nas fontes; a aba mostra só peso total e contagem | pergunta 21 |
| Fichas de Oni / Minion / NPC | `module/core/oni.mjs` já calcula PDV/PDK | `Progressão dos Onis` |
| Aplicar dano em ator de outro dono pelo jogador | socket desligado: só Mestre ou dono aplica | ligar socket + relay pelo Mestre |

## Divergências encontradas no port

- Legado `derived-bonus-service.mjs` procura `metal_preta`, mas a ficha antiga grava `metal_preto`: o bônus de Bloqueio do Metal Preto nunca entrava. Aqui usa `metal_preto`.
- 181 das 300 Formas têm ação "Não informada" no legado: a ficha não desconta ação sozinha nelas.
- 7 Respirações têm arquivo de regra mas não têm Formas no legado: Ameixeira, Estrelas, Macaco, Nevasca, Tartaruga, Tinta, Tormenta.
- Iniciativa `1d20 + DEX + bônus` é proposta de mesa (a base não define).
- Origem com 2 chances é regra de mesa do operador (as regras só trazem a tabela d12).
- Bônus permanentes do Dom (Tsuyoi +1 VIT/FOR, Marca do Destino) entram no PDV/PDR; temporários não.
