export type SaveState = 'saved' | 'pending' | 'saving' | 'error' | 'conflict'
type Entity = { updatedAt: string }
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type DraftSnapshot<T> = { value: T; state: SaveState; durable: boolean }

/** A serialized, version-checked save queue. Local drafts survive network failures and reloads. */
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
      const raw = storage?.getItem(key)
      if (!storage) this.durable = false
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
          // Only editable fields already present on the server entity can be restored.
          this.draft = Object.fromEntries(
            Object.entries(record.patch).filter(
              ([field]) =>
                field in initial && !['id', 'userId', 'updatedAt', 'createdAt'].includes(field)
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
      if (Object.keys(this.draft).length)
        this.storage.setItem(this.key, JSON.stringify({ version: this.version, patch: this.draft }))
      else this.storage.removeItem(this.key)
    } catch {
      this.durable = false
    }
  }

  /** Subscribe to stable snapshots for React or another view. */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  /** Read the current local value and truthful persistence state. */
  getSnapshot = () => this.snapshot
  /** Refresh the transport callback when a page remounts while a request is in flight. */
  setSave = (save: (patch: Partial<T>, version: string) => Promise<T>) => {
    this.save = save
  }
  /** Merge changes synchronously into local storage before scheduling network work. */
  change = (patch: Partial<T>) => {
    this.draft = { ...this.draft, ...patch }
    this.pending = { ...this.pending, ...patch }
    if (this.state !== 'conflict') this.state = this.flight ? 'saving' : 'pending'
    this.persist()
    this.emit()
    this.start()
  }
  /** Resume a recovered draft; conflicts always require an explicit decision. */
  start = () => {
    clearTimeout(this.timer)
    if (this.state === 'pending' && !this.flight)
      this.timer = setTimeout(() => {
        void this.flush()
      }, this.delay)
  }
  /** Reconcile remote data, retaining unsaved content if another writer changed the version. */
  remote = (value: T) => {
    if (this.flight || value.updatedAt === this.base.updatedAt) return
    this.base = value
    if (Object.keys(this.draft).length && this.version !== value.updatedAt) this.state = 'conflict'
    else this.version = value.updatedAt
    this.emit()
  }
  /** Serialize a pending batch. Failure keeps it recoverable; no automatic overwrite on conflict. */
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
        const conflict =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof error.error === 'object' &&
          error.error !== null &&
          'code' in error.error &&
          error.error.code === 'CONFLICT'
        this.state = conflict ? 'conflict' : 'error'
      } finally {
        this.flight = undefined
        this.persist()
        this.emit()
        this.start()
      }
    })()
    return this.flight
  }
  /** Retry a transient failure with the newest locally merged content. */
  retry = () => {
    if (this.state !== 'conflict') void this.flush()
  }
  /** Explicitly rebase the retained draft onto a freshly fetched remote version. */
  keepDraft = (remote: T) => {
    this.base = remote
    this.version = remote.updatedAt
    this.pending = { ...this.draft }
    this.state = 'pending'
    this.persist()
    this.emit()
    void this.flush()
  }
  /** Discard local changes only after a user choice; use the current remote value. */
  discard = (remote = this.base) => {
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
