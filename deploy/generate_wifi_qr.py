#!/usr/bin/env python3
import argparse
import sys


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Wi-Fi QR code (SSID + password + DNS hint)."
    )
    parser.add_argument("--ssid", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--dns", required=True)
    parser.add_argument("--output", default="wifi-setup.png")
    args = parser.parse_args()

    try:
        import segno  # type: ignore
    except Exception:
        print("Missing dependency: segno")
        print("Install with: python3 -m pip install segno")
        return 1

    # Standard Wi-Fi QR format (DNS is not officially encoded, so we include it in the label).
    # Users still must set DNS manually in Wi-Fi settings.
    label = f"DNS: {args.dns}"
    wifi_payload = f"WIFI:T:WPA;S:{args.ssid};P:{args.password};H:false;{label};;"

    qr = segno.make(wifi_payload)
    qr.save(args.output, scale=6)
    print(f"Saved: {args.output}")
    print("Note: DNS is a hint only; set DNS manually on the phone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
