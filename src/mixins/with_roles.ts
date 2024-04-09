import { type NormalizeConstructor } from '@adonisjs/core/types/helpers';
import { type BaseModel, manyToMany } from '@adonisjs/lucid/orm';
import { type ManyToMany } from '@adonisjs/lucid/types/relations';
import { Role } from '../../services/role.js';
import { type MixinModelWithRoles, type MixinWithRoles, type RoleModel } from '../types.js';

export const withRoles = (tableName: string) => {
  return <Model extends NormalizeConstructor<typeof BaseModel>>(
    superclass: Model,
  ): NormalizeConstructor<MixinModelWithRoles> & Model => {
    class ModelWithRoles extends superclass implements MixinWithRoles {
      @manyToMany(() => Role, {
        pivotTable: tableName,
        pivotForeignKey: 'model_id',
        pivotRelatedForeignKey: 'role_id',
      })
      public declare roles: ManyToMany<typeof Role>;

      public async assignRole(
        this: ModelWithRoles,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<void> {
        const roleModels = await this.getRolesOrCreate(...roles);

        await this.related('roles').attach(roleModels.map((role) => role.id));
      }

      public async syncRoles(
        this: ModelWithRoles,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<void> {
        const roleModels = await this.getRolesOrCreate(...roles);

        await this.related('roles').sync(roleModels.map((role) => role.id));
      }

      public async revokeRole(
        this: ModelWithRoles,
        roleTarget: string | InstanceType<RoleModel>,
      ): Promise<void> {
        const roleModels = await this.getRolesOrCreate(roleTarget);

        await this.related('roles').detach(roleModels.map((role) => role.id));
      }

      public async hasRole(
        this: ModelWithRoles,
        role: string | InstanceType<RoleModel>,
      ): Promise<boolean> {
        const roleTarget = this.getRoleTargetName(role);

        const roleModel = await this.related('roles').query().where('name', roleTarget).first();

        return Boolean(roleModel);
      }

      public async hasAnyRoles(
        this: ModelWithRoles,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<boolean> {
        await this.load('roles');

        return roles.some((role) =>
          this.roles.some((role2) => role2.name === this.getRoleTargetName(role)),
        );
      }

      public async hasAllRoles(
        this: ModelWithRoles,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<boolean> {
        await this.load('roles');

        return roles.every((role) =>
          this.roles.some((role2) => role2.name === this.getRoleTargetName(role)),
        );
      }

      public async getRoleNames(this: ModelWithRoles): Promise<string[]> {
        await this.load('roles');

        return this.roles.map((r) => r.name);
      }

      private getRoleTargetName(role: string | InstanceType<RoleModel>): string {
        return typeof role === 'string' ? role : role.name;
      }

      private async getRolesOrCreate(
        this: ModelWithRoles,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<InstanceType<RoleModel>[]> {
        const rolesToSearch = roles.map((role) => {
          return {
            name: this.getRoleTargetName(role),
          };
        });

        return Role.fetchOrCreateMany('name', rolesToSearch, { client: this.$trx });
      }
    }

    return ModelWithRoles;
  };
};
