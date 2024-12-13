document.addEventListener("DOMContentLoaded", () => {
    loadCart();

    function loadCart() {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const cartItemsContainer = document.getElementById("cart-items");
        const cartTotal = document.getElementById("cart-total");
        const cartMessage = document.getElementById("cart-message");
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Your cart is empty!</p>";
            cartMessage.classList.remove("d-none");
            cartMessage.textContent = "Your cart is currently empty. Add items to proceed.";
            return;
        }

        cartMessage.classList.add("d-none");
        cartItemsContainer.innerHTML = cart.map(item => {
            const price = parseFloat(item.price) || 0;
            const totalItemPrice = price * item.quantity;

            return `
                <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <div>
                        <h5>${item.name}</h5>
                        <p>Weight: ${item.weight}g</p>
                        <p>Price per weight: $${price.toFixed(2)}</p>
                        <div>
                            <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity('${item.id}', '${item.weight}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity('${item.id}', '${item.weight}', 1)">+</button>
                            <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}', '${item.weight}')">Remove</button>
                        </div>
                    </div>
                    <p><strong>Total: $${totalItemPrice.toFixed(2)}</strong></p>
                </div>
            `;
        }).join("");

        cart.forEach(item => {
            total += parseFloat(item.price) * item.quantity;
        });

        cartTotal.textContent = total.toFixed(2);
    }

    window.updateQuantity = (id, weight, delta) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const item = cart.find(item => item.id === id && item.weight === weight);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(id, weight);
            } else {
                localStorage.setItem("cart", JSON.stringify(cart));
                loadCart();
            }
        }
    };

    window.removeFromCart = (id, weight) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart = cart.filter(item => !(item.id === id && item.weight === weight));
        localStorage.setItem("cart", JSON.stringify(cart));
        loadCart();
    };

    // ฟังก์ชันสำหรับ Checkout
    document.getElementById("confirm-checkout").addEventListener("click", () => {
        const recipientName = document.getElementById("recipient-name").value;
        const address = document.getElementById("address").value;
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const total = document.getElementById("cart-total").innerText;

        if (!recipientName || !address) {
            alert("Please fill in all fields!");
            return;
        }

        fetch("/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient_name: recipientName, address, cart, total })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // แสดง QR Code
                document.getElementById("qr-code-image").src = data.qrCodeUrl;
                document.getElementById("qr-code-total").innerText = total;
                const qrCodeModal = new bootstrap.Modal(document.getElementById("qrCodeModal"));
                qrCodeModal.show();

                // ล้างข้อมูล Cart
                localStorage.removeItem("cart");
                loadCart();

                // ปิด Modal ของการกรอกข้อมูล
                const checkoutModal = bootstrap.Modal.getInstance(document.getElementById("checkoutModal"));
                checkoutModal.hide();
            } else {
                alert("Checkout failed: " + data.error);
            }
        })
        .catch(err => console.error("Error during checkout:", err));
    });
});
