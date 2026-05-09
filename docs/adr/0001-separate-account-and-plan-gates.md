# Separate Account Gate and Plan Gate components

Anonymous User → registered and free → paid are two distinct conversion moments with different copy, CTAs, and emotional asks. We treat them as separate components (`AccountGate` and `PlanGate`) rather than a single gate with a `type` prop.

A unified component would accumulate branching logic as the freemium model grows. Keeping them separate lets each gate evolve independently — copy, visual treatment, and analytics can differ without coupling.

The current `UpgradeAccountGate` component implements the Account Gate. It should be renamed `AccountGate` when `PlanGate` is introduced.
