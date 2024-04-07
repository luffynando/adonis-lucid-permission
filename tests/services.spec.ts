import { BaseModel } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { setupApp } from '../tests_helpers/helpers.js';

test.group('service provider', () => {
  test('resolve permission service shortcout import', async ({ assert }) => {
    await setupApp(true, true);

    const PermissionModel = await import('../services/permission.js');
    const RoleModel = await import('../services/role.js');
    const Permission = PermissionModel.default;
    const Role = RoleModel.default;

    assert.instanceOf(new Permission(), BaseModel);
    assert.instanceOf(new Role(), BaseModel);
  });
});
