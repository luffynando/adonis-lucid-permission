import { BaseModel, column } from '@adonisjs/lucid/orm';
import { type DateTime } from 'luxon';
import {
  type PermissionModel,
  type PermissionPropertiesModel,
  type ResolvedPermissionConfig,
} from '../types.js';

const createPermissionModel = (config: ResolvedPermissionConfig): PermissionModel => {
  class Permission extends BaseModel implements PermissionPropertiesModel {
    public static table = config.tableNames.permissions;

    @column({ isPrimary: true })
    public declare id: number;

    @column()
    public declare name: string;

    @column.dateTime({ autoCreate: true })
    public declare createdAt: DateTime;

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public declare updatedAt: DateTime | null;
  }

  return Permission;
};

export default createPermissionModel;
