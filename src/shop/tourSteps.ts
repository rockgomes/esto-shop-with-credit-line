import type { Phase } from './phase';

/** One control that a customer clicks on the way to the next step. */
export interface TourClick {
  /** How the tour names the control when it asks the reader to tap it. */
  name: string;
  find: () => HTMLElement | null;
}

const withText = (selector: string, text: string) => () =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) =>
    (el.textContent ?? '').trim().startsWith(text),
  ) ?? null;

const MENU_FIND: TourClick = {
  name: '"Find products" in the menu',
  find: withText('.nav-item', 'Find products'),
};
const FIRST_PRODUCT: TourClick = {
  name: 'the first product',
  find: () => document.querySelector<HTMLElement>('.grid .card.product'),
};

export interface TourStep {
  /** A short name, used on the "Next" button of the step before. */
  name: string;
  phase: Phase;
  /** The page of the prototype that the step opens. */
  hash?: string;
  /** True when the step opens a product page. The app picks the product. */
  product?: boolean;
  /** The clicks that lead from the step before to this step, in order. */
  path?: TourClick[];
  /** The part of the page that the step shows. */
  target: string;
  title: string;
  text: string;
}

export const TOUR: TourStep[] = [
  {
    name: 'Dashboard',
    phase: 1,
    hash: '#/dashboard',
    target: 'section[aria-labelledby="picks-title"]',
    title: 'The customer sees products on the Dashboard',
    text: 'The tour has two parts: Phase 1, then Phase 2. Today the Dashboard gives the customer one thing to do with the limit: take money out. In this concept, the customer also sees real products from partner stores that cost less than their free limit.',
  },
  {
    name: 'Find products',
    path: [MENU_FIND],
    phase: 1,
    hash: '#/',
    target: '.search-panel',
    title: 'The customer searches products from partner stores',
    text: '"Find products" is a new part of the app. For each product, the customer sees the lowest monthly payment, and if the price is within their free limit. The filter "Fits my limit" is on for this tour. You can try a search now.',
  },
  {
    name: 'A product',
    path: [FIRST_PRODUCT],
    phase: 1,
    product: true,
    target: 'section[aria-labelledby="offers-title"]',
    title: 'The customer compares the stores for one product',
    text: "The customer sees which partner stores sell the product, and the price at each store. The bar shows the customer's limit before and after the purchase. In Phase 1, the customer buys on the store's website, as today. The second button takes the money for the product out of the limit.",
  },
  {
    name: 'Price alert',
    phase: 1,
    product: true,
    target: '.watch-btn',
    title: 'The customer asks ESTO to watch the price',
    text: 'When a store lowers the price, ESTO sends the customer an email. So ESTO has a reason to bring the customer back to the app. You can click the button now.',
  },
  {
    name: 'Phase 2',
    path: [
      { name: '"Switch to Phase 2" at the top', find: withText('.proto-tag .link', 'Switch to Phase 2') },
    ],
    phase: 2,
    product: true,
    target: '.proto-tag',
    title: 'The tour now changes to Phase 2',
    text: 'Phase 1 ends here. Phase 2 adds one thing: the customer pays for the product using the credit line at checkout. The product page is the same page as before, now in Phase 2.',
  },
  {
    name: 'Pay with the credit line',
    phase: 2,
    product: true,
    target: 'section[aria-labelledby="offers-title"]',
    title: 'The customer pays for the product using the credit line at checkout',
    text: 'The button takes the customer to the product page at the store. At the store checkout, the customer chooses ESTO. Then, on ESTO\'s payment page, they choose "Credit line". The customer fills in no application and signs no new contract. You can click the button to try. No real order is made.',
  },
  {
    name: 'Transactions',
    path: [{ name: '"Transactions" in the menu', find: withText('.nav-item', 'Transactions') }],
    phase: 2,
    hash: '#/transactions',
    target: '.table-wrap',
    title: 'The customer sees the purchase in the app',
    text: 'After the customer pays with the credit line, the purchase is a row in this table, with the type "Purchase". The customer also sees the purchase on the Dashboard and on the Credit Line page.',
  },
  {
    name: 'How it works',
    path: [
      { name: '"Credit Line" in the menu', find: withText('.nav-item', 'Credit Line') },
      { name: 'the tab "How it works"', find: withText('.tabs [role="tab"]', 'How it works') },
    ],
    phase: 2,
    hash: '#/credit-line?tab=how-it-works',
    target: '.twoways',
    title: 'The customer learns the two ways to use the limit',
    text: 'The customer can take money out, as today, or pay at a store. Paying at a store with the credit line is new in Phase 2.',
  },
];
