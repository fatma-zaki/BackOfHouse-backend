import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/error-state'
import { SupportConversation } from '@/features/support/components/support-conversation'
import { SupportHeader } from '@/features/support/components/support-header'
import { SupportTicketList } from '@/features/support/components/support-ticket-list'
import { SupportUserSidebar } from '@/features/support/components/support-user-sidebar'
import { useSupportInbox } from '@/features/support/hooks/use-support-inbox'
import {
  countSupportByTab,
  filterSupportTickets,
} from '@/features/support/lib/filter-support-tickets'
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketTab,
} from '@/features/support/types/support.types'

type TicketOverride = {
  status?: SupportTicket['status']
  assigneeId?: string | null
  extraMessages?: SupportMessage[]
}

export function SupportDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useSupportInbox()

  const [tab, setTab] = useState<SupportTicketTab>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [overrides, setOverrides] = useState<Record<string, TicketOverride>>({})

  const tickets = useMemo(() => {
    const base = data?.tickets ?? []
    return base.map((ticket) => {
      const patch = overrides[ticket.id]
      if (!patch) return ticket
      const { extraMessages: _ignored, ...rest } = patch
      return { ...ticket, ...rest }
    })
  }, [data?.tickets, overrides])

  const currentAgentId = data?.currentAgentId ?? ''

  const tabCounts = useMemo(
    () => countSupportByTab(tickets, currentAgentId),
    [tickets, currentAgentId],
  )

  const visibleTickets = useMemo(() => {
    if (!data) return []
    return filterSupportTickets(tickets, tab, currentAgentId)
  }, [tickets, tab, data, currentAgentId])

  const selected =
    visibleTickets.find((ticket) => ticket.id === selectedId) ??
    visibleTickets[0] ??
    null

  const effectiveSelectedId = selected?.id ?? null

  const assigneeId =
    selected && overrides[selected.id]?.assigneeId !== undefined
      ? overrides[selected.id].assigneeId ?? null
      : selected?.assigneeId ?? null

  const extraMessages = selected
    ? (overrides[selected.id]?.extraMessages ?? [])
    : []

  const patchTicket = (id: string, patch: TicketOverride) => {
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
        extraMessages: patch.extraMessages
          ? [...(prev[id]?.extraMessages ?? []), ...patch.extraMessages]
          : prev[id]?.extraMessages,
      },
    }))
  }

  const appendAgentMessage = (ticketId: string, body: string) => {
    const message: SupportMessage = {
      id: `local-${Date.now()}`,
      kind: 'agent',
      bodyKey: '',
      bodyText: body,
      authorKey: 'nora',
      timeKey: 'now',
    }
    patchTicket(ticketId, {
      extraMessages: [message],
    })
  }

  const handleSend = () => {
    if (!selected || !reply.trim()) {
      toast.warning(t('support.toasts.replyRequired'))
      return
    }
    appendAgentMessage(selected.id, reply.trim())
    setReply('')
    toast.message(t('support.toasts.sent'))
  }

  const handleSendAndSolve = () => {
    if (!selected || !reply.trim()) {
      toast.warning(t('support.toasts.replyRequired'))
      return
    }
    appendAgentMessage(selected.id, reply.trim())
    patchTicket(selected.id, { status: 'closed' })
    setReply('')
    setSelectedId(null)
    toast.success(t('support.toasts.sentAndSolved'))
  }

  const handleClose = () => {
    if (!selected) return
    patchTicket(selected.id, { status: 'closed' })
    setSelectedId(null)
    toast.message(t('support.toasts.closed'))
  }

  const handleAssigneeChange = (nextAssigneeId: string | null) => {
    if (!selected) return
    patchTicket(selected.id, { assigneeId: nextAssigneeId })
    toast.message(t('support.toasts.assigned'))
  }

  const handleQuickReply = (bodyKey: string) => {
    setReply(t(`support.messages.${bodyKey}`))
  }

  return (
    <div className="flex flex-col gap-4">
      <SupportHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('support.states.errorTitle')}
          description={t('support.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,15rem)]">
          <SupportTicketList
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
            tabCounts={tabCounts}
            tickets={visibleTickets}
            selectedId={effectiveSelectedId}
            isLoading={isPending}
            onSelect={(id) => {
              setSelectedId(id)
              setReply('')
            }}
          />

          <SupportConversation
            ticket={selected}
            isLoading={isPending}
            assignees={data?.assignees ?? []}
            assigneeId={assigneeId}
            onAssigneeChange={handleAssigneeChange}
            quickReplies={data?.quickReplies ?? []}
            reply={reply}
            onReplyChange={setReply}
            extraMessages={extraMessages}
            onQuickReply={handleQuickReply}
            onSend={handleSend}
            onSendAndSolve={handleSendAndSolve}
            onClose={handleClose}
          />

          <SupportUserSidebar
            requester={selected?.requester ?? null}
            related={selected?.related ?? []}
            isLoading={isPending}
            onOpenProfile={() => {
              toast.message(t('support.toasts.openProfile'))
            }}
            onAdjustPoints={() => {
              toast.message(t('support.toasts.adjustPoints'))
            }}
          />
        </div>
      )}
    </div>
  )
}
