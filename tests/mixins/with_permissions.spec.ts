import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { createDatabase, createTables, getMixins, setupApp } from '../../tests_helpers/helpers.js';

test.group('with permissions', () => {
  const init = async () => {
    const { app } = await setupApp(true, true);
    const { withPermissions, Permission } = await getMixins();
    const HasPermissions = withPermissions('model_has_permissions');

    return { app, HasPermissions, Permission };
  };

  test('mixin gets applied succesfully', async ({ assert }) => {
    const { HasPermissions } = await init();

    class Model extends compose(BaseModel, HasPermissions) {}

    assert.equal(Model.$relationsDefinitions.get('permissions')?.relationName, 'permissions');
    assert.isFunction(Model.prototype.hasPermissionTo);
    assert.isFunction(Model.prototype.checkPermissionTo);
    assert.isFunction(Model.prototype.hasAnyPermission);
    assert.isFunction(Model.prototype.hasAllPermissions);
    assert.isFunction(Model.prototype.givePermissionTo);
    assert.isFunction(Model.prototype.syncPermissions);
    assert.isFunction(Model.prototype.revokePermissionTo);
    assert.isFunction(Model.prototype.getPermissionNames);
  });

  test('pivot table names comes from mixin argument', async ({ assert }) => {
    const { HasPermissions } = await init();

    class Model extends compose(BaseModel, HasPermissions) {}

    assert.equal(
      (
        Model.$relationsDefinitions.get('permissions')! as unknown as {
          options: { pivotTable: string };
        }
      ).options.pivotTable,
      'model_has_permissions',
    );
  });

  test('can assign and access related permissions', async ({ assert }) => {
    const { HasPermissions, app, Permission } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    for (let i = 0; i < 10; i += 1) {
      await model.givePermissionTo(`permission-${i}`);
    }

    const permission = await Permission.create({ name: 'permission-11' });

    await model.givePermissionTo(permission);
    await model.load('permissions');

    assert.lengthOf(model.permissions, 11);
  });

  test('can check if a model has a permission', async ({ assert }) => {
    const { HasPermissions, app, Permission } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});
    const permissionName = 'permission-1';

    await model.givePermissionTo(permissionName);
    const permission = await Permission.findByOrFail('name', permissionName);

    assert.isTrue(await model.hasPermissionTo(permission));
    assert.isTrue(await model.hasPermissionTo(permissionName));
    assert.isTrue(await model.checkPermissionTo(permissionName));
    await assert.rejects(
      async () => model.checkPermissionTo('permission-2'),
      'User does not have permission to permission-2',
    );
  });

  test('can check if a model has any of the given permissions', async ({ assert }) => {
    const { HasPermissions, app } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    await model.givePermissionTo('permission2');

    assert.isTrue(await model.hasAnyPermission('permission1', 'permission2'));
    assert.isTrue(await model.hasAnyPermission('permission1', 'permission3'));
    assert.isFalse(await model.hasAnyPermission('permission3', 'permission4'));
  });

  test('can check if a model has all of the given permissions', async ({ assert }) => {
    const { HasPermissions, app } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    await model.givePermissionTo('permission2');

    assert.isTrue(await model.hasAllPermissions('permission1', 'permission2'));
    assert.isFalse(await model.hasAllPermissions('permission1', 'permission3'));
    assert.isFalse(await model.hasAllPermissions('permission3', 'permission4'));
  });

  test('can sync model permissions', async ({ assert }) => {
    const { HasPermissions, app, Permission } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    await model.givePermissionTo('permission2');

    const permission = await Permission.create({ name: 'permission4' });

    await model.syncPermissions('permission1', 'permission3', permission);
    await model.load('permissions');

    assert.lengthOf(model.permissions, 3);
    assert.sameMembers(
      model.permissions.map(({ name }) => name),
      ['permission1', 'permission3', 'permission4'],
    );
  });

  test('can revoke model permissions', async ({ assert }) => {
    const { HasPermissions, app, Permission } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1', 'permission2', 'permission3');
    await model.revokePermissionTo('permission1');

    const permission = await Permission.findByOrFail('name', 'permission3');

    await model.revokePermissionTo(permission);
    await model.load('permissions');

    assert.lengthOf(model.permissions, 1);
    assert.sameMembers(
      model.permissions.map(({ name }) => name),
      ['permission2'],
    );
  });

  test('can get model permission names', async ({ assert }) => {
    const { HasPermissions, app } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasPermissions) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1', 'permission2');

    assert.sameMembers(await model.getPermissionNames(), ['permission1', 'permission2']);
  });
});
