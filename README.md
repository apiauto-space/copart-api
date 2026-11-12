# Copart API clients for Python and JavaScript

Copart auction lots (USA) with VIN, damage and sale date as clean JSON through the [apiauto.space](https://apiauto.space/en/copart-api/) REST API: search by
make, model, year, price and mileage, fetch one listing by its number, follow new cars and price changes.
No scraper to write or maintain.

| Language | Package | Install | Folder |
|---|---|---|---|
| Python 3.10+ | [`copart-api` on PyPI](https://pypi.org/project/copart-api/) | `pip install copart-api` | [python/](python/) |
| JavaScript / TypeScript | [`copart-api` on npm](https://www.npmjs.com/package/copart-api) | `npm install copart-api` | [js/](js/) |

```python
import copart_api

with copart_api.Client() as client:  # reads APIAUTO_KEY
    for car in client.iter_cars(max_items=20, brand="Toyota", year_min=2020):
        print(car["id"], car["title"], car["price"]["amount"])
```

```ts
import { CopartApi } from "copart-api";

for await (const car of new CopartApi().iterCars({ brand: "Toyota", year_min: 2020, maxItems: 20 })) {
  console.log(car.id, car.title, car.price.amount);
}
```

Both are thin layers over the general apiauto.space clients ([Python](https://github.com/apiauto-space/apiauto-python),
[JavaScript](https://github.com/apiauto-space/apiauto-js)) with the market preset to `us`. A key comes
from the Telegram bot [@apiautospace_bot](https://t.me/apiautospace_bot?start=demo); see each package's README.

The API keeps Copart and IAAI lots together in the `us` market; these clients keep only Copart lots on the
client side, so the IAAI lots on the same pages still count against the quota.

More: [Copart API page](https://apiauto.space/en/copart-api/), [API documentation](https://apiauto.space/en/docs/),
[examples in curl, Python, JavaScript and PHP](https://github.com/apiauto-space/copart-api-examples). Clients for
the other sources: [encar-api](https://github.com/apiauto-space/encar-api),
[che168-api](https://github.com/apiauto-space/che168-api), [copart-api](https://github.com/apiauto-space/copart-api),
[iaai-api](https://github.com/apiauto-space/iaai-api).

From the apiauto.space team. Not affiliated with Copart; Copart is a trademark of its owner and is
named here only to say which listings the clients return. MIT license.
