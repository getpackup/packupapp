type KeyboardInputProps = {
  children: React.ReactNode
}

const KeyboardInput = ({ children }: KeyboardInputProps) => {
  return (
    <kbd className="border-ring gap-1 rounded-xs border bg-transparent p-1 font-mono text-[10px] [&+kbd]:ml-1">
      {children}
    </kbd>
  )
}

export default KeyboardInput
