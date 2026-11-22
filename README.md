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

## Pré-visualização de links partilhados (WhatsApp, Facebook e outros)

A aplicação gera links individuais no formato `/share?id=ID_DO_PRODUTO`. O ficheiro `cloudflare-worker.js` prepara os metadados Open Graph específicos do anúncio (título, descrição, preço, localização e fotografia), e encaminha visitantes normais para a página do produto na aplicação. A rota `/share-image?id=ID_DO_PRODUTO` disponibiliza a fotografia guardada como Base64 no Realtime Database.

### Activação necessária no Cloudflare

O Worker precisa de ser publicado e associado ao domínio; guardar o ficheiro no GitHub, por si só, não activa esta funcionalidade.

1. No Cloudflare, criar um Worker e colar o conteúdo de `cloudflare-worker.js`.
2. Publicar o Worker.
3. Em **Settings → Domains & Routes**, adicionar a rota `baratinho.de.angola.apsanlda.com/share*` e também `baratinho.de.angola.apsanlda.com/share-image*` para o mesmo Worker.
4. Confirmar que o domínio está activo no Cloudflare e que o Worker consegue ler os anúncios públicos em `https://baratinho-de-angola-default-rtdb.firebaseio.com/products/{id}.json`.
5. Testar o link `https://baratinho.de.angola.apsanlda.com/share?id=ID_DO_PRODUTO` no Facebook Sharing Debugger e no WhatsApp.

As redes sociais guardam pré-visualizações em cache. Depois de actualizar um anúncio, pode ser necessário pedir nova leitura/actualização da pré-visualização na ferramenta de depuração da rede social.

**Nota:** o HTML da aplicação estático não consegue, sozinho, gerar metadados diferentes por produto para os robôs das redes sociais. É por isso que o Worker é necessário. As tags genéricas no `index.html` servem como fallback para a página principal.
