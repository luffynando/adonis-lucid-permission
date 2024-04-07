import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { type DateTime } from 'luxon';
import { withPermissions } from '../mixins/with_permissions.js';
import {
  type ResolvedPermissionConfig,
  type RoleModel,
  type RolePropertiesModel,
} from '../types.js';

const createRoleModel = (config: ResolvedPermissionConfig): RoleModel => {
  const pivotTable = config.tableNames.roleHasPermissions;
  const HasPermissions = withPermissions(pivotTable);

  class Role extends compose(BaseModel, HasPermissions) implements RolePropertiesModel {
    public static table = config.tableNames.roles;

    @column({ isPrimary: true })
    public declare id: number;

    @column()
    public declare name: string;

    @column.dateTime({ autoCreate: true })
    public declare createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public declare updatedAt: DateTime | null;
  }

  return Role;
};

export default createRoleModel;
