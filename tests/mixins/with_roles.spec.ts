import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { createDatabase, createTables, getMixins, setupApp } from '../../tests_helpers/helpers.js';

test.group('with roles', () => {
  const init = async () => {
    const { app } = await setupApp(true, true);
    const { withRoles, Role } = await getMixins();
    const HasRoles = withRoles('model_has_roles');

    return { app, HasRoles, Role };
  };

  test('mixin gets applied succesfully', async ({ assert }) => {
    const { HasRoles } = await init();

    class Model extends compose(BaseModel, HasRoles) {}

    assert.equal(Model.$relationsDefinitions.get('roles')?.relationName, 'roles');
    assert.isFunction(Model.prototype.assignRole);
    assert.isFunction(Model.prototype.syncRoles);
    assert.isFunction(Model.prototype.revokeRole);
    assert.isFunction(Model.prototype.hasRole);
    assert.isFunction(Model.prototype.hasAnyRoles);
    assert.isFunction(Model.prototype.hasAllRoles);
    assert.isFunction(Model.prototype.getRoleNames);
  });

  test('pivot table names comes from mixin argument', async ({ assert }) => {
    const { HasRoles } = await init();

    class Model extends compose(BaseModel, HasRoles) {}

    assert.equal(
      (
        Model.$relationsDefinitions.get('roles')! as unknown as {
          options: { pivotTable: string };
        }
      ).options.pivotTable,
      'model_has_roles',
    );
  });

  test('can assign and access related roles', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    for (let i = 0; i < 10; i += 1) {
      await model.assignRole(`role-${i}`);
    }

    const role = await Role.create({ name: 'role-11' });

    await model.assignRole(role);
    await model.load('roles');

    assert.lengthOf(model.roles, 11);
  });

  test('can check if a model has a role', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});
    const role = await Role.create({ name: 'role-2' });

    await model.assignRole('role-1');

    assert.isTrue(await model.hasRole('role-1'));
    assert.isFalse(await model.hasRole(role));
  });

  test('can check if a model has any of the given roles', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});
    const role = await Role.create({ name: 'role-2' });

    await model.assignRole('role-1');

    assert.isTrue(await model.hasAnyRoles('role-1', role));
    assert.isFalse(await model.hasAnyRoles(role, 'role-2'));
  });

  test('can check if a model has all of the given roles', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});
    const role = await Role.create({ name: 'role-2' });

    await model.assignRole('role-1', role);

    assert.isTrue(await model.hasAllRoles('role-1', role));
    assert.isFalse(await model.hasAllRoles('role-1', role, 'role-3'));
  });

  test('can get role names', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});
    const role = await Role.create({ name: 'role-2' });

    await model.assignRole('role-1', role);

    assert.sameMembers(await model.getRoleNames(), ['role-1', 'role-2']);
  });

  test('can sync roles', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});

    await model.assignRole('role-1');
    const role = await Role.create({ name: 'role-2' });

    await model.syncRoles('role-3', role);

    assert.sameMembers(await model.getRoleNames(), ['role-3', 'role-2']);
  });

  test('can remove roles', async ({ assert }) => {
    const { HasRoles, app, Role } = await init();
    const db = await createDatabase(app);

    await createTables(db);

    class Model extends compose(BaseModel, HasRoles) {
      @column({ isPrimary: true })
      public declare id: number;
    }

    const model = await Model.create({});
    const role = await Role.create({ name: 'role-2' });

    await model.assignRole('role-1', role);
    await model.assignRole('role-3');
    await model.revokeRole('role-1');
    await model.revokeRole(role);

    await model.load('roles');

    assert.lengthOf(model.roles, 1);
    assert.sameMembers(
      model.roles.map(({ name }) => name),
      ['role-3'],
    );
  });
});
