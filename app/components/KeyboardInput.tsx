type KeyboardInputProps = {
  children: React.ReactNode
}

const KeyboardInput = ({ children }: KeyboardInputProps) => {
  return (
    <kbd className="border-ring rounded-xs border bg-transparent px-1 font-mono text-[10px] [&+kbd]:ml-1">
      {children}
    </kbd>
  )
}

export default KeyboardInput
