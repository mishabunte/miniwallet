function hito_sendRequest(r) {

  let payload = _createPayload(r);

  switch(r.media) {
    case 'nfc': 
      return _sendRequestNFC(payload);
    case 'ble': 
      return _sendRequestBluetooth(payload);
    default:
      throw(`Wrong media: ${r.media}`);
  }
}

function hito_parseResponse(response) {
  if (!response) {
    return {
      err: 'response is empty',
    };
  }

  if (response.startsWith('evm.sig:0x')) {
    let signatureHex = response.replace('evm.sig:', '');

    // workaround for old version Hito with a non even signature
    if (signatureHex.length % 2 != 0) {
      signatureHex = signatureHex.replace(/0$|1$/, 
        match => match === '0' ? '00' : '01');
    }
    return {
      type : 'signature',
      hex  : signatureHex,
    }
  }

  if (response.startsWith('auth.hito.xyz')) {
    let url = new URL(response);
    return {
      type   : 'auth',
      token  : url.urlSearchParams.get('t'),
    }
  }
}

function _createPayload(r) {
  switch(r.type) {
    case 'evm.tx':
      return _createPayloadTxSign(r.wallet, r.payload);
    case 'evm.msg':
      return _createPayloadMsgSign(r.wallet, r.payload);
    case 'hito.auth':
      return _createPayloadHitoAuth(r.timestamp, r.token);
    default:
      throw(`Wrong request type: ${r.type}`);
  }
}

function _createPayloadTxSign(walletAddress, txUnsignedHex) {

  if (!ethers.isAddress(walletAddress)) {
    throw(`Wrong wallet address: ${walletAddress}`);
  }

  if (!txUnsignedHex.startsWith('0x')) {
    throw(`Wrong txUnsignedHex: ${txUnsignedHex}`);
  }

  // add empty v=0x,r=0x,s=0x to payload if tx type is 0x02
  if (txUnsignedHex.startsWith('0x02')) {

    let txArray = ethers.decodeRlp('0x' + txUnsignedHex.slice(4));
    txArray.push('0x'); txArray.push('0x'); txArray.push('0x');

    txUnsignedHex = ethers.encodeRlp(txArray).replace('0x', '0x02');
  }

  let requestPayload = `evm.sign:${walletAddress}:${txUnsignedHex}`;

  return requestPayload;
}

function _createPayloadMsgSign(walletAddress, msgHex) {

  if (!ethers.isAddress(walletAddress)) {
    throw(`Wrong wallet: ${walletAddress}`);
  }

  if (!msgHex.startsWith('0x')) {
    throw(`Wrong msghex: ${msgHex}`);
  }

  let requestPayload = `evm.msg:${walletAddress}:${msgHex}`;

  return requestPayload;
}

function _createPayloadHitoAuth(timestamp, tokenHex) {

  //if (!tokenHex.startsWith('0x')) {
  //throw(`Wrong tokenHex: ${tokenHex}`);
  //}

  let requestPayload = `hito.auth:${timestamp}.${tokenHex}`;
  console.log(requestPayload);

  return requestPayload;
}

