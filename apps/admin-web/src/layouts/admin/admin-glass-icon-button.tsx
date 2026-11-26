import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminGlassIconButtonProps = Omit<
  HTMLMotionProps<'button'>,
  'children'
> & {
  children: ReactNode
}

/**
 * Circular glassmorphism icon control for the admin topbar
 * (theme / language / notifications).
 */
export const AdminGlassIconButton = forwardRef<
  HTMLButtonElement,
  AdminGlassIconButtonProps
>(function AdminGlassIconButton(
  { className, children, type = 'button', disabled, onClick, ...props },
  ref,
) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={
        disabled || reduceMotion
          ? undefined
          : { scale: 1.07, y: -1 }
      }
      whileTap={
        disabled || reduceMotion ? undefined : { scale: 0.93 }
      }
      transition={{ type: 'spring', stiffness: 460, damping: 24 }}
      className={cn(
        'relative inline-flex size-10 shrink-0 items-center justify-center rounded-full',
        'border border-white/55 bg-white/50 text-primary backdrop-blur-md',
        'shadow-[0_10px_28px_rgba(100,55,250,0.18)]',
        'transition-[background-color,box-shadow] duration-200',
        'hover:bg-white/70 hover:shadow-[0_14px_36px_rgba(100,55,250,0.28)]',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'dark:border-white/12 dark:bg-white/10 dark:text-primary',
        'dark:shadow-[0_10px_28px_rgba(100,55,250,0.32)]',
        'dark:hover:bg-white/16 dark:hover:shadow-[0_14px_36px_rgba(100,55,250,0.4)]',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
})
