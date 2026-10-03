import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import refresh from 'eslint-plugin-react-refresh';
import hooks from 'eslint-plugin-react-hooks';
import { builtinModules } from 'node:module';

const nodeImports = {
  regex: `^(node:|(${[...new Set(builtinModules.map((name) => name.replace(/^node:/, '').split('/')[0]))].join('|')})($|/))`,
  message: 'Pure layers must not import Node runtime or I/O modules.',
};

const frameworkImports = [
  {
    regex:
      '^(react($|/)|react-dom($|/)|react-router($|/)|react-router-dom($|/)|three($|/)|@react-three/)',
    message:
      'Keep framework/rendering dependencies at UI/navigation/visualization boundaries.',
  },
];
const layers = (names) => ({
  regex: `(^|/)(${names.join('|')})(/|$)`,
  message: 'This import crosses an architectural boundary.',
});
const pureGlobals = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'fetch',
  'process',
  'require',
  'module',
  'Buffer',
  'Date',
  'performance',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'WebSocket',
  'XMLHttpRequest',
  'crypto',
  'console',
  'indexedDB',
  'caches',
  'Worker',
  'EventSource',
  'BroadcastChannel',
];
const pureProperties = [
  ...pureGlobals.map((property) => ({
    object: 'globalThis',
    property,
    message: 'Keep platform/runtime I/O outside pure layers.',
  })),
  {
    object: 'Math',
    property: 'random',
    message: 'Pure layers must be deterministic.',
  },
];

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'test-results/**',
      'playwright-report/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx,mjs}'], languageOptions: { globals: globals.node } },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-refresh': refresh, 'react-hooks': hooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            nodeImports,
            {
              regex: '^zod($|/)',
              message: 'Validation belongs to the content boundary.',
            },
            ...frameworkImports,
            layers([
              'ui',
              'app',
              'application',
              'content',
              'navigation',
              'visualization',
              'simulation',
            ]),
          ],
        },
      ],
      'no-restricted-globals': ['error', ...pureGlobals],
      'no-restricted-properties': ['error', ...pureProperties],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: 'Pure layers must not perform dynamic module loading.',
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}', 'src/content/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...frameworkImports,
            layers(['ui', 'app', 'navigation', 'visualization']),
          ],
        },
      ],
    },
  },
  {
    files: ['src/simulation/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            nodeImports,
            ...frameworkImports,
            layers([
              'ui',
              'app',
              'application',
              'content',
              'navigation',
              'visualization',
            ]),
          ],
        },
      ],
      'no-restricted-globals': ['error', ...pureGlobals],
      'no-restricted-properties': ['error', ...pureProperties],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: 'Pure layers must not perform dynamic module loading.',
        },
      ],
    },
  },
  {
    files: ['src/visualization/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            layers([
              'ui',
              'app',
              'application',
              'content',
              'navigation',
              'simulation',
            ]),
          ],
        },
      ],
    },
  },
);
