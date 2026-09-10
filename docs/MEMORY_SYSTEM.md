# ArtWeb OS — Sistema de memória

## Tipos

- Nota do usuário: amarela, manual e editável.
- Nota da IA: azul, sempre identificada como conteúdo gerado.
- Memória: conhecimento promovido e reutilizável.
- Daily Note: registro diário que não vira memória automaticamente.

## Promoção

Uma nota candidata recebe categoria, importância, entidades e impressão digital semântica. O sistema procura duplicatas antes de criar memória. Quando há equivalência, atualiza ou relaciona; quando há conflito, conserva as duas versões com proveniência.

## Recuperação

1. detectar intenção;
2. resolver cliente, projeto e entidades;
3. filtrar metadados;
4. executar busca lexical e semântica;
5. remover duplicatas;
6. ranquear por relevância, atualidade e importância;
7. montar contexto dentro de um orçamento.

Cada trecho enviado à IA leva fonte e entidade. O sistema registra quais memórias foram usadas, sem gravar prompts sensíveis completos.

## Obsidian

O Markdown usa frontmatter estável (`id`, `type`, `workspace`, relações, tags e datas). Sincronização é feita por um adaptador de vault com detecção de conflitos; D1 mantém metadados e índice, enquanto os arquivos permanecem portáveis.
