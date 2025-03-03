import type { Destination, MessagePayload } from '../types'
import type { ConnectOptions } from '../utils/helpers'
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

  connect<T extends HTMLIFrameElement | Window | Worker>(options: ConnectOptions<T>): void {
    const { target } = options
    const targetOrigin = 'targetOrigin' in options ? options.targetOrigin : undefined

    const channel = new MessageChannel()
    this.messagePort = channel.port1
    this.messagePort.onmessage = this.handleMessage.bind(this)

    const connectMessage = {
      type: MessageType.Request,
      method: MessageMethod.Connect,
    }

    const destination = {
      target,
      targetOrigin,
    }

    void this.waitForConnection(destination).then(() =>
      this.postMessage(connectMessage, destination, [channel.port2]),
    )
  }
}
