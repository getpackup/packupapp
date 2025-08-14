/**
 * Generates a random password of the specified length.
 *
 * @param length The length of the password to generate.
 * @returns A Promise that resolves to a string containing the generated password.
 * @throws An error if the length argument is less than 1.
 */
export const generatePassword = async (length: number): Promise<string> => {
  if (length < 1) {
    throw new Error('Length must be greater than 0')
  }

  // Create a new Uint8Array with the specified length.
  const buffer = new Uint8Array(length)

  // Get the browser's crypto object for generating random numbers.
  const crypto = window.crypto || (window as any).msCrypto // For compatibility with IE11.

  // Generate random values and store them in the buffer.
  const array = await crypto.getRandomValues(buffer)

  // Initialize an empty string to hold the generated password.
  let password = ''

  // Define the characters that can be used in the password.
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  // Iterate over the array of random values and add characters to the password.
  for (let i = 0; i < length; i++) {
    // Use the modulus operator to get a random index in the characters string
    // and add the corresponding character to the password.
    password += characters.charAt(array[i] % characters.length)
  }

  // Return the generated password.
  return password
}
