# Meridian

Meridian is a read-only visual browser for OpenSpec workspaces. OpenSpec owns the planning workflow and artifact lifecycle; Meridian adds navigation, search, rendering, and graph views across local projects.

## OpenSpec Workflow

Meridian uses the official OpenSpec CLI and generated Codex skills.

```sh
openspec status
/opsx:propose "your change"
/opsx:apply
/opsx:archive
```

OpenSpec files live under `openspec/`. Meridian reads these artifacts but does not edit, accept, annotate, archive, or synchronize them. Use the OpenSpec commands for all workflow actions.

## Development

```sh
npm install
npm run dev
npm run check
npm run build
```

By default Meridian scans `/Users/jonathangadeaharder/projects` for projects with an `openspec/` directory. Override that root with `CODEX_ROOT`.
