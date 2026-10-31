# @nba-stats-rewind/web

This is the web application for NBA Stats Rewind, built with Next.js.

Refer to the [root README](../../README.md) for general project information and setup instructions.

## Development

```bash
npm run dev
```

## Testing

```bash
npm run test
npm run test:e2e
```
## Deployment (Cloudflare Workers)

The app is deployed to Cloudflare Workers using [OpenNext](https://opennext.js.org/cloudflare).

```bash
# Build and run locally in the Workers runtime
npm run preview

# Build and deploy to Cloudflare (requires `npx wrangler login` or CLOUDFLARE_API_TOKEN)
npm run deploy
```

Worker settings live in `wrangler.jsonc`.
