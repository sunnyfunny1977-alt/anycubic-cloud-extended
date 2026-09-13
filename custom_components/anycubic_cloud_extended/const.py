"""Anycubic Cloud integration constants."""
import logging
from enum import IntEnum

from homeassistant.const import Platform

DEFAULT_NAME = "Anycubic Cloud Printer"

MANUFACTURER = "Anycubic"
MODEL = "main"

DOMAIN = "anycubic_cloud_extended"
COORDINATOR = "coordinator"

CUSTOM_COMPONENTS = "custom_components"
INTEGRATION_FOLDER = DOMAIN
PANEL_FOLDER = "frontend_panel"
PANEL_FILENAME = "dist/anycubic-cloud-panel.js"
CARD_FILENAME = "dist/anycubic-card.js"
PANEL_NAME = "anycubic-cloud-extended-panel"
PANEL_TITLE = "Anycubic Cloud"
PANEL_ICON = "mdi:printer-3d"

# The filament inventory is reachable two ways on purpose: as a tab inside the
# printer panel, where a spool is assigned to a slot, and as a sidebar entry of
# its own for stock keeping, which has nothing to do with any one printer and
# stays useful while every printer is offline. Both show the same views; only
# the bundle differs, because the standalone one carries none of the printer
# panel's dependencies.
FILAMENT_PANEL_FILENAME = "dist/anycubic-filament-panel.js"
FILAMENT_PANEL_NAME = "anycubic-filament-manager-panel"
FILAMENT_PANEL_URL_PATH = "anycubic-filament"
FILAMENT_PANEL_TITLE = "Filament Manager"
FILAMENT_PANEL_ICON = "mdi:printer-3d-nozzle"

ATTR_CONFIG_ENTRY = "config_entry"
ATTR_ANYCUBIC_EVENT = "anycubic_cloud_extended"

ENTITY_ID_DRYING_START_PRESET_ = "drying_start_preset_"
ENTITY_ID_ACE_SLOT_ = "ace_slot_"
ENTITY_ID_ACE_SLOT_SUFFIX_REMAINING = "_remaining"
ENTITY_ID_ACE_SLOT_SUFFIX_NEEDS_WEIGHING = "_needs_weighing"

CONF_USER_AUTH_MODE = "user_auth_mode"
CONF_USER_DEVICE_ID = "user_device_id"
CONF_USER_TOKEN = "user_token"
CONF_PRINTER_ID = "printer_id"
CONF_PRINTER_ID_LIST = "printer_ids"
CONF_PRINTER_NAME = "printer_name"
CONF_DRYING_PRESET_DURATION_ = "drying_preset_duration_"
CONF_DRYING_PRESET_TEMPERATURE_ = "drying_preset_temperature_"
CONF_SLOT_NUMBER = "slot_number"
CONF_SLOT_COLOR_RED = "slot_color_red"
CONF_SLOT_COLOR_GREEN = "slot_color_green"
CONF_SLOT_COLOR_BLUE = "slot_color_blue"
CONF_BOX_ID = "box_id"
CONF_FINISHED = "finished"
CONF_MQTT_CONNECT_MODE = "mqtt_connect_mode"
CONF_CARD_CONFIG = "card_config"
CONF_DEBUG_DEPRECATED = "debug"
CONF_DEBUG_MQTT_MSG = "debug_mqtt_msg"
CONF_DEBUG_API_CALLS = "debug_api_calls"
CONF_UPLOADED_GCODE_FILE = "uploaded_gcode_file"
CONF_FILE_ID = "file_id"
CONF_FILE_PATH = "path"
CONF_SPEED_MODE = "speed_mode"
CONF_SPEED = "speed"
CONF_TEMPERATURE = "temperature"
CONF_LAYERS = "layers"
CONF_TIME = "time"
CONF_LIGHT_TYPE = "light_type"
CONF_LIGHT_ON = "light_on"

AC_EVENT_PRINT_CLOUD_START = "print_cloud_start"

UNIT_LAYERS = "Layers"

STORAGE_KEY = DOMAIN
STORAGE_VERSION = 1
STORAGE_KEY_ACE_STATE = f"{DOMAIN}_ace_state"
ACE_STATE_SAVE_DELAY = 10

# Values the printer only ever sends by MQTT push. Neither the HTTP poll nor
# the project data carries them, so they are unknown after a restart until the
# printer happens to push again -- and it only pushes when the value changes,
# which for a fan held at a steady speed can be a very long time.
STORAGE_KEY_PUSH_STATE = f"{DOMAIN}_push_state"
PUSH_STATE_SAVE_DELAY = 10
PUSH_ONLY_PRINTER_VALUES = (
    "aux_fan_speed_pct",
    "box_fan_level",
)

# --- Legacy storage keys (pre-merge integrations), read once for import ---
LEGACY_STORAGE_KEY = "anycubic_ha_integration"
LEGACY_STORAGE_KEY_ACE_STATE = "anycubic_ha_integration_ace_state"

# --- Filament Manager storage ---
STORAGE_KEY_FILAMENT = f"{DOMAIN}_filament"
STORAGE_VERSION_FILAMENT = 4
STORAGE_KEY_FILAMENT_BACKUP = f"{DOMAIN}_filament_legacy_backup"

# --- hass.data keys that are NOT config entry ids ---
DATA_PREFIX = "_data_"
DATA_WEBSOCKET_REGISTERED = DATA_PREFIX + "websocket_registered"
DATA_FILAMENT_STORE = DATA_PREFIX + "filament_store"
DATA_PANEL_REGISTERED = DATA_PREFIX + "panel_registered"
DATA_STATIC_REGISTERED = DATA_PREFIX + "static_registered"
DATA_CARD_RESOURCE_DONE = DATA_PREFIX + "card_resource_done"
DATA_FILAMENT_SENSORS_DONE = DATA_PREFIX + "filament_sensors_done"

# --- Filament Manager options (moved into the Anycubic options flow) ---
CONF_LOW_STOCK_THRESHOLD = "low_stock_threshold"
DEFAULT_LOW_STOCK_THRESHOLD = 1
CONF_CURRENCY = "currency"
DEFAULT_CURRENCY = "EUR"
CONF_ALLOW_NON_ADMIN_WEIGHING = "allow_non_admin_weighing"
DEFAULT_ALLOW_NON_ADMIN_WEIGHING = True

API_SETUP_RETRIES = 3
API_SETUP_RETRY_INTERVAL_SECONDS = 10
DEFAULT_SCAN_INTERVAL = 60
MQTT_SCAN_INTERVAL = 15
FAILED_UPDATE_DELAY = DEFAULT_SCAN_INTERVAL * 4
MAX_FAILED_UPDATES = 3
MQTT_IDLE_DISCONNECT_SECONDS = 60 * 15
MQTT_ACTION_RESPONSE_ALIVE_SECONDS = 60 * 5
MQTT_REFRESH_INTERVAL = 60 * 5
MAX_FILE_UPLOAD_RETRIES = 3
PRINT_JOB_STARTED_UPDATE_DELAY = 5

MAX_DRYING_PRESETS = 4
MAX_ACE_SLOTS = 4


class PrinterEntityType(IntEnum):
    GLOBAL = 1
    PRINTER = 2
    FDM = 3
    LCD = 4
    ACE_PRIMARY = 5
    ACE_SECONDARY = 6
    DRY_PRESET_PRIMARY = 7
    DRY_PRESET_SECONDARY = 8
    CAMERA_LIGHT = 9


LOGGER = logging.getLogger(__package__)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.IMAGE,
    Platform.LIGHT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.UPDATE,
]
