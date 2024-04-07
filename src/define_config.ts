import { configProvider } from '@adonisjs/core';
import { type ConfigProvider } from '@adonisjs/core/types';
import { type PermissionsConfig, type ResolvedPermissionConfig } from './types.js';

const defineConfig = (config: PermissionsConfig): ConfigProvider<ResolvedPermissionConfig> => {
  return configProvider.create(async (_) => {
    return {
      tableNames: {
        roles: config.tableNames?.roles ?? 'roles',
        permissions: config.tableNames?.permissions ?? 'permissions',
        roleHasPermissions: config.tableNames?.roleHasPermissions ?? 'role_has_permissions',
      },
    };
  });
};

export default defineConfig;
