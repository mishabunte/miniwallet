$(document).ready(function() {
  let networks = [];
  let filteredNetworks = [];
  let useTestnets = false;

  // Load checkbox state and last selected network from localStorage
  if (localStorage.getItem('useTestnets') !== null) {
    useTestnets = JSON.parse(localStorage.getItem('useTestnets'));
    $('#useTestnets').prop('checked', useTestnets);
  }

  // Fetch networks from Chainlist.org
  async function fetchNetworks() {
    try {
      const response = await fetch('https://chainid.network/chains.json');
      networks = await response.json();
      // Sort networks by name
      networks.sort((a, b) => a.name.localeCompare(b.name));

      // Filter networks based on the checkbox state
      applyNetworkFilter();

      // Restore the last selected network
      if (localStorage.getItem('selectedNetwork')) {
        $('#networkSearch').val(localStorage.getItem('selectedNetwork'));
      }
    } catch (error) {
      console.error('Error fetching networks:', error);
    }
  }

  // Apply network filter based on "Use Testnets" checkbox
  function applyNetworkFilter() {
    if (useTestnets) {
      filteredNetworks = networks; // Include all networks
    } else {
      // Exclude testnets
      filteredNetworks = networks.filter(network => !network.testnet);
    }
  }

  // Call the function to fetch networks
  fetchNetworks();

  // Event listener for the "Use Testnets" checkbox
  $('#useTestnets').change(function() {
    useTestnets = $(this).is(':checked');
    localStorage.setItem('useTestnets', useTestnets);
    applyNetworkFilter();
    // Clear the autocomplete suggestions
    $('#autocomplete-list').empty().addClass('is-hidden');
    // Trigger input event to refresh suggestions
    $('#networkSearch').trigger('input');
  });

  // Autocomplete functionality
  $('#networkSearch').on('input', function() {
    const val = this.value;
    const autocompleteList = $('#autocomplete-list');
    autocompleteList.empty();

    if (!val) {
      autocompleteList.addClass('is-hidden');
      return;
    }

    // Filter networks based on input
    const suggestions = filteredNetworks.filter(network => {
      const nameMatch = network.name.toLowerCase().includes(val.toLowerCase());
      const idMatch = network.chainId.toString().includes(val);
      return nameMatch || idMatch;
    });

    if (suggestions.length === 0) {
      autocompleteList.addClass('is-hidden');
      return;
    }

    // Display the autocomplete suggestions
    suggestions.forEach(network => {
      const item = $('<div class="autocomplete-item"></div>');
      item.html(`<strong>${network.name}</strong> (Chain ID: ${network.chainId}) ${network.testnet ? '<span class="tag is-warning">Testnet</span>' : ''}`);
      item.on('click', function() {
        const selectedText = `${network.name} (Chain ID: ${network.chainId})`;
        $('#networkSearch').val(selectedText);
        autocompleteList.empty().addClass('is-hidden');
        // Save selected network to localStorage
        localStorage.setItem('selectedNetwork', selectedText);
      });
      autocompleteList.append(item);
    });

    autocompleteList.removeClass('is-hidden');
  });

  // Select all text when the input field gains focus
  $('#networkSearch').on('focus', function() {
    $(this).select();
  });

  // Close the autocomplete dropdown when clicking outside
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.autocomplete').length) {
      $('#autocomplete-list').empty().addClass('is-hidden');
    }
  });
});
