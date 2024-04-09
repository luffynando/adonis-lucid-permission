import { compose } from '@adonisjs/core/helpers';
import { BaseModel } from '@adonisjs/lucid/orm';
import { test } from '@japa/runner';
import { getMixins, setupApp } from '../../tests_helpers/helpers.js';

test.group('types no overlap', () => {
  const init = async () => {
    const { app } = await setupApp(true, true);
    const { withPermissions, withRoles } = await getMixins();

    const HasPermissions = withPermissions('model_has_permissions');
    const HasRoles = withRoles('model_has_roles');

    return { app, HasPermissions, HasRoles };
  };

  test('using permissions mixins not overlap basemodel and others mixins', async ({ assert }) => {
    const { HasPermissions, HasRoles } = await init();

    class Model extends compose(BaseModel, HasPermissions, HasRoles) {}

    const model = new Model();

    assert.typeOf(model.assignRole, 'function');

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
    assert.isFunction(Model.prototype.hasAnyRoles);
    assert.isFunction(Model.prototype.hasAllRoles);
    assert.isFunction(Model.prototype.getRoleNames);
  });
});
