import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import refresh from 'eslint-plugin-react-refresh';

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
    files: ['src/**/*.tsx'],
    plugins: { 'react-refresh': refresh },
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
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
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
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
