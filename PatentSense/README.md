# PatentSense

PatentSense is a React/Vite client, an Express API with a SQLite database, and a Flask service for document extraction and patent similarity search.

## Requirements

- Node.js 20.19+ or 22.12+ (Vite 8 requirement)
- Python 3.10+
- npm

The core Flask service uses a deterministic local lexical embedding fallback. Sentence-BERT and FAISS are optional and can be installed from `ai_service/requirements-ml.txt`; the model download requires network access the first time it starts.

## Local setup

Run these commands from this directory (`PatentSense/`):

```powershell
npm ci
npm ci --prefix server
npm ci --prefix client
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r ai_service/requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and replace `JWT_SECRET` with a unique random value. Generate one with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Start Express, Flask, and Vite together:

```powershell
npm run dev
```

Open <http://localhost:5173>. The Express API listens on `127.0.0.1:5000`, Flask on `127.0.0.1:5001`, and Vite forwards `/api` calls to Express. On first start, SQLite is initialized at `server/patentsense.db` and reference patents are seeded. Local development also creates a sample account (`user1@example.com` / `user1234`) with sample history. Use that account only on a local disposable database; register a separate account for your own walkthrough.

To use Sentence-BERT and FAISS instead of the fallback, activate the Python environment and run `py -m pip install -r ai_service/requirements-ml.txt`. The configured model defaults to `all-MiniLM-L6-v2`. Check `/health` on port 5001 to see which model and retrieval method loaded.

## Environment

Copy `.env.example` to `.env`. Important settings:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production` for deployment; this disables sample user/history seeding. |
| `JWT_SECRET` | Required, unique signing secret of at least 32 characters. |
| `API_PORT`, `AI_PORT` | Express and Flask listening ports. |
| `DATABASE_PATH` | SQLite file path; keep the database on persistent storage and back it up. |
| `FLASK_URL` | Express-to-Flask base URL. |
| `API_PROXY_TARGET` | Vite development proxy target. |
| `APP_BASE_URL` | Public app URL used in password reset links. |
| `RESEND_API_KEY`, `PASSWORD_RESET_EMAIL_FROM` | Configure outbound reset email; required for password reset in production. |
| `MIN_SIMILARITY` | Similarity cutoff from 0 to 1 (default `0.25`). |
| `AI_REQUEST_TIMEOUT_MS` | Express timeout for extraction and similarity requests. |

Never commit `.env`, production database files, or real user data.

## Build and deployment

Build and start the client/API:

```powershell
npm run build --prefix client
```

Then deploy the Express process (`npm start --prefix server`) and Flask process (`py ai_service/app.py`) as separate long-running services. Express serves `client/dist` as well as `/api`; keep both services on a private network and set `FLASK_URL` to the Flask service address. Configure the platform to persist the directory containing `DATABASE_PATH`, set `NODE_ENV=production`, a fresh `JWT_SECRET`, `APP_BASE_URL`, and working Resend email settings. Ensure only one API instance runs against a local SQLite file unless the database is moved to a concurrency-safe shared service. Terminate TLS at a trusted reverse proxy and expose only the public app/API endpoint. The optional transformer model must be installed and downloaded during image/build preparation, not assumed to be available at runtime.

After registering the trusted operator account, grant admin explicitly from the project directory:

```powershell
npm run admin:promote -- operator@example.com
```

No public registration is automatically made an administrator. The promote command requires a matching account and should be run only by the deployment operator.

## Demo workflow

1. Register or sign in, then open **Patent Library** and search a seeded title such as “wearable blood glucose monitoring”. Open a result and save it.
2. Open **Similarity Search**, paste the title and a short technical summary, and run the search. The page shows ranked references and the active retrieval method.
3. Open **New Analysis**, enter a title, abstract, claims, and detailed description, then run the analysis. The result is saved in SQLite and appears under **My Analyses** and **Reports**.
4. In **New Analysis → Upload Document**, upload a UTF-8 TXT patent draft with `Abstract:`, `Claims:`, and `Description:` headings. Review the extracted fields before submitting. PDF and DOCX uploads are also accepted (25 MB maximum).
5. Visit **Saved Patents**, **Reports**, and **Settings** to verify the saved record, download the HTML report, and persist a preference change. Log out and sign in again to confirm session and data persistence.
6. To demonstrate admin screens, register a separate trusted operator and use the explicit promotion command above. Admin changes are checked by the API.

Similarity and novelty values are corpus-relative screening signals. The local seeded patent set is demo data, not a comprehensive prior-art source or patentability opinion.

## Verification

From `PatentSense/`:

```powershell
npm run build --prefix client
node --check server/server.js
node --check server/routes/analysis.js
py -m py_compile ai_service/app.py
```

Health endpoints: `http://127.0.0.1:5000/health` and `http://127.0.0.1:5001/health`. The Vite development page is at `http://localhost:5173`.
