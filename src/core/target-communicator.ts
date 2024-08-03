import type { MessagePayload } from '../types'
import { MessageMethod, MessageType } from '../types'
import { isValidMessage } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class TargetCommunicator<P extends MessagePayload> extends MessageCommunicator<P> {
  private static instance: TargetCommunicator<MessagePayload> | null = null

  private constructor() {
    super()
  }

  static getInstance<P extends MessagePayload>(): TargetCommunicator<P> {
    return (TargetCommunicator.instance ??= new TargetCommunicator<P>())
  }

  protected override handleMessage(event: MessageEvent): void {
    if (!isValidMessage(event.data))
      return

    const { method, id } = event.data

    switch (method) {
      case MessageMethod.Ping: {
        const pongMessage = {
          id,
          type: MessageType.Accept,
          method: MessageMethod.Ping,
        }
        event.source?.postMessage(pongMessage, { targetOrigin: event.origin })
        return
      }

      case MessageMethod.Connect: {
        if (event.ports[0] && !this.messagePort) {
          this.messagePort = event.ports[0]
          this.messagePort.onmessage = this.handleMessage.bind(this)
          const acceptMessage = {
            id,
            type: MessageType.Accept,
            method: MessageMethod.Connect,
          }
          this.postMessage(acceptMessage, this.messagePort)
        }
        return
      }
    }

    super.handleMessage(event)
  }
}
