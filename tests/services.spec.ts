import { BaseModel } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { setupApp } from '../tests_helpers/helpers.js';

test.group('service provider', () => {
  test('resolve permission service shortcout import', async ({ assert }) => {
    await setupApp(true, true);

    const { Permission } = await import('../services/permission.js');
    const { Role } = await import('../services/role.js');

    assert.instanceOf(new Permission(), BaseModel);
    assert.instanceOf(new Role(), BaseModel);
  });
});
