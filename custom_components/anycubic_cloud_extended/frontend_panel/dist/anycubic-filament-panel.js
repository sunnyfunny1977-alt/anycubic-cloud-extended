!function () {
  const e = "en",
    t = {
      de: {
        "app.title": "Filament Manager",
        "app.loading": "Wird geladen …",
        "ace.slot": "Slot {slot}",
        "ace.active": "aktiv",
        "ace.empty": "leer",
        "ace.no_assignment": "keine Rolle zugeordnet",
        "ace.assign": "Zuordnen",
        "ace.change": "Ändern",
        "ace.clear": "Löschen",
        "ace.clear_title": "Zuordnung löschen?",
        "ace.clear_text": "{name} wird aus Slot {slot} gelöst. Die Rolle bleibt mit ihrem aktuellen Restgewicht im Bestand.",
        "ace.clear_confirm": "Löschen",
        "ace.clear_fallback": "Die zugeordnete Rolle",
        "ace.clear_toast": "Zuordnung gelöscht",
        "ace.depleted": "Schätzung aufgebraucht — bitte nachwiegen",
        "ace.changed": "Filament gewechselt – bitte prüfen",
        "ace.confirm": "Erledigt",
        "ace.confirm_toast": "Slot als geprüft markiert",
        "ace.dialog_title": "ACE Slot {slot}",
        "ace.field_spool": "Rolle aus dem Bestand",
        "ace.placeholder_material": "— passend zu {material} —",
        "ace.option_new": "{label} — neue Rolle anbrechen",
        "ace.option_release": "Zuordnung lösen",
        "ace.no_candidates": "Keine passende Rolle im Bestand. Lege zuerst eine an.",
        "ace.section_weigh": "Vor dem Einlegen wiegen",
        "ace.weigh_hint": "Optional. Ohne Eingabe wird der Verbrauch automatisch abgezogen; wiegen korrigiert nur, was sich über die Zeit angesammelt hat.",
        "ace.tare_hint": "Gilt für alle Farben dieser Rollensorte.",
        "ace.error_pick": "Bitte eine Rolle auswählen.",
        "tab.overview": "Übersicht",
        "tab.admin": "Admin",
        "action.save": "Speichern",
        "action.cancel": "Abbrechen",
        "action.delete": "Löschen",
        "action.edit": "Bearbeiten",
        "toast.saved": "Gespeichert",
        "toast.deleted": "Gelöscht",
        "toast.id_copied": "ID kopiert",
        "error.generic": "Fehler: {message}",
        "error.in_use": "Wird noch verwendet und kann daher nicht gelöscht werden.",
        "error.not_found": "Der Datensatz wurde nicht gefunden.",
        "error.no_sealed_spools": "Es ist keine OVP-Rolle mehr vorhanden.",
        "error.no_empty_weight": "Für diese Rollensorte ist kein Leergewicht hinterlegt. Trage es im Setup des Eintrags nach.",
        "error.invalid_data": "Bitte alle Pflichtfelder ausfüllen.",
        "error.not_loaded": "Der Filament Manager ist nicht geladen.",
        "error.unauthorized": "Dafür werden Administratorrechte benötigt.",
        "error.name_required": "Bitte einen Namen eingeben.",
        "error.item_required": "Bitte Hersteller und Sorte auswählen.",
        "stat.total_spools": "Rollen gesamt",
        "stat.sealed": "davon OVP",
        "stat.open": "davon angebrochen",
        "stat.weight": "Filament",
        "stat.value": "Lagerwert",
        "stat.entries": "Einträge",
        "filter.search": "Suchen",
        "filter.search_placeholder": "Hersteller, Sorte, Farbe, Lagerort …",
        "filter.manufacturer": "Hersteller",
        "filter.material": "Sorte",
        "filter.condition": "Zustand",
        "filter.sort": "Sortierung",
        "filter.all": "Alle",
        "condition.sealed_only": "Nur OVP",
        "condition.open_only": "Nur angebrochen",
        "sort.manufacturer": "Hersteller",
        "sort.material": "Sorte",
        "sort.color": "Farbe",
        "sort.remaining": "Restmenge",
        "sort.updated": "Zuletzt geändert",
        "label.sealed": "{count} × OVP",
        "label.open_spools": "{count} × angebrochen",
        "label.no_stock": "Kein Bestand",
        "label.location": "Lagerort",
        "label.nozzle": "Düse",
        "label.bed": "Bett",
        "label.price": "Preis",
        "label.purchased": "Gekauft",
        "label.empty_weight": "Leergewicht",
        "label.opened_at": "Angebrochen am",
        "label.spool_index": "Rolle {index}",
        "overview.title": "Bestand",
        "overview.new_item": "Neuer Eintrag",
        "overview.setup": "Setup",
        "overview.empty.title": "Noch kein Filament erfasst",
        "overview.empty.text": "Erfasse deine erste Rolle — Hersteller und Sorten sind bereits vorbelegt.",
        "overview.empty.action": "Neuer Eintrag",
        "overview.no_match.title": "Keine Treffer",
        "overview.no_match.text": "Für die gewählten Filter gibt es keine Einträge.",
        "overview.no_match.action": "Filter zurücksetzen",
        "setup.sealed_count": "OVP-Rollen",
        "setup.open_spool": "Rolle anbrechen",
        "setup.open_spools_title": "Angebrochene Rollen",
        "setup.no_open_spools": "Keine angebrochene Rolle",
        "setup.consume": "Aufgebraucht",
        "setup.copy_id": "ID für Automationen kopieren",
        "setup.delete_title": "Eintrag löschen?",
        "setup.delete_text": "{name} wird mit allen angebrochenen Rollen entfernt. Das lässt sich nicht rückgängig machen.",
        "setup.consume_title": "Rolle als aufgebraucht markieren?",
        "setup.consume_text": "Die angebrochene Rolle von {name} wird aus dem Bestand entfernt.",
        "dialog.item.new": "Neuer Filament-Eintrag",
        "dialog.item.edit": "Eintrag bearbeiten",
        "field.manufacturer": "Hersteller",
        "field.material": "Filament-Sorte",
        "field.color_name": "Farbe",
        "field.color_name_placeholder": "z. B. Schwarz, Galaxy Blue",
        "field.diameter": "Durchmesser (mm)",
        "field.net_weight": "Filament pro Rolle (g)",
        "field.sealed_count": "Anzahl OVP-Rollen",
        "field.location": "Lagerort",
        "field.location_placeholder": "z. B. Trockenbox 1",
        "field.price": "Preis pro Rolle",
        "field.purchase_date": "Kaufdatum",
        "field.nozzle_temp": "Düsentemperatur (°C)",
        "field.bed_temp": "Betttemperatur (°C)",
        "field.notes": "Notizen",
        "field.remaining_grams": "Rest (g)",
        "field.gross_weight": "Gewogen (g)",
        "field.note": "Notiz",
        "field.name": "Name",
        "field.website": "Website",
        "field.sort_order": "Reihenfolge",
        "field.density": "Dichte (g/cm³)",
        "field.optional": "optional",
        "field.temp_hint": "Leer lassen, um den Standard der Sorte zu verwenden.",
        "field.remaining_hint": "Die Restmenge wird in Gramm geführt; der Prozentwert ergibt sich daraus und lässt sich nicht direkt ändern.",
        "field.gross_weight_hint": "Komplette Rolle wiegen und den Wert hier eintragen — die Restmenge in Gramm ergibt sich daraus.",
        "field.gross_weight_disabled": "Trage zuerst das Leergewicht weiter oben ein und speichere einmal, dann lässt sich hier der Wiegewert eingeben.",
        "admin.title": "Stammdaten",
        "admin.manufacturers": "Hersteller",
        "admin.materials": "Filament-Sorten",
        "admin.new_manufacturer": "Neuer Hersteller",
        "admin.new_material": "Neue Sorte",
        "admin.used_in": "In {count} Einträgen verwendet",
        "admin.used_in_one": "In 1 Eintrag verwendet",
        "admin.unused": "Nicht verwendet",
        "admin.delete_manufacturer_title": "Hersteller löschen?",
        "admin.delete_material_title": "Sorte löschen?",
        "admin.delete_text": "{name} wird dauerhaft entfernt.",
        "admin.delete_blocked": "{name} wird noch von {count} Einträgen verwendet und kann nicht gelöscht werden.",
        "admin.delete_blocked_one": "{name} wird noch von 1 Eintrag verwendet und kann nicht gelöscht werden.",
        "admin.no_manufacturers": "Noch kein Hersteller angelegt.",
        "admin.no_materials": "Noch keine Sorte angelegt.",
        "admin.temps": "Standard: Düse {nozzle} °C · Bett {bed} °C",
        "admin.no_temps": "Keine Standardtemperaturen hinterlegt",
        "admin.only_admin.title": "Nur für Administratoren",
        "admin.only_admin.text": "Stammdaten können nur von Administratoren geändert werden.",
        "dialog.manufacturer.new": "Neuer Hersteller",
        "dialog.manufacturer.edit": "Hersteller bearbeiten",
        "dialog.material.new": "Neue Filament-Sorte",
        "dialog.material.edit": "Filament-Sorte bearbeiten",
        "readonly.notice": "Du kannst den Bestand ansehen, aber nicht ändern — dafür werden Administratorrechte benötigt.",
        "admin.spool_types": "Leergewichte der Rollen",
        "admin.spool_types_hint": "Gilt für alle Farben einer Rollensorte. Änderst du einen Wert, ziehen bereits gewogene Rollen automatisch nach.",
        "field.empty_weight_short": "Leergewicht (g)",
        "admin.tare_open": "{count} von {total} Rollensorten ohne Leergewicht",
        "admin.no_spool_types_for_manufacturer": "Noch keine Rollensorte. Sobald du einen Filament-Eintrag mit diesem Hersteller anlegst, erscheint hier das passende Leergewicht.",
        "label.not_measured": "noch nicht gewogen",
        "field.ace_material_type": "ACE-Materialtyp",
        "field.ace_material_type_auto": "Automatisch (aus dem Namen)",
        "field.ace_material_type_hint": "Nur nötig, wenn die automatische Zuordnung zum Filament im ACE-Slot nicht passt.",
        "setup.section_stock": "Bestand",
        "setup.section_tare": "Leergewicht der Rolle",
        "setup.tare_hint": "Gilt für alle Farben dieser Rollensorte. Nach dem Eintragen einmal speichern — danach nimmt das Feld für den Wiegewert unten einen Wert an.",
        "setup.no_spool_type": "Noch keine Rollensorte zu diesem Eintrag."
      },
      en: {
        "app.title": "Filament Manager",
        "app.loading": "Loading …",
        "ace.slot": "Slot {slot}",
        "ace.active": "active",
        "ace.empty": "empty",
        "ace.no_assignment": "no spool assigned",
        "ace.assign": "Assign",
        "ace.change": "Change",
        "ace.clear": "Remove",
        "ace.clear_title": "Remove the assignment?",
        "ace.clear_text": "{name} will be released from slot {slot}. The roll stays in stock with its current remaining weight.",
        "ace.clear_confirm": "Remove",
        "ace.clear_fallback": "The assigned roll",
        "ace.clear_toast": "Assignment removed",
        "ace.depleted": "Estimate used up — please weigh",
        "ace.changed": "Filament changed - please check",
        "ace.confirm": "Done",
        "ace.confirm_toast": "Slot marked as checked",
        "ace.dialog_title": "ACE slot {slot}",
        "ace.field_spool": "Spool from the inventory",
        "ace.placeholder_material": "— matching {material} —",
        "ace.option_new": "{label} — open a new spool",
        "ace.option_release": "Release the assignment",
        "ace.no_candidates": "No matching spool in the inventory. Add one first.",
        "ace.section_weigh": "Weigh before loading",
        "ace.weigh_hint": "Optional. Left empty, consumption is deducted automatically; weighing only corrects the drift that builds up over time.",
        "ace.tare_hint": "Applies to every colour of this spool type.",
        "ace.error_pick": "Please pick a spool.",
        "tab.overview": "Overview",
        "tab.admin": "Admin",
        "action.save": "Save",
        "action.cancel": "Cancel",
        "action.delete": "Delete",
        "action.edit": "Edit",
        "toast.saved": "Saved",
        "toast.deleted": "Deleted",
        "toast.id_copied": "ID copied",
        "error.generic": "Error: {message}",
        "error.in_use": "Still in use and therefore cannot be deleted.",
        "error.not_found": "The record was not found.",
        "error.no_sealed_spools": "There is no sealed spool left.",
        "error.no_empty_weight": "No empty weight is set for this spool type. Add it in the entry's setup dialog.",
        "error.invalid_data": "Please fill in all required fields.",
        "error.not_loaded": "Filament Manager is not loaded.",
        "error.unauthorized": "This requires administrator rights.",
        "error.name_required": "Please enter a name.",
        "error.item_required": "Please select a manufacturer and a filament type.",
        "stat.total_spools": "Spools total",
        "stat.sealed": "sealed",
        "stat.open": "opened",
        "stat.weight": "Filament",
        "stat.value": "Inventory value",
        "stat.entries": "Entries",
        "filter.search": "Search",
        "filter.search_placeholder": "Manufacturer, type, colour, location …",
        "filter.manufacturer": "Manufacturer",
        "filter.material": "Type",
        "filter.condition": "Condition",
        "filter.sort": "Sort by",
        "filter.all": "All",
        "condition.sealed_only": "Sealed only",
        "condition.open_only": "Opened only",
        "sort.manufacturer": "Manufacturer",
        "sort.material": "Type",
        "sort.color": "Colour",
        "sort.remaining": "Remaining",
        "sort.updated": "Last changed",
        "label.sealed": "{count} × sealed",
        "label.open_spools": "{count} × opened",
        "label.no_stock": "Out of stock",
        "label.location": "Location",
        "label.nozzle": "Nozzle",
        "label.bed": "Bed",
        "label.price": "Price",
        "label.purchased": "Bought",
        "label.empty_weight": "Empty weight",
        "label.opened_at": "Opened on",
        "label.spool_index": "Spool {index}",
        "overview.title": "Inventory",
        "overview.new_item": "New entry",
        "overview.setup": "Setup",
        "overview.empty.title": "No filament recorded yet",
        "overview.empty.text": "Add your first spool — manufacturers and types are already prepared.",
        "overview.empty.action": "New entry",
        "overview.no_match.title": "No matches",
        "overview.no_match.text": "No entries match the selected filters.",
        "overview.no_match.action": "Reset filters",
        "setup.sealed_count": "Sealed spools",
        "setup.open_spool": "Open a spool",
        "setup.open_spools_title": "Opened spools",
        "setup.no_open_spools": "No opened spool",
        "setup.consume": "Used up",
        "setup.copy_id": "Copy ID for automations",
        "setup.delete_title": "Delete entry?",
        "setup.delete_text": "{name} will be removed together with all opened spools. This cannot be undone.",
        "setup.consume_title": "Mark spool as used up?",
        "setup.consume_text": "The opened spool of {name} will be removed from the inventory.",
        "dialog.item.new": "New filament entry",
        "dialog.item.edit": "Edit entry",
        "field.manufacturer": "Manufacturer",
        "field.material": "Filament type",
        "field.color_name": "Colour",
        "field.color_name_placeholder": "e.g. Black, Galaxy Blue",
        "field.diameter": "Diameter (mm)",
        "field.net_weight": "Filament per spool (g)",
        "field.sealed_count": "Number of sealed spools",
        "field.location": "Location",
        "field.location_placeholder": "e.g. Dry box 1",
        "field.price": "Price per spool",
        "field.purchase_date": "Purchase date",
        "field.nozzle_temp": "Nozzle temperature (°C)",
        "field.bed_temp": "Bed temperature (°C)",
        "field.notes": "Notes",
        "field.remaining_grams": "Left (g)",
        "field.gross_weight": "Weighed (g)",
        "field.note": "Note",
        "field.name": "Name",
        "field.website": "Website",
        "field.sort_order": "Sort order",
        "field.density": "Density (g/cm³)",
        "field.optional": "optional",
        "field.temp_hint": "Leave empty to use the default of the filament type.",
        "field.remaining_hint": "The remaining amount is kept in grams; the percentage follows from it and cannot be edited directly.",
        "field.gross_weight_hint": "Weigh the whole spool and enter the reading — the remaining grams follow from it.",
        "field.gross_weight_disabled": "Enter the empty weight above and save once, then you can enter a reading here.",
        "admin.title": "Master data",
        "admin.manufacturers": "Manufacturers",
        "admin.materials": "Filament types",
        "admin.new_manufacturer": "New manufacturer",
        "admin.new_material": "New type",
        "admin.used_in": "Used by {count} entries",
        "admin.used_in_one": "Used by 1 entry",
        "admin.unused": "Not used",
        "admin.delete_manufacturer_title": "Delete manufacturer?",
        "admin.delete_material_title": "Delete filament type?",
        "admin.delete_text": "{name} will be removed permanently.",
        "admin.delete_blocked": "{name} is still used by {count} entries and cannot be deleted.",
        "admin.delete_blocked_one": "{name} is still used by 1 entry and cannot be deleted.",
        "admin.no_manufacturers": "No manufacturer created yet.",
        "admin.no_materials": "No filament type created yet.",
        "admin.temps": "Default: nozzle {nozzle} °C · bed {bed} °C",
        "admin.no_temps": "No default temperatures set",
        "admin.only_admin.title": "Administrators only",
        "admin.only_admin.text": "Master data can only be changed by administrators.",
        "dialog.manufacturer.new": "New manufacturer",
        "dialog.manufacturer.edit": "Edit manufacturer",
        "dialog.material.new": "New filament type",
        "dialog.material.edit": "Edit filament type",
        "readonly.notice": "You can view the inventory but not change it — that requires administrator rights.",
        "admin.spool_types": "Empty spool weights",
        "admin.spool_types_hint": "Applies to every colour of a spool type. Change a value and spools that were weighed follow along.",
        "field.empty_weight_short": "Empty weight (g)",
        "admin.tare_open": "{count} of {total} spool types without an empty weight",
        "admin.no_spool_types_for_manufacturer": "No spool type yet. As soon as you add a filament entry for this manufacturer, its empty weight appears here.",
        "label.not_measured": "not measured yet",
        "field.ace_material_type": "ACE material type",
        "field.ace_material_type_auto": "Automatic (from the name)",
        "field.ace_material_type_hint": "Only needed when the automatic match against the filament in an ACE slot gets it wrong.",
        "setup.section_stock": "Stock",
        "setup.section_tare": "Empty spool weight",
        "setup.tare_hint": "Applies to every colour of this spool type. Save once after entering it — the reading field below then accepts a value.",
        "setup.no_spool_type": "No spool type for this entry yet."
      }
    },
    n = Object.keys(t);
  let a = {},
    i = {};
  async function o(o) {
    const r = function (t) {
      if (!t) return e;
      const a = String(t).toLowerCase();
      if (n.includes(a)) return a;
      const i = a.split("-")[0];
      return n.includes(i) ? i : e;
    }(o);
    return i = t[e], a = t[r] || i, r;
  }
  function r(e, t = {}) {
    return (a[e] ?? i[e] ?? e).replace(/\{(\w+)\}/g, (e, n) => Object.hasOwn(t, n) ? String(t[n]) : e);
  }
  function l(e, t) {
    return [e.manufacturer_id, e.material_id, Math.round(Number(e[t]) || 0)].join("|");
  }
  function s(e, t) {
    if (void 0 !== e.tare_g) return e.tare_g;
    const n = t && t.spoolTypeFor ? t.spoolTypeFor(e) : null;
    return n ? n.empty_weight_g : null;
  }
  function d(e, t) {
    return [t.manufacturerName(e.manufacturer_id), t.materialName(e.material_id), e.color_name].filter(Boolean).join(" ");
  }
  function c(e, t) {
    if (null !== e.remaining_percent && void 0 !== e.remaining_percent) return Number(e.remaining_percent);
    const n = e.remaining_grams,
      a = Number(t || 0);
    return null == n || a <= 0 ? null : Math.round(10 * Math.min(100, Math.max(0, Number(n) / a * 100))) / 10;
  }
  function p(e) {
    const t = Number(e.spool_net_weight_g || 0);
    return Number(e.sealed_count || 0) * t + (e.open_spools || []).reduce((e, t) => e + function (e) {
      const t = e.remaining_grams;
      return null == t ? 0 : Number(t);
    }(t), 0);
  }
  class m {
    constructor(e) {
      this.value = e;
    }
    toString() {
      return this.value;
    }
  }
  function u(e) {
    return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function _(e) {
    return null == e || !1 === e || !0 === e ? "" : e instanceof m ? e.value : Array.isArray(e) ? e.map(_).join("") : u(e);
  }
  const h = e => new m(String(e));
  function g(e, ...t) {
    let n = e[0];
    for (let a = 0; a < t.length; a += 1) n += _(t[a]) + e[a + 1];
    return new m(n);
  }
  let f = "en",
    b = "EUR";
  function v(e, t = 0) {
    return null == e || Number.isNaN(Number(e)) ? "–" : new Intl.NumberFormat(f, {
      minimumFractionDigits: t,
      maximumFractionDigits: t
    }).format(Number(e));
  }
  function y(e) {
    if (null == e) return "–";
    const t = Number(e);
    return t >= 1e3 ? `${v(t / 1e3, 2)} kg` : `${v(t, 0)} g`;
  }
  function w(e) {
    if (null == e || "" === e) return "–";
    try {
      return new Intl.NumberFormat(f, {
        style: "currency",
        currency: b
      }).format(Number(e));
    } catch {
      return `${v(e, 2)} ${b}`;
    }
  }
  function x(e) {
    if (!e) return "–";
    const t = new Date(e);
    return Number.isNaN(t.getTime()) ? "–" : new Intl.DateTimeFormat(f, {
      dateStyle: "medium"
    }).format(t);
  }
  const $ = {
    plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
    minus: "M19,13H5V11H19V13Z",
    pencil: "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",
    delete: "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
    close: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
    chevronDown: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
    chevronUp: "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
    copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
    menu: "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
    scissors: "M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z"
  };
  function k(e, t = 20) {
    const n = $[e];
    return n ? g`<svg
    viewBox="0 0 24 24"
    width="${t}"
    height="${t}"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="${n}"></path>
  </svg>` : h("");
  }
  function z(e, t = !1) {
    const n = function (e) {
      const t = String(e || "").replace("#", "");
      if (6 !== t.length) return .5;
      const [n, a, i] = [0, 2, 4].map(e => parseInt(t.slice(e, e + 2), 16) / 255);
      return .2126 * n + .7152 * a + .0722 * i;
    }(e) > .75 ? "rgba(0,0,0,.35)" : "rgba(0,0,0,.12)";
    return g`<span
    class="swatch ${t ? "small" : ""}"
    style="background:${e}; border-color:${n}"
  ></span>`;
  }
  function N(e, t, n) {
    return g`<label class="field">
    <span class="label-text">${e}</span>
    ${t} ${n ? g`<span class="hint">${n}</span>` : ""}
  </label>`;
  }
  function L({
    name: e,
    label: t,
    value: n = "",
    type: a = "text",
    placeholder: i = "",
    hint: o = "",
    min: r,
    max: l,
    step: s,
    title: d = "",
    disabled: c = !1,
    extraClass: p = ""
  }) {
    const m = [void 0 !== r ? `min="${u(r)}"` : "", void 0 !== l ? `max="${u(l)}"` : "", void 0 !== s ? `step="${u(s)}"` : "", d ? `title="${u(d)}"` : "", c ? "disabled" : ""].join(" ");
    return N(t, g`<input
    class="${p}"
    type="${a}"
    name="${e}"
    data-field="${e}"
    value="${n ?? ""}"
    placeholder="${i}"
    ${h(m)}
  />`, o);
  }
  function S({
    name: e,
    label: t,
    value: n = "",
    options: a = [],
    hint: i = "",
    placeholder: o = ""
  }) {
    return N(t, g`<select name="${e}" data-field="${e}">
    ${o ? g`<option value="" ${h(n ? "" : "selected")}>${o}</option>` : ""}
    ${a.map(e => g`<option
          value="${e.value}"
          ${h(String(e.value) === String(n) ? "selected" : "")}
        >
          ${e.label}
        </option>`)}
  </select>`, i);
  }
  function A(e) {
    const t = Math.max(0, Math.min(100, Number(e) || 0));
    if (null == e) return g`<span class="bar unknown"></span>`;
    return g`<span class="bar ${t <= 15 ? "low" : t <= 40 ? "mid" : ""}"><span style="width:${t}%"></span></span>`;
  }
  function E({
    emoji: e,
    title: t,
    text: n,
    actionLabel: a,
    action: i
  }) {
    return g`<div class="empty">
    <div class="big">${e}</div>
    <h3>${t}</h3>
    <p>${n}</p>
    ${a ? g`<button class="btn" data-action="${i}">${a}</button>` : ""}
  </div>`;
  }
  function D({
    confirmLabel: e,
    danger: t = !1,
    extra: n
  }) {
    return g`${n || ""}
    <span class="spacer"></span>
    <button class="btn text" data-action="dialog-cancel">${r("action.cancel")}</button>
    <button class="btn ${t ? "danger" : ""}" data-action="dialog-confirm">
      ${e}
    </button>`;
  }
  const C = "__none__";
  function R(e, t) {
    const n = e.assignment || null,
      a = Boolean(e.spool_loaded),
      i = Boolean(e.is_active),
      o = Boolean(n && n.stale && !e.stale_confirmed),
      l = n ? n.remaining_grams : null,
      s = n ? n.remaining_percent : null,
      d = null != s && s < 10;
    return g`<div class="ace-slot ${i ? "ace-slot-active" : ""}">
    <div class="ace-slot-head">
      <span class="ace-slot-name">${r("ace.slot", {
      slot: e.local_slot
    })}</span>
      ${i ? g`<span class="chip open">${r("ace.active")}</span>` : ""}
    </div>

    <div class="ace-slot-body">
      <span
        class="ace-dot ${a ? "" : "ace-dot-empty"}"
        style="background:${a ? function (e) {
      const t = e.color;
      return Array.isArray(t) && t.length >= 3 ? `rgb(${Number(t[0])},${Number(t[1])},${Number(t[2])})` : e.color_hex || "#555";
    }(e) : "transparent"}"
      ></span>
      <div class="grow">
        <div class="name">${a ? e.material_type || "–" : r("ace.empty")}</div>
        <div class="sub hint">
          ${n ? n.item_label : g`<span class="ace-unbound">${r("ace.no_assignment")}</span>`}
        </div>
      </div>
    </div>

    ${n ? g`<div class="ace-slot-amount">
          ${A(void 0 === s ? null : s)}
          <span class="amount ${d ? "ace-low" : ""}">
            ${null == l ? "? g" : `${v(l)} g`}
          </span>
        </div>` : ""}

    ${n && n.depleted ? g`<div class="ace-warn">${r("ace.depleted")}</div>` : ""}
    ${o ? g`<div class="ace-warn ace-warn-row">
          <span class="grow">${r("ace.changed")}</span>
          <button
            class="ace-warn-btn"
            data-action="confirm-slot"
            data-printer="${e.printer_id}"
            data-box="${e.box_id}"
            data-slot="${e.local_slot}"
            ${h(t ? "" : "disabled")}
          >
            ${r("ace.confirm")}
          </button>
        </div>` : ""}

    <div class="ace-slot-actions">
      <button
        class="btn ${n ? "secondary" : ""} grow"
        data-action="assign-slot"
        data-printer="${e.printer_id}"
        data-box="${e.box_id}"
        data-slot="${e.local_slot}"
        ${h(t ? "" : "disabled")}
      >
        ${k(n ? "pencil" : "plus")}
        ${r(n ? "ace.change" : "ace.assign")}
      </button>

      ${n ? g`<button
            class="icon-btn danger"
            data-action="clear-slot"
            data-printer="${e.printer_id}"
            data-box="${e.box_id}"
            data-slot="${e.local_slot}"
            data-label="${n.item_label || ""}"
            title="${r("ace.clear")}"
            aria-label="${r("ace.clear")}"
            ${h(t ? "" : "disabled")}
          >
            ${k("delete")}
          </button>` : ""}
    </div>
  </div>`;
  }
  function M(e) {
    return {
      candidate: e ? `${e.item_id}:${e.spool_id}` : "",
      gross_weight_g: "",
      empty_weight_g: ""
    };
  }
  function H(e) {
    return g`<div class="summary">
    ${[{
      value: v(e.total_spools),
      label: r("stat.total_spools")
    }, {
      value: v(e.sealed_spools),
      label: r("stat.sealed")
    }, {
      value: v(e.open_spools),
      label: r("stat.open")
    }, {
      value: y(e.total_grams),
      label: r("stat.weight")
    }, {
      value: w(e.inventory_value),
      label: r("stat.value")
    }, {
      value: v(e.entry_count),
      label: r("stat.entries")
    }].map(e => g`<div class="stat">
        <div class="value">${e.value}</div>
        <div class="label">${e.label}</div>
      </div>`)}
  </div>`;
  }
  function F(e, t, n) {
    const a = Number(e.spool_net_weight_g || 0),
      i = Number(e.sealed_count || 0),
      o = e.open_spools || [],
      l = function (e, t) {
        const n = t.material(e.material_id);
        return {
          nozzle: e.nozzle_temp ?? n?.nozzle_temp ?? null,
          bed: e.bed_temp ?? n?.bed_temp ?? null,
          nozzleIsDefault: null === e.nozzle_temp || void 0 === e.nozzle_temp,
          bedIsDefault: null === e.bed_temp || void 0 === e.bed_temp
        };
      }(e, t),
      d = s(e, t),
      m = [e.location ? `${r("label.location")}: ${e.location}` : "", null != d ? `${r("label.empty_weight")}: ${v(d)} g` : "", null !== l.nozzle ? `${r("label.nozzle")}: ${l.nozzle} °C` : "", null !== l.bed ? `${r("label.bed")}: ${l.bed} °C` : "", null !== e.price && void 0 !== e.price ? `${r("label.price")}: ${w(e.price)}` : "", e.purchase_date ? `${r("label.purchased")}: ${x(e.purchase_date)}` : ""].filter(Boolean);
    return g`<div class="card spool-card">
    <div class="spool-head">
      ${z(e.color_hex)}
      <div class="spool-title">
        <div class="name">
          ${t.manufacturerName(e.manufacturer_id)}
          ${t.materialName(e.material_id)}
        </div>
        <div class="sub">
          ${e.color_name || "–"} · ${(u = e.diameter, `${v(u, Number(u) % 1 == 0 ? 0 : 2)} mm`)} ·
          ${v(a)} g
        </div>
      </div>
      <div class="chip muted">${y(p(e))}</div>
    </div>

    <div class="chips">
      ${i > 0 ? g`<span class="chip sealed">${r("label.sealed", {
      count: i
    })}</span>` : ""}
      ${o.length > 0 ? g`<span class="chip open">${r("label.open_spools", {
      count: o.length
    })}</span>` : ""}
      ${0 === function (e) {
      return Number(e.sealed_count || 0) + (e.open_spools || []).length;
    }(e) ? g`<span class="chip muted">${r("label.no_stock")}</span>` : ""}
    </div>

    ${o.map((e, t) => {
      const n = c(e, a),
        i = null !== e.remaining_grams && void 0 !== e.remaining_grams;
      return g`<div class="open-row">
        <span class="chip muted">${r("label.spool_index", {
        index: t + 1
      })}</span>
        ${A(n)}
        <span class="amount">
          ${i ? `${v(n, 0)} % · ${v(e.remaining_grams)} g` : r("label.not_measured")}
        </span>
      </div>`;
    })}
    ${m.length ? g`<div class="meta">${m.map(e => g`<span>${e}</span>`)}</div>` : ""}
    ${e.notes ? g`<div class="meta"><span>${e.notes}</span></div>` : ""}

    <div class="card-actions">
      <button
        class="btn secondary"
        data-action="setup-item"
        data-item="${e.id}"
        ${h(n ? "" : "disabled")}
      >
        ${k("pencil")} ${r("overview.setup")}
      </button>
    </div>
  </div>`;
    var u;
  }
  function T(e) {
    const {
        data: t,
        state: n,
        lookup: a,
        isAdmin: i
      } = e,
      o = t.items || [],
      l = g`<div class="section-title">
    <span>${r("overview.title")}</span>
    <span class="spacer"></span>
    <button class="btn" data-action="new-item" ${h(i ? "" : "disabled")}>
      ${k("plus")} ${r("overview.new_item")}
    </button>
  </div>`,
      s = i ? "" : g`<div class="card" style="margin-bottom:12px">${r("readonly.notice")}</div>`,
      d = function (e) {
        const {
          slots: t,
          isAdmin: n
        } = e;
        return t && t.length ? g`${t.map(e => g`<div class="ace-box">
      <div class="section-title" style="margin:0 0 10px">
        <span>${e.name}</span>
      </div>
      <div class="ace-grid">
        ${e.slots.map(e => R(e, n))}
      </div>
    </div>`)}` : "";
      }(e);
    if (!o.length) return g`${d} ${l} ${s} ${H(t.summary)}
    ${E({
      emoji: "🧵",
      title: r("overview.empty.title"),
      text: r("overview.empty.text"),
      actionLabel: i ? r("overview.empty.action") : "",
      action: "new-item"
    })}`;
    const c = function (e, t, n) {
      const a = (t.q || "").trim().toLowerCase(),
        i = e.filter(e => (!t.manufacturer || e.manufacturer_id === t.manufacturer) && (!t.material || e.material_id === t.material) && !("sealed" === t.condition && Number(e.sealed_count || 0) < 1) && !("open" === t.condition && (e.open_spools || []).length < 1) && (!a || [n.manufacturerName(e.manufacturer_id), n.materialName(e.material_id), e.color_name, e.location, e.notes].join(" ").toLowerCase().includes(a))),
        o = {
          manufacturer: (e, t) => n.manufacturerName(e.manufacturer_id).localeCompare(n.manufacturerName(t.manufacturer_id)) || n.materialName(e.material_id).localeCompare(n.materialName(t.material_id)),
          material: (e, t) => n.materialName(e.material_id).localeCompare(n.materialName(t.material_id)) || n.manufacturerName(e.manufacturer_id).localeCompare(n.manufacturerName(t.manufacturer_id)),
          color: (e, t) => (e.color_name || "").localeCompare(t.color_name || ""),
          remaining: (e, t) => p(e) - p(t),
          updated: (e, t) => String(t.updated_at || "").localeCompare(String(e.updated_at || ""))
        }[t.sort || "manufacturer"];
      return i.slice().sort((e, t) => o(e, t) || (e.color_name || "").localeCompare(t.color_name || ""));
    }(o, n.filters, a);
    return g`${d} ${l} ${s} ${H(t.summary)}
  ${function (e, t) {
      return g`<div class="filters">
    <div class="grow">
      <input
        type="search"
        data-filter="q"
        value="${t.q}"
        placeholder="${r("filter.search_placeholder")}"
        aria-label="${r("filter.search")}"
      />
    </div>
    <select data-filter="manufacturer" aria-label="${r("filter.manufacturer")}">
      <option value="">${r("filter.manufacturer")}: ${r("filter.all")}</option>
      ${e.manufacturers.map(e => g`<option
          value="${e.id}"
          ${t.manufacturer === e.id ? " selected" : ""}
        >
          ${e.name}
        </option>`)}
    </select>
    <select data-filter="material" aria-label="${r("filter.material")}">
      <option value="">${r("filter.material")}: ${r("filter.all")}</option>
      ${e.materials.map(e => g`<option
          value="${e.id}"
          ${t.material === e.id ? " selected" : ""}
        >
          ${e.name}
        </option>`)}
    </select>
    <select data-filter="condition" aria-label="${r("filter.condition")}">
      <option value="">${r("filter.condition")}: ${r("filter.all")}</option>
      <option value="sealed" ${"sealed" === t.condition ? " selected" : ""}>
        ${r("condition.sealed_only")}
      </option>
      <option value="open" ${"open" === t.condition ? " selected" : ""}>
        ${r("condition.open_only")}
      </option>
    </select>
    <select data-filter="sort" aria-label="${r("filter.sort")}">
      ${["manufacturer", "material", "color", "remaining", "updated"].map(e => g`<option value="${e}" ${t.sort === e ? " selected" : ""}>
          ${r("filter.sort")}: ${r(`sort.${e}`)}
        </option>`)}
    </select>
  </div>`;
    }(t, n.filters)}
  ${c.length ? g`<div class="grid">${c.map(e => F(e, a, i))}</div>` : E({
      emoji: "🔍",
      title: r("overview.no_match.title"),
      text: r("overview.no_match.text"),
      actionLabel: r("overview.no_match.action"),
      action: "reset-filters"
    })}`;
  }
  const B = [200, 250, 500, 750, 1e3, 2e3, 3e3],
    V = [1.75, 2.85, 3],
    I = "margin:8px 0 4px";
  function O(e, t) {
    const n = e.open_spools || [],
      a = null != t;
    return g`<div class="span-2">
    <div class="section-title" style="${I}">${r("setup.open_spools_title")}</div>
    <div class="hint">
      ${r("field.remaining_hint")}
      ${a ? ` ${r("field.gross_weight_hint")}` : ` ${r("field.gross_weight_disabled")}`}
    </div>
    ${n.length ? g`<div class="sub-list">
          ${n.map((n, a) => function (e, t, n, a) {
      const i = null != a,
        o = c(t, Number(e.spool_net_weight_g || 0));
      return g`<div class="spool-edit" data-item="${e.id}" data-spool="${t.id}">
    <div class="grow">
      <div class="open-row">
        <span class="chip muted">${r("label.spool_index", {
        index: n + 1
      })}</span>
        ${A(o)}
        <span class="amount">${null === o ? "–" : `${v(o, 0)} %`}</span>
      </div>
      <div class="hint">
        ${r("label.opened_at")}: ${x(t.opened_at)}
      </div>
    </div>
    <div class="num-field">
      ${L({
        name: "remaining_grams",
        label: r("field.remaining_grams"),
        type: "number",
        min: 0,
        step: 1,
        value: t.remaining_grams
      })}
    </div>
    <div class="num-field">
      ${L({
        name: "gross_weight_g",
        label: r("field.gross_weight"),
        type: "number",
        min: 0,
        step: 1,
        value: "",
        placeholder: i ? "" : "—",
        disabled: !i,
        title: r(i ? "field.gross_weight_hint" : "field.gross_weight_disabled")
      })}
    </div>
    <div class="grow">
      ${L({
        name: "note",
        label: r("field.note"),
        value: t.note
      })}
    </div>
    <button
      class="btn danger text"
      data-action="consume-spool"
      data-item="${e.id}"
      data-spool="${t.id}"
    >
      ${r("setup.consume")}
    </button>
  </div>`;
    }(e, n, a, t))}
        </div>` : g`<div class="hint">${r("setup.no_open_spools")}</div>`}
  </div>`;
  }
  function P(e, t, n, a, i) {
    const o = a ? s(a, n) : null;
    return g`<div class="form-grid">
    ${S({
      name: "manufacturer_id",
      label: r("field.manufacturer"),
      value: e.manufacturer_id,
      placeholder: "—",
      options: t.manufacturers.map(e => ({
        value: e.id,
        label: e.name
      }))
    })}
    ${S({
      name: "material_id",
      label: r("field.material"),
      value: e.material_id,
      placeholder: "—",
      options: t.materials.map(e => ({
        value: e.id,
        label: e.name
      }))
    })}

    <div class="span-2">
      ${function ({
      nameText: e,
      nameHex: t,
      label: n,
      textValue: a,
      hexValue: i,
      placeholder: o
    }) {
      return g`<div class="color-field">
    <div class="grow">
      ${L({
        name: e,
        label: n,
        value: a,
        placeholder: o || ""
      })}
    </div>
    <input type="color" name="${t}" data-field="${t}" value="${i}" />
  </div>`;
    }({
      nameText: "color_name",
      nameHex: "color_hex",
      label: r("field.color_name"),
      textValue: e.color_name,
      hexValue: e.color_hex || "#9e9e9e",
      placeholder: r("field.color_name_placeholder")
    })}
    </div>

    ${S({
      name: "diameter",
      label: r("field.diameter"),
      value: e.diameter,
      options: V.map(e => ({
        value: e,
        label: `${e} mm`
      }))
    })}
    ${S({
      name: "spool_net_weight_g",
      label: r("field.net_weight"),
      value: e.spool_net_weight_g,
      options: B.map(e => ({
        value: e,
        label: `${e} g`
      }))
    })}

    ${L({
      name: "location",
      label: r("field.location"),
      value: e.location,
      placeholder: r("field.location_placeholder")
    })}
    ${a ? "" : L({
      name: "sealed_count",
      label: r("field.sealed_count"),
      type: "number",
      min: 0,
      step: 1,
      value: e.sealed_count
    })}

    ${L({
      name: "price",
      label: r("field.price"),
      type: "number",
      min: 0,
      step: .01,
      value: e.price
    })}
    ${L({
      name: "purchase_date",
      label: r("field.purchase_date"),
      type: "date",
      value: e.purchase_date
    })}

    ${L({
      name: "nozzle_temp",
      label: r("field.nozzle_temp"),
      type: "number",
      min: 0,
      max: 600,
      step: 5,
      value: e.nozzle_temp,
      hint: r("field.temp_hint")
    })}
    ${L({
      name: "bed_temp",
      label: r("field.bed_temp"),
      type: "number",
      min: 0,
      max: 300,
      step: 5,
      value: e.bed_temp,
      hint: r("field.temp_hint")
    })}

    <div class="span-2">
      ${function ({
      name: e,
      label: t,
      value: n = "",
      hint: a = ""
    }) {
      return N(t, g`<textarea name="${e}" data-field="${e}">
${n || ""}</textarea
  >`, a);
    }({
      name: "notes",
      label: r("field.notes"),
      value: e.notes
    })}
    </div>

    ${a ? function (e, t) {
      const n = Number(e.sealed_count || 0);
      return g`<div class="span-2">
    <div class="section-title" style="${I}">${r("setup.section_stock")}</div>
    <div class="row-main">
      <div class="grow">
        <div class="name">${r("setup.sealed_count")}</div>
        <div class="sub hint">${r("label.sealed", {
        count: n
      })}</div>
      </div>
      <span class="counter">
        <button
          class="icon-btn plain"
          data-action="sealed-minus"
          data-item="${e.id}"
          title="-1"
          ${h(!t || n < 1 ? "disabled" : "")}
        >
          ${k("minus")}
        </button>
        <span class="num">${n}</span>
        <button
          class="icon-btn plain"
          data-action="sealed-plus"
          data-item="${e.id}"
          title="+1"
          ${h(t ? "" : "disabled")}
        >
          ${k("plus")}
        </button>
      </span>
      <button
        class="btn secondary"
        data-action="open-spool"
        data-item="${e.id}"
        ${h(!t || n < 1 ? "disabled" : "")}
      >
        ${r("setup.open_spool")}
      </button>
    </div>
  </div>`;
    }(a, i) : ""}
    ${a ? function (e, t, n) {
      const a = n.spoolTypeFor(e),
        i = a ? g`<div class="tare-list">
        <div class="tare-row">
          <div class="grow">
            <div class="name">
              ${n.manufacturerName(a.manufacturer_id)}
              ${n.materialName(a.material_id)} ·
              ${v(a.net_weight_g)} g
            </div>
          </div>
          <div class="num-field">
            ${L({
          name: `spool_type__${a.id}`,
          label: r("field.empty_weight_short"),
          type: "number",
          min: 0,
          step: .1,
          value: t[`spool_type__${a.id}`]
        })}
          </div>
        </div>
      </div>` : g`<div class="hint">${r("setup.no_spool_type")}</div>`;
      return g`<div class="span-2">
    <div class="section-title" style="${I}">${r("setup.section_tare")}</div>
    <div class="hint">${r("setup.tare_hint")}</div>
    ${i}
  </div>`;
    }(a, e, n) : ""}
    ${a ? O(a, o) : ""}
    ${a ? g`<div class="span-2">
          <div class="hint">
            ID:
            <button class="id-badge" data-action="copy-id" data-id="${a.id}" title="${r("setup.copy_id")}">
              ${a.id}
            </button>
          </div>
        </div>` : ""}
  </div>`;
  }
  function j({
    entry: e,
    subtitle: t,
    usage: n,
    editAction: a,
    deleteAction: i
  }) {
    return g`<div class="row">
    <div class="row-main">
      <div class="grow">
        <div class="name">${e.name}</div>
        <div class="sub hint">${t}</div>
      </div>
      <div class="row-actions">
        ${(o = n, 0 === o ? g`<span class="chip muted">${r("admin.unused")}</span>` : g`<span class="chip">${r(1 === o ? "admin.used_in_one" : "admin.used_in", {
      count: o
    })}</span>`)}
        <button
          class="icon-btn"
          data-action="${a}"
          data-id="${e.id}"
          title="${r("action.edit")}"
        >
          ${k("pencil")}
        </button>
        <button
          class="icon-btn danger"
          data-action="${i}"
          data-id="${e.id}"
          title="${r("action.delete")}"
          ${h(n > 0 ? "disabled" : "")}
        >
          ${k("delete")}
        </button>
      </div>
    </div>
  </div>`;
    var o;
  }
  function q(e, t) {
    const n = (t.spool_types || []).filter(t => t.manufacturer_id === e.id),
      a = n.filter(e => null === e.empty_weight_g || void 0 === e.empty_weight_g).length,
      i = e.website || "—";
    return a ? `${i} · ${r("admin.tare_open", {
      count: a,
      total: n.length
    })}` : i;
  }
  function W(e) {
    return `${null !== e.nozzle_temp || null !== e.bed_temp ? r("admin.temps", {
      nozzle: e.nozzle_temp ?? "–",
      bed: e.bed_temp ?? "–"
    }) : r("admin.no_temps")}${null !== e.density && void 0 !== e.density ? ` · ${v(e.density, 2)} g/cm³` : ""}`;
  }
  const Z = ["PLA", "PETG", "ABS", "PACF", "PC", "ASA", "HIPS", "PA", "PLA_SE"];
  const K = "anycubic_cloud_extended/filament",
    G = ["overview", "admin"],
    U = {
      manufacturers: [],
      materials: [],
      spool_types: [],
      items: [],
      usage: {
        manufacturers: {},
        materials: {},
        spool_types: {}
      },
      summary: {
        entry_count: 0,
        sealed_spools: 0,
        open_spools: 0,
        total_spools: 0,
        total_grams: 0,
        total_kg: 0,
        inventory_value: 0,
        by_material: {},
        by_manufacturer: {}
      }
    };
  class X extends HTMLElement {
    constructor() {
      super(), this.attachShadow({
        mode: "open"
      }), this._hass = null, this._narrow = !1, this._panel = null, this._route = null, this._ready = !1, this._data = U, this._unsubscribe = null, this._toastTimer = null, this._overlayKey = "", this._confirmedSlots = new Set(), this._state = {
        view: "overview",
        filters: {
          q: "",
          manufacturer: "",
          material: "",
          condition: "",
          sort: "manufacturer"
        }
      }, this._dialog = null, this.shadowRoot.innerHTML = '\n      <style>\n  :host {\n    display: block;\n    height: 100%;\n    background: var(--primary-background-color, #fafafa);\n    color: var(--primary-text-color, #212121);\n    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);\n    -moz-osx-font-smoothing: grayscale;\n    -webkit-font-smoothing: antialiased;\n  }\n\n  * { box-sizing: border-box; }\n\n  .app-header {\n    position: sticky;\n    top: 0;\n    z-index: 4;\n    background: var(--app-header-background-color, var(--primary-color, #03a9f4));\n    color: var(--app-header-text-color, #fff);\n    box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.16));\n  }\n\n  .toolbar {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    height: 56px;\n    padding: 0 12px;\n    font-size: 20px;\n    font-weight: 400;\n  }\n\n  .toolbar .title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n\n  .menu-button {\n    display: none;\n    background: none;\n    border: none;\n    color: inherit;\n    cursor: pointer;\n    padding: 8px;\n    border-radius: 50%;\n    line-height: 0;\n  }\n  :host([narrow]) .menu-button { display: block; }\n  .menu-button:hover { background: rgba(255, 255, 255, 0.12); }\n\n  .tabs {\n    display: flex;\n    gap: 4px;\n    padding: 0 8px;\n    overflow-x: auto;\n    scrollbar-width: none;\n  }\n  .tabs::-webkit-scrollbar { display: none; }\n\n  .tab {\n    appearance: none;\n    background: none;\n    border: none;\n    border-bottom: 3px solid transparent;\n    color: inherit;\n    opacity: 0.72;\n    cursor: pointer;\n    font-size: 14px;\n    font-weight: 500;\n    letter-spacing: 0.4px;\n    padding: 12px 16px;\n    text-transform: uppercase;\n    white-space: nowrap;\n  }\n  .tab:hover { opacity: 1; }\n  .tab[aria-selected="true"] { opacity: 1; border-bottom-color: currentColor; }\n\n  .content {\n    max-width: 1240px;\n    margin: 0 auto;\n    padding: 16px;\n  }\n\n  /* ---------------- cards ---------------- */\n\n  .card {\n    background: var(--card-background-color, #fff);\n    border-radius: var(--ha-card-border-radius, 12px);\n    box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));\n    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, transparent);\n    padding: 16px;\n  }\n\n  .section-title {\n    font-size: 16px;\n    font-weight: 500;\n    margin: 24px 0 12px;\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    /* Title plus action button does not fit a narrow panel on one line. */\n    flex-wrap: wrap;\n  }\n  .section-title:first-child { margin-top: 0; }\n  .section-title .spacer { flex: 1; }\n\n  /* ---------------- summary strip ---------------- */\n\n  .summary {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\n    gap: 12px;\n    margin-bottom: 16px;\n  }\n\n  .stat {\n    background: var(--card-background-color, #fff);\n    border-radius: var(--ha-card-border-radius, 12px);\n    box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));\n    padding: 14px 16px;\n  }\n  .stat .value {\n    font-size: 26px;\n    font-weight: 500;\n    line-height: 1.15;\n    color: var(--primary-text-color);\n  }\n  .stat .label {\n    font-size: 12px;\n    letter-spacing: 0.4px;\n    text-transform: uppercase;\n    color: var(--secondary-text-color, #727272);\n    margin-top: 4px;\n  }\n\n  /* ---------------- filter bar ---------------- */\n\n  .filters {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 8px;\n    align-items: center;\n    margin-bottom: 16px;\n  }\n  .filters .grow { flex: 1 1 200px; min-width: 160px; }\n\n  /* ---------------- form controls ---------------- */\n\n  input[type="text"],\n  input[type="number"],\n  input[type="date"],\n  input[type="search"],\n  select,\n  textarea {\n    width: 100%;\n    font: inherit;\n    font-size: 14px;\n    color: var(--primary-text-color);\n    background: var(--card-background-color, #fff);\n    border: 1px solid var(--divider-color, #e0e0e0);\n    border-radius: 8px;\n    padding: 9px 10px;\n  }\n  textarea { resize: vertical; min-height: 64px; }\n  input:disabled, select:disabled, textarea:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n    background: var(--divider-color, #e0e0e0);\n  }\n  input:focus, select:focus, textarea:focus {\n    outline: none;\n    border-color: var(--primary-color, #03a9f4);\n    box-shadow: 0 0 0 1px var(--primary-color, #03a9f4);\n  }\n  input[type="color"] {\n    width: 48px;\n    height: 40px;\n    padding: 2px;\n    border: 1px solid var(--divider-color, #e0e0e0);\n    border-radius: 8px;\n    background: var(--card-background-color, #fff);\n    cursor: pointer;\n  }\n  label.field { display: block; }\n  label.field > .label-text {\n    display: block;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--secondary-text-color, #727272);\n    margin-bottom: 4px;\n  }\n  .hint {\n    font-size: 12px;\n    color: var(--secondary-text-color, #727272);\n    margin-top: 4px;\n  }\n\n  button {\n    font: inherit;\n    cursor: pointer;\n  }\n\n  .btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 6px;\n    border: none;\n    border-radius: 8px;\n    font-size: 14px;\n    font-weight: 500;\n    padding: 9px 16px;\n    background: var(--primary-color, #03a9f4);\n    color: var(--text-primary-color, #fff);\n  }\n  .btn:hover { filter: brightness(1.08); }\n  .btn:disabled { opacity: 0.5; cursor: not-allowed; filter: none; }\n\n  .btn.secondary {\n    background: transparent;\n    color: var(--primary-color, #03a9f4);\n    border: 1px solid var(--divider-color, #e0e0e0);\n  }\n  .btn.text {\n    background: transparent;\n    color: var(--primary-color, #03a9f4);\n    padding: 8px 10px;\n  }\n  .btn.danger { background: var(--error-color, #db4437); color: #fff; }\n  .btn.danger.text { background: transparent; color: var(--error-color, #db4437); }\n\n  .icon-btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    width: 34px;\n    height: 34px;\n    border: 1px solid var(--divider-color, #e0e0e0);\n    border-radius: 50%;\n    background: transparent;\n    color: var(--primary-text-color);\n    font-size: 18px;\n    line-height: 1;\n    flex: 0 0 auto;\n  }\n  .icon-btn:hover { background: var(--divider-color, #e0e0e0); }\n  .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; background: transparent; }\n  .icon-btn.plain { border: none; }\n  .icon-btn.danger { color: var(--error-color, #db4437); }\n\n  /* ---------------- inventory cards ---------------- */\n\n  .grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n    gap: 12px;\n  }\n\n  /* ---------------- ACE box ---------------- */\n\n  .ace-box {\n    background: var(--card-background-color, #fff);\n    border-radius: var(--ha-card-border-radius, 12px);\n    box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.12));\n    padding: 16px;\n    margin-bottom: 16px;\n  }\n\n  .ace-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\n    gap: 10px;\n  }\n\n  .ace-slot {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n    padding: 12px;\n    border: 1px solid var(--divider-color, #e0e0e0);\n    border-radius: 10px;\n  }\n  .ace-slot-active { border-color: var(--success-color, #43a047); }\n\n  .ace-slot-head {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    min-height: 22px;\n  }\n  .ace-slot-name {\n    font-size: 11px;\n    letter-spacing: 1px;\n    text-transform: uppercase;\n    color: var(--secondary-text-color, #727272);\n  }\n\n  .ace-slot-body { display: flex; align-items: center; gap: 10px; }\n\n  .ace-dot {\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    flex: 0 0 auto;\n    border: 2px solid rgba(0, 0, 0, 0.25);\n  }\n  .ace-dot-empty { border-style: dashed; }\n\n  .ace-unbound { font-style: italic; }\n\n  .ace-slot-amount { display: flex; align-items: center; gap: 8px; }\n  .ace-low { color: var(--error-color, #d32f2f); font-weight: 500; }\n\n  .ace-warn {\n    font-size: 11px;\n    color: var(--warning-color, #ffa600);\n  }\n\n  /* Wraps on a narrow card, so the button drops under the text rather than\n     squeezing it into a column of single words. */\n  .ace-warn-row {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    gap: 4px 8px;\n  }\n  .ace-warn-row .grow { flex: 1 1 auto; min-width: 0; }\n\n  .ace-warn-btn {\n    flex: 0 0 auto;\n    padding: 2px 8px;\n    font-size: 11px;\n    font-weight: 500;\n    color: inherit;\n    background: transparent;\n    border: 1px solid currentColor;\n    border-radius: 6px;\n  }\n  .ace-warn-btn:hover { background: rgba(255, 166, 0, 0.12); }\n  .ace-warn-btn:disabled { opacity: 0.5; cursor: not-allowed; background: transparent; }\n\n  /* Pushed down so the buttons line up however tall the slot above is. */\n  .ace-slot-actions {\n    display: flex;\n    align-items: stretch;\n    gap: 6px;\n    margin-top: auto;\n  }\n  .ace-slot-actions .grow { flex: 1; min-width: 0; justify-content: center; }\n\n  /* Squared off and sized to the button beside it, so the pair reads as one\n     control rather than a button with a stray circle next to it. */\n  .ace-slot-actions .icon-btn {\n    width: 38px;\n    height: auto;\n    border-radius: 8px;\n  }\n\n  .spool-card { display: flex; flex-direction: column; gap: 10px; }\n\n  /* Pushed to the bottom edge of the card so the button sits in the same\n     place on every card, however much metadata the entry carries. */\n  .card-actions {\n    display: flex;\n    justify-content: flex-end;\n    margin-top: auto;\n    padding-top: 2px;\n  }\n\n  .spool-head { display: flex; align-items: flex-start; gap: 12px; }\n\n  .swatch {\n    width: 40px;\n    height: 40px;\n    border-radius: 50%;\n    flex: 0 0 auto;\n    border: 2px solid var(--divider-color, #e0e0e0);\n    box-shadow: inset 0 -6px 10px rgba(0, 0, 0, 0.18);\n  }\n  .swatch.small { width: 26px; height: 26px; border-width: 1px; }\n\n  .spool-title { flex: 1; min-width: 0; }\n  .spool-title .name {\n    font-size: 15px;\n    font-weight: 500;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n  .spool-title .sub {\n    font-size: 13px;\n    color: var(--secondary-text-color, #727272);\n    margin-top: 2px;\n  }\n\n  .chips { display: flex; flex-wrap: wrap; gap: 6px; }\n  .chip {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    font-size: 12px;\n    font-weight: 500;\n    padding: 3px 9px;\n    border-radius: 999px;\n    background: var(--divider-color, #e0e0e0);\n    color: var(--primary-text-color);\n    white-space: nowrap;\n  }\n  .chip.sealed { background: rgba(3, 169, 244, 0.16); color: var(--primary-color, #03a9f4); }\n  .chip.open { background: rgba(255, 152, 0, 0.18); color: #e08600; }\n  .chip.muted { background: transparent; border: 1px solid var(--divider-color, #e0e0e0); color: var(--secondary-text-color, #727272); }\n\n  .bar {\n    position: relative;\n    height: 8px;\n    border-radius: 999px;\n    background: var(--divider-color, #e0e0e0);\n    overflow: hidden;\n  }\n  .bar > span {\n    position: absolute;\n    inset: 0 auto 0 0;\n    border-radius: 999px;\n    background: var(--primary-color, #03a9f4);\n  }\n  .bar.unknown {\n    background: repeating-linear-gradient(\n      45deg,\n      var(--divider-color, #e0e0e0) 0 6px,\n      transparent 6px 12px\n    );\n  }\n  .bar.low > span { background: var(--error-color, #db4437); }\n  .bar.mid > span { background: var(--warning-color, #ffa600); }\n\n  .open-row {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    font-size: 13px;\n  }\n  .open-row .bar { flex: 1; }\n  .open-row .amount { color: var(--secondary-text-color, #727272); white-space: nowrap; }\n\n  .meta {\n    font-size: 12px;\n    color: var(--secondary-text-color, #727272);\n    display: flex;\n    flex-wrap: wrap;\n    gap: 4px 14px;\n  }\n\n  /* ---------------- lists (manage / admin) ---------------- */\n\n  .list { display: flex; flex-direction: column; gap: 8px; }\n\n  .row {\n    background: var(--card-background-color, #fff);\n    border-radius: var(--ha-card-border-radius, 12px);\n    box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));\n    padding: 12px 14px;\n  }\n  .row-main {\n    display: flex;\n    align-items: center;\n    gap: 12px;\n    flex-wrap: wrap;\n  }\n  .row-main .grow { flex: 1 1 220px; min-width: 0; }\n  .row-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }\n\n  .counter {\n    display: inline-flex;\n    align-items: center;\n    gap: 6px;\n    border: 1px solid var(--divider-color, #e0e0e0);\n    border-radius: 999px;\n    padding: 2px;\n  }\n  .counter .num {\n    min-width: 34px;\n    text-align: center;\n    font-size: 15px;\n    font-weight: 500;\n    font-variant-numeric: tabular-nums;\n  }\n  .counter .icon-btn { width: 30px; height: 30px; border: none; }\n\n  /* empty weights inside the manufacturer dialog */\n  .tare-list {\n    display: flex;\n    flex-direction: column;\n    gap: 10px;\n    border-top: 1px solid var(--divider-color, #e0e0e0);\n    padding-top: 12px;\n  }\n  .tare-row {\n    display: flex;\n    align-items: flex-end;\n    gap: 12px;\n  }\n  .tare-row .grow { flex: 1; min-width: 0; }\n  .tare-row .name { font-size: 14px; font-weight: 500; }\n  .tare-row .num-field { width: 120px; flex: 0 0 auto; }\n\n  .sub-list {\n    margin-top: 12px;\n    padding-top: 12px;\n    border-top: 1px solid var(--divider-color, #e0e0e0);\n    display: flex;\n    flex-direction: column;\n    gap: 10px;\n  }\n\n  .spool-edit {\n    display: flex;\n    align-items: flex-end;\n    gap: 8px;\n    flex-wrap: wrap;\n  }\n  .spool-edit .num-field { width: 104px; flex: 0 0 auto; }\n  .spool-edit .grow { flex: 1 1 160px; }\n\n  /* ---------------- empty state ---------------- */\n\n  .empty {\n    text-align: center;\n    padding: 48px 16px;\n    color: var(--secondary-text-color, #727272);\n  }\n  .empty .big { font-size: 44px; line-height: 1; margin-bottom: 12px; }\n  .empty h3 { margin: 0 0 6px; color: var(--primary-text-color); font-weight: 500; }\n  .empty p { margin: 0 0 16px; }\n\n  /* ---------------- dialog ---------------- */\n\n  .overlay {\n    position: fixed;\n    inset: 0;\n    z-index: 10;\n    background: rgba(0, 0, 0, 0.45);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    padding: 16px;\n  }\n  .dialog {\n    background: var(--card-background-color, #fff);\n    color: var(--primary-text-color);\n    border-radius: var(--ha-card-border-radius, 14px);\n    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.32);\n    width: min(640px, 100%);\n    max-height: min(88vh, 900px);\n    display: flex;\n    flex-direction: column;\n  }\n  .dialog h2 {\n    margin: 0;\n    padding: 20px 24px 8px;\n    font-size: 20px;\n    font-weight: 500;\n  }\n  .dialog .body { padding: 8px 24px 16px; overflow-y: auto; }\n  .dialog .actions {\n    display: flex;\n    justify-content: flex-end;\n    gap: 8px;\n    padding: 8px 16px 16px;\n    flex-wrap: wrap;\n  }\n  .dialog .actions .spacer { flex: 1; }\n\n  .form-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n    gap: 14px;\n  }\n  .form-grid .span-2 { grid-column: 1 / -1; }\n  .color-field { display: flex; gap: 8px; align-items: flex-end; }\n  .color-field .grow { flex: 1; }\n\n  .error-text {\n    color: var(--error-color, #db4437);\n    font-size: 13px;\n    margin-top: 8px;\n  }\n\n  /* ---------------- toast ---------------- */\n\n  .toast {\n    position: fixed;\n    left: 50%;\n    bottom: 24px;\n    transform: translateX(-50%);\n    z-index: 20;\n    background: #323232;\n    color: #fff;\n    border-radius: 8px;\n    padding: 12px 18px;\n    font-size: 14px;\n    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);\n    max-width: calc(100vw - 32px);\n  }\n  .toast.error { background: var(--error-color, #db4437); }\n\n  .id-badge {\n    font-family: var(--code-font-family, monospace);\n    font-size: 11px;\n    color: var(--secondary-text-color, #727272);\n    background: var(--divider-color, #e0e0e0);\n    border-radius: 4px;\n    padding: 1px 6px;\n    cursor: pointer;\n    border: none;\n  }\n\n  @media (max-width: 600px) {\n    .content { padding: 12px; }\n    .grid { grid-template-columns: 1fr; }\n    .toolbar { font-size: 18px; }\n  }\n</style>\n      <div id="app"><div class="content"><div class="empty">…</div></div></div>\n      <div id="overlay"></div>\n      <div id="toast"></div>\n    ', this._onClick = this._onClick.bind(this), this._onInput = this._onInput.bind(this), this._onChange = this._onChange.bind(this), this._onKeyDown = this._onKeyDown.bind(this);
    }
    set hass(e) {
      const t = !this._hass;
      this._hass = e, t && this._init();
    }
    get hass() {
      return this._hass;
    }
    set narrow(e) {
      this._narrow = Boolean(e), this.toggleAttribute("narrow", this._narrow);
    }
    set panel(e) {
      this._panel = e;
    }
    set route(e) {
      this._route = e;
      const t = (e && e.path ? e.path : "").split("/").filter(Boolean),
        n = t.length ? t[t.length - 1] : "",
        a = G.includes(n) ? n : "overview";
      a !== this._state.view && (this._state.view = a, this._ready && this._renderApp());
    }
    connectedCallback() {
      this.shadowRoot.addEventListener("click", this._onClick), this.shadowRoot.addEventListener("input", this._onInput), this.shadowRoot.addEventListener("change", this._onChange), this.shadowRoot.addEventListener("keydown", this._onKeyDown), this._hass && this._init();
    }
    disconnectedCallback() {
      this.shadowRoot.removeEventListener("click", this._onClick), this.shadowRoot.removeEventListener("input", this._onInput), this.shadowRoot.removeEventListener("change", this._onChange), this.shadowRoot.removeEventListener("keydown", this._onKeyDown), this._unsubscribe && (this._unsubscribe(), this._unsubscribe = null), this._toastTimer && clearTimeout(this._toastTimer);
    }
    get _isAdmin() {
      return Boolean(this._hass && this._hass.user && this._hass.user.is_admin);
    }
    async _init() {
      if (this._initStarted) return;
      this._initStarted = !0;
      const e = this._hass.locale && this._hass.locale.language || this._hass.language;
      try {
        await o(e);
      } catch (e) {
        console.error("Filament Manager: cannot load translations", e);
      }
      !function (e, t) {
        f = e || "en", b = t || "EUR";
      }(e, this._hass.config && this._hass.config.currency || "EUR"), this._renderLoading(), await this._subscribe(), this._ready = !0, this._renderApp();
    }
    _renderLoading() {
      this.shadowRoot.getElementById("app").innerHTML = String(g`<div class="content"><div class="empty">${r("app.loading")}</div></div>`);
    }
    async _subscribe() {
      try {
        this._unsubscribe = await this._hass.connection.subscribeMessage(e => {
          e && e.snapshot && (this._data = e.snapshot, this._ready && (this._renderApp(), this._refreshOpenDialog()));
        }, {
          type: `${K}/subscribe`
        });
      } catch (e) {
        console.error("Filament Manager: subscription failed", e), this._data = await this._hass.callWS({
          type: `${K}/data`
        }).catch(() => U);
      }
    }
    async _call(e) {
      try {
        return await this._hass.callWS(e);
      } catch (e) {
        throw this._toast(function (e) {
          const t = e && e.code ? e.code : "unknown_error";
          return ["in_use", "not_found", "no_sealed_spools", "no_empty_weight", "duplicate", "invalid_data", "not_loaded", "unauthorized"].includes(t) ? r(`error.${t}`) : r("error.generic", {
            message: e && e.message || t
          });
        }(e), !0), e;
      }
    }
    get _lookup() {
      return function (e) {
        const t = new Map((e.manufacturers || []).map(e => [e.id, e])),
          n = new Map((e.materials || []).map(e => [e.id, e])),
          a = new Map((e.spool_types || []).map(e => [l(e, "net_weight_g"), e]));
        return {
          manufacturers: t,
          materials: n,
          spoolTypes: a,
          manufacturerName: e => t.get(e)?.name || "?",
          materialName: e => n.get(e)?.name || "?",
          material: e => n.get(e) || null,
          spoolTypeFor: e => a.get(l(e, "spool_net_weight_g")) || null
        };
      }(this._data);
    }
    _context() {
      return {
        data: this._data,
        state: this._state,
        lookup: this._lookup,
        isAdmin: this._isAdmin,
        slots: this._aceSlots
      };
    }
    get _aceSlots() {
      const e = this._hass && this._hass.states || {},
        t = [];
      for (const [n, a] of Object.entries(e)) {
        const i = a.attributes || {},
          o = i.spool_info;
        if (!Array.isArray(o) || !o.length) continue;
        const r = (e[n.replace(/_spools$/, "_active_filament")] || {}).attributes,
          l = o.filter(e => e && e.printer_id && e.local_slot).map(e => {
            const t = `${e.printer_id}:${e.box_id}:${e.local_slot}`;
            return Boolean(e.assignment && e.assignment.stale) || this._confirmedSlots.delete(t), {
              ...e,
              is_active: Boolean(r && r.local_slot === e.local_slot && r.box_id === e.box_id),
              stale_confirmed: this._confirmedSlots.has(t)
            };
          });
        l.length && t.push({
          name: i.friendly_name || n,
          slots: l
        });
      }
      return t.sort((e, t) => e.name.localeCompare(t.name));
    }
    _renderApp() {
      const e = this.shadowRoot.getElementById("app"),
        t = this.shadowRoot.activeElement,
        n = t && t.dataset && t.dataset.filter || null,
        a = n && void 0 !== t.selectionStart ? t.selectionStart : null,
        i = this._context(),
        o = "admin" === this._state.view ? function (e) {
          const {
            data: t,
            isAdmin: n
          } = e;
          if (!n) return E({
            emoji: "🔒",
            title: r("admin.only_admin.title"),
            text: r("admin.only_admin.text")
          });
          const a = t.usage || {
            manufacturers: {},
            materials: {},
            spool_types: {}
          };
          return g`<div class="section-title">
      <span>${r("admin.title")} — ${r("admin.manufacturers")}</span>
      <span class="spacer"></span>
      <button class="btn" data-action="new-manufacturer">
        ${k("plus")} ${r("admin.new_manufacturer")}
      </button>
    </div>
    ${t.manufacturers.length ? g`<div class="list">
          ${t.manufacturers.map(e => j({
            entry: e,
            subtitle: q(e, t),
            usage: a.manufacturers[e.id] || 0,
            editAction: "edit-manufacturer",
            deleteAction: "delete-manufacturer"
          }))}
        </div>` : g`<div class="card">${r("admin.no_manufacturers")}</div>`}

    <div class="section-title">
      <span>${r("admin.materials")}</span>
      <span class="spacer"></span>
      <button class="btn" data-action="new-material">
        ${k("plus")} ${r("admin.new_material")}
      </button>
    </div>
    ${t.materials.length ? g`<div class="list">
          ${t.materials.map(e => j({
            entry: e,
            subtitle: W(e),
            usage: a.materials[e.id] || 0,
            editAction: "edit-material",
            deleteAction: "delete-material"
          }))}
        </div>` : g`<div class="card">${r("admin.no_materials")}</div>`}
`;
        }(i) : T(i),
        l = G.filter(e => "admin" !== e || this._isAdmin);
      if (e.innerHTML = String(g`
      <div class="app-header">
        <div class="toolbar">
          <button class="menu-button" data-action="toggle-menu" title="Menu">
            ${k("menu", 24)}
          </button>
          <div class="title">${r("app.title")}</div>
        </div>
        ${l.length > 1 ? g`<div class="tabs" role="tablist">
              ${l.map(e => g`<button
                  class="tab"
                  role="tab"
                  data-action="goto"
                  data-view="${e}"
                  aria-selected="${this._state.view === e ? "true" : "false"}"
                >
                  ${r(`tab.${e}`)}
                </button>`)}
            </div>` : ""}
      </div>
      <div class="content">${o}</div>
    `), n) {
        const t = e.querySelector(`[data-filter="${n}"]`);
        if (t && (t.focus(), null !== a && t.setSelectionRange)) try {
          t.setSelectionRange(a, a);
        } catch {}
      }
    }
    _renderOverlay(e = !1, t = !1) {
      const n = this.shadowRoot.getElementById("overlay"),
        a = this._dialog ? `${this._dialog.kind}:${this._dialog.id || "new"}:${this._dialog.error || ""}` : "";
      if (!e && a === this._overlayKey) return;
      if (this._overlayKey = a, !this._dialog) return void (n.innerHTML = "");
      const i = this._dialog.values || {};
      let o, l;
      if ("slot" === this._dialog.kind) o = function (e, t) {
        const {
          candidates: n,
          loading: a,
          assignment: i,
          needsTare: o,
          materialType: l
        } = t;
        if (a) return g`<div class="empty">${r("app.loading")}</div>`;
        const s = [...(n || []).map(e => ({
          value: `${e.item_id}:${e.spool_id || ""}`,
          label: null === e.spool_id ? r("ace.option_new", {
            label: e.label
          }) : `${e.label} — ${v(e.remaining_grams)} g`
        }))];
        i && s.push({
          value: C,
          label: r("ace.option_release")
        });
        const d = e.candidate === C,
          c = (n || []).find(t => `${t.item_id}:${t.spool_id || ""}` === e.candidate),
          p = c ? c.tare_g : i ? i.tare_g : null,
          m = null == p;
        return g`<div class="form-grid">
    <div class="span-2">
      ${S({
          name: "candidate",
          label: r("ace.field_spool"),
          value: e.candidate,
          placeholder: l ? r("ace.placeholder_material", {
            material: l
          }) : "—",
          options: s
        })}
      ${s.length ? "" : g`<div class="hint">${r("ace.no_candidates")}</div>`}
    </div>

    ${d ? "" : g`<div class="span-2">
          <div class="section-title" style="margin:8px 0 4px">
            ${r("ace.section_weigh")}
          </div>
          <div class="hint">${r("ace.weigh_hint")}</div>
        </div>
        ${L({
          name: "gross_weight_g",
          label: r("field.gross_weight"),
          type: "number",
          min: 0,
          step: 1,
          value: e.gross_weight_g,
          placeholder: m ? "—" : "",
          disabled: m && !e.empty_weight_g,
          title: r(m ? "field.gross_weight_disabled" : "field.gross_weight_hint")
        })}
        ${m || o ? L({
          name: "empty_weight_g",
          label: r("field.empty_weight_short"),
          type: "number",
          min: 0,
          step: .1,
          value: e.empty_weight_g,
          hint: r("ace.tare_hint")
        }) : g`<div class="num-field">
              <div class="hint" style="padding-top:18px">
                ${r("label.empty_weight")}: ${v(p)} g
              </div>
            </div>`}`}
  </div>`;
      }(i, this._dialog.slot), l = D({
        confirmLabel: r("action.save")
      });else if ("item" === this._dialog.kind) {
        const e = "edit" === this._dialog.mode ? this._findItem(this._dialog.id) : null;
        if ("edit" === this._dialog.mode && !e) return void this._closeDialog();
        this._dialog.signature = this._itemSignature(e), o = P(i, this._data, this._lookup, e, this._isAdmin), l = D({
          confirmLabel: r("action.save"),
          extra: e ? g`<button class="btn danger text" data-action="delete-item" data-item="${e.id}">
              ${r("action.delete")}
            </button>` : ""
        });
      } else "manufacturer" === this._dialog.kind ? (o = function (e, t, n) {
        const a = (t.spool_types || []).filter(t => t.manufacturer_id === e.id);
        return g`<div class="form-grid">
    <div class="span-2">
      ${L({
          name: "name",
          label: r("field.name"),
          value: e.name
        })}
    </div>
    <div class="span-2">
      ${L({
          name: "website",
          label: `${r("field.website")} (${r("field.optional")})`,
          value: e.website,
          placeholder: "https://"
        })}
    </div>
    ${L({
          name: "sort_order",
          label: r("field.sort_order"),
          type: "number",
          min: 0,
          step: 1,
          value: e.sort_order
        })}

    <div class="span-2">
      <div class="section-title" style="margin:8px 0 4px">${r("admin.spool_types")}</div>
      <div class="hint" style="margin-bottom:10px">${r("admin.spool_types_hint")}</div>
      ${a.length ? g`<div class="tare-list">
            ${a.map(a => {
          const i = (t.usage?.spool_types || {})[a.id] || 0;
          return g`<div class="tare-row">
                <div class="grow">
                  <div class="name">
                    ${n.materialName(a.material_id)} ·
                    ${v(a.net_weight_g)} g
                  </div>
                  <div class="hint">
                    ${i ? r(1 === i ? "admin.used_in_one" : "admin.used_in", {
            count: i
          }) : r("admin.unused")}
                  </div>
                </div>
                <div class="num-field">
                  ${L({
            name: `spool_type__${a.id}`,
            label: r("field.empty_weight_short"),
            type: "number",
            min: 0,
            step: .1,
            value: e[`spool_type__${a.id}`]
          })}
                </div>
              </div>`;
        })}
          </div>` : g`<div class="hint">${r("admin.no_spool_types_for_manufacturer")}</div>`}
    </div>
  </div>`;
      }(i, this._data, this._lookup), l = D({
        confirmLabel: r("action.save")
      })) : "material" === this._dialog.kind ? (o = function (e) {
        return g`<div class="form-grid">
    <div class="span-2">
      ${L({
          name: "name",
          label: r("field.name"),
          value: e.name
        })}
    </div>
    ${L({
          name: "nozzle_temp",
          label: r("field.nozzle_temp"),
          type: "number",
          min: 0,
          max: 600,
          step: 5,
          value: e.nozzle_temp
        })}
    ${L({
          name: "bed_temp",
          label: r("field.bed_temp"),
          type: "number",
          min: 0,
          max: 300,
          step: 5,
          value: e.bed_temp
        })}
    ${L({
          name: "density",
          label: r("field.density"),
          type: "number",
          min: .1,
          max: 10,
          step: .01,
          value: e.density
        })}
    ${L({
          name: "sort_order",
          label: r("field.sort_order"),
          type: "number",
          min: 0,
          step: 1,
          value: e.sort_order
        })}
    <div class="span-2">
      ${S({
          name: "ace_material_type",
          label: r("field.ace_material_type"),
          value: e.ace_material_type || "",
          placeholder: r("field.ace_material_type_auto"),
          options: Z.map(e => ({
            value: e,
            label: e
          })),
          hint: r("field.ace_material_type_hint")
        })}
    </div>
  </div>`;
      }(i), l = D({
        confirmLabel: r("action.save")
      })) : (o = g`<p>${this._dialog.text}</p>`, l = D({
        confirmLabel: this._dialog.confirmLabel || r("action.delete"),
        danger: !0
      }));
      if (n.innerHTML = String(function ({
        title: e,
        body: t,
        actions: n,
        error: a
      }) {
        return g`<div class="overlay" data-action="dialog-backdrop">
    <div class="dialog" role="dialog" aria-modal="true" data-stop>
      <h2>${e}</h2>
      <div class="body">
        ${t} ${a ? g`<div class="error-text">${a}</div>` : ""}
      </div>
      <div class="actions">${n}</div>
    </div>
  </div>`;
      }({
        title: this._dialog.title,
        body: o,
        actions: l,
        error: this._dialog.error
      })), !t) return;
      const s = n.querySelector("[data-field]");
      s && s.focus();
    }
    _itemSignature(e) {
      return e ? `${e.sealed_count}|${(e.open_spools || []).map(e => e.id).join(",")}` : "";
    }
    _refreshOpenDialog() {
      const e = this._dialog;
      if (!e || "item" !== e.kind || "edit" !== e.mode) return;
      const t = this._findItem(e.id);
      if (!t) return void this._closeDialog();
      const n = this.shadowRoot.activeElement,
        a = Boolean(n && n.closest && n.closest(".overlay"));
      this._itemSignature(t) === e.signature && a || this._renderOverlay(!0);
    }
    _toast(e, t = !1) {
      const n = this.shadowRoot.getElementById("toast");
      n.innerHTML = String(g`<div class="toast ${t ? "error" : ""}">${e}</div>`), this._toastTimer && clearTimeout(this._toastTimer), this._toastTimer = setTimeout(() => {
        n.innerHTML = "";
      }, t ? 6e3 : 2500);
    }
    _navigate(e) {
      G.includes(e) && (this._state.view = e, this.dispatchEvent(new CustomEvent("ac-filament-navigate", {
        detail: {
          view: e
        },
        bubbles: !0,
        composed: !0
      })), this._renderApp());
    }
    _openDialog(e) {
      this._dialog = {
        error: "",
        ...e
      }, this._renderOverlay(!0, !0);
    }
    _closeDialog() {
      this._dialog = this._dialog && this._dialog.previous || null, this._renderOverlay(!0);
    }
    _setDialogError(e) {
      this._dialog && (this._dialog.error = e, this._renderOverlay(!0));
    }
    _confirm({
      previous: e,
      title: t,
      text: n,
      confirmLabel: a,
      onConfirm: i
    }) {
      this._openDialog({
        kind: "confirm",
        previous: e,
        title: t,
        text: n,
        confirmLabel: a,
        onConfirm: i
      });
    }
    _blockedMessage(e, t) {
      return r(1 === t ? "admin.delete_blocked_one" : "admin.delete_blocked", {
        name: e,
        count: t
      });
    }
    _findItem(e) {
      return (this._data.items || []).find(t => t.id === e) || null;
    }
    _onKeyDown(e) {
      return "Escape" === e.key && this._dialog ? (e.preventDefault(), void this._closeDialog()) : "Enter" === e.key && e.target.closest && e.target.closest(".spool-edit") ? (e.preventDefault(), void e.target.blur()) : void ("Enter" === e.key && this._dialog && "confirm" !== this._dialog.kind && "INPUT" === e.target.tagName && (e.preventDefault(), this._commitDialog()));
    }
    _applyFilter(e) {
      return !!e.dataset.filter && (this._state.filters[e.dataset.filter] = e.value, this._renderApp(), !0);
    }
    _captureDialogField(e) {
      return !!(this._dialog && e.dataset.field && e.closest(".overlay")) && !e.closest(".spool-edit") && (this._dialog.values[e.dataset.field] = e.value, !0);
    }
    _onInput(e) {
      const t = e.target;
      t && t.dataset && (this._applyFilter(t) || this._captureDialogField(t));
    }
    _onChange(e) {
      const t = e.target;
      if (!t || !t.dataset) return;
      if (this._applyFilter(t)) return;
      if (this._captureDialogField(t)) return void ("slot" === this._dialog.kind && "candidate" === t.dataset.field && this._renderOverlay(!0));
      const n = t.closest(".spool-edit");
      n && t.dataset.field && this._call({
        type: `${K}/spool/update`,
        item_id: n.dataset.item,
        spool_id: n.dataset.spool,
        [t.dataset.field]: "" === t.value ? null : t.value
      }).catch(() => {});
    }
    _onClick(e) {
      const t = e.composedPath().find(e => e.dataset && e.dataset.action);
      if (!t) return;
      const {
        action: n
      } = t.dataset;
      if ("dialog-backdrop" === n && e.target !== t) return;
      const a = this._actions()[n];
      a && (e.preventDefault(), e.stopPropagation(), a(t.dataset, t));
    }
    _actions() {
      const e = e => this._call(e).catch(() => {});
      return {
        "toggle-menu": () => this.dispatchEvent(new CustomEvent("hass-toggle-menu", {
          bubbles: !0,
          composed: !0
        })),
        goto: e => this._navigate(e.view),
        "reset-filters": () => {
          this._state.filters = {
            q: "",
            manufacturer: "",
            material: "",
            condition: "",
            sort: "manufacturer"
          }, this._renderApp();
        },
        "new-item": () => {
          return this._openDialog({
            kind: "item",
            mode: "new",
            title: r("dialog.item.new"),
            values: (e = this._data, {
              manufacturer_id: e.manufacturers[0]?.id || "",
              material_id: e.materials[0]?.id || "",
              color_name: "",
              color_hex: "#9e9e9e",
              diameter: 1.75,
              spool_net_weight_g: 1e3,
              sealed_count: 1,
              location: "",
              price: "",
              purchase_date: "",
              nozzle_temp: "",
              bed_temp: "",
              notes: ""
            })
          });
          var e;
        },
        "setup-item": e => {
          const t = this._findItem(e.item);
          if (!t) return;
          const n = this._lookup.spoolTypeFor(t);
          this._openDialog({
            kind: "item",
            mode: "edit",
            id: t.id,
            title: r("dialog.item.edit"),
            values: {
              manufacturer_id: t.manufacturer_id,
              material_id: t.material_id,
              color_name: t.color_name,
              color_hex: t.color_hex,
              diameter: t.diameter,
              spool_net_weight_g: t.spool_net_weight_g,
              location: t.location,
              price: t.price ?? "",
              purchase_date: t.purchase_date ?? "",
              nozzle_temp: t.nozzle_temp ?? "",
              bed_temp: t.bed_temp ?? "",
              notes: t.notes,
              ...(n ? {
                [`spool_type__${n.id}`]: n.empty_weight_g ?? ""
              } : {})
            }
          });
        },
        "delete-item": e => {
          const t = this._findItem(e.item);
          t && this._confirm({
            title: r("setup.delete_title"),
            text: r("setup.delete_text", {
              name: d(t, this._lookup)
            }),
            onConfirm: async () => {
              await this._call({
                type: `${K}/item/delete`,
                item_id: t.id
              }), this._toast(r("toast.deleted"));
            }
          });
        },
        "sealed-plus": t => {
          const n = this._findItem(t.item);
          n && e({
            type: `${K}/item/set_sealed`,
            item_id: n.id,
            sealed_count: Number(n.sealed_count || 0) + 1
          });
        },
        "sealed-minus": t => {
          const n = this._findItem(t.item);
          !n || Number(n.sealed_count || 0) < 1 || e({
            type: `${K}/item/set_sealed`,
            item_id: n.id,
            sealed_count: Number(n.sealed_count) - 1
          });
        },
        "open-spool": t => {
          e({
            type: `${K}/spool/open`,
            item_id: t.item
          });
        },
        "consume-spool": e => {
          const t = this._findItem(e.item);
          t && this._confirm({
            previous: this._dialog,
            title: r("setup.consume_title"),
            text: r("setup.consume_text", {
              name: d(t, this._lookup)
            }),
            confirmLabel: r("setup.consume"),
            onConfirm: async () => {
              await this._call({
                type: `${K}/spool/consume`,
                item_id: e.item,
                spool_id: e.spool
              }), this._toast(r("toast.deleted"));
            }
          });
        },
        "assign-slot": e => this._openSlotDialog(e),
        "confirm-slot": async e => {
          try {
            await this._call({
              type: `${K}/slot/confirm`,
              printer_id: String(e.printer),
              box_id: Number(e.box),
              local_slot: Number(e.slot)
            });
          } catch {
            return;
          }
          this._confirmedSlots.add(`${e.printer}:${e.box}:${e.slot}`), this._renderApp(), this._toast(r("ace.confirm_toast"));
        },
        "clear-slot": e => {
          this._confirm({
            title: r("ace.clear_title"),
            text: r("ace.clear_text", {
              name: e.label || r("ace.clear_fallback"),
              slot: e.slot
            }),
            confirmLabel: r("ace.clear_confirm"),
            onConfirm: async () => {
              await this._call({
                type: `${K}/slot/clear`,
                printer_id: String(e.printer),
                box_id: Number(e.box),
                local_slot: Number(e.slot)
              }), this._toast(r("ace.clear_toast"));
            }
          });
        },
        "copy-id": async e => {
          try {
            await navigator.clipboard.writeText(e.id), this._toast(r("toast.id_copied"));
          } catch {
            this._toast(e.id);
          }
        },
        "new-manufacturer": () => {
          return this._openDialog({
            kind: "manufacturer",
            mode: "new",
            title: r("dialog.manufacturer.new"),
            values: (e = this._data, {
              name: "",
              website: "",
              sort_order: e.manufacturers.length
            })
          });
          var e;
        },
        "edit-manufacturer": e => {
          const t = this._data.manufacturers.find(t => t.id === e.id);
          t && this._openDialog({
            kind: "manufacturer",
            mode: "edit",
            id: t.id,
            title: r("dialog.manufacturer.edit"),
            values: {
              id: t.id,
              name: t.name,
              website: t.website,
              sort_order: t.sort_order,
              ...Object.fromEntries((this._data.spool_types || []).filter(e => e.manufacturer_id === t.id).map(e => [`spool_type__${e.id}`, e.empty_weight_g ?? ""]))
            }
          });
        },
        "delete-manufacturer": e => {
          const t = this._data.manufacturers.find(t => t.id === e.id);
          if (!t) return;
          const n = (this._data.usage.manufacturers || {})[t.id] || 0;
          n > 0 ? this._toast(this._blockedMessage(t.name, n), !0) : this._confirm({
            title: r("admin.delete_manufacturer_title"),
            text: r("admin.delete_text", {
              name: t.name
            }),
            onConfirm: async () => {
              await this._call({
                type: `${K}/manufacturer/delete`,
                manufacturer_id: t.id
              }), this._toast(r("toast.deleted"));
            }
          });
        },
        "new-material": () => {
          return this._openDialog({
            kind: "material",
            mode: "new",
            title: r("dialog.material.new"),
            values: (e = this._data, {
              name: "",
              nozzle_temp: "",
              bed_temp: "",
              density: "",
              sort_order: e.materials.length,
              ace_material_type: ""
            })
          });
          var e;
        },
        "edit-material": e => {
          const t = this._data.materials.find(t => t.id === e.id);
          t && this._openDialog({
            kind: "material",
            mode: "edit",
            id: t.id,
            title: r("dialog.material.edit"),
            values: {
              name: t.name,
              nozzle_temp: t.nozzle_temp ?? "",
              bed_temp: t.bed_temp ?? "",
              density: t.density ?? "",
              sort_order: t.sort_order,
              ace_material_type: t.ace_material_type ?? ""
            }
          });
        },
        "delete-material": e => {
          const t = this._data.materials.find(t => t.id === e.id);
          if (!t) return;
          const n = (this._data.usage.materials || {})[t.id] || 0;
          n > 0 ? this._toast(this._blockedMessage(t.name, n), !0) : this._confirm({
            title: r("admin.delete_material_title"),
            text: r("admin.delete_text", {
              name: t.name
            }),
            onConfirm: async () => {
              await this._call({
                type: `${K}/material/delete`,
                material_id: t.id
              }), this._toast(r("toast.deleted"));
            }
          });
        },
        "dialog-backdrop": () => this._closeDialog(),
        "dialog-cancel": () => this._closeDialog(),
        "dialog-confirm": () => this._commitDialog()
      };
    }
    async _openSlotDialog(e) {
      const t = {
        printer_id: String(e.printer),
        box_id: Number(e.box),
        local_slot: Number(e.slot)
      };
      let n;
      this._openDialog({
        kind: "slot",
        id: `${t.printer_id}:${t.box_id}:${t.local_slot}`,
        title: r("ace.dialog_title", {
          slot: t.local_slot
        }),
        values: M(null),
        slot: {
          ...t,
          loading: !0,
          candidates: []
        }
      });
      try {
        n = await this._call({
          type: `${K}/slot/candidates`,
          ...t
        });
      } catch {
        return void this._closeDialog();
      }
      this._dialog && "slot" === this._dialog.kind && (this._dialog.slot = {
        ...t,
        loading: !1,
        candidates: n.candidates || [],
        assignment: n.assignment || null,
        needsTare: Boolean(n.needs_tare),
        materialType: n.material_type || null
      }, this._dialog.values = M(n.assignment || null), this._renderOverlay(!0));
    }
    async _commitSlot() {
      const {
          values: e,
          slot: t
        } = this._dialog,
        n = {
          printer_id: t.printer_id,
          box_id: t.box_id,
          local_slot: t.local_slot
        };
      if (e.candidate) {
        try {
          if (e.candidate === C) await this._call({
            type: `${K}/slot/clear`,
            ...n
          });else {
            const [t, a] = String(e.candidate).split(":");
            await this._call({
              type: `${K}/slot/assign`,
              ...n,
              item_id: t,
              spool_id: a || null
            });
            const i = parseFloat(e.gross_weight_g);
            if (!isNaN(i)) {
              const t = parseFloat(e.empty_weight_g);
              await this._call({
                type: `${K}/slot/weigh`,
                ...n,
                gross_weight_g: i,
                empty_weight_g: isNaN(t) ? null : t
              });
            }
          }
        } catch {
          return;
        }
        this._closeDialog(), this._toast(r("toast.saved"));
      } else this._setDialogError(r("ace.error_pick"));
    }
    async _commitDialog() {
      if (!this._dialog) return;
      const {
        kind: e,
        mode: t,
        id: n,
        values: a
      } = this._dialog;
      if ("confirm" === e) {
        const {
          onConfirm: e
        } = this._dialog;
        return this._closeDialog(), void (e && (await e().catch(() => {})));
      }
      if ("slot" === e) return void (await this._commitSlot());
      if ("item" === e) {
        if (!a.manufacturer_id || !a.material_id) return void this._setDialogError(r("error.item_required"));
      } else if (!String(a.name || "").trim()) return void this._setDialogError(r("error.name_required"));
      const i = {
          item: "item",
          manufacturer: "manufacturer",
          material: "material"
        }[e],
        o = {
          type: `${K}/${i}/${"edit" === t ? "update" : "create"}`,
          ...this._cleanValues(a)
        };
      "edit" === t && (o[`${i}_id`] = n);
      try {
        await this._call(o), await this._saveSpoolTypeWeights(a);
      } catch {
        return;
      }
      this._closeDialog(), this._toast(r("toast.saved"));
    }
    async _saveSpoolTypeWeights(e) {
      const t = new Map((this._data.spool_types || []).map(e => [e.id, e.empty_weight_g]));
      for (const [n, a] of Object.entries(e)) {
        if (!n.startsWith("spool_type__")) continue;
        const e = n.slice(12),
          i = "" === a || null === a ? null : Number(a);
        t.has(e) && t.get(e) !== i && (await this._call({
          type: `${K}/spool_type/update`,
          spool_type_id: e,
          empty_weight_g: i
        }));
      }
    }
    _cleanValues(e) {
      const t = {};
      for (const [n, a] of Object.entries(e)) n.startsWith("spool_type__") || "id" === n || (t[n] = "" === a ? null : a);
      return t;
    }
  }
  customElements.get("anycubic-filament-panel") || customElements.define("anycubic-filament-panel", X);
  const Y = "anycubic-filament-manager-panel",
    J = ["overview", "admin"];
  class Q extends HTMLElement {
    constructor() {
      super(), this._route = null, this._handleNavigate = e => {
        e.stopPropagation();
        const t = e.detail.view;
        t && J.includes(t) && this._route && (window.history.pushState(null, "", `${this._route.prefix}/${t}`), window.dispatchEvent(new CustomEvent("location-changed", {
          detail: {
            replace: !1
          }
        })));
      };
      const e = this.attachShadow({
        mode: "open"
      });
      this._inventory = document.createElement("anycubic-filament-panel");
      const t = document.createElement("style");
      t.textContent = "\n      :host {\n        display: block;\n        height: 100%;\n      }\n    ", e.append(t, this._inventory);
    }
    set hass(e) {
      this._inventory.hass = e;
    }
    set narrow(e) {
      this._inventory.narrow = Boolean(e);
    }
    set panel(e) {
      this._inventory.panel = e;
    }
    set route(e) {
      this._route = e, this._inventory.route = e;
    }
    connectedCallback() {
      this.addEventListener("ac-filament-navigate", this._handleNavigate);
    }
    disconnectedCallback() {
      this.removeEventListener("ac-filament-navigate", this._handleNavigate);
    }
  }
  customElements.get(Y) || customElements.define(Y, Q);
}();
