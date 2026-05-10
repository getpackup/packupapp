# Firebase Functions brought into this repo

The app is deployed on Netlify but uses Firebase (Firestore + Auth) as its backend. A separate Firebase Functions repo existed for backend jobs. We are consolidating Firebase Functions into this repo under a `functions/` directory rather than maintaining a separate repo or using Netlify Scheduled Functions.

**Why not Netlify Scheduled Functions?** Netlify Scheduled Functions would couple the cron infrastructure to the hosting layer. Firebase Functions run in the same Google Cloud project as Firestore, which means lower latency for Admin SDK reads, a unified deployment story for all Firebase resources, and no dependency on Netlify's function runtime for backend jobs that have nothing to do with serving HTTP requests.

**Why not keep the separate repo?** The Safety Itinerary cron needs access to Firestore data models and types defined here. Sharing types across two repos requires a package or duplication. Consolidating eliminates that overhead and keeps the full project in one place.

The `functions/` directory at the repo root will use the Firebase Functions v2 SDK with TypeScript. It is a separate package with its own `package.json` and is deployed independently via `firebase deploy --only functions`.
