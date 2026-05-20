import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeOpenSpecDoc } from '$lib/meridian/corpus.js';
import { z } from 'zod';

const SaveBody = z.object({
	body: z.string()
});

export const PUT: RequestHandler = async ({ params, request }) => {
	const raw = await request.json().catch(() => null);
	const parsed = SaveBody.safeParse(raw);
	if (!parsed.success) throw error(400, parsed.error.message);

	try {
		await writeOpenSpecDoc(params.project, params.id, parsed.data.body);
		return json({ ok: true });
	} catch (err) {
		throw error(400, (err as Error).message);
	}
};
