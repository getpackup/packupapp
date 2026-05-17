# Unified member search combobox

Replacing the two-panel UI (static friends list + separate Algolia search input) with a single `UserSearchCombobox` component used in both the Add Trip Member flow and the Members step of trip creation.

## Context

Two places let a user invite Trip Members: `AddTripMember` (on an existing trip) and `MembersStep` (during trip creation). Both had the same split-panel layout: a scrollable list of all Friends rendered above a separate Algolia search input. On focus the search was blank; Friends were always visible as a flat list above it. As a user's Friends list grows, the list could become very long before the search input even appeared.

## Decision

One input field, one dropdown. On focus, the dropdown opens and shows the user's Friends immediately. Typing filters Friends locally (client-side, instant) and also fires Algolia after 2 characters. The dropdown has two labeled sections — **Friends** at the top, **All Users** below — with Algolia results deduped against the Friends section. Already-added Trip Members appear in the dropdown with a status badge instead of an add button. The current user is excluded from the dropdown entirely. Non-friend results in All Users retain the inline "Also send a Friend Request" checkbox.

The logic lives in a shared `UserSearchCombobox` component so neither surface duplicates debouncing, Algolia lazy-loading, or deduplication.

`AddTripMember` moves from a Popover to a Dialog (desktop) / Sheet (mobile) for the extra real estate needed to show the combined list. The component's content is composable so it can be dropped into either wrapper without modification.

`MembersStep` adds members to local state only; Trip Invitations are sent on final trip creation submit, not at selection time.

## Alternatives considered

**Keep the split-panel layout, just cap the friends list height.** This preserves the existing mental model but doesn't eliminate the two-input problem — users still have to decide which input to use, and the two surfaces can feel disconnected.

**Algolia-only on first keystroke, no separate Friends section.** Simpler to build, but Friends lose prioritization the moment the user starts typing. The two-section approach keeps Friends surfaced and scannable even mid-search.

**Per-surface implementations.** Both components share identical Algolia lazy-loading, debounce, hydration guard, and deduplication logic. Keeping them separate would require maintaining that logic in two places.
