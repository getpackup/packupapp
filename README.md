# Packup

[![Lint, Test, & Typecheck](https://github.com/getpackup/packupapp/actions/workflows/ci.yml/badge.svg)](https://github.com/getpackup/packupapp/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/82ebae32-db80-41c9-86b6-7c2e80c97ec9/deploy-status)](https://app.netlify.com/projects/newpackupapp/deploys)

A collaborative trip packing app where users plan gear lists together, assign items to people, and track what needs to be bought before a trip.

## Features

- Create trips and invite friends to collaborate on packing lists
- Assign packing list items to specific people
- Track item status (packed, needs to be bought, etc.)
- Real-time updates across devices
- Responsive design for mobile and desktop
- Shopping List view for items that need to be purchased
- Email notifications for trip updates and reminders
- User authentication with magic link sign-in
- Trip Chat for discussing trip details and coordinating plans
- Emergency contact management for added safety
- Firebase Functions for backend logic and email handling

## Getting Started

### Installation

Install the dependencies:

```bash
pnpm install
```

### Development

Start the development server with HMR:

```bash
pnpm dev
```

Your application will be available at `http://localhost:5173`.

Emails can be previewed using the command:

```bash
pnpm email:dev
```

## Building for Production

Create a production build:

```bash
pnpm build
```

## Deployment

Deployed to Netlify via pushes to the `main` branch at [https://new.packupapp.com/](https://new.packupapp.com/).

---

Happy packing, and stay safe out there!

— The Packup team

✌️🧡🏕️
