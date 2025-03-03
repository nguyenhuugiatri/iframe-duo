type Resolver<T> = (value?: T | PromiseLike<T>) => void
type Rejector = (reason?: unknown) => void

export class Deferred<T = void> {
  readonly promise: Promise<T>
  private _state: 'pending' | 'fulfilled' | 'rejected' = 'pending'

  private _resolve!: Resolver<T>
  private _reject!: Rejector

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve as Resolver<T>
      this._reject = reject
    })
  }

  resolve(value?: T | PromiseLike<T>) {
    if (this._state === 'pending') {
      this._state = 'fulfilled'
      this._resolve(value)
    }
  }

  reject(reason?: unknown) {
    if (this._state === 'pending') {
      this._state = 'rejected'
      this._reject(reason)
    }
  }
}
