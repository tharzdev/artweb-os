# ArtWeb OS — Modelo de dados

## Núcleo

- `users`: identidade, nome, e-mail e credencial derivada.
- `sessions`: sessões revogáveis com expiração.
- `memberships`: usuário, workspace e papel (`owner`, `admin`, `collaborator`, `finance`, `sales`, `developer`).
- `workspaces`: fronteira de isolamento dos dados.

## Negócio

- `leads`: empresa, contato, canais, qualificação, etapa e próxima ação.
- `lead_contacts`: histórico de contatos do lead.
- `clients`: cadastro comercial, serviços, mensalidade, responsável e origem.
- `projects`: cliente, status, prioridade, prazo, progresso, tecnologias e tags.
- `tasks`: projeto, cliente, responsável, prazo, status e prioridade.
- `task_items`, `comments`, `attachments`: subtarefas, colaboração e anexos.

## Conhecimento

- `notes`: Markdown, origem humana/IA, importância, categoria e contexto.
- `memories`: unidade reutilizável, importância, origem e estado.
- `memory_links`: relações entre memórias e entidades.
- `daily_notes`: uma nota por workspace e dia, com blocos Usuário/IA.
- `library_items`: códigos, prompts, contratos, templates e referências.

## Operação

- `financial_entries`, `contracts`, `automation_rules`, `notifications`.
- `entity_links`: relações genéricas tipadas sem duplicar conteúdo.
- `activity_events`: auditoria imutável.
- `event_outbox`: entrega confiável de eventos de domínio.

Todas as tabelas operacionais carregam `workspace_id`, `created_at`, `updated_at` e, quando aplicável, `created_by`. Índices priorizam workspace + status, prazos, cliente, projeto e campos de busca.
