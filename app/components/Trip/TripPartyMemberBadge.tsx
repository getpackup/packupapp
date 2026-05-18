import { BadgeCheck, Contact, Send, UserX } from 'lucide-react'

import { type TripMember, TripMemberStatus } from '~/types/TripMember'

import { Badge } from '../ui/badge'

function TripPartyMemberBadge({ member }: { member: TripMember }) {
  if (member.status === TripMemberStatus.Owner) {
    return (
      <Badge variant="primary">
        <BadgeCheck /> Trip Creator
      </Badge>
    )
  }
  if (member.status === TripMemberStatus.Pending) {
    return (
      <Badge variant="success">
        <Send />
        Invited
      </Badge>
    )
  }
  if (member.status === TripMemberStatus.Accepted) {
    return (
      <Badge variant="secondary">
        <Contact /> Trip Member
      </Badge>
    )
  }
  if (member.status === TripMemberStatus.Declined) {
    return (
      <Badge variant="destructive">
        <UserX /> Declined
      </Badge>
    )
  }
  if (member.status === TripMemberStatus.Removed) {
    return (
      <Badge variant="destructive">
        <UserX /> Removed
      </Badge>
    )
  }
  if (member.status === TripMemberStatus.Left) {
    return (
      <Badge variant="destructive">
        <UserX /> Left
      </Badge>
    )
  }
}

export default TripPartyMemberBadge
