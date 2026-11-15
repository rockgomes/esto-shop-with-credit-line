/**
 * Downloads the open product feeds of ESTO partner stores and writes
 * public/data/catalog.json and public/data/history.json.
 *
 *   node scripts/build-catalog.mjs              download every feed
 *   node scripts/build-catalog.mjs --from DIR   read DIR/<store id>.xml instead (for local work)
 *
 * The script tries each feed up to three times. If a feed still fails, the
 * script writes nothing and exits with an error, so the previous catalog
 * stays. A catalog never loses a store. It never invents data.
 */
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import {
  STORES,
  buildProducts,
  packCatalog,
  parseProduct,
  takeProducts,
  unpackCatalog,
  updateHistory,
} from './catalog-lib.mjs';

const OUT_DIR = path.resolve('public/data');
const fromIndex = process.argv.indexOf('--from');
const fromDir = fromIndex === -1 ? null : process.argv[fromIndex + 1];

async function openFeed(store) {
  if (fromDir) return createReadStream(path.join(fromDir, `${store.id}.xml`));
  const response = await fetch(store.feed, {
    headers: { 'User-Agent': 'product-catalog-prototype/1.0 (reads public Hinnavaatlus feeds once a day)' },
    signal: AbortSignal.timeout(10 * 60 * 1000),
  });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
  return Readable.fromWeb(response.body);
}

async function readStore(store) {
  const stream = await openFeed(store);
  const decoder = new TextDecoder('utf-8');
  const rows = [];
  let buffer = '';
  let seen = 0;
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    const { blocks, rest } = takeProducts(buffer);
    buffer = rest;
    for (const block of blocks) {
      seen += 1;
      const row = parseProduct(block, store.id);
      if (row) rows.push(row);
    }
  }
  return { rows, seen };
}

async function readJson(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, 'utf8'));
}

const allRows = [];
const report = [];
const TRIES = 3;
for (const store of STORES) {
  let lastError = '';
  let done = false;
  for (let attempt = 1; attempt <= TRIES && !done; attempt += 1) {
    try {
      const { rows, seen } = await readStore(store);
      // Loop, not push(...rows): the largest feed has about a million rows.
      for (const row of rows) allRows.push(row);
      report.push({ store: store.id, rowsInFeed: seen, usableRows: rows.length, tries: attempt });
      done = true;
    } catch (error) {
      lastError = String(error.message ?? error);
    }
  }
  if (!done) report.push({ store: store.id, error: lastError, tries: TRIES });
}
console.table(report);

const failed = report.filter((r) => r.error || !r.usableRows).map((r) => r.store);
if (failed.length > 0) {
  console.error(`No answer from: ${failed.join(', ')}. Nothing is written, and the previous catalog stays.`);
  process.exit(1);
}

const now = new Date().toISOString();
const products = buildProducts(allRows);
const packed = packCatalog(products, now);
packed.sources = report;

const catalogFile = path.join(OUT_DIR, 'catalog.json');
const historyFile = path.join(OUT_DIR, 'history.json');
const previousPacked = await readJson(catalogFile);
const previous = previousPacked ? unpackCatalog(previousPacked) : null;
const history = updateHistory(await readJson(historyFile), previous, { products }, now.slice(0, 10));

await mkdir(OUT_DIR, { recursive: true });
await writeFile(catalogFile, JSON.stringify(packed));
await writeFile(historyFile, JSON.stringify(history));

const shared = products.filter((p) => p.offers.length > 1).length;
console.log(
  `${products.length} products (${shared} sold by two or more stores), ` +
    `${Object.keys(history).length} with a recorded price change.`,
);
