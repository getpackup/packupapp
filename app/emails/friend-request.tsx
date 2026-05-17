import { Text } from '@react-email/components'
import type { FC } from 'react'

import BaseEmailTemplate from './base'
import CallToAction from './components/call-to-action'

export interface FriendRequestEmailProps {
  requesterDisplayName: string
  requesterUsername: string
  url: string
}

const testData: FriendRequestEmailProps = {
  requesterDisplayName: 'Alex Hiker',
  requesterUsername: 'alex_hiker',
  url: 'http://localhost:5173',
}

const FriendRequestEmailImpl: FC<FriendRequestEmailProps> = ({
  requesterDisplayName,
  requesterUsername,
  url,
}) => {
  return (
    <BaseEmailTemplate
      url={url}
      heading="New Friend Request on Packup"
      preview={`@${requesterUsername} wants to be your friend on Packup`}
    >
      <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed dark:text-gray-300">
        Hey there!
        <br />
        {requesterDisplayName ? (
          <>
            <b className="text-primary font-sans font-bold dark:text-gray-300">
              {requesterDisplayName}
            </b>{' '}
            (<b className="text-primary font-sans font-bold dark:text-gray-300">@{requesterUsername}</b>)
          </>
        ) : (
          <b className="text-primary font-sans font-bold dark:text-gray-300">@{requesterUsername}</b>
        )}{' '}
        has sent you a friend request on Packup. Head over to the Friends page to accept or decline.
      </Text>
      <CallToAction text="View Friend Requests" url={`${url}/friends`} />
    </BaseEmailTemplate>
  )
}

export const FriendRequestEmail = Object.assign(FriendRequestEmailImpl, {
  PreviewProps: testData,
}) as FC<FriendRequestEmailProps> & {
  PreviewProps: FriendRequestEmailProps
}

export default FriendRequestEmail
