# Deployment

The minitools app runs on the AI server (`minitools.youlog.dev`, IP `129.213.97.254`) as a Docker container behind Caddy.

## Deploy

SSH into the server, pull the latest code, and rebuild:

```bash
ssh ubuntu@minitools.youlog.dev 'cd /home/ubuntu/apps/minitools && git pull && docker compose up -d --build'
```

## Verify

```bash
ssh ubuntu@minitools.youlog.dev 'docker ps --filter "name=minitools" --format "table {{.Names}}\t{{.Status}}"'
```

## Troubleshooting

```bash
# View logs
ssh ubuntu@minitools.youlog.dev 'docker logs --tail=50 minitools-app-1'

# Restart without rebuilding
ssh ubuntu@minitools.youlog.dev 'cd /home/ubuntu/apps/minitools && docker compose restart'
```

## Analytics

`analytics/` is a small Go + SQLite collector (page views and DOCX/PDF export counts). It is not exposed publicly: the beacon goes through nginx at `/api/e` (same origin, so it works on every domain), and the dashboard is only bound to the server's localhost.

View the dashboard from your machine:

```bash
ssh -L 8081:localhost:8081 ubuntu@minitools.youlog.dev   # then open http://localhost:8081
```

Server config lives in `/home/ubuntu/apps/minitools/.env` (`STATS_PASSWORD`, `STATS_SECRET`, `STATS_TZ=Asia/Colombo`).

Data is in the `stats-data` docker volume. Back up: `docker run --rm -v minitools_stats-data:/d -v $PWD:/b alpine cp /d/stats.db /b/`.
