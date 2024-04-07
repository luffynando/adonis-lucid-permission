import { assert } from '@japa/assert';
import { expectTypeOf } from '@japa/expect-type';
import { fileSystem } from '@japa/file-system';
import { configure, processCLIArgs, run } from '@japa/runner';
import { BASE_URL } from '../tests_helpers/helpers.js';

processCLIArgs(process.argv.splice(2));

configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert(), fileSystem({ basePath: BASE_URL }), expectTypeOf()],
});

run();
