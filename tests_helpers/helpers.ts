import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Emitter } from '@adonisjs/core/events';
import { IgnitorFactory } from '@adonisjs/core/factories';
import { LoggerFactory } from '@adonisjs/core/factories/logger';
import { type ApplicationService } from '@adonisjs/core/types';
import { Database } from '@adonisjs/lucid/database';
import { BaseModel } from '@adonisjs/lucid/orm';
import { getActiveTest } from '@japa/runner';
import defineConfig from '../src/define_config.js';
import {
  type PermissionModel,
  type RoleModel,
  type WithAuthorizable,
  type WithPermissions,
  type WithRoles,
} from '../src/types.js';

export const BASE_URL = new URL('tmp/', import.meta.url);

type TestHelperContext = {
  test: NonNullable<ReturnType<typeof getActiveTest>>;
};

const assertInTestEnvironment = <T>(
  fn: (context: TestHelperContext) => T,
  fnName = 'customFn',
): T => {
  const test = getActiveTest();

  if (!test) {
    throw new Error(`Cannot use "${fnName}" outside of a Japa test`);
  }

  return fn({ test });
};

export const createDatabase = (app: ApplicationService): Promise<Database> =>
  assertInTestEnvironment(async ({ test }) => {
    await mkdir(test.context.fs.basePath);

    const logger = new LoggerFactory().create();
    const emitter = new Emitter(app);
    const db = new Database(
      {
        connection: 'sqlite',
        connections: {
          sqlite: {
            client: 'sqlite3',
            connection: { filename: path.join(test.context.fs.basePath, 'db.sqlite3') },
          },
        },
      },
      logger,
      emitter,
    );

    test.cleanup(() => db.manager.closeAll());
    BaseModel.useAdapter(db.modelAdapter());

    return db;
  }, 'createDatabase');

export const createTables = (
  db: Database,
  {
    rolesTable = 'roles',
    permissionsTable = 'permissions',
    rolePermissionsTable = 'role_has_permissions',
    rolesPivotTable = 'model_has_roles',
    permissionsPivotTable = 'model_has_permissions',
    modelsTable = 'models',
  } = {},
): Promise<void> =>
  assertInTestEnvironment(async ({ test }) => {
    test.cleanup(async () => {
      await db.connection().schema.dropTableIfExists(permissionsPivotTable);
      await db.connection().schema.dropTableIfExists(rolesPivotTable);
      await db.connection().schema.dropTableIfExists(rolePermissionsTable);
      await db.connection().schema.dropTableIfExists(permissionsTable);
      await db.connection().schema.dropTableIfExists(rolesTable);
      await db.connection().schema.dropTableIfExists(modelsTable);
    });

    await db.connection().schema.createTableIfNotExists(modelsTable, (table) => {
      table.increments('id').primary();
    });

    await db.connection().schema.createTableIfNotExists(rolesTable, (table) => {
      table.increments('id').notNullable();
      table.string('name').notNullable().unique();
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });

    await db.connection().schema.createTableIfNotExists(permissionsTable, (table) => {
      table.increments('id').notNullable();
      table.string('name').notNullable().unique();
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });

    await db.connection().schema.createTableIfNotExists(rolePermissionsTable, (table) => {
      table.increments('id').notNullable();
      table
        .integer('permission_id')
        .unsigned()
        .references('id')
        .inTable(permissionsTable)
        .onDelete('CASCADE');
      table.integer('model_id').unsigned().references('id').inTable(rolesTable).onDelete('CASCADE');
    });

    await db.connection().schema.createTableIfNotExists(rolesPivotTable, (table) => {
      table.increments('id').notNullable();
      table.integer('role_id').unsigned().references('id').inTable(rolesTable).onDelete('CASCADE');
      table
        .integer('model_id')
        .unsigned()
        .references('id')
        .inTable(modelsTable)
        .onDelete('CASCADE');
    });

    await db.connection().schema.createTableIfNotExists(permissionsPivotTable, (table) => {
      table.increments('id').notNullable();
      table
        .integer('permission_id')
        .unsigned()
        .references('id')
        .inTable(permissionsTable)
        .onDelete('CASCADE');
      table
        .integer('model_id')
        .unsigned()
        .references('id')
        .inTable(modelsTable)
        .onDelete('CASCADE');
    });
  }, 'createTables');

export const setupApp = async (
  includeProvider = false,
  includeConfig = false,
): Promise<{
  app: ApplicationService;
}> =>
  assertInTestEnvironment(async ({ test }) => {
    const config = {
      ...(includeConfig ? { permissions: defineConfig({}) } : {}),
    };
    const providers = includeProvider ? [() => import('../providers/permissions_provider.js')] : [];

    const ignitor = new IgnitorFactory()
      .merge({ rcFileContents: { providers } })
      .withCoreProviders()
      .withCoreConfig()
      .merge({ config })
      .create(BASE_URL, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, BASE_URL).href);
          }

          return import(filePath);
        },
      });

    const app = ignitor.createApp('web');

    await app.init();
    await app.boot();
    test.cleanup(() => app.terminate());

    return { app };
  }, 'setupApp');

export const getMixins = async (): Promise<{
  withPermissions: WithPermissions;
  withRoles: WithRoles;
  withAuthorizable: WithAuthorizable;
  Role: RoleModel;
  Permission: PermissionModel;
}> =>
  assertInTestEnvironment(async () => {
    const { withPermissions } = await import('../src/mixins/with_permissions.js');
    const { withRoles } = await import('../src/mixins/with_roles.js');
    const { withAuthorizable } = await import('../src/mixins/with_authorizable.js');
    const { Permission } = await import('../services/permission.js');
    const { Role } = await import('../services/role.js');

    return {
      withPermissions,
      withRoles,
      withAuthorizable,
      Role,
      Permission,
    };
  }, 'createMixins');
