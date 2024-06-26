import { type GuardContract } from '@adonisjs/auth/types';
import { RuntimeException } from '@adonisjs/core/exceptions';
import { type HttpContext } from '@adonisjs/core/http';
import { type NextFn } from '@adonisjs/core/types/http';
import { E_PERMISSION_UNAUTHORIZED_ACCESS } from '../errors.js';
import { type MixinModelWithAuthorizable } from '../types.js';

export default class RoleOrPermissionMiddleware {
  public async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roleOrPermission: string | string[];
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

    if (!('hasAnyPermission' in user) || !('hasAnyRole' in user)) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.missingMixinWithAuthorizable(user);
    }

    const roleOrPermission = Array.isArray(options.roleOrPermission)
      ? options.roleOrPermission
      : options.roleOrPermission.split('|');

    if (
      !(await user.hasAnyPermission(...roleOrPermission)) &&
      !(await user.hasAnyRole(...roleOrPermission))
    ) {
      throw E_PERMISSION_UNAUTHORIZED_ACCESS.forRolesOrPermissions(roleOrPermission);
    }

    return next() as unknown;
  }
}
