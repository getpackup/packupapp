import { z } from 'zod'

export const newTripFormSchema = z.object({
  startingPoint: z.string().min(3, { message: 'Location must be at least 3 characters' }),
  lat: z
    .number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  lng: z
    .number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' }),
  startDate: z.date({ error: 'Start date is required' }),
  endDate: z.date({ error: 'End date is required' }),
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  headerImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  personalTags: z.array(z.string()).optional(),
})
