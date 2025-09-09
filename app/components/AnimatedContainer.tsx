import { type HTMLMotionProps, motion } from 'motion/react'

const scaleAndFadeIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: {
    duration: 0.2,
    scale: { type: 'spring', visualDuration: 0.2, bounce: 0.25 },
  },
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0 } },
  transition: { duration: 0.4 },
  exitDelay: 0,
}

const slideUpAndFadeIn = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -10, opacity: 0 },
  transition: { duration: 0.2 },
}

const highlightNewItem = {
  initial: {
    opacity: 0.5,
    backgroundColor: 'rgba(73, 125, 0, 0.15)',
    borderRadius: '0.5rem',
  },
  animate: {
    opacity: 1,
    backgroundColor: 'rgba(73, 125, 0, 0.75)',
    borderRadius: '0.5rem',
  },
  exit: {
    scale: 1,
    opacity: 1,
    backgroundColor: 'rgba(73, 125, 0, 0)',
    borderRadius: '0.5rem',
  },
  transition: {
    duration: 0.6,
    delay: 0,
  },
}

const AnimatedContainer = ({
  children,
  animation,
  ...rest
}: {
  children: React.ReactNode
  animation: 'scaleAndFadeIn' | 'slideUpAndFadeIn' | 'fadeIn' | 'highlightNewItem' | undefined
} & Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>) => {
  const getAnimationConfig = () => {
    switch (animation) {
      case 'scaleAndFadeIn':
        return scaleAndFadeIn
      case 'slideUpAndFadeIn':
        return slideUpAndFadeIn
      case 'fadeIn':
        return fadeIn
      case 'highlightNewItem':
        return highlightNewItem
      default:
        return undefined
    }
  }

  return (
    <motion.div {...getAnimationConfig()} {...rest}>
      {children}
    </motion.div>
  )
}

export default AnimatedContainer
