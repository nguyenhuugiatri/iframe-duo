export interface MessagePayload {
  key: string
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

export interface Message<P = any> {
  id: string
  type: MessageType
  method: MessageMethod
  payload?: P
}

export type MessageWithOptionalId<P> = Omit<Message<P>, 'id'> & { id?: string }

export interface MessageReply {
  accept: (response: any) => void
  decline: (reason: any) => void
}

export type EventHandler<P extends MessagePayload, K extends P['key'] | '*'> =
K extends '*'
  ? (message: P, reply: MessageReply) => void
  : (message: Extract<P, { key: K }>, reply: MessageReply) => void

export type Destination =
  | MessagePort
  | { target: HTMLIFrameElement, targetOrigin: string }
