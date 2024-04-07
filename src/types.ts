import { type NormalizeConstructor } from '@adonisjs/core/types/helpers';
import { type LucidModel, type LucidRow } from '@adonisjs/lucid/types/model';
import { type ManyToMany } from '@adonisjs/lucid/types/relations';

export interface PermissionPropertiesModel extends LucidRow {
  id: string | number;
  name: string;
}

export interface PermissionModel extends Omit<LucidModel, 'constructor'> {
  new (): PermissionPropertiesModel;
}

export interface RolePropertiesModel extends LucidRow {
  id: string | number;
  name: string;
}

export interface RoleModel extends Omit<LucidModel, 'constructor'> {
  new (): RolePropertiesModel & HasPermissionsModel;
}

export interface HasPermissionsProperties extends LucidRow {
  permissions: ManyToMany<PermissionModel>;
}

export interface HasPermissionsModel extends HasPermissionsProperties {
  hasPermissionTo: (permission: InstanceType<PermissionModel> | string) => Promise<boolean>;
  checkPermissionTo: (permission: InstanceType<PermissionModel> | string) => Promise<boolean>;
  hasAnyPermission: (
    ...permissions: (InstanceType<PermissionModel> | string)[]
  ) => Promise<boolean>;
  hasAllPermissions: (
    ...permissions: (InstanceType<PermissionModel> | string)[]
  ) => Promise<boolean>;
  givePermissionTo: (...permissions: (InstanceType<PermissionModel> | string)[]) => Promise<void>;
  syncPermissions: (...permissions: (InstanceType<PermissionModel> | string)[]) => Promise<void>;
  revokePermissionTo: (permission: InstanceType<PermissionModel> | string) => Promise<void>;
  getPermissionNames: () => Promise<string[]>;
  getPermissionTarget: (permission: string | InstanceType<PermissionModel>) => string;
}

export interface MixinModelWithPermission<Model extends NormalizeConstructor<LucidModel>>
  extends Omit<LucidModel, 'constructor'> {
  new (): Model & HasPermissionsModel;
}

export type WithPermissions = (
  tableName: string,
) => <Model extends NormalizeConstructor<LucidModel>>(
  superclass: Model,
) => MixinModelWithPermission<Model>;

export interface HasRolesProperties extends LucidRow {
  roles: ManyToMany<RoleModel>;
}

export interface HasRolesModel extends HasRolesProperties {
  assignRole: (...roles: (InstanceType<RoleModel> | string)[]) => Promise<void>;
  syncRoles: (...roles: (InstanceType<RoleModel> | string)[]) => Promise<void>;
  revokeRole: (role: InstanceType<RoleModel> | string) => Promise<void>;
  hasRole: (role: InstanceType<RoleModel> | string) => Promise<boolean>;
  hasAnyRoles: (...roles: (InstanceType<RoleModel> | string)[]) => Promise<boolean>;
  hasAllRoles: (...roles: (InstanceType<RoleModel> | string)[]) => Promise<boolean>;
  getRoleNames: () => Promise<string[]>;
}

export interface MixinModelWithRole<Model extends NormalizeConstructor<LucidModel>>
  extends Omit<LucidModel, 'constructor'> {
  new (): Model & HasRolesModel;
}

export type WithRoles = (
  tableName: string,
) => <Model extends NormalizeConstructor<LucidModel>>(
  superclass: Model,
) => MixinModelWithRole<Model>;

export interface HasAuthorizableModel extends HasRolesModel, HasPermissionsModel {
  hasDirectPermission: (permission: InstanceType<PermissionModel> | string) => Promise<boolean>;
  hasPermissionViaRole: (permission: InstanceType<PermissionModel> | string) => Promise<boolean>;
  getDirectPermissions: () => Promise<InstanceType<PermissionModel>[]>;
  getPermissionsViaRoles: () => Promise<InstanceType<PermissionModel>[]>;
  getAllPermissions: () => Promise<InstanceType<PermissionModel>[]>;
}

export interface MixinModelWithAuthorizable<Model extends NormalizeConstructor<LucidModel>>
  extends Omit<LucidModel, 'constructor'> {
  new (): Model & HasAuthorizableModel;
}

export type WithAuthorizable = (
  config: AuthorizableConfig,
) => <Model extends NormalizeConstructor<LucidModel>>(
  superclass: Model,
) => MixinModelWithAuthorizable<Model>;

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
};

export type ResolvedPermissionConfig = Required<PermissionsConfig>;
