
document.addEventListener('DOMContentLoaded', () => {


    const form = document.getElementById('authForm');
    const help = document.querySelector('.help');
    const serialInput = document.getElementById('serialInput');
    const tokenInput = document.getElementById('tokenInput');
    const modal = document.getElementById('resultModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModalElements = document.querySelectorAll('#closeModal, #closeButton');
    const urlParams = new URLSearchParams(window.location.search);
    const serialNumber = encodeURIComponent(urlParams.get('s'));
    const deviceToken = encodeURIComponent(urlParams.get('t'));
    const submitButton = document.getElementById('submitButton');

    //setTimeout(() => {
    //    form.dispatchEvent(new Event('submit'));
    //}, 1000);

    //if (serialNumber) {
    //serialInput.value = serialNumber;
    //}
    if (deviceToken) {
    //tokenInput.value = deviceToken;
        checkAuthToken(deviceToken);
    }

    // Function to close the modal
    function closeModal() {
        modal.classList.remove('is-active');
    }

    // Attach event listeners to close modal buttons
    closeModalElements.forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    serialInput.addEventListener('input', (e) => {
      help.classList.remove('is-danger');
      serialInput.classList.remove('is-danger');
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let serial = serialInput.value.trim().toLowerCase();
        //serial = "8205";

        help.classList.remove('is-danger');
        serialInput.classList.remove('is-danger');

        // Input validation
        const regex = /^[0-9a-fA-F]{4}$/;
        if (!regex.test(serial)) {
            //alert('Please enter exactly two symbols (letters or digits).');
            help.classList.add('is-danger');
            serialInput.classList.add('is-danger');

            return;
        }

        setLoading(true);
        // Simulate a network request
        checkAuthToken(deviceToken, serial)
            .then(response => {
                // Display success modal
                modalTitle.textContent = 'Device Verified';
                modalContent.innerHTML = `<p>Device version: ${response.version}</p><br/><p>Firmware and hardware are valid</p>`;
                modal.classList.add('is-active');
                setLoading(false);
            })
            .catch(error => {
                // Display error modal
                modalTitle.textContent = 'Verification Failed';
                modalContent.textContent = error.message;
                modal.classList.add('is-active');
                setLoading(false);
            });
    });

    function escapeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;  // This escapes the HTML content
        return div.innerHTML;
    }

    // Function to simulate a network request
    function checkAuthToken(deviceToken) {
        return new Promise((resolve, reject) => {


            let apiUrl = `https://auth.hito.xyz/api/check_token/?t=${deviceToken}`;
            fetch(apiUrl).then((response) => {
                if (response.ok) {
                    return response.json();
                }
                reject(new Error('Server error. Please try again a bit later.'));
            }).then((responseJson) => {
                console.log(responseJson);
                if (responseJson.status === "ok") {
                  resolve({ version: escapeHTML(responseJson.edition) });
                } else if (responseJson.status === "auth_error") {
                    if (responseJson.error_type == 'device with the given serial number was not found') {
                      reject(new Error('Serial number not found'));
                    } else if (responseJson.error_type == "request outdated or received/generated invalid public key") {
                      reject(new Error('Request outdated or wrong authentication token'));
                    } else {
                      reject(new Error('Wrong authentication token'));

                    }
                } else {
                  reject(new Error('Server error. Please try again a bit later.'));
                }
            });
            // Simulate network delay
            //setTimeout(() => {
            //    // Randomly determine the outcome
            //    const randomOutcome = Math.random();
            //    if (randomOutcome < 0.6) {
            //        // 60% chance of success
            //        resolve({ version: '1.2.3' });
            //    } else if (randomOutcome < 0.9) {
            //        // 30% chance of invalid device
            //        reject(new Error('Firmware and hardware is not valid.'));
            //    } else {
            //        // 10% chance of network error
            //        reject(new Error('Network error - try again.'));
            //    }
            //}, 2000);
        });
    }

    function setLoading(loading) {
        submitButton.disabled = loading;
        serialInput.disabled = loading;
        if (loading) {
            submitButton.classList.add("is-loading");
        } else {
            submitButton.classList.remove("is-loading");
            //$('button').removeClass("is-loading").attr("disabled", false);
        }
    }
});
