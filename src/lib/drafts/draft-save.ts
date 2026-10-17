/**
 * Serialized, version-checked autosave queue.
 *
 * Ported from the owner's acceptance branch (`test/product-final-acceptance`,
 * NB-03) and adapted. Local drafts survive network failures and reloads; a
 * remote change while a draft exists becomes an explicit conflict that the
 * user resolves, never a silent overwrite.
 */

export type SaveState = 'saved' | 'pending' | 'saving' | 'error' | 'conflict'

type Entity = { updatedAt: string }
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface DraftSnapshot<T> {
  value: T
  state: SaveState
  /** False when browser storage could not be used; the draft lives only in memory. */
  durable: boolean
}

const PROTECTED_FIELDS = new Set(['id', 'userId', 'updatedAt', 'createdAt'])

export class DraftSave<T extends Entity> {
  private base: T
  private draft: Partial<T> = {}
  private pending: Partial<T> = {}
  private version: string
  private timer?: ReturnType<typeof setTimeout>
  private flight?: Promise<void>
  private listeners = new Set<() => void>()
  private state: SaveState = 'saved'
  private durable = true
  private snapshot: DraftSnapshot<T>

  constructor(
    private key: string,
    initial: T,
    private save: (patch: Partial<T>, version: string) => Promise<T>,
    private storage?: StoragePort,
    private delay = 600
  ) {
    this.base = { ...initial }
    this.version = initial.updatedAt
    try {
      if (!storage) this.durable = false
      const raw = storage?.getItem(key)
      if (raw) {
        const record: unknown = JSON.parse(raw)
        if (
          record &&
          typeof record === 'object' &&
          'version' in record &&
          typeof record.version === 'string' &&
          'patch' in record &&
          record.patch &&
          typeof record.patch === 'object' &&
          !Array.isArray(record.patch)
        ) {
          this.draft = Object.fromEntries(
            Object.entries(record.patch as Record<string, unknown>).filter(
              ([field]) => field in initial && !PROTECTED_FIELDS.has(field)
            )
          ) as Partial<T>
          this.pending = { ...this.draft }
          this.version = record.version
          this.state = Object.keys(this.draft).length
            ? this.version === initial.updatedAt
              ? 'pending'
              : 'conflict'
            : 'saved'
        }
      }
    } catch {
      this.durable = false
    }
    this.snapshot = this.makeSnapshot()
  }

  private makeSnapshot(): DraftSnapshot<T> {
    return { value: { ...this.base, ...this.draft }, state: this.state, durable: this.durable }
  }

  private emit() {
    this.snapshot = this.makeSnapshot()
    this.listeners.forEach((listener) => listener())
  }

  private persist() {
    try {
      if (!this.storage) {
        this.durable = false
        return
      }
      if (Object.keys(this.draft).length) {
        this.storage.setItem(this.key, JSON.stringify({ version: this.version, patch: this.draft }))
      } else {
        this.storage.removeItem(this.key)
      }
    } catch {
      this.durable = false
    }
  }

  /** Subscribe to stable snapshots (works with `useSyncExternalStore`). */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = () => this.snapshot

  /** Swap the transport when a page remounts while a request is in flight. */
  setSave = (save: (patch: Partial<T>, version: string) => Promise<T>) => {
    this.save = save
  }

  /** Merge a change locally, persist it, and schedule the network write. */
  change = (patch: Partial<T>) => {
    this.draft = { ...this.draft, ...patch }
    this.pending = { ...this.pending, ...patch }
    if (this.state !== 'conflict') this.state = this.flight ? 'saving' : 'pending'
    this.persist()
    this.emit()
    this.start()
  }

  start = () => {
    clearTimeout(this.timer)
    if (this.state === 'pending' && !this.flight) {
      this.timer = setTimeout(() => {
        void this.flush()
      }, this.delay)
    }
  }

  /** Reconcile fresh remote data; an unsaved draft against a newer version becomes a conflict. */
  remote = (value: T) => {
    if (this.flight || value.updatedAt === this.base.updatedAt) return
    this.base = value
    if (Object.keys(this.draft).length && this.version !== value.updatedAt) this.state = 'conflict'
    else this.version = value.updatedAt
    this.emit()
  }

  /** Send the pending batch now. Failure keeps it recoverable. */
  flush = (): Promise<void> => {
    clearTimeout(this.timer)
    if (this.flight) return this.flight
    if (this.state === 'conflict' || !Object.keys(this.pending).length) return Promise.resolve()
    const batch = this.pending
    this.pending = {}
    this.state = 'saving'
    this.emit()
    this.flight = (async () => {
      try {
        const result = await this.save(batch, this.version)
        this.base = result
        this.version = result.updatedAt
        this.draft = { ...this.pending }
        this.state = Object.keys(this.pending).length ? 'pending' : 'saved'
      } catch (error) {
        this.pending = { ...batch, ...this.pending }
        const code =
          typeof error === 'object' && error !== null && 'error' in error
            ? (error as { error?: { code?: string } }).error?.code
            : undefined
        this.state = code === 'CONFLICT' ? 'conflict' : 'error'
      } finally {
        this.flight = undefined
        this.persist()
        this.emit()
        this.start()
      }
    })()
    return this.flight
  }

  retry = () => {
    if (this.state !== 'conflict') void this.flush()
  }

  /** Rebase the draft onto a freshly fetched remote version and save it. */
  keepDraft = (remote: T) => {
    this.base = remote
    this.version = remote.updatedAt
    this.pending = { ...this.draft }
    this.state = 'pending'
    this.persist()
    this.emit()
    void this.flush()
  }

  /** Drop local changes in favor of the remote value. */
  discard = (remote: T = this.base) => {
    clearTimeout(this.timer)
    this.base = remote
    this.version = remote.updatedAt
    this.draft = {}
    this.pending = {}
    this.state = 'saved'
    this.persist()
    this.emit()
  }
}
