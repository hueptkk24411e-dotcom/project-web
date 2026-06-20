// Import các hàm cần thiết từ Firebase SDK qua CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Thông tin cấu hình dự án Petopia (Đã dọn dẹp khoảng trắng thừa)
const firebaseConfig = {
   apiKey : "AIzaSyDb5AwPJaU_YrvXrwbOG9THExBL3AoJu3A" , 
    authDomain : "petopia-f9527.firebaseapp.com" , 
    projectId : "petopia-f9527" , 
    storageBucket : "petopia-f9527.firebasestorage.app" , 
    messagingSenderId : "1004810131005" , 
    appId : "1:1004810131005:web:c24f3ac831e8b263cabc54" , 
    measurementId : "G-ZT5YKZN3KH" 
};

// Khởi tạo Firebase và Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Khởi tạo Google Auth Provider
const googleProvider = new GoogleAuthProvider();

/* ================= TIỆN ÍCH CHUNG (Gắn vào window để HTML gọi được) ================= */

window.showToast = function (message, type = 'success', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
};

window.switchView = function (viewId) {
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.add('hidden-view');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden-view');
    
    if(viewId === 'view-forgot') {
        const step1 = document.getElementById('forgotFormStep1');
        if(step1) step1.classList.remove('hidden-view');
        const desc = document.getElementById('forgotDesc');
        if(desc) desc.innerText = "Nhập email để nhận liên kết đặt lại mật khẩu";
    }
};

window.togglePass = function (inputId, iconEl) {
    const input = document.getElementById(inputId);
    if(!input) return;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    iconEl.classList.toggle('fa-eye');
    iconEl.classList.toggle('fa-eye-slash');
};

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function clearErrorOnInput(inputId, groupId, errorId) {
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        inputEl.addEventListener('input', function() {
            const group = document.getElementById(groupId);
            if(group) group.classList.remove('error-field');
            const errorEl = document.getElementById(errorId);
            if (errorEl) errorEl.style.display = "none";
        });
    }
}

// --- HÀM XỬ LÝ ĐĂNG NHẬP GOOGLE ---
window.loginWithGoogle = function() {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            const user = result.user;
            
            // LƯU SESSION CHO SHOP.JS NHẬN DIỆN
            localStorage.setItem('track_session_user', user.email);
            localStorage.setItem('currentUser', JSON.stringify({ name: user.displayName, email: user.email }));

            window.showToast(`Chào mừng ${user.displayName || 'bạn'} đã quay trở lại!`, "success");
            console.log("Google User đã đăng nhập:", user);
            
            // Kiểm tra xem trước đó có sản phẩm nào đang chờ mua không
            const pendingItem = localStorage.getItem("pending_cart_item");
            if (pendingItem) {
                // Nếu có sản phẩm chờ, chuyển thẳng về trang cửa hàng thay vì trang chủ pet
                setTimeout(() => { window.location.href = "../html/homepet.html"; }, 1500); // Đổi tên file cho đúng file chứa shop của bạn
            } else {
                setTimeout(() => { window.location.href = "../html/homepet.html"; }, 1500);
            }
        })
        .catch((error) => {
            // ... (giữ nguyên code catch cũ của bạn)
        });
};

/* ================= XỬ LÝ SỰ KIỆN KHI DOM SẴN SÀNG ================= */

document.addEventListener('DOMContentLoaded', function () {
    // Đăng ký xóa lỗi khi gõ
    clearErrorOnInput('loginEmail', 'loginEmailGroup', 'loginEmailError');
    clearErrorOnInput('loginPassword', 'loginPasswordGroup', 'loginPasswordError');
    clearErrorOnInput('regName', 'regNameGroup', 'regNameError');
    clearErrorOnInput('regEmail', 'regEmailGroup', 'regEmailError');
    clearErrorOnInput('regPassword', 'regPasswordGroup', 'regPasswordError');
    clearErrorOnInput('forgotEmail', 'forgotEmailGroup', 'forgotEmailError');

    /* 1. XỬ LÝ ĐĂNG NHẬP (FIREBASE EMAIL) */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let isValid = true;
            const emailVal = document.getElementById('loginEmail').value.trim();
            const passVal = document.getElementById('loginPassword').value;

            if (!validateEmail(emailVal)) {
                document.getElementById('loginEmailGroup').classList.add('error-field');
                document.getElementById('loginEmailError').style.display = "block";
                isValid = false;
            }
            if (passVal.length < 6) {
                document.getElementById('loginPasswordGroup').classList.add('error-field');
                document.getElementById('loginPasswordError').style.display = "block";
                isValid = false;
            }

            if (isValid) {
                const btnSubmit = document.getElementById('btnLoginSubmit');
                const btnSpinner = document.getElementById('btnLoginSpinner');
                const btnText = document.getElementById('btnLoginText');

                if(btnSubmit) btnSubmit.disabled = true;
                if(btnSpinner) btnSpinner.style.display = 'inline-block';
                if(btnText) btnText.textContent = ' Đang đăng nhập...';

                // Gọi hàm đăng nhập của Firebase
               signInWithEmailAndPassword(auth, emailVal, passVal)
    .then((userCredential) => {
        const user = userCredential.user;

        // LƯU SESSION CHO SHOP.JS NHẬN DIỆN
        localStorage.setItem('track_session_user', user.email);
        localStorage.setItem('currentUser', JSON.stringify({ name: user.email.split('@')[0], email: user.email }));

        window.showToast("Đăng nhập thành công!", "success");
        console.log("User logged in:", user);
        
        // Kiểm tra xem trước đó có sản phẩm nào đang chờ mua không
        const pendingItem = localStorage.getItem("pending_cart_item");
        if (pendingItem) {
            setTimeout(() => { window.location.href = "../html/homepet.html"; }, 1500); // Đổi tên thành file chứa giao diện shop của bạn
        } else {
            setTimeout(() => { window.location.href = "../html/homepet.html"; }, 1500);
        }
    })
    .catch((error) => {
        // ... (giữ nguyên code catch cũ của bạn)
    });
            }
        });
    }

    /* 2. XỬ LÝ ĐĂNG KÝ (FIREBASE EMAIL) */
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let isValid = true;
            const emailVal = document.getElementById('regEmail').value.trim();
            const passVal = document.getElementById('regPassword').value;
            const confirmVal = document.getElementById('regConfirm').value;

            if (!validateEmail(emailVal)) {
                document.getElementById('regEmailGroup').classList.add('error-field');
                document.getElementById('regEmailError').style.display = "block";
                isValid = false;
            }
            if (passVal.length < 6) {
                document.getElementById('regPasswordGroup').classList.add('error-field');
                document.getElementById('regPasswordError').style.display = "block";
                isValid = false;
            }
            if (passVal !== confirmVal) {
                document.getElementById('regConfirmGroup').classList.add('error-field');
                document.getElementById('regConfirmError').style.display = "block";
                isValid = false;
            }

            if (isValid) {
                const btnSubmit = document.getElementById('btnRegSubmit');
                const btnSpinner = document.getElementById('btnRegSpinner');
                const btnText = document.getElementById('btnRegText');

                if(btnSubmit) btnSubmit.disabled = true;
                if(btnSpinner) btnSpinner.style.display = 'inline-block';
                if(btnText) btnText.textContent = ' Đang xử lý...';

                // Gọi hàm tạo tài khoản của Firebase
                createUserWithEmailAndPassword(auth, emailVal, passVal)
                    .then((userCredential) => {
                        window.showToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
                        const loginEmailInput = document.getElementById('loginEmail');
                        if(loginEmailInput) loginEmailInput.value = emailVal;
                        
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if(btnText) btnText.innerHTML = '<i class="fa-solid fa-user-plus paw-icon"></i> Đăng ký';
                        
                        setTimeout(() => { window.switchView('view-login'); }, 1500);
                    })
                    .catch((error) => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if(btnText) btnText.innerHTML = '<i class="fa-solid fa-user-plus paw-icon"></i> Đăng ký';

                        if (error.code === 'auth/email-already-in-use') {
                            document.getElementById('regEmailGroup').classList.add('error-field');
                            const regEmailError = document.getElementById('regEmailError');
                            if(regEmailError) {
                                regEmailError.innerText = "Email này đã được đăng ký.";
                                regEmailError.style.display = "block";
                            }
                        } else {
                            window.showToast("Lỗi đăng ký: " + error.message, "error");
                        }
                    });
            }
        });
    }

    /* 3. XỬ LÝ QUÊN MẬT KHẨU */
    const forgotFormStep1 = document.getElementById('forgotFormStep1');
    if (forgotFormStep1) {
        forgotFormStep1.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailVal = document.getElementById('forgotEmail').value.trim();

            if (!validateEmail(emailVal)) {
                document.getElementById('forgotEmailGroup').classList.add('error-field');
                document.getElementById('forgotEmailError').style.display = "block";
            } else {
                const btnSubmit = document.getElementById('btnForgotSubmit');
                const btnSpinner = document.getElementById('btnForgotSpinner');

                if(btnSubmit) btnSubmit.disabled = true;
                if(btnSpinner) btnSpinner.style.display = 'inline-block';

                sendPasswordResetEmail(auth, emailVal)
                    .then(() => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        window.showToast(`Liên kết đặt lại mật khẩu đã được gửi đến ${emailVal}!`, "success", 6000);
                        setTimeout(() => { window.switchView('view-login'); }, 2000);
                    })
                    .catch((error) => {
                        if(btnSubmit) btnSubmit.disabled = false;
                        if(btnSpinner) btnSpinner.style.display = 'none';
                        if (error.code === 'auth/user-not-found') {
                            window.showToast("Email này chưa được đăng ký trong hệ thống!", "error");
                        } else {
                            window.showToast("Gửi yêu cầu thất bại. Vui lòng thử lại!", "error");
                        }
                    });
            }
        });
    }
});