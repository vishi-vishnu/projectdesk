import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { roleLabel } from '@/components/layout/nav'
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Select } from '@/components/ui'
import { useProfile } from '@/context/auth-context'
import { DEPARTMENTS } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { changePassword, updateOwnProfile } from '@/services/users'
import { errorMessage } from '@/pages/auth/errors'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  department: z.string().min(1),
  regNo: z.string().trim().max(30).optional(),
  designation: z.string().trim().max(60).optional(),
})
type Values = z.infer<typeof schema>

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password.'),
    next: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: "The passwords don't match." })
  .refine((v) => v.next !== v.current, { path: ['next'], message: 'Choose a password you have not used here.' })
type PasswordValues = z.infer<typeof passwordSchema>

function PasswordCard() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: '', next: '', confirm: '' },
  })

  const onSubmit = async (v: PasswordValues) => {
    try {
      await changePassword(v.current, v.next)
      reset()
      toast.success('Password changed')
    } catch (e) {
      const message = errorMessage(e)
      if (message === 'The email or password is incorrect.') {
        setError('current', { message: 'Your current password is not correct.' })
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <Card>
      <CardHeader title="Password" description="You need your current password to set a new one." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-label="Change password">
          <Field label="Current password" error={errors.current?.message}>
            {(p) => <Input {...p} type="password" autoComplete="current-password" {...register('current')} />}
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
            <Field label="New password" error={errors.next?.message}>
              {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('next')} />}
            </Field>
            <Field label="Confirm new password" error={errors.confirm?.message}>
              {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('confirm')} />}
            </Field>
          </div>
          <div className="flex justify-end border-t border-line pt-4">
            <Button type="submit" loading={isSubmitting}>
              Change password
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export function ProfilePage() {
  const profile = useProfile()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: profile.name,
      department: profile.department,
      regNo: profile.regNo ?? '',
      designation: profile.designation ?? '',
    },
  })

  const onSubmit = async (v: Values) => {
    try {
      const data =
        profile.role === 'student'
          ? { name: v.name, department: v.department, regNo: v.regNo ?? '' }
          : { name: v.name, department: v.department, designation: v.designation ?? '' }
      await updateOwnProfile(profile.uid, data)
      reset(v)
      toast.success('Profile updated')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const departments = DEPARTMENTS.includes(profile.department as (typeof DEPARTMENTS)[number])
    ? DEPARTMENTS
    : [profile.department, ...DEPARTMENTS]

  return (
    <>
      <PageHeader title="Profile" />
      <div className="grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <CardBody className="flex flex-col items-center py-6 text-center">
            <Avatar name={profile.name} size={64} />
            <p className="mt-3 font-semibold">{profile.name}</p>
            <p className="text-[13px] text-ink-3">{roleLabel[profile.role]}</p>
            <p className="mt-3 text-[12.5px] break-all text-ink-3">{profile.email}</p>
            <p className="mt-1 text-[12px] text-ink-3">Member since {formatDate(profile.createdAt, 'MMM yyyy')}</p>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" description="Your email can't be changed here." />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Field label="Full name" error={errors.name?.message}>
                  {(p) => <Input {...p} {...register('name')} />}
                </Field>
                <Field label="Department">
                  {(p) => (
                    <Select {...p} {...register('department')}>
                      {departments.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                {profile.role === 'student' ? (
                  <Field label="Register number">{(p) => <Input {...p} {...register('regNo')} />}</Field>
                ) : (
                  <Field label="Designation" optional>
                    {(p) => <Input {...p} {...register('designation')} />}
                  </Field>
                )}
                <div className="flex justify-end border-t border-line pt-4">
                  <Button type="submit" variant="primary" loading={isSubmitting} disabled={!isDirty}>
                    Save changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <PasswordCard />
        </div>
      </div>
    </>
  )
}
