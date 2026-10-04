# GUIA-VISUAL — Night Assassins

Direção de arte e layout **aprovados** para a ficha do sistema. Este documento
é a referência de implementação da camada de interface; nada aqui é
especulação — cada seção registra uma decisão já tomada.

## 1. Direção de arte

| Item | Decisão |
| --- | --- |
| Tema | **Dark Taishō MMORPG** — Japão sombrio, vermelho-sangue sobre preto, tipografia de pincel e kana |
| Paleta base | Preto/carvão, vermelho profundo, dourado/creme para texto de destaque |
| Key art aprovada | [`assets/nigh assassin's.png`](../../assets/nigh%20assassin's.png) — silhueta com katana, sol vermelho, Monte Fuji. **Formato atual: 16:9 (paisagem)** |
| Formato alvo da ficha | **Retrato 9:16** |

## 2. Layout da ficha

```
┌──────────────────────┬──────────────┐
│                      │              │
│   PAINEL PRINCIPAL   │  NAVEGAÇÃO   │
│      9:16 retrato    │   ÚNICA      │
│                      │  VERTICAL    │
│                      │              │
└──────────────────────┴──────────────┘
     à esquerda            à direita
```

- **Retrato 9:16 à esquerda** — todo o conteúdo da ficha vive aqui.
- **Navegação única vertical à direita** — um único rail vertical que troca o
  conteúdo do painel esquerdo. Sem abas duplicadas, sem menu secundário.

## 3. Barras de status

Três **barras horizontais**, empilhadas na ordem:

1. **PDV** (Pontos de Vida)
2. **PDR** (Pontos de Dano Resistido)
3. **Fôlego**

## 4. Atributos

**Sete atributos roláveis, dispostos horizontalmente** em uma única fileira,
cada um clicável para rolagem.

## 5. Navegação (menus)

| # | Menu | Observação |
| --- | --- | --- |
| 1 | **Personagem** | inclui **Classe** e **Origem** via *dropdown* |
| 2 | **Combate** | |
| 3 | **Testes** | |
| 4 | **Estados** | |
| 5 | **Inventário** | |
| 6 | **Diário** | visual de **jornal** |
| 7 | **Configurações** | |

### 5.1 Personagem

- **Classe**: seletor em *dropdown* (não campo livre).
- **Origem**: seletor em *dropdown* (não campo livre).

### 5.2 Diário

Aparência de **jornal**: colunas, filetes, tipografia serifada de manchete,
cabeçalho de edição. Não é um bloco de texto corrido.

## 6. Ícones versionados em `assets/`

| Pasta | Conteúdo |
| --- | --- |
| `assets/icons/breathing/` | 60 ícones de respiração (`resp_*.webp`) |
| `assets/icons/weapons/` | ícones de armas `.webp` |
| `assets/icons/templates/` | ícones de templates de área `.webp` |
| `assets/icons/macros/` | ícones de macros `.webp` |
| `assets/icons/items/` | ícones de itens `.webp` |
| `assets/` | key art `nigh assassin's.png` (único PNG) |

Total: 108 `.webp` + 1 `.png`.

## 7. PNGs que ainda precisam ser fornecidos

Só existe **um** PNG no repositório (a key art acima). Os mockups das telas
abaixo **não existem** e não foram inventados — precisam ser enviados para que
o layout possa ser implementado com fidelidade:

| # | Mockup ausente | Status |
| --- | --- | --- |
| 1 | Ficha completa (painel 9:16 + rail de navegação) | **não fornecido** |
| 2 | Barras PDV / PDR / Fôlego | **não fornecido** |
| 3 | Fileira dos sete atributos roláveis | **não fornecido** |
| 4 | Menu **Personagem** (Classe/Origem em dropdown) | **não fornecido** |
| 5 | Menu **Combate** | **não fornecido** |
| 6 | Menu **Testes** | **não fornecido** |
| 7 | Menu **Estados** | **não fornecido** |
| 8 | Menu **Inventário** | **não fornecido** |
| 9 | Menu **Diário** (visual de jornal) | **não fornecido** |
| 10 | Menu **Configurações** | **não fornecido** |

Enquanto esses PNGs não chegarem, a implementação usa apenas as decisões das
seções 1–5 — nenhuma tela é imaginada a partir de referência inexistente.

> **Nota:** a key art aprovada está em **16:9 paisagem**, enquanto a ficha é
> **9:16 retrato**. Ela serve como capa/identidade, não como moldura da ficha.
> Se houver uma versão retrato da key art, ela deve ser fornecida.
