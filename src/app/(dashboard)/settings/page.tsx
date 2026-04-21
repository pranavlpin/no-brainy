'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, Trash2, Shield, Bell, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { SidebarOrderSettings } from '@/components/settings/sidebar-order'
import {
  useApiKeyStatus,
  useSaveApiKey,
  useRemoveApiKey,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
} from '@/hooks/use-settings'

function ApiKeySection() {
  const { data: status, isLoading } = useApiKeyStatus()
  const saveKey = useSaveApiKey()
  const removeKey = useRemoveApiKey()

  const [showModal, setShowModal] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')

  const hasKey = status?.hasKey ?? false

  const handleSave = async () => {
    if (!keyInput.trim()) {
      setError('Please enter an API key.')
      return
    }
    if (!keyInput.startsWith('sk-')) {
      setError('Invalid key format. Must start with sk-')
      return
    }
    setError('')
    try {
      await saveKey.mutateAsync(keyInput)
      setKeyInput('')
      setShowModal(false)
    } catch {
      setError('Failed to save API key. Please try again.')
    }
  }

  const handleRemove = async () => {
    try {
      await removeKey.mutateAsync()
      setShowRemoveConfirm(false)
    } catch {
      // silent fail - query will reflect actual state
    }
  }

  return (
    <div className="rounded-lg border border-retro-dark/15 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-retro-blue/10">
          <Key className="h-5 w-5 text-retro-blue" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-retro-dark">
              OpenAI API Key
            </h3>
            {!isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasKey ? 'bg-green-500' : 'bg-retro-dark/40'
                  }`}
                />
                {hasKey ? 'Configured' : 'Not set'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-retro-dark/60">
            Your API key is encrypted and stored securely. It&apos;s used only
            for AI features like note summarization, flashcard generation, and
            task prioritization.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setKeyInput('')
                setError('')
                setShowKey(false)
                setShowModal(true)
              }}
            >
              {hasKey ? 'Update Key' : 'Add Key'}
            </Button>
            {hasKey && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowRemoveConfirm(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Remove Key
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add / Update Key Modal */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        title={hasKey ? 'Update OpenAI API Key' : 'Add OpenAI API Key'}
        description="Enter your OpenAI API key. It will be encrypted before being stored."
        confirmLabel="Save Key"
        onConfirm={handleSave}
      >
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value)
                setError('')
              }}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-retro-dark/40 hover:text-retro-dark/60"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-start gap-2 rounded-md bg-retro-blue/5 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-retro-dark/40" />
            <p className="text-xs text-retro-dark/60">
              Your key is encrypted with AES-256-GCM and never sent to our
              servers unencrypted. It is only used server-side to make API calls
              on your behalf.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Remove API Key"
        description="Are you sure you want to remove your OpenAI API key? AI features will be disabled until you add a new key."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemove}
      />
    </div>
  )
}

const NOTIF_TOGGLE_ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'dueTasks', label: 'Due task reminders', description: 'Get notified about tasks due today' },
  { key: 'overdueTasks', label: 'Overdue task alerts', description: 'Get alerted about tasks past their due date' },
  { key: 'habitReminders', label: 'Habit reminders', description: 'Remind you about habits not yet logged today' },
  { key: 'flashcardReminders', label: 'Flashcard review reminders', description: 'Notify when flashcards are due for review' },
  { key: 'dailyReviewReminders', label: 'Daily review reminders', description: 'Remind you to complete your daily review' },
]

function NotificationPreferencesSection() {
  const { data: prefs, isLoading } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return
    updatePrefs.mutate({ [key]: !prefs[key] })
  }

  return (
    <div className="rounded-lg border border-retro-dark/15 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-retro-blue/10">
          <Bell className="h-5 w-5 text-retro-blue" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-retro-dark">
            Notification Preferences
          </h3>
          <p className="mt-1 text-sm text-retro-dark/60">
            Choose which types of notifications you want to receive.
          </p>

          {isLoading ? (
            <div className="mt-4 text-sm text-retro-dark/40">Loading...</div>
          ) : (
            <div className="mt-4 space-y-4">
              {NOTIF_TOGGLE_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-retro-dark">
                      {item.label}
                    </p>
                    <p className="text-xs text-retro-dark/60">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs?.[item.key] ?? true}
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-retro-blue focus:ring-offset-2 ${
                      prefs?.[item.key] !== false ? 'bg-retro-blue' : 'bg-retro-dark/5'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        prefs?.[item.key] !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-retro-dark">Settings</h1>
        <p className="mt-1 text-sm text-retro-dark/60">
          Manage your account and application preferences.
        </p>
      </div>

      {/* AI Configuration */}
      <section>
        <h2 className="font-display mb-4 text-lg font-semibold text-retro-dark">
          AI Configuration
        </h2>
        <ApiKeySection />
      </section>

      {/* Sidebar Order */}
      <section>
        <h2 className="font-display mb-4 text-lg font-semibold text-retro-dark">
          Sidebar
        </h2>
        <SidebarOrderSettings />
      </section>

      {/* Notification Preferences */}
      <section>
        <h2 className="font-display mb-4 text-lg font-semibold text-retro-dark">
          Notifications
        </h2>
        <NotificationPreferencesSection />
      </section>
    </div>
  )
}
