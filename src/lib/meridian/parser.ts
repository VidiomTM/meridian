import matter from 'gray-matter';
import type { DocStatus } from './format.js';

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function safeUrl(raw: string): string {
	const url = raw.trim();
	if (/^(https?:|mailto:|\/|#)/i.test(url)) return escapeHtml(url);
	return '#';
}

function renderInline(text: string): string {
	const escaped = escapeHtml(text);
	return escaped
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
		.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			(_m, label, url) => `<a href="${safeUrl(url)}">${label}</a>`,
		);
}

function renderXrefs(
	html: string,
	byId: Map<
		string,
		{ status: DocStatus; title: string; project?: string }
	> | null,
	currentProject?: string,
): string {
	return html.replace(/\{\{([A-Z0-9._:-]+)\}\}/g, (_, ref) => {
		const doc =
			(currentProject ? byId?.get(`${currentProject}:${ref}`) : undefined) ??
			byId?.get(ref);
		if (!doc) return `<code class="xref-unknown">${escapeHtml(ref)}</code>`;
		const status = doc.status ?? 'active';
		const href = doc.project
			? `/${encodeURIComponent(doc.project)}/${encodeURIComponent(ref)}`
			: `/${encodeURIComponent(ref)}`;
		return `<a href="${href}" class="xref-chip" title="${escapeHtml(doc.title)}">${escapeHtml(ref)} <span>${status}</span></a>`;
	});
}

export function renderMarkdown(
	raw: string,
	byId: Map<
		string,
		{ status: DocStatus; title: string; project?: string }
	> | null = null,
	currentProject?: string,
	_blk: { n: number } = { n: 0 },
): string {
	const lines = raw.split('\n');
	const out: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (line.startsWith('```')) {
			const lang = escapeHtml(line.slice(3).trim());
			const codeLines: string[] = [];
			i++;
			while (i < lines.length && !lines[i].startsWith('```')) {
				codeLines.push(escapeHtml(lines[i]));
				i++;
			}
			out.push(
				`<pre data-block-id="pre-${_blk.n++}"><code${lang ? ` class="language-${lang}"` : ''}>${codeLines.join('\n')}</code></pre>`,
			);
			i++;
			continue;
		}

		const hMatch = line.match(/^(#{1,6})\s+(.*)/);
		if (hMatch) {
			const level = hMatch[1].length;
			out.push(
				`<h${level} data-block-id="h${level}-${_blk.n++}">${renderInline(hMatch[2])}</h${level}>`,
			);
			i++;
			continue;
		}

		if (/^[-*_]{3,}\s*$/.test(line)) {
			out.push(`<hr data-block-id="hr-${_blk.n++}">`);
			i++;
			continue;
		}

		if (line.startsWith('> ')) {
			const blockLines: string[] = [];
			while (i < lines.length && lines[i].startsWith('> ')) {
				blockLines.push(lines[i].slice(2));
				i++;
			}
			out.push(
				`<blockquote data-block-id="bq-${_blk.n++}">${renderMarkdown(blockLines.join('\n'), byId, currentProject, _blk)}</blockquote>`,
			);
			continue;
		}

		if (/^[-*+]\s/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
				items.push(
					`<li data-block-id="li-${_blk.n++}">${renderInline(lines[i].replace(/^[-*+]\s/, ''))}</li>`,
				);
				i++;
			}
			out.push(`<ul>${items.join('')}</ul>`);
			continue;
		}

		if (/^\d+\.\s/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
				items.push(
					`<li data-block-id="li-${_blk.n++}">${renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>`,
				);
				i++;
			}
			out.push(`<ol>${items.join('')}</ol>`);
			continue;
		}

		if (
			line.includes('|') &&
			i + 1 < lines.length &&
			/^\|?\s*:?-+:?\s*\|/.test(lines[i + 1])
		) {
			const tableLines: string[] = [];
			while (i < lines.length && lines[i].includes('|')) {
				tableLines.push(lines[i]);
				i++;
			}
			const parseRow = (row: string) =>
				row
					.split('|')
					.filter((_, ci, arr) => ci > 0 && ci < arr.length - 1)
					.map((cell) => cell.trim());
			const header = parseRow(tableLines[0]);
			const ths = header
				.map((cell) => `<th>${renderInline(cell)}</th>`)
				.join('');
			const trs = tableLines
				.slice(2)
				.map((row) => {
					const tds = parseRow(row)
						.map((cell) => `<td>${renderInline(cell)}</td>`)
						.join('');
					return `<tr data-block-id="tr-${_blk.n++}">${tds}</tr>`;
				})
				.join('');
			out.push(
				`<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`,
			);
			continue;
		}

		if (line.trim() === '') {
			i++;
			continue;
		}

		const paraLines: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() !== '' &&
			!lines[i].startsWith('#') &&
			!lines[i].startsWith('```') &&
			!lines[i].startsWith('> ') &&
			!/^[-*+]\s/.test(lines[i]) &&
			!/^\d+\.\s/.test(lines[i])
		) {
			paraLines.push(lines[i]);
			i++;
		}
		if (paraLines.length) {
			out.push(
				`<p data-block-id="p-${_blk.n++}">${renderInline(paraLines.join(' '))}</p>`,
			);
		}
	}

	return renderXrefs(out.join('\n'), byId, currentProject);
}

export function splitFrontmatter(fileContent: string): {
	data: Record<string, unknown>;
	rawBody: string;
} {
	const parsed = matter(fileContent);
	return { data: parsed.data, rawBody: parsed.content.trim() };
}

export function extractTitle(rawBody: string, fallback: string): string {
	const match = rawBody.match(/^#\s+(.+)$/m);
	return match?.[1].trim() || fallback;
}

export function extractSubtitle(
	rawBody: string,
	frontmatter?: { description?: string },
): string {
	if (frontmatter?.description) return frontmatter.description.trim();
	const firstSection = rawBody.match(
		/##\s+(?:Summary|Overview|Context|Executive Summary)\s*\n([\s\S]*?)(?=\n##|\n---|\n$)/i,
	);
	if (firstSection) return firstSection[1].trim().split('\n\n')[0].trim();
	return rawBody
		.split('\n\n')[0]
		.replace(/^#+\s*/, '')
		.trim();
}
