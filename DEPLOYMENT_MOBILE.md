# Mobile Access Guide (Android / iOS)

This guide explains how to access **appcoran.com** from your phone on the same Wi‑Fi network.

## 1) Requirements
- Phone and PC are on the **same Wi‑Fi**.
- Docker stack is running:

```bash
docker compose up --build
```

## 2) Recommended: Router DNS (Best Option)
This keeps the domain **appcoran.com** and **api.appcoran.com**.

1. Find your PC IP (example `192.168.1.25`).
2. Open your router admin interface.
3. Add local DNS entries:
   - `appcoran.com` → `192.168.1.25`
   - `api.appcoran.com` → `192.168.1.25`
4. On your phone, keep DNS on **Automatic**.
5. Open in phone browser:
   - `http://appcoran.com`

## 3) If Router DNS Is Not Available (dnsmasq)
You can run a local DNS server on the PC and set it on the phone.

1. Create a file `dnsmasq.conf` (same folder as this guide):

```conf
address=/appcoran.com/192.168.1.25
address=/api.appcoran.com/192.168.1.25
```

2. Run dnsmasq in Docker:

```bash
docker run -d --name appcoran-dns \
  -p 53:53/udp \
  -v "$PWD/dnsmasq.conf":/etc/dnsmasq.conf \
  --restart unless-stopped \
  andyshinn/dnsmasq:2.85
```

3. Set your phone DNS to your PC IP (manual DNS).
4. Open: `http://appcoran.com`

## 4) Notes
- Keep Docker running.
- If the phone can’t resolve the domain, check DNS settings or router cache.
