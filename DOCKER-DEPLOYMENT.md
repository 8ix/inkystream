# Docker Deployment Guide

This guide covers deploying InkyStream using Docker Compose with Portainer or standalone.

## Quick Start - Docker Compose

### Basic Setup (HTTP Only)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/8ix/inkystream.git
   cd inkystream
   ```

2. **Create environment file:**
   ```bash
   cp .env.docker .env
   ```

3. **Edit `.env` file** (optional):
   ```env
   PORT=3000
   INKYSTREAM_API_KEY=  # Leave empty for local network, set for security
   ```

4. **Comment out Traefik labels** in `docker-compose.yaml`:
   - If you're not using Traefik, comment out or remove the entire `labels:` section

5. **Start the container:**
   ```bash
   docker-compose up -d
   ```

6. **Access InkyStream:**
   - Open your browser to `http://your-server-ip:3000`

### With Traefik (HTTPS/SSL)

If you're using Traefik for SSL termination:

1. **Configure `.env` file:**
   ```env
   PORT=3000
   INKYSTREAM_API_KEY=your-secure-api-key-here
   DOMAIN=inkystream.yourdomain.com
   CERT_RESOLVER=letsencrypt
   ```

2. **Update `docker-compose.yaml`:**
   - Uncomment the `networks:` section at the bottom
   - Change `traefik_network` to match your Traefik network name

3. **Ensure Traefik is running** and configured with:
   - An `entrypoint` named `web` (port 80)
   - An `entrypoint` named `websecure` (port 443)
   - A certificate resolver matching your `CERT_RESOLVER` value

4. **Start the container:**
   ```bash
   docker-compose up -d
   ```

5. **Access InkyStream:**
   - Open your browser to `https://inkystream.yourdomain.com`

## Portainer Deployment

### Method 1: Using Portainer Stacks (Recommended)

1. **In Portainer, navigate to:**
   - Stacks → Add stack

2. **Choose "Repository" as the build method**

3. **Configure Git repository:**
   - **Repository URL:** Your Git repository URL
   - **Repository reference:** `main` (or your branch)
   - **Compose path:** `docker-compose.yaml`

4. **Authentication (if private repo):**
   - Enable authentication
   - Add your Git credentials or deploy key

5. **Environment variables:**
   Add these in the "Environment variables" section:
   ```
   PORT=3000
   INKYSTREAM_API_KEY=your-api-key-here
   DOMAIN=inkystream.yourdomain.com
   CERT_RESOLVER=letsencrypt
   ```

6. **Deploy the stack**

### Method 2: Using Portainer with Custom Stack

1. **Copy the `docker-compose.yaml` content**

2. **In Portainer:**
   - Stacks → Add stack → Web editor

3. **Paste the docker-compose.yaml content**

4. **Add environment variables** as shown above

5. **Deploy the stack**

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Host port to expose InkyStream on |
| `INKYSTREAM_API_KEY` | _(empty)_ | API key for authentication. Leave empty for local network, set for public access |
| `DOMAIN` | `inkystream.local` | Domain name (only needed with Traefik) |
| `CERT_RESOLVER` | `letsencrypt` | Traefik certificate resolver name (only needed with Traefik) |

### Volume Mounts

The compose file creates two persistent volumes:

- `./images:/app/images` - Stores processed images
- `./config:/app/config` - Stores device and category configuration

These directories will be created automatically on first run.

## Different Reverse Proxy Configurations

### Nginx Proxy Manager

If using Nginx Proxy Manager instead of Traefik:

1. **Comment out all Traefik labels** in `docker-compose.yaml`

2. **Keep the ports section:**
   ```yaml
   ports:
     - "3000:3000"
   ```

3. **In Nginx Proxy Manager:**
   - Create a new proxy host
   - Set domain name (e.g., `inkystream.yourdomain.com`)
   - Forward to `inkystream:3000` (or `your-server-ip:3000`)
   - Enable SSL if desired

### Caddy

If using Caddy:

1. **Comment out all Traefik labels** in `docker-compose.yaml`

2. **Add to your Caddyfile:**
   ```
   inkystream.yourdomain.com {
       reverse_proxy inkystream:3000
   }
   ```

### Other Reverse Proxies

For any other reverse proxy:

1. Remove or comment out the Traefik labels
2. Keep the ports section to expose port 3000
3. Configure your reverse proxy to forward to `http://your-server-ip:3000`

## Updating InkyStream

### With Portainer (Git Repository)

1. In Portainer, go to your stack
2. Click "Pull and redeploy"
3. Portainer will pull the latest changes and rebuild

### Manual Update

```bash
cd inkystream
docker-compose down
git pull
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs -f inkystream
```

Or in Portainer:
- Go to Containers
- Click on `inkystream`
- View logs

### Port already in use

Change the `PORT` in your `.env` file:
```env
PORT=3001
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Images not persisting

Ensure the volume mounts are correct:
```bash
# Check that these directories exist
ls -la images/
ls -la config/
```

### Traefik not routing correctly

1. Check that InkyStream is on the same network as Traefik
2. Verify the network name in `docker-compose.yaml` matches your Traefik network
3. Check Traefik logs for any errors
4. Ensure your DNS points to the correct server

### Permission issues with volumes

If you get permission errors:
```bash
# Fix ownership of volumes
sudo chown -R 1000:1000 images/
sudo chown -R 1000:1000 config/
```

## Security Recommendations

### For Local Network Use (Default)

- Keep `INKYSTREAM_API_KEY` empty or use a simple key
- Ensure your network is trusted
- Don't expose port 3000 to the internet

### For Public Internet Access

1. **Always set a strong API key:**
   ```bash
   # Generate a secure random key
   openssl rand -base64 32
   ```

2. **Use HTTPS only:**
   - Configure Traefik, Nginx, or Caddy with SSL certificates
   - Don't expose port 3000 directly to the internet

3. **Use firewall rules:**
   - Only allow necessary ports (80, 443)
   - Block direct access to port 3000 from outside

4. **Keep software updated:**
   - Regularly pull updates from the repository
   - Monitor security advisories

## Performance Tuning

### For Raspberry Pi

The default configuration works well on Raspberry Pi. If you experience performance issues:

1. **Reduce concurrent uploads** in the admin interface
2. **Use smaller source images** (< 5MB recommended)
3. **Ensure adequate cooling** for sustained processing

### For Higher Performance Servers

You can increase Next.js performance by adjusting environment variables:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - INKYSTREAM_API_KEY=${INKYSTREAM_API_KEY}
  - UV_THREADPOOL_SIZE=8  # Increase for more concurrent image processing
```

## Support

- [Main Documentation](README.md)
- [GitHub Issues](https://github.com/8ix/inkystream/issues)
- [Development Guide](docs/setup/local-development.md)
