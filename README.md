# Baratinho de Angola

Marketplace nacional para descoberta e comercialização de produtos físicos em Angola.

## Primeira versão implementada

- Página inicial de entrada e criação de conta.
- Autenticação Firebase por e-mail e palavra-passe.
- Perfis de comprador e vendedor.
- Painel responsivo com menu lateral.
- Catálogo público de produtos.
- Publicação de produtos para vendedores aprovados.
- Fotografia principal guardada como Base64 no Realtime Database (limite de 400 KB).
- Pesquisa por nome, categoria e localização.
- Criação e consulta de pedidos de encomenda.
- Favoritos e edição do nome do perfil.

## Firebase

A aplicação utiliza Firebase Authentication e Firebase Realtime Database. Não utiliza Firebase Storage, Firestore, Local Storage ou IndexedDB para persistência da aplicação.

A autenticação utiliza `inMemoryPersistence`. Por isso, depois de actualizar ou fechar a página, o utilizador terá de iniciar sessão novamente.

### Configuração necessária

1. Activar E-mail/palavra-passe no Firebase Authentication.
2. Publicar regras de Realtime Database compatíveis com os caminhos utilizados pela aplicação.
3. Criar o administrador directamente na consola, nunca através do formulário público.
4. Aprovar vendedores através de uma operação administrativa segura, definindo `sellers/{uid}/status = "approved"`.
5. Confirmar o domínio de alojamento nos domínios autorizados do Firebase Authentication.

## Importante antes de aceitar pagamentos reais

Esta versão ainda não integra prestador de pagamentos, custódia de fundos, reembolsos, liquidação de vendedores, transportadoras, rastreio real, chat, notificações, vídeo ou painel administrativo. Os pedidos ficam com estado `pending_payment`; isso não significa que o pagamento tenha sido confirmado.

Não utilizar esta versão para movimentar dinheiro real antes de implementar integração segura com prestador de pagamentos autorizado, validação confiável no servidor e regras de segurança testadas no Firebase Emulator.

## Imagens

As imagens são convertidas para Data URL/Base64 e guardadas directamente no Realtime Database. O limite actual é 400 KB por imagem. Esta abordagem aumenta o consumo de dados e não é adequada para vídeos grandes. A funcionalidade de vídeo ainda não está implementada.
