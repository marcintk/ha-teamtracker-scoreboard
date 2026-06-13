import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/card.js',
    format: 'es',
    banner: `/* ha-teamtracker-scoreboard-card v${version} */`,
    intro: `const __CARD_VERSION__ = '${version}';`,
  },
  plugins: [resolve(), ...(process.env.NODE_ENV === 'production' ? [terser()] : [])],
};
