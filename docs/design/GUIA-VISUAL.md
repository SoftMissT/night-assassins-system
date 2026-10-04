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
| `assets/` | key art `nigh assassin's.png` |

Total em `assets/`: 108 `.webp` + 1 `.png`.

## 7. Referências visuais versionadas

| Caminho | Conteúdo |
| --- | --- |
| [`docs/design/REFERENCIAS.md`](REFERENCIAS.md) | interpretação e decisões de cada imagem + regras de UX aprovadas |
| [`docs/design/REFERENCIAS-MOCKUPS.json`](REFERENCIAS-MOCKUPS.json) | inventário com origem, dimensões e SHA-256 de cada PNG |
| `docs/design/references/approved/` | **7 PNG aprovados** — um por menu (01 Personagem … 07 Configurações) |
| `docs/design/references/iterations/` | 5 PNG históricos (só contexto, não são referência de aprovação) |

**Regras críticas dessas referências:**

1. As imagens `approved/` são **capturas de referência**, não backgrounds nem
   sprites — converter cada layout em HTML/Handlebars/CSS semântico.
2. Proibido adicionar **segunda linha de abas** na região central (o único
   rail de navegação é o da direita).
3. **Não recortar** o key art 16:9 para servir de retrato definitivo.

## 8. Lacunas que continuam abertas (não inventar)

Os 7 menus já têm referência aprovada. Ainda **não existe** e não foi
criado equivalente:

| # | Lacuna | Motivo |
| --- | --- | --- |
| 1 | **Arte de retrato 9:16** para o slot `.nas-portrait` | exige arquivo artístico próprio, com licença/autorização; o key art 16:9 não pode ser deformado |
| 2 | **Mockup final de Persona** (edição de Classe/Origem) | decisão de edição ainda não aprovada |
| 3 | **Capturas em detalhe** das barras PDV/PDR/Fôlego e da faixa de atributos | dependem de fórmulas verificadas |
| 4 | **Detalhes de perícias e status** | dependem do contrato extraído do legado |

Enquanto essas referências não chegarem, a implementação usa apenas as
seções 1–7 — nenhuma tela é imaginada a partir de referência inexistente.

> **Nota sobre proporção:** o slot de retrato ocupa a **coluna esquerda do
> grid** (27% da largura) e exibirá `actor.img`. O CSS ainda **não fixa
> `aspect-ratio: 9/16`** — pendência registrada para quando a arte 9:16
> for fornecida. A key art 16:9 permanece como **capa/identidade**, não como
> moldura da ficha.
