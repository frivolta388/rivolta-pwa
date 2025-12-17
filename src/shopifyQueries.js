export const PRODUCTS_QUERY = `
query Products($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    edges {
      cursor
      node {
        id
        handle
        title
        availableForSale
        featuredImage { url altText }
        variants(first: 10) {
          edges {
            node {
              id
              availableForSale
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
}
`;
export const MENU_QUERY = `
query Menu($handle: String!) {
  menu(handle: $handle) {
    title
    items {
      title
      url
      items {
        title
        url
        items {
          title
          url
        }
      }
    }
  }
}
`;
export const CART_CREATE = `
mutation CartCreate {
  cartCreate {
    cart { id checkoutUrl totalQuantity }
    userErrors { field message }
  }
}
`;

export const CART_LINES_ADD = `
mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { id checkoutUrl totalQuantity }
    userErrors { field message }
  }
}
`;

