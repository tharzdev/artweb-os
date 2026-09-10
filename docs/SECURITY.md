# ArtWeb OS — Segurança

- Senhas usam PBKDF2-SHA-256, salt aleatório e comparação constante.
- Sessões usam tokens aleatórios, hash no banco, cookie `HttpOnly`, `Secure` e `SameSite=Lax`.
- Todas as consultas são isoladas por usuário/workspace.
- RBAC será verificado nos casos de uso e não apenas ocultado na interface.
- API keys e credenciais de clientes pertencem a um cofre externo; o banco guarda somente referências.
- Logs excluem senha, token, cookie, conteúdo privado e payloads de webhook.
- Webhooks exigem assinatura, janela temporal, idempotência e replay protection.
- Auditoria registra ator, ação, entidade, instante e metadados seguros.
- Backups devem ser criptografados, versionados e testados por restauração.

Antes de abrir o Site para equipe ou público, serão necessários rate limiting, recuperação de senha, verificação de e-mail e política de acesso compatível com o RBAC.
