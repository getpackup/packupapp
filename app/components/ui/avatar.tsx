import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as React from 'react'
import { Md5 } from 'ts-md5'

import { cn } from '~/lib/utils'

type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

const imageStatusCache = new Map<string, ImageLoadingStatus>()
const imageStatusListeners = new Map<string, Set<() => void>>()

function useSharedImageLoadingStatus(src: string | undefined) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      if (!src) return () => {}
      if (!imageStatusListeners.has(src)) {
        imageStatusListeners.set(src, new Set())
      }
      imageStatusListeners.get(src)!.add(callback)
      return () => {
        imageStatusListeners.get(src)?.delete(callback)
      }
    },
    [src]
  )

  const getSnapshot = React.useCallback(() => {
    if (!src) return 'idle' as ImageLoadingStatus
    return imageStatusCache.get(src) ?? ('idle' as ImageLoadingStatus)
  }, [src])

  const status = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  React.useEffect(() => {
    if (!src || imageStatusCache.has(src)) return

    imageStatusCache.set(src, 'loading')
    const img = new Image()
    img.src = src
    img.onload = () => {
      imageStatusCache.set(src, 'loaded')
      imageStatusListeners.get(src)?.forEach((cb) => cb())
    }
    img.onerror = () => {
      imageStatusCache.set(src, 'error')
      imageStatusListeners.get(src)?.forEach((cb) => cb())
    }
  }, [src])

  return status
}

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  gravatarEmail,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & {
  gravatarEmail?: string
}) {
  const resolvedSrc =
    (!props.src || props.src === '') && gravatarEmail
      ? `https://www.gravatar.com/avatar/${Md5.hashStr(gravatarEmail || '')}?d=identicon&s=192`
      : props.src

  const status = useSharedImageLoadingStatus(resolvedSrc)

  if (status !== 'loaded') return null

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
      src={resolvedSrc}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
