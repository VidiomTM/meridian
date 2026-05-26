import { getProjectSummaries, loadCorpus } from '$lib/meridian/corpus.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ depends }) => {
	depends('app:projects');

	const corpus = loadCorpus();
	const slim = corpus.docs.map(
		({ id, kind, title, status, date, tags, project, authors }) => ({
			id,
			kind,
			title,
			status,
			date: date ?? '',
			tags,
			project: project ?? '',
			authors,
		}),
	);
	const projects = getProjectSummaries(slim);

	return { projects };
};
