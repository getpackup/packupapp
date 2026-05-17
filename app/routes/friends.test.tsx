import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

vi.mock('../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com' },
  })),
}))

vi.mock('../services/friends', () => ({
  useFriendsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  usePendingFriendRequestsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useSentFriendRequestsQuery: vi.fn(() => ({ data: [], isLoading: false })),
  useSendFriendRequest: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useAcceptFriendRequest: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeclineFriendRequest: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUnfriend: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeclinedFriendshipsQuery: vi.fn(() => ({ data: [], isLoading: false })),
}))

vi.mock('../services/users', () => ({
  useUserByIdQuery: vi.fn(() => ({ data: null })),
}))

import { useIsAnonymous } from '../lib/useIsAnonymous'
import {
  useFriendsQuery,
  useUnfriend,
  usePendingFriendRequestsQuery,
  useDeclinedFriendshipsQuery,
  useSentFriendRequestsQuery,
} from '../services/friends'
import { useUserByIdQuery } from '../services/users'
import Friends from './friends'

function renderComponent() {
  return render(
    <MemoryRouter>
      <Friends />
    </MemoryRouter>
  )
}

describe('Friends page', () => {
  it('shows Account Gate for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderComponent()
    expect(screen.getByText('Create an account to connect with friends')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/signup')
  })

  it('shows empty friends state for registered users with no friends', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderComponent()
    expect(screen.getByText('No friends yet')).toBeInTheDocument()
    expect(screen.getByText('Find friends')).toBeInTheDocument()
  })

  it('hides friend requests section when there are no pending requests', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(usePendingFriendRequestsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    renderComponent()
    expect(screen.queryByText('Friend Requests')).not.toBeInTheDocument()
  })

  it('shows friend requests section when requests exist', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(usePendingFriendRequestsQuery).mockReturnValue({
      data: [
        {
          id: 'req_uid1',
          uids: ['sender', 'u1'],
          requesterUid: 'sender',
          status: 'pending',
          requestedAt: { toDate: () => new Date() },
        },
      ],
      isLoading: false,
    } as any)
    renderComponent()
    expect(screen.getByText('Friend Requests')).toBeInTheDocument()
  })

  it('shows friends count when friends exist', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useFriendsQuery).mockReturnValue({
      data: [
        {
          id: 'u1_u2',
          uids: ['u1', 'u2'],
          requesterUid: 'u1',
          status: 'accepted',
          requestedAt: { toDate: () => new Date() },
        },
      ],
      isLoading: false,
    } as any)
    renderComponent()
    expect(screen.getByText('(1)')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useFriendsQuery).mockReturnValue({ data: [], isLoading: true } as any)
    vi.mocked(useDeclinedFriendshipsQuery).mockReturnValue({ data: [], isLoading: true } as any)
    renderComponent()
    expect(screen.queryByText('No friends yet')).not.toBeInTheDocument()
  })

  it('renders accepted friends with avatar, name, and username', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useFriendsQuery).mockReturnValue({
      data: [
        {
          id: 'u1_u2',
          uids: ['u1', 'u2'],
          requesterUid: 'u1',
          status: 'accepted',
          requestedAt: { toDate: () => new Date() },
        },
      ],
      isLoading: false,
    } as any)
    vi.mocked(useDeclinedFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(usePendingFriendRequestsQuery).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(useUserByIdQuery).mockReturnValue({
      data: {
        uid: 'u2',
        displayName: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@test.com',
        photoURL: '',
      },
    } as any)
    renderComponent()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('@janesmith')).toBeInTheDocument()
  })

  it('shows unfriend confirmation dialog before proceeding', async () => {
    const user = userEvent.setup()
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useFriendsQuery).mockReturnValue({
      data: [
        {
          id: 'u1_u2',
          uids: ['u1', 'u2'],
          requesterUid: 'u1',
          status: 'accepted',
          requestedAt: { toDate: () => new Date() },
        },
      ],
      isLoading: false,
    } as any)
    vi.mocked(useDeclinedFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(usePendingFriendRequestsQuery).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(useUserByIdQuery).mockReturnValue({
      data: {
        uid: 'u2',
        displayName: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@test.com',
        photoURL: '',
      },
    } as any)
    renderComponent()

    await user.click(screen.getByRole('button', { name: /unfriend/i }))

    expect(screen.getByText('Unfriend Jane Smith?')).toBeInTheDocument()
    expect(screen.getByText(/will remove Jane Smith from your friends list/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls unfriend mutation on confirmation', async () => {
    const mockUnfriend = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUnfriend).mockReturnValue({
      mutateAsync: mockUnfriend,
      isPending: false,
    } as any)
    const user = userEvent.setup()
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useFriendsQuery).mockReturnValue({
      data: [
        {
          id: 'u1_u2',
          uids: ['u1', 'u2'],
          requesterUid: 'u1',
          status: 'accepted',
          requestedAt: { toDate: () => new Date() },
        },
      ],
      isLoading: false,
    } as any)
    vi.mocked(useDeclinedFriendshipsQuery).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(usePendingFriendRequestsQuery).mockReturnValue({ data: [], isLoading: false } as any)
    vi.mocked(useUserByIdQuery).mockReturnValue({
      data: {
        uid: 'u2',
        displayName: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@test.com',
        photoURL: '',
      },
    } as any)
    renderComponent()

    await user.click(screen.getByRole('button', { name: /unfriend/i }))
    const confirmButtons = screen.getAllByRole('button', { name: /unfriend/i })
    const confirmButton = confirmButtons.find((btn) => btn.closest('[role="dialog"]') !== null)!
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockUnfriend).toHaveBeenCalledWith({ friendshipId: 'u1_u2' })
    })
  })
})
