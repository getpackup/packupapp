import { ImageIcon, MapIcon, MoveRight } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import StaticMapImage from '~/components/StaticMapImage'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

import AnimatedContainer from '../../AnimatedContainer'
import { newTripFormSchema } from '.'

type HeaderImageStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const predefinedChoices = [
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1617244552/getpackup/0f1a2062-3.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1617244549/getpackup/044a8781.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1617244550/getpackup/044a9077-2-2.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1617244547/getpackup/044A0009-2.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1617244545/getpackup/SnowboarderCuttingTracksOnTheEdgeOfTheShadowOnVirginSnow.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1617244556/getpackup/WatertonHike.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_auto,h_512,w_2048/v1617244555/getpackup/chamonix-chrisbrinleejr-sep17-78.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1626723073/getpackup/0F1A2340_zy0asj.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1626723079/getpackup/0F1A2357_ngyjwq.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1626131678/getpackup/PanoramaresortBC_TaylorBurk_yhq9bv.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131677/getpackup/BergLakeSunrise_TaylorBurk_gfpilg.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131677/getpackup/VancouverIslandBC_TaylorBurk_fyyalh.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131677/getpackup/Taylor_Burk_Patagonia_z1bec8.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131677/getpackup/VancouverIsland_TaylorBurk-7_zhwgh2.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1626131674/getpackup/044A4171_vpkdel.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131672/getpackup/BanffNationalParkAB2_TaylorBurk_cj27sc.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1626131671/getpackup/GrosMorneNFLD_TaylorBurk-15_cxae7q.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131669/getpackup/IceCaveBanffAlberta_TaylorBurk_lb0kfs.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131669/getpackup/GrosMorneNFLD_TaylorBurk-2_oio34q.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131665/getpackup/ElkIslandNationalParkAlberta_TaylorBurk_e0nahc.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1626131664/getpackup/044A5545-3_bcokpp.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131661/getpackup/044A8754-4_vmipxk.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1626131660/getpackup/044A4630-3_mwf30b.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_north,h_512,w_2048/v1626131659/getpackup/044A6928_rawtp5.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131653/getpackup/044A5652-3_l3sjwb.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1626131653/getpackup/044A0891_kesrw3.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131648/getpackup/0F1A8159_hkeys7.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1626131643/getpackup/044A2015-11_p8wrzc.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131644/getpackup/0F1A1972_xxnxn7.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,g_south,h_512,w_2048/v1626131637/getpackup/044A6261-3_xf1fpt.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131637/getpackup/044A6577-3_djipmj.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131635/getpackup/0F1A0636_spg3jy.jpg',
  'https://res.cloudinary.com/getpackup/image/upload/c_fill,h_512,w_2048/v1626131634/getpackup/044A5994-3_ofhstu.jpg',
]

const HeaderImageStep = ({ form }: HeaderImageStepProps) => {
  const [imageType, setImageType] = useState<'map' | 'library' | undefined>(
    form.getValues('headerImage') === undefined
      ? undefined
      : form.getValues('headerImage') === ''
        ? 'map'
        : 'library'
  )
  const watchedHeaderImage = form.watch('headerImage')

  const handleChoiceSelection = (index: number) => {
    form.setValue('headerImage', predefinedChoices[index], { shouldDirty: true })
  }

  return (
    <AnimatedContainer key="location" animation="scaleAndFadeIn">
      <span className="text-muted-foreground flex items-center gap-2 text-sm tracking-wider">
        <MoveRight className="size-4" /> About your trip
      </span>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">What image do you want to use for your trip?</h1>
        <div className="grid grid-cols-2 gap-2">
          <AspectRatio
            ratio={3 / 2}
            className={cn(
              'hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border p-4',
              {
                'ring ring-offset-1': imageType === 'map',
              }
            )}
            onClick={() => {
              setImageType('map')
              form.setValue('headerImage', '', { shouldDirty: true })
            }}
          >
            <MapIcon className="size-8" />
            Use a map image
          </AspectRatio>
          <AspectRatio
            ratio={3 / 2}
            className={cn(
              'hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border p-4',
              {
                'ring ring-offset-1': imageType === 'library',
              }
            )}
            onClick={() => setImageType('library')}
          >
            <ImageIcon className="size-8" />
            Select an image from our library
          </AspectRatio>
        </div>

        {imageType === 'map' && (
          <div className="space-y-2">
            <Label>Map preview</Label>
            <AspectRatio
              ratio={4}
              className="pointer-events-none overflow-hidden rounded-sm border"
            >
              <StaticMapImage
                lat={form.getValues('lat')}
                lng={form.getValues('lng')}
                height="100%"
                width="100%"
                zoom={10}
              />
            </AspectRatio>
          </div>
        )}
        {imageType === 'library' && (
          <div className="space-y-2">
            {watchedHeaderImage ? (
              <>
                <Label>Image preview</Label>
                <AspectRatio ratio={4} className="overflow-hidden rounded-sm">
                  <img src={watchedHeaderImage} alt="" />
                </AspectRatio>
                <p className="text-center">
                  <Button
                    variant="link"
                    onClick={() => form.setValue('headerImage', '', { shouldDirty: true })}
                  >
                    Select a different image
                  </Button>
                </p>
              </>
            ) : (
              <>
                <Label>Select an image</Label>
                <div className="mb-1 h-[200px] w-full space-y-4 overflow-y-auto rounded-md border p-4">
                  {predefinedChoices.map((img, index) => (
                    <div
                      key={img}
                      className={cn('rounded-sm', {
                        'ring ring-offset-1': watchedHeaderImage === img,
                      })}
                    >
                      <AspectRatio ratio={4} key={img} className="overflow-hidden rounded-sm">
                        <img
                          src={img}
                          alt=""
                          onClick={() => handleChoiceSelection(index)}
                          className="cursor-pointer"
                        />
                      </AspectRatio>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-right text-sm">
                  All photos courtesy of{' '}
                  <a
                    href="https://www.taylorburk.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Taylor Burk Photography
                  </a>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </AnimatedContainer>
  )
}

export default HeaderImageStep
