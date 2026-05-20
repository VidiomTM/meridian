import { describe, it, expect } from 'vitest';
import { renderMarkdown, splitFrontmatter, extractTitle, extractSubtitle } from './parser.js';

describe('renderMarkdown', () => {
	it('renders a heading', () => {
		const result = renderMarkdown('# Hello World');
		expect(result).toContain('<h1');
		expect(result).toContain('Hello World');
	});

	it('renders a paragraph', () => {
		const result = renderMarkdown('Simple paragraph text.');
		expect(result).toContain('<p');
		expect(result).toContain('Simple paragraph text.');
	});

	it('renders inline code', () => {
		const result = renderMarkdown('Use `code` inline.');
		expect(result).toContain('<code>code</code>');
	});

	it('renders bold text', () => {
		const result = renderMarkdown('**bold** text');
		expect(result).toContain('<strong>bold</strong>');
	});

	it('renders italic text', () => {
		const result = renderMarkdown('*italic* text');
		expect(result).toContain('<em>italic</em>');
	});

	it('renders a link', () => {
		const result = renderMarkdown('[label](https://example.com)');
		expect(result).toContain('<a href="https://example.com">label</a>');
	});

	it('renders a code block', () => {
		const result = renderMarkdown('```\ncode block\n```');
		expect(result).toContain('<pre');
		expect(result).toContain('<code');
		expect(result).toContain('code block');
	});

	it('renders a code block with language', () => {
		const result = renderMarkdown('```typescript\nconst x = 1;\n```');
		expect(result).toContain('class="language-typescript"');
	});

	it('renders a horizontal rule', () => {
		const result = renderMarkdown('---');
		expect(result).toContain('<hr');
	});

	it('renders a blockquote', () => {
		const result = renderMarkdown('> quoted text');
		expect(result).toContain('<blockquote');
		expect(result).toContain('quoted text');
	});

	it('renders an unordered list', () => {
		const result = renderMarkdown('- item 1\n- item 2');
		expect(result).toContain('<ul>');
		expect(result).toContain('<li');
		expect(result).toContain('item 1');
		expect(result).toContain('item 2');
	});

	it('renders an ordered list', () => {
		const result = renderMarkdown('1. first\n2. second');
		expect(result).toContain('<ol>');
		expect(result).toContain('first');
		expect(result).toContain('second');
	});

	it('renders a table', () => {
		const result = renderMarkdown('| A | B |\n| - | - |\n| 1 | 2 |');
		expect(result).toContain('<table>');
		expect(result).toContain('<th>A</th>');
		expect(result).toContain('<td>1</td>');
	});

	it('renders xrefs with byId map', () => {
		const byId = new Map();
		byId.set('DOC-001', { status: 'active', title: 'Test Doc' });
		const result = renderMarkdown('See {{DOC-001}} for details.', byId);
		expect(result).toContain('xref-chip');
		expect(result).toContain('DOC-001');
	});

	it('renders unknown xrefs', () => {
		const result = renderMarkdown('See {{UNKNOWN-REF}}.', new Map());
		expect(result).toContain('xref-unknown');
	});

	it('renders unsafe URL as #', () => {
		const result = renderMarkdown('[click](javascript:alert(1))');
		expect(result).toContain('href="#"');
	});

	it('renders safe URLs correctly', () => {
		const result = renderMarkdown('[home](/path) [ext](https://ext.com) [mail](mailto:a@b.com) [hash](#anchor)');
		expect(result).toContain('href="/path"');
		expect(result).toContain('href="https://ext.com"');
		expect(result).toContain('href="mailto:a@b.com"');
		expect(result).toContain('href="#anchor"');
	});

	it('escapes HTML in content', () => {
		const result = renderMarkdown('<script>alert("xss")</script>');
		expect(result).not.toContain('<script>');
		expect(result).toContain('&lt;script&gt;');
	});

	it('renders heading levels h1-h6', () => {
		for (let i = 1; i <= 6; i++) {
			const prefix = '#'.repeat(i);
			const result = renderMarkdown(`${prefix} Level ${i}`);
			expect(result).toContain(`<h${i}`);
		}
	});

	it('renders multiple paragraphs separated by blank lines', () => {
		const result = renderMarkdown('First paragraph.\n\nSecond paragraph.');
		expect(result.match(/<p/g)?.length).toBe(2);
	});
});

describe('splitFrontmatter', () => {
	it('extracts frontmatter data', () => {
		const result = splitFrontmatter('---\ntitle: Test\nstatus: active\n---\n\nBody content.');
		expect(result.data).toEqual({ title: 'Test', status: 'active' });
		expect(result.rawBody).toBe('Body content.');
	});

	it('handles content without frontmatter', () => {
		const result = splitFrontmatter('Just body text.');
		expect(result.data).toEqual({});
		expect(result.rawBody).toBe('Just body text.');
	});
});

describe('extractTitle', () => {
	it('extracts title from first h1', () => {
		const title = extractTitle('# My Title\n\nSome content.', 'Fallback');
		expect(title).toBe('My Title');
	});

	it('returns fallback when no h1 exists', () => {
		const title = extractTitle('Just text.', 'Fallback Title');
		expect(title).toBe('Fallback Title');
	});
});

describe('extractSubtitle', () => {
	it('uses frontmatter description when available', () => {
		const sub = extractSubtitle('# Doc\n\nBody.', { description: 'From FM' });
		expect(sub).toBe('From FM');
	});

	it('falls back to first section content when no description', () => {
		const sub = extractSubtitle('# Doc\n\n## Summary\n\nKey info here.\n\n## Other');
		expect(sub).toBe('Key info here.');
	});

	it('falls back to body text after stripping heading when no matching section', () => {
		const sub = extractSubtitle('# Doc\n\nFirst paragraph of body.');
		expect(sub).toBe('Doc');
	});
});
