export type ServiceResolver = <TServiceToResolve>(serviceType: {
  new (...args: unknown[]): TServiceToResolve;
}) => TServiceToResolve;
