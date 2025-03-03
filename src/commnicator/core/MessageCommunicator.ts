import { EventEmitter2 } from 'eventemitter2'
import {
  createReplyType,
  generateMessageId,
  isReplyMessage,
  isValidMessage,
} from '../utils/helpers'
import type {
  CommunicationMessage,
  MessageDestination,
  MessageWithoutOptionalId,
  ReplyHandler,
} from '../types'
import { Deferred } from '../../defer'

export abstract class MessageCommunicator {
  protected pendingMessages = new Map<string, Deferred<any>>()
  protected eventEmitter = new EventEmitter2({ wildcard: true })
  protected messagePort?: MessagePort
  protected boundHandleMessage: (event: MessageEvent) => void

  constructor() {
    this.boundHandleMessage = this.handleMessage.bind(this)
    if (typeof window === 'undefined')
      return
    window.addEventListener('message', this.boundHandleMessage)
  }

  abstract send<T>(message: MessageWithoutOptionalId): Promise<T>

  protected handleMessage(event: MessageEvent): void {
    if (!isValidMessage(event.data))
      return
    this.processMessage(event.data)
  }

  protected processMessage(message: CommunicationMessage): void {
    const { id, type, payload } = message
    const deferred = this.pendingMessages.get(id)

    if (deferred) {
      deferred.resolve(payload)
      this.pendingMessages.delete(id)
      return
    }

    if (!isReplyMessage(message)) {
      this.eventEmitter.emit(type, message, this.createReplyHandler(id))
    }
  }

  protected dispatchMessage<T>(
    message: MessageWithoutOptionalId,
    destination: MessageDestination,
  ): Promise<T> {
    const id = message.id ?? generateMessageId()
    const deferred = new Deferred<T>()
    this.pendingMessages.set(id, deferred)

    const normalizedMessage = { ...message, id }
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

  protected createReplyHandler(id: string): ReplyHandler {
    return ({ type, payload }) =>
      this.send({ id, type: createReplyType(type), payload })
  }

  on(
    eventType: string,
    handler: (message: CommunicationMessage, reply: ReplyHandler) => void,
  ): void {
    this.eventEmitter.on(eventType, handler)
  }

  off(
    eventType: string,
    handler: (message: CommunicationMessage, reply: ReplyHandler) => void,
  ): void {
    this.eventEmitter.off(eventType, handler)
  }

  destroy(): void {
    window.removeEventListener('message', this.boundHandleMessage)
    this.eventEmitter.removeAllListeners()
    this.pendingMessages.clear()
    this.messagePort?.close()
    this.messagePort = undefined
  }
}
