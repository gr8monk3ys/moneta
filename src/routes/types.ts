import type { BillingVerifier } from '../billing.verification.js';
import type { EmailService } from '../email.js';
import type { UserRepository } from '../repository.js';
import type { AccountThrottle } from '../throttle.js';

export interface RouteDeps {
  repository: UserRepository;
  billingVerifier: BillingVerifier;
  emailService: EmailService;
  accountThrottle: AccountThrottle;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  metricsToken?: string;
}
