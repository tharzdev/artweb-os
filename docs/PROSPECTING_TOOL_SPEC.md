# ArtWeb OS — Especificação da ferramenta de prospecção

**Status:** primeira versão implementada em 12 de setembro de 2026
**Implementação:** interface, credencial protegida, busca, filtros, histórico e importação para o CRM
**Integração externa:** pronta para ser ativada por cada usuário com sua chave do Google Places

## 1. Objetivo

Criar uma ferramenta dentro do CRM que encontre empresas com boa reputação e oportunidade clara para serviços digitais. O foco inicial será identificar negócios que:

- pertençam às categorias escolhidas pelo usuário;
- estejam na cidade ou região pesquisada;
- tenham nota igual ou superior ao filtro definido;
- tenham uma quantidade mínima de avaliações;
- estejam em funcionamento;
- não tenham um site informado na fonte consultada;
- possam ser adicionados ao CRM como leads, depois de revisão humana.

O resultado deve funcionar como uma lista qualificada de oportunidades para criação de site ou landing page.

## 2. Definição de “sem site”

Na primeira versão, um negócio será classificado como **sem site identificado** quando a fonte de locais não retornar um endereço no campo oficial de site da empresa.

Essa classificação significa “nenhum site informado na fonte consultada”. Ela não garante que a empresa não possua um domínio fora dessa fonte. A interface sempre mostrará essa diferença de forma clara.

Em uma fase posterior, poderá existir uma verificação complementar para procurar domínio próprio, página institucional e landing pages fora da fonte principal. Essa verificação não faz parte da primeira versão.

## 3. Local da ferramenta

A ferramenta ficará dentro do módulo **CRM**, em uma nova aba chamada **Prospecção**.

Estrutura planejada:

1. **Pipeline:** leads já cadastrados e andamento comercial.
2. **Prospecção:** busca de novas oportunidades.
3. **Importados:** empresas adicionadas ao CRM por meio da busca.

Também poderá existir um atalho **Buscar oportunidades** no topo da página de CRM.

## 4. Filtros de pesquisa

### Filtros principais

| Filtro | Comportamento | Valor inicial sugerido |
|---|---|---|
| Categoria | Segmento do negócio a pesquisar | Seleção obrigatória |
| Cidade ou região | Município, bairro, estado ou região | Obrigatório |
| Nota mínima | Exclui empresas abaixo da nota | 4,5 |
| Avaliações mínimas | Evita resultados com reputação pouco representativa | 20 |
| Quantidade desejada | Limita o volume exibido | 20 |
| Situação | Mantém apenas negócios em funcionamento | Aberto/operacional |
| Presença de site | Mantém apenas empresas sem site informado | Sem site |

### Filtros avançados

- somente empresas com telefone;
- somente empresas com endereço completo;
- incluir negócios que atendem em domicílio;
- excluir grandes redes e franquias;
- excluir empresas já cadastradas no CRM;
- escolher bairros ou cidades adicionais;
- ordenar por melhor oportunidade, maior nota ou maior número de avaliações.

## 5. Categorias sugeridas

As categorias iniciais devem priorizar negócios locais que costumam se beneficiar de presença digital e captação por landing page:

- clínicas odontológicas;
- clínicas de estética;
- psicólogos e terapeutas;
- academias e estúdios;
- restaurantes e cafeterias;
- advogados e escritórios jurídicos;
- contadores;
- arquitetos e designers de interiores;
- imobiliárias e corretores;
- escolas, cursos e professores particulares;
- oficinas e serviços automotivos;
- salões, barbearias e profissionais de beleza;
- empresas de eventos;
- fotógrafos e videomakers;
- lojas e comércios locais;
- prestadores de manutenção e serviços residenciais.

O usuário também poderá escrever uma categoria livre, como “clínicas veterinárias” ou “marcenarias”.

## 6. Composição da tela

### Cabeçalho

- título **Prospecção de clientes**;
- explicação curta: “Encontre empresas bem avaliadas que ainda não possuem site identificado”;
- botão **Nova pesquisa**;
- botão discreto **Configurar fonte de dados**.

### Painel de filtros

O painel será horizontal em telas grandes e empilhado em telas menores. Ele terá campos compactos, bordas cinza, fundo preto e botão branco, mantendo a estética do ArtWeb OS.

Ordem dos campos:

1. categoria;
2. localização;
3. nota mínima;
4. avaliações mínimas;
5. filtros avançados;
6. botão **Buscar oportunidades**.

### Resumo da pesquisa

Depois da busca, quatro indicadores serão apresentados:

- empresas analisadas;
- oportunidades encontradas;
- nota média;
- leads já existentes ignorados.

### Lista de resultados

Cada empresa mostrará:

- nome;
- categoria;
- nota média;
- total de avaliações;
- endereço;
- telefone, quando disponível;
- estado do negócio;
- selo **Sem site identificado**;
- link **Ver no mapa**;
- botão **Adicionar ao CRM**;
- botão **Ignorar**.

Em telas grandes, os resultados usarão uma tabela. Em telas pequenas, serão apresentados como cartões.

## 7. Pontuação de oportunidade

Cada resultado receberá uma pontuação interna de 0 a 100 para facilitar a ordem da lista.

| Critério | Peso planejado |
|---|---:|
| Não possui site informado | 35 pontos |
| Nota igual ou superior a 4,7 | 20 pontos |
| Mais de 50 avaliações | 15 pontos |
| Possui telefone | 10 pontos |
| Possui endereço completo | 8 pontos |
| Negócio local e independente | 7 pontos |
| Categoria com alta adequação a landing pages | 5 pontos |

A nota não será apresentada como uma verdade absoluta. A interface usará os níveis **Oportunidade alta**, **Oportunidade média** e **Revisar**.

## 8. Fluxo principal

1. O usuário abre **CRM → Prospecção**.
2. Se a fonte de dados ainda não estiver configurada, a tela explica o que será necessário futuramente.
3. O usuário escolhe categoria, localização e critérios mínimos.
4. O sistema consulta a fonte de empresas.
5. Resultados com site informado ou nota abaixo do limite são removidos.
6. Empresas repetidas ou já presentes no CRM são removidas.
7. As oportunidades restantes são ordenadas pela pontuação.
8. O usuário analisa cada negócio.
9. Ao clicar em **Adicionar ao CRM**, o sistema mostra uma prévia editável.
10. Somente depois da confirmação o lead entra no pipeline com status **Encontrado**.

## 9. Dados enviados ao CRM

Ao importar uma oportunidade, os campos serão preenchidos assim:

| Campo do CRM | Origem planejada |
|---|---|
| Empresa | Nome público do negócio |
| Contato | Em branco para pesquisa manual |
| Telefone | Telefone público retornado |
| Site | Em branco |
| Segmento | Categoria da pesquisa |
| Cidade | Localização encontrada |
| Fonte | Prospecção / fonte consultada |
| Potencial | Calculado pela pontuação |
| Status | Encontrado |
| Próxima ação | Validar contato e preparar abordagem |
| Observações | Nota, avaliações, endereço e link da origem |

O identificador externo da empresa será usado para impedir importações repetidas.

## 10. Histórico e organização

Cada pesquisa poderá manter:

- data e horário;
- categoria;
- localização;
- filtros usados;
- quantidade analisada;
- quantidade aprovada;
- empresas importadas;
- empresas ignoradas.

Pesquisas recentes aparecerão em uma coluna lateral. O usuário poderá reabrir os filtros e executar novamente quando desejar. Resultados antigos não serão tratados como atuais sem uma nova consulta.

## 11. Estados da interface

### Antes da configuração

Mensagem: **Configure uma fonte de empresas para iniciar a prospecção.**

A tela explicará que a chave será armazenada de forma protegida no servidor e que o serviço escolhido poderá cobrar pelo uso.

### Nenhum resultado

Mensagem: **Nenhuma oportunidade corresponde a todos os filtros.**

Ações sugeridas:

- diminuir a nota mínima;
- reduzir o mínimo de avaliações;
- ampliar a região;
- testar outra categoria.

### Erro da fonte

A mensagem deverá explicar se houve:

- chave inválida;
- serviço não ativado;
- limite de uso atingido;
- falha temporária;
- pesquisa ampla demais.

### Resultado já existente

A empresa será marcada como **Já está no CRM** e não poderá ser adicionada novamente.

## 12. Integração planejada

A primeira opção avaliada é o **Google Places API (New)**, porque sua busca textual fornece nome, endereço, nota, quantidade de avaliações, telefone, link do Maps e o campo oficial de website.

Planejamento técnico para uma etapa futura:

- a chave ficará cifrada no servidor;
- nenhuma chave será enviada ao navegador depois de salva;
- as chamadas sairão do servidor do ArtWeb OS;
- somente os campos necessários serão solicitados;
- a ferramenta exigirá usuário autenticado;
- serão aplicados limites por conta e por minuto;
- a interface mostrará que as consultas podem gerar cobrança do provedor.

Referências oficiais:

- [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Campos de dados do Places](https://developers.google.com/maps/documentation/places/web-service/data-fields)
- [Boas práticas para proteção de chaves](https://developers.google.com/maps/api-security-best-practices)

## 13. Estrutura técnica

Os itens principais desta seção já fazem parte da primeira versão funcional.

### Armazenamento

- credencial protegida da fonte de empresas;
- histórico de pesquisas;
- identificadores externos já importados;
- preferências padrão de filtros.

### Rotas futuras

- `GET /api/prospecting/credentials` — verificar se existe conexão;
- `POST /api/prospecting/credentials` — testar e salvar uma conexão;
- `DELETE /api/prospecting/credentials` — remover a conexão;
- `POST /api/prospecting/search` — executar busca filtrada;
- `POST /api/prospecting/import` — validar e adicionar uma empresa ao CRM;
- `GET /api/prospecting/history` — carregar pesquisas anteriores.

### Proteções

- autenticação obrigatória;
- chave cifrada;
- validação rigorosa dos filtros;
- limite de frequência;
- limite de páginas por pesquisa;
- deduplicação por identificador, telefone e nome/endereço;
- registro da origem dos dados;
- nenhum contato automático sem ação do usuário.

## 14. O que não faz parte da primeira versão

- envio automático de WhatsApp, e-mail ou ligação;
- disparos em massa;
- coleta de dados pessoais privados;
- busca automática de sócios ou proprietários;
- promessa de que a empresa não possui nenhum site na internet;
- criação automática de propostas;
- compra de anúncios;
- alterações no CRM sem revisão do usuário.

## 15. Critérios de conclusão futura

A ferramenta estará pronta quando:

- aceitar categoria e localização;
- filtrar nota e quantidade de avaliações;
- excluir resultados com site informado;
- exibir a origem e o link do negócio;
- ordenar oportunidades de forma compreensível;
- impedir duplicidades;
- adicionar um resultado ao CRM somente após confirmação;
- proteger a credencial da fonte;
- funcionar em desktop, aplicativo e telas móveis;
- manter o padrão visual preto, cinza e branco do ArtWeb OS.
