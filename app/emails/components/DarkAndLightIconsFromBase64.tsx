import { Img } from '@react-email/components'

/**
 * Using https://lucide.dev/icons/, you can copy the SVG icon as a data url and use this component to display the light and dark icons.
 * @param base64String - The base64 string of the SVG icon
 * @returns The light and dark icons as an react-email Img component
 */
function DarkAndLightIconsFromBase64({ base64String }: { base64String: string }) {
  const cleanBase64 = base64String.replace(/^data:image\/svg\+xml;base64,/, '')
  const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8')

  function createColoredSvgBase64(svgString: string, color: string): string {
    const coloredSvg = svgString
      .replace(/stroke="currentColor"/g, `stroke="${color}"`)
      .replace(/class="[^"]*"/g, '')
    return `data:image/svg+xml;base64,${Buffer.from(coloredSvg, 'utf-8').toString('base64')}`
  }

  const lightIcon = createColoredSvgBase64(decoded, '#0b2b44')
  const darkIcon = createColoredSvgBase64(decoded, '#d1d5db')

  return (
    <>
      <Img src={lightIcon} className="h-4 w-4 dark:hidden" />
      <Img src={darkIcon} className="hidden h-4 w-4 dark:block" />
    </>
  )
}

export default DarkAndLightIconsFromBase64

