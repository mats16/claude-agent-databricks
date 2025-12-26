# Databricks Apps Troubleshooting Guide

## Common Issues and Solutions

### 1. Deployment Failed

**Symptoms**: `status.state` is `FAILED`

**Diagnosis**:
```bash
# Get deployment details
databricks apps get-deployment $SESSION_APP_NAME DEPLOYMENT_ID -o json

# Check deployment logs
databricks api get /api/2.0/apps/$SESSION_APP_NAME/deployments/DEPLOYMENT_ID/logs
```

**Common Causes**:
- **Invalid app.yaml**: Check syntax, required fields
- **Missing dependencies**: Ensure requirements.txt is complete
- **Code errors**: Check Python syntax, import errors
- **Resource limits**: App exceeds memory/CPU limits

### 2. App Not Starting (STOPPED or ERROR state)

**Diagnosis**:
```bash
databricks apps get $SESSION_APP_NAME -o json
```

**Check `compute_status.state` and `compute_status.message`**

**Solutions**:
```bash
# Restart the app
databricks apps stop $SESSION_APP_NAME --no-wait
databricks apps start $SESSION_APP_NAME
```

### 3. SQL Warehouse Access Denied

**Symptom**: App cannot query SQL warehouse, permission errors

**Diagnosis**:
```bash
# Get app's service principal
databricks apps get $SESSION_APP_NAME -o json
# Note the service_principal_name

# Check warehouse permissions
databricks warehouses get-permissions WAREHOUSE_ID -o json
```

**Solution**: Grant CAN_USE permission to app's service principal
```bash
databricks warehouses update-permissions WAREHOUSE_ID --json '{
  "access_control_list": [
    {
      "service_principal_name": "APP_SERVICE_PRINCIPAL_NAME",
      "permission_level": "CAN_USE"
    }
  ]
}'
```

### 4. Unity Catalog Access Denied

**Symptom**: App cannot access catalog/schema/table

**Solution**: Grant permissions via SQL
```sql
GRANT USE CATALOG ON CATALOG catalog_name TO `service_principal_name`;
GRANT USE SCHEMA ON SCHEMA catalog_name.schema_name TO `service_principal_name`;
GRANT SELECT ON TABLE catalog_name.schema_name.table_name TO `service_principal_name`;
```

### 5. App URL Not Accessible

**Diagnosis**:
```bash
databricks apps get $SESSION_APP_NAME -o json
```

**Check**:
- `compute_status.state` should be `ACTIVE`
- `url` field contains the app URL
- Deployment is `SUCCEEDED`

**Solution**: If app is stopped, start it:
```bash
databricks apps start $SESSION_APP_NAME
```

### 6. App Crashes on Startup

**Common Causes**:
- Port binding issues (app must bind to `APP_PORT` environment variable)
- Missing environment variables
- Import errors in code

**Check app.yaml**:
```yaml
command:
  - "python"
  - "app.py"
env:
  - name: CUSTOM_VAR
    value: "value"
```

**Important**: App must listen on port from `APP_PORT` env var (default: 8000)

### 7. Secrets Not Available

**Symptom**: Environment variables from secrets are empty

**Check app.yaml secret references**:
```yaml
env:
  - name: API_KEY
    valueFrom:
      secretRef:
        key: api_key
        scope: my-scope
```

**Verify**:
- Secret scope exists
- App's service principal has READ permission on scope
- Key name matches exactly

## Debugging Workflow

1. **Get current state**:
   ```bash
   databricks apps get $SESSION_APP_NAME -o json
   ```

2. **List recent deployments**:
   ```bash
   databricks apps list-deployments $SESSION_APP_NAME -o json
   ```

3. **Check latest deployment status**:
   ```bash
   databricks apps get-deployment $SESSION_APP_NAME DEPLOYMENT_ID -o json
   ```

4. **Get logs** (if available):
   ```bash
   databricks api get /api/2.0/apps/$SESSION_APP_NAME/logs
   ```

5. **Check permissions**:
   ```bash
   databricks apps get-permissions $SESSION_APP_NAME -o json
   ```

## app.yaml Reference

```yaml
# Required
command:
  - "python"
  - "main.py"

# Optional
env:
  - name: VAR_NAME
    value: "static_value"
  - name: SECRET_VAR
    valueFrom:
      secretRef:
        key: secret_key
        scope: secret_scope

resources:
  - name: sql_warehouse
    sql_warehouse:
      id: "warehouse_id"
      permission: "CAN_USE"
  - name: serving_endpoint
    serving_endpoint:
      name: "endpoint_name"
      permission: "CAN_QUERY"
```
