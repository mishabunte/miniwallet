---
layout: default
title: Hito Hardware Wallet API
---

# Hito Hardware Wallet API Documentation

Welcome to the API documentation for the **Hito Hardware Wallet**. Below you'll find links to various sample implementations of the Hito Wallet API, including device authentication, pairing, and signing EVM and Bitcoin transactions.

## API Endpoints and Samples

### 1. [Device and Firmware Authentication](device-firmware-authentication.md)
Learn how to authenticate the device and verify firmware integrity using the Hito hardware wallet. This includes token requests, signature generation, and verification.

### 2. [Simple EVM Pairing via Ethereum Address](evm-pairing-simple.md)
A simple pairing example using an Ethereum address (Account 0, Index 0). Perfect for basic Ethereum integrations without the need for advanced encryption.

### 3. [Encrypted Pairing via BIP32 Extended Public Key](evm-pairing-bip32.md)
This example demonstrates secure pairing between the Hito wallet and the client using the BIP32 extended public key for encrypted communication.

### 4. [Sign EVM Transaction](sign-evm-transaction.md)
Learn how to sign an Ethereum transaction using the Hito hardware wallet, including NFC and Bluetooth payload formats.

### 5. [Sign EVM Message](sign-evm-message.md)
Example for signing arbitrary Ethereum messages (e.g., for smart contracts or identity verification) using NFC or Bluetooth.

### 6. [Sign Bitcoin Transaction](sign-btc-transaction.md)
This guide shows how to sign Bitcoin transactions, including handling UTXOs and generating a signed Bitcoin transaction.

---

For more detailed information, visit the specific API example pages. Each sample includes detailed descriptions of the request and response formats, as well as communication methods (NFC, Bluetooth) supported by the Hito hardware wallet.

Happy coding!
