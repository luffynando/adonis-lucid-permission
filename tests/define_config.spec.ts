import { test } from '@japa/runner';
import defineConfig from '../src/define_config.js';
import { setupApp } from '../tests_helpers/helpers.js';

test.group('define config', () => {
  test('defaults optain in empty config', async ({ assert }) => {
    const { app } = await setupApp();
    const configProvider = defineConfig({});
    const result = await configProvider.resolver(app);
    const defaultValues = {
      tableNames: {
        roles: 'roles',
        permissions: 'permissions',
        roleHasPermissions: 'role_has_permissions',
      },
    };

    assert.deepEqual(result, defaultValues);
  });

  test('override config optain expected values', async ({ assert }) => {
    const { app } = await setupApp();
    const customValues = {
      tableNames: {
        roles: 'roles_a',
        permissions: 'permissions_a',
        roleHasPermissions: 'role_has_permissions_a',
      },
    };
    const configProvider = defineConfig(customValues);
    const result = await configProvider.resolver(app);

    assert.deepEqual(result.tableNames, customValues.tableNames);
    assert.notEqual(result.tableNames.roles, 'roles');
    assert.notEqual(result.tableNames.permissions, 'permissions');
    assert.notEqual(result.tableNames.roleHasPermissions, 'role_has_permissions');
  });
});
