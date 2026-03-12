import type { BillingVerifier } from '../billing.verification.js';
import type { EmailService } from '../email.js';
import type { UserRepository } from '../repository.js';

export interface RouteDeps {
  repository: UserRepository;
  billingVerifier: BillingVerifier;
  emailService: EmailService;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  metricsToken?: string;
}
