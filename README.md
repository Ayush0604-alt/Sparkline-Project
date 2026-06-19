# Sparkline Crane Monitoring Dashboard

A full-stack IoT telemetry dashboard for monitoring industrial cranes in
real time — built with **React + Vite + Tailwind** on the frontend and
**Node.js + Express + raw PostgreSQL (`pg`)** on the backend, deployed
against **Neon** serverless Postgres.
#Live url: https://sparkline-project-1.onrender.com/

---

## 1. Project Overview

Sparkline's cranes stream sensor telemetry (load, motor temperature,
vibration, status) roughly every 5 minutes. This project:

- Ingests and stores that telemetry in PostgreSQL
- Serves it via a small REST API
- Visualizes live crane status, historical temperature trends, and
  system-wide stats on a React dashboard
- Automatically raises an **alert** whenever a crane's motor temperature
  exceeds a safe threshold (80°C by default)

The dashboard auto-refreshes every 5 seconds, so it behaves like a live
operations screen rather than a static report.

---

## 2. Architecture

```
   ┌──────────────┐        HTTP / JSON        ┌──────────────┐        SQL        ┌──────────────┐
   │   React      │  ───────────────────────▶ │   Express    │ ─────────────────▶ │  PostgreSQL  │
   │  (Vite SPA)  │ ◀─────────────────────── │   REST API   │ ◀───────────────── │   (Neon)     │
   └──────────────┘                            └──────────────┘                    └──────────────┘
        │                                            │
        │ polls every 5s via Axios                   │ raw SQL via `pg` Pool
        │ (no WebSockets — see Design Decisions)      │ parameterized queries only
```

**Flow in one sentence:** React polls Express on a 5-second interval →
Express runs parameterized SQL against Neon Postgres → results flow back
as JSON → React renders KPI cards, a Recharts line chart, and an alerts
table.

---

## 3. Folder Structure

```
Crane_AyushJha/
├── README.md                  ← you are here
├── EVIDENCE.md                 ← sample requests/responses, DB rows, alert logs
├── requirements.txt             ← dependency manifest (Node project, see file for details)
├── screenshots/
│   ├── README.md               ← checklist of screenshots to capture
│   ├── dashboard.png
│   ├── chart.png
│   └── alerts.png
└── code/
    ├── backend/
    │   ├── schema.sql                      ← DB schema (tables + indexes)
    │   ├── .env.example
    │   ├── package.json
    │   ├── scripts/
    │   │   ├── readings_seed.json          ← ~3 days of telemetry, 3 cranes
    │   │   ├── initDb.js                   ← applies schema.sql
    │   │   └── seed.js                     ← bulk-loads readings + generates alerts
    │   └── src/
    │       ├── server.js                   ← entry point, DB connectivity check
    │       ├── app.js                       ← Express app (middleware, routes)
    │       ├── config/config.js            ← centralized env var access
    │       ├── db/pool.js                  ← pg Pool + query helper
    │       ├── middleware/
    │       │   ├── validateReading.js      ← POST /api/readings validation
    │       │   ├── notFound.js             ← 404 handler
    │       │   └── errorHandler.js         ← global error handler
    │       ├── controllers/
    │       │   ├── readingsController.js
    │       │   └── alertsController.js
    │       ├── routes/
    │       │   ├── readingsRoutes.js
    │       │   └── alertsRoutes.js
    │       └── utils/alertEngine.js        ← shared alert-evaluation logic
    └── frontend/
        ├── .env.example
        ├── package.json
        ├── index.html
        ├── tailwind.config.js
        ├── vite.config.js
        └── src/
            ├── main.jsx
            ├── App.jsx
            ├── index.css
            ├── services/api.js             ← Axios instance + endpoint methods
            ├── hooks/
            │   ├── usePolling.js           ← auto-refresh hook (cleanup-safe)
            │   └── useToasts.js            ← toast notification state
            └── components/
                ├── Header.jsx
                ├── DashboardStats.jsx       ← Section 4
                ├── CraneOverview.jsx        ← Section 1
                ├── TemperatureTrend.jsx     ← Section 2
                ├── AlertsList.jsx           ← Section 3
                ├── StatusBadge.jsx
                ├── Toast.jsx
                ├── LoadingState.jsx
                ├── ErrorState.jsx
                └── EmptyState.jsx
```

---

## 4. Local Setup

**Prerequisites:** Node.js ≥ 18, a Neon Postgres database (or any
Postgres instance), npm.

```bash
# 1. Unzip and enter the project
cd Crane_AyushJha/code

# 2. Backend setup
cd backend
cp .env.example .env
# → open .env and paste your real DATABASE_URL
npm install
npm run db:init     # creates readings + alerts tables
npm run seed        # loads readings_seed.json + generates alerts
npm start            # starts API on http://localhost:5000

# 3. Frontend setup (in a new terminal)
cd ../frontend
cp .env.example .env   # defaults already point to http://localhost:5000/api
npm install
npm run dev             # starts Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` — you should see all 3 cranes, a live
temperature chart, and a populated alerts table within a few seconds.

**Total time from unzip to running dashboard: under 5 minutes**, assuming
your Neon `DATABASE_URL` is already in hand.

---

## 5. Environment Variables

### Backend (`code/backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `PORT` | Port Express listens on | `5000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `ALERT_TEMP_THRESHOLD_C` | Temp threshold (°C) that triggers an alert | `80` |

### Frontend (`code/frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:5000/api` |

---

## 6. Database Setup

The schema is defined in `code/backend/schema.sql` and applied via:

```bash
npm run db:init
```

This runs every statement in `schema.sql` against `DATABASE_URL`. All
statements use `IF NOT EXISTS`, so the script is safe to re-run.

**Tables:**

- `readings` — one row per telemetry reading (`crane_id`, `ts`, `load_kg`,
  `motor_temp_c`, `vibration_mm_s`, `status`). A unique index on
  `(crane_id, ts)` prevents duplicate ingestion of the same sensor reading.
- `alerts` — one row per threshold breach. A unique index on
  `(crane_id, reading_ts)` prevents the same reading from generating two
  alerts.

**Indexes** (see `schema.sql` for full detail):
- `idx_readings_crane_id`, `idx_readings_ts`, and a composite
  `idx_readings_crane_ts (crane_id, ts DESC)` for the time-range and
  latest-reading queries.
- `idx_alerts_crane_id` and `idx_alerts_created_at DESC` for alert lookups
  and the "newest first" ordering.

---

## 7. Neon Setup

1. Create a free project at [neon.tech](https://neon.tech).
2. From the Neon dashboard, copy the **connection string** (it already
   includes `?sslmode=require`).
3. Paste it into `code/backend/.env` as `DATABASE_URL`.
4. Run `npm run db:init` from `code/backend` to create the tables.

Neon's serverless Postgres is a good fit here: it has a generous free
tier, scales to zero when idle (cheap for a take-home/demo project), and
requires no infrastructure management — you get a production-grade
Postgres instance with zero ops overhead.

---

## 8. Run Commands

| Command | Location | Effect |
|---|---|---|
| `npm run db:init` | `code/backend` | Applies `schema.sql` |
| `npm run seed` | `code/backend` | Loads `readings_seed.json`, generates alerts |
| `npm start` | `code/backend` | Starts Express API (production mode) |
| `npm run dev` | `code/backend` | Starts API with `--watch` (auto-restart) |
| `npm run dev` | `code/frontend` | Starts Vite dev server |
| `npm run build` | `code/frontend` | Builds production frontend bundle |

---

## 8.5. Deploying to Render

Render deploys from a GitHub repo, not a zip — push this project to GitHub
first, then connect it in the Render dashboard.

**Backend (Web Service):**

| Setting | Value |
|---|---|
| Root Directory | `code/backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Env vars | `DATABASE_URL`, `CORS_ORIGIN`, `ALERT_TEMP_THRESHOLD_C` |

Do **not** set `PORT` manually — Render injects its own `PORT` env var,
and `config.js` already falls back to it (`process.env.PORT || 5000`).

Run `npm run db:init` and `npm run seed` **locally** against the same
`DATABASE_URL` before deploying, rather than on Render itself — simpler,
and avoids re-running the seed script on every redeploy.

**Frontend (Static Site, not Web Service):**

| Setting | Value |
|---|---|
| Root Directory | `code/frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Env vars | `VITE_API_BASE_URL=https://<backend-service>.onrender.com/api` |

**After both are live:** set the backend's `CORS_ORIGIN` to the actual
deployed frontend URL and redeploy. `CORS_ORIGIN` accepts a
comma-separated list, so you can keep local dev working at the same time:
```
CORS_ORIGIN=http://localhost:5173,https://your-frontend.onrender.com
```

**Free tier note:** Render's free Web Services spin down after 15
minutes of inactivity and take 30-60 seconds to cold-start on the next
request. This only affects the backend (the frontend Static Site has no
cold start, since it's just served files). Worth knowing before a live
demo — the first request after idle time will be slow.

---

## 9. API Documentation

Base URL: `http://localhost:5000/api`

### `POST /api/readings`
Ingests one telemetry reading.

**Request body:**
```json
{
  "crane_id": "CR-101",
  "ts": "2026-06-08T15:00:00+00:00",
  "load_kg": 1435.5,
  "motor_temp_c": 64.5,
  "vibration_mm_s": 3.2,
  "status": "RUNNING"
}
```

**Response (201):**
```json
{ "success": true, "message": "Reading stored successfully" }
```

**Response (400) — validation failure:**
```json
{ "success": false, "message": "Validation failed", "errors": ["motor_temp_c is required and must be a number"] }
```

### `GET /api/readings/latest`
Returns the most recent reading for each crane.

```json
{
  "success": true,
  "data": [
    { "crane_id": "CR-101", "ts": "...", "load_kg": 4329.7, "motor_temp_c": 78.6, "vibration_mm_s": 1.1, "status": "IDLE" }
  ]
}
```

### `GET /api/readings/:craneId?start=&end=`
Returns readings for one crane, optionally bounded by an ISO timestamp
range. Both `start` and `end` are optional and combinable.

```
GET /api/readings/CR-101?start=2026-06-08T00:00:00Z&end=2026-06-08T12:00:00Z
```

### `GET /api/alerts?crane_id=`
Returns alerts, newest first. `crane_id` is an optional filter.

```json
{
  "success": true,
  "data": [
    { "id": 12, "crane_id": "CR-103", "motor_temp_c": 89.1, "message": "ALERT: CR-103 motor temp 89.1°C exceeds threshold", "reading_ts": "...", "created_at": "..." }
  ]
}
```

See `EVIDENCE.md` for real request/response examples captured against the
seeded data.

---

## 10. Design Decisions

**Architecture choice — simple 3-tier, no message queue.** React →
Express → Postgres is the entire stack. For a system ingesting one
reading every 5 minutes per crane (well under 1 req/sec at any
realistic fleet size), a queue or stream processor would be premature
complexity. The "Scaling Strategy" section below covers exactly when
that calculus changes.

**Database design — two flat tables, not normalized into a `cranes`
table.** I considered adding a `cranes` reference table (id, name,
install date, etc.) but rejected it (see §15, Rejected Approach) because
the assignment's data model treats `crane_id` as a plain string
identifier with no additional attributes to normalize — adding a join
for no behavioral benefit would only slow down the two hottest queries
(`latest reading per crane` and `readings in range`).

**Alerting approach — synchronous, inline, idempotent.** Every insert
path (live `POST /api/readings` *and* the offline `seed.js`) routes
through the same threshold check, so there is exactly one definition of
"abnormal." Duplicate alerts are prevented at the database level via a
unique index + `ON CONFLICT DO NOTHING`, rather than an application-level
"check then insert," which avoids a race condition if two requests for
the same reading land concurrently.

**Tradeoffs accepted:**
- **Polling over WebSockets.** A 5-second poll is simple, stateless, and
  trivially resilient to dropped connections — appropriate for telemetry
  that itself only updates every 5 minutes. A push-based system would add
  real complexity for no real-time benefit at this data rate. (See Future
  Improvements for when this would change.)
- **Hand-rolled validation over a schema library.** For six fields, an
  explicit function is exactly as correct and far easier to read in an
  interview than a Joi/Zod schema would be.
- **No authentication.** Out of scope per the assignment; flagged
  explicitly in Future Improvements rather than silently ignored.

---

## 11. Why `pg` Instead of an ORM

**Simplicity.** The whole data layer is two tables and four query
shapes (insert, latest-per-group, time-range, alert list). An ORM's
migration system, model classes, and query builder add a layer of
abstraction with no payoff at this scale — the raw SQL fits in a few
lines per query and *is* the documentation.

**Transparency.** With `pg`, the SQL that runs against Neon is exactly
the SQL written in the controller — no generated queries to reverse-
engineer when debugging a slow query or an unexpected `NULL`. This
matters especially for the `DISTINCT ON (crane_id) ... ORDER BY crane_id,
ts DESC` "latest reading per group" pattern, which most ORMs either
can't express directly or require a raw-query escape hatch for anyway —
so using `pg` from the start avoids fighting the abstraction.

**Small-project suitability.** ORMs earn their cost when a schema has
many interrelated models and the team benefits from migrations, model
validation, and relationship loading (`include`/`populate`). This project
has two unrelated tables and zero foreign keys between them — the
overhead of Prisma/Sequelize/TypeORM (schema files, generated client,
migration tooling) would outweigh the convenience.

---

## 12. Production Email Alerting

The current alerting system writes to the `alerts` table and logs to
stdout. In production, breaching the threshold should also notify a
human. Here's how that would work using a managed email API
(**SendGrid**, **AWS SES**, or **Resend** — any of the three fit the same
pattern):

**Trigger flow:**
1. `evaluateAndCreateAlert()` (already the single chokepoint for alert
   creation) publishes an `alert.created` event after the DB insert
   succeeds, rather than calling the email API inline. Decoupling email
   sending from the request/insert path means an email provider outage
   can never block telemetry ingestion.
2. A separate worker process consumes `alert.created` events and calls
   the email API (e.g. `sendgrid.send({ to: onCallList, subject:
   'Crane Alert', ... })`).
3. The email includes crane ID, temperature, timestamp, and a dashboard
   link — enough for someone to triage without opening the app first.

**Queue processing:**
- Events go into a lightweight queue (Redis + BullMQ, or AWS SQS) rather
  than firing the HTTP call directly from the alert-creation code path.
  This means a burst of simultaneous alerts (e.g. three cranes
  overheating at once during a heat wave) doesn't serialize behind
  synchronous email API calls and slow down the ingestion endpoint.

**Retry strategy:**
- Exponential backoff (e.g. 1s → 5s → 30s → 2min) for transient failures
  (5xx from the email provider, network timeouts).
- A maximum of ~5 attempts, after which the job moves to a dead-letter
  queue rather than retrying forever.
- Idempotency key per alert ID, so a retried job can't double-send the
  same email if the first attempt actually succeeded but the
  acknowledgment was lost.

**Failure handling:**
- Dead-lettered jobs are logged and surfaced on an internal ops
  dashboard (or a fallback Slack webhook) — the goal is that an email
  failure is *visible*, not silent.
- The `alerts` table itself remains the source of truth — even if every
  email attempt fails, the alert is never lost, since it's already
  persisted in Postgres before the email step ever runs.

---

## 13. Future Improvements

- **Authentication & authorization.** Currently fully open — would add
  JWT-based auth with at minimum an "operator" role (read-only dashboard
  access) and an "admin" role (can acknowledge/dismiss alerts).
- **WebSockets (or SSE).** If the sensor reporting interval ever dropped
  from 5 minutes to sub-second, polling would become wasteful and
  laggy; a push-based channel (Socket.IO or native SSE) would deliver
  new readings and alerts the instant they're ingested.
- **MQTT ingestion.** Real industrial sensors typically speak MQTT, not
  HTTP. A production version would run an MQTT broker (e.g. EMQX or AWS
  IoT Core) with a small bridge service that subscribes to crane topics
  and forwards parsed payloads into the same `POST /api/readings` logic
  — the validation and alerting layers wouldn't need to change at all.
- **Better monitoring.** Application metrics (request latency, DB pool
  saturation, alert volume over time) exported to Prometheus/Grafana,
  plus structured logging instead of `console.log`.
- **Configurable, per-crane thresholds.** Currently one global
  `ALERT_TEMP_THRESHOLD_C` — different crane models likely have
  different safe operating ranges.

---

## 14. Tools & Resources Used

**Documentation referenced:**
- [Neon Docs](https://neon.tech/docs) — connection strings, SSL settings
- [node-postgres (`pg`) Docs](https://node-postgres.com/) — Pool
  configuration, parameterized queries
- [Express.js Docs](https://expressjs.com/) — middleware ordering, error
  handling conventions
- [Recharts Docs](https://recharts.org/) — `ResponsiveContainer`,
  `ReferenceLine`, custom tooltip patterns
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — `darkMode: 'class'`
  strategy, custom theme extension

**AI tools used:**
- Claude (Anthropic) — used to scaffold the backend/frontend structure,
  write the SQL schema and queries, and generate this documentation.
  All generated code was reviewed, syntax-checked, and the build/lint
  pipeline was run locally before inclusion in this submission.

---

## 15. Rejected Approach

**Considered: a normalized `cranes` reference table.**

The initial instinct was to add a `cranes` table (`crane_id` PK, `name`,
`model`, `install_date`, ...) and have `readings`/`alerts` reference it
via foreign key, on the theory that "real" relational design normalizes
entities like this.

**Why it was rejected:** the assignment's actual data has no crane
metadata beyond the ID string itself — there's nothing to normalize. The
two queries that matter most (`latest reading per crane`, `readings in a
time range for one crane`) only ever filter and group by `crane_id` as a
plain value; a join to a `cranes` table would add a JOIN to both hot
paths for zero query benefit, plus a migration step to backfill crane
rows before any reading could be inserted (a referential-integrity
constraint that exists purely for shape, not for data correctness).

If a future requirement introduced real crane attributes (e.g. rated
load capacity, to compute "load as % of capacity"), a `cranes` table
would become the right call — until then, treating `crane_id` as a flat
string keeps the two hot queries fast and the schema honest about what
data actually exists.

---

## 16. Scaling Strategy

**Current:**
```
React → Express → PostgreSQL
```
Fine up to roughly hundreds of cranes reporting every few minutes — the
bottleneck would be nowhere near this stack at that volume.

**Phase 1 — Load Balancer + Multiple Express Instances.**
Once a single Express process can't keep up with concurrent HTTP
traffic (many dashboard clients polling, or many cranes posting
readings), run several stateless Express instances behind a load
balancer (e.g. Nginx, AWS ALB). Because the app holds no in-memory
session state, this is a horizontal scale with no code changes — the
`pg` Pool already manages its own connection limit per instance.
*Tradeoff:* more instances means more total DB connections; Neon's
connection limits (or PgBouncer in front of Postgres) become the next
constraint to watch.

**Phase 2 — Redis Caching.**
`GET /api/readings/latest` is read far more often than the underlying
data changes (every 5 min per crane, but polled every 5 sec by every
open dashboard tab). Caching that endpoint's response in Redis with a
short TTL (e.g. 2-3 seconds) turns a repeated DB hit into a cache hit
for the vast majority of requests. *Tradeoff:* introduces a small
staleness window and a new piece of infrastructure to operate — worth it
only once DB read load, not connection count, is the bottleneck.

**Phase 3 — Kafka or MQTT Telemetry Pipeline.**
Once ingestion volume grows (more cranes, more frequent reporting, or
ingestion from many sites at once), writing every reading directly to
Postgres via synchronous HTTP requests becomes the bottleneck. Cranes
would publish to an MQTT broker or Kafka topic; a consumer service
batches and writes to Postgres, decoupling ingestion rate from database
write throughput. *Tradeoff:* adds operational complexity (a broker to
run, monitor, and secure) and moves from "data is queryable the instant
it's posted" to "data is queryable after the consumer processes it" —
typically sub-second, but no longer synchronous.

**Phase 4 — TimescaleDB for Time-Series Optimization.**
`readings` is, structurally, a time-series table — it will keep growing
indefinitely and almost every query filters by a time range. TimescaleDB
(a Postgres extension) adds automatic time-based partitioning
("hypertables"), which keeps queries against recent data fast even as
historical data grows into the billions of rows, plus built-in
compression for old partitions. *Tradeoff:* requires either a managed
Timescale-compatible host or self-hosting the extension — Neon doesn't
currently offer it natively, so this phase may require a database
migration, not just a config change.

**Phase 5 — Microservices Architecture.**
At large enough scale, split the monolith into focused services:
an *ingestion service* (just validates + writes), an *alerting service*
(subscribes to new readings, owns threshold logic and notifications),
and a *query/dashboard API* (read-optimized, possibly backed by a
read replica or the Redis cache from Phase 2). *Tradeoff:* this is the
most expensive phase to adopt — distributed tracing, service-to-service
auth, and deployment orchestration are real ongoing costs. It only pays
for itself once a single team/codebase genuinely can't iterate fast
enough on one shared service, which for most telemetry systems is a
later problem than phases 1-4.

---

## Quick Reference: Status → Color Mapping

| Status | Color | Meaning |
|---|---|---|
| `ACTIVE` / `RUNNING` | Green | Crane operating normally |
| `IDLE` | Amber | Crane powered but not lifting |
| `FAULT` | Red | Crane in a fault state |

*(Note: the seeded dataset uses `IDLE`/`RUNNING`; `FAULT` is supported by
both the schema and the frontend's status-color logic for completeness,
even though it doesn't appear in the provided seed file.)*
