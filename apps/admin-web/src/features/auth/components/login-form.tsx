import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { OtpInput } from '@/features/auth/components/otp-input'
import { useMockLogin } from '@/features/auth/hooks/use-mock-login'
import {
  createLoginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const { t } = useTranslation()
  const { isSubmitting, formError, clearFormError, submitLogin } =
    useMockLogin()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
      otp: '',
    },
    mode: 'onSubmit',
  })

  const emailValue = watch('email')

  const onSubmit = handleSubmit(async (values) => {
    await submitLogin(values)
  })

  const clearErrorOnChange = () => {
    if (formError) clearFormError()
  }

  return (
    <form
      className="flex w-full max-w-[400px] flex-col gap-4"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="space-y-1.5">
        <h2 className="text-[1.7rem] font-bold tracking-tight text-[#1A1A2E] sm:text-[1.85rem]">
          {t('login.title')}
        </h2>
        <p className="text-sm leading-snug text-[#6B7280]">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label
            htmlFor="login-email"
            className="text-sm font-bold text-[#374151]"
          >
            {t('login.fields.email')}
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            dir="ltr"
            placeholder={t('login.fields.emailPlaceholder')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className="h-[48px] rounded-[14px] border-[#E5E7EB] bg-white px-4 text-base text-[#1A1A2E] shadow-none placeholder:text-[#9CA3AF] focus-visible:border-[#6437FA] focus-visible:ring-[#6437FA]/20 md:text-sm"
            {...register('email', {
              onChange: clearErrorOnChange,
            })}
          />
          {errors.email ? (
            <p
              id="login-email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="login-password"
              className="text-sm font-bold text-[#374151]"
            >
              {t('login.fields.password')}
            </Label>
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-xs font-bold text-[#6437FA] hover:underline"
              onClick={() => {
                toast.info(
                  t('login.forgotPasswordToast', {
                    email: emailValue.trim() || t('login.fields.emailPlaceholder'),
                  }),
                )
              }}
            >
              {t('login.forgotPassword')}
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'login-password-error' : undefined
            }
            className="h-[48px] rounded-[14px] border-[#E5E7EB] bg-white px-4 text-base text-[#1A1A2E] shadow-none placeholder:text-[#9CA3AF] focus-visible:border-[#6437FA] focus-visible:ring-[#6437FA]/20 md:text-sm"
            {...register('password', {
              onChange: clearErrorOnChange,
            })}
          />
          {errors.password ? (
            <p
              id="login-password-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="login-otp"
            className="text-sm font-bold text-[#374151]"
          >
            {t('login.fields.otp')}
          </Label>
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <OtpInput
                id="login-otp"
                value={field.value}
                onChange={(next) => {
                  field.onChange(next)
                  clearErrorOnChange()
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.otp)}
                aria-describedby={
                  errors.otp
                    ? 'login-otp-error'
                    : 'login-otp-hint'
                }
              />
            )}
          />
          <p id="login-otp-hint" className="text-xs text-[#6B7280]">
            {t('login.fields.otpHint')}
          </p>
          {errors.otp ? (
            <p
              id="login-otp-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.otp.message}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-[50px] w-full rounded-full bg-[#6437FA] text-base font-bold text-white shadow-[0_12px_28px_-6px_rgba(100,55,250,0.55)] hover:bg-[#6437FA]/90"
      >
        {isSubmitting ? t('login.submitting') : t('login.submit')}
      </Button>

      <div className="flex items-start gap-2.5 rounded-[14px] border border-[#E5E7EB] bg-[#F0F0F5] px-3.5 py-3 text-xs leading-relaxed text-[#6B7280]">
        <Lock
          className="mt-0.5 size-3.5 shrink-0 stroke-[1.8] text-[#6437FA]"
          aria-hidden="true"
        />
        <p>{t('login.auditNote')}</p>
      </div>
    </form>
  )
}
