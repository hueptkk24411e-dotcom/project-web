let rooms = {};
let pets = []; // Mảng chứa danh sách thú cưng từ json
let currentPetType = 'dog'; // Mặc định hiển thị tab dog trước ở giao diện cửa hàng

// 1. Tải dữ liệu phòng từ hotel.json
fetch("../dataset/hotel.json")
    .then(res => res.json())
    .then(data => {
        rooms = data;
    })
    .catch(err => console.error("Lỗi tải dữ liệu hotel.json:", err));

// 2. Tải dữ liệu danh sách thú cưng từ pets.json
fetch("../dataset/pets.json")
    .then(res => res.json())
    .then(data => {
        pets = data;
        loadPetSelectOptions(); // Đổ dữ liệu vào thẻ select
    })
    .catch(err => console.error("Lỗi tải dữ liệu pets.json:", err));

// Hàm render danh sách thú cưng vào select box
function loadPetSelectOptions() {
    const petSelect = document.getElementById("petSelect");
    if (!petSelect) return;
    
    petSelect.innerHTML = '<option value="">-- Chọn thú cưng của bạn --</option>';
    
    pets.forEach(pet => {
        const option = document.createElement("option");
        option.value = pet.id || pet.petName; 
        option.textContent = pet.petName;
        petSelect.appendChild(option);
    });
}

// Sự kiện tự động kích hoạt điền thông tin khi đổi lựa chọn thú cưng
function onPetSelected() {
    const petSelect = document.getElementById("petSelect");
    const selectedValue = petSelect.value;
    
    const petTypeInput = document.getElementById("hotelPetType");
    const petBreedInput = document.getElementById("hotelPetBreed");
    
    if (!selectedValue) {
        petTypeInput.value = "";
        petBreedInput.value = "";
        return;
    }
    
    const foundPet = pets.find(p => (p.id == selectedValue || p.petName == selectedValue));
    
    if (foundPet) {
        const typeVi = foundPet.petType.toLowerCase() === 'dog' ? 'Chó' : 'Mèo';
        petTypeInput.value = typeVi;
        petBreedInput.value = foundPet.breed || "Không rõ";
    }
}

// ==========================================
// LOGIC GIAO DIỆN CỬA HÀNG (CHIA TRÁI - PHẢI)
// ==========================================

// Kích hoạt hiển thị trang Xem Phòng
function showViewRoom() {
    showPage('viewroom'); 
    // Mặc định nạp dữ liệu tab Chó sang cột bên trái trước
    switchPetTab('dog'); 
}

// Chuyển đổi qua lại giữa nút Chọn Chó / Chọn Mèo ở Sidebar bên trái
function switchPetTab(petType) {
    currentPetType = petType;
    
    // Đổi hiệu ứng Active cho nút bấm phân loại
    const buttons = document.querySelectorAll('.pet-btn');
    if (buttons.length >= 2) {
        buttons.forEach(btn => btn.classList.remove('active'));
        if(petType === 'dog') buttons[0].classList.add('active');
        else buttons[1].classList.add('active');
    }

    // Tiến hành nạp danh sách phòng tương ứng vào Sidebar
    renderSidebarRooms(petType);
}

// Render toàn bộ danh sách phòng (Thường, Cao cấp, VIP) vào Sidebar trái
function renderSidebarRooms(petType) {
    const sidebarContainer = document.getElementById('room-list-sidebar');
    if (!sidebarContainer || !rooms[petType]) return;

    let htmlContent = '';
    const categories = ['normal', 'premium', 'vip'];
    
    categories.forEach(roomType => {
        if (rooms[petType][roomType]) {
            rooms[petType][roomType].forEach(room => {
                htmlContent += `
                    <div class="room-sidebar-item" id="sidebar-${room.roomNumber}" onclick="showRoomDetail('${petType}', '${roomType}', '${room.roomNumber}')">
                        <img src="${room.image}" alt="${room.roomName}">
                        <div class="room-sidebar-info">
                            <h4>[${room.roomNumber}] ${room.roomName}</h4>
                            <span>${room.price}</span>
                            <small class="tag-${roomType}">Hạng ${roomType.toUpperCase()}</small>
                        </div>
                    </div>
                `;
            });
        }
    });

    sidebarContainer.innerHTML = htmlContent;

    // Tự động click hiển thị phòng đầu tiên có trong danh sách để phần bên phải không bị trống
    const firstCategoryWithData = categories.find(cat => rooms[petType][cat] && rooms[petType][cat].length > 0);
    if (firstCategoryWithData) {
        const firstRoom = rooms[petType][firstCategoryWithData][0];
        showRoomDetail(petType, firstCategoryWithData, firstRoom.roomNumber);
    }
}

// Hiển thị nội dung chi tiết phòng sang phần nội dung BÊN PHẢI
function showRoomDetail(petType, roomType, roomNumber){
    if (!rooms[petType] || !rooms[petType][roomType]) return;
    
    const room = rooms[petType][roomType].find(r => r.roomNumber === roomNumber);
    if(!room) return;

    // Đổi hiệu ứng Active cho item đang được lựa chọn ở sidebar trái
    document.querySelectorAll('.room-sidebar-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`sidebar-${roomNumber}`);
    if(activeItem) activeItem.classList.add('active');

    // Đẩy thông tin phòng vào vùng chứa nội dung bên phải
    const detailContainer = document.getElementById("room-detail-display");
    if (!detailContainer) return;

    detailContainer.innerHTML = `
    <div class="room-detail-box">
        <div class="room-detail-image">
            <img src="${room.image}" alt="${room.roomName}">
        </div>
        <div class="room-detail-info">
            <span class="room-number-badge">${room.roomNumber}</span>
            <h2>${room.roomName}</h2>
            <div class="detail-price">${room.price}</div>
            <p class="detail-description">${room.description}</p>
            <h3>Tiện ích bao gồm:</h3>
            <ul class="detail-features">
                ${room.features.map(feature => `<li>✔ ${feature}</li>`).join("")}
            </ul>
            <button class="book-room-btn" onclick="bookRoom('${petType}','${roomType}','${room.roomNumber}')">
                🐾 Đặt phòng ngay
            </button>
        </div>
    </div>`;
}

// Hàm hỗ trợ điều hướng quay lại trang chủ khách sạn
function backToRooms(){
    showPage("hotel");
}

// ==========================================
// MULTI-STEP BOOKING & MONGODB INTEGRATION
// ==========================================
let globalRoomPriceNum = 0;
let globalRoomNameStr = "";

function bookRoom(petType, roomType, roomNumber){
    if (!rooms[petType] || !rooms[petType][roomType]) return;
    
    const room = rooms[petType][roomType].find(r => r.roomNumber === roomNumber);
    if(!room) return;

    showPage('booking');

    // Reset hiển thị các Step đặt phòng công khai
    document.getElementById("bookingStep1").style.display = "block";
    document.getElementById("bookingStep2").style.display = "none";
    document.getElementById("bookingStep3").style.display = "none";

    globalRoomNameStr = `${room.roomName} (${room.roomNumber})`;
    globalRoomPriceNum = parseInt(room.price.replace(/[^0-9]/g, '')) || 0;

    document.getElementById("hotelRoomType").value = globalRoomNameStr;
    
    loadPetSelectOptions();
}

async function goToStep2() {
    // Thực thi lưu thông tin thú cưng lên Database thông qua API
    await savePetToMongoDB();

    document.getElementById("bookingStep1").style.display = "none";
    document.getElementById("bookingStep2").style.display = "block";
}

function backToStep1() {
    document.getElementById("bookingStep2").style.display = "none";
    document.getElementById("bookingStep1").style.display = "block";
}

function togglePickupFields(show) {
    const fields = document.getElementById("pickupFormDetails");
    if(fields) fields.style.display = show ? "flex" : "none";
}

function goToStep3() {
    const isPickup = document.querySelector('input[name="pickupOption"]:checked').value === "yes";
    
    if (isPickup) {
        const pName = document.getElementById("pickupName").value.trim();
        const pPhone = document.getElementById("pickupPhone").value.trim();
        const pAddress = document.getElementById("pickupAddress").value.trim();
        const pTime = document.getElementById("pickupTime").value;

        if (!pName || !pPhone || !pAddress || !pTime) {
            alert("Vui lòng nhập đầy đủ các trường thông tin đưa đón!");
            return;
        }
    }

    const petSelect = document.getElementById("petSelect");
    const petName = petSelect.options[petSelect.selectedIndex].text;
    const breed = document.getElementById("hotelPetBreed").value;
    const checkIn = document.getElementById("hotelCheckIn").value;
    const checkOut = document.getElementById("hotelCheckOut").value;

    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const days = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));

    const roomCost = days * globalRoomPriceNum;
    const pickupCost = isPickup ? 50000 : 0;
    const finalTotal = roomCost + pickupCost;

    document.getElementById("cPetInfo").textContent = `${petName} (${breed})`;
    document.getElementById("cRoomName").textContent = globalRoomNameStr;
    document.getElementById("cStayDates").textContent = `${checkIn} đến ${checkOut} (${days} đêm)`;
    
    if (isPickup) {
        const pAddress = document.getElementById("pickupAddress").value;
        document.getElementById("cPickupInfo").textContent = `Đón tại: ${pAddress}`;
    } else {
        document.getElementById("cPickupInfo").textContent = "Không sử dụng";
    }

    document.getElementById("priceRoomDetails").textContent = `${roomCost.toLocaleString('vi-VN')} VNĐ`;
    document.getElementById("pricePickupDetails").textContent = `${pickupCost.toLocaleString('vi-VN')} VNĐ`;
    document.getElementById("priceFinalTotal").textContent = `${finalTotal.toLocaleString('vi-VN')} VNĐ`;

    document.getElementById("bookingStep2").style.display = "none";
    document.getElementById("bookingStep3").style.display = "block";
}

function backToStep2() {
    document.getElementById("bookingStep3").style.display = "none";
    document.getElementById("bookingStep2").style.display = "block";
}

function finalSubmitHotelBooking() {
    const randomBookingId = "BK" + Math.floor(100000 + Math.random() * 900000);
    alert(`🎉 Đặt phòng thành công!\nMã đặt phòng: ${randomBookingId}\nTrạng thái: Confirmed.`);

    // Dọn sạch dữ liệu Form cũ
    document.getElementById("petSelect").value = "";
    document.getElementById("hotelPetType").value = "";
    document.getElementById("hotelPetBreed").value = "";
    document.getElementById("hotelCheckIn").value = "";
    document.getElementById("hotelCheckOut").value = "";
    document.getElementById("hotelNotes").value = "";
    document.getElementById("hotelAgree").checked = false;
    
    showPage('hotel');
}

// Hàm lưu thú cưng lên hệ thống Node/Express & MongoDB
async function savePetToMongoDB() {
    try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if(!currentUser) return;

        const petData = {
            ownerId: currentUser._id,
            petName: document.getElementById("petName")?.value || "Thú cưng ẩn danh",
            petType: currentPetType, // Lấy trực tiếp loại pet đang xem ở tab hệ thống
            breed: document.getElementById("hotelPetBreed")?.value || "Không rõ",
            weight: parseFloat(document.getElementById("petWeight")?.value) || 0,
            notes: document.getElementById("hotelNotes")?.value || ""
        };

        const response = await fetch("http://localhost:3000/api/pets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(petData)
        });

        const result = await response.json();
        if(result.success){
            console.log("Đã đồng bộ dữ liệu thú cưng vào MongoDB thành công!");
        }
    } catch (err) {
        console.error("Lỗi kết nối API MongoDB:", err);
    }
}

// HÀM ĐIỀU HƯỚNG CHUYỂN PHÂN HỆ TRANG CHÍNH
function showPage(pageId) {
    const pages = ['hotel', 'viewroom', 'room-detail', 'booking-page', 'booking'];
    
    pages.forEach(id => {
        const elem = document.getElementById(id) || document.getElementById(id + '-page');
        if (elem) elem.style.display = 'none';
    });

    const target = document.getElementById(pageId) || document.getElementById(pageId + '-page');
    if (target) {
        // Nếu chuyển sang trang cửa hàng viewroom thì ép kiểu hiển thị flex, còn lại block thông thường
        if(pageId === 'viewroom') {
            target.style.display = 'flex';
        } else {
            target.style.display = 'block';
        }
        window.scrollTo(0, 0);
    }
}
function showError(message){

    const errorBox =
        document.getElementById("formError");

    errorBox.innerText = message;

    errorBox.style.display = "block";

    errorBox.scrollIntoView({
        behavior:"smooth",
        block:"start"
    });
}

function hideError(){

    document.getElementById("formError")
        .style.display = "none";
}
const booking = {
    bookingId: Date.now(),
    roomNumber: selectedRoom.roomNumber,
    customer: ownerName,
    checkIn,
    checkOut,
    status: "confirmed"
};

bookings.push(booking);
function isRoomAvailable(roomNumber){

    const bookings =
        JSON.parse(localStorage.getItem("hotelBookings")) || [];

    return !bookings.some(
        booking =>
            booking.roomNumber === roomNumber &&
            booking.status === "confirmed"
    );
}
rooms.forEach(room => {

    const available =
        isRoomAvailable(room.roomNumber);

    if(available){

        html += `
        <div class="room-card">
            <h3>${room.roomNumber}</h3>
            <button>
                Đặt phòng ngay
            </button>
        </div>
        `;
    }

});