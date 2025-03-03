import type { Optional, Prettify } from '../utils/helpers'

export interface CommunicationMessage {
  id: string
  type: string
  payload?: any
}

export type MessageWithoutOptionalId = Prettify<
  Optional<CommunicationMessage, 'id'>
>
export type MessageWithoutId = Prettify<Omit<CommunicationMessage, 'id'>>
export type ReplyHandler = (message: MessageWithoutId) => void
export type MessageDestination =
  | MessagePort
  | { target: HTMLIFrameElement, targetOrigin: string }
