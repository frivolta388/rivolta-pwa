const domain = import.meta.env.VITE_SHOP_DOMAIN;
const token = import.meta.env.VITE_STOREFRONT_TOKEN;
const version = import.meta.env.VITE_STOREFRONT_API_VERSION;

const endpoint = `https://${domain}/api/${version}/graphql.json`;

export async function shopifyQuery(query, variables = {}) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error(json);
    throw new Error("Shopify API error");
  }

  return json.data;
}
