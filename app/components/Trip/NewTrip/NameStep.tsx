import { MoveRight } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import AnimatedContainer from '../../AnimatedContainer'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form'
import { Input } from '../../ui/input'
import { newTripFormSchema } from '.'

type NameStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const NameStep = ({ form }: NameStepProps) => {
  return (
    <AnimatedContainer key="location" animation="scaleAndFadeIn">
      <span className="text-muted-foreground flex items-center gap-2 text-sm tracking-wider">
        <MoveRight className="size-4" /> About your trip
      </span>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">What do you want to call this adventure?</h1>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </AnimatedContainer>
  )
}

export default NameStep
