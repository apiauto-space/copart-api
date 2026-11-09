# copart-api — Copart API client for JavaScript and TypeScript

[![npm version](https://img.shields.io/npm/v/copart-api.svg)](https://www.npmjs.com/package/copart-api)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/apiauto-space/copart-api/blob/main/LICENSE)

`copart-api` gives you Copart auction lots (USA) with VIN, damage and sale date as clean JSON through the [apiauto.space](https://apiauto.space/en/copart-api/)
REST API, without writing or maintaining a scraper. Search by make, model, year, price and mileage, page
through the whole catalog, fetch one listing by its number and follow a feed of new cars, cars taken off sale
and price changes.

It is a thin layer over the general [`apiauto`](https://www.npmjs.com/package/apiauto) client with the market
preset to `us`, plus types for the Copart-only fields. It comes from the apiauto.space team; the project
is not affiliated with Copart.

- One class, `CopartApi`, ESM, TypeScript types, the only dependency is `apiauto` (which has none)
- `car("68055056")` takes the Copart listing number as well as the record id
- `CopartRaw` types for the Copart-only fields in `car.raw`
- Node 20.19+, Bun, Deno and edge runtimes with `fetch`

## Install

```bash
npm install copart-api
```

## Get a key

Open the Telegram bot [@apiautospace_bot](https://t.me/apiautospace_bot?start=demo) and take a free demo
key: one day, 100 data requests, up to 20 cars per request. Paid plans are on the
[pricing page](https://apiauto.space/en/#pricing).

Save the key in the `APIAUTO_KEY` environment variable — the client reads it from there. Keep the key on your
server: the API does not accept browser requests, and a key in page code is visible to every visitor.

## Quick start

```ts
import { CopartApi } from "copart-api";

const api = new CopartApi(); // reads APIAUTO_KEY

const page = await api.cars({ brand: "Toyota", year_min: 2020, limit: 20 });
for (const car of page.items) {
  console.log(car.id, car.title, car.price.amount, car.price.currency);
}

const one = await api.car("68055056"); // a listing number or "copart:68055056"
console.log(one.listing_url, one.photos[0]);
```

A record looks like this (shortened; real values from the catalog):

```json
{
  "id": "copart:68055056",
  "market": "us",
  "source": "copart",
  "source_id": "68055056",
  "title": "2019 Hyundai Elantra",
  "brand": "Hyundai",
  "model": "Elantra",
  "year": 2019,
  "mileage_km": 239240,
  "fuel": "gasoline",
  "transmission": "automatic",
  "body_type": null,
  "vin": "5NPD84LF8KH406860",
  "price": {
    "amount": "4000.00",
    "currency": "USD"
  },
  "price_usd": "4000.00",
  "location": {
    "country": "US",
    "region": "TN",
    "city": "Nashville"
  },
  "listing_url": null,
  "is_active": true,
  "first_seen_at": "2026-09-23T00:21:16.304888Z",
  "photos": [
    "https://api.apiauto.space/img/copart:68055056/1.jpg?exp=...&sig=..."
  ],
  "raw": {
    "lot_number": "68055056",
    "sale_date": "2026-09-28T17:00:00+00:00",
    "buy_now": 4000,
    "damage_main": "front",
    "title_doc": "clean",
    "location_branch": "Nashville (TN)"
  }
}
```

Every record has the same keys as in the other apiauto.space markets; a value the source does not provide is
`null`. Prices are decimal strings in USD, `price_usd` is converted at the ECB daily rate.

## Copart and IAAI share one market

The API keeps Copart and IAAI lots together in the `us` market and does not filter by auction yet. This client
asks for `us` cars and keeps only Copart lots on the client side. What that means for you:

- a page from `cars()` can hold fewer than `limit` lots, and its `count` is `null`;
- the IAAI lots that were dropped still count against your quota;
- `iterCars({ maxItems })` reads pages until it has collected `maxItems` Copart lots.

When you need both auctions, use the general `apiauto` client with `api.cars({ market: "us" })`.

## Methods

| Method | What it does | Quota |
|---|---|---|
| `cars(filters)` | One page of Copart cars: `brand`, `model`, `year_min`, `year_max`, `price_min`, `price_max`, `mileage_max`, `fuel`, `body_type`, `sort`, `limit`, `cursor` | Cars returned |
| `iterCars({ ...filters, maxItems })` | Every matching car, page after page | Cars returned |
| `car(listing)` | One car by listing number or id, including cars taken off sale in the last 14 days | 1 record |
| `changes({ since, type })` / `iterChanges(...)` | Feed of `added`, `disappeared`, `price_drop`, `price_up` events | Events returned |
| `brands()` / `models(brand)` | Makes and models with car counts | Free |
| `status()` | Plan access, data age and the number of active cars of the market | Free |
| `usage()` | Your plan, its term and the quota spent | Free |
| `live({ make, model })` | Live search at the auction data provider for lots not in the catalog yet, Pro and Max plans | Separate counter |

The general client is at `api.core` for anything else. Errors are the `apiauto` error classes, re-exported
here: `QuotaExceededError`, `RateLimitError`, `NotFoundError`, `AuthenticationError` and the rest.

## Copart-only fields

```ts
import { raw } from "copart-api";

const extra = raw(car); // typed as CopartRaw
console.log(extra.source_values);
```

## Links

- [Copart API on apiauto.space](https://apiauto.space/en/copart-api/) and the [API documentation](https://apiauto.space/en/docs/)
- [`apiauto`](https://www.npmjs.com/package/apiauto): the general client for all markets
- Clients for the other sources: [`encar-api-client`](https://www.npmjs.com/package/encar-api-client), [`che168-api`](https://www.npmjs.com/package/che168-api), [`iaai-api`](https://www.npmjs.com/package/iaai-api)
- [Examples in curl, Python, JavaScript and PHP](https://github.com/apiauto-space/copart-api-examples)
- The Python version of this client: [`copart-api` on PyPI](https://pypi.org/project/copart-api/)

## License

MIT. Copart is a trademark of its owner; it is named here only to say which listings the client returns.
