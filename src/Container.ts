import { ServiceFactory } from "./ServiceFactory";
import { ServiceLifetime } from "./ServiceLifetime";
import ServiceRegistration from "./ServiceRegistration";

export default class Container {
  private serviceRegistrations: Array<ServiceRegistration<unknown>> = [];
  private hasBegunResolution: boolean = false;

  public addSingleton<TServiceToRegister>(
    type: { new (...args: unknown[]): TServiceToRegister },
    serviceFactory: ServiceFactory<TServiceToRegister>,
  ): Container {
    this.addRegistration(type, serviceFactory, ServiceLifetime.Singleton);
    return this;
  }

  public addTransient<TServiceToRegister>(
    type: { new (...args: unknown[]): TServiceToRegister },
    serviceFactory: ServiceFactory<TServiceToRegister>,
  ): Container {
    this.addRegistration(type, serviceFactory, ServiceLifetime.Transient);
    return this;
  }

  public resolve<TService>(resolutionType: {
    new (...args: unknown[]): TService;
  }): TService {
    return this.resolveInternal(resolutionType, false);
  }

  public beginResolution(): Container {
    this.hasBegunResolution = true;
    return this;
  }

  private resolveInternal<TService>(
    serviceType: { new (...args: unknown[]): TService },
    mustBeASingleton: boolean,
  ): TService {
    if (!this.hasBegunResolution) {
      throw new Error(
        "Resolution has not yet begun - did you forget to call beginResolution on the container?",
      );
    }

    const services = this.serviceRegistrations.filter(
      (registration) => registration.type === serviceType,
    );
    if (!services.length) {
      throw new Error(
        `No registered ${(serviceType as unknown as { name: string }).name} was found.`,
      );
    }

    try {
      const service = services[0];
      if (mustBeASingleton && service.lifetime !== ServiceLifetime.Singleton) {
        throw new Error(
          `Cannot resolve a singleton ${(serviceType as unknown as { name: string }).name} ` +
            `as it was registered as a ${service.lifetime}.`,
        );
      }

      if (service.lifetime === ServiceLifetime.Singleton) {
        return this.resolveSingleton(serviceType, service) as TService;
      }

      return service.resolve(this.resolve.bind(this)) as TService;
    } catch (error) {
      throw new Error(
        `Could not resolve ${(serviceType as unknown as { name: string }).name}:` +
          `\r\n- ${(error as Error).message.replace(/-/, "--")}`,
        { cause: error },
      );
    }
  }

  private addRegistration<TServiceToRegister>(
    type: { new (...args: unknown[]): TServiceToRegister },
    serviceFactory: ServiceFactory<TServiceToRegister>,
    serviceLifetime: ServiceLifetime,
  ): void {
    if (this.hasBegunResolution) {
      throw new Error(
        `Cannot add a ${serviceLifetime} ${(type as unknown as { name: string }).name} because resolution has begun.`,
      );
    }

    const services = this.serviceRegistrations.filter(
      (registration) => registration.type === type,
    );
    if (services.length) {
      throw new Error(
        `Cannot add a ${serviceLifetime} ${(type as unknown as { name: string }).name} ` +
          `because a ${services[0].lifetime} service registration has already been added.`,
      );
    }

    this.serviceRegistrations.push(
      new ServiceRegistration<TServiceToRegister>(
        type,
        serviceFactory,
        serviceLifetime,
      ),
    );
  }

  private resolveSingleton<TService>(
    resolutionType: { new (...args: unknown[]): TService },
    serviceRegistration: ServiceRegistration<TService> | null = null,
  ): TService {
    if (serviceRegistration) {
      return serviceRegistration.resolve(this.resolveSingleton.bind(this));
    }

    return this.resolveInternal<TService>(resolutionType, true);
  }
}
