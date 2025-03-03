import type { MessageWithoutOptionalId } from '../types'
import { CONNECT_EVENT_TYPE, READY_EVENT_TYPE } from '../utils/constants'
import { createReplyType, isValidMessage } from '../utils/helpers'
import { MessageCommunicator } from './MessageCommunicator'

export class IframeCommunicator extends MessageCommunicator {
  private static instance: IframeCommunicator

  private constructor() {
    super()
  }

  static getInstance(): IframeCommunicator {
    return (IframeCommunicator.instance ??= new IframeCommunicator())
  }

  protected override handleMessage(event: MessageEvent): void {
    if (!isValidMessage(event.data))
      return

    switch (event.data.type) {
      case READY_EVENT_TYPE:
        event.source?.postMessage(
          { id: event.data.id, type: createReplyType(event.data.type) },
          { targetOrigin: event.origin },
        )
        return
      case CONNECT_EVENT_TYPE:
        if (event.ports[0] && !this.messagePort) {
          this.messagePort = event.ports[0]
          this.messagePort.onmessage = this.handleMessage.bind(this)
          this.messagePort.postMessage({
            id: event.data.id,
            type: createReplyType(event.data.type),
          })
        }
        return
    }

    super.handleMessage(event)
  }

  send<T>(message: MessageWithoutOptionalId): Promise<T> {
    if (!this.messagePort)
      throw new Error('Iframe connection not established')
    return this.dispatchMessage(message, this.messagePort)
  }
}
