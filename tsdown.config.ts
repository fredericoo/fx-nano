import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/result.ts', './src/error/index.ts', './src/error/valibot.ts'],
    platform: 'neutral',
    dts: true,
  },
])
