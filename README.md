# iframe-duo

**iframe-duo** is a lightweight TypeScript library for bi-directional communication between a host page and an iframe using `MessagePort`. It simplifies cross-frame messaging with a type-safe API, ideal for seamless interaction between host and iframe environments.

## Features

- **Bi-directional Communication**: Send & receive messages effortlessly.
- **TypeScript Support**: Fully typed API.
- **Lightweight**: Minimal dependencies.
- **Promise-based**: Handle responses asynchronously.
- **Event-driven**: Subscribe to messages via event listeners.

## Installation

Install via npm or pnpm:

```sh
npm install iframe-duo
```

## Usage

### Host Example

Create a `HostCommunicator` to connect with an iframe and exchange messages.

```typescript
import { HostCommunicator } from 'iframe-duo'

type MessagePayload =
  | { key: 'greet', payload: { message: string } }
  | { key: 'requestData', payload: { requestId: number } }

const host = new HostCommunicator<MessagePayload>()
const iframe = document.querySelector('iframe')!

host.connect(iframe, 'http://localhost:3000')

const response = await host.send({
  key: 'greet',
  payload: { message: 'Hello iframe, how are you?' }
})

host.on('requestData', (message, reply) => {
  const data = { id: message.payload.requestId, value: 'Some important data' }
  if (data) {
    reply.accept(data)
  }
  else {
    reply.decline(new Error('Data not found'))
  }
})
```

### Iframe Example

Use `IframeCommunicator` inside the iframe to respond to host messages and send messages back.

```typescript
import { IframeCommunicator } from 'iframe-duo'

type MessagePayload =
  | { key: 'greet', payload: { message: string } }
  | { key: 'requestData', payload: { requestId: number } }

const iframe = new IframeCommunicator<MessagePayload>()

iframe.on('greet', (message, reply) => {
  console.log('Host said:', message.payload.message)
  reply.accept({ message: 'I\'m fine, how about you?' })
})

const response = await iframe.send({
  key: 'requestData',
  payload: { requestId: 1 }
})
console.log('Received data from host:', response)
```

## API

### HostCommunicator

- `connect(target: HTMLIFrameElement, targetOrigin: string)`: Connects to an iframe.
- `send(payload: T): Promise<any>`: Sends a message and returns a response.
- `on(event: T['key'] | '*', handler: EventHandler<T>)`: Registers an event listener.
- `off(event: T['key'] | '*', handler: EventHandler<T>)`: Removes a listener.
- `removeAllListeners()`: Clears all listeners.
- `destroy()`: Cleans up resources.

### IframeCommunicator

Extends `HostCommunicator` and automatically handles incoming connections from the host.

---

iframe-duo simplifies cross-frame messaging with a clean, type-safe API. 🚀
