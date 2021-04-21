import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway({ path: '/websocket' })
export class EventsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: string): any {
    const event = 'events';
    this.server.clients.forEach((client) =>
      client.send(JSON.stringify({ event, data })),
    );
  }
}
