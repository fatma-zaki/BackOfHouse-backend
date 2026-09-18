import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { DOMAIN_EVENT_HANDLER, DomainEvent } from './domain-event';

export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

export interface RegisteredHandler {
  name: string;
  handle: DomainEventHandler;
}

/** Collects every @OnDomainEvent method from the providers of the running app. */
@Injectable()
export class OutboxHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(OutboxHandlerRegistry.name);
  private readonly handlers = new Map<string, RegisteredHandler[]>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as Record<string, unknown> | undefined;
      if (!instance || typeof instance !== 'object') {
        continue;
      }
      const prototype = Object.getPrototypeOf(instance) as object;
      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const method = instance[methodName];
        if (typeof method !== 'function') {
          continue;
        }
        const eventName = this.reflector.get<string | undefined>(DOMAIN_EVENT_HANDLER, method);
        if (eventName) {
          this.register(eventName, `${wrapper.name}.${methodName}`, (event) =>
            Promise.resolve(method.call(instance, event)),
          );
        }
      }
    }
  }

  register(eventName: string, handlerName: string, handle: DomainEventHandler): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push({ name: handlerName, handle });
    this.handlers.set(eventName, list);
    this.logger.log(`Registered ${handlerName} for ${eventName}`);
  }

  handlersFor(eventName: string): readonly RegisteredHandler[] {
    return this.handlers.get(eventName) ?? [];
  }
}
