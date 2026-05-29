import cors from 'cors';
import express from 'express';
import path from 'node:path';
import rateLimit, { type Store } from 'express-rate-limit';
import helmet from 'helmet';
import { createBillingVerifier, type BillingVerifier } from './billing.verification.js';
import type { EmailService } from './email.js';
import { ApiError } from './errors.js';
import { requestLogger, type RequestLoggerRequest } from './logger.js';
import { renderMarketingPage, renderRobotsTxt, renderSitemapXml } from './marketingSite.js';
import { metricsMiddleware } from './metrics.js';
import { errorHandler } from './middleware/errorHandler.js';
import type { UserRepository } from './repository.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { registerBillingRoutes } from './routes/billingRoutes.js';
import { registerLearningRoutes } from './routes/learningRoutes.js';
import { registerSystemRoutes } from './routes/systemRoutes.js';
import type { RouteDeps } from './routes/types.js';
import { createAccountThrottle, type AccountThrottle } from './throttle.js';

interface AppOptions {
  repository: UserRepository;
  billingVerifier?: BillingVerifier;
  emailService?: EmailService;
  accountThrottle?: AccountThrottle;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  allowedOrigins: string[];
  metricsToken?: string;
  trustProxy: boolean;
  authLimiterStore?: Store;
  apiLimiterStore?: Store;
}

function parseAllowedOrigins(origins: string[]): cors.CorsOptions {
  if (origins.length === 0) {
    return { origin: false };
  }

  return {
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new ApiError(403, 'Blocked by CORS'));
    }
  };
}

export function createApp(options: AppOptions): express.Express {
  const app = express();
  const publicDir = path.resolve(process.cwd(), 'public');
  const emailService: EmailService = options.emailService ?? {
    sendPasswordResetCode: async () => {
      throw new ApiError(500, 'Email service is not configured');
    }
  };
  const deps: RouteDeps = {
    repository: options.repository,
    billingVerifier: options.billingVerifier ?? createBillingVerifier({
      nodeEnv: 'development',
      allowSandboxTokens: true,
      webhookSecret: 'dev-billing-webhook-secret'
    }),
    emailService,
    accountThrottle: options.accountThrottle ?? createAccountThrottle(),
    jwtSecret: options.jwtSecret,
    jwtRefreshSecret: options.jwtRefreshSecret,
    jwtAccessTtlSeconds: options.jwtAccessTtlSeconds,
    jwtRefreshTtlSeconds: options.jwtRefreshTtlSeconds,
    metricsToken: options.metricsToken
  };

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: options.authLimiterStore
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    store: options.apiLimiterStore
  });

  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy);
  app.use(helmet());
  app.use('/marketing', express.static(path.join(publicDir, 'marketing'), {
    immutable: true,
    maxAge: '7d'
  }));
  app.use(requestLogger());
  app.use(metricsMiddleware());
  app.use(cors(parseAllowedOrigins(options.allowedOrigins)));
  app.use(express.json({
    limit: '100kb',
    verify: (req: RequestLoggerRequest, _res, buffer) => {
      req.rawBody = Buffer.from(buffer);
    }
  }));
  app.use('/api', apiLimiter);

  app.get('/', (req, res) => {
    res.type('html').send(renderMarketingPage(req));
  });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(renderRobotsTxt(req));
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml').send(renderSitemapXml(req));
  });

  registerSystemRoutes(app, deps);
  registerAuthRoutes(app, deps, authLimiter);
  registerLearningRoutes(app, deps);
  registerBillingRoutes(app, deps);

  app.use(errorHandler);
  return app;
}
