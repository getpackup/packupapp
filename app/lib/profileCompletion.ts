import type { User } from '~/types/User'

type CompletionField = {
  key: string
  isFilled: (user: User) => boolean
}

const completionFields: CompletionField[] = [
  { key: 'displayName', isFilled: (u) => !!u.displayName },
  { key: 'username', isFilled: (u) => !!u.username },
  { key: 'email', isFilled: (u) => !!u.email },
  { key: 'bio', isFilled: (u) => !!u.bio },
  { key: 'location', isFilled: (u) => !!u.location },
  { key: 'photoURL', isFilled: (u) => !!u.photoURL },
  { key: 'favouriteActivities', isFilled: (u) => (u.favouriteActivities?.length ?? 0) > 0 },
  { key: 'emergencyContacts', isFilled: (u) => (u.emergencyContacts?.length ?? 0) > 0 },
]

export function calculateProfileCompletion(user: User): number {
  const filled = completionFields.filter((f) => f.isFilled(user)).length
  return (filled / completionFields.length) * 100
}

export { completionFields }
