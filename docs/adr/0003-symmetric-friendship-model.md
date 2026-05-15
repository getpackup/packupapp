# Symmetric (mutual) friendship model over asymmetric follows

Packup uses a symmetric friendship model: both users must consent before a Friend relationship exists. One user sends a Friend Request; the other Accepts or Declines. Neither is "following" the other.

## Alternatives considered

**Asymmetric follow model** (Twitter/Instagram/Strava): Person A can follow Person B without B following back. Natural fit for public-profile content discovery — e.g. a high-profile athlete whose trip history others want to see. Rejected for v1 because the current user base is small real-world friend groups, not content creators and audiences. The cold-start problem would be worse: new users with zero followers have no social graph to discover.

**Dual model** (Follow for public content + Friend for trip collaboration): Correct long-term but doubles data model and UI complexity before the use case is proven. Deferred — the Public Profile is designed so "visible to Friends" can be migrated to "visible to Followers" without a redesign when the follow model is introduced.

## Why symmetric

Trip invitations require a trusted relationship — mutual consent prevents cold invites from strangers on a platform that will grow. The symmetric model matches how this user base actually relates to each other: small groups of real-world friends planning outdoor trips together, not influencer-follower dynamics.

The 30-day re-request cooldown and silent unfriending preserve the low-drama social contract appropriate for a tool, not a social network.
