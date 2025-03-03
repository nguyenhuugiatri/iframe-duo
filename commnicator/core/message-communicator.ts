import { EventEmitter2 } from 'eventemitter2'
import { Deferred } from '../../defer'
import type {
  InternalMessage,
  InternalMessageOptionalId,
  MessageDestination,
  MessagePrototype,
  ReplyHandler,
} from '../types'
import {
  InternalMessageMethod,
  InternalMessageType,
} from '../types'
import {
  generateMessageId,
  isValidMessage,
} from '../utils/helpers'

export abstract class MessageCommunicator<T extends MessagePrototype> {
  protected pendingMessages = new Map<string, Deferred<any>>()
  protected eventEmitter = new EventEmitter2({ wildcard: true })
  protected messagePort?: MessagePort
  private boundHandleMessage = this.handleMessage.bind(this)

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.boundHandleMessage)
    }
  }

  protected handleMessage(event: MessageEvent): void {
    if (!isValidMessage(event.data))
      return
    this.processMessage(event.data)
  }

  protected processMessage(message: InternalMessage<T>): void {
    const { id, type, payload } = message
    const deferred = this.pendingMessages.get(id)

    if (deferred) {
      switch (type) {
        case InternalMessageType.Accept:
          deferred.resolve(payload)
          break
        case InternalMessageType.Decline:
          deferred.reject(payload)
          break
      }
      this.pendingMessages.delete(id)
      return
    }

    if (type === InternalMessageType.Request && payload) {
      this.eventEmitter.emit(
        payload.eventName,
        payload,
        this.createReplyHandler(message),
      )
    }
  }

  protected sendInternalMessage<R>(
    message: InternalMessageOptionalId<T>,
    destination: MessageDestination,
  ): Promise<R> {
    const id = message.id ?? generateMessageId()
    const deferred = new Deferred<R>()
    this.pendingMessages.set(id, deferred)

    const normalizedMessage: InternalMessage<T> = { ...message, id }

    if ('postMessage' in destination) {
      destination.postMessage(normalizedMessage)
    }
    else {
      destination.target.contentWindow?.postMessage(
        normalizedMessage,
        destination.targetOrigin,
      )
    }

    return deferred.promise
  }

  protected createReplyHandler(message: InternalMessage<T>): ReplyHandler {
    if (!this.messagePort)
      throw new Error('Connection not established')

    return {
      accept: response =>
        this.sendInternalMessage(
          { ...message, type: InternalMessageType.Accept, payload: response },
          this.messagePort!,
        ),
      decline: reason =>
        this.sendInternalMessage(
          { ...message, type: InternalMessageType.Decline, payload: reason },
          this.messagePort!,
        ),
    }
  }

  send<R>(message: T): Promise<R> {
    if (!this.messagePort)
      throw new Error('Connection not established')
    return this.sendInternalMessage(
      {
        method: InternalMessageMethod.Execute,
        type: InternalMessageType.Request,
        payload: message,
      },
      this.messagePort,
    )
  }

  on<N extends T['eventName'] | '*'>(
    eventName: N,
    handler: N extends T['eventName']
      ? (message: Extract<T, { eventName: N }>, reply: ReplyHandler) => void
      : (message: T, reply: ReplyHandler) => void,
  ): void {
    this.eventEmitter.on(eventName, handler)
  }

  off<N extends T['eventName'] | '*'>(
    eventName: N,
    handler: N extends T['eventName']
      ? (message: Extract<T, { eventName: N }>, reply: ReplyHandler) => void
      : (message: T, reply: ReplyHandler) => void,
  ): void {
    this.eventEmitter.off(eventName, handler)
  }

  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners()
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.boundHandleMessage)
    }
    this.removeAllListeners()
    this.pendingMessages.clear()
    this.messagePort?.close()
    this.messagePort = undefined
  }
}
