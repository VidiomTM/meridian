import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { loadCorpus, findDoc } from '$lib/meridian/corpus.js';

export const load: PageServerLoad = async ({ params, depends }) => {
	depends('app:doc');
	const corpus = loadCorpus();
	const doc = findDoc(corpus.docs, params.project, params.docId);
	if (!doc) {
		throw error(404, `Document not found: ${params.project}/${params.docId}`);
	}
	return { doc };
};
