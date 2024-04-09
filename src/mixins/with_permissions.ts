import { type NormalizeConstructor } from '@adonisjs/core/types/helpers';
import { type BaseModel, manyToMany } from '@adonisjs/lucid/orm';
import { type ManyToMany } from '@adonisjs/lucid/types/relations';
import { Permission } from '../../services/permission.js';
import {
  type MixinModelWithPermissions,
  type MixinWithPermissions,
  type PermissionModel,
} from '../types.js';

export const withPermissions = (tableName: string) => {
  return <Model extends NormalizeConstructor<typeof BaseModel>>(
    superclass: Model,
  ): NormalizeConstructor<MixinModelWithPermissions> & Model => {
    class ModelWithPermission extends superclass implements MixinWithPermissions {
      @manyToMany(() => Permission, {
        pivotTable: tableName,
        pivotForeignKey: 'model_id',
        pivotRelatedForeignKey: 'permission_id',
      })
      public declare permissions: ManyToMany<typeof Permission>;

      public async hasPermissionTo(
        this: ModelWithPermission,
        permission: string | InstanceType<PermissionModel>,
      ): Promise<boolean> {
        const permissionTarget = this.getPermissionTarget(permission);
        const model = await this.related('permissions')
          .query()
          .where('name', permissionTarget)
          .first();

        return Boolean(model);
      }

      public async checkPermissionTo(
        this: ModelWithPermission,
        permission: string | InstanceType<PermissionModel>,
      ): Promise<boolean> {
        if (await this.hasPermissionTo(permission)) {
          return true;
        }

        const permissionTarget = this.getPermissionTarget(permission);

        throw new Error(`User does not have permission to ${permissionTarget}`);
      }

      public async hasAnyPermission(
        this: ModelWithPermission,
        ...permissions: (InstanceType<PermissionModel> | string)[]
      ): Promise<boolean> {
        await this.load('permissions');
        for (const permission of permissions) {
          if (await this.hasPermissionTo(permission)) {
            return true;
          }
        }

        return false;
      }

      public async hasAllPermissions(
        this: ModelWithPermission,
        ...permissions: (InstanceType<PermissionModel> | string)[]
      ): Promise<boolean> {
        await this.load('permissions');

        for (const permission of permissions) {
          if (!(await this.hasPermissionTo(permission))) {
            return false;
          }
        }

        return true;
      }

      public async givePermissionTo(
        this: ModelWithPermission,
        ...permissions: (InstanceType<PermissionModel> | string)[]
      ): Promise<void> {
        const permissionModels = await this.getPermissionsOrCreate(...permissions);

        await this.related('permissions').attach(permissionModels.map((perm) => perm.id));
      }

      public async syncPermissions(
        this: ModelWithPermission,
        ...permissions: (InstanceType<PermissionModel> | string)[]
      ): Promise<void> {
        const permissionModels = await this.getPermissionsOrCreate(...permissions);

        await this.related('permissions').sync(permissionModels.map((perm) => perm.id));
      }

      public async revokePermissionTo(
        this: ModelWithPermission,
        permission: string | InstanceType<PermissionModel>,
      ): Promise<void> {
        const permissionModels = await this.getPermissionsOrCreate(permission);

        await this.related('permissions').detach(permissionModels.map((perm) => perm.id));
      }

      public async getPermissionNames(this: ModelWithPermission): Promise<string[]> {
        const permissions = await this.related('permissions').query().select('name');

        return permissions.map((p) => p.name);
      }

      public getPermissionTarget(
        this: ModelWithPermission,
        permission: string | InstanceType<PermissionModel>,
      ): string {
        return typeof permission === 'string' ? permission : permission.name;
      }

      private async getPermissionsOrCreate(
        this: ModelWithPermission,
        ...permissions: (InstanceType<PermissionModel> | string)[]
      ): Promise<InstanceType<PermissionModel>[]> {
        const permissionsToSearch = permissions.map((permission) => {
          return {
            name: this.getPermissionTarget(permission),
          };
        });

        return Permission.fetchOrCreateMany('name', permissionsToSearch, { client: this.$trx });
      }
    }

    return ModelWithPermission;
  };
};
