import { type GuardContract } from '@adonisjs/auth/types';
import { RuntimeException } from '@adonisjs/core/exceptions';
import { type HttpContext } from '@adonisjs/core/http';
import { type NextFn } from '@adonisjs/core/types/http';
import { E_PERMISSION_UNAUTHORIZED_ACCESS } from '../errors.js';
import { type MixinModelWithAuthorizable } from '../types.js';

export default class PermissionMiddleware {
  public async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      permissions: string | string[];
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

    if (!('hasAnyPermission' in user)) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.missingMixinWithAuthorizable(user);
    }

    const permissions = Array.isArray(options.permissions)
      ? options.permissions
      : options.permissions.split('|');

    if (!(await user.hasAnyPermission(...permissions))) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.forPermissions(permissions);
    }

    return next() as unknown;
  }
}
