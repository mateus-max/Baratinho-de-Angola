const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

if (!getApps().length) {
  initializeApp({
    databaseURL: "https://baratinho-de-angola-default-rtdb.firebaseio.com"
  });
}

const db = getDatabase();

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function priceAOA(value) {
  return new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 })
    .format(Number(value) || 0) + " AOA";
}

function validId(id) {
  return /^[A-Za-z0-9_-]{5,100}$/.test(id || "");
}

async function getPublicProduct(id) {
  if (!validId(id)) return null;
  const snap = await db.ref("products/" + id).get();
  const product = snap.val();
  return product && product.status === "active" ? product : null;
}

function imageResponse(product) {
  const data = String(product.image || "");
  const match = data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (match) {
    const bytes = Buffer.from(match[2], "base64");
    return {
      status: 200,
      contentType: match[1],
      body: bytes,
      cache: "public, max-age=3600"
    };
  }

  if (/^https:\/\//i.test(data)) {
    return { redirect: data };
  }

  return { status: 404, body: "Imagem indisponível" };
}

exports.socialPreview = onRequest({
  region: "us-central1",
  timeoutSeconds: 15,
  memory: "256MiB",
  maxInstances: 20,
  invoker: "public"
}, async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.set("Allow", "GET, HEAD").status(405).send("Method not allowed");
      return;
    }

    const path = (req.path || req.url || "").split("?")[0];
    const id = String(req.query.id || "");

    if (path === "/share-image") {
      const product = await getPublicProduct(id);
      if (!product) {
        res.status(404).send("Imagem não encontrada");
        return;
      }

      const result = imageResponse(product);
      if (result.redirect) {
        res.redirect(302, result.redirect);
        return;
      }
      if (result.status !== 200) {
        res.status(result.status).send(result.body);
        return;
      }
      res.set({
        "Content-Type": result.contentType,
        "Cache-Control": result.cache,
        "X-Content-Type-Options": "nosniff"
      });
      res.status(200);
      if (req.method === "HEAD") res.end();
      else res.send(result.body);
      return;
    }

    if (path !== "/share") {
      res.status(404).send("Not found");
      return;
    }

    const product = await getPublicProduct(id);
    if (!product) {
      res.status(404).set("Content-Type", "text/html; charset=utf-8")
        .send("<!doctype html><html lang='pt-AO'><meta charset='utf-8'><title>Produto indisponível</title><p>Este anúncio já não está disponível no Baratinho de Angola.</p></html>");
      return;
    }

    const title = String(product.name || "Produto");
    const description = String(product.description || "Veja fotografias, preço e detalhes deste anúncio no Baratinho de Angola.")
      .replace(/\s+/g, " ").slice(0, 220);
    const sale = Number(product.promoPrice) > 0 && Number(product.promoPrice) < Number(product.price);
    const price = priceAOA(sale ? product.promoPrice : product.price);
    const place = [product.municipality, product.province].filter(Boolean).join(", ");
    const fullDescription = [description, price, place].filter(Boolean).join(" · ");
    const origin = `${req.protocol}://${req.get("host")}`;
    const canonical = origin + "/#/public-catalog?produto=" + encodeURIComponent(id);
    const shareUrl = origin + "/share?id=" + encodeURIComponent(id);
    const image = origin + "/share-image?id=" + encodeURIComponent(id);

    const html = `<!doctype html>
<html lang="pt-AO"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Baratinho de Angola</title>
<meta name="description" content="${esc(fullDescription)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Baratinho de Angola">
<meta property="og:title" content="${esc(title)} | Baratinho de Angola">
<meta property="og:description" content="${esc(fullDescription)}">
<meta property="og:url" content="${esc(shareUrl)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} | Baratinho de Angola">
<meta name="twitter:description" content="${esc(fullDescription)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="1;url=${esc(canonical)}">
<script>location.replace(${JSON.stringify(canonical)})</script>
</head><body><h1>${esc(title)}</h1><p>${esc(fullDescription)}</p>
<p><a href="${esc(canonical)}">Abrir no Baratinho de Angola</a></p></body></html>`;

    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff"
    });
    if (req.method === "HEAD") res.status(200).end();
    else res.status(200).send(html);
  } catch (error) {
    console.error("Erro na pré-visualização social:", error);
    res.status(502).set("Content-Type", "text/plain; charset=utf-8")
      .send("Erro ao preparar a pré-visualização do produto.");
  }
});
