# `adonis-lucid-permission`

[![Source Code][badge-source]][source]
[![Npm Node Version Support][badge-node-version]][node-version]
[![Latest Version][badge-release]][release]
[![Software License][badge-license]][license]
[![Build Status][badge-build]][build]
[![Total Downloads][badge-downloads]][downloads]

> Library for associate adonisjs lucid ORM models with roles and permissions

## Requisites

Requires `@adonisjs/core >= 6.5.0` and `@adonisjs/lucid >= 20.5.1`;

## Installation

NPM

```sh
npm i adonis-lucid-permission
```

YARN

```sh
yarn add adonis-lucid-permission
```

PNPM

```sh
pnpm add adonis-lucid-permission
```

After install call `configure`:

```sh
node ace configure adonis-lucid-permission
```

## Usage

After install and configure, apply HasAuthorizable to a Model

```ts
import { compose } from '@adonisjs/core/helpers';
import { BaseModel } from '@adonisjs/lucid/orm';
import { withAuthorizable } from 'adonis-lucid-permission';

const HasAuthorizable = withAuthorizable({
  rolesPivotTable: 'user_has_roles',
  permissionsPivotTable: 'user_has_permissions',
});

export default class User extends compose(BaseModel, HasAuthorizable) {
  // ...columns and props
}
```

And create the pivot-table migration file with:

```sh
node ace permissions:pivot-table
```

And ready. User model can all methods for associate roles and permissions

### Role and Permission model

Roles and Permissions are just Lucid models that can be directly managed like any other model

```ts
import { Permission } from 'adonis-lucid-permission/services/permission';
import { Role } from 'adonis-lucid-permission/services/role';

const role = await Role.create({ name: 'writer' });
const permission = await Permission.create({ name: 'edit-posts' });
```

### Managing permissions

You can manage permissions for roles and models using the same methods

```typescript
// Assigning permissions
await role.givePermissionTo('do-things');

// Removing permissions
await user.revokePermissionTo('do-things');

// Synchronize permissions
await role.syncPermissions('do-things', 'try-things');
```

### Checking for permissions

```typescript
// Checking permissions
await role.hasPermissionTo('do-things'); // returns true or false
await user.checkPermissionTo('do-things'); // returns true or throws

// Returns true if the model has any of the given permissions
await role.hasAnyPermission('do-things', 'try-things');

// Returns true if the model has all of the given permissions
await user.hasAllPermissions('do-things', 'try-things');

// Returns all permission names
await user.getPermissionNames();
```

### Managing Roles

You can manage roles for models using the `withAuthorizable` mixin

```typescript
// Assign role
await user.assignRole('admin');

// Revoke role
await user.revokeRole('admin');

// Synchronize roles
await user.syncRoles('admin', 'writer', role);
```

### Checking for roles

Generally you should be checking against permissions vs checking for roles, but if you want to check against a role instead use one of the following methods

```typescript
await user.hasRole('admin');

// Returns true if the model has any of the given permissions
await role.hasAnyRoles('admin', 'writer');

// Returns true if the model has all of the given permissions
await user.hasAllRoles('admin', 'writer');

// Returns all role names
await user.getRoleNames();
```

### Accessing direct and role permissions

```typescript
// Check if the model has the permission directly
await user.hasDirectPermission('do-things');

// Check if the model has the permission via role
await user.hasPermissionViaRole('do-things');

// Get all direct permissions
await user.getDirectPermissions();

// Get all permissions via roles
await user.getPermissionsViaRoles();

// Get all permissions combined
await user.getAllPermissions();
```

### Protect routes with middlewares

After version `1.1.0` added middlewares for protect routes using roles, permissions, or roles and permissions. Please check your `start/kernel.ts` file and middleware router named register like:

```ts
export const middleware = router.named({
  //...
  role: () => import('adonis-lucid-permission/role_middleware'),
  permission: () => import('adonis-lucid-permission/permission_middleware'),
  roleOrPermission: () => import('adonis-lucid-permission/role_or_permission_middleware'),
  //...
});
```

And in your router file, use after `middleware.auth()`, example:

```ts
import router from '@adonisjs/core/services/router';
import { middleware } from '#start/kernel';

router
  .post('projects', async ({ auth }) => {
    console.log(auth.user); // User
  })
  .use([
    middleware.auth(),
    middleware.permission({ permissions: ['publish projects', 'edit projects'] }),
  ]);

router
  .post('posts', async ({ auth }) => {
    console.log(auth.user); // User
  })
  .use([middleware.auth(), middleware.role({ roles: ['editor', 'administrator', 'publisher'] })]);

router
  .post('projects', async ({ auth }) => {
    console.log(auth.user); // User
  })
  .use([
    middleware.auth(),
    middleware.roleOrPermission({ roleOrPermission: ['administrator', 'publish projects'] }),
  ]);
```

## Copyright and License

The `adonis-lucid-permission` library is licensed for use under the MIT License (MIT). Please see [LICENSE][] for more information.

[source]: https://github.com/luffynando/adonis-lucid-permission
[node-version]: https://www.npmjs.com/package/adonis-lucid-permission
[release]: https://www.npmjs.com/package/adonis-lucid-permission
[license]: https://github.com/luffynando/adonis-lucid-permission/blob/main/LICENSE.md
[build]: https://github.com/luffynando/adonis-lucid-permission/actions/workflows/test.yml?query=branch:main
[downloads]: https://www.npmjs.com/package/adonis-lucid-permission
[badge-source]: https://img.shields.io/badge/source-adonis--lucid--permission-blue.svg?logo=github
[badge-node-version]: https://img.shields.io/node/v/adonis-lucid-permission.svg?logo=nodedotjs
[badge-release]: https://img.shields.io/npm/v/adonis-lucid-permission.svg?logo=npm
[badge-license]: https://img.shields.io/github/license/luffynando/adonis-lucid-permission?logo=open-source-initiative
[badge-build]: https://img.shields.io/github/actions/workflow/status/luffynando/adonis-lucid-permission/test.yml?branch=main
[badge-downloads]: https://img.shields.io/npm/dm/adonis-lucid-permission.svg?logo=npm
