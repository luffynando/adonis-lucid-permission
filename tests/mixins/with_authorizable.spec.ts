import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { createDatabase, createTables, getMixins, setupApp } from '../../tests_helpers/helpers.js';

test.group('with authorizable', () => {
  const init = async () => {
    const { app } = await setupApp(true, true);
    const { Role, Permission, withAuthorizable } = await getMixins();

    const HasAuthorizable = withAuthorizable({
      rolesPivotTable: 'model_has_roles',
      permissionsPivotTable: 'model_has_permissions',
    });

    return { app, Role, Permission, HasAuthorizable };
  };

  test('mixin gets applied succesfully', async ({ assert }) => {
    const { HasAuthorizable } = await init();

    class Model extends compose(BaseModel, HasAuthorizable) {}

    // Has permissions
    assert.equal(Model.$relationsDefinitions.get('permissions')?.relationName, 'permissions');
    assert.isFunction(Model.prototype.hasPermissionTo);
    assert.isFunction(Model.prototype.checkPermissionTo);
    assert.isFunction(Model.prototype.hasAnyPermission);
    assert.isFunction(Model.prototype.hasAllPermissions);
    assert.isFunction(Model.prototype.givePermissionTo);
    assert.isFunction(Model.prototype.syncPermissions);
    assert.isFunction(Model.prototype.revokePermissionTo);
    assert.isFunction(Model.prototype.getPermissionNames);

    // Has roles
    assert.equal(Model.$relationsDefinitions.get('roles')?.relationName, 'roles');
    assert.isFunction(Model.prototype.assignRole);
    assert.isFunction(Model.prototype.syncRoles);
    assert.isFunction(Model.prototype.revokeRole);
    assert.isFunction(Model.prototype.hasRole);
    assert.isFunction(Model.prototype.hasAnyRole);
    assert.isFunction(Model.prototype.hasAllRoles);
    assert.isFunction(Model.prototype.getRoleNames);

    // Authorizable
    assert.isFunction(Model.prototype.hasDirectPermission);
    assert.isFunction(Model.prototype.hasPermissionViaRole);
    assert.isFunction(Model.prototype.getPermissionsViaRoles);
    assert.isFunction(Model.prototype.getAllPermissions);
  });

  test('pivot table names comes from mixin argument', async ({ assert }) => {
    const { HasAuthorizable } = await init();

    class Model extends compose(BaseModel, HasAuthorizable) {}

    assert.equal(
      (
        Model.$relationsDefinitions.get('permissions')! as unknown as {
          options: { pivotTable: string };
        }
      ).options.pivotTable,
      'model_has_permissions',
    );
    assert.equal(
      (
        Model.$relationsDefinitions.get('roles')! as unknown as {
          options: { pivotTable: string };
        }
      ).options.pivotTable,
      'model_has_roles',
    );
  });

  test('can test for model direct permissions', async ({ assert }) => {
    const { HasAuthorizable, app, Role, Permission } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasAuthorizable) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    const role = await Role.create({ name: 'role1' });

    await role.givePermissionTo('permission2');
    await model.assignRole(role);

    const permission = await Permission.create({ name: 'permission3' });

    assert.isTrue(await model.hasDirectPermission('permission1'));
    assert.isFalse(await model.hasDirectPermission('permission2'));
    assert.isFalse(await model.hasDirectPermission(permission));
  });

  test('can test for model role permissions', async ({ assert }) => {
    const { HasAuthorizable, app, Role, Permission } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasAuthorizable) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    const role = await Role.create({ name: 'role1' });

    await role.givePermissionTo('permission2');
    await model.assignRole(role);

    const permission = await Permission.create({ name: 'permission3' });

    assert.isFalse(await model.hasPermissionViaRole('permission1'));
    assert.isTrue(await model.hasPermissionViaRole('permission2'));
    assert.isFalse(await model.hasPermissionViaRole(permission));
  });

  test('can get model direct permissions', async ({ assert }) => {
    const { HasAuthorizable, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasAuthorizable) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    const role = await Role.create({ name: 'role1' });

    await role.givePermissionTo('permission2');
    await model.assignRole(role);

    const directPermissions = await model.getDirectPermissions();

    assert.sameMembers(
      directPermissions.map(({ name }) => name),
      ['permission1'],
    );
  });

  test('can get model permissions via roles', async ({ assert }) => {
    const { HasAuthorizable, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasAuthorizable) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    const role = await Role.create({ name: 'role1' });

    await role.givePermissionTo('permission2');
    await model.assignRole(role);

    const permissionsViaRoles = await model.getPermissionsViaRoles();

    assert.sameMembers(
      permissionsViaRoles.map(({ name }) => name),
      ['permission2'],
    );
  });

  test('can get all model permissions', async ({ assert }) => {
    const { HasAuthorizable, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasAuthorizable) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.givePermissionTo('permission1');
    const role = await Role.create({ name: 'role1' });

    await role.givePermissionTo('permission2');
    await model.assignRole(role);

    const allPermissions = await model.getAllPermissions();

    assert.sameMembers(
      allPermissions.map(({ name }) => name),
      ['permission1', 'permission2'],
    );
  });
});
