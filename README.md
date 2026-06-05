# Meridian

Meridian is a visual browser for OpenSpec workspaces. OpenSpec owns the planning workflow and artifact lifecycle; Meridian adds navigation, search, rendering, graph views, and inline editing across local projects.

## OpenSpec Workflow

Meridian uses the official OpenSpec CLI and generated Codex skills.

```sh
openspec status
/opsx:propose "your change"
/opsx:apply
/opsx:archive
```

OpenSpec files live under `openspec/`. Meridian reads and can inline-edit artifact bodies, but does not create, accept, annotate, archive, or synchronize documents. Use the OpenSpec commands for all workflow actions.

## Development

```sh
pnpm install
pnpm run dev
pnpm run check
pnpm run build
```

By default Meridian scans `/Users/jonathangadeaharder/projects` for projects with an `openspec/` directory. Override that root with `MERIDIAN_ROOT`.
