import app from '@adonisjs/core/services/app';
import { type RoleModel } from '../src/types.js';

let role: RoleModel;

await app.booted(async () => {
  role = await app.container.make('role');
});

export { role as default };
