# QR Messaging Security Notes (Threat Model)

## Terminology alignment

- In-app language should describe MOSS60 QR messaging as an **experimental cryptographic/visual protocol**.
- Avoid legacy claims of resistance to quantum attacks unless a formally specified and audited mode is introduced.

## What is guaranteed

- **Tamper-evident payload checks:** QR payloads include hashes so edits are detectable during validation.
- **Format integrity:** MOSS60 encoding keeps payload structure compact and consistent across generate/scan paths.
- **Application-layer message obfuscation:** Messages use derived keys and XOR stream processing to reduce plaintext exposure in transit.
- **Multi-layer key derivation:** Keys pass through iterated MOSS60 hashing, prime-bridge mixing, and Lucas-sequence temporal evolution — each layer compounds the difficulty of reversal.
- **Forward-aware architecture:** The 60-element algebraic structure and prime-indexed mixing were chosen with awareness that cryptographic demands evolve; the layered design is intended to remain adaptable.

## What is **not** guaranteed

- **Not equivalent to audited modern protocols:** This is not a replacement for reviewed standards like TLS 1.3 + established E2EE protocols.
- **No automatic identity trust:** Public hash exchange must be verified out-of-band to reduce impersonation risk.
- **No endpoint hardening:** If a device/browser is compromised, message confidentiality and integrity can still fail.

## Security model philosophy

MOSS60 treats cryptographic strength as a spectrum rather than a binary claim. The system deliberately layers multiple independent mixing strategies — prime-residue orbits, golden-ratio frequency separation, Lucas-sequence key evolution — so that compromise of any single layer does not expose the full keystream. This depth-in-layers approach is designed to raise the cost of attack well beyond what the protected data is worth, while remaining transparent enough for educational inspection.

## Operational guidance

- Verify peer identity over a second channel before trusting exchanged public hashes.
- Treat this channel as **integrity-oriented experimental messaging** with layered obfuscation, not as high-assurance secure communications.
- For production-sensitive data, layer transport security and audited cryptographic protocols.
