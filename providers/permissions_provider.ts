/* eslint-disable @typescript-eslint/consistent-type-definitions */
import { configProvider } from '@adonisjs/core';
import { RuntimeException } from '@adonisjs/core/exceptions';
import { type ApplicationService } from '@adonisjs/core/types';
import createPermissionModel from '../src/models/permission.js';
import createRoleModel from '../src/models/role.js';
import {
  type PermissionModel,
  type PermissionsConfig,
  type ResolvedPermissionConfig,
  type RoleModel,
} from '../src/types.js';

export default class PermissionsProvider {
  public constructor(protected app: ApplicationService) {}

  public register(): void {
    this.app.container.singleton('permission', async () => {
      const permissionConfigProvider = this.app.config.get<PermissionsConfig>('permissions');
      const config = await configProvider.resolve<ResolvedPermissionConfig>(
        this.app,
        permissionConfigProvider,
      );

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/permissions.ts" file. Make sure you are using the "defineConfig" method',
        );
      }

      const Permission = createPermissionModel(config);

      return Permission;
    });

    this.app.container.singleton('role', async () => {
      const permissionConfigProvider = this.app.config.get<PermissionsConfig>('permissions');
      const config = await configProvider.resolve<ResolvedPermissionConfig>(
        this.app,
        permissionConfigProvider,
      );

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/permissions.ts" file. Make sure you are using the "defineConfig" method',
        );
      }

      const Role = createRoleModel(config);

      return Role;
    });
  }
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    permission: PermissionModel;
    role: RoleModel;
  }
}
