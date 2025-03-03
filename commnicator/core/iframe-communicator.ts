import type { MessagePayload } from '../types'
import { MessageMethod, MessageType } from '../types'
import { isValidMessage } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class IframeCommunicator<
  P extends MessagePayload,
> extends MessageCommunicator<P> {
  private static instance: IframeCommunicator<MessagePayload> | null = null

  private constructor() {
    super()
  }

  static getInstance<U extends MessagePayload>(): IframeCommunicator<U> {
    return (IframeCommunicator.instance ??= new IframeCommunicator<U>())
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
          const acceptConnectMessage = {
            id,
            type: MessageType.Accept,
            method: MessageMethod.Connect,
          }
          this.postMessage(acceptConnectMessage, this.messagePort)
        }
        return
      }
    }

    super.handleMessage(event)
  }
}
