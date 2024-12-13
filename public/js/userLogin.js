document.addEventListener('DOMContentLoaded', function () {
    fetch('/check-login', { method: 'GET' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const sidebarLinks = document.querySelector('.sidebar-links'); // Corrected selector
            if (!sidebarLinks) {
                console.error('Sidebar element not found');
                return;
            }

            // Dynamically update sidebar links based on login status
            const linksHtml = data.loggedIn ? `
                <li><a href="/userAccount">My Account</a></li>
                <li><a href="/logout">Sign Out</a></li>
                <li><a href="/cannabis101">Cannabis 101</a></li>
                <li><a href="/Cannabis">Strains</a></li>
                <li><a href="/HowToUse">How to use</a></li>
                <li><a href="/News">News</a></li>
                <li><a href="/FAQ">FAQ</a></li>
                <li><a href="/ContactUs">Contact Us</a></li>
            ` : `
                <li><a href="/login">Sign In</a></li>
                <li><a href="/signup">Sign Up</a></li>
                <li><a href="/cannabis101">Cannabis 101</a></li>
                <li><a href="/Cannabis">Strains</a></li>
                <li><a href="/HowToUse">How to use</a></li>
                <li><a href="/News">News</a></li>
                <li><a href="/FAQ">FAQ</a></li>
                <li><a href="/ContactUs">Contact Us</a></li>
            `;

            sidebarLinks.innerHTML = linksHtml;
        })
        .catch(error => {
            console.error('Error:', error);

            // Optionally, display an error message in the sidebar if it fails
            const sidebarLinks = document.querySelector('.sidebar-links'); // Corrected selector
            if (sidebarLinks) {
                sidebarLinks.innerHTML = '<li><a href="#">Error loading links</a></li>';
            }
        });
});
