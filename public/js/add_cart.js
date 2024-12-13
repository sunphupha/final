let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ฟังก์ชันเพิ่มสินค้าในตะกร้า
function addToCart(id, name, basePrice, weight) {
    // คำนวณราคาตามน้ำหนัก
    const weightOptions = {
        '3.5': 1,  // multiplier สำหรับ 3.5 กรัม
        '7': 2,    // multiplier สำหรับ 7 กรัม
        '14': 4,   // multiplier สำหรับ 14 กรัม
        '28': 8    // multiplier สำหรับ 1 ออนซ์ (28 กรัม)
    };
    const multiplier = weightOptions[weight];
    const price = basePrice * multiplier;

    const existingItem = cart.find((item) => item.id === id && item.weight === weight);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, weight, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

// ฟังก์ชันอัปเดตจำนวนสินค้าใน Cart Icon
function updateCartCount() {
    const cartIcon = document.getElementById("cart-icon");
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartIcon.setAttribute("data-quantity", totalItems);
}

document.addEventListener("DOMContentLoaded", updateCartCount);
