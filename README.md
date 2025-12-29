
# SMART Charge - Industrial OCPP Central System

A robust EV charging management system (CMS) using **InfluxDB 3.0 (IOx)** and **Grafana** for professional monitoring.

## Features
- **OCPP 1.6J Engine**: Industrial-grade WebSocket handling for thousands of charging points.
- **InfluxDB 3.0 Persistence**: Optimized IOx engine for high-frequency telemetry storage.
- **Grafana-Based Dashboard**: Native integration with Grafana for world-class real-time visualizations.
- **AI Analytics**: Predictive maintenance and network diagnostics powered by Gemini 3 Pro.
- **RFID & Billing**: Full user lifecycle management with Colombian local payment integrations.

## Tech Stack
- **Database**: InfluxDB 3.0 (TSDB).
- **Visualization**: Grafana OSS.
- **Backend**: Node.js / Express / WS.
- **Frontend**: React 19 / Tailwind CSS.
- **AI**: Google Gemini API.

## Quick Installation
1. Install InfluxDB 3.0 and create a bucket.
2. Install Grafana and enable `allow_embedding`.
3. Configure `.env` with your InfluxDB token and organization.
4. Run `npm install` and `npm run build`.
5. Point Grafana to your InfluxDB 3.0 as a Data Source.

## License
MIT
