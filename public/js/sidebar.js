document.addEventListener("DOMContentLoaded", () => {
    const hamburgerIcon = document.getElementById("hamburger-icon");
    const sidebar = document.getElementById("sidebar");
    const closeIcon = document.getElementById("close-icon");

    // เปิด/ปิด Sidebar ด้วย Hamburger Icon
    hamburgerIcon.addEventListener("click", () => {
        if (sidebar.classList.contains("active")) {
            sidebar.classList.remove("active"); // ถ้า Sidebar เปิดอยู่ ให้ปิด
        } else {
            sidebar.classList.add("active"); // ถ้า Sidebar ปิดอยู่ ให้เปิด
        }
    });

    // ปิด Sidebar ด้วย Close Icon
    closeIcon.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });

    // คลิกนอก Sidebar เพื่อปิด
    window.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !hamburgerIcon.contains(e.target)) {
            sidebar.classList.remove("active");
        }
    });
});
