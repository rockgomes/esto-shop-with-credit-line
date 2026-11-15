# Shop with your credit line

An unofficial concept for the ESTO **Product Builder** test: a working prototype and a write-up.

By Rock Gomes, product designer. Portfolio: [rockgomes.com](https://www.rockgomes.com)

**Open it:** [esto-shop-with-credit-line.netlify.app](https://esto-shop-with-credit-line.netlify.app)

> Not affiliated with or endorsed by ESTO. The customer, the limit, and the payments in the prototype are examples. Product data belongs to each store.

## The idea

A credit line customer has a free limit, and the app gives it one action: take money out. This concept puts real products from ESTO partner stores next to the limit.

- **Phase 1.** The customer finds a product in ESTO, sees the monthly price, and buys at the store, as today.
- **Phase 2.** The customer pays with the credit line at the store checkout, with no application and no new contract.

## What you can do on the page

- **Read the write-up.** The start page holds it: the problem, the idea, how to measure impact, what was left out, how to get it live, the use of AI, and a business case.
- **Take the tour.** 8 steps through Phase 1 and Phase 2.
- **Open the prototype.** Dashboard, "Find products", the product page, the Credit Line page, the checkout of Phase 2, and Transactions.

## What is real, and what is an example

- **Real.** Products, prices, pictures, stock, and links. They come from the open product feeds that six ESTO partner stores publish in the Hinnavaatlus price list format. The same product is matched across stores by barcode (GTIN). No AI is used inside the product.
- **Example.** The customer, the limit, the amount in use, and the rows in Transactions. The 37.10% rate is the highest interest rate in ESTO's own credit line example.
- **Stand-in.** The store checkout and ESTO's payment page in Phase 2. No order is made.

## Run it

```bash
npm install
npm run dev
```

## Check it

```bash
npm run check   # typecheck, lint, format check, tests
npm run build
```

CI runs the same steps on every push and pull request.

## How it is put together

| File                                    | What it holds                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `scripts/build-catalog.mjs`             | Reads the store feeds and writes `public/data/catalog.json`.                                     |
| `scripts/catalog-lib.mjs`               | Feed parsing, barcode matching, the listing rules, and price history. Pure functions with tests. |
| `.github/workflows/refresh-catalog.yml` | Runs the script once a day and commits the result.                                               |
| `src/shop/Start.tsx`                    | The start page with the write-up.                                                                |
| `src/shop/ShopApp.tsx`                  | The pages of the prototype.                                                                      |
| `src/shop/Tour.tsx`, `tourSteps.ts`     | The guided tour.                                                                                 |
| `src/shop/Checkout.tsx`                 | Phase 2: the store checkout stand-in and ESTO's payment page.                                    |
| `src/shop/search.ts`                    | Search, filters, and ranking.                                                                    |
| `src/shop/credit.ts`                    | Free limit, payment plan, and lowest allowed payment.                                            |
| `src/shop/watch.ts`                     | Price watch and price alerts.                                                                    |

Run `node scripts/build-catalog.mjs` to refresh the catalog by hand.

## Stack

React 19, TypeScript, Vite, Vitest, and Testing Library. Plain CSS with custom properties, no UI library. Built with [Claude Code](https://claude.com/claude-code).
