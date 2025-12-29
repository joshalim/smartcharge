
# SMART Charge - OCPP Central System

A high-performance EV charging management system (CMS) built for production Ubuntu environments.

## Features
- **OCPP 1.6J Support**: Full WebSocket communication with hardware.
- **Real-time Monitoring**: Live telemetry and event streaming.
- **RFID Management**: Expiration dates and credit top-ups.
- **AI Diagnostics**: Predictive maintenance via Google Gemini.
- **Local Storage**: Secure MongoDB instance on your own server.

## Installation (Ubuntu 22.04/24.04)

### Automated Install
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Steps
1. **Database**: Install MongoDB 7.0 Community Edition.
2. **Runtime**: Install Node.js 20.x (LTS).
3. **App**:
   - Clone the repository.
   - Run `npm install`.
   - Create a `.env` file with `MONGO_URI` and `VITE_API_KEY`.
4. **Build**: Run `npm run build` to generate the production frontend.
5. **Persistence**: Use `pm2` to manage the `server.js` process.
6. **Network**: Configure Nginx as a reverse proxy for ports 3000 (HTTP) and 9000 (OCPP WebSocket).

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Vite.
- **Backend**: Node.js + Express + WebSocket (ws).
- **Database**: MongoDB (Mongoose).
- **AI**: Gemini 2.5/3 Pro for diagnostic reasoning.

## License
MIT
