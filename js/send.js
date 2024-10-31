
function setFormLoading(isLoading) {
  if (isLoading) {
    logClear();
    $('button, input[type="text"]').attr('disabled', true);
    $('a, .field').addClass('is-disabled');
    $('.js-send-ble').parents('.control').addClass('is-loading').find('button').attr('disabled', true);
  } else {
    $('.js-send-ble').parents('.control').removeClass('is-loading').find('button').attr('disabled', false);
    $('button, input[type="text"]').attr('disabled', false);
    $('a, .field').removeClass('is-disabled');
  }
}

async function checkIfBluetoothAvailable() {
  let isBluetoothAvailable = false;
  try {
    isBluetoothAvailable = await navigator.bluetooth.getAvailability();
    if (!isBluetoothAvailable) {
      $('.js-send-ble').attr('disabled', true);
      log('Bluetooth is not available');
    }
    if ('onavailabilitychanged' in navigator.bluetooth) {
      navigator.bluetooth.addEventListener('availabilitychanged', function(event) {
        if (event.value) {
          $('.js-send-ble').attr('disabled', false);
          log('Bluetooth has enabled by user');
        } else {
          $('.js-send-ble').attr('disabled', true);
          log('Bluetooth has disabled by user');
        }
      });
    }
  } catch(error) {
    isBluetoothAvailable = false;
    log('Warning: Bluetooth is not supported by this browser');
  }
}

async function checkIfNearFieldAvailable() {
  if ('NDEFReader' in window) {
  } else {
    log("Warning: Web NFC is not supported in this browser");
  }
}

async function getWeb3Address(address) {
  const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`); 
  address = address.replace(/\s/g, '');
  if (ethers.isAddress(address)) {
    return address;
  } else {
    try {
      let resolved = await web3.eth.ens.getAddress(address);
      return web3.utils.toChecksumAddress(resolved);
    } catch(error) {
      //console.error(error);
      //log(`error resolving: ${address}: ${error}`);
      return false;
    }
  }
}

function numberWithCommas(x) {
  let separator = ',';
  let a = x.toString().split('.');
  let first = a[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  let second = a.length == 1 
    ? '' 
    : ('.' + a[1].split('').reverse().join('').
      replace(/\B(?=(\d{3})+(?!\d))/g, separator).split('').reverse().join(''));
  return first + second;
}

function erc20TransferData(to, amount, decimals) {
  let value = ethers.parseUnits(amount, decimals);
  return '0xa9059cbb' +
    ethers.AbiCoder.defaultAbiCoder().encode([ "address", "uint256" ],
      [ to, value ]).slice(2);
};

function showFormError(el) {
  if ($(el).hasClass('field')) {
    $(el).find('.help').removeClass('is-hidden')
    $(el).find('input,button').addClass('is-danger')
  } else {
    $(el).parents('.field').find('.help').removeClass('is-hidden')
    $(el).parents('.field').find('input,button').addClass('is-danger')
  }
  setFormLoading(false);
}

function clearFormError(el) {
  $(el).parents('.field').find('.help').addClass('is-hidden')
  $(el).parents('.field').find('input,button').removeClass('is-danger')
}

async function checkForm() {
  try {
    setFormLoading(true);

    var params = {};

    $('input.is-danger, button.is-danger').removeClass('is-danger');
    $('help.is-danger').addClass('is-hidden');

    for (let el of $('.js-form-web3-address:visible')) {
      let id = $(el).find('input').attr('id');
      let resolved = await getWeb3Address($(el).find('input').val());
      if (resolved) {
        $(el).data('resolved', resolved);
        params[id] = resolved;
      } else {
        showFormError(el);
        $(el).data('resolved', '');
        return false;
      }
    }

    let chainInfo = getChainInfoFull();
    if (chainInfo) {
      params.chainInfo = chainInfo;
    } else {
      showFormError($('#networkSearch'));
      return false;
    }

    for (let el of $('.js-form-number:visible')) {
      //var el = $(this);
      let id = $(el).find('input').attr('id');
      let value = $(el).find('input').val();
      if (value && !isNaN(value)) {
        params[id] = value;
      } else {
        showFormError(el);
        return false;
      }
    }

    for (let el of $('.js-form-text:visible')) {
      //var el = $(this);
      let id = $(el).find('input').attr('id');
      let value = $(el).find('input').val().trim();
      if (value) {
        params[id] = value;
      } else {
        showFormError(el);
        return false;
      }
    }

    console.log(params);

    params.isMessage = $('[data-tab="js-tabSignMessage"]').hasClass("is-active");
    if (params.isMessage) {
      //params.message = $(
    } else {
      params.isErc20 = $('[data-tab="js-tabTxErc20"]').hasClass("is-active");
      if (params.isErc20) {
        let token = findTokenByContract(params.contractAddress);
        params.decimals = token ? token.decimals : 18;
        params.value = params.tokenValue;
      } else {
        params.value = params.valueEth;
      }
    }

    console.log(params);

    return params;

  } catch(error) {
    log(error);
    setFormLoading(false);
  }
}

async function ensResolve(ensName) {
  const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`); 
  log(`${ensName} : `);
  const address = await web3.eth.ens.getAddress(ensName);
  log(`${address}`, true);
  return address;
}

function getRpcUrl() {
  let chainInfoFull = getChainInfoFull();
  let rpcUrl = chainInfoFull.rpc[0];
  if (rpcUrl.includes('${INFURA_API_KEY}')) {
    rpcUrl = rpcUrl.replace('${INFURA_API_KEY}', INFURA_API_KEY);
  }
  return rpcUrl;
}

async function updateBalance() {
  $(".js-balance").addClass('is-hidden');

  const network = $('#networkSearch').val();
  const walletAddress = await getWeb3Address($('#walletAddress').val());
  var chainInfo = extractChainInfo(network);

  if (walletAddress && chainInfo) {
    let web3 = new Web3(getRpcUrl()); // Replace with your Infura project ID

    const balanceWei = await web3.eth.getBalance(walletAddress);
    let balanceEth = web3.utils.fromWei(balanceWei, 'ether')
    if (balanceEth === '0.') {
      balanceEth = "0.0";
    }
    //document.getElementById('result').textContent = `Nonce: ${nonce}`;
    let balance = `Balance: ${balanceEth}`;
    $(".js-balance").text(balance).removeClass("is-hidden").
      data('balance', balanceEth);
  }
}


async function buildUnsignedTransactionHex(params) {

  //console.log(params);

  let rpcUrl = params.chainInfo.rpc[0];
  log(`connecting to         : ${rpcUrl}`);
  if (rpcUrl.includes('${INFURA_API_KEY}')) {
    rpcUrl = rpcUrl.replace('${INFURA_API_KEY}', INFURA_API_KEY);
  }

  const web3 = new Web3(rpcUrl); 
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  log(`creating transaction  ..`);

  const balanceWei = await web3.eth.getBalance(params.walletAddress);
  const balanceEth = web3.utils.fromWei(balanceWei, 'ether')
  let currency = params.chainInfo.nativeCurrency.symbol;

  log(`  balance              : ${numberWithCommas(balanceEth)} ${currency}`);
  log(`  amount               : ${numberWithCommas(params.value)} ${currency}`);

  const nonce = await web3.eth.getTransactionCount(params.walletAddress, 'latest');
  log(`  nonce                : ${nonce}`);

  log(`estimating gas fee     ...`);
  let gasPrice = await web3.eth.getGasPrice();

  //const feeHistory = await provider.send("eth_feeHistory", ["0x1", "latest", []]);
  //console.log(feeHistory);

  let feeData = await provider.getFeeData();

  log(`  gasPrice               : ${numberWithCommas(gasPrice / BigInt(1000000000))} gwei`);
  let tx = {
    to       : params.isErc20 ? params.contractAddress : params.toAddressBasic,
    value : '0',
    chainId  : params.chainInfo.chainId,
    data     : params.isErc20 
      ? erc20TransferData(params.toAddressBasic, params.tokenValue, params.decimals) 
      : '0x',
    gasLimit:  web3.utils.toHex(10000000000),
    nonce    : web3.utils.toHex(nonce),
  };
  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    tx.maxFeePerGas = feeData.maxFeePerGas;
    tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    tx.type = 0x02;
    tx.accessList = [];
  } else {
    tx.type = 0x00;
    tx.gasPrice = feeData.gasPrice ? web3.utils.toHex(feeData.gasPrice) : web3.utils.toHex(gasPrice);
  }
  if (params.isErc20) {
    tx.from = params.walletAddress;
  }
  //console.log(tx);

  let estimatedGas = await web3.eth.estimateGas(tx);
  delete tx.from;
  log(`  estimatedGas           : ${numberWithCommas(estimatedGas)}`);

  let fee = estimatedGas * gasPrice;
  let avgFee = web3.utils.fromWei(fee, 'ether')
  log(`  avgFee                 : ${numberWithCommas(avgFee)} ${currency}`);

  tx.gasLimit = web3.utils.toHex(estimatedGas);

  tx.value = ethers.parseUnits(params.isErc20 ? '0' : params.valueEth, 'ether');

  let txhex = ethers.Transaction.from(tx).unsignedSerialized;

  return txhex;
}

function showTransactionError(message) {
  log(message);
  $('.js-send-ble, .js-send-nfc').removeClass('is-hidden');
  $('.js-scan, .js-cancel').addClass('is-hidden');
}

async function buildAndDisplaySignedTransaction(signatureHex, unsignedTxHex) {
  console.log(signatureHex);
  console.log(unsignedTxHex);
  try {
    if (!signatureHex || !signatureHex.startsWith('0x')) {
      throw(`Error: wrong signature [${signatureHex}`);
    }
    //let tx = ethers.utils.parseTransaction(unsignedTxHex);
    let tx = ethers.Transaction.from(unsignedTxHex);
    console.log(tx);

    tx.signature = ethers.Signature.from(signatureHex);

    let signedTxHex = ethers.Transaction.from(tx).serialized;

    $('#txSignedHex').val(signedTxHex);

    let json = ethers.Transaction.from(signedTxHex);
    Object.keys(json).forEach(key => {
      if (json[key]) {
        json[key] = json[key].toString();
      }
    });
    let sort = Object.keys(json);
    const sortOrder = 'type chainId nonce gasPrice maxPriorityFeePerGas maxFeePerGas gasLimit to value data v r s accessList from'.split(' ');
    sort.sort((a, b) => {
      sortOrder.indexOf(a) - sortOrder.indexOf(b)
    });
    let txdata = JSON.stringify(json, sortOrder, 2);

    let chainInfo = getChainInfoFull();
    $('#tx-modal').find('.modal-card-title b').text(chainInfo.name);
    $('#tx-modal').addClass('is-active').find('code').text(`// hex: ${signedTxHex}\n\n//\n` + txdata);
    $('code').each(function() {
       $(this).text($(this).text()).attr('data-highlighted', '');
    });
    hljs.highlightAll();

  } catch(error) {
    console.error(error);
    showTransactionError(error);
  }
}

async function sendTransactionToNetwork() {
  try {
    //$('#tx-modal button').attr('disabled', true);
    //$('#send-transaction').addClass('is-loading');
    setFormLoading(true);
    const signedTxHex = $('#txSignedHex').val();

    const provider = new ethers.JsonRpcProvider(getRpcUrl());

    log('Sending transaction .');
    const txResponse = await provider.broadcastTransaction(signedTxHex);
    log(`  done, hash: ${txResponse.hash}`);

    log('Waiting to be mined ..');
    const receipt = await txResponse.wait();
    log(`  was mined in block: ${receipt.blockNumber}`);

  } catch(error) {
    showTransactionError(error);
  }
  //$('.js-send-ble, .js-send-nfc').removeClass('is-hidden');
  //$('.js-scan, .js-cancel').addClass('is-hidden');
  //$('#tx-modal button').attr('disabled', false);
  //$('#send-transaction').removeClass('is-loading');
  setFormLoading(false);
}

function asciiToHex(str) {
  return '0x' + str.split('')
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
}

$(document).ready(function() {

  $('#txSignatureHex').on('input', function() {
    let hitoResponse = hito_parseResponse($('#txSignatureHex').val());
    buildAndDisplaySignedTransaction(
      hitoResponse.hex,
      $('#txUnsignedHex').val(),
    );
  });

  async function requestServerToken() {
    const response = await fetch('https://auth.hito.xyz/api/request_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok: ' + response.statusText);
    }

    const data = await response.json();
    return data.token;
  }

  $('.js-auth-ble, .js-auth-nfc').click(async function() {
    try {
      logClear();
      const isBLE = $(this).hasClass('js-auth-ble');
      let timestamp = Math.floor(Date.now() / 1000);
      timestamp = timestamp - timestamp % 600; // round to 10 minutes
      const r = {
        media     : isBLE ? 'ble' : 'nfc',

        type      : 'hito.auth',
        timestamp : timestamp,
        token     : await requestServerToken(),
      };
      log(`send request to device: ` + JSON.stringify(r, null, 2));
      await hito_sendRequest(r);
      $('.js-auth-ble, .js-auth-nfc').addClass('is-hidden');
      $('#scan-to-complete, .js-cancel').removeClass('is-hidden');
      //setFormLoading(false);
    } catch(error) {
      log('Error: ' + error);
      console.error(error);
      setFormLoading(false);
    }
  });

  $('.js-send-ble, .js-send-nfc').click(async function() {
    try {
      //$(this).parents('.control').addClass('is-loading').find('button').attr('disabled', true);
      let params = await checkForm();
      if (params) {

        const isBLE = $(this).hasClass('js-send-ble');

        const r = {
          media   : isBLE ? 'ble' : 'nfc',

          type    : 'evm.tx',
          wallet  : params.walletAddress,
          //payload : txHex,
        };

        if (params.messageText) {
          r.type    = 'evm.msg';
          r.payload = asciiToHex(params.messageText);
        } else {
          let txHex = await buildUnsignedTransactionHex(params);
          $('#txUnsignedHex').val(txHex);
          r.payload = txHex;
          r.type    = 'evm.tx';
        }

        log(`send request to device: ` + JSON.stringify(r, null, 2));

        await hito_sendRequest(r);

        if (!params.messageText) {
          $('.js-send-ble, .js-send-nfc').addClass('is-hidden');
          $('.js-scan, .js-cancel').removeClass('is-hidden');
        }

        setFormLoading(false);
      }
    } catch(error) {
      log('Error: ' + error);
      console.error(error);
      setFormLoading(false);
    }
    //$(this).parents('.control').removeClass('is-loading').find('button').attr('disabled', false);
  });

  $('.js-balance').click(function() {
    $('#valueEth').val($(this).data('balance'));
  });

  $('.js-cancel').click(function() {
    logClear();
    //log('Transaction is cancelled');
    $(this).parents('.field').find('button').removeClass('is-hidden');
    $(this).parents('.field').find('.js-scan, .js-cancel').addClass('is-hidden');
  });

  $('#walletAddress,#networkSearch').on('input', () => {
    updateBalance();
    updateTokenBalance();
  })
  $('#walletAddress,#networkSearch').on('change', () => {
    updateBalance();
    updateTokenBalance();
  })
  $('#scan-to-transmit').on('click', () => { 
    $('.js-send-ble, .js-send-nfc').removeClass('is-hidden');
    $('.js-scan, .js-cancel').addClass('is-hidden');
  });
  $('#send-transaction').on('click', () => sendTransactionToNetwork());
  $('input').on('input', function() { clearFormError(this) });
  //$('.help').removeClass('is-hidden');
  
  $('#authURL').on('input', function() {
    //let hitoResponse = hito_parseResponse($('#txSignatureHex').val());
    //buildAndDisplaySignedTransaction(
    //hitoResponse.hex,
    //$('#txUnsignedHex').val(),
    //);
    let authURL = $('#authURL').val();
    if (authURL.startsWith('auth.hito.xyz')) {
      authURL = 'https://' + authURL;
    }

    console.log(authURL);
    if (authURL.startsWith('https://auth.hito.xyz')) {
      //if (window.location.host
      if (window.location.hostname == 'auth.hito.xyz') {
        window.location.href = authURL;
      } else {
        window.open(authURL, '_blank');
      }
    }
    $('.js-cancel:visible').trigger('click');
  });

  checkIfBluetoothAvailable();
  checkIfNearFieldAvailable();

  setTimeout(() => { 
    //$('.js-send-nfc').click();
    //$('.js-auth-nfc').click();
    //buildAndDisplaySignedTransaction(
    //  'evm.sig:0x548bb3020a90ab4033a39d5da8f68b8785d72cac6b2660aedcac76395a175cbc29979c3619009c00f212180d61f4010c3c54d372f5220470af8fc1a96dca897f1', 
    //  '0x02f8728189608506b3e848e28506d8f9a16482b9b194c2132d05d31c914a87c6611c10748aeb04b58e8f80b844a9059cbb000000000000000000000000c60d8ab32624eaeb89147b98c0405d8bc4e328f100000000000000000000000000000000000000000000000000000000000f4240c0808080'
    //);
  }, 500);
});
