import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import { FriendRequestEmail } from './friend-request'

const baseProps = {
  requesterDisplayName: 'Alex Hiker',
  requesterUsername: 'alex_hiker',
  url: 'https://packupapp.com',
}

describe('FriendRequestEmail', () => {
  it('renders the requester display name and username', async () => {
    const html = await render(<FriendRequestEmail {...baseProps} />)
    expect(html).toContain('Alex Hiker')
    expect(html).toContain('@alex_hiker')
  })

  it('renders a link to the friends page', async () => {
    const html = await render(<FriendRequestEmail {...baseProps} />)
    expect(html).toContain('/friends')
  })

  it('renders the email heading', async () => {
    const html = await render(<FriendRequestEmail {...baseProps} />)
    expect(html).toContain('New Friend Request on Packup')
  })

  it('renders without errors with minimal props', async () => {
    const html = await render(
      <FriendRequestEmail requesterDisplayName="" requesterUsername="user1" url="https://packupapp.com" />
    )
    expect(html).toContain('@user1')
  })
})
