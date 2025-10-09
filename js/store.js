import { db, auth } from './firebase.js';

// Store management functions
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    let cart = JSON.parse(localStorage.getItem('vema_cart')) || [];
    
    // Load user's discount
    function loadUserDiscount() {
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const discount = userData.storeDiscount || 0;
                    const savingsTotal = userData.savingsTotal || 0;
                    
                    if (document.getElementById('member-discount')) {
                        document.getElementById('member-discount').textContent = discount;
                    }
                    
                    if (document.getElementById('cart-discount-percent')) {
                        document.getElementById('cart-discount-percent').textContent = discount;
                    }
                    
                    if (document.getElementById('savings-amount')) {
                        if (savingsTotal >= 10000) {
                            document.getElementById('savings-amount').textContent = 'R10,000+';
                        } else if (savingsTotal >= 5000) {
                            document.getElementById('savings-amount').textContent = 'R5,000+';
                        } else {
                            document.getElementById('savings-amount').textContent = 'Less than R5,000';
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error loading user discount:', error);
            });
    }
    
    // Load products from Firestore
    function loadProducts() {
        db.collection('products').get()
            .then(querySnapshot => {
                const productsGrid = document.getElementById('products-grid');
                if (!productsGrid) return;
                
                productsGrid.innerHTML = '';
                
                if (querySnapshot.empty) {
                    productsGrid.innerHTML = `
                        <div class="col-span-4 text-center py-8 text-gray-500">
                            No products available at the moment.
                        </div>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const product = doc.data();
                    const productId = doc.id;
                    
                    const productCard = document.createElement('div');
                    productCard.className = 'bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow';
                    productCard.innerHTML = `
                        <div class="bg-gray-200 h-48 mb-4 rounded flex items-center justify-center">
                            <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}" class="h-full object-cover">
                        </div>
                        <h3 class="font-semibold mb-1">${product.name}</h3>
                        <p class="text-gray-600 text-sm mb-2">${product.category || 'Uncategorized'}</p>
                        <div class="flex justify-between items-center">
                            <span class="font-bold">R${product.price?.toLocaleString('en-ZA') || '0.00'}</span>
                            <button class="text-blue-600 hover:text-blue-800 view-product" data-id="${productId}">View</button>
                        </div>
                    `;
                    productsGrid.appendChild(productCard);
                });
                
                // Add event listeners to view buttons
                document.querySelectorAll('.view-product').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const productId = button.dataset.id;
                        viewProductDetails(productId);
                    });
                });
            })
            .catch(error => {
                console.error('Error loading products:', error);
            });
    }
    
    // View product details
    function viewProductDetails(productId) {
        db.collection('products').doc(productId).get()
            .then(doc => {
                if (doc.exists) {
                    const product = doc.data();
                    
                    // Update modal with product details
                    document.getElementById('product-modal-title').textContent = product.name;
                    document.getElementById('product-modal-category').textContent = product.category || 'Uncategorized';
                    document.getElementById('product-modal-image').src = product.image || 'https://via.placeholder.com/500';
                    document.getElementById('product-modal-description').textContent = 
                        product.description || 'No description available.';
                    document.getElementById('product-modal-price').textContent = 
                        `R${product.price?.toLocaleString('en-ZA') || '0.00'}`;
                    document.getElementById('product-modal-stock').textContent = product.stock || 0;
                    
                    // Reset quantity
                    document.getElementById('product-qty').value = 1;
                    
                    // Show modal
                    document.getElementById('product-modal').classList.remove('hidden');
                    
                    // Set up add to cart button
                    const addToCartBtn = document.getElementById('add-to-cart');
                    if (addToCartBtn) {
                        addToCartBtn.onclick = () => {
                            const quantity = parseInt(document.getElementById('product-qty').value);
                            addToCart(productId, product, quantity);
                            document.getElementById('product-modal').classList.add('hidden');
                        };
                    }
                    
                    // Set up buy now button
                    const buyNowBtn = document.getElementById('buy-now');
                    if (buyNowBtn) {
                        buyNowBtn.onclick = () => {
                            const quantity = parseInt(document.getElementById('product-qty').value);
                            addToCart(productId, product, quantity);
                            document.getElementById('product-modal').classList.add('hidden');
                            showCart();
                        };
                    }
                }
            })
            .catch(error => {
                console.error('Error loading product details:', error);
            });
    }
    
    // Quantity controls
    const decreaseQty = document.getElementById('decrease-qty');
    const increaseQty = document.getElementById('increase-qty');
    const productQty = document.getElementById('product-qty');
    
    if (decreaseQty && increaseQty && productQty) {
        decreaseQty.addEventListener('click', () => {
            let qty = parseInt(productQty.value);
            if (qty > 1) {
                productQty.value = qty - 1;
            }
        });
        
        increaseQty.addEventListener('click', () => {
            let qty = parseInt(productQty.value);
            productQty.value = qty + 1;
        });
    }
    
    // Close product modal
    const closeProductModal = document.getElementById('close-product-modal');
    if (closeProductModal) {
        closeProductModal.addEventListener('click', () => {
            document.getElementById('product-modal').classList.add('hidden');
        });
    }
    
    // Add to cart function
    function addToCart(productId, product, quantity = 1) {
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        // Save to localStorage
        localStorage.setItem('vema_cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show success message
        alert(`${quantity} ${product.name} added to cart!`);
    }
    
    // Update cart count in UI
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = count;
    }
    
    // Show cart sidebar
    function showCart() {
        const cartItems = document.getElementById('cart-items');
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
        } else {
            let subtotal = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                const cartItem = document.createElement('div');
                cartItem.className = 'flex justify-between items-center mb-4 pb-4 border-b';
                cartItem.innerHTML = `
                    <div class="flex items-center">
                        <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                        <div class="ml-3">
                            <h4 class="font-medium">${item.name}</h4>
                            <p class="text-gray-600 text-sm">R${item.price.toLocaleString('en-ZA')} x ${item.quantity}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold">R${itemTotal.toLocaleString('en-ZA')}</p>
                        <button class="text-red-500 text-sm remove-item" data-id="${item.id}">Remove</button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
            
            // Calculate discount (from user's profile)
            const discountPercent = parseInt(document.getElementById('cart-discount-percent').textContent) || 0;
            const discountAmount = subtotal * (discountPercent / 100);
            const total = subtotal - discountAmount;
            
            // Update totals
            document.getElementById('cart-subtotal').textContent = `R${subtotal.toLocaleString('en-ZA')}`;
            document.getElementById('cart-discount').textContent = `-R${discountAmount.toLocaleString('en-ZA')}`;
            document.getElementById('cart-total').textContent = `R${total.toLocaleString('en-ZA')}`;
            document.getElementById('checkout-total').textContent = `R${total.toLocaleString('en-ZA')}`;
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const productId = button.dataset.id;
                    removeFromCart(productId);
                });
            });
        }
        
        // Show cart
        document.getElementById('cart-sidebar').classList.remove('translate-x-full');
    }
    
    // Remove from cart
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('vema_cart', JSON.stringify(cart));
        updateCartCount();
        showCart();
    }
    
    // Cart button click
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCart();
        });
    }
    
    // Close cart
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            document.getElementById('cart-sidebar').classList.add('translate-x-full');
        });
    }
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Your cart is empty');
                return;
            }
            
            document.getElementById('cart-sidebar').classList.add('translate-x-full');
            document.getElementById('checkout-modal').classList.remove('hidden');
        });
    }
    
    // Close checkout modal
    const closeCheckoutModal = document.getElementById('close-checkout-modal');
    if (closeCheckoutModal) {
        closeCheckoutModal.addEventListener('click', () => {
            document.getElementById('checkout-modal').classList.add('hidden');
        });
    }
    
    const cancelCheckout = document.getElementById('cancel-checkout');
    if (cancelCheckout) {
        cancelCheckout.addEventListener('click', () => {
            document.getElementById('checkout-modal').classList.add('hidden');
        });
    }
    
    // Checkout form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const shippingAddress = checkoutForm.querySelector('textarea').value;
            const paymentMethod = checkoutForm.querySelector('select').value;
            
            if (!shippingAddress || !paymentMethod) {
                alert('Please fill in all fields');
                return;
            }
            
            // Create order in Firestore
            const orderData = {
                userId: userId,
                items: cart,
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod,
                status: 'processing',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                total: parseFloat(document.getElementById('checkout-total').textContent.replace('R', '').replace(',', ''))
            };
            
            db.collection('orders').add(orderData)
                .then(() => {
                    // Clear cart
                    cart = [];
                    localStorage.setItem('vema_cart', JSON.stringify(cart));
                    updateCartCount();
                    
                    // Hide modals
                    document.getElementById('checkout-modal').classList.add('hidden');
                    
                    // Show success message
                    alert('Order placed successfully! Thank you for your purchase.');
                })
                .catch(error => {
                    console.error('Error creating order:', error);
                    alert('Error placing order: ' + error.message);
                });
        });
    }
    
    // Initial load
    loadUserDiscount();
    loadProducts();
    updateCartCount();
});