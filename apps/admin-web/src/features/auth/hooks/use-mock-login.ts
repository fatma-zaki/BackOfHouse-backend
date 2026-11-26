import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/app/providers/session'
import { mockLogin } from '@/features/auth/lib/mock-auth'
import { ROLE_HOME } from '@/features/auth/lib/roles'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'

type UseMockLoginResult = {
  isSubmitting: boolean
  formError: string | null
  clearFormError: () => void
  submitLogin: (values: LoginFormValues) => Promise<boolean>
}

/**
 * Demo-only mock login submit helper.
 * Not production authentication.
 */
export function useMockLogin(): UseMockLoginResult {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { role } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const clearFormError = () => {
    setFormError(null)
  }

  const submitLogin = async (values: LoginFormValues): Promise<boolean> => {
    setIsSubmitting(true)
    setFormError(null)

    try {
      // OTP is validated by Zod only in this demo wave — not a real 2FA check.
      const result = mockLogin(values.email, values.password)

      if (!result.ok) {
        setFormError(t('login.errors.mockDisabled'))
        return false
      }

      navigate(ROLE_HOME[role], { replace: true })
      return true
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    formError,
    clearFormError,
    submitLogin,
  }
}
