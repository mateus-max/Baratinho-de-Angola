const DB = "https://baratinho-de-angola-default-rtdb.firebaseio.com";

function esc(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function absolute(request, path) {
  return new URL(path, request.url).href;
}
function priceAOA(value) {
  return new Intl.NumberFormat("pt-AO",{maximumFractionDigits:0}).format(Number(value)||0)+" AOA";
}
async function productFor(id) {
  if (!/^[A-Za-z0-9_-]{5,100}$/.test(id||"")) return null;
  const response = await fetch(DB+"/products/"+encodeURIComponent(id)+".json");
  if (!response.ok) return null;
  const product = await response.json();
  return product && product.status === "active" ? product : null;
}
function productImageUrl(request,id) {
  return absolute(request,"/share-image?id="+encodeURIComponent(id));
}
async function serveImage(product) {
  const data = String(product.image||"");
  const match = data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (match) {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    return new Response(bytes,{headers:{"content-type":match[1],"cache-control":"public, max-age=3600","x-content-type-options":"nosniff"}});
  }
  if (/^https:\/\//i.test(data)) {
    const upstream=await fetch(data,{redirect:"follow"});
    if(upstream.ok && /^image\//.test(upstream.headers.get("content-type")||""))return new Response(upstream.body,{headers:{"content-type":upstream.headers.get("content-type"),"cache-control":"public, max-age=3600","x-content-type-options":"nosniff"}});
  }
  return new Response("Imagem indisponível",{status:404});
}
async function handle(request) {
  const url=new URL(request.url);
  const id=url.searchParams.get("id")||"";
  const product=await productFor(id);
  if(url.pathname==="/share-image") {
    if(!product)return new Response("Not found",{status:404});
    return serveImage(product);
  }
  if(url.pathname!=="/share")return fetch(request);
  if(!product)return new Response("<!doctype html><meta charset=utf-8><title>Produto indisponível</title><p>Este anúncio já não está disponível no Baratinho de Angola.</p>",{status:404,headers:{"content-type":"text/html;charset=utf-8"}});
  const title=String(product.name||"Produto");
  const description=String(product.description||"Veja fotografias, preço e detalhes deste anúncio no Baratinho de Angola.").replace(/\s+/g," ").slice(0,220);
  const sale=Number(product.promoPrice)>0&&Number(product.promoPrice)<Number(product.price);
  const price=priceAOA(sale?product.promoPrice:product.price);
  const place=[product.municipality,product.province].filter(Boolean).join(", ");
  const fullDescription=[description,price,place].filter(Boolean).join(" · ");
  const canonical=absolute(request,"/#/public-catalog?produto="+encodeURIComponent(id));
  const image=productImageUrl(request,id);
  const html='<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' | Baratinho de Angola</title><meta name="description" content="'+esc(fullDescription)+'"><link rel="canonical" href="'+esc(canonical)+'"><meta property="og:type" content="product"><meta property="og:site_name" content="Baratinho de Angola"><meta property="og:title" content="'+esc(title)+' | Baratinho de Angola"><meta property="og:description" content="'+esc(fullDescription)+'"><meta property="og:url" content="'+esc(absolute(request,"/share?id="+encodeURIComponent(id)))+'"><meta property="og:image" content="'+esc(image)+'"><meta property="og:image:alt" content="'+esc(title)+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+' | Baratinho de Angola"><meta name="twitter:description" content="'+esc(fullDescription)+'"><meta name="twitter:image" content="'+esc(image)+'"><meta http-equiv="refresh" content="1;url='+esc(canonical)+'"><script>location.replace('+JSON.stringify(canonical)+')</script></head><body><h1>'+esc(title)+'</h1><p>'+esc(fullDescription)+'</p><p><a href="'+esc(canonical)+'">Abrir no Baratinho de Angola</a></p></body></html>';
  return new Response(html,{headers:{"content-type":"text/html;charset=utf-8","cache-control":"public, max-age=60","x-content-type-options":"nosniff"}});
}
export default { async fetch(request) { try { return await handle(request); } catch (error) { return new Response("Erro ao preparar pré-visualização do produto.",{status:502,headers:{"content-type":"text/plain;charset=utf-8"}}); } } };
