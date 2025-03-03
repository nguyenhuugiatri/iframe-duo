# cross-communicator

**cross-communicator** is a lightweight, TypeScript-based library designed for seamless bi-directional communication between a window and another window, iframe, or worker using `MessagePort`. It provides a type-safe, promise-based API for sending and receiving messages, making cross-frame interactions simple and reliable.

## Features

- **Bi-directional Messaging**: Easily send and receive messages between host and iframe.
- **TypeScript Support**: Fully typed for a robust development experience.
- **Lightweight**: Minimal dependencies, optimized for performance.
- **Promise-Based Responses**: Handle asynchronous replies with ease.
- **Event-Driven**: Subscribe to specific message types using event listeners.

## Installation

Install the package using npm:

```sh
npm install cross-communicator
```

## Usage

### Host Example

Create a `HostCommunicator` to connect with an iframe and exchange messages.

```typescript
import { HostCommunicator } from 'cross-communicator'

type MessagePayload =
  | { key: 'greet', payload: { message: string } }
  | { key: 'requestData', payload: { requestId: number } }

const host = new HostCommunicator<MessagePayload>()
const iframe = document.querySelector('iframe')

host.connect({
  target: iframe,
  targetOrigin: 'http://localhost:3000',
})

const response = await host.send({
  key: 'greet',
  payload: { message: 'Hello iframe, how are you?' },
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

Your html will be

```html
<iframe src="http://localhost:3000/<your_route>"/>
```

### Iframe Example

Use `TargetCommunicator` inside the iframe to respond to host messages and send messages back.

```typescript
import { TargetCommunicator } from 'cross-communicator'

type MessagePayload =
  | { key: 'greet', payload: { message: string } }
  | { key: 'requestData', payload: { requestId: number } }

const iframe = new TargetCommunicator<MessagePayload>()

iframe.on('greet', (message, reply) => {
  console.log('Host said:', message.payload.message)
  reply.accept({ message: 'I\'m fine, how about you?' })
})

const response = await iframe.send({
  key: 'requestData',
  payload: { requestId: 1 }
})
```

## API

### HostCommunicator

- `connect(ConnectOption: { target: Worker } | { target: HTMLIFrameElement | Window, targetOrigin: string })`: Connects to an window/worker/iframe.
- `send(payload: T): Promise<any>`: Sends a message and returns a response.
- `on(event: T['key'] | '*', handler: EventHandler<T>)`: Registers an event listener.
- `off(event: T['key'] | '*', handler: EventHandler<T>)`: Removes a listener.
- `removeAllListeners()`: Clears all listeners.
- `destroy()`: Cleans up resources.

### TargetCommunicator

Extends `HostCommunicator` and automatically handles incoming connections from the host.

---

cross-communicator simplifies cross-frame messaging with a clean, type-safe API. 🚀
