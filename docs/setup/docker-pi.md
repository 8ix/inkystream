# Docker Setup on Raspberry Pi

This guide shows how to run InkyStream locally on a Raspberry Pi using Docker. The app is designed for local-network use to keep your photos private.

**Note:** The Docker image uses `node:20-alpine` as the base to avoid CVE-2023-45853 (zlib vulnerability). Alpine Linux provides a more secure foundation while maintaining full ARM compatibility for Raspberry Pi.

## Prerequisites
- Raspberry Pi (arm64/armv7) with Docker installed
- Git

## Build and Run

```bash
# Clone the repo
git clone https://github.com/8ix/inkystream.git
cd inkystream

# Build the image (defaults to PORT=3000)
docker build -t inkystream:latest .

# Run on port 3000 (change PORT as needed)
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -v $(pwd)/images:/app/images \
  -v $(pwd)/config/displays.json:/app/config/displays.json \
  --name inkystream \
  inkystream:latest

# Access the admin UI via your Pi's LAN IP, e.g.:
# http://raspberrypi.local:3000
```

### Port configuration
- Default: `PORT=3000`
- Change by setting `-e PORT=8080` and mapping `-p 8080:8080`

### Volumes
- `images/` — persisted on host so your processed images survive container rebuilds
- `config/displays.json` — optional: mount to customize display profiles

## docker-compose (optional)

```yaml
version: "3.9"
services:
  inkystream:
    build: .
    container_name: inkystream
    environment:
      - PORT=3000
    ports:
      - "3000:3000"
    volumes:
      - ./images:/app/images
      - ./config/displays.json:/app/config/displays.json
    restart: unless-stopped
```

Run with:
```bash
docker compose up -d
```

## Security Notes (local-first)
- Designed for trusted LAN; API key is optional on a private network.
- If you expose beyond LAN: set `INKYSTREAM_API_KEY`, use HTTPS, and lock down network access.
- Images stay on your Pi in `images/`; only the API serves them.

