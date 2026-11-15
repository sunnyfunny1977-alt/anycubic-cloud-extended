"""End-to-end exercise of the merged inventory logic, without Home Assistant.

Walks the scenario the feature exists for: an old standalone inventory is
imported, a PLA roll is bound to ACE slot 1, weighed, then the filament is
swapped and the reminder has to fire.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ha_stubs  # noqa: E402  (installs the fake homeassistant modules)

PKG_PARENT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "custom_components"
)
sys.path.insert(0, PKG_PARENT)

# The real package __init__ pulls in the coordinator, and with it aiohttp and
# paho-mqtt. Register the package with only its __path__ so the submodules can
# be imported on their own.
import types as _types  # noqa: E402

_pkg = _types.ModuleType("anycubic_cloud_extended")
_pkg.__path__ = [os.path.join(PKG_PARENT, "anycubic_cloud_extended")]
sys.modules["anycubic_cloud_extended"] = _pkg

from anycubic_cloud_extended.const import (  # noqa: E402
    DATA_FILAMENT_STORE,
    DOMAIN,
    STORAGE_KEY_FILAMENT,
)
from anycubic_cloud_extended.filament.material_match import material_matches  # noqa: E402
from anycubic_cloud_extended.filament.consumption import ConsumptionTracker  # noqa: E402
from anycubic_cloud_extended.filament.slot_binding import SlotBindingManager  # noqa: E402
from anycubic_cloud_extended.filament.store import FilamentStore  # noqa: E402
from anycubic_cloud_extended.helpers import spool_fingerprint  # noqa: E402

run = ha_stubs.run
FAKE = ha_stubs.FAKE_FILES

failures = []


def check(label, cond, detail=""):
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}{(' -- ' + str(detail)) if detail else ''}")
    if not cond:
        failures.append(label)


# --------------------------------------------------------------------------
print("\n1. Legacy import: a v3 filament_manager store must be adopted, not seeded over")

FAKE.clear()
FAKE["filament_manager"] = (
    {
        "manufacturers": [{"id": "m1", "name": "eSun", "website": "", "sort_order": 0}],
        "materials": [
            {"id": "mat1", "name": "PLA", "nozzle_temp": 210, "bed_temp": 60,
             "density": 1.24, "sort_order": 0},
            {"id": "mat2", "name": "Silk PLA", "nozzle_temp": 215, "bed_temp": 60,
             "density": 1.24, "sort_order": 1},
            {"id": "mat3", "name": "PETG", "nozzle_temp": 240, "bed_temp": 80,
             "density": 1.27, "sort_order": 2},
        ],
        "spool_types": [
            {"id": "st1", "manufacturer_id": "m1", "material_id": "mat1",
             "net_weight_g": 1000, "empty_weight_g": None, "created_at": "2025-01-01T00:00:00"},
        ],
        "items": [
            {"id": "i_pla_red", "manufacturer_id": "m1", "material_id": "mat1",
             "color_name": "Rot", "color_hex": "#ff0000", "diameter": 1.75,
             "spool_net_weight_g": 1000, "sealed_count": 2,
             "open_spools": [{"id": "sp1", "remaining_grams": 800.0,
                              "gross_weight_g": None, "opened_at": None, "note": ""}],
             "location": "", "notes": "", "price": 20.0, "purchase_date": None,
             "nozzle_temp": None, "bed_temp": None,
             "created_at": "2025-01-01T00:00:00", "updated_at": "2025-01-01T00:00:00"},
            {"id": "i_silk_blue", "manufacturer_id": "m1", "material_id": "mat2",
             "color_name": "Blau", "color_hex": "#0000ff", "diameter": 1.75,
             "spool_net_weight_g": 1000, "sealed_count": 1, "open_spools": [],
             "location": "", "notes": "", "price": None, "purchase_date": None,
             "nozzle_temp": None, "bed_temp": None,
             "created_at": "2025-01-01T00:00:00", "updated_at": "2025-01-01T00:00:00"},
            {"id": "i_petg_black", "manufacturer_id": "m1", "material_id": "mat3",
             "color_name": "Schwarz", "color_hex": "#000000", "diameter": 1.75,
             "spool_net_weight_g": 1000, "sealed_count": 0,
             "open_spools": [{"id": "sp9", "remaining_grams": 500.0,
                              "gross_weight_g": None, "opened_at": None, "note": ""}],
             "location": "", "notes": "", "price": None, "purchase_date": None,
             "nozzle_temp": None, "bed_temp": None,
             "created_at": "2025-01-01T00:00:00", "updated_at": "2025-01-01T00:00:00"},
        ],
    },
    3,
)

hass = ha_stubs.HomeAssistant()
store = FilamentStore(hass)
run(store.async_load())
hass.data[DOMAIN] = {DATA_FILAMENT_STORE: store}

check("imported_from_legacy flag set", store.imported_from_legacy is True)
check("3 items imported", len(store.items) == 3, len(store.items))
check("manufacturer survived", store.manufacturers[0]["name"] == "eSun")
check("new storage file written", STORAGE_KEY_FILAMENT in FAKE)
check("assignments root created", FAKE[STORAGE_KEY_FILAMENT][0].get("assignments") == [])
check(
    "ace_material_type defaulted to None",
    all(m.get("ace_material_type") is None for m in store.materials),
)
check("legacy file left untouched", "filament_manager" in FAKE)

print("\n1b. A fresh install with no legacy data still seeds defaults")
FAKE.clear()
hass2 = ha_stubs.HomeAssistant()
store2 = FilamentStore(hass2)
run(store2.async_load())
check("defaults seeded", len(store2.materials) == 10, len(store2.materials))
check("not flagged as imported", store2.imported_from_legacy is False)
check("assignments present", store2.assignments == [])

# --------------------------------------------------------------------------
print("\n2. Material filter: slot reports PLA -> only PLA-family rolls offered")

pla_ranked = {
    m["name"]: material_matches("PLA", m) for m in store.materials
}
check("PLA matches", pla_ranked["PLA"] == 2, pla_ranked)
check("Silk PLA matches (decorative prefix stripped)", pla_ranked["Silk PLA"] == 2)
check("PETG does not match PLA", pla_ranked["PETG"] == 0)

petg_ranked = {m["name"]: material_matches("PETG", m) for m in store.materials}
check("PETG matches PETG", petg_ranked["PETG"] == 2)
check("PLA does not match PETG", petg_ranked["PLA"] == 0)

# --------------------------------------------------------------------------
print("\n3. Bind the red PLA roll to printer 42, box 0, slot 1")

SLOT = ("42", 0, 1)
spool_loaded = {
    "material_type": "PLA", "sku": "", "color": [255, 0, 0],
    "spool_loaded": True, "status": 5, "local_slot": 1, "box_id": 0, "source": "ace",
}
fp = spool_fingerprint(spool_loaded)

assignment = store.set_assignment({
    "printer_id": "42", "box_id": 0, "local_slot": 1, "source": "ace",
    "item_id": "i_pla_red", "spool_id": "sp1", "fingerprint": fp,
    "fp_material_type": "PLA", "fp_color_hex": "#FF0000",
})
check("assignment stored", store.find_assignment(*SLOT) is not None)
check("local_slot is 1-based", assignment["local_slot"] == 1)
check("printer_id stored as string", isinstance(assignment["printer_id"], str))
detail = store.assignment_detail(assignment)
check("label built from manufacturer+material+colour",
      detail["item_label"] == "eSun PLA Rot", detail["item_label"])
check("remaining carried through", detail["remaining_grams"] == 800.0)
check("no tare yet", detail["tare_g"] is None)

print("\n3b. Assigning with no spool_id opens a sealed roll")
before = next(i for i in store.items if i["id"] == "i_silk_blue")["sealed_count"]
a2 = store.set_assignment({
    "printer_id": "42", "box_id": 0, "local_slot": 2, "source": "ace",
    "item_id": "i_silk_blue", "spool_id": None,
})
after = next(i for i in store.items if i["id"] == "i_silk_blue")["sealed_count"]
check("sealed count decremented", after == before - 1, f"{before} -> {after}")
check("bound to the newly opened spool", bool(a2["spool_id"]))

# --------------------------------------------------------------------------
print("\n4. Weighing: gross reading minus tare, tare supplied once")

try:
    store.weigh_assignment(*SLOT, 950.0)
    check("weighing without a tare is rejected", False, "no error raised")
except Exception as err:
    check("weighing without a tare is rejected",
          getattr(err, "code", "") == "no_empty_weight", getattr(err, "code", err))

store.weigh_assignment(*SLOT, 950.0, empty_weight_g=250.0)
detail = store.assignment_detail(store.find_assignment(*SLOT))
check("remaining = gross - tare", detail["remaining_grams"] == 700.0, detail["remaining_grams"])
check("percent derived", detail["remaining_percent"] == 70.0, detail["remaining_percent"])
check("weighed_at set", bool(detail["weighed_at"]))
check("tare now known", detail["tare_g"] == 250.0)

print("\n4b. Correcting the tare recomputes rolls already weighed")
st = store.spool_type_for(next(i for i in store.items if i["id"] == "i_pla_red"))
store.update_spool_type(st["id"], {"empty_weight_g": 200.0})
detail = store.assignment_detail(store.find_assignment(*SLOT))
check("remaining recomputed to 750 g", detail["remaining_grams"] == 750.0, detail["remaining_grams"])

# --------------------------------------------------------------------------
print("\n5. Filament swap marks the binding, and asks for nothing")

binder = SlotBindingManager(hass)


def build_data(spool):
    return {"printers": {42: {
        "states": {},
        "attributes": {
            "ace_spools": {"spool_info": [spool]},
            "ace_slot_1": {"material_type": spool["material_type"]},
        },
    }}}


data = build_data(dict(spool_loaded))
binder.reconcile_and_enrich(data)
st1 = data["printers"][42]["states"]
check("no weighing sensor is produced",
      "ace_slot_1_needs_weighing" not in st1, sorted(st1))
check("remaining exposed as state", st1["ace_slot_1_remaining"] == 750.0)
check("assignment attached to slot attributes",
      data["printers"][42]["attributes"]["ace_slot_1"]["assignment"]["item_label"] == "eSun PLA Rot")
check("printer_id injected into spool_info",
      data["printers"][42]["attributes"]["ace_spools"]["spool_info"][0]["printer_id"] == "42")

swapped = dict(spool_loaded, color=[0, 0, 255], material_type="PLA")
data = build_data(swapped)
binder.reconcile_and_enrich(data)
st2 = data["printers"][42]["states"]
check("swap detected: binding marked stale",
      store.find_assignment(*SLOT)["stale"] is True)
check("stale reaches the slot attributes",
      data["printers"][42]["attributes"]["ace_slot_1_remaining"]["stale"] is True)
check("still no weighing sensor after a swap",
      "ace_slot_1_needs_weighing" not in st2, sorted(st2))
check("nothing in the binding demands a weighing",
      "needs_weighing" not in store.find_assignment(*SLOT),
      sorted(store.find_assignment(*SLOT)))

print("\n5b. A feed flicker back to the known filament clears stale by itself")
data = build_data(dict(spool_loaded))
binder.reconcile_and_enrich(data)
a = store.find_assignment(*SLOT)
check("stale cleared", a["stale"] is False)

print("\n5c. Empty slot is a fingerprint of its own")
empty = dict(spool_loaded, spool_loaded=False, status=4, color=[0, 0, 0])
check("empty differs from loaded", spool_fingerprint(empty) != spool_fingerprint(spool_loaded))

print("\n5d. No write when nothing changed")
sig_before = ha_stubs.SIGNALS.get("anycubic_cloud_extended_filament_updated", 0)
for _ in range(5):
    binder.reconcile_and_enrich(build_data(dict(spool_loaded)))
sig_after = ha_stubs.SIGNALS.get("anycubic_cloud_extended_filament_updated", 0)
check("5 idle cycles caused 0 saves", sig_after == sig_before, f"{sig_before} -> {sig_after}")

# --------------------------------------------------------------------------
print("\n6. Referential integrity")

store.consume_spool("i_pla_red", "sp1")
check("consuming the bound spool drops the binding", store.find_assignment(*SLOT) is None)

store.delete_item("i_silk_blue")
check("deleting the item drops its binding",
      store.find_assignment("42", 0, 2) is None)

print("\n6b. Reload from disk keeps everything consistent")
hass3 = ha_stubs.HomeAssistant()
store3 = FilamentStore(hass3)
run(store3.async_load())
check("items persisted", len(store3.items) == 2, len(store3.items))
check("no dangling assignments after reload", store3.assignments == [], store3.assignments)

# --------------------------------------------------------------------------
print("\n7. Automatic deduction: the job's filament comes off the feeding spool")

hass4 = ha_stubs.HomeAssistant()
store4 = FilamentStore(hass4)
run(store4.async_load())
hass4.data[DOMAIN] = {DATA_FILAMENT_STORE: store4}

item4 = store4.add_item({
    "manufacturer_id": store4.manufacturers[0]["id"],
    "material_id": store4.materials[0]["id"],
    "color_name": "Rot",
    "spool_net_weight_g": 1000,
    "sealed_count": 2,
})
spool4 = store4.open_spool(item4["id"])
store4.update_open_spool(item4["id"], spool4["id"], {"remaining_grams": 500.0})

SLOT4 = ("42", 0, 1)
store4.set_assignment({
    "printer_id": "42", "box_id": 0, "local_slot": 1,
    "item_id": item4["id"], "spool_id": spool4["id"],
})
ACTIVE = {"box_id": 0, "local_slot": 1}


def remaining4():
    return store4.assignment_detail(store4.find_assignment(*SLOT4))["remaining_grams"]


tracker = ConsumptionTracker(hass4)

tracker.apply("42", "job-1", 10.0, ACTIVE)
check("first look books the whole 10 g", remaining4() == 490.0, remaining4())

tracker.apply("42", "job-1", 25.0, ACTIVE)
check("only the difference is booked", remaining4() == 475.0, remaining4())

tracker.apply("42", "job-1", 25.4, ACTIVE)
check("below the 1 g floor writes nothing", remaining4() == 475.0, remaining4())

tracker.apply("42", "job-1", 26.5, ACTIVE)
check("the held fraction is not lost", remaining4() == 473.5, remaining4())

print("\n7b. A restart mid-print must not charge the job twice")
restored = ConsumptionTracker(hass4)
restored.restore({"42": dict(tracker.progress["42"])})
restored.apply("42", "job-1", 26.5, ACTIVE)
check("same total after restart deducts nothing", remaining4() == 473.5, remaining4())
restored.apply("42", "job-1", 36.5, ACTIVE)
check("only what came after the restart", remaining4() == 463.5, remaining4())

print("\n7c. A tracker that lost its memory would double-charge -- proving the guard matters")
naive = ConsumptionTracker(hass4)
naive.apply("42", "job-1", 36.5, ACTIVE)
check("without the restored baseline the whole job is booked again",
      remaining4() == 427.0, remaining4())

print("\n7d. A new job starts the count again")
before_job2 = remaining4()
naive.apply("42", "job-2", 5.0, ACTIVE)
check("new job books its own 5 g", remaining4() == before_job2 - 5.0, remaining4())

print("\n7e. A counter that falls back re-anchors instead of crediting filament")
before_drop = remaining4()
naive.apply("42", "job-2", 2.0, ACTIVE)
check("no filament is handed back", remaining4() == before_drop, remaining4())
naive.apply("42", "job-2", 12.0, ACTIVE)
check("counting resumes from the new anchor", remaining4() == before_drop - 10.0, remaining4())

print("\n7f. Nothing is charged to a slot with no binding, or a stale one")
unbound = ConsumptionTracker(hass4)
unbound.apply("42", "job-3", 50.0, {"box_id": 0, "local_slot": 3})
check("unbound slot leaves every spool alone", remaining4() == before_drop - 10.0, remaining4())

store4.apply_slot_state([{
    "printer_id": "42", "box_id": 0, "local_slot": 1,
    "stale": True, "stale_since": "2026-01-01T00:00:00+00:00",
}])
stale_before = remaining4()
unbound.apply("42", "job-4", 50.0, ACTIVE)
check("a stale binding is not charged", remaining4() == stale_before, remaining4())
store4.apply_slot_state([{
    "printer_id": "42", "box_id": 0, "local_slot": 1, "stale": False, "stale_since": None,
}])

print("\n7g. The estimate stops at zero and says so")
drain = ConsumptionTracker(hass4)
drain.apply("42", "job-5", 99999.0, ACTIVE)
check("remaining clamped at 0", remaining4() == 0.0, remaining4())
check("binding flagged as depleted",
      store4.find_assignment(*SLOT4)["depleted"] is True)
check("flag reaches the panel data",
      store4.assignment_detail(store4.find_assignment(*SLOT4))["depleted"] is True)

store4.weigh_assignment("42", 0, 1, 1000.0, empty_weight_g=200.0)
check("weighing clears the flag", store4.find_assignment(*SLOT4)["depleted"] is False)
check("and restores a real figure", remaining4() == 800.0, remaining4())

# --------------------------------------------------------------------------
print("\n" + "=" * 60)
if failures:
    print(f"FAILURES ({len(failures)}):")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("All checks passed.")
