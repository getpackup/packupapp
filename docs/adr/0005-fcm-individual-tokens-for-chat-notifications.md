# ADR 0005: Individual FCM tokens over topic subscription for Chat Message Notifications

## Status

Accepted

## Context

Chat Message Notifications need to be delivered to all Trip Members except the sender. Firebase Cloud Messaging (FCM) supports two delivery models:

1. **Topic subscription** — devices subscribe to a named topic (e.g. `trip-{tripId}-chat`); a single publish reaches all subscribers.
2. **Individual tokens** — each device registers a token; the sender explicitly chooses which tokens to send to.

The iOS App Store app (WKWebView wrapper) already has scaffolding for topic subscription via a native bridge. Topics are simpler to implement and require no token storage.

## Decision

Use individual FCM tokens stored as an array on the User document in Firestore.

## Reasoning

Topic messaging cannot exclude individual subscribers. If a user sends a message from their laptop, FCM would deliver a notification to their phone (also subscribed to the topic) because all subscribers receive the message. There is no server-side way to suppress it — the OS notification banner is shown before any client-side code can run.

Individual tokens allow the Cloud Function to read all tokens belonging to the sender and exclude them from the send, preventing self-notification across all of the sender's devices.

## Consequences

- FCM tokens must be stored on the User document and refreshed on each app load.
- Multiple tokens per user must be supported (phone, tablet, browser).
- Stale tokens (FCM returns `messaging/registration-token-not-registered`) must be pruned from the User document by the Cloud Function.
- The iOS App Store native push (Phase 2) requires a new `push-token` bridge method in the WKWebView wrapper to expose the native FCM token to the web layer, which then saves it to Firestore.
