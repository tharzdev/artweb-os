# ArtWeb OS — Integrações

Integrações implementam contratos internos e não vazam SDKs para o domínio.

- **Obsidian/MCP:** exportação/importação Markdown e sincronização incremental.
- **OpenAI:** classificação, resumo e embeddings com orçamento de contexto.
- **Codex:** pacote técnico contendo tarefa, arquivos, decisões e memórias selecionadas.
- **Asaas:** clientes, cobranças e pagamentos via API/webhooks idempotentes.
- **Google:** Drive, Gmail e Calendar por conectores autorizados.
- **WhatsApp/Meta:** conversas associadas ao lead e ao cliente.
- **GitHub:** repositórios, commits, issues e pull requests ligados a projetos.
- **WordPress/WooCommerce:** sites e componentes por cliente/projeto.

Cada adaptador terá credenciais por workspace, fila de sincronização, cursor, tentativas com backoff, dead-letter e trilha de auditoria.
