---
tipo: escopo
projeto: night-assassins-system
criado: 2026-11-12
status: rascunho
fontes:
  - assets/references/01..07 (mockups aprovados)
  - "D:\\d&D\\LORES E CONCEITOS PARA MESAS DE AMIGOS DE RPG\\Toemasa - O Vale das Almas Roubadas\\Sistema"
---

# Ficha Slayer: escopo visual e campos pendentes

A casca visual das 7 abas existe (`templates/actor/slayer-sheet.hbs`, `styles/night-assassins.css`). Ela só liga o que o `SlayerData` já persiste. Todo o resto aparece como estado vazio ou `—`. Nenhum dado dos mockups (nome, arma, missões, itens) foi copiado para a ficha.

Esta lista é o que falta para cada aba deixar de ser casca. A mecânica entra depois, por contrato (blueprint, passos 3 a 10).

## Ligado hoje

`name`, `img`, `system.level`, `system.rank`, `system.classId`, `system.originId`, `system.breathing` (texto livre; o ícone vem de `assets/icons/breathing/` quando o nome bate), `system.attributes.{vit,dex,for,car,fdv,int,sab}`, `system.resources.{pdv,pdr,folego}.{value,max}`.

## Pendente por aba

| Aba | Campo ou bloco | Onde deve morar | Fonte de regra |
|---|---|---|---|
| Personagem | Alcunha ou título, citação do perfil | `SlayerData` | só os mockups (sem regra) |
| Personagem | XP atual / próximo nível | `SlayerData` | `08 - Progressão` |
| Personagem | Habilidade Especial (Dom do Sangue, d100) | `SlayerData` | `01 - Regras Base/Habilidades Especiais.md` |
| Personagem / Combate | Arma equipada | Item `weapon` | `05 - Armas e Pactos/PROPRIEDADES DAS ARMAS.md` |
| Combate | Acerto, Bloqueio, Esquiva, Resistência, Iniciativa | derivados em `prepareDerivedData` | `Mecanicas_Centrais.md` + legado CSB |
| Combate | Técnicas (Formas: custo PDR, alcance, dano) | Item `breathingForm` | `03 - Respirações/*` |
| Combate | Estágio da Respiração | `SlayerData` ou Item | `03 - Respirações/*` |
| Combate | Combate rápido (Ataque básico, Bloqueio, Esquiva, Usar item, Passo rápido) | ações da ficha | `02 - Combate/Manobras de Combate.md` |
| Arma (Item) | Propriedades: Acuidade, Concussão, Manejável, Nitoryu, Ryōtō, Morote, Municiada X, Precisão, Sōjutsu | Item `weapon` | `PROPRIEDADES DAS ARMAS.md` |
| Arma (Item) | Cor da Nichirin, estágio de Integração I–IV, Névoa Espiritual | Item `weapon` | `A Alma da Lâmina Cor & Integração.md` |
| Testes | Modo de rolagem (normal, vantagem, desvantagem) | ação de teste | `Tipos de Status.md` §Vantagem/Desvantagem |
| Testes | Lista de perícias e atributo de cada uma | `SlayerData` + catálogo | **a base não confirma**; veio da ficha antiga e do mockup 03 |
| Estados | Contadores por turno: Movimento, Ataque, Especial, Única, Completa, Reação; Épica por arco | `SlayerData` | `Mecanicas_Centrais.md` §Tipos de Ação |
| Estados | Marcas de Morte (0–3), À Beira da Morte, Quedas no combate | `SlayerData` | `Mecânica de Vida e Morte.md` §2 e §10 |
| Estados | Status e condições (negativos/positivos) | Active Effects | `06 - Status e Condições/Tipos de Status.md` |
| Estados | Resistências e tipos de dano | Active Effects / `SlayerData` | `Tipos de Dano.md` |
| Estados | Marca do Caçador | `SlayerData` | `04 - Marca do Caçador` |
| Estados | Descanso (Campo, Completo, Recuperação Profunda) | ação da ficha | `Mecanica de Descanso.md` |
| Inventário | Itens, quantidade, peso, espaços | Items `equipment`, `consumable`, `material` | sem regra de carga na base |
| Diário | Missões (rank, local, status, objetivos) e anotações | `SlayerData` (HTML) ou Journal | `Guia de Recompensas de Missão` |
| Configurações | Tema, moldura, rolagem padrão, toggles de módulo, exportar/importar | flags do Actor / settings | só os mockups (sem regra) |

## Decisões tomadas nesta etapa

- Cromo das telas 3 a 7. A barra de abas superior da tela 7 duplica o trilho e saiu.
- A faixa de atributos não aparece no Inventário.
- Configurações só mostra leitura, sem nenhuma ação destrutiva.
- Valor sem fórmula auditada aparece como `—` e nunca como número de exemplo.

## Aberto para o autor

- Perícias: a lista de 18 e o par perícia/atributo valem como regra? Falta fonte.
- Item types: confirmar a D3 do blueprint (`weapon`, `specialWeapon`, `breathingForm`, `kekkijutsu`) e se `equipment`, `consumable` e `material` entram.
- Missões no Actor ou em Journal compartilhado com o mestre.
