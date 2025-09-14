import esbuild from "esbuild";
import { copy } from 'esbuild-plugin-copy';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

// ⚙️ 1. Configuration for the extension backend (CommonJS)
const extensionConfig = {
	entryPoints: ['src/extension.ts'],
	outfile: 'dist/extension.js',
	bundle: true,
	format: 'cjs',
	platform: 'node',
	external: ['vscode'],
	minify: production,
	sourcemap: !production,
	logLevel: 'silent',
	plugins: [
		esbuildProblemMatcherPlugin,
		copy({ // Copy plugin is only needed once
			assets: [
				{
					from: ['./src/proto/copilot.proto'],
					to: ['./proto/copilot.proto']
				},
				{
					from: ['./resources/sql-y-icon.svg'],
					to: ['./views/icon.svg']
				}
			]
		})
	],
};


// ⚙️ 2. Configuration for the React webview frontend (ES Module)
const webviewConfig = {
	entryPoints: ['src/views/index.tsx'],
	outfile: 'dist/views/index.js',
	bundle: true,
	format: 'esm', // ✨ KEY CHANGE: Use ES Module format
	platform: 'browser', // ✨ KEY CHANGE: Target the browser environment
	minify: production,
	sourcemap: !production,
	logLevel: 'silent',
	define: {
		'process.env.NODE_ENV': production ? '"production"' : '"development"',
	},
	plugins: [esbuildProblemMatcherPlugin],
};

// ⚙️ 3. Main function to run both builds
async function main() {
	try {
		const extensionCtx = await esbuild.context(extensionConfig);
		const webviewCtx = await esbuild.context(webviewConfig);

		if (watch) {
			console.log('Watching for changes...');
			await extensionCtx.watch();
			await webviewCtx.watch();
		} else {
			console.log('Building for production...');
			await Promise.all([
				extensionCtx.rebuild(),
				webviewCtx.rebuild()
			]);
			await Promise.all([
				extensionCtx.dispose(),
				webviewCtx.dispose()
			]);
			console.log('Build complete!');
		}
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

main();