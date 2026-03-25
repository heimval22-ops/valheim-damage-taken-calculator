import { transform } from 'esbuild';
import { minify as minifyHtml } from 'html-minifier-terser';
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { join, extname } from 'path';

const SOURCE_DIR = '.';
const OUTPUT_DIR = 'dist';

// Files to include in the deployment build (excludes test files).
// Each entry is { src, out } where src is relative to SOURCE_DIR (project root)
// and out is the flat filename written to OUTPUT_DIR.
const DEPLOY_FILES = [
    { src: 'index.html',                    out: 'index.html' },
    { src: 'src/assets/styles/index.css',   out: 'index.css' },
    { src: 'src/assets/styles/mobile.css',  out: 'mobile.css' },
    { src: 'src/index.js',                  out: 'index.js' },
    { src: 'src/mobile.js',                 out: 'mobile.js' },
    { src: 'src/damage-calculator.js',      out: 'damage-calculator.js' },
    { src: 'src/data/mob-presets.json',     out: 'mob-presets.json' },
];

await mkdir(OUTPUT_DIR, { recursive: true });

for (const { src, out } of DEPLOY_FILES) {
    const sourcePath = join(SOURCE_DIR, src);
    const outputPath = join(OUTPUT_DIR, out);
    const fileName   = out;
    const extension  = extname(out);
    const sourceContent = await readFile(sourcePath, 'utf8');

    let minifiedContent;

    if (extension === '.js') {
        const result = await transform(sourceContent, { minify: true });
        minifiedContent = result.code;
    } else if (extension === '.css') {
        const result = await transform(sourceContent, { loader: 'css', minify: true });
        minifiedContent = result.code;
    } else if (extension === '.html') {
        minifiedContent = await minifyHtml(sourceContent, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
        });
    } else {
        await copyFile(sourcePath, outputPath);
        console.log(`copied  ${fileName}`);
        continue;
    }

    await writeFile(outputPath, minifiedContent);
    const sourceSize = Buffer.byteLength(sourceContent, 'utf8');
    const outputSize = Buffer.byteLength(minifiedContent, 'utf8');
    const savings = (((sourceSize - outputSize) / sourceSize) * 100).toFixed(1);
    console.log(`minified ${fileName}: ${sourceSize} → ${outputSize} bytes (${savings}% smaller)`);
}

console.log('\nBuild complete → dist/');
