import { type NormalizeConstructor } from '@adonisjs/core/types/helpers';
import { type LucidModel, type LucidRow } from '@adonisjs/lucid/types/model';
import { type ManyToMany } from '@adonisjs/lucid/types/relations';

export type NoConstructor<T> = Omit<T, 'constructor'>;

export interface PermissionPropertiesModel extends LucidRow {
  id: string | number;
  name: string;
}

export interface HasPermissionsProperties extends LucidRow {
  permissions: ManyToMany<PermissionModel>;
}

export interface HasPermissionsMethods {
  hasPermissionTo(permission: InstanceType<PermissionModel> | string): Promise<boolean>;
  checkPermissionTo(permission: InstanceType<PermissionModel> | string): Promise<boolean>;
  hasAnyPermission(...permissions: (InstanceType<PermissionModel> | string)[]): Promise<boolean>;
  hasAllPermissions(...permissions: (InstanceType<PermissionModel> | string)[]): Promise<boolean>;
  givePermissionTo(...permissions: (InstanceType<PermissionModel> | string)[]): Promise<void>;
  syncPermissions(...permissions: (InstanceType<PermissionModel> | string)[]): Promise<void>;
  revokePermissionTo(permission: InstanceType<PermissionModel> | string): Promise<void>;
  getPermissionNames(): Promise<string[]>;
  getPermissionTarget(permission: string | InstanceType<PermissionModel>): string;
}

export interface PermissionModel extends NoConstructor<LucidModel> {
  new (...args: unknown[]): PermissionPropertiesModel;
}

export interface MixinWithPermissions extends HasPermissionsMethods, HasPermissionsProperties {}

export interface RolePropertiesModel extends LucidRow {
  id: string | number;
  name: string;
}

export interface HasRolesProperties extends LucidRow {
  roles: ManyToMany<RoleModel>;
}

export interface HasRolesMethods {
  assignRole(...roles: (InstanceType<RoleModel> | string)[]): Promise<void>;
  syncRoles(...roles: (InstanceType<RoleModel> | string)[]): Promise<void>;
  revokeRole(role: InstanceType<RoleModel> | string): Promise<void>;
  hasRole(role: InstanceType<RoleModel> | string): Promise<boolean>;
  hasAnyRole(...roles: (InstanceType<RoleModel> | string)[]): Promise<boolean>;
  hasAllRoles(...roles: (InstanceType<RoleModel> | string)[]): Promise<boolean>;
  getRoleNames(): Promise<string[]>;
}

export interface RoleModel extends NoConstructor<LucidModel> {
  new (...args: unknown[]): RolePropertiesModel & MixinWithPermissions;
}

export interface MixinWithRoles extends HasRolesMethods, HasRolesProperties {}

export interface HasAuthorizableMethods {
  hasDirectPermission(permission: InstanceType<PermissionModel> | string): Promise<boolean>;
  hasPermissionViaRole(permission: InstanceType<PermissionModel> | string): Promise<boolean>;
  getDirectPermissions(): Promise<InstanceType<PermissionModel>[]>;
  getPermissionsViaRoles(): Promise<InstanceType<PermissionModel>[]>;
  getAllPermissions(): Promise<InstanceType<PermissionModel>[]>;
  withPermissionTo(permission: InstanceType<PermissionModel> | string): Promise<boolean>;
  canAnyPermission(...permissions: (InstanceType<PermissionModel> | string)[]): Promise<boolean>;
}

export interface MixinWithAuthorizable
  extends HasAuthorizableMethods,
    MixinWithRoles,
    MixinWithPermissions {}

export interface MixinModelWithPermissions extends NoConstructor<LucidModel> {
  new (...args: unknown[]): MixinWithPermissions;
}

export interface MixinModelWithRoles extends NoConstructor<LucidModel> {
  new (...args: unknown[]): MixinWithRoles;
}

export interface MixinModelWithAuthorizable extends NoConstructor<LucidModel> {
  new (...args: unknown[]): MixinWithAuthorizable;
}

export type WithPermissions = (
  tableName: string,
) => <Model extends NormalizeConstructor<LucidModel>>(
  superclass: Model,
) => NormalizeConstructor<MixinModelWithPermissions> & Model;

export type WithRoles = (
  tableName: string,
) => <Model extends NormalizeConstructor<LucidModel>>(
  superclass: Model,
) => NormalizeConstructor<MixinModelWithRoles> & Model;

export type WithAuthorizable = (
  config: AuthorizableConfig,
) => <Model extends NormalizeConstructor<LucidModel>>(
  superclass: Model,
) => NormalizeConstructor<MixinModelWithAuthorizable> & Model;

export interface AuthorizableConfig {
  permissionsPivotTable: string;
  rolesPivotTable: string;
}

export type PermissionsConfig = {
  tableNames?: {
    roles: string;
    permissions: string;
    roleHasPermissions: string;
  };
  columnNames?: {
    rolePivotKey: string;
    permissionPivotKey: string;
    modelMorphKey: string;
    teamForeignKey: string;
  };
  teams?: boolean;
};

export type ResolvedPermissionConfig = Required<PermissionsConfig>;
