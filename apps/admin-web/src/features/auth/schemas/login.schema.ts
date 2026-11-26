import { z } from 'zod'

type Translate = (key: string) => string

const WORK_EMAIL = /^[^\s@]+@backofhouse\.sa$/i

export function createLoginSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .min(1, { message: t('login.errors.emailRequired') })
      .email({ message: t('login.errors.emailInvalid') })
      .refine((value) => WORK_EMAIL.test(value.trim()), {
        message: t('login.errors.emailDomain'),
      }),
    password: z
      .string()
      .min(1, { message: t('login.errors.passwordRequired') })
      .min(8, { message: t('login.errors.passwordMin') }),
    otp: z
      .string()
      .min(1, { message: t('login.errors.otpRequired') })
      .regex(/^\d{6}$/, { message: t('login.errors.otpInvalid') }),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
