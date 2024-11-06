---
layout: default
title: Hito Wallet API
---

# Hito Wallet API Documentation

This API enables interaction with the Hito hardware wallet over NFC or Bluetooth. It supports signing Ethereum transactions and messages, as well as authenticating with the Hito system.

## Functions

- **hito_sendRequest(request)**
  Sends a request to the Hito hardware wallet.

  - **Parameters:**
    - `media` - Communication media, either `'nfc'` for NFC or `'ble'` for Bluetooth Low Energy.
    - `type` - The type of request:
      - `'evm.tx'` - Sign an Ethereum transaction.
      - `'evm.msg'` - Sign a message.
      - `'hito.auth'` - Used for authentication.
    - `wallet`  - The wallet address of the signer
    - `payload` - The payload to be signed, depending on the request type:
      - For `'evm.tx'` - An unsigned transaction in hex format (prefixed by `0x`).
      - For `'evm.msg'` - A message in hex format (prefixed by `0x`).
      - For `'hito.auth'` 
        - `token` - a token in hexadecimal format
        - `timestamp` - a timestamp 


  - **Example:**
    ```javascript
    // Send request to sign a transaction with Hito wallet via Bluetooth
    hito_sendRequest({
      media   : 'ble',
      type    : 'evm.tx',
      wallet  : '0x9FC3da866e7DF3a1c57adE1a97c9f00a70f010c8',
      payload : '0x...'
    });
    ```

- **hito_parseResponse(response)**
  Parses the response from the Hito hardware wallet.

  - **Parameters:**
    - `response` - The response string from the hardware wallet.

  - **Returns:**
    - If the response is an Ethereum signature (`evm.sig`), it returns:
      - `{ type: 'signature', hex: '<signatureHex>' }`
    - If the response is an authentication token (`auth.hito.xyz`), it returns:
      - `{ type: 'auth', token: '<authToken>' }`

  - **Example:**
    ```javascript
    const parsedResponse = hito_parseResponse('evm.sig:0x...');
    ```

## Request Payload Formats

- **Ethereum Transaction (evm.tx):**
  Unsigned Ethereum transaction in hex format, starting with `0x`.

- **Message (evm.msg):**
  Message to be signed, in hex format, starting with `0x`.

## Response Formats

- **Signature Response:**
  If the response contains a signature (`evm.sig`), it will return an object with the type `'signature'` and the signature in hex format.

- **Authentication Response:**
  If the response contains an authentication token (`auth.hito.xyz`), it will return an object with the type `'auth'` and the authentication token.

## Files

- [hito.js](./js/hito.js)
- [nfc.js](./js/nfc.js)
- [bluetooth.js](./js/bluetooth.js)

