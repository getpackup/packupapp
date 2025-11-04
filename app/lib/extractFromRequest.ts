import { UAParser } from 'ua-parser-js'

/**
 * Extracts a formatted device string and IP address from a request
 * @param request A `Request` object
 * @returns An object with a formatted device string and IP address
 */
export default function extractFromRequest(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'Unknown'

  function formatDeviceString(): string {
    const parsed = new UAParser(userAgent).getResult()
    const os = parsed.os?.name || 'Unknown'
    const browserBase = parsed.browser?.name || 'Unknown'

    // Mark “Mobile” when device.type is mobile/tablet
    const isMobile = parsed.device?.type === 'mobile' || parsed.device?.type === 'tablet'
    const browser =
      browserBase !== 'Unknown' ? (isMobile ? `${browserBase} Mobile` : browserBase) : 'Unknown'

    if (os === 'Unknown' && browser === 'Unknown') return 'Unknown'
    if (os !== 'Unknown' && browser !== 'Unknown') return `${os} - ${browser}`
    return os !== 'Unknown' ? os : browser
  }

  // Extract IP address from request headers
  function extractIPAddress(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')

    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwardedFor) return forwardedFor.split(',')[0].trim()

    return 'Unknown'
  }

  const device = formatDeviceString()
  const ipAddress = extractIPAddress(request)

  return {
    device,
    ipAddress,
  }
}
