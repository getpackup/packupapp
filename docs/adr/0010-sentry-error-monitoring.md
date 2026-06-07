# ADR 0010: Sentry Error Monitoring Integration

## Status
Accepted

## Context

Packup needed production error monitoring and request tracing. The app runs React Router v7 in SSR mode deployed to Netlify, uses Firebase for auth/Firestore, has a GDPR consent cookie mechanism, and supports both Anonymous Users and registered users.

## Decisions

### 1. Capture both client and server errors

Loaders and actions run server-side on Netlify Functions. A client-only Sentry setup would miss all server-side failures (thrown loaders, action errors, Firebase Admin errors). `@sentry/react-router` instruments both sides from a single package.

### 2. Initialize before GDPR consent, with `sendDefaultPii: false`

Sentry is initialized regardless of whether the user has accepted the cookie banner. Error monitoring is operationally necessary (legitimate interest) rather than advertising or profiling — this is the standard legal basis for error monitoring tools under GDPR. To mitigate PII exposure, `sendDefaultPii: false` suppresses automatic IP address and user-agent collection. Segment analytics (which does profile users) remains gated behind consent.

### 3. User context: UID only

Sentry events are tagged with the Firebase UID for both Anonymous Users and registered users. No email, display name, or other PII is attached. This allows per-user error correlation and affected-user counts without any PII risk, consistent with the `sendDefaultPii: false` stance.

### 4. Production environment only

Sentry is not initialized in development (`import.meta.env.DEV`) or Netlify preview deploys (`CONTEXT !== 'production'`). Preview errors are low-signal relative to the noise cost; local dev errors would pollute the production feed. If preview monitoring becomes valuable later, it can be enabled per-environment in Sentry's dashboard without code changes.

### 5. Manual `captureException` in existing ErrorBoundary, skipping HTTP errors

Rather than replacing `root.tsx`'s `ErrorBoundary` with Sentry's wrapper, `Sentry.captureException` is called manually. This preserves the existing logic that differentiates `isRouteErrorResponse` errors (404s, expected HTTP responses) from true unexpected errors — only the latter are reported to Sentry. Reporting 404s would be high-noise with no actionable signal.

### 6. Tracing: 10% sample rate in production

`tracesSampleRate` is set to `0.1` in production and `1.0` in development. This provides statistically representative route-level traces (page navigations, loaders, actions) without incurring excessive Sentry transaction volume. Firestore call spans are excluded — route-level granularity is sufficient for current troubleshooting needs.

### 7. Release tracking via `COMMIT_REF`

Sentry events are tagged with `process.env.COMMIT_REF` (Netlify's built-in git SHA). This enables first-seen-in-release tracking and suspect commit diffing at no additional setup cost.

## Alternatives considered

- **Client-only Sentry:** Rejected — misses all loader/action failures, which are a meaningful failure surface in an SSR app.
- **Init only after GDPR consent:** Rejected — creates a blind spot for users who haven't interacted with the banner; error monitoring does not require consent under the legitimate interest basis.
- **UID + email for registered users:** Rejected — email is PII; adds risk without sufficient support-workflow benefit at current scale.
- **Capture preview deploys:** Rejected — low signal, adds noise to the production feed; can be enabled later in Sentry's dashboard if needed.
