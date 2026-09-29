# Night Assassins System

Sistema próprio de **Night Assassins** para o Foundry Virtual Tabletop v14,
em migração a partir do módulo legado construído sobre o Custom System Builder
(CSB).

## Requisitos

- Foundry VTT v14 (verificado em 14.367)
- Módulo [Dice So Nice!](https://foundryvtt.com/packages/dice-so-nice) (obrigatório)

## Versão

`0.1.0` — bootstrap do repositório.

## Desenvolvimento

Sem dependências de runtime ou de build. Rodar os testes:

```sh
npm test
```

`npm test` usa o runner embutido do Node (`node --test`) com escopo em
`tests/**/*.test.mjs`. Rodar `node --test` cru na raiz varreria também o
repositório legado presente localmente em `night-assassins-csb-automation/`,
que nunca é versionado nem existe em CI.

## Licença

MIT — ver [LICENSE](LICENSE).
