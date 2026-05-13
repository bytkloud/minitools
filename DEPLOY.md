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
