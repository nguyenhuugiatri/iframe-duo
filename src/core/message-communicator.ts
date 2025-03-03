import type {
  Destination,
  EventHandler,
  Message,
  MessagePayload,
  MessageReply,
  MessageWithOptionalId,
} from '../types'
import { EventEmitter2 } from 'eventemitter2'
import { MessageMethod, MessageType } from '../types'
import { Deferred } from '../utils/defer'
import { generateMessageId, isValidMessage } from '../utils/helpers'

export abstract class MessageCommunicator<P extends MessagePayload> {
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

  protected processMessage(message: Message<P>): void {
    const { id, type, payload } = message
    const deferred = this.pendingMessages.get(id)

    if (deferred) {
      switch (type) {
        case MessageType.Accept:
          deferred.resolve(payload)
          break
        case MessageType.Decline:
          deferred.reject(payload)
          break
      }
      this.pendingMessages.delete(id)
      return
    }

    if (type === MessageType.Request && payload) {
      this.eventEmitter.emit(
        payload.key,
        payload,
        this.createReplyHandler(message),
      )
    }
  }

  protected postMessage<R>(
    message: MessageWithOptionalId<P>,
    destination: Destination,
    transfer?: Transferable[],
  ): Promise<R> {
    const id = message.id ?? generateMessageId()
    const deferred = new Deferred<R>()
    this.pendingMessages.set(id, deferred)

    const normalizedMessage: Message<P> = { ...message, id }

    if ('postMessage' in destination) {
      destination.postMessage(normalizedMessage, { transfer })
    }
    else {
      destination.target.contentWindow?.postMessage(
        normalizedMessage,
        destination.targetOrigin,
        transfer,
      )
    }

    return deferred.promise
  }

  protected createReplyHandler(message: Message<P>): MessageReply {
    if (!this.messagePort)
      throw new Error('Connection not established')

    const port = this.messagePort

    return {
      accept: response =>
        this.postMessage(
          {
            ...message,
            type: MessageType.Accept,
            payload: response,
          },
          port,
        ),
      decline: reason =>
        this.postMessage(
          {
            ...message,
            type: MessageType.Decline,
            payload: reason,
          },
          port,
        ),
    }
  }

  send<R = any>(message: P): Promise<R> {
    if (!this.messagePort)
      throw new Error('Connection not established')
    return this.postMessage(
      {
        method: MessageMethod.Execute,
        type: MessageType.Request,
        payload: message,
      },
      this.messagePort,
    )
  }

  on<K extends P['key'] | '*'>(key: K, handler: EventHandler<P, K>): void {
    this.eventEmitter.on(key, handler)
  }

  off<K extends P['key'] | '*'>(key: K, handler: EventHandler<P, K>): void {
    this.eventEmitter.off(key, handler)
  }

  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners()
  }

  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.boundHandleMessage)
    }
    this.removeAllListeners()
    this.pendingMessages.clear()
    this.messagePort?.close()
    this.messagePort = undefined
  }
}
