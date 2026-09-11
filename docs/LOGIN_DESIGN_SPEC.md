# ArtWeb OS — Especificação visual da autenticação

## Referência e objetivo

Esta especificação traduz a referência fornecida em regras reproduzíveis para as telas de login e cadastro do ArtWeb OS. A imagem-base mede **1451 × 1084 px**. O produto mantém o idioma em português e o fluxo real de autenticação do ArtWeb OS.

## Geometria da composição

| Elemento | Medida na referência | Regra implementada |
| --- | ---: | --- |
| Área externa | 1451 × 1084 px | `100vw × 100vh` |
| Margem lateral da moldura | 79 px | `5,45vw` |
| Margem superior/inferior | 78 px / 80 px | `7,2vh` |
| Moldura | 1295 × 925 px | máximo de `1295 × 925 px` |
| Espessura da moldura | 9 px | `9px` |
| Painel do formulário | 43,7% | primeira coluna do grid |
| Painel da arte | 56,3% | segunda coluna do grid |
| Formulário | 322 px | largura fixa com limite responsivo |
| Campos | 322 × 45 px | sem arredondamento |
| Botão principal | 322 × 44 px | sem arredondamento |
| Símbolo | 70 × 70 px | círculo e corte diagonal em CSS |

No desktop, o topo do formulário fica em **33,25%** da altura interna da moldura. O símbolo fica em **16,9%**. O cadastro sobe para **23,5%** porque inclui um campo e uma introdução adicionais.

## Cores medidas

| Uso | Cor |
| --- | --- |
| Fundo externo | `#0B0B0B` |
| Moldura | `#222121` |
| Fundo interno | `#0F0F0F` |
| Campo, início do gradiente | `#202020` |
| Campo, fim do gradiente | `#1C1C1C` |
| Borda do campo | `#323232` |
| Texto principal | `#F7F7F7` |
| Texto secundário | `#B4B4B7` |
| Placeholder e ícones | `#9A9A9E` |
| Botão principal | `#FEFEFF` |
| Texto do botão | `#0B0B0B` |
| Linha divisória | `#555555` |

As cores foram amostradas diretamente da imagem: o fundo externo tem mediana RGB **(11, 11, 11)**, a moldura **(34, 33, 33)**, o interior **(15, 15, 15)**, os campos **(29, 29, 29)** e o botão **(254, 254, 255)**.

## Tipografia e ritmo

- Família: Arial, Helvetica, sans-serif.
- Rótulos: 14 px, peso 500.
- Texto de campo: 14 px.
- Texto auxiliar e links: 12 px.
- Espaço entre rótulo e campo: 10 px.
- Espaço entre grupos de campo: 20 px.
- Espaço antes do botão: 28 px.
- Espaço antes do divisor: 39 px.
- A estética depende de contraste, alinhamento e espaço vazio; sombras, brilhos e cantos arredondados não fazem parte desta tela.

## Arte do painel direito

O painel usa a própria referência como fonte visual para manter os pontos, as colunas, o contraste e a textura. A imagem é ampliada verticalmente em 150 px, deslocada 76 px para cima e 78 px para a direita. Esse recorte elimina o formulário original e as margens externas da referência, preservando apenas a área arquitetônica.

Arquivo usado pelo produto: `public/assets/login-reference.png`.

## Comportamento

- **Login:** e-mail, senha, botão Entrar e link para cadastro.
- **Cadastro:** título curto, nome completo, e-mail, senha, botão Criar conta e link para login.
- **Senha:** o botão de visibilidade continua funcional.
- **Mensagens:** sucesso e erro aparecem acima do formulário sem mudar a identidade monocromática.
- **Acesso alternativo:** a faixa inferior identifica o ArtWeb OS e não simula um provedor externo que o sistema não oferece.

## Responsividade

- Até 900 px, a arte lateral é removida e a moldura passa a ter no máximo 540 px.
- Até 480 px, a moldura encosta nas bordas, os campos ganham 48 px de altura e o formulário preserva 18 px de respiro lateral.
- O contraste, o símbolo e a hierarquia visual permanecem iguais em todas as larguras.
