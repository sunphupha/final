document.addEventListener("DOMContentLoaded", () => {
    // ฟังก์ชันคำนวณราคาตามน้ำหนัก
    function calculatePrice(basePrice, weight) {
        const weightOptions = {
            '3.5': 1,  // multiplier สำหรับ 3.5 กรัม
            '7': 2,    // multiplier สำหรับ 7 กรัม
            '14': 4,   // multiplier สำหรับ 14 กรัม
            '28': 8    // multiplier สำหรับ 1 ออนซ์ (28 กรัม)
        };
        const multiplier = weightOptions[weight];
        return basePrice * multiplier;
    }

    // ฟังก์ชัน Buy Now
    window.buyNow = (productId, productName, basePrice, selectedWeight) => {
        console.log("Product ID:", productId);
        console.log("Product Name:", productName);
        console.log("Base Price:", basePrice);
        console.log("Selected Weight:", selectedWeight);

        const price = calculatePrice(basePrice, selectedWeight);

        console.log("Calculated Price:", price);

        // ตรวจสอบว่า Modal มีหรือไม่
        const checkoutModal = new bootstrap.Modal(document.getElementById("checkoutModal"), {});
        if (!checkoutModal) {
            console.error("Checkout Modal is not defined.");
            return;
        }

        // แสดงข้อมูลสินค้าใน Modal
        document.getElementById("checkout-product-id").value = productId;
        document.getElementById("checkout-product-name").textContent = productName;
        document.getElementById("checkout-product-price").textContent = `$${price.toFixed(2)}`;
        document.getElementById("checkout-total-price").value = price;

        // แสดง Modal
        checkoutModal.show();
    };

    // ฟังก์ชัน Confirm Checkout
    document.getElementById("confirm-checkout").addEventListener("click", () => {
        const recipientName = document.getElementById("recipient-name").value;
        const address = document.getElementById("address").value;
        const productId = document.getElementById("checkout-product-id").value;
        const totalPrice = document.getElementById("checkout-total-price").value;

        if (!recipientName || !address) {
            alert("Please fill in all required fields.");
            return;
        }

        fetch("/buy-now/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient_name: recipientName,
                address: address,
                product_id: productId,
                total: totalPrice,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // แสดง QR Code
                document.getElementById("qr-code-image").src = data.qrCodeUrl;
                document.getElementById("qr-code-total").textContent = `$${totalPrice}`;
                const qrCodeModal = new bootstrap.Modal(document.getElementById("qrCodeModal"));
                qrCodeModal.show();

                // ปิด Modal Checkout
                const checkoutModal = bootstrap.Modal.getInstance(document.getElementById("checkoutModal"));
                checkoutModal.hide();
            } else {
                alert("Checkout failed: " + data.error);
            }
        })
        .catch(err => console.error("Error during checkout:", err));
    });
});
