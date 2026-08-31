"""Minimal Home Assistant stand-ins so the store logic can be exercised offline.

Only what the filament modules actually touch: a Store that keeps its data in a
dict of fake files, the dispatcher, and dt_util.utcnow.
"""

import asyncio
import sys
import types
from datetime import datetime, timezone

FAKE_FILES: dict = {}
SIGNALS: dict = {}


def _mod(name):
    m = types.ModuleType(name)
    sys.modules[name] = m
    return m


ha = _mod("homeassistant")
ha.__path__ = []

core = _mod("homeassistant.core")


class HomeAssistant:
    def __init__(self):
        self.data = {}
        self.config_entries = types.SimpleNamespace(async_entries=lambda d: [])


def callback(fn):
    return fn


core.HomeAssistant = HomeAssistant
core.callback = callback
core.ServiceCall = object
ha.core = core

helpers = _mod("homeassistant.helpers")
helpers.__path__ = []
ha.helpers = helpers

storage = _mod("homeassistant.helpers.storage")


class Store:
    # Real Store is generic (Store[dict[str, Any]]); the subclass in store.py
    # subscripts it at class-definition time.
    def __class_getitem__(cls, item):
        return cls

    def __init__(self, hass, version, key, **kw):
        self.hass = hass
        self.version = version
        self.key = key

    async def async_load(self):
        raw = FAKE_FILES.get(self.key)
        if raw is None:
            return None
        data, ver = raw
        if ver < self.version:
            data = await self._async_migrate_func(ver, 0, data)
            FAKE_FILES[self.key] = (data, self.version)
        return data

    async def _async_migrate_func(self, major, minor, data):
        return data

    async def async_save(self, data):
        FAKE_FILES[self.key] = (data, self.version)

    def async_delay_save(self, fn, delay):
        FAKE_FILES[self.key] = (fn(), self.version)

    async def async_remove(self):
        FAKE_FILES.pop(self.key, None)


storage.Store = Store
helpers.storage = storage

dispatcher = _mod("homeassistant.helpers.dispatcher")


def async_dispatcher_send(hass, signal, *args):
    SIGNALS[signal] = SIGNALS.get(signal, 0) + 1


dispatcher.async_dispatcher_send = async_dispatcher_send
dispatcher.async_dispatcher_connect = lambda hass, sig, cb: (lambda: None)
helpers.dispatcher = dispatcher

util = _mod("homeassistant.util")
util.__path__ = []
dt_mod = _mod("homeassistant.util.dt")
dt_mod.utcnow = lambda: datetime.now(timezone.utc)
dt_mod.now = lambda: datetime.now(timezone.utc)
util.dt = dt_mod
ha.util = util

exceptions = _mod("homeassistant.exceptions")


class HomeAssistantError(Exception):
    pass


exceptions.HomeAssistantError = HomeAssistantError
ha.exceptions = exceptions

# The integration package __init__ imports a lot more than the store needs;
# these keep that import from failing.
ce = _mod("homeassistant.config_entries")
ce.ConfigEntry = object
ce.ConfigFlow = object
ce.ConfigFlowResult = object
ce.OptionsFlow = object
ha.config_entries = ce

const_mod = _mod("homeassistant.const")


class Platform:
    BINARY_SENSOR = "binary_sensor"
    BUTTON = "button"
    IMAGE = "image"
    LIGHT = "light"
    SENSOR = "sensor"
    SWITCH = "switch"
    UPDATE = "update"


class UnitOfMass:
    GRAMS = "g"
    KILOGRAMS = "kg"


const_mod.Platform = Platform
const_mod.UnitOfMass = UnitOfMass
const_mod.PERCENTAGE = "%"
const_mod.EntityCategory = object
ha.const = const_mod

devreg = _mod("homeassistant.helpers.device_registry")
devreg.CONNECTION_NETWORK_MAC = "mac"
devreg.DeviceInfo = dict
devreg.DeviceEntryType = types.SimpleNamespace(SERVICE="service")
helpers.device_registry = devreg

cv = _mod("homeassistant.helpers.config_validation")
cv.string = str
helpers.config_validation = cv


def slugify(text):
    return str(text).lower().replace(" ", "_")


util.slugify = slugify


def run(coro):
    return asyncio.run(coro)
