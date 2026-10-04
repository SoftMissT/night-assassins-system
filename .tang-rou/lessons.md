# Lições TANG-ROU

## 2026-10-03 — Portar o sistema legado inteiro de uma vez

- **Erro**: Reimplementei um esqueleto parcial (4 macros, catálogo de armas inventado, serviço de combate próprio) ao invés de portar o legado completo (93 scripts, 29 macros, 150 testes), e ainda mantive duas implementações de combate concorrentes.
- **Causa**: Substituí a entrega pela minha versão em vez de copiar o que já existia e era testado; presumi contrato e comportamento sem conferir a fonte.
- **Correção**: Operador mandou parar e apagar todo o trabalho da sessão, mantendo apenas `night-assassins-csb-automation/` (fonte) e `plans/`.
- **Regra preventiva**: Nunca entregar versão própria de algo que já existe no legado. Primeiro copiar/portar o código e os testes existentes, deixar verdes, e só então propor mudanças. Dúvida de escopo → perguntar antes de escrever código.
