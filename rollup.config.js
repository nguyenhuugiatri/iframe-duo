import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import generatePackageJson from 'rollup-plugin-generate-package-json'
import typescript from 'rollup-plugin-typescript2'

const commonjsOutDir = 'dist/commonjs'
const moduleOutDir = 'dist/module'

export default defineConfig({
  input: `src/index.ts`,
  output: [
    {
      dir: commonjsOutDir,
      format: 'commonjs',
      sourcemap: true,
    },
    {
      dir: moduleOutDir,
      format: 'module',
      sourcemap: true,
    },
  ],
  plugins: [
    json(),
    nodeResolve(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      clean: true,
    }),
    generatePackageJson({
      outputFolder: commonjsOutDir,
      baseContents: () => ({
        type: 'commonjs',
      }),
    }),
    generatePackageJson({
      outputFolder: moduleOutDir,
      baseContents: () => ({
        type: 'module',
      }),
    }),
  ],
})
