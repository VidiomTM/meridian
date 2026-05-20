import { z } from 'zod';

export const DocStatus = z.enum(['active', 'canonical', 'archived', 'legacy']);
export type DocStatus = z.infer<typeof DocStatus>;

export const DocKind = z.enum(['proposal', 'design', 'tasks', 'adr', 'spec', 'tdd', 'note']);
export type DocKind = z.infer<typeof DocKind>;

export const ExternalLink = z.object({
	kind: z.enum(['github', 'docs', 'other']),
	ref: z.string(),
	title: z.string().optional()
});
export type ExternalLink = z.infer<typeof ExternalLink>;

export const MeridianDoc = z.object({
	id: z.string(),
	kind: DocKind,
	title: z.string(),
	status: DocStatus,
	date: z.string().optional(),
	authors: z.array(z.string()).default([]),
	tags: z.array(z.string()).default([]),
	related: z.array(z.string()).default([]),
	contains: z.array(z.string()).default([]),
	part_of: z.array(z.string()).default([]),
	external: z.array(ExternalLink).default([]),
	project: z.string().optional(),
	description: z.string().optional(),
	body: z.string(),
	rawBody: z.string(),
	filePath: z.string(),
	contentType: z.enum(['markdown', 'yaml']).default('markdown'),
	source: z.enum(['openspec', 'legacy']).default('openspec')
});
export type MeridianDoc = z.infer<typeof MeridianDoc>;

export const InvEntry = z.object({
	contained_by: z.array(z.string()).default([]),
	contains_inv: z.array(z.string()).default([]),
	related_from: z.array(z.string()).default([])
});
export type InvEntry = z.infer<typeof InvEntry>;

export const STATUS_LABELS: Record<DocStatus, string> = {
	active: 'Active',
	canonical: 'Canonical',
	archived: 'Archived',
	legacy: 'Legacy'
};

export const KIND_LABELS: Record<DocKind, string> = {
	proposal: 'Proposal',
	design: 'Design',
	tasks: 'Tasks',
	adr: 'ADR',
	spec: 'Spec',
	tdd: 'TDD',
	note: 'Note'
};

export const REL_COLORS: Record<string, string> = {
	contains: 'var(--rel-implements)',
	part_of: 'var(--rel-depends)',
	related: 'var(--rel-related)',
	contained_by: 'var(--rel-depends)',
	contains_inv: 'var(--rel-implements)',
	related_from: 'var(--rel-related)'
};

export const REL_LABELS: Record<string, string> = {
	contains: 'Contains',
	part_of: 'Part Of',
	related: 'Related',
	contained_by: 'Contained By',
	contains_inv: 'Contains',
	related_from: 'Related From'
};
