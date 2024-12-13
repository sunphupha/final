// Function to update the local time in the footer
function updateTime() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
    const localTimeElement = document.getElementById('local-time');
    if (localTimeElement) {
        localTimeElement.textContent = now.toLocaleTimeString('en-US', options);
    }
}
updateTime();
setInterval(updateTime, 60000); // Update every minute

// Function to update user actions dynamically
function updateUserLinks() {
    // Simulate user login status (replace this logic with your backend check)
    const isLoggedIn = true; // Change to `false` to simulate a logged-out user

    // Get references to the elements
    const userSection = document.getElementById('user-section');
    const userAction1 = document.getElementById('user-action-1');
    const userAction2 = document.getElementById('user-action-2');

    if (userSection && userAction1 && userAction2) {
        if (isLoggedIn) {
            // User is logged in
            userAction1.textContent = 'My Account';
            userAction1.href = '/userAccount'; // Replace with your "My Account" page URL
            userAction2.textContent = 'Sign out';
            userAction2.href = '/logout'; // Replace with your signout URL
        } else {
            // User is logged out
            userAction1.textContent = 'Sign in';
            userAction1.href = '/login'; // Replace with your sign-in page URL
            userAction2.textContent = 'Sign up';
            userAction2.href = '/signup'; // Replace with your sign-up page URL
        }
    }
}

// Call the function to update the user links
updateUserLinks();
