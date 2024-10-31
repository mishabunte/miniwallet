document.addEventListener('DOMContentLoaded', () => {

  var qrCodeScanner = false;
  var qrCodeScannerTarget = false;

  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
    if (qrCodeScanner) {
      qrCodeScanner.clear();
      qrCodeScanner = false;
    }
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  function onScanSuccess(decodedText, decodedResult) {
    // Handle the decoded text
    if (decodedText.startsWith("ethereum:")) {
      decodedText = decodedText.replace("ethereum:", "");
    }
    const $el = document.getElementById(qrCodeScannerTarget);
    if (ethers.isAddress(decodedText)) {
      $el.value = decodedText.replace(/(.{7})/g, '$1 ').trim();
    } else {
      $el.value = decodedText.trim();
    }
    //$el.value = decodedText.).trim();
    closeAllModals();
    $($el).trigger('input');
    
  }

  function onScanError() {
    // Handle the scan error
    //console.warn(`QR Code scan error: ${errorMessage}`);
    //closeAllModals();
  }

  //// Add a click event on buttons to open a specific modal
  //(document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
  //  const modal = $trigger.dataset.target;
  //  const $target = document.getElementById(modal);

  //  $trigger.addEventListener('click', () => {
  //    openModal($target);
  //  });
  //});

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if(event.key === "Escape") {
      closeAllModals();
    }
  });

  (document.querySelectorAll('.js-qrscanner-trigger') || []).forEach(($trigger) => {

    $trigger.addEventListener('click', () => {
      qrCodeScannerTarget = $trigger.dataset.target;
      openModal(document.getElementById('video-modal'));
      qrCodeScanner = new Html5QrcodeScanner(
        'qr-reader', { fps: 10, qrbox: 300 });

      qrCodeScanner.render(onScanSuccess, onScanError);
    });
  });
});


