import { HttpContextFactory } from '@adonisjs/core/factories/http';
import { test } from '@japa/runner';
import supertest from 'supertest';
import PermissionMiddleware from '../../src/middleware/permission_middleware.js';
import { httpServer } from '../../tests_helpers/helpers.js';

test.group('permission middleware', () => {
  test('throws a exception with auth not in http context', async ({ assert }) => {
    const server = httpServer.create(async (_req, res) => {
      const ctx = new HttpContextFactory().create();

      const middleware = new PermissionMiddleware();

      await assert.rejects(
        () =>
          middleware.handle(
            ctx,
            () => {
              // Empty
            },
            { permissions: ['publish', 'edit'] },
          ),
        'Not required modules',
      );

      res.end();
    });

    await supertest(server).get('/');
  });
});
