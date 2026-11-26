import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { UserInternalNote } from '@/features/users/types/users.types'

type UserDetailNotesProps = {
  initialNotes: readonly UserInternalNote[]
}

export function UserDetailNotes({ initialNotes }: UserDetailNotesProps) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<UserInternalNote[]>(() =>
    initialNotes.map((note) => ({ ...note })),
  )
  const [draft, setDraft] = useState('')

  const addNote = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setNotes((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorInitials: 'AD',
        authorNameKey: 'currentAdmin',
        dateKey: 'today',
        bodyKey: trimmed,
      },
    ])
    setDraft('')
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="px-4 pt-4 pb-2 sm:px-5">
        <CardTitle className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t('users.detail.internalNotesTitle')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('users.detail.internalNotesHint')}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 pb-4 sm:px-5">
        {notes.map((note) => (
          <article key={note.id} className="flex gap-2.5">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
              aria-hidden="true"
            >
              {note.authorInitials}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold text-foreground">
                {t(`users.admins.${note.authorNameKey}`)}{' '}
                <span className="font-normal text-muted-foreground">
                  · {t(`users.detail.noteDates.${note.dateKey}`)}
                </span>
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {note.id.startsWith('local-')
                  ? note.bodyKey
                  : t(`users.detail.noteBodies.${note.bodyKey}`)}
              </p>
            </div>
          </article>
        ))}

        <div className="flex gap-2 pt-1">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('users.detail.addNotePlaceholder')}
            className="h-9 flex-1"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addNote()
              }
            }}
          />
          <Button type="button" size="sm" className="h-9 shrink-0" onClick={addNote}>
            {t('users.detail.addNote')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
