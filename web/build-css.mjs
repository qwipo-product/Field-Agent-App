// Compiles the app's own stylesheet (src/app.android.scss + Tailwind) exactly as the NativeScript build
// does (same PostCSS plugins as @nativescript/tailwind's webpack hook), then rewrites that NativeScript
// CSS into web CSS. Output (git-ignored): web/gen/app.css, plus
// web/gen/sizing.ts listing the classes that give a view a fixed width/height (see renderer.ts).
//   node web/build-css.mjs           build once
//   node web/build-css.mjs --watch   rebuild when src/ styles or templates change
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import * as sass from 'sass';
import tailwindcss from 'tailwindcss';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const tailwindConfig = require(resolve(root, 'tailwind.config.js'));
const nativescriptTailwind = require('@nativescript/tailwind');
const isPseudoClass = require('@csstools/postcss-is-pseudo-class');

const LENGTH = /^(font-size|width|height|min-width|min-height|max-width|max-height|margin(-\w+)?|padding(-\w+)?|border(-\w+)?-width|border-width|border(-\w+)*-radius|top|right|bottom|left|gap|row-gap|column-gap)$/;
const H_ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end', stretch: 'stretch' };
const V_ALIGN = { top: 'flex-start', center: 'center', middle: 'center', bottom: 'flex-end', stretch: 'stretch' };
const TYPES = {
  label: 'label', button: 'button', textfield: 'textfield', textview: 'textview', image: 'image', stacklayout: 'stack',
  gridlayout: 'grid', flexboxlayout: 'flex', wraplayout: 'wrap', docklayout: 'dock', scrollview: 'scroll',
  listview: 'listview', actionbar: 'actionbar', activityindicator: 'activity', switch: 'switch', page: 'content', span: 'span',
};

/** Android lays out in whole device pixels: a dp length becomes round(dp * density) px. */
const DENSITY = 2.625;
const dpToDevice = (n) => +(Math.round(Number(n) * DENSITY) / DENSITY).toFixed(4);
const addPx = (value) => value.replace(/(^|[\s,(])(-?\d*\.?\d+)(px)?(?=$|[\s,)])/g, (m, pre, n) => (Number(n) === 0 ? m : `${pre}${n}px`));
/** Tailwind's space-x/y use calc() with a "reverse" variable that is 0 here; evaluate them to a number. */
const evalCalc = (value) => {
  const expr = value.replace(/var\(--tw-[a-z-]*reverse\)/g, '0').replace(/calc\(/g, '(');
  return /^[\d.\s+\-*/()]+$/.test(expr) ? String(+Function(`return ${expr}`)().toFixed(4)) : value;
};

// In NativeScript CSS a bare number is dp, while "px" means physical device pixels.
const devicePx = (value) =>
  (value.includes('calc(') ? evalCalc(value) : value).replace(/(^|[\s,(])(-?\d*\.?\d+)(px)?(?=$|[\s,)])/g, (m, pre, n, unit) =>
    Number(n) === 0 ? m : `${pre}${unit ? +(Number(n) / DENSITY).toFixed(4) : dpToDevice(n)}px`,
  );
/** Percentages are a share of the parent's full width, padding included (renderer.ts sets --ns-cq-padx). */
const percentWidth = (p) => `calc((100cqw + var(--ns-cq-padx, 0px)) * ${p / 100})`;

const fixedWidth = new Set();
const fixedHeight = new Set();
/** Class name of a single-class selector such as ".w-\[98\%\]" (unescaped), else null. */
const singleClass = (sel) => (/^\.((?:\\.|[\w-])+)$/.exec(sel.trim())?.[1] ?? '').replace(/\\(.)/g, '$1') || null;

const converted = new WeakSet();

/** Vertical metrics (head yMax/yMin, hhea ascender/descender in em) of the icon fonts, for Android line heights. */
const FONT_METRICS = {
  'fa-solid-900': ['0.90039em', '0.875em', '0.125em', '0.14844em'],
  'fa-regular-400': ['0.89258em', '0.875em', '0.125em', '0.13867em'],
  'fa-brands-400': ['0.9375em', '0.875em', '0.125em', '0.1582em'],
};

/** NativeScript CSS → browser CSS. */
const nativescriptToWeb = {
  postcssPlugin: 'nativescript-to-web',
  Rule(rule) {
    for (const sel of rule.selectors) {
      const cls = singleClass(sel);
      if (!cls) continue;
      rule.walkDecls(/^(width|min-width)$/, (d) => d.value !== 'auto' && fixedWidth.add(cls));
      rule.walkDecls(/^(height|min-height)$/, (d) => d.value !== 'auto' && fixedHeight.add(cls));
    }
    // Type selectors ("Label", "Button") target views; map them to the renderer's classes.
    rule.selectors = rule.selectors.map((sel) =>
      sel.replace(/(^|[\s>+~,(])([A-Za-z]+)(?=$|[.:#[\s>+~,)])/g, (m, pre, type) => {
        const kind = TYPES[type.toLowerCase()];
        return kind && type !== type.toUpperCase() ? `${pre}.ns-${kind}` : m;
      }),
    );
  },
  Declaration(decl) {
    // PostCSS revisits declarations it has changed; convert each one only once.
    if (converted.has(decl)) return;
    converted.add(decl);
    const prop = decl.prop.toLowerCase();
    const value = decl.value.trim();
    if (prop === 'horizontal-align') {
      decl.replaceWith({ prop: '--ns-ha', value: H_ALIGN[value] ?? 'stretch' });
    } else if (prop === 'vertical-align' && V_ALIGN[value]) {
      decl.replaceWith({ prop: '--ns-va', value: V_ALIGN[value] });
    } else if (prop === 'visibility' && /^collapsed?$/.test(value)) {
      decl.replaceWith({ prop: 'display', value: 'none', important: decl.important });
    } else if (prop === 'display' && value !== 'none') {
      // NativeScript ignores display (only "none" hides); in the browser it would break the layout.
      decl.remove();
    } else if (prop === 'placeholder-color') {
      decl.replaceWith({ prop: '--ns-placeholder', value });
    } else if (/^(android|ios)-/.test(prop)) {
      decl.remove();
    } else if (prop === 'font-family' && !/ns-system/.test(value)) {
      // NativeScript accepts unquoted names like Font Awesome 5 Free; browsers need them quoted.
      const families = value.split(',').map((f) => f.trim()).map((f) => (/\s/.test(f) && !/^["']/.test(f) ? `"${f}"` : f));
      decl.value = [...families, 'ns-system', 'sans-serif'].join(', ');
      const metrics = FONT_METRICS[families.find((f) => FONT_METRICS[f])];
      if (metrics) ['--ns-f-top', '--ns-f-asc', '--ns-f-desc', '--ns-f-bottom'].forEach((p, i) => converted.add(decl.cloneAfter({ prop: p, value: metrics[i] })));
    } else if (prop === 'line-height') {
      // NativeScript's line-height is extra space between lines (dip), not the line box height.
      decl.replaceWith({ prop: '--ns-lh-extra', value: addPx(value) });
    } else if (prop === 'letter-spacing' && /^-?\d*\.?\d+$/.test(value)) {
      decl.value = `${value}em`;
    } else if (/^((min-|max-)?width|margin-(left|right))$/.test(prop) && /^-?[\d.]+%$/.test(value)) {
      decl.value = percentWidth(parseFloat(value));
    } else if (LENGTH.test(prop) && prop !== 'font-size') {
      decl.value = devicePx(value);
    } else if (LENGTH.test(prop)) {
      decl.value = addPx(value);
    } else if (prop === 'border' || /^border-(top|right|bottom|left)$/.test(prop)) {
      // NativeScript reads "border: 1 #ccc" as width + colour; CSS also needs a style.
      const styled = /\b(solid|dashed|dotted|double|none|hidden|groove|ridge|inset|outset)\b/.test(value);
      decl.value = devicePx(value) + (styled ? '' : ' solid');
    }
  },
};

async function build() {
  fixedWidth.clear();
  fixedHeight.clear();
  const scss = sass.compile(resolve(root, 'src/app.android.scss'), { loadPaths: [resolve(root, 'node_modules')], style: 'expanded' }).css;
  const config = { ...tailwindConfig, content: [resolve(root, 'src/app/**/*.{html,ts}')] };
  const from = resolve(root, 'src/app.android.scss');
  // What the device gets: node_modules/@nativescript/tailwind/nativescript.webpack.js
  const nativescriptCss = await postcss([tailwindcss(config), nativescriptTailwind, isPseudoClass()]).process(scss, { from });
  const result = await postcss([nativescriptToWeb]).process(nativescriptCss.css, { from });

  const out = resolve(root, 'web/gen/app.css');
  mkdirSync(dirname(out), { recursive: true });
  writeIfChanged(out, `/* Generated by web/build-css.mjs from src/app.android.scss. Do not edit. */\n${result.css}`);
  writeIfChanged(
    resolve(root, 'web/gen/sizing.ts'),
    `// Generated by web/build-css.mjs. Classes that set a fixed width / height on a view.\n` +
      `export const FIXED_WIDTH_CLASSES = new Set<string>(${JSON.stringify([...fixedWidth].sort())});\n` +
      `export const FIXED_HEIGHT_CLASSES = new Set<string>(${JSON.stringify([...fixedHeight].sort())});\n`,
  );
  console.log(`web/gen/app.css written (${(result.css.length / 1024).toFixed(0)} KB), ${fixedWidth.size} fixed-width classes`);
}

function writeIfChanged(file, text) {
  if (!existsSync(file) || readFileSync(file, 'utf8') !== text) writeFileSync(file, text);
}

await build();

if (process.argv.includes('--watch')) {
  let timer;
  watch(resolve(root, 'src'), { recursive: true }, (_event, file) => {
    if (!file || !/\.(scss|css|html|ts)$/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((err) => console.error(err.message)), 200);
  });
  console.log('Watching src/ for style and template changes…');
}
