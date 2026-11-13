---
tipo: perguntas
projeto: night-assassins-system
criado: 2026-11-12
atualizado: 2026-11-12
status: respondido
---

# Perguntas abertas

Marque com `[x]` a opção que vale ou escreva em **Resposta**. Pode responder só as que importam agora; eu leio este arquivo de volta e sigo.

---

## 1. Publicar a capa agora?

A capa já está ligada no `system.json` (tipos `setup` e `cover`, caminho `systems/night-assassins/assets/media/module-cover.webp`) e o teste novo passa. Para você ver no Foundry, precisa de commit e release. O `AGENTS.md` pede autorização específica para commit, push e tag.

- [ ] Commitar e publicar a **v0.0.3** com a capa
- [ ] Só commitar, sem tag
- [x] Esperar (resolva a pergunta 2 antes)

**Resposta:** Esperar. O repositório é público e o zip do release também; a capa atual tem personagens reconhecíveis de Demon Slayer. O código pode ser commitado sem o asset, mas a capa não deve entrar no commit/tag enquanto não for própria ou neutra. Se precisar ver a capa no Foundry agora, use um arquivo local ignorado pelo Git e não referencie esse arquivo no `system.json` versionado. Depois da arte final, aí sim: commit, tag e release da v0.0.3.

---

## 2. A arte da capa

A imagem mostra personagens reconhecíveis de Demon Slayer. O zip do release é público no GitHub, então a arte vai junto.

- [ ] Manter essa imagem mesmo assim
- [ ] Usar enquanto a mesa é privada e trocar por arte própria antes de divulgar
- [x] Trocar agora (me passe o novo caminho)

**Resposta:** Trocar agora. O repo é público; “mesa privada” não protege a distribuição do zip. Até a arte própria existir, use um placeholder neutro (logo tipográfico, silhueta ou textura) e não distribua a imagem atual. Proporção: manter 16:9 para o Foundry local e gerar uma variante 2:1 (corte central) da arte final para a capa de loja/Manifest+. Não vale gerar 2:1 da imagem atual.

Detalhe técnico: ela tem 16:9 (1672×941). O padrão do Manifest+ para capa em loja é 2:1. No Foundry local funciona como está.

- [ ] Deixar em 16:9
- [x] Gerar uma versão 2:1 (corte central) além desta

**Resposta:** A arte final deve ter as duas versões: 16:9 para o Foundry local e 2:1 para a loja/Manifest+. A imagem atual não deve ser publicada em nenhuma das duas.

---

## 3. Como validar a ficha no Foundry de verdade

O que falta provar: salvar campos, trocar de aba, seletor de retrato, visão do jogador. Hoje só existe a validação visual no harness.

- [ ] Eu atualizo pelo manifest na 30000 e te mando o que quebrar (o que você já faz)
- [ ] Sincronize a pasta do repositório em `D:\Foundry vtt app data\Data\systems\night-assassins` (sobrescreve a instalação)
- [x] Use a instância de teste (`D:\FoundryData-Test`, porta 30001); você me diz se ela já tem mundo

**Resposta:** Usar a instância de teste. Ela existe e tem os mundos `qa-lumenn-isolado` e `wod5e`, mas **não** tem o sistema `night-assassins` instalado. Instalar/copiar o sistema em `D:\FoundryData-Test\Data\systems\night-assassins` e validar em um mundo clone ou em um mundo novo. Não sobrescrever `D:\Foundry vtt app data` (produção), que tem o módulo legado e outros sistemas.

---

## 4. Perícias

A base de regras (Toemasa/Sistema) não traz a lista de perícias nem o atributo de cada uma. A lista de 18 e os pares vieram da ficha antiga e do mockup 03: Arremesso, Atletismo (FOR); Arrombamento, Acrobacia, Corrida (DEX); História, Linguística, Investigação (INT); Intuição, Religião, Percepção, Sobrevivência (SAB); Foco, Adestramento (FDV); Enganação, Presença, Etiqueta, Performance (CAR).

- [x] Essa lista e esses pares valem como regra
- [ ] Ajustar (escreva abaixo o que muda)
- [ ] Perícias nem entram no sistema ainda; tirar da aba Testes

Também falta saber como a perícia funciona (proficiência, treino, bônus):

**Resposta:** Valem como **regra de mesa**, não como regra base. A base não traz a lista nem a mecânica. A ficha antiga usa o nome da perícia apenas como etiqueta e rola `1d20 + atributo`; não há proficiência, treino ou bônus separado. Decisão: manter a lista e os pares como estão e rolar `1d20 + atributo`. Se o autor quiser proficiência depois, entra como regra de mesa separada (ex.: treinada +2, especialização +4), sem alterar a base.

---

## 5. Tipos de Item

O blueprint (D3) prevê `weapon`, `specialWeapon`, `breathingForm`, `kekkijutsu`. O inventário do mockup mostra também equipamentos, consumíveis e materiais.

- [x] Só os quatro do blueprint por enquanto
- [ ] Os quatro mais `equipment`, `consumable` e `material`
- [ ] Outro conjunto:

**Resposta:** Só os quatro do blueprint (`weapon`, `specialWeapon`, `breathingForm`, `kekkijutsu`). `equipment`, `consumable` e `material` entram quando a aba Inventário for implementada; não são necessários para a ficha atual e adiá-los evita tipos vazios no DataModel.

---

## 6. Missões e anotações do Diário

- [ ] Dentro do Actor (cada jogador tem as suas)
- [x] Em Journal compartilhado, e a ficha só aponta para ele
- [ ] Missão é do Mestre; o jogador só tem anotações pessoais

**Resposta:** Journal compartilhado para missões; a ficha só aponta para o Journal. Anotações pessoais do jogador ficam no Actor (ou em Journal privado, se o Mestre preferir). Isso evita duplicar a mesma missão em cada Actor e respeita as permissões do Foundry.

---

## 7. Fonte dos títulos

Os títulos usam `Cinzel`, mas ela não vai no pacote; hoje cai em Georgia. Baixar a fonte (licença OFL) e empacotar exige sua autorização.

- [x] Pode baixar a Cinzel do repositório oficial e empacotar
- [ ] Deixar Georgia
- [ ] Outra fonte que você prefere:

**Resposta:** Pode baixar e empacotar a Cinzel (OFL 1.1). Incluir o texto da licença no pacote (`assets/fonts/OFL.txt` ou equivalente) e usar `woff2` para não inflar o zip. Manter Georgia como fallback no CSS. Baixar do repositório oficial do Google Fonts, não de fonte duvidosa.

---

## 8. O que vem depois da casca

Escolha a ordem das próximas fatias (numere 1, 2, 3...):

- [ ] Dados da ficha: derivados (Acerto, Bloqueio, Esquiva, PDV/PDR máximo), contadores de ação, Marcas de Morte
- [ ] Tipos de Item e a aba Inventário
- [ ] Armas e propriedades (Acuidade, Nitoryu, Ryōtō...)
- [ ] Respirações e Formas (aba Técnicas)
- [ ] Testes e rolagens, com Dice So Nice
- [ ] Textos da interface para `lang/pt-BR.json` (hoje estão escritos direto no template)
- [ ] Fichas de Oni, Oni Minion e NPC

**Resposta (ordem):**

1. **Dados da ficha:** derivados (Acerto, Bloqueio, Esquiva, PDV/PDR máximo), contadores de ação, Marcas de Morte.
2. **Textos da interface** para `lang/pt-BR.json`.
3. **Testes e rolagens**, com Dice So Nice.
4. **Tipos de Item e a aba Inventário.**
5. **Armas e propriedades** (Acuidade, Nitoryu, Ryōtō...).
6. **Respirações e Formas** (aba Técnicas).
7. **Fichas de Oni, Oni Minion e NPC.**

Motivo: os derivados são a base de tudo; a localização vem antes de novas telas para não multiplicar strings hardcoded; itens vêm antes de armas porque arma é um tipo de Item; Oni/Minion/NPC ficam por último porque são fichas separadas. Os passos 2 e 3 podem rodar em paralelo.

---

## 9. Ação Épica no turno

A regra diz que a Ação Épica é por arco da campanha, não por turno, mas ela aparece junto das ações do turno na aba Estados.

- [x] Tirar do bloco de turno e mostrar separada
- [ ] Deixar junto

**Resposta:** Tirar do bloco de turno. A Ação Épica é 1 por arco, não por turno; mostrar em um bloco separado “Ação Épica (1 por arco)” com custo de 5 Fôlego, o Flashback/Memória obrigatório e a consequência de Colapso Total. O bloco de turno fica só com Movimento, Ataque, Especial, Única, Completa e Reação.

---

---

# Rodada 2 (fatia 1: dados derivados)

Spec em `plans/spec-fatia-1-dados-derivados.md`. Estas respostas destravam a implementação.

## 10. Como guardar os atributos

Para calcular PDV/PDR por nível preciso saber o VIT/FDV dos níveis 1, 3 e 7.

- [ ] Guardar o valor de **criação** e os dois `+1` (nível 3 e 7) como escolhas; o atual é calculado (recomendado: o histórico sai de graça)
- [ ] Guardar só o valor **atual** e mais três snapshots preenchidos à mão
- [ ] Outro:

**Resposta:**

## 11. Iniciativa

A base não confirma a fórmula. O legado só mostra "INICIATIVA +bônus de Metal".

- [ ] `1d20 + DEX`
- [ ] Outra fórmula:
- [ ] Deixar `—` até a regra existir

**Resposta:**

## 12. Card "Resistência" na aba Combate

O mockup 02 mostra "Resistência 16" junto de Acerto, Bloqueio e Esquiva. Nas regras, Resistência é status por tipo de dano, não um número único.

- [ ] Tirar o card; resistências ficam na aba Estados
- [ ] É um teste (qual atributo?):
- [ ] Outro:

**Resposta:**

## 13. As divergências da sua referência (§9)

A fonte soma a `OrigemPDV` **a cada nível**, mas a `OrigemPDR` só **no nível 1**. A própria referência pede para confirmar essa assimetria com o autor.

- [ ] Confirmo: é assim mesmo (vira teste dourado)
- [ ] Corrigir:

**Resposta:**

## 14. PDV/PDR máximos editáveis?

Com a fórmula, o máximo deixa de ser digitado.

- [ ] Só calculado
- [ ] Calculado + um campo "ajuste do Mestre" (+/-) para casos especiais
- [ ] Calculado, mas o Mestre pode sobrescrever o total

**Resposta:**

## 15. Arte do seu mundo na 30000 como capa final

O fundo do mundo na 30000 (sol vermelho, kanji 夜の暗殺者, "Módulo Foundry v14") parece arte própria do projeto.

- [ ] É minha: pode virar a capa (me diga o caminho do arquivo)
- [ ] Não é minha / não usar
- [ ] Vou fazer outra

**Resposta:**

## 16. Commit desta rodada

Pronto e testado, mas **não commitado**: placeholder de capa, capa de terceiros no `.gitignore`, Ação Épica separada, fonte Cinzel, 2 testes novos.

- [ ] Commitar no branch (sem tag nem release)
- [ ] Commitar e publicar v0.0.3 (placeholder vai como capa)
- [ ] Esperar a fatia 1

**Resposta:**

---

## Defaults aplicados sem resposta (2026-11-12, a pedido: "prossiga")

Implementados com a opção recomendada; mude qualquer um e eu ajusto.

- **10:** criação + `+1` dos níveis 3 e 7 como escolhas; atual derivado.
- **11:** Iniciativa fica `—` (base não confirma).
- **12:** card Resistência removido da aba Combate.
- **13:** assimetria aceita como na referência (PDV da Origem todo nível, PDR só no 1).
- **14:** máximo calculado + "Ajuste do Mestre" (+/-) em Configurações.
- **Achado:** o exemplo Ninja da referência (§6.3) sobe VIT **e** FDV no nível 7, mas a regra (§2.1) dá só `+1` em **um** atributo. O teste dourado usa os snapshots do exemplo como estão; confirme qual vale.
- **PDR acima do máximo:** se o máximo cai (troca de Origem/nível), o valor atual não é cortado sozinho. Quer que eu corte ao máximo?

---

# Rodada 3 (automação)

Detalhes em `plans/plano-automacao-pendente.md`.

## 17. Origem com 2 chances

Implementei: rola; se não gostar, rola a 2ª e a 2ª vale. As regras escritas só trazem a tabela d12. Está certo assim?

- [ ] Sim
- [ ] Não, é assim:

**Resposta:**

## 18. Iniciativa

Está `1d20 + DEX + bônus de Iniciativa` (proposta). Vale?

- [ ] Sim
- [ ] Outra fórmula:

**Resposta:**

## 19. Aplicar dano em token de outro jogador

Com o socket desligado, só o Mestre ou o dono aplica. Ligar o socket para o jogador aplicar dano em inimigo/aliado pelo cartão?

- [ ] Ligar socket (o Mestre retransmite)
- [ ] Deixar só Mestre/dono

**Resposta:**

## 20. Qual fatia vem agora

- [ ] Habilidades de Origem e Classe (gatilhos)
- [ ] Manobras com Fôlego + Descanso + Teste de Morte
- [ ] Itens e armas
- [ ] Ficha de Oni

**Resposta (ordem):**

> 2026-11-13: o operador cobrou armas, crítico e inventário. Feito: tipos de Item `weapon` e `gear` (antes a decisão era só 4 tipos), aba Inventário no mockup 05, ataque com arma e crítico.

## 21. Capacidade de carga

O mockup 05 mostra "Peso total 24 / 60 kg" e "Espaços 9 / 40". As fontes não têm regra de capacidade. Hoje a aba mostra o peso total e o número de itens, sem limite.

- [ ] Sem limite (fica assim)
- [ ] Limite por FOR (fórmula: ______)
- [ ] Limite fixo de espaços: ______

**Resposta:**

## 23. "Bônus reminder" (lembretes)

Entendi "bônus reminder de vantagem, desvantagem" como: (a) o diálogo de rolagem nomeia os status que dão Vantagem/Desvantagem e (b) uma lista de lembretes no ator ("Manobra: Vantagem no próximo acerto", "+2 no próximo dano") que aparece marcada no diálogo certo e some quando gasta. Um lembrete de uso único gasto numa sequência de várias tentativas vale para a sequência inteira. É isso?

- [ ] Sim
- [ ] Era outra coisa: ______

**Resposta:**

## 24. Brasas Ardentes (Chamas) no inimigo

Os pontos de Brasas ficam no inimigo (Exaustão, dano, Atordoamento por faixa). O inimigo é de outro dono: guardar no token pelo Mestre (socket) ou só anunciar no chat?

- [ ] Guardar no inimigo (o Mestre aplica)
- [ ] Só anunciar

**Resposta:**

## 22. Quando o crítico conta

Hoje o ataque mostra "CRÍTICO" quando o natural atinge a margem da arma, e o dano ×2 e o +1 Fôlego só entram quando alguém clica em "Acertou: rolar dano" (acerto confirmado, como no legado). Está certo?

- [ ] Sim
- [ ] O +1 Fôlego vale mesmo se errar

**Resposta:**
