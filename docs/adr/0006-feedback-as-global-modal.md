# Feedback as a global modal, not a route

Support and Feedback were placeholder routes but neither needed a dedicated page — the forms are simple and users shouldn't have to navigate away from what they're doing to file a report or share an idea. We replaced both routes with a single "Feedback" modal triggered via Zustand global state, openable from anywhere in the app. The nav items in Sidebar and BottomNav became buttons rather than links.

## Considered Options

- **Dedicated `/feedback` route** — the default pattern for every other nav item in this app. Rejected because a full-page route adds navigation overhead for a one-off interaction, and there's no content on the page that benefits from having its own URL (no deep-linking need, no SEO value for an authenticated feature).
- **URL param (`?feedback=open`)** — consistent with how the Trip Chat sheet is opened. Rejected because feedback doesn't need to be linkable or shareable, and the param would need to be handled on every route.
