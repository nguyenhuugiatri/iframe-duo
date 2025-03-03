export interface MessagePayload {
  eventName: string
  [key: string]: any
}

export enum MessageMethod {
  Ping = 'ping',
  Connect = 'connect',
  Execute = 'execute',
}

export enum MessageType {
  Request = 'request',
  Accept = 'accept',
  Decline = 'decline',
}

export interface Message<T = any> {
  id: string
  type: MessageType
  method: MessageMethod
  payload?: T
}

export type MessageWithOptionalId<T> = Omit<Message<T>, 'id'> & { id?: string }

export interface MessageReply {
  accept: (response: any) => void
  decline: (reason: any) => void
}

export type EventHandler<T extends MessagePayload, N extends T['eventName'] | '*'> =
N extends '*'
  ? (message: T, reply: MessageReply) => void
  : (message: Extract<T, { eventName: N }>, reply: MessageReply) => void

export type Destination =
  | MessagePort
  | { target: HTMLIFrameElement, targetOrigin: string }
