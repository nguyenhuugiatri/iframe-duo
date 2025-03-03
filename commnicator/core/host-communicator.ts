import type { MessagePayload } from '../types'
import { MessageMethod, MessageType } from '../types'
import { PING_PONG_INTERVAL_MS } from '../utils/constants'
import { sleep } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class HostCommunicator<P extends MessagePayload> extends MessageCommunicator<P> {
  private static instance: HostCommunicator<MessagePayload> | null = null
  private isReady = false

  private constructor() {
    super()
  }

  static getInstance<P extends MessagePayload>(): HostCommunicator<P> {
    return (HostCommunicator.instance ??= new HostCommunicator<P>())
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

  override destroy(): void {
    super.destroy()
    this.isReady = false
  }
}
