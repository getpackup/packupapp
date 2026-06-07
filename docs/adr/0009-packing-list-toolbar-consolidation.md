# Packing list toolbar consolidated into single row with progressive disclosure

The packing list page was redesigned around the insight that users spend the majority of their time in packing mode (checking off items), not building mode (adding/editing gear). The previous layout treated all controls as equally prominent: a full-width progress bar + two add buttons, then search + packed/unpacked toggle, then tag filter pills — three rows of chrome before the list.

We replaced this with a thin ambient progress strip (no label, purely visual) at the top edge of the content area, plus a single toolbar row: `X% packed · [Filters ▾] [All|Packed|Unpacked] [+ Add Gear ▾]`. Search and tag filter pills are hidden by default and expand inline below the toolbar when Filters is opened. The two add buttons ("Add from Gear Closet" and "Add item") are collapsed into a single `+ Add Gear` dropdown.

The popover alternative for Filters was rejected because tag pills are a horizontal scroll row that feels more natural as page flow than inside a floating panel, and because the active filter state (highlighted pills, populated search) is immediately visible without re-opening anything when using inline expand.

## Consequences

- `TripPackingList` renders the progress bar as a `<Progress>` strip with no accompanying label element above the toolbar.
- `X% packed` text moves inline into the toolbar row as leading ambient text.
- The Filters button shows a count badge when `selectedTags.length > 0` or `packingListSearchValue !== ''`.
- The two `AddFromGearClosetDialog` and `AddPackingListDialog` triggers are replaced by a single dropdown menu with both options as items.
- Clear filter button moves inside the expanded Filters panel rather than sitting in the main toolbar row.
