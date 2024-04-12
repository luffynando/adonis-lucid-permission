import { type GuardContract } from '@adonisjs/auth/types';
import { RuntimeException } from '@adonisjs/core/exceptions';
import { type HttpContext } from '@adonisjs/core/http';
import { type NextFn } from '@adonisjs/core/types/http';
import { E_PERMISSION_UNAUTHORIZED_ACCESS } from '../errors.js';
import { type MixinModelWithAuthorizable } from '../types.js';

export default class RoleMiddleware {
  public async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roles: string | string[];
    },
  ): Promise<unknown> {
    // Actually only work if auth exists
    if (!('auth' in ctx)) {
      ctx.logger.warn('Cannot get auth module in context, did you forget to enable auth?');
      throw new RuntimeException('Not required modules');
    }

    const { user } = ctx.auth as GuardContract<InstanceType<MixinModelWithAuthorizable>>;

    if (!user) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.notLoggedIn();
    }

    if (!('hasAnyRole' in user)) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.missingMixinWithAuthorizable(user);
    }

    const roles = Array.isArray(options.roles) ? options.roles : options.roles.split('|');

    if (!(await user.hasAnyRole(...roles))) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.forRoles(roles);
    }

    return next() as unknown;
  }
}
