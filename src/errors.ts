import { Exception } from '@adonisjs/core/exceptions';
import { type HttpContext } from '@adonisjs/core/http';
import { type I18n } from '@adonisjs/i18n';
import { type LucidModel } from '@adonisjs/lucid/types/model';

export const E_PERMISSION_UNAUTHORIZED_ACCESS = class extends Exception {
  public static status = 403;

  public static code = 'E_PERMISSION_UNAUTHORIZED_ACCESS';

  public static notLoggedIn(): Exception {
    return new E_PERMISSION_UNAUTHORIZED_ACCESS('User is not logged in');
  }

  public static missingMixinWithAuthorizable(user: LucidModel): Exception {
    const className = user.constructor.name;

    return new E_PERMISSION_UNAUTHORIZED_ACCESS(
      `Authorizable class '${className}' must extends of mixin WithAuthorizable`,
    );
  }

  public static forPermissions(permissions: string[]): Exception {
    const exception = new E_PERMISSION_UNAUTHORIZED_ACCESS(
      'User does not have the right permissions',
    );
    exception.requiredPermissions = permissions;

    return exception;
  }

  public static forRoles(roles: string[]): Exception {
    const exception = new E_PERMISSION_UNAUTHORIZED_ACCESS('User does not have the right roles');
    exception.requiredRoles = roles;

    return exception;
  }

  public static forRolesOrPermissions(roleOrPermissions: string[]): Exception {
    const exception = new E_PERMISSION_UNAUTHORIZED_ACCESS(
      'User does not have any of the necessary access rights',
    );
    exception.requiredPermissions = roleOrPermissions;
    exception.requiredRoles = roleOrPermissions;

    return exception;
  }

  /**
   * Translation identifier. Can be customized
   */
  public identifier = 'errors.E_PERMISSION_UNAUTHORIZED_ACCESS';

  public requiredRoles: string[] = [];

  public requiredPermissions: string[] = [];

  /**
   * Returns the message to be sent in the HTTP response.
   * Feel free to override this method and return a custom
   * response.
   */
  public getResponseMessage(error: this, ctx: HttpContext): string {
    if ('i18n' in ctx) {
      return (ctx.i18n as I18n).t(error.identifier, {}, error.message);
    }

    return error.message;
  }

  /**
   * Converts exception to an HTTP response
   */
  public async handle(error: this, ctx: HttpContext): Promise<void> {
    const message = this.getResponseMessage(error, ctx);

    switch (ctx.request.accepts(['html', 'application/vnd.api+json', 'json'])) {
      case 'html':
      case null: {
        if ('session' in ctx) {
          (ctx.session as { flashErrors: (errors: Record<string, unknown>) => void }).flashErrors({
            [error.code!]: message,
          });
          ctx.response.redirect('back', true);
        } else {
          ctx.response.status(error.status).send(message);
        }
        break;
      }
      case 'json': {
        ctx.response.status(error.status).send({
          errors: [
            {
              message,
            },
          ],
        });
        break;
      }
      case 'application/vnd.api+json': {
        ctx.response.status(error.status).send({
          errors: [
            {
              code: error.code,
              title: message,
            },
          ],
        });
        break;
      }
    }
  }
};
