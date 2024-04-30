import { compose } from '@adonisjs/core/helpers';
import { type NormalizeConstructor } from '@adonisjs/core/types/helpers';
import { type BaseModel } from '@adonisjs/lucid/orm';
import {
  type AuthorizableConfig,
  type HasAuthorizableMethods,
  type MixinModelWithAuthorizable,
  type MixinWithAuthorizable,
  type PermissionModel,
} from '../types.js';
import { withPermissions } from './with_permissions.js';
import { withRoles } from './with_roles.js';

export const withAuthorizable = (config: AuthorizableConfig) => {
  const HasPermissions = withPermissions(config.permissionsPivotTable);
  const HasRoles = withRoles(config.rolesPivotTable);

  return <Model extends NormalizeConstructor<typeof BaseModel>>(
    superclass: Model,
  ): NormalizeConstructor<MixinModelWithAuthorizable> & Model => {
    class ModelWithAuthorizable
      extends compose(superclass, HasRoles, HasPermissions)
      implements HasAuthorizableMethods
    {
      public async hasDirectPermission(
        this: MixinWithAuthorizable,
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
        this: MixinWithAuthorizable,
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
        this: MixinWithAuthorizable,
      ): Promise<InstanceType<PermissionModel>[]> {
        await this.load('permissions');

        return this.permissions;
      }

      public async getPermissionsViaRoles(
        this: MixinWithAuthorizable,
      ): Promise<InstanceType<PermissionModel>[]> {
        await this.load('roles', (query) => {
          void query.preload('permissions');
        });

        return this.roles.flatMap((role) => role.permissions);
      }

      public async getAllPermissions(
        this: MixinWithAuthorizable,
      ): Promise<InstanceType<PermissionModel>[]> {
        await this.load((loader) => {
          loader.load('permissions').load('roles', (query) => {
            void query.preload('permissions');
          });
        });

        return [...this.permissions, ...this.roles.map((r) => r.permissions)].flat();
      }

      public async withPermissionTo(
        this: MixinModelWithAuthorizable & ModelWithAuthorizable,
        permission: string | InstanceType<PermissionModel>,
      ): Promise<boolean> {
        return (
          (await this.hasDirectPermission(permission)) ||
          (await this.hasPermissionViaRole(permission))
        );
      }

      public async canAnyPermission(
        this: MixinModelWithAuthorizable & ModelWithAuthorizable,
        ...permissions: (InstanceType<PermissionModel> | string)[]
      ): Promise<boolean> {
        for (const permission of permissions) {
          if (await this.withPermissionTo(permission)) {
            return true;
          }
        }

        return false;
      }
    }

    return ModelWithAuthorizable;
  };
};
