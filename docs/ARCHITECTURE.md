# ArtWeb OS — Arquitetura

## Direção

O ArtWeb OS será um monólito modular na V1: uma aplicação, um deploy e limites claros entre módulos. Esta escolha reduz operação e mantém a evolução simples. Cada módulo expõe serviços e eventos, sem consultar diretamente a interface de outro módulo.

## Camadas

1. **Interface:** Next/Vinext, componentes React e navegação por módulos.
2. **Aplicação:** casos de uso, validação, autorização e emissão de eventos.
3. **Domínio:** entidades, regras e relacionamentos.
4. **Persistência:** repositórios D1 na V1, compatíveis com uma futura implementação PostgreSQL.
5. **Integrações:** adaptadores para Obsidian, OpenAI, Codex, Asaas e canais externos.

## Módulos V1

`identity`, `dashboard`, `crm`, `clients`, `projects`, `tasks`, `knowledge`, `search`, `audit` e `notifications`.

## Eventos

Eventos usam uma outbox persistida no mesmo commit da alteração. Consumidores idempotentes processam eventos como `lead.status_changed`, `client.created`, `project.created`, `task.completed` e `memory.created`. Na V1, os consumidores síncronos registram atividade e notificações; a outbox permite processamento assíncrono futuro.

## Decisões

- D1 é mantido enquanto o produto vive no Sites. PostgreSQL entra quando volume, relatórios ou integrações exigirem.
- Credenciais de clientes nunca ficam no banco de notas; uma futura integração de cofre armazena os segredos.
- A IA recebe um pacote de contexto montado por busca, nunca o estado completo da empresa.
- O acesso atual do Site é privado ao proprietário. RBAC da aplicação está modelado, mas colaboração externa exige também alterar a política de acesso do Site.
