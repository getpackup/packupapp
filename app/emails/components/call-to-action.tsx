import { Button, Section } from '@react-email/components'

function CallToAction({ text, url }: { text: string; url: string }) {
  return (
    <Section className="text-center">
      <Button
        className="bg-accent decoration-none mx-auto mt-0 mb-6 rounded px-6 py-4 text-center font-sans text-sm text-white"
        href={url}
      >
        {text}
      </Button>
    </Section>
  )
}

export default CallToAction

