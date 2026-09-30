# ArtWeb OS

O **ArtWeb OS** é um workspace criativo para organizar clientes, projetos, tarefas, arquivos e rotinas comerciais em um único ambiente. O sistema combina gestão de trabalho, prospecção e recursos de inteligência artificial em uma interface minimalista.

## Acessar o aplicativo

[Abrir o ArtWeb OS](https://artweb-workspace.arthurrodriguescom77.chatgpt.site/)

## Recursos principais

- CRM com pipeline de leads e clientes;
- busca de empresas com filtros usando Google Places;
- análise de leads e criação de mensagens comerciais personalizadas;
- assistente com suporte a OpenAI, Gemini, Claude e APIs compatíveis;
- projetos em dashboard e canvas infinito;
- calendário com criação e edição de eventos;
- arquivos, notas, links, imagens e documentos;
- perfil personalizável e temas claro e escuro;
- interface responsiva para diferentes tamanhos de tela.

## Download

A versão mais recente está disponível na página de releases:

[Baixar o ArtWeb OS v0.1.1](https://github.com/tharzdev/artweb-os/releases/tag/v0.1.1)

O GitHub também oferece o código-fonte compactado:

- [Download em ZIP](https://github.com/tharzdev/artweb-os/archive/refs/tags/v0.1.1.zip)
- [Download em TAR.GZ](https://github.com/tharzdev/artweb-os/archive/refs/tags/v0.1.1.tar.gz)

> Esta versão distribui a aplicação web e seu código-fonte. Um instalador nativo para Windows ainda não faz parte desta publicação.

## Executar localmente

### Requisitos

- Node.js 22.13 ou mais recente;
- Git.

### Instalação

```bash
git clone https://github.com/tharzdev/artweb-os.git
cd artweb-os
npm run install:ci
npm run dev
```

Abra o endereço informado no terminal para acessar o ambiente local.

## Configuração de serviços externos

As integrações com Google Places e provedores de IA usam chaves fornecidas pelo próprio usuário dentro do aplicativo. As chaves não fazem parte do código-fonte.

Em produção, configure `AI_CREDENTIAL_KEY` como um segredo do servidor contendo exatamente 32 bytes codificados em Base64. Nunca publique esse valor em arquivos `.env`, commits ou capturas de tela.

## Segurança

- chaves de API criptografadas com AES-GCM;
- sessões armazenadas como hashes;
- cookies de sessão `HttpOnly`, `Secure` e `SameSite=Lax`;
- consultas isoladas pelo identificador do proprietário;
- arquivos `.env`, bancos locais e estados de desenvolvimento ignorados pelo Git.

Consulte [SECURITY.md](SECURITY.md) para relatar uma vulnerabilidade de forma responsável.

## Tecnologias

- React 19;
- Next.js 16 e Vinext;
- TypeScript;
- Cloudflare Workers e D1;
- Drizzle ORM;
- Tailwind CSS e componentes Radix/shadcn.

## Status

O projeto está em fase inicial de desenvolvimento. A versão `v0.1.1` é um pré-lançamento funcional e pode receber mudanças de estrutura, segurança e experiência.

## Licença

Ainda não foi definida uma licença de código aberto. O código pode ser visualizado e baixado, mas os direitos de reutilização, modificação e redistribuição permanecem reservados ao autor até a publicação de uma licença.
