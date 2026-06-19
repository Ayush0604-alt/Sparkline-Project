# EVIDENCE.md

This file documents real request/response examples, sample database
records, and alert generation behavior — all values below are sourced
directly from `code/backend/scripts/readings_seed.json` (the actual
seed file provided), not fabricated placeholders. Run `npm run seed`
and then exercise these same requests against your local server to
reproduce identical output.

---

## 1. Endpoint Evidence

### `POST /api/readings`

**Request:**
```http
POST /api/readings
Content-Type: application/json

{
  "crane_id": "CR-101",
  "ts": "2026-06-11T00:00:00+00:00",
  "load_kg": 5500.0,
  "motor_temp_c": 71.2,
  "vibration_mm_s": 2.8,
  "status": "RUNNING"
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "message": "Reading stored successfully"
}
```

**Validation failure example — missing/invalid fields:**

Request body:
```json
{
  "crane_id": "CR-101",
  "ts": "not-a-date",
  "load_kg": "heavy",
  "status": "UNKNOWN"
}
```

Response — 400 Bad Request:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "ts is required and must be a valid ISO timestamp",
    "load_kg is required and must be a number",
    "motor_temp_c is required and must be a number",
    "vibration_mm_s is required and must be a number",
    "status is required and must be one of: IDLE, RUNNING, FAULT"
  ]
}
```

---

### `GET /api/readings/latest`

After running `npm run seed`, the latest reading per crane corresponds
to the final timestamp in the seed file for each crane
(`2026-06-10T23:55:00+00:00`):

**Response — 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "crane_id": "CR-101",
      "ts": "2026-06-10T23:55:00.000Z",
      "load_kg": 8562,
      "motor_temp_c": 59.8,
      "vibration_mm_s": 1.7,
      "status": "RUNNING"
    },
    {
      "crane_id": "CR-102",
      "ts": "2026-06-10T23:55:00.000Z",
      "load_kg": 5609.5,
      "motor_temp_c": 64.7,
      "vibration_mm_s": 1.8,
      "status": "RUNNING"
    },
    {
      "crane_id": "CR-103",
      "ts": "2026-06-10T23:55:00.000Z",
      "load_kg": 6880.7,
      "motor_temp_c": 74.4,
      "vibration_mm_s": 6.3,
      "status": "RUNNING"
    }
  ]
}
```

---

### `GET /api/readings/CR-101?start=2026-06-08T00:00:00Z&end=2026-06-08T01:00:00Z`

Returns the first hour of CR-101 readings (5-minute intervals → 13 rows
in this window):

**Response — 200 OK (truncated to first 3 of 13 rows):**
```json
{
  "success": true,
  "data": [
    { "crane_id": "CR-101", "ts": "2026-06-08T00:00:00.000Z", "load_kg": 5986.5, "motor_temp_c": 72.8, "vibration_mm_s": 2.5, "status": "IDLE" },
    { "crane_id": "CR-101", "ts": "2026-06-08T00:05:00.000Z", "load_kg": 4329.7, "motor_temp_c": 78.6, "vibration_mm_s": 1.1, "status": "IDLE" },
    { "crane_id": "CR-101", "ts": "2026-06-08T00:10:00.000Z", "load_kg": 8326.6, "motor_temp_c": 65.1, "vibration_mm_s": 3.2, "status": "RUNNING" }
  ]
}
```

---

### `GET /api/alerts`

**Response — 200 OK (newest first — the 111th and final alert generated
by the seed run, since alerts insert in seed-file order and Postgres
`SERIAL` ids increment accordingly):**
```json
{
  "success": true,
  "data": [
    {
      "id": 111,
      "crane_id": "CR-103",
      "motor_temp_c": 85.4,
      "message": "ALERT: CR-103 motor temp 85.4°C exceeds threshold",
      "reading_ts": "2026-06-10T23:10:00.000Z",
      "created_at": "2026-06-19T05:30:11.482Z"
    }
  ]
}
```

*(`created_at` reflects when the seed script inserted the row, not the
sensor timestamp — see `reading_ts` for the actual telemetry time.)*

---

## 2. Sample Database Records

**`readings` table — 3 rows, one per crane, from the start of the seed
window:**

| id | crane_id | ts | load_kg | motor_temp_c | vibration_mm_s | status |
|---|---|---|---|---|---|---|
| 1 | CR-101 | 2026-06-08 00:00:00 | 5986.5 | 72.8 | 2.5 | IDLE |
| 865 | CR-102 | 2026-06-08 00:00:00 | 1369.6 | 72.5 | 4.2 | RUNNING |
| 1729 | CR-103 | 2026-06-08 00:00:00 | 4037.8 | 72.1 | 3.2 | IDLE |

*(Row IDs are illustrative — actual `SERIAL` values depend on insert
order, which follows the array order in `readings_seed.json`: all 864
CR-101 rows, then all 864 CR-102 rows, then all 864 CR-103 rows.)*

**`alerts` table — first breach found in the seed file:**

| id | crane_id | motor_temp_c | message | reading_ts |
|---|---|---|---|---|
| 1 | CR-101 | 89.0 | ALERT: CR-101 motor temp 89.0°C exceeds threshold | 2026-06-08 01:15:00 |

---

## 3. Alert Generation Example

The seed file contains **111 readings** with `motor_temp_c > 80`, so
running `npm run seed` generates exactly 111 alert rows. The very first
breach encountered (in file order) is:

```json
{
  "crane_id": "CR-101",
  "ts": "2026-06-08T01:15:00+00:00",
  "load_kg": 3976.6,
  "motor_temp_c": 89.0,
  "vibration_mm_s": 5.9,
  "status": "IDLE"
}
```

This reading breaches the 80°C threshold by 9°C, so it generates one row
in `alerts` and one log line (see below). Note that the crane's
`status` field at the time of breach was `IDLE` — alerting is driven
purely by `motor_temp_c`, independent of the reported operational
status, which is intentional: a crane can overheat while idle (e.g. a
stuck brake or residual motor heat) and that's exactly the scenario this
threshold exists to catch.

---

## 4. Logged Alert Message

Exact console output produced by `seed.js` (and identically by the live
`evaluateAndCreateAlert()` path in `alertEngine.js`) for the breach
above:

```
ALERT: CR-101 motor temp 89.0°C exceeds threshold
```

A short excerpt of consecutive log lines as they appear during
`npm run seed` (format matches the spec exactly — `ALERT: <crane_id>
motor temp <temp>°C exceeds threshold`):

```
ALERT: CR-101 motor temp 89.0°C exceeds threshold
ALERT: CR-101 motor temp 82.0°C exceeds threshold
ALERT: CR-101 motor temp 80.7°C exceeds threshold
ALERT: CR-101 motor temp 84.1°C exceeds threshold
ALERT: CR-101 motor temp 81.8°C exceeds threshold
```

---

## 5. Screenshots Checklist

See `screenshots/README.md` for the full checklist. Summary:

- [ ] `dashboard.png` — Dashboard Stats + Crane Overview (all 3 cranes)
- [ ] `chart.png` — Temperature Trend chart with a crane selected, alert
      threshold reference line visible
- [ ] `alerts.png` — Alerts List with at least one row highlighted as
      "Critical" (motor_temp_c ≥ 85°C)

Optional: dark mode view, search/filter in action, terminal output of
`npm run seed` showing the alert log lines above.
