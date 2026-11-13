<div align="center">
<img src="assets/nigh%20assassin%27s.png" alt="Night Assassins — Capa oficial" width="900">

# NIGHT ASSASSINS
### Sistema de RPG para Foundry VTT

**Caçadores • Onis • Respirações • Combate • Progressão**

[![Versões](https://img.shields.io/badge/Foundry-v14-red)](https://foundryvtt.com/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-gold)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Reposit%C3%B3rio-black)](https://github.com/SoftMissT/night-assassins-system)

[**RELEASES**](https://github.com/SoftMissT/night-assassins-system/releases)
|
[**REPORTAR ERRO**](https://github.com/SoftMissT/night-assassins-system/issues)
|
[**DOCUMENTAÇÃO**](plans/night-assassins-system-blueprint.md)
</div>

> [!WARNING]
> **Em desenvolvimento.** Exige Foundry v14 e o
> módulo Dice So Nice. Validado em uma instância
> isolada do Foundry 14.367 pelo lado do Mestre;
> a visão de jogador sem permissão de edição ainda
> não foi exercitada.

---

## A ficha Slayer

Interface Dark Taishō MMORPG, com navegação
inspirada em Sword Art Online e identidade
visual de Night Assassins.

![Ficha do personagem](assets/references/01-personagem-visao-geral.png)

### Combate

![Combate](assets/references/02-combate.png)

### Testes e perícias

![Testes](assets/references/03-testes-corrigido.png)

### Estados e resistências

![Estados](assets/references/04-estados-pendente-refino.png)

### Inventário

![Inventário](assets/references/05-inventario.png)

### Diário de missões

![Diário](assets/references/06-diario-jornal.png)

### Configurações

![Configurações](assets/references/07-configuracoes.png)

> As imagens acima representam designs de
> referência. Nem todas as funções ilustradas
> estão implementadas na versão atual.

---

## Instalação

Quando a primeira versão estável for publicada:

1. Abra o Foundry VTT.
2. Selecione **Game Systems**.
3. Clique em **Install System**.
4. Cole a URL do manifesto abaixo.
5. Clique em **Install**.

URL do manifesto da release mais recente:

```text
https://github.com/SoftMissT/night-assassins-system/releases/latest/download/system.json
```

### Download direto

[**Última release estável**](https://github.com/SoftMissT/night-assassins-system/releases/latest)

[**Todas as versões e testes**](https://github.com/SoftMissT/night-assassins-system/releases)

---

## Estado do desenvolvimento

| Recurso | Estado |
|---|---|
| Ficha Slayer (7 abas) | Funcional |
| Criação do nível 0 ao 1 e subir de nível | Funcional |
| PDV, PDR e Fôlego por nível | Funcional |
| Testes, perícias, bônus manual e lembretes | Funcional |
| Formas de Respiração (níveis à escolha) | Funcional |
| Passivas das Respirações | 5 automáticas; 19 só com o texto da regra |
| Armas, crítico e inventário | Funcional |
| Combate e dano com Aplicar/Metade/Curar | Funcional |
| Estados e condições | 40 status; dano contínuo pendente |
| Diário interativo | Pendente |
| Fichas Oni e NPC | Pendente |
| Migração do CSB | Pendente |

## Desenvolvimento

```bash
npm test
```

O sistema está sendo reconstruído sem
dependência do Custom System Builder.

## Autoria

**SoftMissT**

[GitHub](https://github.com/SoftMissT)

Licença MIT. Consulte [LICENSE](LICENSE).
