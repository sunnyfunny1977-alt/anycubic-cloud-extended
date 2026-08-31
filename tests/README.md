# Tests

`test_filament_flow.py` walks the whole reason this integration exists: an
inventory imported from the standalone Filament Manager, a roll bound to an ACE
slot, weighed against its tare, then swapped so the re-weigh reminder fires.

Home Assistant is not required. `ha_stubs.py` provides just enough of it — a
`Store` backed by a dict, the dispatcher, `dt_util` — for the storage and
reconciliation logic to run:

```bash
python tests/test_filament_flow.py
```

Exit code 0 means every check passed. Anything that touches aiohttp, MQTT or the
entity platforms is out of scope here and needs a real Home Assistant instance.
