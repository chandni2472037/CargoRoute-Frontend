# CargoRoute IQ Frontend

This React app stays separate from the KPI/report microservice and consumes it over HTTP.

## KPI Report Service Integration

- Default KPI/report base URL: `http://localhost:2003`
- Override it with `REACT_APP_REPORTING_API_URL`
- Supported endpoints used by the UI:
	- `GET /kpis`
	- `POST /kpis`
	- `DELETE /kpis/:id`
	- `GET /reports`
	- `POST /reports`
	- `DELETE /reports/:id`

## Available Screens

- `/dashboard` → operations dashboard backed by the KPI microservice
- `/kpis` → create/list/delete KPIs
- `/reports` → create/list/delete operational reports

## Commands

- `npm start` → run the frontend on port 3000
- `npm test` → run tests
- `npm run build` → build production assets
