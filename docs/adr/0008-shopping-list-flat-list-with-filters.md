# ADR-0008: Shopping List — Flat List with Filters

**Status**: Accepted  
**Date**: 2026-06-06

## Context

The Shopping List was grouped by Trip using an accordion (`ShoppingListCategory`), showing "X of Y purchased" progress and a "Needed by [date]" header per trip. The primary use case is **in-store shopping** — a user at REI wants to see only their REI items across all trips, not navigate between trip accordions.

## Decision

Replace trip-grouped accordions with a **flat list** of items. Each item carries:

- A **trip pill** (colored dot hashed from `tripId` + truncated trip name) and a **date pill** (trip start date), rendered using the TagPills overlap-and-expand-on-hover pattern. Past-trip pills are visually muted.
- A **priority indicator** and **store** where set.

The top of the list exposes:

| Control | Options | Default |
|---|---|---|
| Purchase state toggle | Unpurchased / Purchased / All | Unpurchased |
| Sort toggle | Trip (asc by start date) / Priority / Store | Trip |
| Store filter chips | Derived from actual item values, case-insensitive deduped, + "No store" | None active |

Store chips use the same horizontally scrollable `ScrollArea` chip pattern as packing list tag filters. Filter and sort are **composable** — filter narrows the list, sort orders the result.

Past-trip items are naturally hidden when the default Unpurchased filter is active (if all their items are purchased). Switching to All reveals them with muted trip pills.

## Alternatives Considered

**Keep trip-grouped accordions, filter within groups** — empty trip groups appear when a store filter is active, creating visual noise. Trip context matters less than item findability while shopping.

**Two-mode toggle (in-store vs planning)** — doubles the surface area to design and maintain. A well-ordered flat list with sort-by-Trip serves planning needs adequately. The "X of Y purchased" progress that trip grouping provided is redundant with individual item checkmarks and packing list progress.

**"Show past" toggle** — made redundant by the Unpurchased default: past trips with all items purchased disappear naturally; past trips with unpurchased items surface as an intentional nudge to act.

## Consequences

- `ShoppingListCategory` accordion component is no longer used on the Shopping List page.
- Trip color dots are derived by hashing `tripId` through the existing `getTagColorKey` utility — consistent per trip, no user configuration needed.
- Store filter chips require aggregating unique `store` values client-side from the current item list.
- "X of Y purchased" progress per trip is removed; this information is available on the packing list.
