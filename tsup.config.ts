import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'utils/index': 'src/utils/index.ts',
    'tailwind-preset': 'src/tailwind-preset.ts',
    // Individual component entries for tree-shaking
    'components/Button/index': 'src/components/Button/index.ts',
    'components/Input/index': 'src/components/Input/index.ts',
    'components/Card/index': 'src/components/Card/index.ts',
    'components/Text/index': 'src/components/Text/index.ts',
    'components/PhoneInput/index': 'src/components/PhoneInput/index.ts',
    'components/DateInput/index': 'src/components/DateInput/index.ts',
    'components/Tooltip/index': 'src/components/Tooltip/index.ts',
    'components/Dropdown/index': 'src/components/Dropdown/index.ts',
    'components/Badge/index': 'src/components/Badge/index.ts',
    'components/Alert/index': 'src/components/Alert/index.ts',
    'components/VisuallyHidden/index': 'src/components/VisuallyHidden/index.ts',
    'components/ThemeProvider/index': 'src/components/ThemeProvider/index.ts',
    'components/Avatar/index': 'src/components/Avatar/index.ts',
    'components/SchedulePicker/index': 'src/components/SchedulePicker/index.ts',
    // Brand system entries for tree-shaking
    'brands/index': 'src/brands/index.ts',
    'brands/types': 'src/brands/types.ts',
    'brands/bluehive': 'src/brands/bluehive.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  splitting: true,
  minify: false,
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
