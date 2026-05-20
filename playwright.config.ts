import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm build && pnpm exec vite preview --port 4173',
		port: 4173,
		timeout: 30000
	},
	testDir: 'tests/e2e'
});
