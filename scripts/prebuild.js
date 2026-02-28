/**
 * Pre-build script — generates build metadata
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const dir = '.svelte-kit';
if (!existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

const metadata = {
	buildTime: new Date().toISOString(),
	version: process.env.npm_package_version || '1.0.0'
};

writeFileSync(`${dir}/build-meta.json`, JSON.stringify(metadata, null, 2));
console.log('Build metadata generated:', metadata);
