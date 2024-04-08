import { args, BaseCommand, flags } from '@adonisjs/core/ace';
import stringHelpers from '@adonisjs/core/helpers/string';
import { stubsRoot } from '../stubs/main.js';

export default class PivotTable extends BaseCommand {
  public static commandName = 'permissions:pivot-table';

  public static description = 'Create the pivot table migration for model with authorizable';

  public static options = {
    startApp: true,
    allowUnknownFlags: true,
  };

  @args.string({
    default: 'user',
    required: false,
    description: 'Name of the model class',
  })
  public declare name: string;

  @flags.string({
    description: 'Name of the permissions pivot table name (user_has_permissions)',
    required: false,
    parse: (value: string | undefined) => {
      return value?.toLowerCase();
    },
  })
  public declare permissionsPivotTable?: string;

  @flags.string({
    description: 'Name of the roles pivot table name (user_has_roles)',
    required: false,
    parse: (value: string | undefined) => {
      return value?.toLowerCase();
    },
  })
  public declare rolesPivotTable?: string;

  public async run(): Promise<void> {
    const entity = this.app.generators.createEntity(this.name);
    const permissionsTableName = this.permissionsPivotTable ?? `${entity.name}_has_permissions`;
    const rolesTableName = this.rolesPivotTable ?? `${entity.name}_has_roles`;
    const fileName = `${Date.now()}_create_${entity.name}_permissions_table.ts`;
    const modelTable = stringHelpers.pluralize(entity.name);

    const permissionsTable = this.app.config.get<string>(
      'permissions.tableNames.permissions',
      'permissions',
    );
    const rolesTable = this.app.config.get<string>('permissions.tableNames.roles', 'roles');

    const codemods = await this.createCodemods();

    await codemods.makeUsingStub(stubsRoot, 'migrations/authorizable_pivot.stub', {
      fileName,
      permissionPivotTable: permissionsTableName,
      rolePivotTable: rolesTableName,
      permissionsTable,
      rolesTable,
      modelTable,
    });
  }
}
