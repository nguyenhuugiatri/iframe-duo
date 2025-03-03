import type { MessagePrototype } from '../types'
import { InternalMessageMethod, InternalMessageType } from '../types'
import { PING_PONG_INTERVAL_MS } from '../utils/constants'
import { generateMessageId, sleep } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class HostCommunicator<T extends MessagePrototype> extends MessageCommunicator<T> {
  private static instance: HostCommunicator<any>
  private isReady = false

  private constructor() {
    super()
  }

  static getInstance<U extends MessagePrototype>(): HostCommunicator<U> {
    return (HostCommunicator.instance ??= new HostCommunicator<U>())
  }

  private async waitForConnection(target: HTMLIFrameElement, targetOrigin: string): Promise<void> {
    if (this.isReady)
      return

    const pingMessage = {
      id: generateMessageId(),
      type: InternalMessageType.Request,
      method: InternalMessageMethod.Ping,
    }
    const destination = { target, targetOrigin }

    while (!this.isReady) {
      this.sendInternalMessage(pingMessage, destination).then(() => {
        this.isReady = true
        this.pendingMessages.clear()
      })
      await sleep(PING_PONG_INTERVAL_MS)
    }
  }

  connect(target: HTMLIFrameElement, targetOrigin: string): void {
    const channel = new MessageChannel()
    this.messagePort = channel.port1
    this.messagePort.onmessage = this.handleMessage.bind(this)

    this.waitForConnection(target, targetOrigin).then(() =>
      target.contentWindow?.postMessage(
        {
          id: generateMessageId(),
          type: InternalMessageType.Request,
          method: InternalMessageMethod.Connect,
        },
        targetOrigin,
        [channel.port2],
      ),
    )
  }

  destroy(): void {
    super.destroy()
    this.isReady = false
  }
}
