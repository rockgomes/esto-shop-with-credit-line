import { useEffect, useState, type ReactNode } from 'react';
import type { Catalog } from './catalog';
import type { Phase } from './phase';

/** Each claim on the page points to one of these. The app has no public link. */
const SOURCES = [
  {
    name: 'ESTO bond presentation 2026',
    note: 'slides 6, 12, 13, and 14 (PDF)',
    url: 'https://signetbank.com/wp-content/uploads/2026/05/ESTO-Bond-2026-presentation.pdf',
  },
  {
    name: 'ESTO press release for the first half of 2026',
    note: 'page 1 (PDF)',
    url: 'https://global.esto.eu/documents/press-esto-group-delivers-record-1h26-credit-issuance-as-loan.pdf',
  },
  { name: 'ESTO credit line page', note: 'esto.ee/en/credit-line', url: 'https://esto.ee/en/credit-line' },
  {
    name: 'ESTO payment methods page for stores',
    note: 'esto.ee/b2b/en/payment-methods',
    url: 'https://esto.ee/b2b/en/payment-methods',
  },
  {
    name: 'ESTO developer page',
    note: 'esto.ee/b2b/en/developers',
    url: 'https://esto.ee/b2b/en/developers',
  },
  { name: 'ESTO home page', note: 'esto.ee/en', url: 'https://esto.ee/en' },
  {
    name: 'ESTO company presentation 2022',
    note: 'slide 9 (PDF)',
    url: 'https://global.esto.eu/documents/presentation-company-introduction.pdf',
  },
  { name: 'The ESTO app', note: 'Seen with my own account. The app has no public link.', url: null },
] as const;

/** A source mark, as in an encyclopedia: [1]. A mark opens its source. */
function S({ n }: { n: number }) {
  const source = SOURCES[n - 1];
  const label = `Source ${n}: ${source.name}`;
  return source.url ? (
    <a
      className="src"
      href={source.url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={source.name}
    >
      [{n}]
    </a>
  ) : (
    <span className="src" title={source.name}>
      <span className="visually-hidden">{label}</span>
      <span aria-hidden="true">[{n}]</span>
    </span>
  );
}

const PARTS = [
  ['p1', '1. The problem'],
  ['p2', '2. The idea'],
  ['p3', '3. How to measure impact'],
  ['p4', '4. What I left out'],
  ['p5', '5. How to get it live'],
  ['p6', '6. How I used AI'],
  ['p7', '7. Business case'],
  ['sources', 'Sources'],
] as const;

function goTo(id: string) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const part = document.getElementById(id);
  part?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  part?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}

/** The part that the reader is in now: the last one whose top passed the top of the window. */
function useCurrentPart(): string {
  const [current, setCurrent] = useState<string>(PARTS[0][0]);
  useEffect(() => {
    const update = () => {
      let now: string = PARTS[0][0];
      for (const [id] of PARTS) {
        const part = document.getElementById(id);
        if (part && part.getBoundingClientRect().top <= 120) now = id;
      }
      // At the end of the page, the last part is the current one, even if it is short.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setCurrent(atEnd && window.scrollY > 0 ? PARTS[PARTS.length - 1][0] : now);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return current;
}

/** The rest of a part. It stays closed until the reader asks for it. */
function More({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="wu-more">
      <summary>
        <span className="when-closed">Read the full part: {label}</span>
        <span className="when-open">Show less</span>
      </summary>
      <ol className="wu-pts">{children}</ol>
    </details>
  );
}

/** One numbered point of the write-up. */
function Pt({ n, children }: { n: string; children: ReactNode }) {
  // A number with three parts, such as 4.7.1, is a sub-point of 4.7.
  const sub = n.split('.').length > 2;
  return (
    <li className={sub ? 'sub' : undefined}>
      <b>{n}</b>
      <span>{children}</span>
    </li>
  );
}

/**
 * The page before the prototype. It is the write-up that the assignment asks
 * for: each part shows a few sentences, and the rest opens on request.
 */
export default function Start({
  catalog,
  onOpen,
  onTour,
}: {
  catalog: Catalog | null;
  onOpen: (phase: Phase, productId?: string, hash?: string) => void;
  onTour: () => void;
}) {
  const current = useCurrentPart();
  const see = (phase: Phase, hash: string, label: string) => (
    <button className="link" onClick={() => onOpen(phase, undefined, hash)}>
      {label}
    </button>
  );

  return (
    <main className="wu">
      <header>
        <p className="wu-by">A concept for ESTO by Rock Gomes, for the Product Builder test.</p>
        <h1>Shop with your credit line</h1>
        <div className="wu-lead">
          <p>
            Customers do not use the credit that ESTO has already given them. About 150 million euros of
            credit limits are not used.
            <S n={1} />
          </p>
          <p>
            The cause, in my view: the credit line offers money, and people want the thing that the money gets
            them.
          </p>
          <p>
            <strong>
              The idea: ESTO puts real products from its partner stores next to the limit. Then the customer
              pays for them with the credit line, at the store checkout.
            </strong>
          </p>
        </div>
        <div className="wu-go">
          <button className="btn" onClick={() => onOpen(1)}>
            Open the prototype
          </button>
          <button className="btn outline" onClick={onTour}>
            Take the tour
          </button>
          <span className="muted small" aria-live="polite">
            {catalog
              ? `The prototype runs on ${catalog.products.length.toLocaleString('en-GB')} real products and today's prices from ${catalog.stores.length} ESTO partner stores.`
              : 'The prototype runs on real products and today’s prices from ESTO partner stores.'}
          </span>
        </div>
      </header>

      <section className="balance wu-book" aria-label="Credit limits of all ESTO customers">
        <div className="balance-top">
          <div>
            <span className="balance-label">
              Credit limits that ESTO customers do not use
              <S n={1} />
            </span>
            <strong className="balance-value">about 150 million €</strong>
          </div>
          <span className="tag">All ESTO customers</span>
        </div>
        <div className="bar" aria-hidden="true">
          <i className="seg-used" style={{ flexGrow: 30 }} />
          <i className="seg-free" style={{ flexGrow: 70 }} />
        </div>
        <dl className="balance-ends">
          <div>
            <dt>
              <span className="dot seg-used" />
              In use
            </dt>
            <dd>about 30%</dd>
          </div>
          <div>
            <dt>
              <span className="dot seg-free" />
              Not in use
            </dt>
            <dd>about 70%</dd>
          </div>
        </dl>
      </section>

      <div className="wu-cols">
        <nav className="wu-nav" aria-label="Parts of this page">
          {PARTS.map(([id, name]) => (
            <button key={id} aria-current={current === id ? 'true' : undefined} onClick={() => goTo(id)}>
              {name}
            </button>
          ))}
        </nav>

        <div>
          <section className="wu-part" id="p1" aria-labelledby="p1-h">
            <h2 id="p1-h" tabIndex={-1}>
              1. The problem, and who has it
            </h2>
            <p>
              In the ESTO app, the credit line has one action: take money out to a bank account. Nothing in
              the app shows a thing that the limit can buy.
              <S n={8} />
            </p>
            <p>
              So a customer with a free limit has no reason to use it until the day they need cash. ESTO earns
              nothing on a limit that is not used.
            </p>
            <p>As a result, ESTO has the money, but not the trigger. This concept aims to change that.</p>
            <More label="what ESTO loses, the customer, and the stores">
              <Pt n="1.1">
                The problem: customers do not use the credit that ESTO has already given them. About 150
                million euros of credit limits are not used, and only about 30% is in use.
                <S n={1} /> ESTO earns nothing on a limit that is not used.
              </Pt>
              <Pt n="1.2">
                The cause, in my view: the credit line offers money, and people do not want money. They want
                the thing that the money gets them: a phone, a TV, a sofa. So a customer with a free limit has
                no reason to use it until the day they need cash.
              </Pt>
              <Pt n="1.3">
                In the ESTO app, the credit line has one action: take money out to a bank account. Nothing in
                the app shows a thing that the limit can buy.
                <S n={8} /> A customer who does take money out then solves the real problem somewhere else,
                and ESTO has no part in that purchase.
              </Pt>
              <Pt n="1.4">
                Taking money out is flexible, because cash works in any store. So one action is not a problem
                in itself. The problem is what ESTO loses when the customer leaves with cash. ESTO loses three
                things.
              </Pt>
              <Pt n="1.5">
                First, ESTO is not there when the want starts. A person wants a phone when they look at a
                phone, not when they look at a balance. So only a person who has already decided to borrow
                uses the limit. The app gives nobody a reason to start.
              </Pt>
              <Pt n="1.6">
                Second, the credit line is the only ESTO product that is money without a thing. Hire purchase,
                ESTO 3, and Pay Later all sit at a store checkout, next to the product.
                <S n={4} /> ESTO already knows that credit sells next to a product. The credit line is the one
                product that does not sit next to a product.
              </Pt>
              <Pt n="1.7">
                Third, cash can go to any store, and ESTO earns only the interest. A purchase at a partner
                store can earn more. The bond deck says ESTO earns from stores through a take-rate, placement
                fees, and a subscription tier.
                <S n={1} /> I think a credit line purchase would also earn the take-rate. ESTO must confirm
                that.
              </Pt>
              <Pt n="1.8">The customer has four problems of their own today. (All four are checked.)</Pt>
              <Pt n="1.9">
                The customer cannot see what the limit can buy, or what a product costs them each month,
                before they decide.
              </Pt>
              <Pt n="1.10">The app has no list of the stores that work with ESTO.</Pt>
              <Pt n="1.11">
                Cash from the limit takes 1 to 3 working days, or it costs 19,90 euros to get it now.
              </Pt>
              <Pt n="1.12">
                At a partner store checkout, a customer with a free limit still fills in an application and
                signs a new contract, like a new customer.
              </Pt>
              <Pt n="1.13">
                The stores have a problem too. ESTO promises stores "ready-to-buy shoppers".
                <S n={4} /> ESTO has 865,000+ customers
                <S n={6} /> and 10,800+ points of sale.
                <S n={1} /> But the app does not send one customer to a store. A customer with an approved,
                free limit is the most ready-to-buy shopper that ESTO has.
              </Pt>
            </More>
          </section>

          <section className="wu-part" id="p2" aria-labelledby="p2-h">
            <h2 id="p2-h" tabIndex={-1}>
              2. The idea
            </h2>
            <p>
              The idea is to turn the limit from money into products, in two steps. In Phase 1, the customer
              finds a product inside ESTO, such as a phone or a sofa, and sees what it costs them each month.
              In Phase 2, the customer also pays for it with the credit line, at the checkout of the partner
              store, with no application and no new contract.
            </p>
            <p>
              The customer gets the credit the same way as before. What changes is where ESTO sits in the
              buying process.
            </p>
            <table className="wu-where">
              <caption className="visually-hidden">Where ESTO is part of a purchase</caption>
              <thead>
                <tr>
                  <td />
                  <th scope="col">Choosing the product</th>
                  <th scope="col">Paying</th>
                  <th scope="col">Paying back</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Today</th>
                  <td data-label="Choosing">In a store, without ESTO</td>
                  <td data-label="Paying">With cash from the limit</td>
                  <td data-label="Paying back" className="is-esto">
                    In ESTO
                  </td>
                </tr>
                <tr>
                  <th scope="row">Phase 1</th>
                  <td data-label="Choosing" className="is-esto">
                    In ESTO
                  </td>
                  <td data-label="Paying">At the store, as today</td>
                  <td data-label="Paying back" className="is-esto">
                    In ESTO
                  </td>
                </tr>
                <tr>
                  <th scope="row">Phase 2</th>
                  <td data-label="Choosing" className="is-esto">
                    In ESTO
                  </td>
                  <td data-label="Paying" className="is-esto">
                    With the credit line, on ESTO's payment page
                  </td>
                  <td data-label="Paying back" className="is-esto">
                    In ESTO
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="wu-open">
              <button className="btn" onClick={() => onOpen(1)}>
                Open Phase 1
              </button>
              <button className="btn outline" onClick={() => onOpen(2)}>
                Open Phase 2
              </button>
            </div>
            <More label="the eight places that change, and the effect on ESTO">
              <Pt n="2.3">
                Today ESTO comes later in the process. A person visits a store and browses for phones. They
                decide to get one. Only then do they think of ESTO, and they open the app for one reason: to
                get cash.
              </Pt>
              <Pt n="2.4">
                With this concept, ESTO can come in earlier. At first, the person still goes to a store. But
                now they know that ESTO shows which partner stores have the same product, and at what price.
                So they open ESTO before they buy. The next time, they can start in ESTO.
              </Pt>
              <Pt n="2.5">
                The goal is that ESTO is part of the whole purchase: choosing the product, paying, and paying
                back. In Phase 1, ESTO is part of choosing and paying back. In Phase 2, ESTO is also part of
                paying. I expect this, but I have no data for it yet.
              </Pt>
              <Pt n="2.6">
                A product search alone changes little. The search is in the menu, and a customer can find it
                there, but many will not look. So the Dashboard leads to the search and makes it visible. The
                customer must also understand the limit, be able to pay with it, and see the purchase after.
                That is why the concept changes eight places, and not one.
              </Pt>
              <Pt n="2.7">
                On the Dashboard, the customer sees real products that fit the limit, right under the balance.
                In the prototype these are products that are in stock, sold by two or more stores, and at a
                price that fits. The ones sold by the most stores come first. A real version should use what
                the customer searched or watched. A short part, "How your credit line works", shows there
                until the first purchase. {see(1, '#/dashboard', 'See the Dashboard')}
              </Pt>
              <Pt n="2.8">
                In a new part of the app, "Find products", the customer searches real products from partner
                stores. They see the price at each store, the monthly price for them, and if the product fits
                the free limit. {see(1, '#/', 'See Find products')}
              </Pt>
              <Pt n="2.9">
                On the product page inside the ESTO app, one bar shows the limit before and after the
                purchase. The page also says in plain numbers how the customer pays it back. The page has two
                buttons. The first button opens the product page at the store. The second button takes the
                price of the product out of the limit. In Phase 2, the buttons do the same things, but the
                first button has a new label. The label tells the customer to use the credit line at the store
                checkout, and that it has no fees.
              </Pt>
              <Pt n="2.10">
                The customer can watch a price. ESTO sends an email when a store goes lower. The email gives
                the customer a reason to come back.
              </Pt>
              <Pt n="2.11">
                The Credit Line page gets three tabs with clear names: "My credit line", "How it works", and
                "FAQ". "How it works" shows the two ways to use the limit side by side: take money out, or pay
                at a store. {see(2, '#/credit-line?tab=how-it-works', 'See How it works')}
              </Pt>
              <Pt n="2.12">
                The balance bar gets clear colours. The used part and the free part each have their own
                colour, so the customer reads the bar the right way.
              </Pt>
              <Pt n="2.13">
                At a store checkout (Phase 2), ESTO's payment page gets one more method: "Credit line". The
                customer does not fill in an application and does not sign a new contract. If the limit is too
                low, the page says how much is missing and offers the other methods.
              </Pt>
              <Pt n="2.14">
                After a purchase, the customer sees it on the Dashboard, on the Credit Line page, and in
                Transactions. {see(2, '#/transactions', 'See Transactions')}
              </Pt>
              <Pt n="2.15">
                The concept changes ESTO's numbers in three ways. First, more of the limit is in use, and
                interest is 74% of ESTO's revenue.
                <S n={1} /> Second, purchases go to partner stores, where ESTO also earns from the store.
                Third, a store could pay ESTO to show its products higher in "Find products". ESTO already
                earns this kind of fee, and the bond deck calls it "placement fees".
                <S n={1} /> I am sure of the first. The second and the third are what I expect, and ESTO would
                have to confirm them.
              </Pt>
              <Pt n="2.16">
                The concept ships in two phases. In Phase 1, the customer finds a product in ESTO and buys it
                at the store, as today. Phase 1 needs nothing new from the stores. In Phase 2, the customer
                pays using the credit line that will be available at the store checkout.
              </Pt>
            </More>
          </section>

          <section className="wu-part" id="p3" aria-labelledby="p3-h">
            <h2 id="p3-h" tabIndex={-1}>
              3. How to measure impact
            </h2>
            <p>
              In Phase 1, the test passes if more customers buy at partner stores through ESTO. In Phase 2,
              the test passes if the share of the credit limit in use goes up. Today that share is about 30%.
              <S n={1} /> We fix these two pass rules before the test starts. We also count how many customers
              open "Find products", how many go to the store, how many buy, and how many buy a second time.
              These counts show where customers stop. Late payments and complaints to support must not go up.
            </p>
            <p>
              We test with two random groups of credit line customers for 8 weeks. The test group gets the app
              with the changes from this concept. The control group gets the app as it is today.
            </p>
            <More label="the test, the five steps we count, and one risk">
              <Pt n="3.2">
                We run a test like this. We pick credit line customers at random, and we split them into two
                groups of the same size. The test group gets the app with "Find products" and the other
                changes from this concept. The control group gets the app as it is today. Because we pick at
                random, the two groups are alike. So, if the test group buys more, the concept is the reason.
              </Pt>
              <Pt n="3.3">
                The test runs for 8 weeks. We need to see purchases, and we also need to see the payments come
                back. 8 weeks gives us 2 months of possible repayments. This is our assumption. ESTO's own
                purchase numbers can make the test shorter or longer. After the test, every customer gets the
                app with the changes.
              </Pt>
              <Pt n="3.4">
                After 8 weeks, we compare the two groups. In Phase 1, we compare two numbers that ESTO already
                has: purchases at partner stores paid through ESTO, and withdrawals from the limit. In Phase
                2, we compare the share of the credit limit that is in use. If the numbers of the test group
                are higher, the concept works.
              </Pt>
              <Pt n="3.5">
                In the test group, we count how many customers do each step in the list below (3.5.1 to
                3.5.5). The steps are in the order in which a customer does them, so the list is a funnel. The
                counts show at which step we lose the most customers.
              </Pt>
              <Pt n="3.5.1">The customer opens "Find products".</Pt>
              <Pt n="3.5.2">
                The customer clicks the Buy button. We also keep what people search for and do not find. That
                list tells us which products and stores to add.
              </Pt>
              <Pt n="3.5.3">
                The customer buys at the store. We can count the purchases that the customer pays with an ESTO
                method. We cannot count the purchases that the customer pays another way, for example with a
                bank card. In Phase 1, we also count the customers who click "Take out" on the product page
                and finish the withdrawal. We treat such a withdrawal as a sign of a purchase, because the
                customer started it from a product.
              </Pt>
              <Pt n="3.5.4">
                In Phase 2 only: the customer chooses "Credit line" on ESTO's payment page. We also count how
                many customers choose ESTO 3 or Pay Later there, because of the risk in 3.5.6.
              </Pt>
              <Pt n="3.5.5">
                The customer buys a second time. When the customer pays back the first purchase, the limit in
                use goes down again. It stays up only if the customer buys again.
              </Pt>
              <Pt n="3.5.6">
                There is one risk in Phase 2. ESTO 3 and Pay Later cost the customer no interest, so a
                customer may choose them and not the credit line. ESTO still earns a fee from the store on
                that purchase, but the unused limit stays unused. The number in 3.5.4 shows how often
                customers choose each method.
              </Pt>
              <Pt n="3.6">
                The step where we lose the most customers is the step we look at first. The count does not
                tell us why customers stop there. To learn why, we ask customers, and then we decide what to
                change. ESTO cannot change some things, such as the store's website.
              </Pt>
              <Pt n="3.7">Two numbers must not get worse: late payments, and complaints to support.</Pt>
            </More>
          </section>

          <section className="wu-part" id="p4" aria-labelledby="p4-h">
            <h2 id="p4-h" tabIndex={-1}>
              4. What I left out, and why
            </h2>
            <p>
              I did not build real payment or real login. The store checkout, the ESTO payment page, and the
              step "Confirm who you are" are stand-ins, and no order is made.
            </p>
            <p>I also looked at three other ideas, and I did not choose them.</p>
            <More label="all six things, the three other ideas, why this one, and the edge cases">
              <Pt n="4.1">
                I did not build real payment. The store checkout and the ESTO payment page in Phase 2 are
                stand-ins, and no order is made. A real one needs ESTO's systems.
              </Pt>
              <Pt n="4.2">I did not build real login. The step "Confirm who you are" is a stand-in.</Pt>
              <Pt n="4.3">
                {' '}
                I did not include stores without an open product feed. The prototype has 6 stores, and all 6
                are in Estonia. Other stores need an agreement or another data source. I did not check which
                product feeds exist in Latvia and Lithuania.
              </Pt>
              <Pt n="4.4">
                I did not use the customer's own interest rate. The prototype uses 37.10%, the highest rate in
                ESTO's own credit line example. ESTO says rates start from 19%.
                <S n={3} />
              </Pt>
              <Pt n="4.5">
                I did not rebuild the other ESTO methods at checkout: hire purchase, ESTO 3, and Pay Later.
                The concept does not change them.
              </Pt>
              <Pt n="4.6">
                I did not design a card. Other companies use a one-time card to pay anywhere. I found no ESTO
                source that talks about a card.
              </Pt>
              <Pt n="4.7">I also looked at three other ideas, and I did not choose them.</Pt>
              <Pt n="4.7.1">
                Switch: the customer turns a purchase that they already paid with their own money into credit.
                ESTO showed this idea in its 2022 company deck.
                <S n={7} /> Revolut, Affirm, and Curve do it, but only for purchases on their own card. ESTO
                has no card and no live bank connection. So the customer would have to upload a bank statement
                by hand, and that is too much work for them.
              </Pt>
              <Pt n="4.7.2">
                Pay any invoice: the customer pays any bill from the credit line. Twisto, Zip, and Holm Bank
                already offer this. It is a good idea, but it uses only half of what ESTO has. ESTO's CEO
                wants to turn "the user base and merchant network" into credit line revenue.
                <S n={2} /> Pay any invoice uses the customers and leaves the partner stores out.
              </Pt>
              <Pt n="4.7.3">
                A card: the customer pays anywhere with a one-time card from the limit. Twisto and Zip do
                this. I found no ESTO source that talks about a card, and I do not know if ESTO's licence
                allows one.
              </Pt>
              <Pt n="4.8">
                I chose "Shop with your credit line" for three reasons. First, the prototype is real: it runs
                on today's products and prices from ESTO partner stores. Second, it aims at real money: about
                150 million euros of limits that are not used.
                <S n={1} /> Third, the effort is low for what it can return. Phase 1 needs nothing new from
                the stores. It uses the store feeds, the app, and the limits that already exist.
              </Pt>
              <Pt n="4.9">
                The prototype shows the main path: the customer finds a product, buys it, and pays it back. I
                know of seven edge cases. I did not include them, so that the concept stays easy to
                understand. Each case is below, with one possible way to handle it.
              </Pt>
              <Pt n="4.9.1">
                The customer returns the product (Phase 2). The store reports the return, and the amount goes
                back into the customer's limit. Hire purchase, ESTO 3, and Pay Later have returns too, so a
                process for returns probably exists already.
              </Pt>
              <Pt n="4.9.2">
                The cart costs more than the product (Phase 2). The customer adds delivery or a second product
                at the store. At the store checkout, the customer chooses ESTO, and the store sends them to
                ESTO's payment page. That page shows the full amount of the cart, and the limit before and
                after that amount. If the amount is higher than the free limit, the page says how much is
                missing and offers the other methods.
              </Pt>
              <Pt n="4.9.3">
                The price at the store is different (both phases). The app reads the store feeds once a day,
                and a store can change a price in between. So the app shows the time when it last read the
                price, and it says that the price at the store is the one that counts.
              </Pt>
              <Pt n="4.9.4">
                The product is sold out at the store (both phases). The cause is the same as in 4.9.3: the app
                reads the feeds once a day, so it can show a product that the store sold out an hour ago. The
                customer learns this at the store. They can go back to the product page in the app, which
                lists the other stores that sell the same product.
              </Pt>
              <Pt n="4.9.5">
                The store cancels the order after the customer paid (Phase 2). The amount goes back into the
                limit, as with a return.
              </Pt>
              <Pt n="4.9.6">
                The customer has a late payment (both phases). ESTO decides the rule. One possible rule: the
                customer cannot buy with the credit line until they pay the late amount.
              </Pt>
              <Pt n="4.9.7">
                The feed of a store stops working (both phases). The app hides the products of that store when
                the last feed is too old.
              </Pt>
            </More>
          </section>

          <section className="wu-part" id="p5" aria-labelledby="p5-h">
            <h2 id="p5-h" tabIndex={-1}>
              5. How to get it live
            </h2>
            <p>
              Phase 1 has five steps and needs nothing new from the stores. I found the product feeds for the
              prototype myself, and I asked no store for anything.
            </p>
            <p>Phase 2 has five steps. Three of them need an answer from ESTO.</p>
            <More label="the ten steps, who does what, and the challenges of Phase 2">
              <Pt n="5.1">Phase 1 has five steps:</Pt>
              <Pt n="5.2">
                Test the prototype before engineers build anything. The test has two rounds. First, I test
                inside ESTO, with people from other teams. This round is fast, and it finds the obvious
                problems. Second, I test with 5 to 8 credit line customers. In both rounds, each person gets
                one task: find a product that fits your limit, and tell me how you would buy it. I watch where
                they stop and what they do not understand, and I change the prototype between the rounds. The
                prototype runs on real products, so this test needs no work from engineers. I have not done
                this test yet.
              </Pt>
              <Pt n="5.3">
                Get the product feeds of the partner stores. I found the feeds for the prototype myself, and I
                asked no store for anything. 6 ESTO partners publish an open feed in the Hinnavaatlus format:
                ONOFF, Photopoint, Digioutlet, Apotheka, Laureen, and Laptopid. The prototype reads these 6
                feeds once a day and holds 16,879 real products. ESTO can start with the same 6 feeds and ask
                the other partners for the same file.
              </Pt>
              <Pt n="5.4">
                Add the "Find products" part to the app. The new part needs the customer's free limit and
                rate, and the app already has both.
              </Pt>
              <Pt n="5.5">Send the price alert by email.</Pt>
              <Pt n="5.6">Show the new part to a small group first, and measure the numbers in part 3.</Pt>
              <Pt n="5.7">Phase 2 has five steps:</Pt>
              <Pt n="5.8">
                Add "Credit line" as a method on ESTO's own payment page. The customer sees their own free
                limit there, after they confirm who they are.
              </Pt>
              <Pt n="5.9">
                Name the credit line on the store's product page, in general words. Stores already show ESTO
                there today: Medpoint and Laptopid show an ESTO monthly-payment calculator. If the store must
                update its plugin for the new text is not confirmed.
              </Pt>
              <Pt n="5.10">
                Check with legal if each purchase needs a signature. The need for a signature is not
                confirmed.
              </Pt>
              <Pt n="5.11">
                Check if a store must change anything at its checkout. ESTO's developer page says the payment
                page "already includes every method enabled on your account".
                <S n={5} /> What a store must change is not confirmed.
              </Pt>
              <Pt n="5.12">
                Show the method to a small group of customers first, at every store, and measure the numbers
                in part 3.
              </Pt>
              <Pt n="5.13">Who does what.</Pt>
              <Pt n="5.13.1">
                What I build myself: the prototype, the test with customers, the design of every page, and the
                first version of the job that reads the store feeds. I also write down what we count in the
                test in part 3.
              </Pt>
              <Pt n="5.13.2">
                What I hand over to engineers: "Find products" inside the real app, with the customer's real
                limit and rate. The price alert email. The job that reads the feeds, so that it runs in ESTO's
                systems every day and warns someone when a feed stops. In Phase 2, the new method on the
                payment page.
              </Pt>
              <Pt n="5.13.3">
                Who I involve: the product team that owns the credit line, because this concept works on their
                goal. The payments team, for the payment page in Phase 2. Compliance, for the question about
                the signature. The people who work with the partner stores, for the feeds.
              </Pt>
              <Pt n="5.14">
                Phase 2 has two challenges. Each one needs people and time from ESTO. I cannot say how much,
                because that depends on ESTO's systems.
              </Pt>
              <Pt n="5.14.1">
                The signature. The concept promises that the customer signs no new contract for a purchase. I
                could not confirm that the law allows this. If the law needs a signature for each purchase,
                the credit line is as much work for the customer as hire purchase, and Phase 2 loses its main
                advantage.
              </Pt>
              <Pt n="5.14.2">
                The payment page. The page must read the free limit at the moment of the purchase. It must
                also hold the amount until the store confirms the order, so that the customer cannot use the
                same money two times. The team that owns the payment page builds this.
              </Pt>
              <Pt n="5.15">
                The answer to 5.14.1 decides how long Phase 2 takes. So ESTO gets this answer first, while
                Phase 1 runs.
              </Pt>
            </More>
          </section>

          <section className="wu-part" id="p6" aria-labelledby="p6-h">
            <h2 id="p6-h" tabIndex={-1}>
              6. How I used AI
            </h2>
            <p>
              I used three tools. I used Claude Code for the research, the code, the tests, and the first
              drafts of the text. Claude Code also wrote the program that reads the product feeds of the
              stores each day. I used Figma to try and correct the design of new pages before Claude built
              them. I used Mobbin to see how other apps solve the same pages. The prototype did not come from
              one prompt. Without someone to steer it, Claude goes wrong: Claude invents data and builds
              things nobody asked for.
            </p>
            <More label="who did what, what worked, what went wrong, and what I threw away">
              <Pt n="6.2">
                For the research, Claude read ESTO's public pages, the bond deck, and competitor products.
                Claude and I both checked every claim against the source. Several first claims were wrong, and
                we removed them.
              </Pt>
              <Pt n="6.3">
                For the data, Claude found the open store feeds. Claude wrote the job that reads the feeds and
                matches the same product across stores by barcode. No AI is used inside the product.
              </Pt>
              <Pt n="6.4">
                For the prototype, I decided the direction, what to build, and how each page must work. I
                corrected the design many times, in Figma and in the browser. Claude wrote the code and the
                tests from those decisions.
              </Pt>
              <Pt n="6.5">
                The prototype did not come from one prompt. Without someone to steer it, Claude goes wrong:
                Claude invents data and builds things nobody asked for. Claude invented a purchase step, an
                interest rate, and a "transactions" page before Claude had checked the real ones. I caught
                these, and we fixed them from the real app.
              </Pt>
              <Pt n="6.6">
                Three things worked well. First, research with sources: each claim kept its link, so I could
                check it. Second, real data: Claude found the open store feeds, and the prototype ran on real
                products two days after I got the task. Third, fast changes: I saw a page in the browser, said
                what was wrong, and saw the fix in minutes.
              </Pt>
              <Pt n="6.7">
                I threw away ideas and features to keep the concept small. The first draft showed a list of
                partner stores where the customer can spend the limit. I changed it to a product search,
                because a product is a stronger reason to use the limit than a store. I also built a first
                draft of Switch, where the customer connects their bank and turns a past purchase into credit.
                I stopped it, because ESTO has no bank connection today. I planned a card as a third phase,
                and I cut it to one line in part 4.
              </Pt>
            </More>
          </section>

          <section className="wu-part" id="p7" aria-labelledby="p7-h">
            <h2 id="p7-h" tabIndex={-1}>
              7. Business case
            </h2>
            <p>Part 7 is a simple calculation with ESTO's own numbers. It is not a forecast.</p>
            <ul className="wu-nums">
              <li>
                <strong>1.5 million €</strong>
                <span>
                  of credit in use, if customers use 1% of the unused limits
                  <S n={1} />
                </span>
              </li>
              <li>
                <strong>285,000 €</strong>
                <span>
                  of interest a year at 19%, ESTO's lowest rate
                  <S n={3} />
                </span>
              </li>
              <li>
                <strong>557,000 €</strong>
                <span>
                  of interest a year at 37.10%, the maximum rate in ESTO's own example
                  <S n={3} />
                </span>
              </li>
            </ul>
            <More label="what the numbers assume, and what is still open">
              <Pt n="7.5">
                So each 1% of the unused limits that customers start to use is worth about 0.3 to 0.6 million
                euros of interest a year, before losses and costs. The two results assume that the 1.5 million
                stays in use for the whole year. Customers pay back each month, so the amount in use falls
                unless they buy again. Buying again is what this concept aims at: the customer learns to start
                in ESTO when they need something, because their money is already there, and now the products
                they look for are there too.
              </Pt>
              <Pt n="7.6">
                The costs are my view. Phase 1 needs one small team, because the feeds and the app exist.
                Phase 2 is larger, because it touches the payment page and needs a legal check.
              </Pt>
              <Pt n="8.1">Still open: I have no data on how many customers open the Credit Line page.</Pt>
              <Pt n="8.2">Still open: I do not know what ESTO sends a customer after a purchase.</Pt>
              <Pt n="8.3">
                Still open: I do not know if ESTO has a phone app. I found none in the app stores.
              </Pt>
              <Pt n="8.4">
                Still open: I do not know if ESTO checks the customer's credit again before a withdrawal
                today. A purchase with the credit line would follow the same rule.
              </Pt>
            </More>
          </section>

          <section className="wu-part" id="sources" aria-labelledby="sources-h">
            <h2 id="sources-h" tabIndex={-1}>
              Sources
            </h2>
            <ol className="wu-srcs">
              {SOURCES.map((s, i) => (
                <li key={s.name}>
                  <b>[{i + 1}]</b>
                  <span>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.name}
                      </a>
                    ) : (
                      <strong>{s.name}</strong>
                    )}
                    {s.url ? `, ${s.note}` : `. ${s.note}`}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <p className="legal">
            Unofficial concept. Not made by ESTO AS. Product data belongs to each store. The Phase 2 payment
            in the prototype is simulated.
          </p>
        </div>
      </div>
    </main>
  );
}
