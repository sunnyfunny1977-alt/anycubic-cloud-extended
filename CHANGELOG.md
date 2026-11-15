# Changelog

## 2.0.0

Merges the standalone Filament Manager into this integration, so a slot in the
ACE can point at a specific roll in the cupboard.

### Added

- **Spool selection per ACE slot.** The slot dialog — in the panel and in the
  Lovelace card — now offers the rolls from the inventory, filtered to what the
  slot actually reports. A slot holding PLA offers PLA, PLA+, Silk PLA and Wood
  PLA, not PETG. Materials can carry an explicit `ace_material_type` for names
  the automatic match gets wrong.
- **Weight entry from the dashboard.** The dialog takes the gross weight from
  the scale and derives the remaining filament from the spool type's tare. A
  missing tare is asked for once and then applies to every roll of that
  manufacturer, material and size, recomputing rolls already weighed.
- **Swap detection.** What the slot held is recorded with the binding. When it
  changes, the binding is marked as no longer describing the slot and the slot
  gets a warning marker, because it would otherwise keep showing a spool that
  has been taken out. Nothing asks for a weighing: whether the new roll goes on
  the scale is the user's call, and an unweighed roll is not an error. A binding
  is never dropped automatically — the ACE reports an empty slot for a few
  seconds during every feed — and returning to the known filament clears the
  mark by itself.
- New entity per slot: `sensor.<printer>_ace_slot_N_remaining` (grams, with
  history), for both the primary and the secondary box. Its attributes carry
  the whole binding, including `stale` and `weighed_at`.
- The filament inventory sensors from the Filament Manager.
- Services `assign_slot_spool`, `clear_slot_spool` and `weigh_slot_spool`
  alongside the inventory services carried over from the Filament Manager.
- The Lovelace card is registered as a resource automatically. Card options
  `showFilamentInventory`, `showSpoolChangedWarning` and
  `allowSpoolAssignment`.
- Integration options for the low-stock threshold, the inventory currency, and
  whether non-admin users may assign and weigh spools.
- **The ACE box at the top of the inventory, and automatic deduction.** Each
  slot is bound to a spool from the cupboard right there; what the printer eats
  then comes off that spool by itself, so the stock stays roughly right without
  anybody reaching for a scale.
  - The slot data comes from the printer's own sensors, which Home Assistant
    pushes anyway, so the section needs no polling and no websocket command of
    its own. Each slot entry already carries the three fields a binding is
    keyed by.
  - Weighing before loading is offered in the same dialog and is optional. The
    automatic deduction is what keeps the cupboard current; weighing only
    corrects the drift that builds up over time.
  - Deduction is continuous but floored at a gram, so a four-hour print writes
    the inventory a few dozen times rather than a thousand. The amount already
    booked is persisted with the job it belongs to: a restart mid-print would
    otherwise see the job's whole total as new and subtract it twice. The
    offline suite tests exactly that, and that a tracker without the restored
    baseline does double-charge.
  - Nothing is charged to a slot with no binding, or to one whose binding has
    gone stale -- there is no spool to take it from, and picking one would be a
    guess. Multi-material jobs follow the active slot by themselves.
  - When the estimate reaches zero the spool stops there and the binding is
    flagged, so a drifted estimate says so instead of quietly reading 0 g. A
    fresh weighing clears the flag.
  - New option **Deduct filament use from the inventory automatically**, on by
    default.
- **Filament of the current job, in grams.** `job_filament_used` climbs while
  the job runs and `job_filament_total` is what it was sliced to need, so a
  dashboard can show "2 g / 161 g". The live figure comes from
  `print_supplies_usage`, which the payload never labels and which counts
  *millimetres* of filament, so it is converted here rather than surfaced raw.
  - Preferred conversion is the slicer's own: `paint_infos` carries grams and
    millimetres per material, and their ratio is exact for whatever is loaded,
    assuming nothing about diameter or density. The cloud currently sends only
    the grams, so in practice the fallback runs.
  - The fallback is the nominal 1.75 mm cross-section and a density looked up
    from the material in the active slot. Measured against the lifetime counter
    on an isolated 4 h PLA job it came out 1.7 % high. Which path produced a
    value is on the `source` attribute, next to the raw `used_mm`.
  - Measurement, not a total: the figure resets with every job.
- **The printer's lifetime counters as sensors.** `total_print_time` (hours),
  `total_material_used` (kg) and `total_print_count`, with
  `state_class: total_increasing` so they reach long-term statistics. The cloud
  keeps these counters itself and sends them with the info poll the integration
  already makes, so there is no extra request and nothing to accumulate. Two of
  them were previously buried as attributes of the `current_status` sensor
  (those attributes stay); the print count was parsed but never surfaced at all.
  - The filament total arrives as text with its unit attached ("6.46kg"), so the
    unit is read rather than assumed. An unrecognised unit leaves the sensor
    unavailable and logs the raw value — being out by a factor of a thousand in
    a statistics-backed total would be worse than a gap.
  - A descriptor may now set its own `state_class`; it used to be overwritten
    with `measurement` unconditionally.
- A third frontend bundle, `anycubic-filament-panel.js` (~80 KB), for the
  standalone inventory panel. The inventory views are dependency-free, so
  serving them from the printer panel's two-megabyte bundle would mean
  downloading Lit, date-fns and the Agora video SDK to weigh a spool.

### Changed

- Domain is `anycubic_cloud_extended`. Entity IDs change accordingly;
  automations and dashboards referring to the predecessors need adjusting once.
- **Inventory and Manage are one view.** They listed the same entries twice, one
  read-only and one with the buttons, so weighing a spool meant finding it,
  switching tabs and finding it again. The cards now carry a **Setup** button
  that opens a dialog holding everything the manage view could do: master data,
  the sealed-spool stepper, opening a spool, the weighing fields, the spool
  type's empty weight and deleting the entry. **New entry** moved into the
  inventory header.
  - The sealed count is a stepper in the dialog rather than a form field, so
    saving a form that was opened before the last step can no longer revert it.
  - The empty weight is editable here too, not only in the admin area — without
    it the weighing field in this very dialog would be a dead end.
  - A confirmation raised from the dialog returns to it afterwards, including
    when it is dismissed with Escape or a click outside.
- The inventory is reachable two ways: as a **Filament** tab in the Anycubic
  panel, next to the ACE slots it binds spools to, and as its own sidebar entry
  **Filament Manager** at `/anycubic-filament`. Stock keeping has nothing to do
  with any one printer and stays useful while every printer is offline, so it is
  not buried behind picking one. Both show the same single inventory.
- Data from both predecessors is imported on first start: the full inventory
  from `filament_manager` (including older storage versions) and the latched
  active ACE slot from `anycubic_ha_integration`. Nothing in the old stores is
  modified or deleted, and an untouched copy of the inventory is kept. A repair
  issue asks for the old Filament Manager to be removed while both are set up.
- **The previous Anycubic integration must be removed.** It signs in to the same
  cloud account, and Anycubic allows one session per account: both integrations
  refresh the access token independently and whichever refreshes last
  invalidates the other, which then fails with "Authentication failed. Check
  credentials.". A repair issue explains this, because the message otherwise
  reads as a bad token and a fresh one does not help. Removing the old
  integration frees its entity ids, so the new entities can be renamed onto
  them and existing automations and dashboards keep working.
- The static path now serves the whole `dist` directory rather than a single
  file, so the card and the printer images are reachable through it.

### Fixed

- **`scripts/anycubic-token.ps1` finds the token again on Slicer Next 2.x.** Up
  to 1.4.x the slicer wrote a dedicated `accessToken = <jwt>` line; 2.0.0.3 does
  not write it at all and carries the same value as `id_token=` on the portal
  URLs in `debug_*.log` instead, so the script matched nothing and threw. Both
  spellings are searched now, the newest hit wins, and masked occurrences
  (`id_token=***`, which the slicer also writes) are skipped rather than copied
  as a bogus value. The value is unchanged: the same 3-part JWT the config flow
  already expected.
  - The script now also reports the token's expiry. An expired token makes the
    integration answer "Authentication failed. Check credentials.", which reads
    as a wrong token rather than an old one.
  - It still never prints the token — only where it was found, how long it is,
    and until when it is valid.
  - The `.conf` fallback in the README is gone: 2.x no longer keeps the token
    there either.
- The printer list no longer offers devices belonging to a predecessor Anycubic
  integration. Both create a device for the same printer with manufacturer
  "Anycubic", so picking the wrong one sent service calls to this domain
  carrying the other integration's config entry id, and the handler raised a
  bare KeyError. Ownership now comes from the entity registry, and the service
  handler validates the entry's domain before using it.
- The filament inventory sensors are created at all. `filament/sensor.py` was
  never executed: platform forwarding only looks for `<integration>/sensor.py`,
  so a module of that name in a sub-package is not discovered. Nothing errored;
  the entities were simply absent.
- `Aux Fan Speed` and `Box Fan Level` no longer go unavailable after every
  restart. Both reach the integration only through an MQTT fan message or a
  print-status `settings` block — the HTTP poll does not carry them and the
  project data does not model them — and the printer pushes only when a value
  changes, so a fan held at a steady speed left both sensors unavailable
  indefinitely. The last pushed value is now remembered across restarts, the
  same trade the ACE state store already makes for the latched active slot.
  For a value that only ever arrives on change, the last one pushed is the
  current one; an offline printer is the exception and still reports nothing.
- The panel is no longer removed when one of several config entries is
  unloaded; teardown waits for the last one.
- Browser back/forward inside the panel works again — the location handler
  matched a path fragment that no longer exists after the rename.
- A dropdown reopened for a different slot kept showing the previous
  selection.
- Picking a colour no longer submits and closes the dialog once the spool or
  weight fields have been touched.

## 1.0.2

### Changed

- The documented PowerShell token command now scans every `debug_*.log`, parses the timestamp from each matching line and takes the newest `accessToken` across all of them. The previous one-liner picked the newest log by file mtime and then its last match, which is unreliable because Slicer Next keeps appending to older logs. It also reports the source file, timestamp and token length, and fails with a clear message when no token is found.
- The script ships as [`scripts/anycubic-token.ps1`](scripts/anycubic-token.ps1) so it can be downloaded instead of copied out of the README.
- The Slicer Next config-flow description points at the README section instead of carrying its own copy of the command. Two copies would drift, and the script contains regex quantifiers such as `\d{4}` that Home Assistant would read as translation placeholders.

## 1.0.1

### Changed

- `ACE Active Filament` is now created as soon as the printer has an ACE box, instead of waiting for the first filament change. The latch has no value until the box feeds a slot for the first time, so the sensor previously did not exist at all on a fresh install and could not be put on a dashboard. It now exists immediately and reads unavailable until the first change, matching how the other deferred sensors behave.

## 1.0.0

This repository now maintains its own version line. Upstream
`ljschmitt/hass-anycubic_cloud_v3` had independently published a different
0.3.8, so continuing the shared numbering would have produced two releases
with the same tag and different code. Starting at 1.0.0 keeps the two apart;
it is a numbering change, not a rewrite. Functionally this is the previous
0.3.8 of this repository.

### Changed

- Repository links, HACS install instructions, issue tracker and manifest
  metadata now point at this fork. Credit for the upstream fork and the
  original integration is unchanged.

## 0.3.8

### Added

- New `ACE Active Filament` sensor (plus `Secondary ACE Active Filament` for a second box) reporting the filament currently in the toolhead, e.g. `PLA #0047BB`, with material type, sku, colour, slot number and box id as attributes.

### Fixed

- The active ACE slot no longer disappears seconds after a filament change. The printer only reports `loaded_slot` while a change is actually running and returns `-1` once the filament is through, and every cloud poll rebuilt the box from that payload, so the value was visible for roughly 20-30 seconds per tool change and unusable the rest of the time. The last slot the box actually fed is now latched, carried across cloud-poll rebuilds and stored, so it also survives a Home Assistant restart. The raw `loaded_slot` attribute on `ace_spools` is unchanged and still reports the momentary value.

## 0.3.7

### Added

- The `ace_spools` sensor now exposes `loaded_slot`, the ACE slot currently loaded into the toolhead. Until now the ACE data showed which spools are present, but not which one is actually feeding the extruder. The value is zero-based and indexes the existing `spool_info` list directly, so `spool_info[loaded_slot]` is the active spool; `-1` means no filament is loaded. Note that the neighbouring `slot`, `local_slot` and `display_slot` fields remain one-based.

### Fixed

- `create_when_available` entities that already exist in the entity registry are now re-created on startup instead of being skipped until the printer pushes their value again. `Aux Fan Speed %` and `Box Fan Level %` are only set by an MQTT fan message or a print-status `settings` block, never by the regular cloud poll, so restarting Home Assistant mid-print removed them from dashboards for the rest of the job. They now appear as unavailable until the next push arrives. Printers that have never reported the value still get no entity, so the flag keeps doing its original job.

## 0.3.6

### Added

- Added one sensor per ACE filament slot (`ACE Slot 1`-`ACE Slot 4`, plus `Secondary ACE Slot 1`-`4` for a second ACE box). The state combines material type and colour, e.g. `PLA #FF0000`, and reports `empty` for an unloaded slot, so the loaded filament can be placed anywhere in a dashboard instead of only inside the Anycubic card.
- Slot sensors expose `material_type`, `sku`, `color`, `color_hex`, `spool_loaded`, `status`, `slot`, `local_slot`, `box_id` and `source` as attributes.
- The Anycubic filament `sku` is now included in the ACE spool data, including the existing `ace_spools` attributes.

## 0.3.5

### Added

- Added the diagnostic `debug_set_light_status` service to test explicit Anycubic light command types per printer without changing existing light entity IDs.

### Fixed

- Stabilized local and USB file-list loading in the Anycubic panel by keeping the loading state active until the printer returns real file data or the request times out.
- Local and USB file-list service calls now establish the MQTT action connection before requesting printer files, matching the existing button path and avoiding delayed or missing responses when MQTT was not already active.
- The local and USB file-list tabs now handle Home Assistant `file_info: null` states as not loaded instead of rendering a blank content area.
- Fixed the first-open auto-load behavior for local and USB file-list tabs. A failed or too-early auto-load attempt no longer blocks later automatic retries for the rest of the browser session.
- Local and USB file-list tabs now use the selected printer device as their auto-load target, matching their service-based request path.
- Preserved already known ACE boxes when Anycubic sends a single-box `multi_color_box` MQTT update, preventing the secondary ACE Pro from sporadically disappearing in two-ACE setups.

## 0.3.5-beta.3

### Fixed

- Local and USB file-list service calls now establish the MQTT action connection before requesting printer files, matching the existing button path and avoiding delayed or missing responses when MQTT was not already active.
- The local and USB file-list tabs now show explicit loading, empty, and not-loaded messages instead of leaving the content area blank while waiting for a printer response.

## 0.3.5-beta.2

### Fixed

- Fixed the first-open auto-load behavior for local and USB file-list tabs. A failed or too-early auto-load attempt no longer blocks later automatic retries for the rest of the browser session.
- Local and USB file-list tabs now use the selected printer device as their auto-load target, matching their service-based request path.

## 0.3.5-beta.1

### Added

- Added a diagnostic `debug_set_light_status` service to test explicit Anycubic light command types per printer without changing the existing light entity IDs.

## 0.3.4

### Fixed

- Preserved already known ACE boxes when Anycubic sends a single-box `multi_color_box` MQTT update, preventing the secondary ACE Pro from sporadically disappearing in two-ACE setups.

## 0.3.3

### Fixed

- Mapped Anycubic print status code `9` to `leveling` so bed leveling no longer appears as `unknown` while the printer is busy.
- Fixed dashboard-card ETA formatting to use the browser/Home Assistant local time instead of UTC.

## 0.3.2

### Fixed

- Added explicit `dark_icon.png` and `dark_logo.png` brand assets so Home Assistant 2026.3+ can resolve both light and dark brand image variants from the local custom integration package.

### Notes

- Older Home Assistant versions and current HACS download lists may still use the public brands CDN and can show a generic placeholder there. The local brand assets are only available through Home Assistant's local brands proxy.

## 0.3.1

### Fixed

- Suggested the compatibility entity ID suffix `job_z_thickness` for the existing internal `job_z_thick` layer-height sensor key.
- Added the missing local brand logo file next to the existing local brand icon for Home Assistant 2026.3 and newer.
- Rebuilt the bundled dashboard card so its visible console version matches the integration release.

### Notes

- Existing installations can use the `anycubic_cloud_extended.migrate_entity_ids` service to rename an existing `job_z_thick` entity to the compatible `job_z_thickness` entity ID after testing with `dry_run: true`.
- HACS can only offer updates automatically when the integration was installed as a HACS custom repository. Manual installations still need manual replacement.
- HACS may still show a generic placeholder icon in its downloads list until HACS itself switches that view to Home Assistant's local brands proxy for custom integrations.

## 0.3.0

### Added

- Added the native Home Assistant `light.*` entity for Anycubic camera light control.
- Added the side view camera panel with manual stream start, zoom, fullscreen, and optional per-printer Home Assistant `camera.*` mappings.
- Added cautious first-open auto-loading for local, USB, and cloud file-list tabs.
- Added local and USB file print preparation from the panel, with printer selection and optional ACE slot mapping.
- Added stable English entity-ID suggestions plus the `migrate_entity_ids` service for older localized entity IDs.
- Added release safety checks for synchronized versions, private-data patterns, and tag/release collisions.

### Changed

- Kobra X camera light now uses initial command type `3`, matching the value confirmed through Slicer/MQTT behavior. This fixes the Home Assistant restart case where the light command failed until the Slicer toggled the light once.
- Kobra X ACE/material handling now treats ACE-reserved internal rack slots as ACE feed entries instead of normal filament slots.
- ACE/material spool layout keeps dynamic slot data while rendering up to four evenly sized spool items per row.
- The built-in panel and dashboard-card entity lookups now expect stable English technical entity IDs instead of localized German fallback IDs.
- Local and USB file views clear stale folder data immediately during folder changes.
- Camera streams in the side view start only when Play is pressed and stop on Stop, printer change, or leaving the view.

### Fixed

- Reduced known Kobra X MQTT warning noise for progress reports without temperature fields, `aux_fan_speed_pct`, `z_comp`, `video/initSuccess`, and known `buried` reports.
- Handled `list_mode` in local and USB file-list MQTT reports.
- Fixed the file-list path coordinator crash from the withdrawn `0.1.9` release.
- Fixed sensor setup issues from `0.1.6`.
- Prevented offline printers from also appearing as available or busy.

### Notes

- MQTT-dependent data can take a short time to initialize after a Home Assistant restart. During that window, MQTT/peripheral states may temporarily appear inactive or unknown.
- Kobra S1 basic functions are reported, while camera and chamber light support remain open for further feedback.
