import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Camera, Lock, Pencil, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import PageContent from '~/components/PageContent'
import PageHeader from '~/components/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
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
import { gearListActivities } from '~/lib/gearListItemEnum'
import { calculateProfileCompletion } from '~/lib/profileCompletion'
import { cn } from '~/lib/utils'
import { useGooglePlaces, type PlacePrediction } from '~/lib/useGooglePlaces'
import { useUpdateUser } from '~/services/users'
import type { ActivityTypes } from '~/types/GearItem'

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

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [location, setLocation] = useState(user?.location ?? '')
  const [locationInput, setLocationInput] = useState(user?.location ?? '')
  const [locationPredictions, setLocationPredictions] = useState<PlacePrediction[]>([])
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '')
  const [favouriteActivities, setFavouriteActivities] = useState<Array<keyof ActivityTypes>>(
    user?.favouriteActivities ?? []
  )
  const [emergencyContacts, setEmergencyContacts] = useState(user?.emergencyContacts ?? [])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Crop dialog state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const locationDebounceRef = useRef<number | null>(null)

  const { isPlacesReady, fetchAutocompleteSuggestions } = useGooglePlaces()

  const editingUser = user
    ? { ...user, displayName, bio, location, photoURL, favouriteActivities, emergencyContacts }
    : null
  const completion = user
    ? Math.round(
        isEditing && editingUser
          ? calculateProfileCompletion(editingUser)
          : calculateProfileCompletion(user)
      )
    : 0

  const handleStartEdit = () => {
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
    setLocation(user?.location ?? '')
    setLocationInput(user?.location ?? '')
    setLocationPredictions([])
    setPhotoURL(user?.photoURL ?? '')
    setFavouriteActivities(user?.favouriteActivities ?? [])
    setEmergencyContacts(user?.emergencyContacts ?? [])
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
    setLocation(user?.location ?? '')
    setLocationInput(user?.location ?? '')
    setLocationPredictions([])
    setPhotoURL(user?.photoURL ?? '')
    setFavouriteActivities(user?.favouriteActivities ?? [])
    setEmergencyContacts(user?.emergencyContacts ?? [])
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!user) return

    await updateUser({
      data: { displayName, bio, location, photoURL, favouriteActivities, emergencyContacts },
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleActivity = (activity: keyof ActivityTypes) => {
    setFavouriteActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    )
  }

  const addContact = () => {
    setEmergencyContacts((prev) => [...prev, { name: '', email: '', phoneNumber: '' }])
  }

  const updateContact = (
    index: number,
    field: 'name' | 'email' | 'phoneNumber',
    value: string
  ) => {
    setEmergencyContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  const removeContact = (index: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== index))
  }

  if (!user) return null

  return (
    <>
      <PageHeader crumbs={[{ label: 'Profile', href: '/profile' }]} />
      <PageContent>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-16">
                <AvatarImage
                  src={isEditing ? photoURL : (user.photoURL ?? '')}
                  gravatarEmail={user.email}
                />
                <AvatarFallback className="text-lg">
                  {user.displayName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <button
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    aria-label="Change profile photo"
                  >
                    <Camera className="size-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold">{user.displayName}</h1>
              <p className="text-muted-foreground text-sm">@{user.username}</p>
            </div>

            <div className="flex shrink-0 gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isPending || isUploadingImage}>
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
            <div className="grid grid-cols-1 min-[715px]:grid-cols-[120px_1fr] min-[715px]:items-center gap-x-4 gap-y-3">
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
                    <TooltipContent>Email is managed by your auth provider</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <span className="text-muted-foreground min-[715px]:self-start text-sm">Bio</span>
              {isEditing ? (
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself…"
                />
              ) : (
                <span className="text-sm">{user.bio || '—'}</span>
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
                    <ul className="bg-background absolute top-full z-10 mt-1 max-h-[200px] w-full divide-y overflow-y-auto rounded-md border shadow-md">
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

          {/* Favourite Activities */}
          <section className="space-y-4 rounded-lg border p-4">
            <h2 className="font-semibold">Favourite Activities</h2>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {gearListActivities.map((activity) => {
                  const isSelected = favouriteActivities.includes(
                    activity.name as keyof ActivityTypes
                  )
                  return (
                    <button
                      key={activity.name}
                      onClick={() => toggleActivity(activity.name as keyof ActivityTypes)}
                      className={cn(
                        'cursor-pointer rounded-md border px-3 py-1 text-sm transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent'
                      )}
                    >
                      {activity.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(user.favouriteActivities?.length ?? 0) > 0 ? (
                  user.favouriteActivities?.map((activity) => {
                    const label = gearListActivities.find((a) => a.name === activity)?.label
                    return label ? (
                      <Badge key={activity} variant="secondary">
                        {label}
                      </Badge>
                    ) : null
                  })
                ) : (
                  <span className="text-muted-foreground text-sm">
                    What are your favourite activities?
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Emergency Contacts */}
          <section className="space-y-4 rounded-lg border p-4">
            <h2 className="font-semibold">Emergency Contacts</h2>
            <div className="space-y-3">
              {isEditing ? (
                <>
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex flex-col gap-2 min-[715px]:flex-row">
                      <Input
                        className="flex-1"
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                      />
                      <Input
                        className="flex-1"
                        placeholder="Email"
                        value={contact.email}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                      />
                      <Input
                        className="flex-1"
                        placeholder="Phone"
                        value={contact.phoneNumber}
                        onChange={(e) => updateContact(index, 'phoneNumber', e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeContact(index)}
                        aria-label="Remove contact"
                        className="self-end min-[715px]:self-auto"
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  <Button variant="dashed" size="sm" onClick={addContact}>
                    <Plus />
                    Add contact
                  </Button>
                </>
              ) : (
                <>
                  {(user.emergencyContacts?.length ?? 0) > 0 ? (
                    user.emergencyContacts?.map((contact, index) => (
                      <div
                        key={index}
                        className="flex flex-col text-sm min-[715px]:flex-row min-[715px]:gap-3"
                      >
                        <span className="font-medium">{contact.name}</span>
                        {contact.email && (
                          <span className="text-muted-foreground">{contact.email}</span>
                        )}
                        {contact.phoneNumber && (
                          <span className="text-muted-foreground">{contact.phoneNumber}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No emergency contacts added yet
                    </span>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </PageContent>

      {/* Crop dialog */}
      <Dialog open={!!cropSrc} onOpenChange={(open) => { if (!open) handleCropCancel() }}>
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
    </>
  )
}
