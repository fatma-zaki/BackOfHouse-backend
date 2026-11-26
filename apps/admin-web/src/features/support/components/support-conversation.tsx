import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormSkeleton } from '@/components/shared/form-skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type {
  SupportAssignee,
  SupportMessage,
  SupportQuickReply,
  SupportTicket,
} from '@/features/support/types/support.types'

type SupportConversationProps = {
  ticket: SupportTicket | null
  isLoading?: boolean
  assignees: readonly SupportAssignee[]
  assigneeId: string | null
  onAssigneeChange: (assigneeId: string | null) => void
  quickReplies: readonly SupportQuickReply[]
  reply: string
  onReplyChange: (value: string) => void
  extraMessages: readonly SupportMessage[]
  onQuickReply: (bodyKey: string) => void
  onSend: () => void
  onSendAndSolve: () => void
  onClose: () => void
}

function MessageBubble({
  message,
}: {
  message: SupportMessage
}) {
  const { t } = useTranslation()

  if (message.kind === 'system') {
    return (
      <div className="flex justify-center py-2">
        <p className="max-w-md rounded-full bg-primary/10 px-4 py-1.5 text-center text-[11px] font-medium text-primary">
          {t(`support.messages.${message.bodyKey}`)}
        </p>
      </div>
    )
  }

  const isAgent = message.kind === 'agent'

  return (
    <div
      className={cn(
        'flex max-w-[85%] flex-col gap-1',
        isAgent ? 'ms-auto items-end' : 'items-start',
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
          isAgent
            ? 'rounded-ee-md bg-primary text-primary-foreground'
            : 'rounded-es-md border border-border bg-card text-foreground',
        )}
      >
        {message.bodyText ?? t(`support.messages.${message.bodyKey}`)}
      </div>
      {message.authorKey && message.timeKey ? (
        <span className="px-1 text-[10px] text-muted-foreground">
          {t(`support.authors.${message.authorKey}`)} ·{' '}
          {t(`support.times.${message.timeKey}`)}
        </span>
      ) : null}
    </div>
  )
}

export function SupportConversation({
  ticket,
  isLoading = false,
  assignees,
  assigneeId,
  onAssigneeChange,
  quickReplies,
  reply,
  onReplyChange,
  extraMessages,
  onQuickReply,
  onSend,
  onSendAndSolve,
  onClose,
}: SupportConversationProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card className="flex min-h-[32rem] min-w-0 flex-col overflow-hidden shadow-sm">
        <CardContent className="flex flex-col gap-3 border-b border-border p-4">
          <SkeletonRegion label={t('support.states.loading')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-7 w-4/5 max-w-md" />
                <Skeleton className="h-3 w-2/3 max-w-sm" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </SkeletonRegion>
        </CardContent>

        <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <Skeleton className="h-16 w-[72%] max-w-md rounded-2xl rounded-es-md" />
          <Skeleton className="ms-auto h-14 w-[58%] max-w-sm rounded-2xl rounded-ee-md" />
          <Skeleton className="h-12 w-[65%] max-w-md rounded-2xl rounded-es-md" />
          <Skeleton className="ms-auto h-16 w-[48%] max-w-xs rounded-2xl rounded-ee-md" />
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border p-4">
          <FormSkeleton fields={1} showActions lastFieldTall={false} />
        </CardFooter>
      </Card>
    )
  }

  if (!ticket) {
    return (
      <Card className="flex min-h-[32rem] min-w-0 items-center justify-center shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('support.states.pickTicket')}
        </p>
      </Card>
    )
  }

  const assignee = assignees.find((a) => a.id === assigneeId)
  const assignLabel = assignee
    ? t('support.actions.assignTo', {
        name: t(`support.assignees.${assignee.nameKey}`),
      })
    : t('support.actions.assign')

  const allMessages = [...ticket.messages, ...extraMessages]
  const isClosed = ticket.status === 'closed'

  return (
    <Card className="flex min-h-[32rem] min-w-0 flex-col overflow-hidden shadow-sm ring-1 ring-primary/10">
      <CardContent className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {t(`support.subjects.${ticket.subjectKey}`)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('support.meta.opened', {
                sender: t(`support.senders.${ticket.senderNameKey}`),
                when: t(`support.age.${ticket.openedAgoKey}`),
                number: ticket.number,
              })}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs font-bold"
                  disabled={isClosed}
                >
                  {assignLabel}
                  <ChevronDown
                    data-icon="inline-end"
                    className="size-3"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {assignees.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="text-[13px] font-bold"
                    onClick={() =>
                      onAssigneeChange(
                        option.id === 'unassigned' ? null : option.id,
                      )
                    }
                  >
                    {t(`support.assignees.${option.nameKey}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-4 text-xs font-bold"
              disabled={isClosed}
              onClick={onClose}
            >
              {t('support.actions.close')}
            </Button>
          </div>
        </div>
      </CardContent>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {allMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t('support.states.noMessages')}
          </p>
        ) : (
          allMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </CardContent>

      {!isClosed ? (
        <CardFooter className="flex flex-col gap-3 border-t border-border p-4">
          <div className="flex flex-wrap gap-1.5">
            {quickReplies.map((chip) => (
              <Button
                key={chip.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2.5 text-[11px] font-bold"
                onClick={() => onQuickReply(chip.bodyKey)}
              >
                {t(`support.quickReplies.${chip.labelKey}`)}
              </Button>
            ))}
          </div>
          <Input
            value={reply}
            onChange={(event) => onReplyChange(event.target.value)}
            placeholder={t('support.reply.placeholder')}
            className="h-10 rounded-xl"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                onSend()
              }
            }}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={onSend}
            >
              {t('support.actions.send')}
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full px-4"
              onClick={onSendAndSolve}
            >
              {t('support.actions.sendAndSolve')}
            </Button>
          </div>
        </CardFooter>
      ) : (
        <CardFooter className="border-t border-border p-4">
          <p className="w-full text-center text-sm text-muted-foreground">
            {t('support.states.closedTicket')}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
