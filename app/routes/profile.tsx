import 'react-easy-crop/react-easy-crop.css'

import { format, formatDistanceStrict } from 'date-fns'
import { updateProfile } from 'firebase/auth'
import { where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Camera, Lock, Pencil } from 'lucide-react'
import { UserPlus } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'

import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { SignupForm } from '~/components/SignupForm'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Progress } from '~/components/ui/progress'
import { Textarea } from '~/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useAuth } from '~/contexts/auth/useAuth'
import { firebaseAuth, firebaseStorage } from '~/firebase/config'
import { calculateProfileCompletion } from '~/lib/profileCompletion'
import { type PlacePrediction, useGooglePlaces } from '~/lib/useGooglePlaces'
import { useFriendsQuery } from '~/services/friends'
import { useTripsQuery } from '~/services/trips'
import { useUpdateUser } from '~/services/users'
import { TripMemberStatus } from '~/types/TripMember'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Profile | Packup' }]
}

type PixelCrop = { x: number; y: number; width: number; height: number }

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = src
  })
}

async function getCroppedBlob(imageSrc: string, pixelCrop: PixelCrop): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92
    )
  })
}

export default function Profile() {
  const { user } = useAuth()
  const { mutateAsync: updateUser, isPending } = useUpdateUser(user?.uid ?? '')

  const { data: friends = [], isLoading: friendsLoading } = useFriendsQuery(user?.uid ?? '')
  const constraints = useMemo(
    () => [
      where(`tripMembers.${user?.uid}.status`, 'not-in', [
        TripMemberStatus.Declined,
        TripMemberStatus.Removed,
      ]),
    ],
    [user?.uid]
  )

  const { data: trips, isLoading: tripsLoading } = useTripsQuery({
    constraints,
    queryOptions: {
      enabled: !!user?.uid,
    },
  })

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [website, setWebsite] = useState(user?.website ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [locationInput, setLocationInput] = useState(user?.location ?? '')
  const [locationPredictions, setLocationPredictions] = useState<PlacePrediction[]>([])
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [profileHeaderImage, setProfileHeaderImage] = useState(user?.profileHeaderImage ?? '')
  const [isUploadingHeaderImage, setIsUploadingHeaderImage] = useState(false)

  // Crop dialog state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null)

  const [headerImgCropSrc, setHeaderImgCropSrc] = useState<string | null>(null)
  const [headerImgCrop, setHeaderImgCrop] = useState({ x: 0, y: 0 })
  const [headerImgZoom, setHeaderImgZoom] = useState(1)
  const [headerImgCroppedAreaPixels, setHeaderImgCroppedAreaPixels] = useState<PixelCrop | null>(
    null
  )

  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const headerPhotoInputRef = useRef<HTMLInputElement>(null)
  const locationDebounceRef = useRef<number | null>(null)

  const { isPlacesReady, fetchAutocompleteSuggestions } = useGooglePlaces()

  const completion = user ? Math.round(calculateProfileCompletion(user)) : 0

  const handleStartEdit = () => {
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
    setWebsite(user?.website ?? '')
    setLocation(user?.location ?? '')
    setLocationInput(user?.location ?? '')
    setLocationPredictions([])
    setPhotoURL(user?.photoURL ?? '')
    setProfileHeaderImage(user?.profileHeaderImage ?? '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
    setWebsite(user?.website ?? '')
    setLocation(user?.location ?? '')
    setLocationInput(user?.location ?? '')
    setLocationPredictions([])
    setPhotoURL(user?.photoURL ?? '')
    setProfileHeaderImage(user?.profileHeaderImage ?? '')
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!user) return

    await updateUser({
      data: {
        displayName,
        bio,
        location,
        photoURL,
        profileHeaderImage,
        website,
      },
    })

    if (firebaseAuth.currentUser) {
      await updateProfile(firebaseAuth.currentUser, { displayName })
    }

    setIsEditing(false)
  }

  const uploadBlob = async (blob: Blob | File) => {
    if (!user) return
    const storageRef = ref(firebaseStorage, `user-avatars/${user.uid}`)
    await uploadBytes(storageRef, blob)
    const downloadURL = await getDownloadURL(storageRef)
    setPhotoURL(downloadURL)
  }

  const uploadHeaderBlob = async (blob: Blob | File) => {
    if (!user) return
    const storageRef = ref(firebaseStorage, `user-header-images/${user.uid}`)
    await uploadBytes(storageRef, blob)
    const downloadURL = await getDownloadURL(storageRef)
    setProfileHeaderImage(downloadURL)
  }

  const handleHeaderImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    // Reset so the same file can be re-selected after cancelling
    e.target.value = ''

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }

    const objectURL = URL.createObjectURL(file)
    const { width, height } = await getImageDimensions(objectURL)

    if (width / height === 4.5) {
      setProfileHeaderImage(objectURL)
      try {
        setIsUploadingHeaderImage(true)
        await uploadHeaderBlob(file)
      } catch {
        setProfileHeaderImage(user.profileHeaderImage ?? '')
        toast.error('Failed to upload image')
      } finally {
        setIsUploadingHeaderImage(false)
        URL.revokeObjectURL(objectURL)
      }
    } else {
      // Open the crop dialog; objectURL is kept alive until dialog closes
      setHeaderImgCropSrc(objectURL)
      setHeaderImgCrop({ x: 0, y: 0 })
      setHeaderImgZoom(1)
      setHeaderImgCroppedAreaPixels(null)
    }
  }

  const handleHeaderCropConfirm = async () => {
    if (!headerImgCropSrc || !headerImgCroppedAreaPixels || !user) return

    try {
      setIsUploadingHeaderImage(true)
      const blob = await getCroppedBlob(headerImgCropSrc, headerImgCroppedAreaPixels)
      await uploadHeaderBlob(blob)
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingHeaderImage(false)
      URL.revokeObjectURL(headerImgCropSrc)
      setHeaderImgCropSrc(null)
    }
  }

  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    // Reset so the same file can be re-selected after cancelling
    e.target.value = ''

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }

    const objectURL = URL.createObjectURL(file)
    const { width, height } = await getImageDimensions(objectURL)

    if (width === height) {
      // Already square — upload directly, no crop needed
      setPhotoURL(objectURL)
      try {
        setIsUploadingImage(true)
        await uploadBlob(file)
      } catch {
        setPhotoURL(user.photoURL ?? '')
        toast.error('Failed to upload image')
      } finally {
        setIsUploadingImage(false)
        URL.revokeObjectURL(objectURL)
      }
    } else {
      // Open the crop dialog; objectURL is kept alive until dialog closes
      setCropSrc(objectURL)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
  }

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels || !user) return

    try {
      setIsUploadingImage(true)
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels)
      await uploadBlob(blob)
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
    }
  }

  const handleHeaderCropCancel = () => {
    if (headerImgCropSrc) URL.revokeObjectURL(headerImgCropSrc)
    setHeaderImgCropSrc(null)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value)
    setLocation(value)

    if (!isPlacesReady) return

    if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current)
    locationDebounceRef.current = window.setTimeout(async () => {
      const results = await fetchAutocompleteSuggestions(value)
      setLocationPredictions(results)
    }, 250)
  }

  const handleLocationSelect = (prediction: PlacePrediction) => {
    setLocation(prediction.description)
    setLocationInput(prediction.description)
    setLocationPredictions([])
  }

  if (!user) return null

  return (
    <>
      <PageHeader crumbs={[{ label: 'Profile', href: '/profile' }]} />
      <PageContent>
        {user.isAnonymous ? (
          <div className="mx-auto max-w-md space-y-6 py-8">
            <div className="space-y-2 text-center">
              <div className="bg-muted mx-auto w-fit rounded-full p-4">
                <UserPlus className="text-muted-foreground size-8" />
              </div>
              <h2 className="text-2xl font-bold">Create your profile</h2>
              <p className="text-muted-foreground">
                Save your trips, invite friends, and access your data from any device.
              </p>
            </div>
            <div className="rounded border bg-gray-100/50 p-8 dark:bg-gray-800">
              <SignupForm />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="bg-sidebar rounded-lg">
              <div className="relative">
                <AspectRatio ratio={4.5} className="overflow-hidden rounded-t-lg">
                  {profileHeaderImage || user?.profileHeaderImage ? (
                    <img
                      src={isEditing ? profileHeaderImage : (user.profileHeaderImage ?? '')}
                      alt={user?.displayName ? `${user.displayName}'s header` : 'Profile header'}
                      className="h-full w-full rounded-t-lg object-cover"
                    />
                  ) : (
                    <div className="relative h-full w-full bg-slate-300 dark:bg-slate-700">
                      <img
                        src="images/topo.png"
                        alt={user?.displayName ? `${user.displayName}'s header` : 'Profile header'}
                        className="h-full w-full rounded-t-lg object-cover"
                      />
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <button
                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white hover:bg-black/50"
                        onClick={() => headerPhotoInputRef.current?.click()}
                        disabled={isUploadingImage}
                        aria-label="Change header photo"
                      >
                        <Camera className="size-5" />
                      </button>
                      <input
                        ref={headerPhotoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleHeaderImageSelect}
                      />
                    </>
                  )}
                </AspectRatio>
              </div>

              {/* Header */}
              <div className="-mt-16 p-4">
                <div className="relative size-24 shrink-0">
                  <Avatar className="size-24 border-4">
                    <AvatarImage
                      src={isEditing ? photoURL : (user.photoURL ?? '')}
                      gravatarEmail={user.email}
                    />
                    <AvatarFallback className="text-lg">
                      {user.displayName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div>
                      <button
                        className="absolute inset-0 flex size-24 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/50"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={isUploadingImage}
                        aria-label="Change profile photo"
                      >
                        <Camera className="size-5" />
                      </button>
                      <input
                        ref={profilePhotoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleProfilePhotoSelect}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h1 className="mb-0 text-xl font-semibold">{user.displayName}</h1>
                    <p className="text-sm">@{user.username}</p>

                    <span className="pr-4">
                      <span className="font-bold">{tripsLoading ? '-' : trips?.length}</span> trips
                    </span>
                    <span className="pr-4">
                      <span className="font-bold">{friendsLoading ? '-' : friends.length}</span>{' '}
                      {friends.length === 1 ? 'friend' : 'friends'}
                    </span>
                    {user?.createdAt && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="font-bold">
                            {formatDistanceStrict(user.createdAt.toDate(), new Date())}
                          </span>{' '}
                          on Packup
                        </TooltipTrigger>
                        <TooltipContent>
                          Joined {format(user?.createdAt?.toDate(), 'MMMM do, yyyy', {})}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isPending || isUploadingImage}
                        >
                          {isPending ? 'Saving…' : 'Save'}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleStartEdit}>
                        <Pencil />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Completion bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-medium">{completion}% complete</span>
              </div>
              <Progress value={completion} />
            </div>

            {/* Personal Info */}
            <section className="space-y-4 rounded-lg border p-4">
              <h2 className="font-semibold">Personal Info</h2>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 min-[715px]:grid-cols-[120px_1fr] min-[715px]:items-center">
                <span className="text-muted-foreground text-sm">Display name</span>
                {isEditing ? (
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                ) : (
                  <span className="text-sm">{user.displayName || '—'}</span>
                )}

                <span className="text-muted-foreground text-sm">Email</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{user.email}</span>
                  {isEditing && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="text-muted-foreground size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Contact us using the Support page to update your email address
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <span className="text-muted-foreground text-sm min-[715px]:self-start">Bio</span>
                {isEditing ? (
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself…"
                  />
                ) : (
                  <span className="text-sm">{user.bio || '—'}</span>
                )}

                <span className="text-muted-foreground text-sm min-[715px]:self-start">
                  Website
                </span>
                {isEditing ? (
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. https://yourwebsite.com"
                  />
                ) : (
                  <span className="text-sm">{user.website || '—'}</span>
                )}

                <span className="text-muted-foreground text-sm">Location</span>
                {isEditing ? (
                  <div className="relative">
                    <Input
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      placeholder="e.g. Vancouver, BC, Canada"
                    />
                    {locationPredictions.length > 0 && (
                      <ul className="bg-background absolute top-full z-10 mt-1 max-h-50 w-full divide-y overflow-y-auto rounded-md border shadow-md">
                        {locationPredictions.map((p) => (
                          <li
                            key={p.place_id}
                            role="button"
                            className="hover:bg-accent cursor-pointer px-3 py-2 text-sm"
                            onClick={() => handleLocationSelect(p)}
                          >
                            {p.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <span className="text-sm">{user.location || '—'}</span>
                )}
              </div>
            </section>
          </div>
        )}

        <Dialog
          open={!!cropSrc}
          onOpenChange={(open) => {
            if (!open) handleCropCancel()
          }}
        >
          <DialogContent className="max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Crop Photo</DialogTitle>
              <DialogDescription>
                Drag to reposition · scroll or use the slider to zoom
              </DialogDescription>
            </DialogHeader>
            <div className="relative h-72 overflow-hidden rounded-md bg-black">
              {cropSrc && (
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground shrink-0 text-xs">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCropCancel} disabled={isUploadingImage}>
                Cancel
              </Button>
              <Button onClick={handleCropConfirm} disabled={isUploadingImage}>
                {isUploadingImage ? 'Uploading…' : 'Crop & Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!headerImgCropSrc}
          onOpenChange={(open) => {
            if (!open) handleHeaderCropCancel()
          }}
        >
          <DialogContent className="max-w-md" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Crop Header Image</DialogTitle>
              <DialogDescription>
                Drag to reposition · scroll or use the slider to zoom
              </DialogDescription>
            </DialogHeader>
            <div className="relative h-72 overflow-hidden rounded-md bg-black">
              {headerImgCropSrc && (
                <Cropper
                  image={headerImgCropSrc}
                  crop={headerImgCrop}
                  zoom={headerImgZoom}
                  aspect={4.5}
                  onCropChange={setHeaderImgCrop}
                  onZoomChange={setHeaderImgZoom}
                  onCropComplete={(_, pixels) => setHeaderImgCroppedAreaPixels(pixels)}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground shrink-0 text-xs">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={headerImgZoom}
                onChange={(e) => setHeaderImgZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleHeaderCropCancel}
                disabled={isUploadingHeaderImage}
              >
                Cancel
              </Button>
              <Button onClick={handleHeaderCropConfirm} disabled={isUploadingHeaderImage}>
                {isUploadingHeaderImage ? 'Uploading…' : 'Crop & Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  )
}
