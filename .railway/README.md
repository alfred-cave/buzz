# Buzz on Railway

[`railway.ts`](./railway.ts) defines the complete self-hosted Buzz project:

- Buzz Relay and Pairing Relay, both built from `alfred-cave/buzz` `main`
- Railway-managed PostgreSQL and Redis
- a Railway object-storage bucket for media and Git objects
- relay, HMAC, and bucket credentials preserved in Railway (never committed)
- closed membership owned by the configured public Nostr key

The file is evaluated by Railway's TypeScript IaC SDK. The SDK is pinned in
the repository's root `package.json`.

## Deploy

```bash
railway login
railway link
railway config plan
railway config apply
```

`config apply` creates billable Railway resources, so review the plan first.

The current Railway-generated domains are recorded in `railway.ts` because the
beta IaC importer otherwise plans to remove their networking configuration.
When cloning this configuration into a different Railway project, replace those
domains and bootstrap the variables marked with `preserve()` before deploying.

For a new project, create the domains with:

```bash
railway domain --service "Pairing Relay" --port 5000
railway domain --service "Buzz Relay" --port 3000
```

The Buzz desktop client connects to the URL printed for `Buzz Relay`, changing
its `https://` scheme to `wss://`.

## Update

Both Buzz services follow the fork's `main` branch. Sync or merge upstream into
that branch, then let Railway auto-deploy the new commit. Preview infrastructure
changes separately with:

```bash
railway config plan
```
