import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { writeFile } from 'fs/promises';
import matter from 'gray-matter';
import { basename, dirname, join, relative, sep } from 'path';
import type { DocKind, DocStatus, MeridianDoc } from './format.js';
import { extractTitle, renderMarkdown, splitFrontmatter } from './parser.js';
import { buildInvIndex } from './relations.js';

const MERIDIAN_ROOT =
	process.env.MERIDIAN_ROOT ?? '/Users/jonathangadeaharder/projects';
const ARTIFACT_FILES = new Set(['proposal.md', 'design.md', 'tasks.md']);

function walkDir(dir: string, ext = '.md'): string[] {
	if (!existsSync(dir)) return [];
	const results: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) results.push(...walkDir(full, ext));
		else if (entry.isFile() && entry.name.endsWith(ext)) results.push(full);
	}
	return results;
}

function slug(input: string): string {
	return input
		.replace(/\.md$/i, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase();
}

function titleFromSlug(input: string): string {
	return slug(input)
		.split('-')
		.filter(Boolean)
		.map((part) => part[0]?.toUpperCase() + part.slice(1))
		.join(' ');
}

function getProjectId(openspecRoot: string): string {
	const projectRoot = dirname(openspecRoot);
	const rel = relative(MERIDIAN_ROOT, projectRoot);
	return rel.split(sep).filter(Boolean).join('~') || basename(projectRoot);
}

function latestDate(filePath: string): string {
	try {
		return statSync(filePath).mtime.toISOString().split('T')[0];
	} catch {
		return '';
	}
}

function isArchived(parts: string[]): boolean {
	const changesIdx = parts.indexOf('changes');
	return changesIdx !== -1 && parts[changesIdx + 1] === 'archive';
}

function getChangeName(parts: string[]): string | null {
	const changesIdx = parts.indexOf('changes');
	if (changesIdx === -1) return null;
	if (parts[changesIdx + 1] === 'archive') return parts[changesIdx + 3] ?? null;
	return parts[changesIdx + 1] ?? null;
}

function classifyOpenSpec(
	filePath: string,
	openspecRoot: string,
): {
	id: string;
	kind: DocKind;
	status: DocStatus;
	tags: string[];
	groupId?: string;
	contentType?: 'markdown' | 'yaml';
} | null {
	const rel = relative(openspecRoot, filePath);
	const parts = rel.split(sep);
	const filename = basename(filePath);

	if (rel === 'config.yaml') {
		return {
			id: 'openspec-config',
			kind: 'note',
			status: 'canonical',
			tags: ['openspec', 'config'],
			contentType: 'yaml',
		};
	}

	if (parts[0] === 'specs') {
		const specName = slug(parts.slice(1).join('-'));
		const importedKind =
			parts[1] === 'imported' && ['adr', 'spec', 'tdd'].includes(parts[2] ?? '')
				? (parts[2] as 'adr' | 'spec' | 'tdd')
				: 'spec';
		return {
			id: `spec-${specName}`,
			kind: importedKind,
			status: 'canonical',
			tags: [
				'openspec',
				importedKind,
				...(parts[1] === 'imported' ? ['imported'] : []),
			],
		};
	}

	if (parts[0] !== 'changes') return null;

	const changeName = getChangeName(parts);
	if (!changeName) return null;

	const changeSlug = slug(changeName);
	const archived = isArchived(parts);
	const status: DocStatus = archived ? 'archived' : 'active';
	const tags = ['openspec', archived ? 'archived' : 'change', changeSlug];
	const groupId = `change-${changeSlug}`;

	if (ARTIFACT_FILES.has(filename)) {
		const kind =
			filename === 'proposal.md'
				? 'proposal'
				: filename === 'design.md'
					? 'design'
					: 'tasks';
		return {
			id: `${groupId}-${kind}`,
			kind,
			status,
			tags,
			groupId,
		};
	}

	const specsIdx = parts.indexOf('specs');
	if (specsIdx !== -1) {
		const specName = slug(parts.slice(specsIdx + 1).join('-'));
		return {
			id: `${groupId}-spec-${specName}`,
			kind: 'spec',
			status,
			tags: [...tags, 'delta'],
			groupId,
		};
	}

	return null;
}

interface RawArtifact {
	path: string;
	project: string;
	classification: NonNullable<ReturnType<typeof classifyOpenSpec>>;
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build']);

function shouldSkipDir(name: string): boolean {
	return name.startsWith('.') || SKIP_DIRS.has(name) || name === 'openspec';
}

function walkDirs(dir: string): string[] {
	if (!existsSync(dir)) return [];
	const dirs: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory() || shouldSkipDir(entry.name)) continue;
		dirs.push(join(dir, entry.name));
	}
	return dirs;
}

function findOpenSpecRoots(dir: string): string[] {
	const roots: string[] = [];
	for (const full of walkDirs(dir)) {
		if (basename(full) === 'openspec') {
			roots.push(full);
		} else {
			roots.push(...findOpenSpecRoots(full));
		}
	}
	return roots;
}

const DOC_KIND_MAP: Record<string, 'adr' | 'spec' | 'tdd'> = {
	adrs: 'adr',
	specs: 'spec',
	tdd: 'tdd',
};

function findDocRoots(
	dir: string,
): Array<{ root: string; kind: 'adr' | 'spec' | 'tdd' }> {
	const results: Array<{ root: string; kind: 'adr' | 'spec' | 'tdd' }> = [];
	for (const full of walkDirs(dir)) {
		if (basename(full) !== 'docs') {
			results.push(...findDocRoots(full));
			continue;
		}
		for (const docSubdir of walkDirs(full)) {
			const kind = DOC_KIND_MAP[basename(docSubdir)];
			if (kind) {
				results.push({ root: docSubdir, kind });
			}
		}
	}
	return results;
}

function getProjectDir(artifactRoot: string): string {
	// artifactRoot is e.g. /projects/meta-router/openspec or /projects/meta-router/docs/adrs
	const parent = dirname(artifactRoot);
	if (basename(parent) === 'docs') return dirname(parent);
	return parent;
}

function collectOpenSpecArtifacts(): RawArtifact[] {
	const artifacts: RawArtifact[] = [];
	if (!existsSync(MERIDIAN_ROOT)) return artifacts;

	for (const openspecRoot of findOpenSpecRoots(MERIDIAN_ROOT)) {
		const project = getProjectId(openspecRoot);

		const configPath = join(openspecRoot, 'config.yaml');
		if (existsSync(configPath)) {
			const classification = classifyOpenSpec(configPath, openspecRoot);
			if (classification)
				artifacts.push({ path: configPath, project, classification });
		}

		for (const filePath of walkDir(openspecRoot)) {
			const classification = classifyOpenSpec(filePath, openspecRoot);
			if (!classification) continue;
			artifacts.push({ path: filePath, project, classification });
		}
	}

	// Also discover docs/adrs/, docs/specs/, docs/tdd/ outside openspec/ trees
	for (const { root, kind } of findDocRoots(MERIDIAN_ROOT)) {
		const projectDir = getProjectDir(root);
		const rel = relative(MERIDIAN_ROOT, projectDir);
		const project =
			rel.split(sep).filter(Boolean).join('~') || basename(projectDir);
		for (const filePath of walkDir(root)) {
			const relPath = relative(root, filePath);
			const id = `spec-imported-${kind}-${slug(relPath)}`;
			artifacts.push({
				path: filePath,
				project,
				classification: {
					id,
					kind,
					status: 'canonical',
					tags: ['openspec', kind, 'imported'],
				},
			});
		}
	}

	return artifacts;
}

export interface Corpus {
	docs: MeridianDoc[];
	byId: Record<string, MeridianDoc>;
	inv: Record<
		string,
		ReturnType<typeof buildInvIndex> extends Map<string, infer V> ? V : never
	>;
}

let _cache: Corpus | null = null;
let _cacheCreatedAt = 0;
const CACHE_TTL_MS = 1000;

export function loadCorpus(force = false): Corpus {
	if (_cache && !force && Date.now() - _cacheCreatedAt < CACHE_TTL_MS)
		return _cache;

	const byIdMap = new Map<
		string,
		{ status: DocStatus; title: string; project?: string }
	>();
	const firstPassDocs: MeridianDoc[] = [];
	const seen = new Map<string, number>();

	for (const artifact of collectOpenSpecArtifacts()) {
		const content = readFileSync(artifact.path, 'utf-8');
		const contentType = artifact.classification.contentType ?? 'markdown';
		const { data, rawBody } =
			contentType === 'yaml'
				? { data: {}, rawBody: content.trim() }
				: splitFrontmatter(content);
		const fallbackTitle =
			contentType === 'yaml'
				? 'OpenSpec Config'
				: artifact.classification.kind === 'spec'
					? titleFromSlug(basename(artifact.path))
					: titleFromSlug(artifact.classification.kind);
		const title =
			contentType === 'yaml'
				? fallbackTitle
				: typeof data.title === 'string'
					? data.title
					: extractTitle(rawBody, fallbackTitle);
		const description =
			typeof data.description === 'string' ? data.description : undefined;
		const date =
			typeof data.date === 'string' ? data.date : latestDate(artifact.path);
		let id = artifact.classification.id;

		const duplicateCount = seen.get(`${artifact.project}:${id}`) ?? 0;
		if (duplicateCount > 0) id = `${id}-${duplicateCount + 1}`;
		seen.set(
			`${artifact.project}:${artifact.classification.id}`,
			duplicateCount + 1,
		);

		const doc: MeridianDoc = {
			id,
			kind: artifact.classification.kind,
			title,
			status: artifact.classification.status,
			date,
			authors: [],
			tags: artifact.classification.tags,
			related: [],
			contains: [],
			part_of: artifact.classification.groupId
				? [artifact.classification.groupId]
				: [],
			external: [],
			project: artifact.project,
			description,
			body: '',
			rawBody,
			filePath: artifact.path,
			contentType,
			source: 'openspec',
		};

		firstPassDocs.push(doc);
		byIdMap.set(id, {
			status: doc.status,
			title: doc.title,
			project: doc.project,
		});
		byIdMap.set(`${artifact.project}:${id}`, {
			status: doc.status,
			title: doc.title,
			project: doc.project,
		});
	}

	const docs = addChangeGroupNodes(firstPassDocs).map((doc) => ({
		...doc,
		body:
			doc.contentType === 'yaml'
				? `<pre data-block-id="pre-0"><code class="language-yaml">${escapeHtml(doc.rawBody)}</code></pre>`
				: doc.rawBody
					? renderMarkdown(doc.rawBody, byIdMap, doc.project)
					: '',
	}));

	const STATUS_ORDER: Record<DocStatus, number> = {
		active: 0,
		canonical: 1,
		archived: 2,
		legacy: 3,
	};
	const KIND_ORDER: Record<DocKind, number> = {
		proposal: 0,
		design: 1,
		tasks: 2,
		adr: 3,
		spec: 4,
		tdd: 5,
		note: 6,
	};
	docs.sort(
		(a, b) =>
			(a.project ?? '').localeCompare(b.project ?? '') ||
			STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
			(a.tags[2] ?? '').localeCompare(b.tags[2] ?? '') ||
			KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
			a.id.localeCompare(b.id),
	);

	const byId: Record<string, MeridianDoc> = {};
	for (const doc of docs) {
		byId[doc.id] = doc;
		if (doc.project) byId[`${doc.project}:${doc.id}`] = doc;
	}

	const invMap = buildInvIndex(docs);
	const inv: Corpus['inv'] = {};
	for (const [key, value] of invMap) {
		(inv as Record<string, unknown>)[key] = value;
	}

	_cache = { docs, byId, inv };
	_cacheCreatedAt = Date.now();
	return _cache;
}

function addChangeGroupNodes(docs: MeridianDoc[]): MeridianDoc[] {
	const groups = new Map<string, MeridianDoc[]>();
	for (const doc of docs) {
		const groupId = doc.part_of[0];
		if (!groupId) continue;
		const key = `${doc.project}:${groupId}`;
		groups.set(key, [...(groups.get(key) ?? []), doc]);
	}

	const groupNodes: MeridianDoc[] = [];
	for (const [key, children] of groups) {
		const [project = '', groupId = ''] = key.split(':');
		const archived = children.every((child) => child.status === 'archived');
		const changeSlug = groupId.replace(/^change-/, '');
		groupNodes.push({
			id: groupId,
			kind: 'note',
			title: titleFromSlug(changeSlug),
			status: archived ? 'archived' : 'active',
			date:
				children
					.map((child) => child.date ?? '')
					.sort()
					.at(-1) ?? '',
			authors: [],
			tags: ['openspec', archived ? 'archived-change' : 'change', changeSlug],
			related: [],
			contains: children.map((child) => child.id),
			part_of: [],
			external: [],
			project,
			description: archived
				? 'Archived OpenSpec change'
				: 'Active OpenSpec change',
			body: '',
			rawBody: `# ${titleFromSlug(changeSlug)}\n\n${archived ? 'Archived' : 'Active'} OpenSpec change containing ${children.length} artifact${children.length === 1 ? '' : 's'}.`,
			filePath: dirname(children[0].filePath),
			contentType: 'markdown',
			source: 'openspec',
		});
	}

	return [...docs, ...groupNodes];
}

export function findDoc(
	docs: MeridianDoc[],
	project: string,
	id: string,
): MeridianDoc | undefined {
	return (
		docs.find((doc) => doc.project === project && doc.id === id) ??
		docs.find((doc) => doc.id === id)
	);
}

export async function writeOpenSpecDoc(
	project: string,
	id: string,
	rawBody: string,
): Promise<void> {
	const corpus = loadCorpus();
	const doc = findDoc(corpus.docs, project, id);
	if (!doc) throw new Error(`Document not found: ${project}/${id}`);
	if (
		doc.source !== 'openspec' ||
		(doc.kind === 'note' && doc.id !== 'openspec-config')
	) {
		throw new Error(
			`Document is not an editable OpenSpec artifact: ${project}/${id}`,
		);
	}

	const original = readFileSync(doc.filePath, 'utf-8');
	const parsed =
		doc.contentType === 'yaml'
			? { data: {}, content: original }
			: matter(original);
	const content =
		doc.contentType === 'yaml'
			? rawBody.trim() + '\n'
			: Object.keys(parsed.data).length > 0
				? matter.stringify(rawBody.trim() + '\n', parsed.data)
				: rawBody.trim() + '\n';

	await writeFile(doc.filePath, content, 'utf-8');
	_cache = null;
	_cacheCreatedAt = 0;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export interface MeridianDocSlim {
	id: string;
	kind: DocKind;
	title: string;
	status: DocStatus;
	date: string;
	tags: string[];
	project: string;
	authors: string[];
}

export interface ProjectSummary {
	name: string;
	changeCount: number;
	adrCount: number;
	specCount: number;
	tddCount: number;
	artifactCount: number;
	archivedCount: number;
	activeCount: number;
	lastUpdated: string;
}

export function getProjectSummaries(docs: MeridianDocSlim[]): ProjectSummary[] {
	const map = new Map<string, ProjectSummary>();
	for (const doc of docs) {
		if (!doc.project) continue;
		if (!map.has(doc.project)) {
			map.set(doc.project, {
				name: doc.project,
				changeCount: 0,
				adrCount: 0,
				specCount: 0,
				tddCount: 0,
				artifactCount: 0,
				archivedCount: 0,
				activeCount: 0,
				lastUpdated: '',
			});
		}
		const summary = map.get(doc.project)!;
		if (doc.kind === 'note' && doc.tags.includes('change'))
			summary.changeCount++;
		if (doc.kind === 'adr' && doc.status === 'canonical') summary.adrCount++;
		if (doc.kind === 'spec' && doc.status === 'canonical') summary.specCount++;
		if (doc.kind === 'tdd' && doc.status === 'canonical') summary.tddCount++;
		if (doc.kind !== 'note' || doc.id === 'openspec-config')
			summary.artifactCount++;
		if (doc.status === 'archived') summary.archivedCount++;
		if (doc.status === 'active') summary.activeCount++;
		if (!summary.lastUpdated || doc.date > summary.lastUpdated)
			summary.lastUpdated = doc.date;
	}
	return [...map.values()].sort(
		(a, b) =>
			b.lastUpdated.localeCompare(a.lastUpdated) ||
			a.name.localeCompare(b.name),
	);
}
