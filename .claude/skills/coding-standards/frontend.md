# Frontend Standards

## Component Architecture

- We use React Router v7 (file-based routing). Routes go in `app/routes/`. Each route file can export `loader`, `action`, `default` (component), `meta`, and `ErrorBoundary`. Don't put business logic directly in routes - call into services instead.
- Feature-specific components in `app/components/Trip/`
- Design system components in `app/components/ui/`
- Use `app/components/ResponsiveDialogContainer.tsx` for modals/drawers — renders as dialog on desktop, drawer on mobile

## Styling

- **Tailwind CSS v4** with dark mode support
- use `cn()` from `~/lib/utils` for combining tailwind classes. It's clsx + tailwind-merge.
- **Radix UI** primitives for accessible components, installed via Shadcn UI commands
- Shadcn components live in `app/components/ui/`. Custom components go directly in `app/components/`. Components specific to a feature (e.g. trip-related components) _may_ go in a subfolder (e.g. `app/components/Trip/`), but don't create a new folder for a single component.
- Theme managed via cookies and CSS classes
- Custom animations via **Framer Motion**

## Responsive Design

- Mobile-first breakpoints
- Use `~/lib/use-screen-size` hook for JS-based breakpoint detection (matches Tailwind breakpoints)
- Use conditional rendering based on screen size where Tailwind classes alone aren't sufficient

## State Management (UI)

- **Zustand** for local UI state — store in `app/contexts/globalState/`
- **TanStack Query** for server state
- **React Context** (`app/contexts/auth/`) for auth state
- **React Hook Form** + **Zod** for form state and validation

## React Router Patterns

- For form validation in route actions, use `parseFormData(formData, zodSchema)` from `~/lib/validation`. It returns `{ success, data, errors }`. For route params use `parseParams`. For JSON request bodies use `parseJsonBody`.
