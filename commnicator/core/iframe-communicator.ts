import type { MessagePrototype } from '../types'
import { InternalMessageMethod, InternalMessageType } from '../types'
import { isValidMessage } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class IframeCommunicator<
  T extends MessagePrototype,
> extends MessageCommunicator<T> {
  private static instance: IframeCommunicator<any>

  private constructor() {
    super()
  }

  static getInstance<U extends MessagePrototype>(): IframeCommunicator<U> {
    return (IframeCommunicator.instance ??= new IframeCommunicator<U>())
  }

  protected override handleMessage(event: MessageEvent): void {
    if (!isValidMessage(event.data))
      return

    switch (event.data.method) {
      case InternalMessageMethod.Ping:
        event.source?.postMessage(
          {
            id: event.data.id,
            type: InternalMessageType.Accept,
            method: InternalMessageMethod.Ping,
          },
          { targetOrigin: event.origin },
        )
        return
      case InternalMessageMethod.Connect:
        if (event.ports[0] && !this.messagePort) {
          this.messagePort = event.ports[0]
          this.messagePort.onmessage = this.handleMessage.bind(this)
          this.messagePort.postMessage({
            id: event.data.id,
            type: InternalMessageType.Accept,
            method: InternalMessageMethod.Connect,
          })
        }
        return
    }

    super.handleMessage(event)
  }
}
