import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter that attaches the Redis pub/sub adapter to the ROOT server
 * before any namespaces are created, so events fan out across API instances.
 *
 * This is the correct place for the Redis adapter: setting it inside a
 * namespaced gateway's `afterInit` fails because the injected server is the
 * Namespace (whose `adapter` is an instance, not a setter method).
 *
 * Call `connectToRedis()` once after construction, then register with
 * `app.useWebSocketAdapter(...)` before `app.listen()`.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(private readonly appContext: INestApplicationContext) {
    super(appContext);
  }

  async connectToRedis(): Promise<void> {
    const config = this.appContext.get(ConfigService);
    const url = config.get<string>('redis.url') ?? 'redis://localhost:6379';
    const pubClient = new Redis(url);
    const subClient = pubClient.duplicate();
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
