// ==========================================
// 1. STATE MANAGEMENT & INITIALIZATION
// ==========================================
const sessionUserEmail = localStorage.getItem('track_session_user');

// ĐỒNG BỘ: Tải dữ liệu giỏ hàng, wishlist, đơn hàng của RIÊNG user đang đăng nhập
let registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
let currentUserData = registeredUsers.find(u => u.email === sessionUserEmail) || {};

const state = {
    products: [],
    // Lấy data từ tài khoản, nếu chưa có thì để mảng rỗng []
    cart: currentUserData.cart || [],
    wishlist: currentUserData.wishlist || [],
    orders: currentUserData.orders || [],
    
    userProfile: JSON.parse(localStorage.getItem('petopia_user_profile')) || {},
    user: sessionUserEmail ? { name: sessionUserEmail.split('@')[0], email: sessionUserEmail } : null,
    filters: { search: '', category: 'all', type: 'all', brand: 'all' },
    pagination: { currentPage: 1, itemsPerPage: 30 },
    isDarkMode: localStorage.getItem('petopia_darkmode') === 'true'
};

document.addEventListener('DOMContentLoaded', () => {
    applyDarkMode();
    updateAuthUI();
    fetchProductsAPI(); // Đã đổi tên hàm gọi API Backend
    updateBadges();
});


// ==========================================
// 2. AUTHENTICATION & PROFILE
// ==========================================
function openAuthModal() {
    window.location.href = 'login.html'; 
}

function checkLoginStatus() {
    const currentUser = localStorage.getItem("currentUser");
    return currentUser ? JSON.parse(currentUser) : null;
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('track_session_user');
    localStorage.removeItem('petopia_user_profile'); 
    localStorage.removeItem('currentUser'); 
    
    state.cart = [];
    state.wishlist = [];
    state.orders = [];
    
    updateAuthUI();
    updateBadges(); 
    processAndRenderProducts(); 
    
    showToast("Đã đăng xuất");
    switchTab('shop');
}

function updateAuthUI() {
    const authSection = document.getElementById('userAuthSection');
    if (!authSection) return;
    
    const googleUser = checkLoginStatus();
    if (googleUser || state.user) {
        const displayName = googleUser ? googleUser.name : state.user.name;
        authSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="nav-btn" onclick="switchTab('account')" style="font-weight: 600; font-size: 14px; color: var(--primary-orange);">
                    <i class="fas fa-user-cog"></i> ${displayName}
                </button>
                <button class="nav-btn" onclick="handleLogout()" style="padding: 5px; color: var(--text-grey);" title="Đăng xuất">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <button class="nav-btn" onclick="openAuthModal()">
                <i class="fas fa-user-circle"></i> Đăng nhập
            </button>
        `;
    }
}

function renderAccountTab() {
    if (!checkLoginStatus() && !state.user) {
        showToast("Vui lòng đăng nhập để xem thông tin tài khoản!", "error");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const email = localStorage.getItem('track_session_user');
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const matchedUser = registeredUsers.find(u => u.email === email);

    if (matchedUser) {
        document.getElementById('profileName').value = state.userProfile.name || matchedUser.name || '';
        document.getElementById('profilePhone').value = state.userProfile.phone || matchedUser.phone || '';
        document.getElementById('profileAddress').value = state.userProfile.address || matchedUser.address || '';
    } else {
        const googleUser = checkLoginStatus();
        document.getElementById('profileName').value = state.userProfile.name || (googleUser ? googleUser.name : '');
        document.getElementById('profilePhone').value = state.userProfile.phone || '';
        document.getElementById('profileAddress').value = state.userProfile.address || '';
    }
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();

    if (!name || !phone || !address) {
        showToast("Vui lòng điền đầy đủ thông tin!", "error");
        return;
    }

    state.userProfile = { name, phone, address };
    localStorage.setItem('petopia_user_profile', JSON.stringify(state.userProfile));

    const email = localStorage.getItem('track_session_user');
    if (email) {
        let registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const index = registeredUsers.findIndex(u => u.email === email);
        if (index !== -1) {
            registeredUsers[index].name = name;
            registeredUsers[index].phone = phone;
            registeredUsers[index].address = address;
            localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
        }
    }

    showToast("Đã lưu thông tin giao hàng mặc định!", "success");
}


// =================================================================
// 3. PRODUCT FETCHING & PARSING (API NODEJS & MONGODB)
// =================================================================
async function fetchProductsAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        
        if (!response.ok) {
            throw new Error('Không thể kết nối lấy dữ liệu từ Server Backend');
        }

        const rawProducts = await response.json();
        chuanHoaDuLieuSanPham(rawProducts);

    } catch (error) {
        console.error('❌ Lỗi kết nối API Backend:', error);
        showToast('Không thể kết nối đến máy chủ dữ liệu!', 'error');
    }
}

function chuanHoaDuLieuSanPham(productsList) {
    const parsedProducts = [];
    const brandCounts = {};

    productsList.forEach(item => {
        const id = item.id || item._id; 
        const name = item.name || "";
        const brand = item.brand || "Khác";
        const image = item.image || "";
        const priceStr = item.price || "0đ";
        const origPriceStr = item.original_price || "";
        const discount = item.discount || "";
        const description = item.description || null; // Lấy dữ liệu description

        if (brand) {
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }

        const nameLower = name.toLowerCase();
        let category = "Chó";
        if (nameLower.includes("mèo") && !nameLower.includes("chó")) category = "Mèo";
        else if (nameLower.includes("mèo") && nameLower.includes("chó")) category = "Chó/Mèo";

        let type = "Đồ dùng";
        if (nameLower.includes("hạt") || nameLower.includes("thức ăn") || nameLower.includes("sữa")) type = "Thức ăn";
        else if (nameLower.includes("bánh thưởng") || nameLower.includes("snack") || nameLower.includes("xương")) type = "Snack";

        const rating = (Math.random() * (5 - 4) + 4).toFixed(1);
        const reviewsCount = Math.floor(Math.random() * 500) + 10;
        const stock = Math.floor(Math.random() * 60);

        parsedProducts.push({
            id, name, brand, image, priceStr, origPriceStr, discount,
            category, type, rating, reviewsCount, stock, description,
            priceNum: parsePrice(priceStr)
        });
    });

    state.products = parsedProducts;
    console.log(`🎉 Đã tải thành công ${state.products.length} sản phẩm từ MongoDB!`);
    
    renderBrandFilter(brandCounts);
    processAndRenderProducts();
}

function parsePrice(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\D/g, '')) || 0;
}


// ==========================================
// 4. RENDERING & FILTERS
// ==========================================
function renderBrandFilter(brandCounts) {
    const ul = document.getElementById('filter-brand');
    if(!ul) return;
    
    let html = `<li class="active" onclick="applyFilter('brand', 'all')" style="display: flex; justify-content: space-between; align-items: center;">
        <span><i class="fas fa-tags"></i> Tất cả</span>
        <span style="font-size: 12px; color: var(--text-grey); background: var(--border-color); padding: 2px 6px; border-radius: 10px;">${state.products.length}</span>
    </li>`;
    
    const sortedBrands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]);
    const topBrands = sortedBrands.slice(0, 10);

    topBrands.forEach(brand => {
        html += `<li onclick="applyFilter('brand', '${brand.replace(/'/g, "\\'")}')" style="display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fas fa-tag"></i> ${brand}</span>
            <span style="font-size: 12px; color: var(--text-grey); background: var(--border-color); padding: 2px 6px; border-radius: 10px;">${brandCounts[brand]}</span>
        </li>`;
    });
    ul.innerHTML = html;
}

function applyFilter(type, value) {
    state.filters[type] = value;
    state.pagination.currentPage = 1;

    if (type !== 'search') {
        const lis = document.getElementById(`filter-${type}`).querySelectorAll('li');
        lis.forEach(li => li.classList.remove('active'));
        event.currentTarget.classList.add('active');

        if (type === 'brand' && value !== 'all') {
            state.filters.category = 'all';
            const catFilter = document.getElementById('filter-category');
            if (catFilter) {
                const catLis = catFilter.querySelectorAll('li');
                catLis.forEach(li => li.classList.remove('active'));
                if(catLis.length > 0) catLis[0].classList.add('active');
            }
        }
    }
    processAndRenderProducts();
}

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        state.filters.search = document.getElementById('searchInput').value.toLowerCase().trim();
        state.pagination.currentPage = 1;
        switchTab('home');
        processAndRenderProducts();
    }, 300);
}

function processAndRenderProducts() {
    let filtered = state.products.filter(p => {
        if (state.filters.search && !p.name.toLowerCase().includes(state.filters.search) && !p.brand.toLowerCase().includes(state.filters.search)) return false;
        if (state.filters.category !== 'all' && p.category !== state.filters.category && p.category !== 'Chó/Mèo') return false;
        if (state.filters.type !== 'all' && p.type !== state.filters.type) return false;
        if (state.filters.brand !== 'all' && p.brand !== state.filters.brand) return false;
        return true;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / state.pagination.itemsPerPage);
    if (state.pagination.currentPage > totalPages) state.pagination.currentPage = totalPages || 1;

    const startIdx = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const endIdx = startIdx + state.pagination.itemsPerPage;
    const paginatedItems = filtered.slice(startIdx, endIdx);

    renderGrid(paginatedItems, 'productGrid');
    renderPaginationControls(totalPages);
}

function renderGrid(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Không tìm thấy sản phẩm nào.</p></div>`;
        return;
    }

    container.innerHTML = items.map(p => {
        const inWishlist = state.wishlist.includes(p.id);
        const outOfStock = p.stock === 0;
        const stars = generateStars(p.rating);

        return `
        <div class="product-card" onclick="openProductModal('${p.id}')">
            ${p.discount ? `<div class="sale-badge">${p.discount}</div>` : ''}
            <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="toggleWishlist(event, '${p.id}')">
                <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="product-img-wrapper">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-title">${p.name}</div>
                <div class="product-rating">${stars} <span>(${p.reviewsCount})</span></div>
                <div class="price-wrapper">
                    <span class="product-price">${p.priceStr}</span>
                    ${p.origPriceStr ? `<span class="product-original-price">${p.origPriceStr}</span>` : ''}
                </div>
                <button class="btn-add-cart" onclick="addToCart(event, '${p.id}')" ${outOfStock ? 'disabled' : ''}>
                    ${outOfStock ? 'Hết hàng' : '<i class="fas fa-shopping-cart"></i> Thêm vào giỏ'}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === state.pagination.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    state.pagination.currentPage = page;
    processAndRenderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ==========================================
// 5. WISHLIST MANAGEMENT
// ==========================================
function toggleWishlist(e, id) {
    if (e) e.stopPropagation();

    if (!checkLoginStatus() && !state.user) {
        showToast("Vui lòng đăng nhập để lưu yêu thích!", "error");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const index = state.wishlist.indexOf(id);
    if (index > -1) {
        state.wishlist.splice(index, 1);
        showToast("Đã bỏ khỏi danh sách yêu thích");
    } else {
        state.wishlist.push(id);
        showToast("Đã thêm vào yêu thích");
    }
    saveState('petopia_wishlist', state.wishlist);
    updateBadges();
    processAndRenderProducts();
    if (document.getElementById('tab-wishlist') && document.getElementById('tab-wishlist').classList.contains('active')) renderWishlistTab();
}

function renderWishlistTab() {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;
    if (state.wishlist.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-heart-broken" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-grey);">Bạn chưa có sản phẩm yêu thích nào!</h3>
            </div>`;
        return;
    }

    let html = '';
    state.wishlist.forEach(id => {
        const product = state.products.find(p => p.id === id);
        if (product) {
            html += `
                <div class="product-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="product-img-wrap" style="position: relative;">
                            <img src="${product.image}" class="product-img" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;">
                            <button class="wishlist-btn active" onclick="toggleWishlist(event, '${product.id}')" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; color: var(--danger-color); box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                        <div class="product-info" style="padding: 15px;">
                            <h3 class="product-title" style="font-size: 14px; margin-bottom: 5px; height: 40px; overflow: hidden;">${product.name}</h3>
                            <div class="product-price" style="color: var(--primary-orange); font-weight: bold; font-size: 16px;">${product.priceStr}</div>
                        </div>
                    </div>
                    <div style="padding: 0 15px 15px 15px;">
                        <button class="btn-add-cart" onclick="addToCart(event, '${product.id}')" style="width: 100%; padding: 10px; border-radius: 5px;">
                            <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                        </button>
                    </div>
                </div>
            `;
        }
    });
    grid.innerHTML = html;
}


// ==========================================
// 6. CART & CHECKOUT
// ==========================================
function addToCart(e, id) {
    if (e) e.stopPropagation();

    // KIỂM TRA ĐĂNG NHẬP
    if (!checkLoginStatus() && !state.user) {
        showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!", "error");
        
        // Lưu sản phẩm chờ mua vào LocalStorage trước khi nhảy sang login
        localStorage.setItem("pending_cart_item", JSON.stringify({ id: id, qty: 1 }));
        
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        return;
    }

    const product = state.products.find(p => p.id === id);
    if (!product || product.stock === 0) {
        showToast("Sản phẩm đã hết hàng hoặc không tồn tại!", "error");
        return;
    }

    const cartItem = state.cart.find(c => c.id === id);
    if (cartItem) {
        if (cartItem.qty >= product.stock) {
            showToast("Đã đạt giới hạn tồn kho!", "error");
            return;
        }
        cartItem.qty += 1;
    } else {
        state.cart.push({ id, qty: 1 });
    }
    saveState('petopia_cart', state.cart);
    updateBadges();
    showToast("Đã thêm vào giỏ hàng");
    if (document.getElementById('tab-cart') && document.getElementById('tab-cart').classList.contains('active')) renderCartTab();
}

function updateCartQty(id, delta) {
    const item = state.cart.find(c => c.id === id);
    const product = state.products.find(p => p.id === id);
    if (item && product) {
        const newQty = item.qty + delta;
        if (newQty > product.stock) {
            showToast("Không đủ số lượng tồn kho!", "error");
            return;
        }
        item.qty = newQty;
        if (item.qty <= 0) {
            state.cart = state.cart.filter(c => c.id !== id);
        }
        saveState('petopia_cart', state.cart);
        updateBadges();
        renderCartTab();
    }
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    saveState('petopia_cart', state.cart);
    updateBadges();
    renderCartTab();
    showToast("Đã xóa sản phẩm khỏi giỏ hàng");
}

function renderCartTab() {
    const container = document.getElementById('cartContainer');
    if (!container) return;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px 20px;">
                <i class="fas fa-shopping-cart" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-grey);">Giỏ hàng của bạn đang trống!</h3>
                <button class="btn-checkout" style="width: auto; padding: 10px 20px; margin-top: 15px;" onclick="switchTab('home')">Về cửa hàng</button>
            </div>`;
        return;
    }

    let html = '';
    let total = 0;

    state.cart.forEach((item, index) => {
        const product = state.products.find(p => p.id === item.id);
        if (product) {
            const itemTotal = product.priceNum * item.qty;
            total += itemTotal;

            html += `
                <div style="display: flex; gap: 15px; border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; margin-bottom: 15px; background: white; align-items: center;">
                    <img src="${product.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid #eee;">
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 5px; font-size: 16px; color: var(--text-main);">${product.name}</h4>
                        <p style="color: var(--primary-orange); font-weight: bold; margin-bottom: 5px;">${product.priceStr}</p>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 14px; color: var(--text-grey);">Số lượng: <b>${item.qty}</b></span>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 20px; padding: 10px;" title="Xóa sản phẩm">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        }
    });

    html += `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid var(--border-color); text-align: right; margin-top: 20px;">
            <div style="font-size: 18px; margin-bottom: 15px;">
                <span>Tổng tiền tạm tính: </span>
                <span style="color: var(--primary-orange); font-weight: bold; font-size: 24px;">${total.toLocaleString('vi-VN')}đ</span>
            </div>
            <button class="btn-checkout" style="padding: 15px 30px; font-size: 18px; border-radius: 8px; cursor: pointer;" onclick="checkout()">
                <i class="fas fa-money-check-alt"></i> Tiến hành thanh toán
            </button>
        </div>
    `;
    container.innerHTML = html;
}

function checkout() {
    const googleUser = checkLoginStatus();
    if (!googleUser && !state.user) {
        showToast("Vui lòng đăng nhập để tiến hành thanh toán!", "error");
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    if (state.cart.length === 0) {
        showToast("Giỏ hàng của bạn đang trống!", "error");
        return;
    }

    const total = state.cart.reduce((sum, item) => {
        const product = state.products.find(p => p.id === item.id);
        if (product) return sum + (product.priceNum * item.qty);
        return sum;
    }, 0);

    if (document.getElementById('checkoutName')) {
        const email = googleUser ? googleUser.email : state.user.email;
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const matchedUser = registeredUsers.find(u => u.email === email);

        if (state.userProfile && state.userProfile.name) {
            document.getElementById('checkoutName').value = state.userProfile.name;
            document.getElementById('checkoutPhone').value = state.userProfile.phone || '';
            document.getElementById('checkoutAddress').value = state.userProfile.address || '';
        } else if (matchedUser) {
            document.getElementById('checkoutName').value = matchedUser.name || '';
            document.getElementById('checkoutPhone').value = matchedUser.phone || '';
            document.getElementById('checkoutAddress').value = matchedUser.address || '';
        } else if (googleUser) {
            document.getElementById('checkoutName').value = googleUser.name;
        } else if (state.user) {
            document.getElementById('checkoutName').value = state.user.name;
        }

        document.getElementById('checkoutTotal').innerText = total.toLocaleString('vi-VN') + 'đ';
        document.getElementById('checkoutModal').classList.add('show');
    } else {
        showToast("Lỗi: Chưa tìm thấy HTML của bảng thanh toán!", "error");
    }
}

function confirmCheckout() {
    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();

    // 1. Kiểm tra bắt buộc nhập Tên
    if (!name) {
        showToast("Vui lòng nhập Họ và tên người nhận!", "error");
        document.getElementById('checkoutName').focus(); // Tự động trỏ chuột vào ô bị thiếu
        return;
    }

    // 2. Kiểm tra Số điện thoại (bắt buộc nhập & phải đúng 10 số)
    const phoneRegex = /^\d{10}$/; // Biểu thức chính quy: Kiểm tra chuỗi có đúng 10 chữ số (từ 0-9) hay không
    if (!phone) {
        showToast("Vui lòng nhập Số điện thoại!", "error");
        document.getElementById('checkoutPhone').focus();
        return;
    } else if (!phoneRegex.test(phone)) {
        showToast("Số điện thoại không hợp lệ! Vui lòng nhập chính xác 10 số.", "error");
        document.getElementById('checkoutPhone').focus();
        return;
    }

    // 3. Kiểm tra bắt buộc nhập Địa chỉ
    if (!address) {
        showToast("Vui lòng nhập Địa chỉ giao hàng chi tiết!", "error");
        document.getElementById('checkoutAddress').focus();
        return;
    }

    // Nếu dữ liệu đã hợp lệ, tiến hành chốt đơn
    const payMethodElement = document.querySelector('input[name="payMethod"]:checked');
    const payMethod = payMethodElement ? payMethodElement.value : "COD"; // Mặc định là COD nếu lỗi

    const newOrder = {
        orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
        date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN'),
        items: [...state.cart],
        status: 1, // 1: Chờ xác nhận
        customer: { name, phone, address },
        paymentMethod: payMethod
    };

    // Thêm đơn hàng mới vào danh sách
    state.orders.unshift(newOrder);
    saveState('petopia_orders', state.orders);

    // Làm rỗng giỏ hàng sau khi đặt thành công
    state.cart = [];
    saveState('petopia_cart', state.cart);
    updateBadges();

    // Đóng Modal và thông báo thành công
    closeModal('checkoutModal');
    showToast("Đặt hàng thành công!");
    
    // Chuyển sang Tab Đơn hàng để xem
    switchTab('orders');
}

// ==========================================
// 7. ORDERS TRACKING
// ==========================================
function renderOrdersTab() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (state.orders.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box"></i><p>Bạn chưa có đơn hàng nào.</p></div>`;
        return;
    }

    let html = '';
    state.orders.forEach((o, index) => {
        const s1 = o.status >= 1 ? 'active' : '';
        const s2 = o.status >= 2 ? 'active' : '';
        const s3 = o.status >= 3 ? 'active' : '';

        let itemsText = o.items.map(i => {
            const p = state.products.find(x => x.id === i.id);
            return p ? `${p.name} (x${i.qty})` : 'Sản phẩm không xác định';
        }).join(', ');

        let payMethodText = "Không xác định";
        if (o.paymentMethod === 'BANK') payMethodText = 'Chuyển khoản';
        else if (o.paymentMethod === 'MOMO') payMethodText = 'Ví MoMo';
        else if (o.paymentMethod === 'COD') payMethodText = 'Tiền mặt (COD)';

        html += `
        <div class="order-card">
            <div class="order-header">
                <span>Mã đơn: ${o.orderId} - <span style="font-size: 13px; color: var(--text-grey); font-weight: normal">${o.date}</span></span>
                <span class="order-status">${o.status === 1 ? 'Chờ xác nhận' : (o.status === 2 ? 'Đang giao hàng' : 'Đã hoàn tất')}</span>
            </div>
            
            <p style="font-size: 13px; color: var(--primary-orange); margin-bottom: 5px;"><i class="fas fa-wallet"></i> Thanh toán: ${payMethodText}</p>
            <p style="font-size: 14px; margin-bottom: 10px; color: var(--text-grey);">${itemsText}</p>
            
            <div class="tracking-timeline">
                <div class="track-step ${s1}"><div class="track-dot">1</div>Xác nhận</div>
                <div class="track-step ${s2}"><div class="track-dot">2</div>Giao hàng</div>
                <div class="track-step ${s3}"><div class="track-dot">3</div>Hoàn tất</div>
            </div>
            ${o.status < 3 ? `<div style="text-align:right; margin-top:15px;"><button onclick="demoUpdateOrderStatus(${index})" style="padding: 6px 12px; background:var(--dark-green); color:white; border:none; border-radius:4px; cursor:pointer;">Demo: Cập nhật Tracking</button></div>` : ''}
        </div>`;
    });
    container.innerHTML = html;
}

function demoUpdateOrderStatus(index) {
    if (state.orders[index].status < 3) {
        state.orders[index].status += 1;
        saveState('petopia_orders', state.orders);
        renderOrdersTab();
        showToast("Đã cập nhật trạng thái đơn hàng (Demo)");
    }
}


// ==========================================
// 8. MODALS & UTILITIES
// ==========================================
function openProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;

    document.getElementById('modalImg').src = p.image;
    document.getElementById('modalBrand').innerText = `Thương hiệu: ${p.brand} | Phân loại: ${p.category} - ${p.type}`;
    document.getElementById('modalTitle').innerText = p.name;
    document.getElementById('modalPrice').innerText = p.priceStr;
    document.getElementById('modalOriginalPrice').innerText = p.origPriceStr || '';
    document.getElementById('modalDiscount').innerText = p.discount || '';
    document.getElementById('modalRating').innerHTML = `${generateStars(p.rating)} <span style="color:var(--text-grey); font-size:14px; margin-left:8px;">${p.rating}/5 (${p.reviewsCount} đánh giá)</span>`;

    const stockBadge = document.getElementById('modalStockBadge');
    if (p.stock > 0) {
        stockBadge.className = 'modal-stock stock-in';
        stockBadge.innerText = `Còn hàng (Tồn kho: ${p.stock})`;
        document.getElementById('modalAddToCartBtn').disabled = false;
        document.getElementById('modalAddToCartBtn').innerHTML = 'Thêm vào giỏ';
    } else {
        stockBadge.className = 'modal-stock stock-out';
        stockBadge.innerText = `Hết hàng`;
        document.getElementById('modalAddToCartBtn').disabled = true;
        document.getElementById('modalAddToCartBtn').innerHTML = 'Đã hết hàng';
    }

    // ==== XỬ LÝ ĐỔ MÔ TẢ RA GIAO DIỆN MỚI ====
    const descContainer = document.getElementById('modalDescription');
    if (p.description && p.description.content) {
        let descHtml = `<h4 style="font-size: 14px; margin-bottom: 8px; color: var(--text-main);">${p.description.title || 'Thông tin sản phẩm'}</h4>`;
        p.description.content.forEach(text => {
            descHtml += `<p style="margin-bottom: 6px; font-size: 13px; line-height: 1.5; color: var(--text-grey);">- ${text}</p>`;
        });
        descContainer.innerHTML = descHtml;
    } else {
        descContainer.innerHTML = `<p style="font-size: 13px; line-height: 1.5; color: var(--text-grey);">Sản phẩm chính hãng, đảm bảo an toàn dinh dưỡng và sức khỏe cho thú cưng của bạn. Được phân phối trực tiếp tại hệ thống Petopia.</p>`;
    }

    const inWishlist = state.wishlist.includes(p.id);
    const wlBtn = document.getElementById('modalWishlistBtn');
    wlBtn.innerHTML = `<i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>`;
    wlBtn.style.color = inWishlist ? 'var(--danger-color)' : 'var(--text-grey)';

    document.getElementById('modalAddToCartBtn').onclick = (e) => addToCart(e, p.id);
    wlBtn.onclick = (e) => { toggleWishlist(e, p.id); openProductModal(p.id); };

    document.getElementById('productModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId, e) {
    if (e && e.target !== document.getElementById(modalId) && !e.target.classList.contains('modal-close')) return;
    document.getElementById(modalId).classList.remove('show');
    document.body.style.overflow = 'auto';
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabId}`);
    if(targetTab) targetTab.classList.add('active');
    
    const btn = document.getElementById(`tab-btn-${tabId}`);
    if (btn) btn.classList.add('active');

    if (tabId === 'cart') renderCartTab();
    if (tabId === 'wishlist') renderWishlistTab();
    if (tabId === 'orders') renderOrdersTab();
    if (tabId === 'account') renderAccountTab();
}

function updateBadges() {
    const cartBadge = document.getElementById('cartCount');
    const wlBadge = document.getElementById('wishlistCount');
    if(cartBadge) cartBadge.innerText = state.cart.reduce((a, b) => a + b.qty, 0);
    if(wlBadge) wlBadge.innerText = state.wishlist.length;
}

function saveState(key, data) {
    const googleUser = checkLoginStatus();
    const email = googleUser ? googleUser.email : (state.user ? state.user.email : null);
    
    if (email) {
        let users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        let index = users.findIndex(u => u.email === email);
        
        if (index === -1) {
            users.push({ email: email, cart: [], wishlist: [], orders: [] });
            index = users.length - 1;
        }
        
        if (key === 'petopia_cart') users[index].cart = data;
        if (key === 'petopia_wishlist') users[index].wishlist = data;
        if (key === 'petopia_orders') users[index].orders = data;
        
        localStorage.setItem('registered_users', JSON.stringify(users));
    }
}

function generateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) html += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) html += '<i class="fas fa-star-half-alt"></i>';
        else html += '<i class="far fa-star"></i>';
    }
    return html;
}

function showToast(msg, type = "success") {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem('petopia_darkmode', state.isDarkMode);
    applyDarkMode();
}

function applyDarkMode() {
    const icon = document.getElementById('darkModeIcon');
    if(!icon) return;
    if (state.isDarkMode) {
        document.body.classList.add('dark');
        icon.className = 'fas fa-sun';
    } else {
        document.body.classList.remove('dark');
        icon.className = 'fas fa-moon';
    }
}

function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(data => {
            const contentArea = document.getElementById('content');
            if(contentArea) contentArea.innerHTML = data;
        });
}
// Đường dẫn API lấy sản phẩm từ Backend Node.js của bạn
const API_URL = "http://localhost:3000/api/products";

async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        
        console.log("Danh sách sản phẩm nhận được từ MongoDB:", products);
        
        // Đoạn này bạn dùng để hiển thị sản phẩm ra HTML giao diện của bạn
        displayProducts(products); 
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu sản phẩm từ Server:", error);
    }
}

// Gọi hàm chạy khi trang web tải xong
window.onload = loadProducts;