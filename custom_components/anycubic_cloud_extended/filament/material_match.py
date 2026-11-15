"""Match the material type an ACE slot reports against the inventory.

The ACE reports a short type string ("PLA", "PETG", "PLA_SE", ...). The
inventory holds free-text material names the user maintains ("PLA", "PLA+",
"Silk PLA", "PA / Nylon", ...). Filtering the spool list for a slot means
deciding which of those names describe the same plastic.

Two mechanisms, in that order of precedence:

1. A material may carry an explicit ``ace_material_type``. That always wins —
   it is the escape hatch for names the automatic rules get wrong.
2. Otherwise both sides are reduced to a canonical token: upper-cased,
   stripped of everything but letters, digits and ``+``, then looked up and
   finally stripped of decorative modifiers ("Silk", "Wood", "Matte", ...).

Matching returns a rank rather than a boolean so the candidate list can be
sorted with the most confident matches first.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

# Canonical token per known spelling. Keys are already normalised
# (upper case, only A-Z0-9+).
CANONICAL: dict[str, str] = {
    "PLA": "PLA",
    "PLA+": "PLA",
    "PLAPLUS": "PLA",
    "PLASE": "PLA",
    "PLAHS": "PLA",
    "PLAMATTE": "PLA",
    "SILKPLA": "PLA",
    "WOODPLA": "PLA",
    "MATTEPLA": "PLA",
    "PETG": "PETG",
    "PETGCF": "PETG",
    "ABS": "ABS",
    "ASA": "ASA",
    "HIPS": "HIPS",
    "TPU": "TPU",
    "TPE": "TPU",
    "PC": "PC",
    "PA": "PA",
    "NYLON": "PA",
    "PANYLON": "PA",
    "NYLONPA": "PA",
    "PACF": "PACF",
    "PACARBON": "PACF",
    "PAGF": "PACF",
}

# Decorative words that describe a finish or a speed grade rather than the
# plastic itself. Stripped from either end until a canonical token is left.
MODIFIERS: frozenset[str] = frozenset(
    {
        "SILK",
        "WOOD",
        "MATTE",
        "MATT",
        "GLOSS",
        "HIGHSPEED",
        "HS",
        "RAPID",
        "SE",
        "PRO",
        "BASIC",
        "META",
        "PLUS",
        "TOUGH",
        "ECO",
    }
)

# A canonical token that is a specialised variant of a broader family. Used
# for the weakest match rank, so PA-CF in the printer still offers the plain
# "PA / Nylon" rolls from the cupboard.
FAMILY: dict[str, str] = {
    "PACF": "PA",
}

MATCH_EXPLICIT = 3
MATCH_CANONICAL = 2
MATCH_FAMILY = 1
MATCH_NONE = 0

_STRIP_RE = re.compile(r"[^A-Z0-9+]")


def normalize_material_token(raw: Any) -> str:
    """Reduce a material name or ACE type to a canonical token.

    "PA / Nylon" and "Nylon" both become "PA"; "Silk PLA" and "PLA+" both
    become "PLA". An unknown name is returned in its stripped form so two
    identical custom names still match each other.
    """
    text = _STRIP_RE.sub("", str(raw or "").upper())
    if not text:
        return ""

    if text in CANONICAL:
        return CANONICAL[text]

    # Peel decorative words off either end until something known appears.
    changed = True
    while changed and text:
        changed = False
        for modifier in MODIFIERS:
            if len(text) > len(modifier) and text.startswith(modifier):
                text = text[len(modifier) :]
                changed = True
            elif len(text) > len(modifier) and text.endswith(modifier):
                text = text[: -len(modifier)]
                changed = True
            if changed:
                break
        if text in CANONICAL:
            return CANONICAL[text]

    return CANONICAL.get(text, text)


def material_matches(ace_type: Any, material: Mapping[str, Any]) -> int:
    """Return how well an inventory material fits what the ACE reported.

    MATCH_EXPLICIT  the material names this ACE type outright
    MATCH_CANONICAL both reduce to the same plastic
    MATCH_FAMILY    the ACE type is a variant of the material's family
    MATCH_NONE      no relation
    """
    ace_token = normalize_material_token(ace_type)
    if not ace_token:
        # The slot did not report a type (empty slot). Everything is a
        # candidate; nothing is a confident one.
        return MATCH_FAMILY

    explicit = str(material.get("ace_material_type") or "").strip().upper()
    if explicit and normalize_material_token(explicit) == ace_token:
        return MATCH_EXPLICIT
    if explicit and explicit == str(ace_type or "").strip().upper():
        return MATCH_EXPLICIT

    material_token = normalize_material_token(material.get("name"))
    if not material_token:
        return MATCH_NONE
    if material_token == ace_token:
        return MATCH_CANONICAL

    if FAMILY.get(ace_token) == material_token:
        return MATCH_FAMILY
    if FAMILY.get(material_token) == ace_token:
        return MATCH_FAMILY

    return MATCH_NONE


def matching_material_ids(
    ace_type: Any, materials: list[dict[str, Any]]
) -> dict[str, int]:
    """Return ``{material_id: rank}`` for every material that fits."""
    ranked: dict[str, int] = {}
    for material in materials:
        rank = material_matches(ace_type, material)
        if rank > MATCH_NONE:
            ranked[material["id"]] = rank
    return ranked
