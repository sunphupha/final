// เมื่อโหลดหน้าจอ
document.addEventListener('DOMContentLoaded', function() {
    // ส่งคำขอไปที่ backend เพื่อตรวจสอบสถานะการล็อกอิน
    fetch('/check-login', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            const sidebarLinks = document.getElementById('sidebar-links'); // ตรวจสอบให้แน่ใจว่า id นี้มีใน HTML

            if (data.loggedIn) {
                // ถ้าผู้ใช้ล็อกอินแล้ว ให้เปลี่ยนเมนู hamburger
                sidebarLinks.innerHTML = `
                    <li><a href="/myaccount">My Account</a></li>
                    <li><a href="/logout">Sign Out</a></li>
                    <li><a href="/cannabis101">Cannabis 101</a></li>
                    <li><a href="/Cannabis">Strains</a></li>
                    <li><a href="/HowToUse">How to use</a></li>
                    <li><a href="/News">News</a></li>
                    <li><a href="/FAQ">FAQ</a></li>
                    <li><a href="/ContactUs">Contact Us</a></li>
                `;
            } else {
                // ถ้าผู้ใช้ยังไม่ล็อกอิน ให้แสดงลิงก์ Sign In และ Sign Up
                sidebarLinks.innerHTML = `
                    <li><a href="/login">Sign In</a></li>
                    <li><a href="/signup">Sign Up</a></li>
                    <li><a href="/cannabis101">Cannabis 101</a></li>
                    <li><a href="/Cannabis">Strains</a></li>
                    <li><a href="/HowToUse">How to use</a></li>
                    <li><a href="/News">News</a></li>
                    <li><a href="/FAQ">FAQ</a></li>
                    <li><a href="/ContactUs">Contact Us</a></li>
                `;
            }
        })
        .catch(error => console.error('Error:', error));
});
