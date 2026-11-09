"""Copart API client for Python: Copart auction lots (USA) with VIN, damage and sale date as JSON.

A thin layer over the apiauto.space client (``apiauto``) with the market preset::

    import copart_api

    with copart_api.Client() as client:  # the key comes from APIAUTO_KEY
        for car in client.cars(brand="Toyota", year_min=2020, limit=20)["items"]:
            print(car["id"], car["title"], car["price"]["amount"])

From the apiauto.space team. Not affiliated with Copart.
"""

from apiauto import (
    ApiautoError,
    APIConnectionError,
    AuthenticationError,
    BadRequestError,
    Car,
    CarFilters,
    CarsPage,
    Change,
    ChangesPage,
    ChangeType,
    Market,
    NotFoundError,
    PermissionDeniedError,
    Price,
    QuotaExceededError,
    RateLimitError,
    ReferenceItem,
    ServerError,
    ServiceUnavailableError,
    Usage,
)

from ._client import MARKET, SHARED_MARKET, SOURCE, AsyncClient, Client, car_id
from ._version import __version__
from .types import CopartRaw, FxQuote, raw

__all__ = [
    "MARKET",
    "SHARED_MARKET",
    "SOURCE",
    "APIConnectionError",
    "ApiautoError",
    "AsyncClient",
    "AuthenticationError",
    "BadRequestError",
    "Car",
    "CarFilters",
    "CarsPage",
    "Change",
    "ChangeType",
    "ChangesPage",
    "Client",
    "CopartRaw",
    "FxQuote",
    "Market",
    "NotFoundError",
    "PermissionDeniedError",
    "Price",
    "QuotaExceededError",
    "RateLimitError",
    "ReferenceItem",
    "ServerError",
    "ServiceUnavailableError",
    "Usage",
    "__version__",
    "car_id",
    "raw",
]
