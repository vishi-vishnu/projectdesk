import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, ErrorNote, Field, Input } from '@/components/ui'
import { resetPassword, signIn } from '@/services/users'
import { AuthLayout } from './AuthLayout'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { errorMessage } from './errors'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})
type Values = z.infer<typeof schema>

export const DEMO_PASSWORD = 'Demo@1234'
const demoAccounts = [
  { label: 'Coordinator', email: 'coordinator@demo.projectdesk.app' },
  { label: 'Faculty guide', email: 'meena@demo.projectdesk.app' },
  { label: 'Student (team lead)', email: 'arjun@demo.projectdesk.app' },
]

export function Login() {
  useDocumentTitle('Sign in')
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: Values) => {
    setError(null)
    try {
      await signIn(values.email, values.password)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const onForgot = async () => {
    const email = getValues('email')
    if (!email) return setError('Enter your email above, then choose "Forgot password".')
    try {
      await resetPassword(email)
      toast.success('If an account exists for that email, a reset link is on its way.')
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-[22px] font-semibold tracking-[-0.015em]">Sign in</h1>
      <p className="mt-1 text-[14px] text-ink-3">Use your college email to continue.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        {error && <ErrorNote title="Couldn't sign you in">{error}</ErrorNote>}
        <Field label="Email" error={errors.email?.message}>
          {(p) => <Input type="email" autoComplete="email" placeholder="name@college.edu" {...p} {...register('email')} />}
        </Field>
        <Field label="Password" error={errors.password?.message}>
          {(p) => <Input type="password" autoComplete="current-password" {...p} {...register('password')} />}
        </Field>
        <div className="flex justify-end">
          <button type="button" onClick={onForgot} className="text-[13px] text-brand hover:underline">
            Forgot password?
          </button>
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-[13.5px] text-ink-3">
        New here?{' '}
        <Link to="/register" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>

      {import.meta.env.VITE_DEMO_ACCOUNTS === 'true' && (
        <div className="mt-8 rounded-md border border-line bg-subtle p-3">
          <p className="text-[12px] font-medium text-ink-2">Demo accounts</p>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Password for all: <span className="font-mono text-ink-2">{DEMO_PASSWORD}</span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {demoAccounts.map((a) => (
              <Button
                key={a.email}
                size="sm"
                onClick={() => {
                  setValue('email', a.email)
                  setValue('password', DEMO_PASSWORD)
                  void handleSubmit(onSubmit)()
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
