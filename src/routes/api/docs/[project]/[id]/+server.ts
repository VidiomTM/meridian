import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { writeOpenSpecDoc } from '$lib/meridian/corpus.js';
import type { RequestHandler } from './$types';

const SaveBody = z.object({
	body: z.string(),
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
