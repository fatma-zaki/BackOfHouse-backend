import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type SettingsPanelProps = {
  title: string
  subtitle: string
  children: ReactNode
  id?: string
  flush?: boolean
}

export function SettingsPanel({
  title,
  subtitle,
  children,
  id,
  flush = false,
}: SettingsPanelProps) {
  return (
    <Card id={id} className="min-w-0 gap-0 py-0 shadow-sm">
      <CardHeader className="gap-1 px-4 py-4">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className={flush ? 'px-0 pb-0' : 'px-4 pb-4'}>
        {children}
      </CardContent>
    </Card>
  )
}
