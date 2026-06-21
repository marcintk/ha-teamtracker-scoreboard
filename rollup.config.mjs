import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const version = process.env.VERSION ?? '0.0.0-dev';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/card.js',
    format: 'es',
    banner: `/* ha-teamtracker-scoreboard-card v${version} */`,
    intro: `const __CARD_VERSION__ = '${version}';`,
  },
  plugins: [
    resolve(),
    typescript({ declaration: false }),
    ...(process.env.NODE_ENV === 'production' ? [terser()] : []),
  ],
};
