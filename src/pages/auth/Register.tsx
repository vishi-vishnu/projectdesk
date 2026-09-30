import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Presentation } from 'lucide-react'
import { Button, cn, ErrorNote, Field, Input, Select } from '@/components/ui'
import { DEPARTMENTS } from '@/lib/constants'
import { registerAccount } from '@/services/users'
import { AuthLayout } from './AuthLayout'
import { errorMessage } from './errors'

const schema = z
  .object({
    role: z.enum(['student', 'faculty']),
    name: z.string().trim().min(2, 'Enter your full name.').max(80),
    email: z.string().trim().email('Enter a valid email address.'),
    department: z.string().min(1, 'Choose your department.'),
    regNo: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    password: z.string().min(8, 'Use at least 8 characters.'),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'student' && !v.regNo) {
      ctx.addIssue({ code: 'custom', path: ['regNo'], message: 'Enter your register number.' })
    }
  })
type Values = z.infer<typeof schema>

export function Register() {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: 'student', department: '' } })
  const role = watch('role')

  const onSubmit = async (values: Values) => {
    setError(null)
    try {
      await registerAccount(values)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const roles = [
    { value: 'student' as const, label: 'Student', icon: GraduationCap },
    { value: 'faculty' as const, label: 'Faculty', icon: Presentation },
  ]

  return (
    <AuthLayout>
      <h1 className="text-[22px] font-semibold tracking-[-0.015em]">Create your account</h1>
      <p className="mt-1 text-[14px] text-ink-3">
        {role === 'faculty'
          ? 'Faculty accounts are activated once the project coordinator approves them.'
          : 'Register to form or join your project team.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        {error && <ErrorNote title="Couldn't create your account">{error}</ErrorNote>}

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-ink-2">I am a</legend>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={role === r.value}
                onClick={() => setValue('role', r.value)}
                className={cn(
                  'flex h-10 items-center justify-center gap-2 rounded-md border text-[13.5px] font-medium transition-colors',
                  role === r.value
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line-strong bg-surface text-ink-2 hover:bg-subtle',
                )}
              >
                <r.icon className="size-4" aria-hidden />
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Full name" error={errors.name?.message}>
          {(p) => <Input autoComplete="name" {...p} {...register('name')} />}
        </Field>
        <Field label="College email" error={errors.email?.message}>
          {(p) => <Input type="email" autoComplete="email" placeholder="name@college.edu" {...p} {...register('email')} />}
        </Field>
        <Field label="Department" error={errors.department?.message}>
          {(p) => (
            <Select {...p} {...register('department')}>
              <option value="" disabled>
                Select department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          )}
        </Field>
        {role === 'student' ? (
          <Field label="Register number" error={errors.regNo?.message}>
            {(p) => <Input placeholder="e.g. 910021106042" {...p} {...register('regNo')} />}
          </Field>
        ) : (
          <Field label="Designation" optional error={errors.designation?.message}>
            {(p) => <Input placeholder="e.g. Assistant Professor" {...p} {...register('designation')} />}
          </Field>
        )}
        <Field label="Password" hint="At least 8 characters." error={errors.password?.message}>
          {(p) => <Input type="password" autoComplete="new-password" {...p} {...register('password')} />}
        </Field>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-[13.5px] text-ink-3">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
