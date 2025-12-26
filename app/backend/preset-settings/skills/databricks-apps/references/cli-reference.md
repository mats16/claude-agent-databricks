# Databricks Apps CLI Reference

## App Management Commands

### Get App Info
```bash
databricks apps get APP_NAME -o json
```
Returns: app details including `service_principal_id`, `service_principal_name`, `active_deployment`, `compute_status`, `url`

### List All Apps
```bash
databricks apps list -o json
```

### Update App
```bash
databricks apps update APP_NAME --description "New description"
databricks apps update APP_NAME --json '{"description": "...", "resources": [...]}'
```

### Start/Stop App
```bash
databricks apps start APP_NAME
databricks apps stop APP_NAME
```

## Deployment Commands

### Deploy App
```bash
databricks apps deploy APP_NAME --source-code-path /Workspace/path/to/code
```
Options:
- `--mode AUTO_SYNC|SNAPSHOT`: AUTO_SYNC syncs changes automatically
- `--no-wait`: Don't wait for deployment to complete
- `--timeout 20m`: Max wait time (default 20m)

### List Deployments
```bash
databricks apps list-deployments APP_NAME -o json
```

### Get Deployment Details
```bash
databricks apps get-deployment APP_NAME DEPLOYMENT_ID -o json
```
Returns: deployment status, `status.state` (SUCCEEDED, FAILED, IN_PROGRESS), `status.message`

## Permission Commands

### Get App Permissions
```bash
databricks apps get-permissions APP_NAME -o json
```

### Set App Permissions
```bash
databricks apps set-permissions APP_NAME --json '{
  "access_control_list": [
    {
      "service_principal_name": "SP_NAME",
      "permission_level": "CAN_MANAGE"
    }
  ]
}'
```
Permission levels: `CAN_MANAGE`, `CAN_USE`

## SQL Warehouse Permission Commands

### Get Warehouse Permissions
```bash
databricks warehouses get-permissions WAREHOUSE_ID -o json
```

### Update Warehouse Permissions (Add)
```bash
databricks warehouses update-permissions WAREHOUSE_ID --json '{
  "access_control_list": [
    {
      "service_principal_name": "SP_NAME",
      "permission_level": "CAN_USE"
    }
  ]
}'
```
Permission levels: `CAN_MANAGE`, `CAN_MONITOR`, `CAN_USE`

### List Warehouses
```bash
databricks warehouses list -o json
```

## Service Principal Commands

### Get Service Principal
```bash
databricks service-principals get SP_ID -o json
```

### List Service Principals
```bash
databricks service-principals list -o json
```

## REST API for Logs

App logs are accessed via REST API:

### Get App Logs
```bash
databricks api get /api/2.0/apps/APP_NAME/logs
```

### Get Deployment Logs
```bash
databricks api get /api/2.0/apps/APP_NAME/deployments/DEPLOYMENT_ID/logs
```

## Common JSON Output Fields

### App Object
```json
{
  "name": "app-name",
  "description": "...",
  "service_principal_id": 123456,
  "service_principal_name": "app-name-sp",
  "compute_status": {
    "state": "ACTIVE|STOPPED|ERROR",
    "message": "..."
  },
  "active_deployment": {
    "deployment_id": "...",
    "source_code_path": "/Workspace/...",
    "status": {
      "state": "SUCCEEDED|FAILED|IN_PROGRESS",
      "message": "..."
    }
  },
  "url": "https://app-name.cloud.databricks.com"
}
```

### Deployment Status States
- `SUCCEEDED`: Deployment completed successfully
- `FAILED`: Deployment failed (check `status.message`)
- `IN_PROGRESS`: Deployment is running
- `CANCELLED`: Deployment was cancelled
