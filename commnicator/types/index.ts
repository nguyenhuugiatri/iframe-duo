export interface MessagePrototype {
  eventName: string
  [key: string]: any
}

export enum InternalMessageMethod {
  Ping = 'ping',
  Connect = 'connect',
  Execute = 'execute',
}

export enum InternalMessageType {
  Request = 'request',
  Accept = 'accept',
  Decline = 'decline',
}

export interface InternalMessage<T = any> {
  id: string
  type: InternalMessageType
  method: InternalMessageMethod
  payload?: T
}

export type InternalMessageOptionalId<T> = Omit<InternalMessage<T>, 'id'> & {
  id?: string
}
export interface ReplyHandler {
  accept: (response: any) => void
  decline: (reason: any) => void
}

export type MessageDestination =
  | MessagePort
  | { target: HTMLIFrameElement, targetOrigin: string }
