import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:3000/docs',
  output: {
    format: 'prettier',
    path: 'src/shared/api/generated',
    lint: 'eslint',
  },
  plugins: [
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: './src/shared/api/config.ts',
      throwOnError: true,
    },
  ],
});
