# ArtWeb OS — Busca

## V1

A busca global consulta leads, clientes, projetos, tarefas, notas e memórias. O ranking combina correspondência exata, prefixo, título, corpo, status e atualidade. `Ctrl+K` abre busca e comandos no mesmo painel.

## Evolução

A busca híbrida combina FTS e embeddings. Filtros por workspace, tipo, cliente, projeto, importância, data e permissão são aplicados antes do ranking semântico.

## Orçamento de contexto

- ação simples: até 4 itens;
- tarefa operacional: até 8 itens;
- tarefa técnica: até 12 trechos e arquivos relevantes;
- análise estratégica: até 20 trechos resumidos.

Resultados são deduplicados por entidade e impressão digital. O montador de contexto inclui somente campos necessários à intenção detectada.
