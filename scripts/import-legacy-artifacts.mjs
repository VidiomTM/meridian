import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const workspaceRoot = process.env.CODEX_ROOT ?? '/Users/jonathangadeaharder/projects';
const SKIP_DIRS = new Set([
	'.git',
	'.codex',
	'.pytest_cache',
	'.ruff_cache',
	'.svelte-kit',
	'.venv',
	'build',
	'dist',
	'node_modules',
	'openspec'
]);

function walkDirs(dir, predicate) {
	if (!existsSync(dir)) return [];
	const found = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const full = join(dir, entry.name);
		if (predicate(full, entry.name)) found.push(full);
		if (SKIP_DIRS.has(entry.name)) continue;
		found.push(...walkDirs(full, predicate));
	}
	return found;
}

function walkMarkdown(dir) {
	if (!existsSync(dir)) return [];
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (!SKIP_DIRS.has(entry.name)) files.push(...walkMarkdown(join(dir, entry.name)));
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(join(dir, entry.name));
		}
	}
	return files;
}

function findOpenSpecRoots() {
	return walkDirs(workspaceRoot, (_full, name) => name === 'openspec');
}

function slug(value) {
	return value
		.replace(/\.md$/i, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase();
}

function titleFromPath(filePath) {
	const raw = readFileSync(filePath, 'utf8');
	const h1 = raw.match(/^#\s+(.+)$/m);
	if (h1) return h1[1].trim();
	return basename(filePath, '.md')
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function classifyLegacyArtifact(projectRoot, filePath) {
	const rel = relative(projectRoot, filePath).split(sep).join('/');
	const name = basename(filePath);
	const raw = readFileSync(filePath, 'utf8');

	if (rel.startsWith('docs/architecture/') || /^ADR-\d+/i.test(name) || /^#\s+ADR-\d+/im.test(raw)) {
		return { kind: 'adr', rel };
	}

	if (
		rel === 'docs/technical-due-diligence.md' ||
		rel.startsWith('docs/tdd/') ||
		/TDD-\d+/i.test(name) ||
		/^#\s+(TDD-\d+|Technical Due Diligence)/im.test(raw)
	) {
		return { kind: 'tdd', rel };
	}

	if (
		rel.startsWith('docs/specs/') ||
		rel.startsWith('docs/superpowers/specs/') ||
		/^SPEC-/i.test(name)
	) {
		return { kind: 'spec', rel };
	}

	return null;
}

function legacyCandidates(projectRoot) {
	const candidates = [];
	for (const base of [
		join(projectRoot, 'docs', 'architecture'),
		join(projectRoot, 'docs', 'specs'),
		join(projectRoot, 'docs', 'superpowers', 'specs'),
		join(projectRoot, 'docs', 'tdd')
	]) {
		candidates.push(...walkMarkdown(base));
	}

	const docsRoot = join(projectRoot, 'docs');
	if (existsSync(docsRoot)) {
		for (const entry of readdirSync(docsRoot, { withFileTypes: true })) {
			if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
			if (/technical-due-diligence|TDD-\d+/i.test(entry.name)) {
				candidates.push(join(docsRoot, entry.name));
			}
		}
	}

	return [...new Set(candidates)];
}

function importedContent(projectRoot, filePath, kind) {
	const rel = relative(projectRoot, filePath).split(sep).join('/');
	const raw = readFileSync(filePath, 'utf8').trimEnd();
	const title = titleFromPath(filePath);
	const importNote = `> Imported legacy ${kind.toUpperCase()} artifact from \`${rel}\`. Keep future lifecycle work in OpenSpec.`;
	const frontmatter = raw.match(/^---\n[\s\S]*?\n---\n?/);

	if (frontmatter) {
		const body = raw.slice(frontmatter[0].length).trimStart();
		return body
			? [frontmatter[0].trimEnd(), '', importNote, '', body].join('\n')
			: [frontmatter[0].trimEnd(), '', importNote].join('\n');
	}

	const h1 = raw.match(/^#\s+.+$/m);
	if (h1?.index === 0) {
		const body = raw.slice(h1[0].length).trimStart();
		return body ? [h1[0], '', importNote, '', body].join('\n') : [h1[0], '', importNote].join('\n');
	}

	return [`# ${title}`, '', importNote, '', raw].join('\n');
}

let imported = 0;
let unchanged = 0;

for (const openspecRoot of findOpenSpecRoots()) {
	const projectRoot = dirname(openspecRoot);

	for (const filePath of legacyCandidates(projectRoot)) {
		const classification = classifyLegacyArtifact(projectRoot, filePath);
		if (!classification) continue;

		const targetDir = join(openspecRoot, 'specs', 'imported', classification.kind);
		const targetPath = join(targetDir, `${slug(classification.rel)}.md`);
		const content = importedContent(projectRoot, filePath, classification.kind);

		mkdirSync(targetDir, { recursive: true });
		if (existsSync(targetPath) && readFileSync(targetPath, 'utf8') === content + '\n') {
			unchanged++;
			continue;
		}

		writeFileSync(targetPath, content + '\n', 'utf8');
		imported++;
	}
}

console.log(`Imported or updated ${imported} legacy artifacts; ${unchanged} already current.`);
