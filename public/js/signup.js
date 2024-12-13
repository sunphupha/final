document.getElementById("create-account-form").addEventListener("submit", function(event) {
    // ปิดข้อความผิดพลาดก่อน
    document.querySelectorAll('.error-message').forEach(el => el.textContent = "");

    // รับค่าจาก input fields
    const full_name = document.getElementById('full_name').value.trim();
    const date_of_birth = document.getElementById('date_of_birth').value.trim();
    const phone_number = document.getElementById('phone_number').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const retypePassword = document.getElementById('retypePassword').value.trim();
    const ageVerified = document.getElementById('ageVerified').checked;

    let hasError = false;

    // ฟังก์ชันแสดงข้อผิดพลาด
    function showError(inputId, message) {
        const errorElement = document.getElementById(inputId + '-error');
        errorElement.textContent = message;
        hasError = true;
    }

    // Validate full name
    if (!full_name) {
        showError('full_name', 'กรุณากรอกชื่อเต็ม');
    }

    // Validate date of birth (อายุ 20 ปีขึ้นไป)
    const age = new Date().getFullYear() - new Date(date_of_birth).getFullYear();
    if (age < 20) {
        showError('date_of_birth', 'คุณต้องมีอายุ 20 ปีขึ้นไป');
    }

    // Validate phone number (รูปแบบเบอร์โทรศัพท์)
    const phonePattern = /^\d{10}$/;
    if (!phone_number) {
        showError('phone_number', 'กรุณากรอกเบอร์โทรศัพท์');
    } else if (!phonePattern.test(phone_number)) {
        showError('phone_number', 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
    }

    // Validate email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
        showError('email', 'กรุณากรอกอีเมล');
    } else if (!emailPattern.test(email)) {
        showError('email', 'กรุณากรอกอีเมลให้ถูกต้อง');
    }

    // Validate password
    if (!password) {
        showError('password', 'กรุณากรอกรหัสผ่าน');
    }

    // Validate retype password
    if (password !== retypePassword) {
        showError('retypePassword', 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
    }

    // Validate age verification
    if (!ageVerified) {
        showError('ageVerified', 'กรุณายืนยันว่าคุณมีอายุ 20 ปีขึ้นไป');
    }

    // ถ้ามีข้อผิดพลาดจะไม่ส่งฟอร์ม
    if (hasError) {
        event.preventDefault(); // หยุดการส่งฟอร์ม
    }
});
