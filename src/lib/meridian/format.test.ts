import { describe, it, expect } from 'vitest';
import { DocStatus, DocKind, ExternalLink, MeridianDoc, InvEntry, STATUS_LABELS, KIND_LABELS, REL_COLORS, REL_LABELS } from './format.js';

describe('DocStatus', () => {
	it('accepts valid statuses', () => {
		expect(DocStatus.parse('active')).toBe('active');
		expect(DocStatus.parse('canonical')).toBe('canonical');
		expect(DocStatus.parse('archived')).toBe('archived');
		expect(DocStatus.parse('legacy')).toBe('legacy');
	});

	it('rejects invalid status', () => {
		expect(() => DocStatus.parse('invalid')).toThrow();
	});
});

describe('DocKind', () => {
	it('accepts valid kinds', () => {
		expect(DocKind.parse('proposal')).toBe('proposal');
		expect(DocKind.parse('design')).toBe('design');
		expect(DocKind.parse('tasks')).toBe('tasks');
		expect(DocKind.parse('adr')).toBe('adr');
		expect(DocKind.parse('spec')).toBe('spec');
		expect(DocKind.parse('tdd')).toBe('tdd');
		expect(DocKind.parse('note')).toBe('note');
	});

	it('rejects invalid kind', () => {
		expect(() => DocKind.parse('blog')).toThrow();
	});
});

describe('ExternalLink', () => {
	it('parses a valid external link', () => {
		const link = ExternalLink.parse({ kind: 'github', ref: 'org/repo#1' });
		expect(link.kind).toBe('github');
		expect(link.ref).toBe('org/repo#1');
	});

	it('accepts optional title', () => {
		const link = ExternalLink.parse({ kind: 'docs', ref: 'https://docs.example.com', title: 'Docs' });
		expect(link.title).toBe('Docs');
	});
});

describe('MeridianDoc', () => {
	const base = {
		id: 'test-doc',
		kind: 'spec',
		title: 'Test Doc',
		status: 'active',
		body: '<p>hello</p>',
		rawBody: '# Hello',
		filePath: '/path/to/doc.md'
	};

	it('parses a minimal document', () => {
		const doc = MeridianDoc.parse(base);
		expect(doc.id).toBe('test-doc');
		expect(doc.authors).toEqual([]);
		expect(doc.tags).toEqual([]);
		expect(doc.related).toEqual([]);
		expect(doc.contains).toEqual([]);
		expect(doc.part_of).toEqual([]);
		expect(doc.external).toEqual([]);
		expect(doc.contentType).toBe('markdown');
		expect(doc.source).toBe('openspec');
	});

	it('accepts optional fields', () => {
		const doc = MeridianDoc.parse({ ...base, project: 'my-project', description: 'A test', date: '2025-01-01' });
		expect(doc.project).toBe('my-project');
		expect(doc.description).toBe('A test');
		expect(doc.date).toBe('2025-01-01');
	});
});

describe('InvEntry', () => {
	it('defaults to empty arrays', () => {
		const entry = InvEntry.parse({});
		expect(entry.contained_by).toEqual([]);
		expect(entry.contains_inv).toEqual([]);
		expect(entry.related_from).toEqual([]);
	});

	it('accepts populated arrays', () => {
		const entry = InvEntry.parse({
			contained_by: ['a', 'b'],
			contains_inv: ['c'],
			related_from: ['d']
		});
		expect(entry.contained_by).toEqual(['a', 'b']);
		expect(entry.contains_inv).toEqual(['c']);
		expect(entry.related_from).toEqual(['d']);
	});
});

describe('STATUS_LABELS', () => {
	it('has labels for all statuses', () => {
		const statuses: Array<import('./format.js').DocStatus> = ['active', 'canonical', 'archived', 'legacy'];
		for (const s of statuses) {
			expect(STATUS_LABELS[s]).toBeTruthy();
		}
	});
});

describe('KIND_LABELS', () => {
	it('has labels for all kinds', () => {
		const kinds: Array<import('./format.js').DocKind> = ['proposal', 'design', 'tasks', 'adr', 'spec', 'tdd', 'note'];
		for (const k of kinds) {
			expect(KIND_LABELS[k]).toBeTruthy();
		}
	});
});

describe('REL_COLORS / REL_LABELS', () => {
	it('has entries for all relation types', () => {
		const keys = ['contains', 'part_of', 'related', 'contained_by', 'contains_inv', 'related_from'];
		for (const k of keys) {
			expect(REL_COLORS[k]).toBeTruthy();
			expect(REL_LABELS[k]).toBeTruthy();
		}
	});
});
