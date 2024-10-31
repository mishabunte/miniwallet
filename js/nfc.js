// send payload to hito wallet via nfc
async function _sendRequestNFC(payload) {

  if ('NDEFReader' in window) {
    const writer = new NDEFReader();
    await writer.write({
      records: [{
        recordType: "text",
        data: payload,
        lang: "en"
      }]
    });
  } else {
    throw("Web NFC is not supported in this browser.");
  }
}

