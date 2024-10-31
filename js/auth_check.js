
document.addEventListener('DOMContentLoaded', () => {


    const modal = document.getElementById('resultModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModalElements = document.querySelectorAll('#closeModal, #closeButton');
    const urlParams = new URLSearchParams(window.location.search);
    const deviceToken = urlParams.get('t');

    // Function to close the modal
    function closeModal() {
        document.location.href = document.location.origin + document.location.pathname;
    }

    // Attach event listeners to close modal buttons
    closeModalElements.forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    if (deviceToken) {

        modal.classList.add('is-active');

        checkAuthToken(encodeURIComponent(deviceToken))
            .then(response => {
                // Display success modal
                modalTitle.textContent = 'Device Verified';
                modalContent.innerHTML = `<p>Device version: ${response.version}</p><br/><p>Firmware and hardware are valid</p>`;
                closeButton.classList.remove('is-loading');
            })
            .catch(error => {
                // Display error modal
                modalTitle.textContent = 'Verification Failed';
                modalContent.textContent = error.message;
                closeButton.classList.remove('is-loading');
            });
    }

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
        });
    }

});
