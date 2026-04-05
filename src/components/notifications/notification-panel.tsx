'use client'

import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, Flame, Brain, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
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
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'habit_reminder':
      return <Flame className="h-4 w-4 text-orange-500" />
    case 'flashcard_review':
      return <Brain className="h-4 w-4 text-purple-500" />
    case 'daily_review':
      return <FileText className="h-4 w-4 text-green-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

function getNavigationPath(notification: NotificationItem): string | null {
  switch (notification.relatedEntity) {
    case 'task':
      return '/tasks'
    case 'habit':
      return '/habits'
    case 'deck':
      return notification.relatedId ? `/flashcards/${notification.relatedId}` : '/flashcards'
    case 'review':
      return '/reviews'
    default:
      return null
  }
}

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter()
  const { data, isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const notifications = data?.items?.slice(0, 10) ?? []
  const hasUnread = notifications.some((n) => !n.isRead)

  const handleClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id)
    }
    const path = getNavigationPath(notification)
    if (path) {
      router.push(path)
      onClose()
    }
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-white shadow-lg sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'bg-indigo-50/50' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-600 truncate">
                  {notification.body}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {getTimeAgo(notification.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-indigo-600 hover:text-indigo-800"
            onClick={() => {
              router.push('/notifications')
              onClose()
            }}
          >
            View All
          </Button>
        </div>
      )}
    </div>
  )
}
