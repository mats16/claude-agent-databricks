---
name: databricks-apps
description: Databricks Apps deployment, debugging, and configuration management. Use when working with Databricks Apps issues including deployment failures, app configuration (app.yaml), checking logs, granting permissions to SQL warehouses or Unity Catalog resources, troubleshooting app errors, or managing app state (start/stop). Triggered by mentions of SESSION_APP_NAME, app.yaml, deployment errors, or permission issues with Apps.
version: 0.0.1
---

# Databricks Apps

Manage Databricks Apps deployment, debugging, and configuration using the Databricks CLI.

## Environment

The target app name is available in `SESSION_APP_NAME` environment variable.

```bash
echo $SESSION_APP_NAME
```

### Auto Deploy

When `APP_AUTO_DEPLOY=true`, the app is automatically deployed to `SESSION_APP_NAME` via hooks when the Claude Code session stops. Manual deployment is not required in this case.

## Quick Diagnosis

Always start by checking current app state:

```bash
# Get app info (state, service principal, URL, active deployment)
databricks apps get $SESSION_APP_NAME -o json

# List recent deployments
databricks apps list-deployments $SESSION_APP_NAME -o json
```

Key fields to check:
- `compute_status.state`: ACTIVE, STOPPED, ERROR
- `active_deployment.status.state`: SUCCEEDED, FAILED, IN_PROGRESS
- `service_principal_name`: Needed for permission grants

## Common Tasks

### Check Deployment Status

```bash
# Get specific deployment details
databricks apps get-deployment $SESSION_APP_NAME DEPLOYMENT_ID -o json
```

If `status.state` is `FAILED`, check `status.message` for error details.

### Restart App

```bash
databricks apps stop $SESSION_APP_NAME --no-wait
databricks apps start $SESSION_APP_NAME
```

### Grant SQL Warehouse Access

1. Get app's service principal name:
```bash
databricks apps get $SESSION_APP_NAME -o json | jq -r '.service_principal_name'
```

2. Grant CAN_USE permission:
```bash
databricks warehouses update-permissions WAREHOUSE_ID --json '{
  "access_control_list": [
    {
      "service_principal_name": "SERVICE_PRINCIPAL_NAME",
      "permission_level": "CAN_USE"
    }
  ]
}'
```

### Grant Unity Catalog Access

Use SQL to grant permissions to the app's service principal:

```sql
GRANT USE CATALOG ON CATALOG catalog_name TO `service_principal_name`;
GRANT USE SCHEMA ON SCHEMA catalog_name.schema_name TO `service_principal_name`;
GRANT SELECT ON TABLE catalog_name.schema_name.table_name TO `service_principal_name`;
```

## Troubleshooting Decision Tree

1. **Deployment failed?**
   - Check deployment status message
   - Verify app.yaml syntax
   - Check requirements.txt completeness
   - See [troubleshooting.md](references/troubleshooting.md)

2. **App not accessible?**
   - Check `compute_status.state` is ACTIVE
   - Verify deployment succeeded
   - Try restarting the app

3. **Permission errors?**
   - Identify the resource (SQL warehouse, catalog, table)
   - Get app's service principal name
   - Grant appropriate permissions

4. **App crashes on startup?**
   - Verify app binds to `APP_PORT` env var
   - Check for import errors in code
   - Review app.yaml command configuration

## References

- [CLI Reference](references/cli-reference.md): Complete CLI command reference
- [Troubleshooting Guide](references/troubleshooting.md): Detailed issue resolution
