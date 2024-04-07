import { manyToMany } from '@adonisjs/lucid/orm';
import { type ManyToMany } from '@adonisjs/lucid/types/relations';
import Role from '../../services/role.js';
import {
  type HasRolesModel,
  type MixinModelWithRole,
  type RoleModel,
  type WithRoles,
} from '../types.js';

export const withRoles: WithRoles = (tableName: string) => {
  return (superclass): MixinModelWithRole<typeof superclass> => {
    class ModelWithRoles extends superclass {
      @manyToMany(() => Role, {
        pivotTable: tableName,
        pivotForeignKey: 'model_id',
        pivotRelatedForeignKey: 'role_id',
      })
      public declare roles: ManyToMany<typeof Role>;

      public async assignRole(
        this: ModelWithRoles & HasRolesModel,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<void> {
        const roleModels = await this.getRolesOrCreate(...roles);

        await this.related('roles').attach(roleModels.map((role) => role.id));
      }

      public async syncRoles(
        this: ModelWithRoles & HasRolesModel,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<void> {
        const roleModels = await this.getRolesOrCreate(...roles);

        await this.related('roles').sync(roleModels.map((role) => role.id));
      }

      public async revokeRole(
        this: ModelWithRoles & HasRolesModel,
        roleTarget: string | InstanceType<RoleModel>,
      ): Promise<void> {
        const roleModels = await this.getRolesOrCreate(roleTarget);

        await this.related('roles').detach(roleModels.map((role) => role.id));
      }

      public async hasRole(
        this: ModelWithRoles & HasRolesModel,
        role: string | InstanceType<RoleModel>,
      ): Promise<boolean> {
        const roleTarget = this.getRoleTargetName(role);

        const roleModel = await this.related('roles').query().where('name', roleTarget).first();

        return Boolean(roleModel);
      }

      public async hasAnyRoles(
        this: ModelWithRoles & HasRolesModel,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<boolean> {
        await this.load('roles');

        return roles.some((role) =>
          this.roles.some((role2) => role2.name === this.getRoleTargetName(role)),
        );
      }

      public async hasAllRoles(
        this: ModelWithRoles & HasRolesModel,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<boolean> {
        await this.load('roles');

        return roles.every((role) =>
          this.roles.some((role2) => role2.name === this.getRoleTargetName(role)),
        );
      }

      public async getRoleNames(this: ModelWithRoles & HasRolesModel): Promise<string[]> {
        await this.load('roles');

        return this.roles.map((r) => r.name);
      }

      private getRoleTargetName(role: string | InstanceType<RoleModel>): string {
        return typeof role === 'string' ? role : role.name;
      }

      private async getRolesOrCreate(
        this: ModelWithRoles & HasRolesModel,
        ...roles: (InstanceType<RoleModel> | string)[]
      ): Promise<InstanceType<RoleModel>[]> {
        const rolesToSearch = roles.map((role) => {
          return {
            name: this.getRoleTargetName(role),
          };
        });

        return Role.fetchOrCreateMany('name', rolesToSearch);
      }
    }

    return ModelWithRoles as unknown as MixinModelWithRole<typeof superclass>;
  };
};
