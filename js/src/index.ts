/**
 * copart-api — Copart API client for JavaScript and TypeScript: Copart auction lots (USA) with VIN, damage and sale date as JSON.
 *
 * A thin layer over the apiauto.space client (`apiauto`) with the market preset to `us`.
 * From the apiauto.space team. Not affiliated with Copart.
 *
 * @see https://apiauto.space/en/copart-api/
 * @packageDocumentation
 */
import { Apiauto } from "apiauto";
import type {
  ApiautoOptions,
  Car,
  CarsPage,
  CarsParams,
  Change,
  ChangesPage,
  ChangesParams,
  Dictionaries,
  IterOptions,
  MarketStatus,
  ReferenceItem,
  Usage,
  UsLiveParams,
} from "apiauto";
import type { CopartRaw } from "./raw.js";

export {
  APIConnectionError,
  Apiauto,
  ApiautoError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  PermissionDeniedError,
  QuotaExceededError,
  RateLimitError,
  ServerError,
  ServiceUnavailableError,
} from "apiauto";
export type {
  ApiautoOptions,
  Car,
  CarsPage,
  Change,
  ChangesPage,
  ChangeType,
  Decimal,
  Dictionaries,
  Location,
  MarketStatus,
  Price,
  ReferenceItem,
  ResponseInfo,
  Usage,
} from "apiauto";
export type { CopartRaw, FxQuote } from "./raw.js";
export { VERSION } from "./version.js";

/** The apiauto.space market of Copart. */
export const MARKET = "us" as const;
/** The `source` of every record this package returns. */
export const SOURCE = "copart" as const;
/** `true` when the market also holds another source and records are filtered on the client. */
export const SHARED_MARKET: boolean = true;

/** Filters of {@link CopartApi.cars}: those of `GET /v1/cars` without `market`. */
export type CarsFilters = Omit<CarsParams, "market">;
/** Parameters of {@link CopartApi.changes}: those of `GET /v1/changes` without `market`. */
export type ChangesFilters = Omit<ChangesParams, "market">;

/**
 * The full record id for a Copart listing number: `68055056` → `copart:68055056`.
 * An id with the `copart:` prefix is returned as is; another source's prefix throws.
 */
export function carId(listing: string | number): string {
  const text = String(listing).trim();
  if (text === "") throw new TypeError("copart-api: listing must not be empty");
  const sep = text.indexOf(":");
  if (sep === -1) return `${SOURCE}:${text}`;
  if (text.slice(0, sep) !== SOURCE || sep === text.length - 1) {
    throw new TypeError(`copart-api: not a Copart id: ${JSON.stringify(text)}`);
  }
  return text;
}

/** The Copart-only fields of a record (`car.raw`), typed. */
export function raw(car: Car): CopartRaw {
  return (car.raw ?? {}) as CopartRaw;
}

function ours(car: Car): boolean {
  return car.source === SOURCE;
}

function ourChange(change: Change): boolean {
  return change.car_id.startsWith(`${SOURCE}:`);
}

/**
 * Copart client of the apiauto.space API. Server-side only: the API does not accept
 * browser requests, and a key in page code is visible to every visitor.
 *
 * @example
 * ```ts
 * import { CopartApi } from "copart-api";
 *
 * const api = new CopartApi(); // reads APIAUTO_KEY
 * for await (const car of api.iterCars({ brand: "Toyota", year_min: 2020, maxItems: 20 })) {
 *   console.log(car.id, car.title, car.price.amount);
 * }
 * ```
 */
export class CopartApi {
  /** The general client, for anything this one does not wrap. */
  readonly core: Apiauto;

  /** @param options - The key defaults to the `APIAUTO_KEY` environment variable. */
  constructor(options: ApiautoOptions = {}) {
    this.core = new Apiauto(options);
  }

  /** One page of Copart cars. Prices are in USD; every car returned counts against the quota. */
  async cars(filters: CarsFilters = {}): Promise<CarsPage> {
    const page = await this.core.cars({ ...filters, market: MARKET });
    // The us market mixes Copart and IAAI: keep this source's lots. The page can hold
    // fewer than `limit` lots, and `count` is unknown for one source.
    return { items: page.items.filter(ours), next_cursor: page.next_cursor, count: null };
  }

  /** Every Copart car matching the filters, page after page; `maxItems` stops early. */
  async *iterCars(filters: CarsFilters & IterOptions = {}): AsyncGenerator<Car, void, undefined> {
    const { maxItems, ...rest } = filters;
    if (maxItems !== undefined && maxItems <= 0) return;
    let taken = 0;
    for await (const car of this.core.iterCars({ ...rest, market: MARKET })) {
      if (!ours(car)) continue;
      yield car;
      taken += 1;
      if (maxItems !== undefined && taken >= maxItems) return;
    }
  }

  /**
   * One car by listing number (`68055056`) or record id (`copart:68055056`).
   * Cars taken off sale stay available for 14 days with `is_active: false`.
   */
  car(listing: string | number): Promise<Car> {
    return this.core.car(carId(listing));
  }

  /** One page of the change feed: new cars, cars taken off sale and price changes since a moment. */
  async changes(params: ChangesFilters): Promise<ChangesPage> {
    const page = await this.core.changes({ ...params, market: MARKET });
    return { items: page.items.filter(ourChange), next_cursor: page.next_cursor };
  }

  /** Every event of the change feed since a moment, page after page. */
  async *iterChanges(params: ChangesFilters & IterOptions): AsyncGenerator<Change, void, undefined> {
    const { maxItems, ...rest } = params;
    if (maxItems !== undefined && maxItems <= 0) return;
    let taken = 0;
    for await (const change of this.core.iterChanges({ ...rest, market: MARKET })) {
      if (!ourChange(change)) continue;
      yield change;
      taken += 1;
      if (maxItems !== undefined && taken >= maxItems) return;
    }
  }

  /** Makes of the us market with car counts, most frequent first. Free. */
  brands(): Promise<ReferenceItem[]> {
    return this.core.brands(MARKET);
  }

  /** Models of a make with car counts. Free. */
  models(brand: string): Promise<ReferenceItem[]> {
    return this.core.models(MARKET, brand);
  }

  /** Canonical values of `fuel`, `transmission`, `body_type` and more. Free. */
  dictionaries(): Promise<Dictionaries> {
    return this.core.dictionaries();
  }

  /** The us market: plan access, data age and the number of active cars. Free. */
  async status(): Promise<MarketStatus> {
    const market = (await this.core.markets()).find((item) => item.market === MARKET);
    if (market === undefined) throw new Error(`copart-api: the API did not list the ${MARKET} market`);
    return market;
  }

  /** The plan, its term and how much of the quota is spent. Free. */
  usage(): Promise<Usage> {
    return this.core.usage();
  }

  /**
   * Live search at the auction data provider (`GET /v1/us/live`), this auction's lots only.
   * For lots not in the catalog copy yet; Pro and Max plans, a separate monthly counter.
   */
  async live(params: UsLiveParams = {}): Promise<Car[]> {
    return (await this.core.usLive(params)).filter(ours);
  }
}
