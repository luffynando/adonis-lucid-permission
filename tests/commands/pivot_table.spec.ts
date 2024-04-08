import { test } from '@japa/runner';
import PivotTable from '../../commands/pivot_table.js';
import { setupApp } from '../../tests_helpers/helpers.js';

const fileNameFromLog = (message: string) => {
  return message
    .replace(/green\(DONE:\)/, '')
    .trim()
    .replace(/^create/, '')
    .trim();
};

test.group('make pivot table', () => {
  test('create model pivot table with out params', async ({ assert }) => {
    const { ace } = await setupApp(true, true);

    const command = await ace.create(PivotTable, []);

    await command.exec();
    const filename = fileNameFromLog(command.logger.getLogs()[0].message);

    command.assertLogMatches(/database\/migrations\/\d+_create_user_permissions_table/);
    await assert.fileContains(filename, `import { BaseSchema } from '@adonisjs/lucid/schema'`);
    await assert.fileContains(filename, `protected permissionPivotTable = 'user_has_permissions'`);
    await assert.fileContains(filename, `protected rolePivotTable = 'user_has_roles'`);
    await assert.fileContains(filename, `this.schema.createTable`);
  });

  test('create model pivot table with custom model name', async ({ assert }) => {
    const { ace } = await setupApp(true, true);

    const command = await ace.create(PivotTable, ['company']);

    await command.exec();
    const filename = fileNameFromLog(command.logger.getLogs()[0].message);

    command.assertLogMatches(/database\/migrations\/\d+_create_company_permissions_table/);
    await assert.fileContains(filename, `import { BaseSchema } from '@adonisjs/lucid/schema'`);
    await assert.fileContains(
      filename,
      `protected permissionPivotTable = 'company_has_permissions'`,
    );
    await assert.fileContains(filename, `protected rolePivotTable = 'company_has_roles'`);
    await assert.fileContains(filename, `this.schema.createTable`);
  });

  test('create model pivot table with optional role and permission pivot table', async ({
    assert,
  }) => {
    const { ace } = await setupApp(true, true);

    const command = await ace.create(PivotTable, [
      'company',
      '--permissions-pivot-table',
      'company_with_permissions',
      '--roles-pivot-table',
      'company_with_roles',
    ]);

    await command.exec();
    const filename = fileNameFromLog(command.logger.getLogs()[0].message);

    command.assertLogMatches(/database\/migrations\/\d+_create_company_permissions_table/);
    await assert.fileContains(filename, `import { BaseSchema } from '@adonisjs/lucid/schema'`);
    await assert.fileContains(
      filename,
      `protected permissionPivotTable = 'company_with_permissions'`,
    );
    await assert.fileContains(filename, `protected rolePivotTable = 'company_with_roles'`);
    await assert.fileContains(filename, `this.schema.createTable`);
  });
});
