#!/usr/bin/env bash
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root: sudo $0"
  exit 1
fi

PC_IP="${1:-}"
if [[ -z "${PC_IP}" ]]; then
  echo "Usage: sudo $0 <PC_IP>"
  echo "Example: sudo $0 192.168.1.50"
  exit 1
fi

echo "[1/4] Installing caddy + dnsmasq..."
apt-get update -y
apt-get install -y caddy dnsmasq

echo "[2/4] Writing dnsmasq config..."
cat >/etc/dnsmasq.d/appcoran.conf <<EOF
address=/appcoran.com/${PC_IP}
address=/api.appcoran.com/${PC_IP}
EOF

echo "[3/4] Restarting dnsmasq..."
systemctl restart dnsmasq

echo "[4/4] Done."
echo "Start Caddy with:"
echo "  caddy run --config /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/Caddyfile.local"
echo "On your phone, set DNS to ${PC_IP} and open http://appcoran.com"
