import { zodResolver } from '@hookform/resolvers/zod'
import type { ChangeEvent } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  createWorkspaceSchema,
  slugify,
  type CreateWorkspaceFormValues,
  type CreateWorkspaceInput,
} from '@nexus/shared'
import { TextField } from '@/components/form/text-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { createWorkspace } from '@/lib/fake-api'
import { applyServerErrors } from '@/lib/form'

const PLANS = [
  { value: 'free', label: 'Miễn phí', desc: '1 thành viên, 100 câu hỏi/tháng' },
  { value: 'team', label: 'Nhóm', desc: 'Không giới hạn thành viên, có phân quyền' },
] as const

type Props = {
  onCreated: (ws: { id: string; name: string }) => void
  onCancel: () => void
}

export function CreateWorkspaceForm({ onCreated, onCancel }: Props) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isSubmitted, dirtyFields },
  } = useForm<CreateWorkspaceFormValues, unknown, CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    mode: 'onTouched',
    defaultValues: { name: '', slug: '', plan: 'free', description: '' },
  })

  // Theo dõi giá trị để hiển thị (xem trước đường dẫn, đếm ký tự)
  const slug = useWatch({ control, name: 'slug' })
  const description = useWatch({ control, name: 'description' })

  // Gõ tên → gợi ý slug, NHƯNG chỉ khi user chưa tự sửa slug.
  // Đặt trong onChange (event handler), không dùng useEffect — S1.2 bài 2.
  const nameField = register('name', {
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      if (!dirtyFields.slug) {
        setValue('slug', slugify(e.target.value), { shouldValidate: isSubmitted })
      }
    },
  })

  async function onSubmit(values: CreateWorkspaceInput) {
    const result = await createWorkspace(values)
    if (result.ok) {
      onCreated(result.data)
      return
    }
    applyServerErrors(result, setError)
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
      <FieldGroup className="gap-5">
        <TextField id="ws-name" label="Tên workspace" placeholder="Phin Roasters Đà Lạt" error={errors.name} {...nameField} />
        <TextField
          id="ws-slug"
          label="Đường dẫn"
          description={`Địa chỉ: nexus.app/${slug || '…'}`}
          error={errors.slug}
          {...register('slug')}
        />

        <Controller
          name="plan"
          control={control}
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">Gói</FieldLegend>
              <RadioGroup name={field.name} value={field.value} onValueChange={field.onChange} ref={field.ref}>
                {PLANS.map((p) => (
                  <Field key={p.value} orientation="horizontal">
                    <RadioGroupItem value={p.value} id={`plan-${p.value}`} />
                    <FieldContent>
                      <FieldLabel htmlFor={`plan-${p.value}`}>{p.label}</FieldLabel>
                      <FieldDescription>{p.desc}</FieldDescription>
                    </FieldContent>
                  </Field>
                ))}
              </RadioGroup>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="ws-desc">Mô tả (không bắt buộc)</FieldLabel>
          <Textarea
            id="ws-desc"
            rows={3}
            aria-invalid={!!errors.description}
            aria-describedby="ws-desc-count ws-desc-error"
            {...register('description')}
          />
          <FieldDescription id="ws-desc-count">{description.length}/200 ký tự</FieldDescription>
          <FieldError id="ws-desc-error" errors={[errors.description]} />
        </Field>
      </FieldGroup>

      {errors.root?.server && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner aria-hidden="true" /> Đang tạo…
            </>
          ) : (
            'Tạo workspace'
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Huỷ
        </Button>
      </div>
    </form>
  )
}
