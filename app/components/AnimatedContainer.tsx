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

const AnimatedContainer = ({
  children,
  animation,
  ...rest
}: {
  children: React.ReactNode
  animation: 'scaleAndFadeIn' | 'slideUpAndFadeIn' | 'fadeIn'
} & Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>) => {
  const getAnimationConfig = () => {
    switch (animation) {
      case 'scaleAndFadeIn':
        return scaleAndFadeIn
      case 'slideUpAndFadeIn':
        return slideUpAndFadeIn
      case 'fadeIn':
        return fadeIn
      default:
        return scaleAndFadeIn
    }
  }

  return (
    <motion.div {...getAnimationConfig()} {...rest}>
      {children}
    </motion.div>
  )
}

export default AnimatedContainer
