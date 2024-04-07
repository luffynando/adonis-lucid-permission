import { BaseModel } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { setupApp } from '../tests_helpers/helpers.js';

test.group('permission provider', () => {
  test('register permission and role singletons', async ({ assert }) => {
    const { app } = await setupApp(true, true);

    const Permission = await app.container.make('permission');
    const Role = await app.container.make('role');

    assert.instanceOf(new Permission(), BaseModel);
    assert.instanceOf(new Role(), BaseModel);
  });

  test('register permission and role singletons throw error if config not defined', async ({
    assert,
  }) => {
    const { app } = await setupApp(true);

    const errorMsg =
      'Invalid "config/permissions.ts" file. Make sure you are using the "defineConfig" method';

    await assert.rejects(async () => {
      await app.container.make('permission');
    }, errorMsg);
    await assert.rejects(async () => {
      await app.container.make('role');
    }, errorMsg);
  });
});
