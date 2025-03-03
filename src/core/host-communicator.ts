import type { Destination, MessagePayload } from '../types'
import { MessageMethod, MessageType } from '../types'
import { PING_PONG_INTERVAL_MS } from '../utils/constants'
import { sleep } from '../utils/helpers'
import { MessageCommunicator } from './message-communicator'

export class HostCommunicator<P extends MessagePayload> extends MessageCommunicator<P> {
  private isReady = false

  constructor() {
    super()
  }

  private async waitForConnection(destination: Destination): Promise<void> {
    if (this.isReady)
      return

    const pingMessage = {
      type: MessageType.Request,
      method: MessageMethod.Ping,
    }

    while (!this.isReady) {
      this.postMessage(pingMessage, destination)
        .then(() => {
          this.isReady = true
          this.pendingMessages.clear()
        })
      await sleep(PING_PONG_INTERVAL_MS)
    }
  }

  connect(destination: Destination): void {
    const channel = new MessageChannel()
    this.messagePort = channel.port1
    this.messagePort.onmessage = this.handleMessage.bind(this)

    const connectMessage = {
      type: MessageType.Request,
      method: MessageMethod.Connect,
    }
    const transfer = [channel.port2]

    void this.waitForConnection(destination).then(() =>
      this.postMessage(connectMessage, destination, transfer),
    )
  }
}
