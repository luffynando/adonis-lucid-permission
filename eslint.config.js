import { nodecfdiConfig } from '@nodecfdi/eslint-config';
import { defineFlatConfig } from 'eslint-define-config';

export default defineFlatConfig([
  ...nodecfdiConfig({ adonisjs: true }),
  {
    files: ['**/errors.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['tests/mixins/**.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
]);
