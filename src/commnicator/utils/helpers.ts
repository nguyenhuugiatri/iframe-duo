import { nanoid } from 'nanoid'
import type { CommunicationMessage } from '../types'
import { REPLY_PREFIX } from './constants'

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {}

export type Optional<T, K extends keyof T> = Prettify<
  Omit<T, K> & Partial<Pick<T, K>>
>

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function isValidMessage(data: unknown): data is CommunicationMessage {
  return !!data
    && typeof data === 'object'
    && 'id' in data
    && typeof data.id === 'string'
    && 'type' in data
    && typeof data.type === 'string'
}

export function isReplyMessage(message: CommunicationMessage): boolean {
  return message.type.startsWith(REPLY_PREFIX)
}

export function createReplyType(eventType: string): string {
  return `${REPLY_PREFIX}${eventType}`
}

export const generateMessageId = (): string => nanoid()
