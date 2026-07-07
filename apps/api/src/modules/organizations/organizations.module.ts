import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { OrgContextMiddleware } from '../../common/middleware/org-context.middleware';

import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrgContextMiddleware],
  exports: [OrganizationsService],
})
export class OrganizationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Express 5 / path-to-regexp 8 no longer accept the bare `*` wildcard, so
    // cover both the org route itself and everything nested beneath it with a
    // named splat.
    consumer
      .apply(OrgContextMiddleware)
      .forRoutes(
        { path: 'organizations/:orgSlug', method: RequestMethod.ALL },
        { path: 'organizations/:orgSlug/*path', method: RequestMethod.ALL },
      );
  }
}
