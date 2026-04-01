'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, Trash2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { useApiKeyStatus, useSaveApiKey, useRemoveApiKey } from '@/hooks/use-settings'

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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
          <Key className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              OpenAI API Key
            </h3>
            {!isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasKey ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {hasKey ? 'Configured' : 'Not set'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
          <div className="flex items-start gap-2 rounded-md bg-gray-50 p-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <p className="text-xs text-gray-500">
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

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and application preferences.
        </p>
      </div>

      {/* AI Configuration */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          AI Configuration
        </h2>
        <ApiKeySection />
      </section>
    </div>
  )
}
