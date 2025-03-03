import { generateMessageId, sleep } from '../utils/helpers'
import type { MessageWithoutOptionalId } from '../types'
import {
  CONNECT_EVENT_TYPE,
  PING_PONG_INTERVAL_MS,
  READY_EVENT_TYPE,
} from '../utils/constants'
import { MessageCommunicator } from './MessageCommunicator'

export class HostCommunicator extends MessageCommunicator {
  private static instance: HostCommunicator
  private isReady = false

  private constructor() {
    super()
  }

  static getInstance(): HostCommunicator {
    return (HostCommunicator.instance ??= new HostCommunicator())
  }

  async waitForConnection(
    target: HTMLIFrameElement,
    targetOrigin: string,
  ): Promise<void> {
    if (this.isReady)
      return

    const pingMessage = { type: READY_EVENT_TYPE }
    const destination = { target, targetOrigin }

    while (!this.isReady) {
      this.dispatchMessage(pingMessage, destination).then(() => {
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
        { id: generateMessageId(), type: CONNECT_EVENT_TYPE },
        targetOrigin,
        [channel.port2],
      ),
    )
  }

  send<T>(message: MessageWithoutOptionalId): Promise<T> {
    if (!this.messagePort)
      throw new Error('Host connection not established. Call connect() first')
    return this.dispatchMessage(message, this.messagePort)
  }

  destroy(): void {
    super.destroy()
    this.isReady = false
  }
}
