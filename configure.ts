/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import type ConfigureCommand from '@adonisjs/core/commands/configure';
import { stubsRoot } from './stubs/main.js';

const configure = async function (command: ConfigureCommand): Promise<void> {
  const { defaults, migrations, middlewares } = command.parsedFlags as {
    defaults: boolean | undefined;
    migrations: boolean | undefined;
    middlewares: boolean | undefined;
  };

  let shouldCreateMigrations = migrations;
  let shouldInstallMiddlewares = middlewares;

  const defaultConfig = {
    rolesTable: 'roles',
    permissionsTable: 'permissions',
    roleHasPermissionsTable: 'role_has_permissions',
  };

  if (defaults === undefined || !defaults) {
    defaultConfig.rolesTable = await command.prompt.ask('Enter the roles table name:', {
      default: 'roles',
      validate: (value) => {
        return Boolean(value.trim());
      },
    });

    defaultConfig.permissionsTable = await command.prompt.ask('Enter the permissions table name:', {
      default: 'permissions',
      validate: (value) => {
        return Boolean(value.trim());
      },
    });

    defaultConfig.roleHasPermissionsTable = await command.prompt.ask(
      'Enter the roles and permissions pivot table name',
      {
        default: 'role_has_permissions',
        validate: (value) => {
          return Boolean(value.trim());
        },
      },
    );
  }

  if (shouldCreateMigrations === undefined) {
    shouldCreateMigrations = await command.prompt.confirm(
      'Do you want to create migrations files?',
      {
        name: 'migrations',
      },
    );
  }

  if (shouldInstallMiddlewares === undefined) {
    shouldInstallMiddlewares = await command.prompt.confirm(
      'Do you want to register middlewares?',
      {
        name: 'middlewares',
      },
    );
  }

  const codemods = await command.createCodemods();

  /** Publish provider */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addCommand('adonis-lucid-permission/commands');
    rcFile.addProvider('adonis-lucid-permission/permissions_provider');
  });

  /** Publish stubs */
  await codemods.makeUsingStub(stubsRoot, 'config.stub', { config: defaultConfig });

  if (shouldCreateMigrations) {
    await codemods.makeUsingStub(stubsRoot, 'migrations/permissions.stub', {
      migration: {
        tableName: defaultConfig.permissionsTable,
        fileName: `${Date.now()}_create_${defaultConfig.permissionsTable}_table.ts`,
      },
    });

    await codemods.makeUsingStub(stubsRoot, 'migrations/roles.stub', {
      migration: {
        tableName: defaultConfig.rolesTable,
        fileName: `${Date.now()}_create_${defaultConfig.rolesTable}_table.ts`,
      },
    });

    await codemods.makeUsingStub(stubsRoot, 'migrations/roles_pivot.stub', {
      migration: {
        tableName: defaultConfig.roleHasPermissionsTable,
        fileName: `${Date.now()}_create_${defaultConfig.roleHasPermissionsTable}_table.ts`,
      },
      permissionsTable: defaultConfig.permissionsTable,
      rolesTable: defaultConfig.rolesTable,
    });
  }

  if (shouldInstallMiddlewares) {
    await codemods.registerMiddleware('named', [
      {
        name: 'role',
        path: 'adonis-lucid-permission/role_middleware',
      },
      {
        name: 'permission',
        path: 'adonis-lucid-permission/permission_middleware',
      },
      {
        name: 'roleOrPermission',
        path: 'adonis-lucid-permission/role_or_permission_middleware',
      },
    ]);
  }
};

export { configure };
