# VelionConnect API Documentation

This folder holds the API documentation, maintained **outside** the route code
so controllers stay clean (no inline Swagger decorators).

| File                                     | What it is                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `openapi.yaml`                           | The OpenAPI 3.1 specification — the single source of truth for the API docs. |
| `velionconnect.postman_collection.json`  | Postman v2.1 collection with sample payloads for every resource group.       |
| `velionconnect.postman_environment.json` | Postman environment (base URL + variables).                                  |

## Swagger UI

The running API serves this spec as interactive Swagger UI:

- **URL:** `http://localhost:3001/api/docs`
- The spec is loaded from `docs/api/openapi.yaml` at startup by
  `apps/api/src/config/swagger.ts` (`setupSwagger(app)`), which `main.ts` calls.
  Nothing is defined inline on the controllers.
- If the spec file isn't present (e.g. a slim production image), Swagger is
  skipped gracefully rather than blocking boot.

The raw document is also available as JSON at `http://localhost:3001/api/docs-json`.

### Editing the docs

Edit `openapi.yaml` and restart the API. Keep it in sync with the controllers
under `apps/api/src/modules/*`. Validate before committing:

```bash
# any YAML/OpenAPI linter works; a quick structural check:
python3 -c "import yaml; yaml.safe_load(open('docs/api/openapi.yaml')); print('ok')"
```

## Postman

1. Import both JSON files into Postman.
2. Select the **VelionConnect — Local** environment.
3. Run **Auth → Register** (or **Login**). The API sets HttpOnly `access_token` /
   `refresh_token` cookies; Postman stores them in its cookie jar and sends them
   automatically on later requests.
   - Non-cookie clients can instead paste a JWT into the `accessToken` variable —
     the collection is configured for Bearer auth as a fallback.
4. After **Create organization** / **Create workspace**, set the `orgSlug` and
   `workspaceSlug` environment variables. Set `conversationId`, `contactId`,
   `connectedAccountId`, and `postId` as you create those resources.

## Authentication model

- `access_token` — 15-minute JWT, sent on every request.
- `refresh_token` — 30-day rotating JWT; call `POST /auth/refresh` to rotate.
- Both are HttpOnly cookies set by `register` / `login` / `2fa/verify`.
- Accounts with 2FA enabled receive `{ requiresTwoFactor, tempToken }` from
  `login` and must complete `POST /auth/2fa/verify`.

## Conventions

- Timestamps: ISO-8601 UTC.
- Money: integer minor units (kobo/cents) + ISO-4217 `currency`.
- Phone: E.164 (`+2348012345678`).
- Lists: cursor-paginated — pass `?cursor=` and read `nextCursor`.
- All application routes are under the global prefix `/api/v1`.
