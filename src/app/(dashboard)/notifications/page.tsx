'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Clock,
  AlertTriangle,
  Flame,
  Brain,
  FileText,
  RefreshCw,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useGenerateNotifications,
  type NotificationItem,
} from '@/hooks/use-notifications'

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'due_today':
      return <Clock className="h-5 w-5 text-blue-500" />
    case 'overdue':
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    case 'habit_reminder':
      return <Flame className="h-5 w-5 text-orange-500" />
    case 'flashcard_review':
      return <Brain className="h-5 w-5 text-purple-500" />
    case 'daily_review':
      return <FileText className="h-5 w-5 text-green-500" />
    default:
      return <Clock className="h-5 w-5 text-gray-500" />
  }
}

function getNavigationPath(notification: NotificationItem): string | null {
  switch (notification.relatedEntity) {
    case 'task':
      return '/tasks'
    case 'habit':
      return '/habits'
    case 'deck':
      return notification.relatedId
        ? `/flashcards/${notification.relatedId}`
        : '/flashcards'
    case 'review':
      return '/reviews'
    default:
      return null
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data, isLoading } = useNotifications(filter === 'unread')
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const generate = useGenerateNotifications()

  const notifications = data?.items ?? []

  const handleClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id)
    }
    const path = getNavigationPath(notification)
    if (path) {
      router.push(path)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${generate.isPending ? 'animate-spin' : ''}`}
            />
            Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread
        </button>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-white">
        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet. Click "Generate" to check for new ones.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? 'bg-indigo-50/40' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-700'
                      }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {notification.body}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {getTimeAgo(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      markRead.mutate(notification.id)
                    }}
                  >
                    Mark read
                  </Button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
