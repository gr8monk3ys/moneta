import type { UserRepository } from '../repository.js';

export interface RouteDeps {
  repository: UserRepository;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  metricsToken?: string;
}
