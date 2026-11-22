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

A aplicação gera links individuais no formato `/share?id=ID_DO_PRODUTO`. A pré-visualização dinâmica é agora preparada por **Firebase Hosting + Firebase Cloud Functions**, consultando os anúncios públicos no **Firebase Realtime Database**. A rota `/share-image?id=ID_DO_PRODUTO` entrega a fotografia guardada no campo `products/{id}/image` (Base64) ou redirecciona para uma imagem HTTPS.

### Configuração e publicação no Firebase

O repositório contém:
- `firebase.json`: rotas do Hosting para a função `socialPreview`.
- `functions/index.js`: função HTTP que gera Open Graph/Twitter Card e serve a imagem.
- `functions/package.json`: dependências da função (Node.js 20).

Antes da publicação:
1. Confirmar que o projecto Firebase activo é `baratinho-de-angola` e que a conta tem permissões de publicação.
2. Ter o Firebase CLI instalado e iniciar sessão com a conta autorizada.
3. Confirmar que o plano do projecto permite Cloud Functions (plano Blaze/billing activo).
4. Executar `firebase use baratinho-de-angola`.
5. Instalar dependências com `cd functions && npm install && cd ..`.
6. Publicar com `firebase deploy --only functions:socialPreview,hosting`.

### Domínio personalizado

O domínio actual indicado em `CNAME` é `baratinho.de.angola.apsanlda.com` e está actualmente configurado para GitHub Pages. Para migrar sem interrupção:
1. Primeiro publicar Hosting e a função no Firebase.
2. No Firebase Console → Hosting, adicionar `baratinho.de.angola.apsanlda.com` como domínio personalizado e concluir a verificação DNS indicada pelo Firebase.
3. Só depois de o Firebase confirmar o domínio como ligado, alterar os registos DNS para os valores fornecidos pelo Firebase e retirar a configuração antiga do GitHub Pages.
4. Testar `/share?id=ID_DO_PRODUTO` e `/share-image?id=ID_DO_PRODUTO` no domínio personalizado.

**Importante:** os ficheiros antigos `cloudflare-worker.js` e `wrangler.toml` foram mantidos temporariamente como referência de migração. Não é necessário publicar nem associar um Cloudflare Worker quando o domínio já estiver a servir pelo Firebase Hosting. Não apagar nem alterar o DNS antigo antes de o domínio Firebase estar verificado, para evitar indisponibilidade da plataforma.

As redes sociais guardam pré-visualizações em cache. Depois de actualizar um anúncio, pode ser necessário pedir nova leitura/actualização na ferramenta de depuração da rede social.
