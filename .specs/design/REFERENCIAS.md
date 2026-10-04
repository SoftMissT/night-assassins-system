# Night Assassins | Referências visuais recuperadas

**Status:** pacote de migração para `rebirth/clean-slate-2026-10-03`.

Os PNGs da pasta `approved/` são capturas de referências aprovadas em conversa, **não** código, backgrounds da ficha ou gráficos de interface utilizáveis como imagem única. O projeto deve converter cada layout em componentes semânticos HTML/Handlebars/CSS, mantendo hierarquia, tipografia, ornamentação e proporções. A pasta `iterations/` é apenas histórico para entender correções.

| Imagem de referência | Interpretação e decisão |
|---|---|
| `approved/01-personagem-visao-geral.png` | Layout Dark Taishō com retrato 9:16, recursos e sidebar direita. A Persona ainda requer aprovação própria. |
| `approved/02-combate.png` | Arsenal, respiração, ações rápidas e lista de técnicas. Fórmulas só após extrair contrato do CSB. |
| `approved/03-testes-corrigido.png` | Layout corrigido, sem segunda barra de abas; sete atributos numa faixa horizontal; 18 perícias. |
| `approved/04-estados-pendente-refino.png` | Controles de ações, resistência, status, Marca do Caçador, Vida e Morte; usuário gostou parcialmente e deixou ajustes para depois. |
| `approved/05-inventario.png` | Busca, categorias e seleção de item com detalhes. Não inventar itens nativos ainda. |
| `approved/06-diario-jornal.png` | **Obrigatório:** aspecto de jornal físico, páginas de missões, recortes, notas e pistas; substitui o mockup de diário anterior. |
| `approved/07-configuracoes.png` | Categorias de configurações visualmente aprovadas como proposta, porém a duplicação de abas do mockup não deve ser reproduzida. |

## Regras de UX aprovadas

1. **Apenas uma navegação:** rail vertical na DIREITA. Proibido adicionar segunda linha de tabs na região central.
2. **Retrato:** 9:16 à esquerda; requer um arquivo artístico separado. O key art de 16:9 já presente no repositório NÃO deve ser deformado ou cortado como retrato definitivo.
3. **Barras PDV, PDR e Fôlego:** horizontais, valores numéricos editáveis/visíveis; fontes de dados em Actor `system.resources`.
4. **Sete atributos:** VIT, DEX, FOR, CAR, FDV, INT, SAB, em faixa com `overflow-x:auto`, focáveis/roláveis; sem repetir faixas em lugares onde não agregam ao trabalho do usuário.
5. **Classe e Origem:** dropdowns dentro de Persona/Personagem; rótulos de catálogo real, sem inventar opções.
6. **Diário:** formato físico de jornal com missões e notas, não dashboard de tarefas.
7. **Estados** preserva Gerenciar Ações, Resistências, Status, Marca do Caçador, Auditar Bônus, Estados Avançados, Vida e Morte, contadores e proficiências. Fórmulas, interação e indicadores precisam de contrato do legado.
8. **Modo híbrido:** ficha redimensionável no Foundry, com boa utilização do espaço disponível. Não virar tela cheia obrigatória.

## Falta e não deve ser inventado

- Mockup independente e final de Persona, incluindo decisões sobre edição de Classe/Origem.
- Retrato isolado em 9:16 com licença/autorização para uso no sistema.
- Detalhes de barras, perícias e status dependentes de fórmulas verificadas.
- Capturas específicas de barras e faixa de atributos em detalhe, se forem necessárias para implementação pixel-accurate. **Não criar crop de screenshot antigo como nova referência aprovada.**

## Integridade

`REFERENCIAS-MOCKUPS.json` identifica a origem, dimensões e SHA-256 de todos os arquivos. Não renomear os originais sem atualizar o inventário.
