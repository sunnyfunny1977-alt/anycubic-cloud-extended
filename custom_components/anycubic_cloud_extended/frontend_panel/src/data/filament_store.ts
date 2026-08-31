import { platform } from "../const";
import {
  AnycubicSlotAssignment,
  AnycubicSlotCandidatesResult,
  HomeAssistant,
} from "../types";

/**
 * Client for the filament inventory websocket API.
 *
 * Deliberately a module-level singleton rather than a property passed down the
 * component tree: the spool dialog is rendered by `card.ts`, which runs both
 * inside the panel and inside the Lovelace card. There is no common root to
 * subscribe from, and several cards on one dashboard must not each open their
 * own subscription.
 *
 * The slot views themselves do not use this at all — they read what they show
 * from the `assignment` attribute of the slot sensor, which Home Assistant
 * pushes anyway. Only the dialog subscribes, and only while it is open, so an
 * idle dashboard costs nothing.
 */

const WS = `${platform}/filament`;

export interface SlotRef {
  printer_id: string;
  box_id: number;
  local_slot: number;
}

export interface FilamentSnapshot {
  manufacturers: object[];
  materials: object[];
  spool_types: object[];
  items: object[];
  assignments: object[];
  summary: Record<string, unknown>;
}

type SnapshotListener = (snapshot: FilamentSnapshot) => void;

let _snapshot: FilamentSnapshot | null = null;
let _unsubscribe: (() => void) | null = null;
let _pending: Promise<void> | null = null;
const _listeners = new Set<SnapshotListener>();

/** The most recent snapshot, or null when nothing has been received yet. */
export function getFilamentSnapshot(): FilamentSnapshot | null {
  return _snapshot;
}

/**
 * Subscribe to inventory changes. Returns an unsubscribe function; the shared
 * connection is closed again once the last listener has gone.
 */
export function subscribeFilament(
  hass: HomeAssistant,
  listener: SnapshotListener,
): () => void {
  _listeners.add(listener);
  if (_snapshot) {
    listener(_snapshot);
  }

  if (!_unsubscribe && !_pending) {
    _pending = hass.connection
      .subscribeMessage(
        (message: { snapshot?: FilamentSnapshot }) => {
          if (message.snapshot) {
            _snapshot = message.snapshot;
            _listeners.forEach((cb) => {
              cb(message.snapshot as FilamentSnapshot);
            });
          }
        },
        { type: `${WS}/subscribe` },
      )
      .then((unsub: () => void) => {
        _unsubscribe = unsub;
        _pending = null;
      })
      .catch((err: unknown) => {
        _pending = null;
        window.console.error("Anycubic: filament subscription failed", err);
      });
  }

  return (): void => {
    _listeners.delete(listener);
    if (_listeners.size === 0 && _unsubscribe) {
      _unsubscribe();
      _unsubscribe = null;
    }
  };
}

/** Rolls that fit what a slot currently holds, best match first. */
export async function slotCandidates(
  hass: HomeAssistant,
  slot: SlotRef,
  materialType: string | undefined,
  includeNonMatching = false,
): Promise<AnycubicSlotCandidatesResult> {
  return hass.callWS<AnycubicSlotCandidatesResult>({
    type: `${WS}/slot/candidates`,
    ...slot,
    material_type: materialType ?? null,
    include_non_matching: includeNonMatching,
  });
}

/** Bind a roll to a slot. A null `spool_id` opens a sealed spool first. */
export async function assignSlot(
  hass: HomeAssistant,
  slot: SlotRef,
  itemId: string,
  spoolId: string | null,
  fingerprintFields: {
    fp_material_type?: string;
    fp_color_hex?: string;
    fp_sku?: string;
    fingerprint?: string;
  } = {},
): Promise<AnycubicSlotAssignment> {
  return hass.callWS<AnycubicSlotAssignment>({
    type: `${WS}/slot/assign`,
    ...slot,
    item_id: itemId,
    spool_id: spoolId,
    ...fingerprintFields,
  });
}

/** Remove the binding of a slot. */
export async function clearSlot(
  hass: HomeAssistant,
  slot: SlotRef,
): Promise<void> {
  await hass.callWS<unknown>({ type: `${WS}/slot/clear`, ...slot });
}

/**
 * Book a scale reading. Pass `emptyWeight` when the spool type has no tare
 * yet — the backend rejects the reading with `no_empty_weight` otherwise.
 */
export async function weighSlot(
  hass: HomeAssistant,
  slot: SlotRef,
  grossWeight: number,
  emptyWeight?: number | null,
): Promise<AnycubicSlotAssignment> {
  return hass.callWS<AnycubicSlotAssignment>({
    type: `${WS}/slot/weigh`,
    ...slot,
    gross_weight_g: grossWeight,
    empty_weight_g: emptyWeight ?? null,
  });
}
