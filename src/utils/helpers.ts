import type { Message } from '../types'
import { nanoid } from 'nanoid'

export type ConnectOptions<T extends HTMLIFrameElement | Window | Worker> = T extends Worker ?
    { target: T }
  : { target: T, targetOrigin: string }

export const generateMessageId = (): string => nanoid()

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isValidMessage(data: unknown): data is Message {
  return !!data
    && typeof data === 'object'
    && 'id' in data
    && typeof data.id === 'string'
    && 'type' in data
    && typeof data.type === 'string'
    && 'method' in data
    && typeof data.method === 'string'
}
