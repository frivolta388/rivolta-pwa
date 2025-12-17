import { useEffect, useState } from "react";
import { shopifyQuery } from "./shopify";
import {
  PRODUCTS_QUERY,
  MENU_QUERY,
  CART_CREATE,
  CART_LINES_ADD,
} from "./shopifyQueries";
import logo from "./assets/logo-rivolta.jpg";

function MenuBar({ menu }) {
  if (!menu?.items?.length) return null;

  return (
    <nav style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "10px 0 22px" }}>
      {menu.items.map((it) => (
        <div key={it.title} style={{ minWidth: 120 }}>
          <a
            href={it.url}
            style={{
              textDecoration: "none",
              color: "#111",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {it.title}
          </a>

          {it.items?.length > 0 && (
            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {it.items.map((sub) => (
                <a
                  key={sub.title}
                  href={sub.url}
                  style={{ textDecoration: "none", color: "#444", fontSize: 12 }}
                >
                  {sub.title}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
  const [loadingMore, setLoadingMore] = useState(false);

  const [menu, setMenu] = useState(null);

  // Cart state
  const [cartId, setCartId] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  const shopDomain = import.meta.env.VITE_SHOP_DOMAIN;

  async function loadProducts(after = null, replace = false) {
    const data = await shopifyQuery(PRODUCTS_QUERY, { first: 24, after });
    const nodes = data.products.edges.map((e) => e.node);

    setProducts((prev) => (replace ? nodes : [...prev, ...nodes]));
    setPageInfo(data.products.pageInfo);
  }

  async function ensureCart() {
    if (cartId && checkoutUrl) return { cartId, checkoutUrl };

    const c = await shopifyQuery(CART_CREATE);
    const created = c.cartCreate?.cart;
    const errs = c.cartCreate?.userErrors;

    if (errs?.length) {
      console.error("CartCreate userErrors:", errs);
      throw new Error(errs.map((e) => e.message).join(", "));
    }

    setCartId(created.id);
    setCheckoutUrl(created.checkoutUrl);
    return { cartId: created.id, checkoutUrl: created.checkoutUrl };
  }

  async function addToCartAndCheckout(variantId) {
    const { cartId: cid } = await ensureCart();

    const r = await shopifyQuery(CART_LINES_ADD, {
      cartId: cid,
      lines: [{ merchandiseId: variantId, quantity: 1 }],
    });

    const errs = r.cartLinesAdd?.userErrors;
    if (errs?.length) {
      console.error("CartLinesAdd userErrors:", errs);
      throw new Error(errs.map((e) => e.message).join(", "));
    }

    const url = r.cartLinesAdd.cart.checkoutUrl;
    setCheckoutUrl(url);

    // Vai al checkout Shopify
    window.location.href = url;
  }

  useEffect(() => {
    (async () => {
      try {
        // Prodotti
        await loadProducts(null, true);

        // Menu
        const handle = import.meta.env.VITE_MAIN_MENU_HANDLE;
        const m = await shopifyQuery(MENU_QUERY, { handle });
        setMenu(m.menu);

        // Crea carrello subito (opzionale, ma rende add-to-cart istantaneo)
        await ensureCart();
      } catch (err) {
        console.error("Errore init:", err);
      }
    })();
  }, []);

  async function onLoadMore() {
    try {
      setLoadingMore(true);
      await loadProducts(pageInfo.endCursor, false);
    } finally {
      setLoadingMore(false);
    }
  }

  function productUrl(handle) {
    return `https://${shopDomain}/products/${handle}`;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header: logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <a href={`https://${shopDomain}`} style={{ display: "inline-block" }}>
          <img src={logo} alt="Rivolta 1883" style={{ height: 46, width: "auto", display: "block" }} />
        </a>

        {checkoutUrl && (
          <a
            href={checkoutUrl}
            style={{
              marginLeft: "auto",
              textDecoration: "none",
              color: "#111",
              border: "1px solid #111",
              padding: "8px 10px",
              letterSpacing: 1,
              fontSize: 12,
            }}
          >
            CHECKOUT
          </a>
        )}
      </div>

      <MenuBar menu={menu} />

      {/* Prodotti */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {products.map((p) => {
          const v = p.variants.edges[0]?.node;
          const canBuy = !!v?.availableForSale;

          return (
            <div key={p.id} style={{ border: "1px solid #ddd", padding: 12 }}>
              {p.featuredImage && (
                <a href={productUrl(p.handle)} style={{ display: "block" }}>
                  <img
                    src={p.featuredImage.url}
                    alt={p.featuredImage.altText || p.title}
                    style={{
                      width: "100%",
                      height: 320,
                      objectFit: "contain",
                      background: "#fff",
                      border: "1px solid #eee",
                      display: "block",
                    }}
                  />
                </a>
              )}

              <a
                href={productUrl(p.handle)}
                style={{ textDecoration: "none", color: "#111" }}
              >
                <h3 style={{ fontSize: 14, margin: "12px 0 6px" }}>{p.title}</h3>
              </a>

              <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
                {v?.price.amount} {v?.price.currencyCode}
              </p>

              <button
                disabled={!canBuy}
                onClick={() => addToCartAndCheckout(v.id)}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #111",
                  background: canBuy ? "#111" : "transparent",
                  color: canBuy ? "#fff" : "#777",
                  cursor: canBuy ? "pointer" : "not-allowed",
                  letterSpacing: 1,
                  fontSize: 12,
                }}
              >
                {canBuy ? "ADD TO CART" : "OUT OF STOCK"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {pageInfo.hasNextPage && (
        <div style={{ marginTop: 22 }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              padding: "10px 14px",
              border: "1px solid #111",
              background: "#fff",
              cursor: loadingMore ? "not-allowed" : "pointer",
              letterSpacing: 1,
              fontSize: 12,
            }}
          >
            {loadingMore ? "CARICAMENTO..." : "CARICA ALTRI"}
          </button>
        </div>
      )}
    </div>
  );
}
