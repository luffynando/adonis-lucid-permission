import app from '@adonisjs/core/services/app';
import { type PermissionModel } from '../src/types.js';

let permission: PermissionModel;

/**
 * Returns a singleton Permission model
 */
await app.booted(async () => {
  permission = await app.container.make('permission');
});

export { permission as Permission };
