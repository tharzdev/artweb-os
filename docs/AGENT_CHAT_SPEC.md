# ArtWeb OS — Spec do agente e chatbot

Status: primeira versão funcional implementada em 12 de setembro de 2026. Permanecem planejadas as ações de escrita com confirmação e o envio manual de novos arquivos pelo composer.

Referência visual analisada: `codex-clipboard-5450bc1b-2bee-4ed5-8841-5fa7a6e4cec8.png`, 1200 × 900 px.

## 1. Objetivo

Adicionar à Visão geral um assistente conectado à IA escolhida pelo usuário. O assistente deverá conversar, consultar dados e arquivos pertencentes à conta atual, citar as fontes usadas e, futuramente, executar ações no ArtWeb OS mediante confirmação.

O produto deve aceitar quatro famílias de conexão:

- OpenAI;
- Google Gemini;
- Anthropic Claude;
- endpoint compatível com a API da OpenAI.

A assinatura de um produto de chat não substitui a chave de API. A interface deve explicar que consumo, limites e cobrança pertencem ao provedor escolhido pelo usuário.

## 2. Decisão de integração visual

A referência define a geometria, a densidade, a hierarquia e o comportamento do chat. A identidade continua sendo a do ArtWeb OS.

- Não haverá uma segunda sidebar dentro da Visão geral.
- A sidebar atual do ArtWeb OS assume a função da coluna esquerda da referência.
- O chat ocupa a área principal da Visão geral.
- A paleta aprovada de preto, cinza e branco prevalece sobre os gradientes azul, laranja, roxo e ciano da referência.
- A proporção, os espaços, os raios, o peso visual e a posição dos elementos seguem a referência.
- O nome, a marca e os ícones da aplicação de referência não serão reproduzidos.

Essa tradução mantém o desenho praticamente idêntico sem reintroduzir o roxo removido do ArtWeb OS.

## 3. Medição da referência

Todas as coordenadas abaixo usam a imagem original de 1200 × 900 px como base.

| Região | X | Y | Largura | Altura | Observação |
|---|---:|---:|---:|---:|---|
| Fundo externo | 0 | 0 | 1200 | 900 | Cinza uniforme |
| Janela completa | 89 | 113 | 1021 | 674 | Raio externo aproximado de 15 px |
| Barra superior da janela | 90 | 113 | 1020 | 34 | Controles e endereço |
| Sidebar | 90 | 147 | 207 | 639 | 20,3% da largura útil |
| Área principal | 297 | 147 | 813 | 639 | 79,7% da largura útil |
| Painel interno do chat | 297 | 188 | 807 | 592 | Raio aproximado de 12 px |
| Seletor de modelo | 102 | 155 | 185 | 49 | Bloco principal da sidebar |
| Busca lateral | 102 | 216 | 185 | 31 | Campo compacto |
| Navegação ativa | 102 | 286 | 185 | 29 | Realce com brilho interno |
| Saudação central | 538 | 272 | 325 | 47 | Título e subtítulo |
| Grupo de sugestões | 363 | 336 | 675 | 116 | Quatro cartões |
| Cartão de sugestão | — | 336 | 162 | 116 | Intervalo horizontal de 9 px |
| Sugestões rápidas | 411 | 634 | 568 | 30 | Rolagem horizontal |
| Composer | 411 | 675 | 568 | 82 | Campo e barra de contexto |
| Campo de mensagem | 415 | 679 | 560 | 38 | Botão de envio à direita |
| Barra inferior do composer | 415 | 721 | 560 | 31 | Prompts salvos e anexos |

### Escala para a interface real

Em um viewport de 1440 × 900 px, a sidebar existente permanece com 284–304 px. A área principal recebe o chat com os seguintes limites:

- margem externa da área principal: 32 px;
- cabeçalho do chat: 56 px de altura;
- painel principal: altura `calc(100vh - 69px)`;
- largura máxima do conteúdo conversacional: 760 px;
- largura do conjunto de sugestões: 760 px;
- composer: 640 px no mínimo confortável, 760 px no máximo;
- distância do composer ao rodapé: 24 px;
- distância da saudação ao topo útil: 84 px;
- cartões: quatro colunas de 181 px com 12 px de intervalo;
- raio do painel: 12 px;
- raio dos cartões: 10 px;
- raio do composer: 10 px;
- raio das sugestões rápidas: 16 px.

Quando a área principal tiver menos de 980 px, os cartões passam para duas colunas. Abaixo de 680 px, passam para uma faixa horizontal rolável. O composer ocupa `calc(100% - 32px)` no celular.

## 4. Tokens visuais

### Cores medidas na referência

| Uso | Valor de referência |
|---|---|
| Fundo externo | `#373739` |
| Barra superior | `#242424` |
| Sidebar | `#1E1E1E` |
| Área do chat | `#0A0A0A` |
| Superfície de campo | `#202020` |
| Texto principal | `#E0E0E1` |
| Texto secundário | `#9B9D9D` |
| Borda discreta | `#2E2E30` |
| Violeta da referência | `#6B57E0` |
| Azul da referência | `#325996` |
| Laranja da referência | `#9A5934` |
| Ciano da referência | `#388CA5` |

### Tokens que serão usados no ArtWeb OS

| Token | Valor | Uso |
|---|---|---|
| `--chat-canvas` | `#0A0A0A` | Fundo do chat |
| `--chat-sidebar` | `#161616` | Sidebar existente |
| `--chat-surface` | `#202022` | Composer, menus e cartões |
| `--chat-surface-hover` | `#29292B` | Hover e item selecionado |
| `--chat-border` | `#333335` | Bordas gerais |
| `--chat-border-strong` | `#505054` | Foco e seleção |
| `--chat-text` | `#EDEDEE` | Texto principal |
| `--chat-muted` | `#919195` | Texto auxiliar |
| `--chat-faint` | `#67676E` | Datas, metadados e placeholders |
| `--chat-accent` | `#F4F4F4` | Ícones ativos, envio e foco |
| `--chat-accent-ink` | `#111111` | Conteúdo sobre botão branco |

Os quatro cartões de sugestão usam gradientes monocromáticos distintos para manter a separação visual:

1. `linear-gradient(145deg, #20252B 0%, #17191C 66%, #111214 100%)`;
2. `linear-gradient(145deg, #2A2927 0%, #1B1A19 66%, #121212 100%)`;
3. `linear-gradient(145deg, #29272C 0%, #1C1B1E 66%, #121212 100%)`;
4. `linear-gradient(145deg, #202829 0%, #171B1C 66%, #111313 100%)`.

Nenhum desses cartões usa roxo saturado. Ícones, brilhos e estrelas usam branco entre 65% e 100% de opacidade.

## 5. Tipografia e espaçamento

- família: Arial, Helvetica, sans-serif, igual ao ArtWeb OS atual;
- saudação: 18 px, peso 500, altura de linha 24 px;
- subtítulo: 10 px, peso 400, cor secundária;
- título do cartão: 13 px, peso 500, altura de linha 18 px;
- descrição do cartão: 9 px, altura de linha 14 px;
- texto da conversa: 14 px, altura de linha 22 px;
- metadados e fontes: 10 px, altura de linha 15 px;
- campo de mensagem: 13 px;
- ícones gerais: 16 px, traço de 1,6 px;
- ícone do cartão: 20 px;
- escala de espaços: 4, 8, 12, 16, 24 e 32 px.

## 6. Estrutura e utilidade de cada parte

### 6.1 Seletor de provedor e modelo

Fica no cabeçalho do chat. Exibe provedor, modelo ativo e estado da conexão.

Utilidade:

- trocar entre OpenAI, Gemini, Claude e conexão compatível;
- selecionar um modelo disponível para a chave cadastrada;
- mostrar conexão válida, sem chave, limite atingido ou erro;
- abrir Configurações > Assistente sem abandonar a conversa.

### 6.2 Cabeçalho de ações

Replica a posição dos botões superiores da referência.

- **Nova conversa:** limpa o contexto visual e cria uma conversa separada;
- **Exportar:** gera Markdown ou PDF com mensagens e fontes;
- **Configurar IA:** abre o cadastro da chave e as permissões;
- **Mais opções:** renomear, fixar ou excluir a conversa.

### 6.3 Saudação

No estado vazio, apresenta “Como posso ajudar no seu workspace?”. O subtítulo informa: “Consulte projetos, tarefas, clientes, notas e arquivos com fontes”.

Ela desaparece com uma transição curta após a primeira mensagem para liberar espaço à conversa.

### 6.4 Cartões de sugestão

Cada cartão inicia uma solicitação real e contextual. As sugestões mudam conforme os dados existentes.

Sugestões iniciais:

1. **Planejar minha semana** — analisa tarefas abertas, prioridades e prazos e propõe uma ordem de execução;
2. **Revisar oportunidades** — lista leads parados, propostas abertas e próximos retornos do CRM;
3. **Resumir um projeto** — reúne tarefas, notas, cliente, decisões e arquivos ligados ao projeto escolhido;
4. **Organizar minhas notas** — encontra decisões, pendências e informações que podem virar tarefas ou memórias.

Regras das sugestões:

- não mostrar uma sugestão que dependa de dados inexistentes;
- trocar “Revisar oportunidades” por “Cadastrar o primeiro lead” quando o CRM estiver vazio;
- usar contagens reais quando fizer sentido, como “Revisar 3 tarefas atrasadas”;
- limitar a quatro cartões;
- permitir fechar uma sugestão e não mostrá-la novamente naquela sessão;
- nunca executar alterações apenas ao clicar: o clique preenche e envia uma pergunta de análise.

### 6.5 Sugestões rápidas sobre o composer

São chips contextuais de uma frase. Exemplos:

- “O que precisa da minha atenção hoje?”;
- “Resuma o projeto selecionado”;
- “Quais clientes estão sem tarefa ativa?”;
- “Transforme esta nota em tarefas”;
- “Encontre decisões sobre este projeto”.

O conjunto considera módulo aberto, projeto selecionado, itens atrasados e arquivos anexados. Deve ter rolagem horizontal e não quebrar em várias linhas.

### 6.6 Conversa

Mensagens do usuário ficam alinhadas à direita em superfície `#29292B`. Mensagens do assistente ficam à esquerda diretamente sobre o canvas.

Cada resposta pode conter:

- texto em Markdown;
- tabela curta;
- lista de itens encontrados;
- cartões de entidades do ArtWeb OS;
- fontes consultadas;
- ações sugeridas;
- estado das ferramentas utilizadas.

Uma resposta nunca afirma que leu um arquivo sem apresentar a fonte correspondente.

### 6.7 Fontes

Ao fim de uma resposta baseada em dados internos, aparece “Fontes usadas”. Cada fonte abre o item original no aplicativo.

Exemplos:

- `Projeto / Redesign do site`;
- `Nota / Reunião de 10 set.`;
- `Cliente / Eliana`;
- `Arquivo / proposta.md`.

O usuário consegue retirar uma fonte do contexto e refazer a pergunta.

### 6.8 Composer

Componente fixado na parte inferior do painel.

- campo de texto expansível de 44 a 160 px;
- envio com `Enter`;
- nova linha com `Shift + Enter`;
- botão de envio circular de 32 px;
- botão **Adicionar contexto** para selecionar projetos, tarefas, clientes, notas e arquivos;
- indicador da conversa e do modelo usados;
- botão **Parar** enquanto a resposta está sendo transmitida;
- contador de anexos, sem exibir tokens técnicos ao usuário comum.

### 6.9 Conversas fixadas e histórico

A sidebar atual recebe uma seção recolhível chamada **Conversas** abaixo da navegação principal.

- até cinco conversas fixadas;
- agrupamento por Hoje, Ontem, 7 dias e Mais antigas;
- busca pelo título e conteúdo;
- menu por conversa para renomear, fixar, exportar ou excluir;
- título gerado após a primeira resposta e editável pelo usuário.

## 7. Estado obrigatório antes da primeira conversa

Se não houver uma chave válida, o composer permanece bloqueado e o painel mostra:

> Conecte sua IA para começar
>
> Escolha OpenAI, Gemini, Claude ou outro serviço compatível e informe sua chave de API. Sua chave será protegida e usada apenas para responder dentro do seu workspace.

Ações disponíveis:

- botão primário **Configurar minha IA**;
- link **Como obter uma chave de API?**;
- texto sobre cobrança do provedor;
- opção **Testar conexão** no formulário de configuração.

O formulário contém:

- provedor;
- chave mascarada;
- endpoint, apenas para conexão compatível;
- modelo padrão;
- botão de teste;
- confirmação visual de sucesso;
- controle para remover a chave.

A chave nunca será armazenada em `localStorage`, enviada em registros de atividade ou devolvida completa ao navegador. Depois de salva, a interface mostra somente os quatro últimos caracteres.

## 8. Animações

Todas as animações usam `transform` e `opacity` para evitar travamentos.

### Envio

1. Ao pressionar enviar, o botão reduz para 94% por 90 ms.
2. A mensagem sobe 6 px e aparece em 160 ms com curva `cubic-bezier(.2,.8,.2,1)`.
3. O campo retorna à altura mínima em 180 ms.
4. O foco permanece no composer.

### Espera e ferramentas

- três pontos de 4 px alternam opacidade e deslocamento vertical em ciclo de 900 ms;
- a ferramenta em uso aparece em um chip: “Consultando tarefas”, “Lendo arquivo” ou “Buscando notas”;
- o chip recebe brilho horizontal monocromático de 1200 ms;
- ferramentas concluídas recebem um check desenhado em 180 ms;
- falhas recebem mensagem textual e botão **Tentar novamente**.

### Resposta em transmissão

- conteúdo aparece progressivamente conforme chega do servidor;
- cursor vertical de 1 px pisca a cada 720 ms;
- a rolagem acompanha a resposta apenas enquanto o usuário estiver no final;
- se o usuário subir, surge o botão **Ir para a resposta**;
- cartões e fontes aparecem com atraso escalonado de 35 ms, limitado a 210 ms.

### Transições gerais

- hover: 120 ms;
- menus: 140 ms;
- troca entre estado vazio e conversa: 180 ms;
- abertura de fontes: 180 ms;
- todas as animações são removidas ou reduzidas quando `prefers-reduced-motion: reduce` estiver ativo.

## 9. Acesso aos dados e arquivos

O agente não recebe acesso irrestrito ao computador. Ele acessa somente dados já presentes no ArtWeb OS e itens anexados explicitamente.

Escopo inicial de leitura:

- projetos;
- tarefas;
- clientes;
- leads;
- notas;
- memórias;
- arquivos criados ou enviados ao workspace;
- histórico de atividades relevante.

Regras:

- toda consulta exige o `user_id` da sessão;
- cada busca filtra os registros antes de enviá-los ao provedor;
- anexos ficam vinculados à conta e, quando aplicável, ao projeto;
- o sistema seleciona trechos relevantes em vez de enviar todos os documentos;
- respostas citam os itens utilizados;
- dados sensíveis não entram em logs;
- exclusão de conversa remove mensagens, fontes e anexos exclusivos da conversa.

## 10. Ferramentas do agente

### Primeira versão: leitura

- `list_projects`;
- `get_project_summary`;
- `list_tasks`;
- `list_overdue_tasks`;
- `search_clients`;
- `search_leads`;
- `search_notes`;
- `search_workspace_files`;
- `read_workspace_file`;
- `get_recent_activity`.

### Segunda versão: escrita com confirmação

- criar ou editar tarefa;
- criar nota;
- registrar memória;
- atualizar próxima ação de um lead;
- vincular arquivo a projeto;
- preparar resumo de cliente.

Antes de uma ação de escrita, o chat mostra um cartão com a alteração exata e os botões **Confirmar** e **Cancelar**. Exclusões não entram na primeira versão de escrita.

## 11. Arquitetura planejada

### Camada de provedores

Será criado um contrato único, `AIProviderAdapter`, com os métodos:

- validar chave;
- listar modelos;
- transmitir resposta;
- cancelar resposta;
- normalizar uso e erros;
- converter chamadas de ferramenta para o formato interno.

Cada provedor terá seu próprio adaptador. O restante do ArtWeb OS não dependerá do formato particular da OpenAI, Gemini ou Anthropic.

### Backend

Rotas previstas:

- `POST /api/ai/credentials` — cadastrar ou substituir chave;
- `DELETE /api/ai/credentials/:provider` — remover chave;
- `POST /api/ai/credentials/test` — validar conexão;
- `GET /api/ai/models` — listar modelos disponíveis;
- `POST /api/ai/conversations` — criar conversa;
- `GET /api/ai/conversations` — listar histórico;
- `POST /api/ai/chat` — iniciar resposta transmitida;
- `POST /api/ai/chat/:id/stop` — interromper geração;
- `GET /api/ai/sources/:id` — abrir uma fonte autorizada.

A transmissão deverá usar streaming HTTP. O servidor controla ferramentas, permissões e montagem do contexto antes de chamar o provedor.

### Persistência

Tabelas previstas:

- `ai_credentials` — provedor, chave cifrada, últimos quatro caracteres, usuário e datas;
- `ai_conversations` — título, usuário, modelo, estado e datas;
- `ai_messages` — papel, conteúdo, estado, uso e erro;
- `ai_message_sources` — entidade ou arquivo citado e trecho usado;
- `ai_tool_runs` — ferramenta, entrada saneada, resultado resumido e duração;
- `workspace_files` — metadados do arquivo, proprietário, projeto e localização;
- `workspace_file_chunks` — trechos indexados para busca contextual.

### Proteção das chaves

- cifrar no servidor com chave mestra fornecida pelo ambiente de hospedagem;
- usar um nonce diferente por credencial;
- nunca gravar a chave em logs;
- nunca incluir a chave em respostas da API;
- permitir revogação imediata;
- separar credenciais por usuário e provedor;
- limitar tentativas de teste e chamadas para evitar abuso.

## 12. Construção por etapas

### Etapa 1 — Fundação e configuração

Criar armazenamento seguro, adaptadores de provedor, tela de chave, teste de conexão e seletor de modelo.

### Etapa 2 — Interface fiel à referência

Criar painel vazio, cartões, chips, composer, histórico e estados responsivos usando os tokens e medidas desta spec.

### Etapa 3 — Conversa transmitida

Implementar mensagens, streaming, cancelamento, erros, repetição, animações e persistência do histórico.

### Etapa 4 — Contexto do ArtWeb OS

Adicionar ferramentas de leitura, seletor de contexto, busca de arquivos, fontes clicáveis e isolamento por usuário.

### Etapa 5 — Ações confirmadas

Adicionar ferramentas de escrita com prévia obrigatória, confirmação e registro na atividade recente.

### Etapa 6 — Verificação

Validar segurança, isolamento de contas, responsividade, teclado, acessibilidade, redução de movimento, falhas dos provedores e fidelidade visual em 1440 × 900, 1280 × 800 e 390 × 844 px.

## 13. Critérios de aceite

- usuário sem chave não consegue enviar mensagem e recebe instrução clara;
- chave nunca aparece completa após ser salva;
- troca de provedor não apaga conversas existentes;
- chat responde por streaming e pode ser interrompido;
- sugestões são baseadas nos dados disponíveis do workspace;
- toda informação obtida de arquivos internos apresenta fonte clicável;
- o agente nunca acessa dados pertencentes a outra conta;
- qualquer alteração de dados pede confirmação;
- sidebar, painel, cartões e composer mantêm as proporções desta spec;
- não existem acentos roxos na interface do ArtWeb OS;
- navegação completa funciona por teclado;
- `prefers-reduced-motion` é respeitado;
- falhas de chave, cota, rede e provedor têm mensagens diferentes e úteis.

## 14. Fora do primeiro lançamento

- treinamento ou ajuste fino de modelos;
- acesso livre ao sistema de arquivos do computador;
- execução autônoma de exclusões;
- compartilhamento de chave entre contas;
- cobrança de consumo de IA pelo ArtWeb OS;
- voz em tempo real;
- geração de imagem dentro do chat;
- automações executadas em segundo plano sem confirmação.
