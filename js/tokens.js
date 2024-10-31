const INFURA_API_KEY = '16ec03834bff4cc0b7ec7fe536c5810c';

async function fetchAndCombineTokenLists() {
  // Token list URLs
  const urls = [
    "https://tokens.uniswap.org/",
    "https://tokens.honeyswap.org/",
    "https://tokens.pancakeswap.finance/pancakeswap-extended.json",
    "https://token-list.sushi.com/"
  ];

  // Fetch all token lists
  const tokenLists = await Promise.all(urls.map(url => fetch(url).then(res => res.json())));

  // Object to store combined tokens, key is the token address
  const combinedTokens = {};

  // Iterate over token lists in priority order (Uniswap first, SushiSwap last)
  tokenLists.forEach((list) => {
    list.tokens.forEach((token) => {
      const { address } = token;

      // Add the token if it doesn't exist yet (higher priority tokens will come first)
      if (!combinedTokens[address.toLowerCase()]) {
        token.address = ethers.getAddress(token.address);
        combinedTokens[ethers.getAddress(address)] = token;
      }
    });
  });

  // Convert the object back to an array of tokens
  return Object.values(combinedTokens);
}

function setToken(token, chainInfo) {
  let tokenFullName = `${token.symbol} @ ${chainInfo.name}`;
  $('#tokenSearch').val(tokenFullName).trigger('input');
  if (token.address) {
    $('#contractAddress').val(token.address.replace(/(.{7})/g, '$1 ')).trigger('input');
  } else {
    $('#contractAddress').val('');
    $('#contractAddress').trigger('input');
  }
  updateTokenIcon(token);
}

function updateTokenIcon(token) {
  if (token && token.logoURI) {
    var img = new Image();
    img.onload = () => {
      $('#tokenSearch').parents('.control').find('.icon').removeClass('is-hidden');
      $('#tokenSearch').parents('.control').find('.js-default').addClass('is-hidden');
      $('#tokenSearch').parents('.control').find('img').attr('src', token.logoURI);
    };
    img.onerror = () => {
      $('#tokenSearch').parents('.control').find('.icon').addClass('is-hidden');
      $('#tokenSearch').parents('.control').find('.js-default').removeClass('is-hidden');
    }
    img.src = token.logoURI;
  } else {
    $('#tokenSearch').parents('.control').find('.icon').addClass('is-hidden');
    $('#tokenSearch').parents('.control').find('.js-default').removeClass('is-hidden');
  }
}

// Minimal ERC20 ABI to get balance
const minABI = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  // decimals
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
];

async function getERC20Balance(walletAddress, tokenAddress, web3) {
  try {

    // Create contract instance
    const contract = new web3.eth.Contract(minABI, tokenAddress);

    // Get raw balance
    const balance = await contract.methods.balanceOf(walletAddress).call();

    // Get token decimals
    const decimals = await contract.methods.decimals().call();

    $(".js-decimals").text(`, decimals: ${decimals}`);

    // Convert balance to readable format
    const adjustedBalance = Number(balance * BigInt(100) / BigInt(10) ** decimals) / 100.0;
    
    //console.log(`Balance: ${adjustedBalance} (${balance})`);

    return adjustedBalance;
  } catch (error) {
    //console.error('Error fetching balance:', error, tokenAddress);
  }
}

async function updateTokenBalance() {
  $(".js-decimals").text("");
  $(".js-balance-tokens").addClass('is-hidden');

  const network = $('#networkSearch').val();
  const contractAddress = $('#contractAddress').val().replace(/\s/g, '');
  const walletAddress = $('#walletAddress').val().replace(/\s/g, '');
  var chainInfo = extractChainInfo(network);

  if (ethers.isAddress(walletAddress) && chainInfo && contractAddress) {
    let chainInfoFull = getChainInfoFull(chainInfo.chainId);
    let rpcUrl = chainInfoFull.rpc[0];
    if (rpcUrl.includes('${INFURA_API_KEY}')) {
      rpcUrl = rpcUrl.replace('${INFURA_API_KEY}', INFURA_API_KEY);
    }

    let web3 = new Web3(rpcUrl); // Replace with your Infura project ID

    //const balanceWei = await web3.eth.getBalance(walletAddress);
    const balanceToken = await getERC20Balance(walletAddress, contractAddress, web3);
    //let balanceEth = web3.utils.fromWei(balanceWei, 'ether')
    //if (balanceEth === '0.') {
    //balanceEth = "0.0";
    //}
    //log(`balance wei ${balanceWei}`);
    //log(`balance token ${balanceToken}`);
    let balance = `Balance: ${balanceToken}`;
    if (typeof balanceToken === 'number') {
      $(".js-balance-tokens").text(balance).removeClass("is-hidden").
        data('balance', balanceToken);
    } else {
      $(".js-balance-tokens").text("0.00").addClass("is-hidden").
        data('balance', "0");
    }
  }
  let token = findTokenByContract(contractAddress);
  updateTokenIcon(token);
}

var combinedTokens = [];

function findTokenByContract(contractAddress) {
  const suggestions = combinedTokens.filter(token => {
    const contractMatch = token.address.toLowerCase() === contractAddress.toLowerCase();
    return contractMatch;
  });

  return suggestions.length === 0 ? false : suggestions[0];
}

$(document).ready(function() {

  // Example usage
  fetchAndCombineTokenLists().then(combinedTokensA => {

    combinedTokens = combinedTokensA;
    // Do something with the combined tokens list
    console.log(`Tokens: ${combinedTokens.length}`);
    log(`Tokens: ${combinedTokens.length}`);
    $('#networkSearch').on('input, change', function() {
      //let chainInfo = getChainInfoFull();
      //console.log(chainInfo);
    });

    $('#tokenSearch').on('input', function() {

      //if (!$('#contractAddress').val()) {
        $('#tokenSearch').parents('.control').find('.icon').addClass('is-hidden');
        $('#tokenSearch').parents('.control').find('.js-default').removeClass('is-hidden');
      //}
      const val = this.value;
      //$('#contractAddress').val('').trigger('input');
      const autocompleteList = $('#autocomplete-token-list');
      autocompleteList.empty();

      if (!val) {
        $('#contractAddress').val('').trigger('input');
        autocompleteList.addClass('is-hidden');
        return;
      }

      // Filter tokens by chainId
      let chainInfo = getChainInfoFull();

      // Filter networks based on input
      const suggestions = combinedTokens.filter(token => {
        const chainMatch    = (chainInfo && token.chainId === chainInfo.chainId);
        const nameMatch     = token.name.toLowerCase().startsWith(val.toLowerCase());
        const symbolMatch   = token.symbol.toLowerCase().startsWith(val.toLowerCase());
        const contractMatch = token.address.toLowerCase().startsWith(val.toLowerCase());
        return chainMatch && (nameMatch || symbolMatch || contractMatch);
      });

      if (suggestions.length === 0) {
        autocompleteList.addClass('is-hidden');
        $('#contractAddress').val('').trigger('input');
        return;
      }

      // Display the autocomplete suggestions
      suggestions.forEach(token => {
        const item = $('<div class="autocomplete-item"></div>');
        let tokenText = `<strong>${token.symbol}</strong> @ ${chainInfo.name} - ${token.address}`;
        item.html(tokenText);
        item.on('click', function() {
          //setToken(`${token.symbol} @ ${chainInfo.name}`, token.address);
          setToken(token, chainInfo);
          autocompleteList.empty().addClass('is-hidden');
          // Save selected network to localStorage
          localStorage.setItem('selectedToken', tokenText);
        });
        autocompleteList.append(item);
      });

      autocompleteList.removeClass('is-hidden');
    });
    $('#networkSearch').on('input', function() {
      //updateTokenBalance();
      let tokenName = $('#tokenSearch').val();
      let chainInfoFull = getChainInfoFull();
      if (chainInfoFull && tokenName) {
        let tokenFirstName = tokenName.split(/[@\.]/)[0].trim();
        if (tokenFirstName) {
          console.log(tokenFirstName);
          const suggestions = combinedTokens.filter(token => {
            const chainMatch    = (chainInfoFull && token.chainId === chainInfoFull.chainId);
            const nameMatch     = token.name.toLowerCase().startsWith(tokenFirstName.toLowerCase());
            const symbolMatch   = token.symbol.toLowerCase().startsWith(tokenFirstName.toLowerCase());
            return chainMatch && (nameMatch || symbolMatch);
          });
          if (suggestions.length !== 0) {
            //setToken(`${suggestions[0].symbol} @ ${chainInfoFull.name}`, suggestions[0].address);
            setToken(suggestions[0], chainInfoFull);
          } else {
            setToken({ symbol: tokenFirstName }, chainInfoFull);
            //setToken(`${tokenFirstName} @ ${chainInfoFull.name}`, '');
          }
        }
      }
    });

    updateTokenBalance();
  });

  $('#contractAddress').on('input', function() {
    updateTokenBalance();
    //$('#tokenValue').val('');
  });
  $('#contractAddress').on('change', function() {
    updateTokenBalance();
    //$('#tokenValue').val('');
  });

  $('.js-balance-tokens').click(function() {
    $('#tokenValue').val($(this).data('balance'));
  });

  $('.js-example a').click(function() {
    let input = $(this).parents('.field').find('input').val($(this).text());
    let control = input.parents('.control').addClass('is-loading');
    setTimeout(() => {
      control.removeClass('is-loading');
      //input.val($(this).text()).trigger('input');
      input.trigger('input');
      $(this).parents('.field').find('input').trigger('input');
      //input.trigger('change');
      $(this).parents('.field').find('.autocomplete-items div').first().click();
    }, 250);
  });

});

