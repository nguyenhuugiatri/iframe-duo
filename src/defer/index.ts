type Resolver<T> = (value?: T | PromiseLike<T>) => void
type Rejector = (reason?: unknown) => void

export class Deferred<T = void> {
  readonly promise: Promise<T>
  private state: 'pending' | 'fulfilled' | 'rejected' = 'pending'
  private resolveFn!: Resolver<T>
  private rejectFn!: Rejector

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveFn = resolve as Resolver<T>
      this.rejectFn = reject
    })
  }

  resolve(value?: T | PromiseLike<T>): void {
    if (this.state === 'pending') {
      this.state = 'fulfilled'
      this.resolveFn(value)
    }
  }

  reject(reason?: unknown): void {
    if (this.state === 'pending') {
      this.state = 'rejected'
      this.rejectFn(reason)
    }
  }
}
