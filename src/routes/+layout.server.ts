import type { LayoutServerLoad } from './$types.js';
import { loadCorpus, getProjectSummaries } from '$lib/meridian/corpus.js';
import type { ProjectSummary } from '$lib/meridian/corpus.js';

export const load: LayoutServerLoad = async () => {
	const corpus = loadCorpus();

	// Trim to slim summaries for the layout (Explorer, breadcrumb, j/k nav)
	const slim = corpus.docs.map(({ id, kind, title, status, date, tags, project, authors }) =>
		({ id, kind, title, status, date: date ?? '', tags, project: project ?? '', authors })
	);

	const projects: ProjectSummary[] = getProjectSummaries(slim);

	return {
		docs: slim,
		byId: corpus.byId,
		inv: corpus.inv,
		projects
	};
};
