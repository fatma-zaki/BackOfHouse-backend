import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  id?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/** One box per digit; typing moves forward, Backspace moves back. Always LTR. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  id = 'login-otp',
  disabled = false,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: OtpInputProps) {
  const { t } = useTranslation()
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = value.padEnd(length, ' ').slice(0, length).split('')

  const setDigit = (index: number, digit: string) => {
    const next = digits
      .map((current, i) => (i === index ? digit || ' ' : current))
      .join('')
      .trimEnd()
    onChange(next)
  }

  return (
    <div
      className="flex gap-2"
      dir="ltr"
      role="group"
      aria-label={t('login.fields.otp')}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          id={index === 0 ? id : undefined}
          ref={(el) => {
            refs.current[index] = el
          }}
          className={cn(
            'num h-14 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-[#E5E7EB] bg-white text-center text-[22px] font-bold text-[#1A1A2E] outline-none',
            'focus-visible:border-[#6437FA] focus-visible:ring-2 focus-visible:ring-[#6437FA]/20',
            ariaInvalid && 'border-destructive focus-visible:border-destructive',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={index === 0 ? ariaDescribedBy : undefined}
          aria-label={t('login.fields.otpDigit', { n: index + 1 })}
          value={digit.trim()}
          onChange={(event) => {
            const nextDigit = event.target.value.replace(/\D/g, '').slice(-1)
            setDigit(index, nextDigit)
            if (nextDigit) refs.current[index + 1]?.focus()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digit.trim()) {
              refs.current[index - 1]?.focus()
            }
          }}
          onPaste={(event) => {
            event.preventDefault()
            const pasted = event.clipboardData
              .getData('text')
              .replace(/\D/g, '')
              .slice(0, length)
            if (!pasted) return
            onChange(pasted)
            const focusIndex = Math.min(pasted.length, length) - 1
            refs.current[focusIndex]?.focus()
          }}
        />
      ))}
    </div>
  )
}
