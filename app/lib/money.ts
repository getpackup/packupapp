/**
 * Parse a money input string into a normalized string format
 * Supports US/CAD style money entry: "$10.99", "10.99", "$1,000.50", etc.
 * Returns a string with exactly 2 decimal places (e.g., "10.99", "1000.50", "12.00")
 */
export function parseMoneyInput(value: string): string {
  if (!value || value.trim() === '') {
    return ''
  }

  // Remove currency symbols, commas, and spaces
  let cleaned = value.replace(/[$,\s]/g, '')

  // Handle negative values
  const isNegative = cleaned.startsWith('-')
  if (isNegative) {
    cleaned = cleaned.substring(1)
  }

  // Allow only digits and one decimal point
  cleaned = cleaned.replace(/[^\d.]/g, '')

  // Ensure only one decimal point - keep only the first one
  const parts = cleaned.split('.')
  const integerPart = parts[0] || ''
  const decimalPart = parts.length > 1 ? parts.slice(1).join('').substring(0, 2) : ''

  // If there's no integer part, return empty (user just typed "." or invalid input)
  if (!integerPart && !decimalPart) {
    return ''
  }

  // Reconstruct the cleaned value - always format with 2 decimal places
  if (decimalPart) {
    // Pad decimal part to 2 places if needed (e.g., "12.5" -> "12.50")
    cleaned = `${integerPart}.${decimalPart.padEnd(2, '0')}`
  } else {
    // No decimal part, add ".00" (e.g., "12" -> "12.00")
    cleaned = `${integerPart}.00`
  }

  // Add negative sign back if needed
  if (isNegative && cleaned) {
    cleaned = '-' + cleaned
  }

  return cleaned
}

/**
 * Format a money value with commas for thousands separators
 * Uses Intl.NumberFormat to format numbers with commas
 * Returns formatted string like "1,234.56" or "12.50"
 */
export function formatMoneyWithCommas(value: string): string {
  if (!value || value.trim() === '') {
    return ''
  }

  // Parse the value first to normalize it
  const parsed = parseMoneyInput(value)

  if (!parsed) {
    return ''
  }

  const num = parseFloat(parsed)

  if (isNaN(num)) {
    return value // Return original if parsing fails
  }

  // Use Intl.NumberFormat to format with commas and 2 decimal places
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currency: 'USD',
    style: 'currency',
  })

  return formatter.format(num)
}

/**
 * Format a money value for display in an input field
 * Formats as user types - more lenient, allows intermediate states like "10."
 * Only removes invalid characters but preserves decimal points
 * Does NOT add commas during typing for better UX
 */
export function formatMoneyForInput(value: string): string {
  if (!value || value.trim() === '') {
    return ''
  }

  // Remove currency symbols, commas, and spaces (but preserve decimal points)
  let cleaned = value.replace(/[$,\s]/g, '')

  // Handle negative values
  const isNegative = cleaned.startsWith('-')
  if (isNegative) {
    cleaned = cleaned.substring(1)
  }

  // Remove invalid characters but keep digits and decimal points
  cleaned = cleaned.replace(/[^\d.]/g, '')

  // Ensure only one decimal point - keep only the first one
  const parts = cleaned.split('.')
  const integerPart = parts[0] || ''
  const hasDecimalPoint = cleaned.includes('.')

  // Check if the original input had a trailing decimal point
  const originalHadTrailingDecimal = value.trim().endsWith('.')

  // Reconstruct: preserve trailing decimal if it was there, or if there are decimals after
  let result = integerPart
  if (hasDecimalPoint) {
    const decimalPart = parts.length > 1 ? parts.slice(1).join('').substring(0, 2) : ''
    result = decimalPart
      ? `${integerPart}.${decimalPart}`
      : originalHadTrailingDecimal || parts.length > 1
        ? `${integerPart}.`
        : integerPart
  }

  // Add negative sign back if needed
  if (isNegative && result) {
    result = '-' + result
  }

  return result
}

/**
 * Validate that a money input string is a valid monetary value
 */
export function isValidMoney(value: string): boolean {
  if (!value || value.trim() === '') {
    return true // Empty is valid (optional field)
  }

  const parsed = parseMoneyInput(value)

  if (!parsed) {
    return true // Empty after parsing is valid
  }

  // Check if it's a valid number
  const num = parseFloat(parsed)

  if (isNaN(num)) {
    return false
  }

  // Check if it's finite
  if (!isFinite(num)) {
    return false
  }

  return true
}

/**
 * Format a money string for display (e.g., in tooltips, labels)
 * Converts "10.99" to "$10.99" or "1234.56" to "$1,234.56"
 */
export function formatMoneyForDisplay(value: string | null | undefined): string {
  if (!value || value.trim() === '') {
    return ''
  }

  const parsed = parseMoneyInput(value)

  if (!parsed) {
    return ''
  }

  const num = parseFloat(parsed)

  if (isNaN(num)) {
    return value // Return original if parsing fails
  }

  // Use Intl.NumberFormat to format with commas and currency symbol
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formatter.format(num)
}
