import type { MessagePayload } from '../types'
import { MessageMethod, MessageType } from '../types'
import { PING_PONG_INTERVAL_MS } from '../utils/constants'
import { sleep } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class HostCommunicator<P extends MessagePayload> extends MessageCommunicator<P> {
  private isReady = false

  constructor() {
    super()
  }

  private async waitForConnection(target: HTMLIFrameElement, targetOrigin: string): Promise<void> {
    if (this.isReady)
      return

    const pingMessage = {
      type: MessageType.Request,
      method: MessageMethod.Ping,
    }
    const destination = { target, targetOrigin }

    while (!this.isReady) {
      this.postMessage(pingMessage, destination)
        .then(() => {
          this.isReady = true
          this.pendingMessages.clear()
        })
      await sleep(PING_PONG_INTERVAL_MS)
    }
  }

  connect(target: HTMLIFrameElement, targetOrigin: string): void {
    if (this.messagePort)
      throw new Error('Already connected. Call cleanup() before reconnecting.')

    const channel = new MessageChannel()
    this.messagePort = channel.port1
    this.messagePort.onmessage = this.handleMessage.bind(this)

    const connectMessage = {
      type: MessageType.Request,
      method: MessageMethod.Connect,
    }
    const destination = { target, targetOrigin }
    const transfer = [channel.port2]

    void this.waitForConnection(target, targetOrigin).then(() =>
      this.postMessage(connectMessage, destination, transfer),
    )
  }
}
