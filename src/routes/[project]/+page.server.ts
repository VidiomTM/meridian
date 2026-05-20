import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { docs } = await parent();
	const projectDocs = docs.filter(
		(d: { project: string }) => d.project === params.project,
	);
	if (projectDocs.length === 0)
		throw error(404, `No documents found in project "${params.project}"`);
	return { projectDocs };
};
