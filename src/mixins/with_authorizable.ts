import { compose } from '@adonisjs/core/helpers';
import {
  type HasAuthorizableModel,
  type MixinModelWithAuthorizable,
  type PermissionModel,
  type WithAuthorizable,
} from '../types.js';
import { withPermissions } from './with_permissions.js';
import { withRoles } from './with_roles.js';

export const withAuthorizable: WithAuthorizable = (config) => {
  const HasPermissions = withPermissions(config.permissionsPivotTable);
  const HasRoles = withRoles(config.rolesPivotTable);

  return (superclass): MixinModelWithAuthorizable<typeof superclass> => {
    class ModelWithAuthorizable extends compose(superclass, HasRoles, HasPermissions) {
      public async hasDirectPermission(
        this: ModelWithAuthorizable & HasAuthorizableModel,
        permission: string | InstanceType<PermissionModel>,
      ): Promise<boolean> {
        const permissionTarget = this.getPermissionTarget(permission);
        const model = await this.related('permissions')
          .query()
          .where('name', permissionTarget)
          .first();

        return Boolean(model);
      }

      public async hasPermissionViaRole(
        this: ModelWithAuthorizable & HasAuthorizableModel,
        permission: string | InstanceType<PermissionModel>,
      ): Promise<boolean> {
        const permissionTarget = this.getPermissionTarget(permission);

        const roleWithPermission = await this.related('roles')
          .query()
          .whereHas('permissions', (query) => {
            void query.where('name', permissionTarget);
          })
          .first();

        return Boolean(roleWithPermission);
      }

      public async getDirectPermissions(
        this: ModelWithAuthorizable & HasAuthorizableModel,
      ): Promise<InstanceType<PermissionModel>[]> {
        await this.load('permissions');

        return this.permissions;
      }

      public async getPermissionsViaRoles(
        this: ModelWithAuthorizable & HasAuthorizableModel,
      ): Promise<InstanceType<PermissionModel>[]> {
        await this.load('roles', (query) => {
          void query.preload('permissions');
        });

        return this.roles.flatMap((role) => role.permissions);
      }

      public async getAllPermissions(
        this: ModelWithAuthorizable & HasAuthorizableModel,
      ): Promise<InstanceType<PermissionModel>[]> {
        await this.load((loader) => {
          loader.load('permissions').load('roles', (query) => {
            void query.preload('permissions');
          });
        });

        return [...this.permissions, ...this.roles.map((r) => r.permissions)].flat();
      }
    }

    return ModelWithAuthorizable as unknown as MixinModelWithAuthorizable<typeof superclass>;
  };
};
