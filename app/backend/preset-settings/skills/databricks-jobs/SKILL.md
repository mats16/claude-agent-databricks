---
name: databricks-jobs
description: |
  Databricks job status monitoring, run history investigation, and debugging skill using SQL (System Tables).
  Note: This environment uses Databricks Apps user delegation tokens which have limited scope and cannot access Jobs API/CLI.
  Trigger examples: list jobs, job status, run history, failure cause, debug job, task error.
version: 0.0.2
---

# Databricks Jobs Skill

## Overview

Skill for Databricks job status monitoring and debugging using **SQL (System Tables)** only.

> **Important**: This environment runs on Databricks Apps with user delegation tokens. These tokens have limited scope and **cannot access the Jobs API (CLI)**. All job investigation must be done via System Tables SQL queries.

## Extracting IDs from URLs

Databricks Jobs URL formats:
```
https://<databricks_host>/jobs/<job_id>
https://<databricks_host>/jobs/<job_id>/runs/<run_id>
```

**Example**: `https://e2-demo-tokyo.cloud.databricks.com/jobs/987402714328091/runs/304618225028273`
- `job_id`: 987402714328091 (job definition)
- `run_id`: 304618225028273 (execution instance)

## System Tables Reference

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `system.lakeflow.jobs` | Job definitions | `job_id`, `name`, `creator_user_name`, `run_as_user_name` |
| `system.lakeflow.job_run_timeline` | Run history | `job_id`, `run_id`, `result_state`, `termination_code`, `period_start_time` |
| `system.lakeflow.job_task_run_timeline` | Task run details | `run_id`, `task_key`, `result_state`, `termination_code` |

> **Note**: System Tables data may be delayed by several hours. For real-time status, users should check the Databricks UI directly.

## Investigation Flow (Failed Jobs)

### Step 1: Get Run Status

```sql
-- Check run status by run_id
SELECT
  j.name AS job_name,
  r.job_id,
  r.run_id,
  r.result_state,
  r.termination_code,
  r.period_start_time,
  r.period_end_time,
  TIMESTAMPDIFF(MINUTE, r.period_start_time, r.period_end_time) AS duration_minutes
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j ON r.job_id = j.job_id
WHERE r.run_id = <run_id>
ORDER BY r.period_start_time DESC
LIMIT 1;
```

### Step 2: Identify Failed Tasks

```sql
-- Find failed tasks in a run
SELECT
  task_key,
  result_state,
  termination_code,
  period_start_time,
  period_end_time,
  compute_ids
FROM system.lakeflow.job_task_run_timeline
WHERE run_id = <run_id>
  AND result_state = 'FAILED'
ORDER BY period_start_time;
```

### Step 3: Get Task Details

```sql
-- All tasks in a run with their status
SELECT
  task_key,
  result_state,
  termination_code,
  period_start_time,
  period_end_time,
  TIMESTAMPDIFF(MINUTE, period_start_time, period_end_time) AS duration_minutes
FROM system.lakeflow.job_task_run_timeline
WHERE run_id = <run_id>
ORDER BY period_start_time;
```

### Step 4: Check Job Definition

```sql
-- Get job definition
SELECT
  job_id,
  name,
  description,
  creator_user_name,
  run_as_user_name,
  create_time,
  delete_time
FROM system.lakeflow.jobs
WHERE job_id = <job_id>;
```

### Step 5: Check Recent Run History

```sql
-- Recent runs for the same job
SELECT
  run_id,
  result_state,
  termination_code,
  period_start_time,
  period_end_time,
  TIMESTAMPDIFF(MINUTE, period_start_time, period_end_time) AS duration_minutes
FROM system.lakeflow.job_run_timeline
WHERE job_id = <job_id>
ORDER BY period_start_time DESC
LIMIT 20;
```

## Common Queries

### List Jobs

```sql
-- List all active jobs
SELECT
  job_id,
  name,
  description,
  creator_user_name,
  run_as_user_name,
  create_time
FROM system.lakeflow.jobs
WHERE delete_time IS NULL
ORDER BY create_time DESC
LIMIT 100;

-- Search jobs by name
SELECT
  job_id,
  name,
  description,
  creator_user_name
FROM system.lakeflow.jobs
WHERE delete_time IS NULL
  AND LOWER(name) LIKE LOWER('%keyword%')
ORDER BY name;
```

### Investigate Failed Runs

```sql
-- Failed runs in the last 24 hours
SELECT
  j.name AS job_name,
  r.job_id,
  r.run_id,
  r.result_state,
  r.termination_code,
  r.period_start_time
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j ON r.job_id = j.job_id
WHERE r.result_state IN ('FAILED', 'TIMED_OUT', 'CANCELED')
  AND r.period_start_time >= CURRENT_DATE - INTERVAL 1 DAY
ORDER BY r.period_start_time DESC;
```

### Failure Pattern Analysis

```sql
-- Failure count by job (last 7 days)
SELECT
  j.name AS job_name,
  r.job_id,
  COUNT(DISTINCT r.run_id) AS failure_count,
  MAX(r.period_start_time) AS last_failure
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j ON r.job_id = j.job_id
WHERE r.result_state = 'FAILED'
  AND r.period_start_time >= CURRENT_DATE - INTERVAL 7 DAY
GROUP BY j.name, r.job_id
ORDER BY failure_count DESC;

-- Frequently failing tasks for a specific job
SELECT
  task_key,
  COUNT(*) AS failure_count,
  MAX(period_start_time) AS last_failure
FROM system.lakeflow.job_task_run_timeline
WHERE job_id = <job_id>
  AND result_state = 'FAILED'
  AND period_start_time >= CURRENT_DATE - INTERVAL 30 DAY
GROUP BY task_key
ORDER BY failure_count DESC;
```

### Duration Analysis

```sql
-- Average run duration by job (last 7 days, successful only)
SELECT
  j.name AS job_name,
  COUNT(DISTINCT r.run_id) AS run_count,
  AVG(TIMESTAMPDIFF(MINUTE, r.period_start_time, r.period_end_time)) AS avg_minutes,
  MAX(TIMESTAMPDIFF(MINUTE, r.period_start_time, r.period_end_time)) AS max_minutes,
  MIN(TIMESTAMPDIFF(MINUTE, r.period_start_time, r.period_end_time)) AS min_minutes
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j ON r.job_id = j.job_id
WHERE r.result_state = 'SUCCESS'
  AND r.period_start_time >= CURRENT_DATE - INTERVAL 7 DAY
GROUP BY j.name
ORDER BY avg_minutes DESC;
```

### Task Dependencies and Flow

```sql
-- Task execution order in a run
SELECT
  task_key,
  result_state,
  period_start_time,
  period_end_time,
  TIMESTAMPDIFF(SECOND, period_start_time, period_end_time) AS duration_seconds
FROM system.lakeflow.job_task_run_timeline
WHERE run_id = <run_id>
ORDER BY period_start_time;
```

## result_state Reference

| State | Description |
|-------|-------------|
| `SUCCESS` | Completed successfully |
| `FAILED` | Failed |
| `TIMED_OUT` | Timed out |
| `CANCELED` | Canceled by user or system |
| `RUNNING` | Currently running |
| `PENDING` | Waiting to run |
| `SKIPPED` | Skipped (e.g., dependent task failed) |

## termination_code Reference

| Code | Description |
|------|-------------|
| `SUCCESS` | Completed successfully |
| `USER_CANCELED` | Canceled by user |
| `INTERNAL_ERROR` | Internal error |
| `RUN_EXECUTION_ERROR` | Execution error in the run |
| `DRIVER_ERROR` | Driver error |
| `CLOUD_FAILURE` | Cloud provider failure |
| `LIBRARY_INSTALLATION_ERROR` | Library installation failed |
| `INIT_SCRIPT_FAILURE` | Init script failed |

## Limitations

Due to Databricks Apps user delegation token scope limitations:

- ❌ **Cannot use**: `databricks jobs` CLI commands
- ❌ **Cannot use**: Jobs REST API
- ❌ **Cannot do**: Run jobs, cancel runs, repair runs (use Databricks UI instead)
- ✅ **Can use**: SQL queries on System Tables

For operations that require Jobs API access (run-now, cancel, repair), direct the user to use the Databricks UI or a different environment with appropriate permissions.

## Tips

- System Tables data may be delayed by several hours
- Long-running jobs are split into multiple rows in `job_run_timeline` (hourly granularity)
- Use `DISTINCT run_id` when counting runs to avoid overcounting
- Join with `system.lakeflow.jobs` to get job names and metadata
- For real-time status, ask users to check the Databricks UI
