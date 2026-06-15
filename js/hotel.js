function showRoomDetail(roomTypeId){

    document.querySelector(".choose-room")
            .style.display = "none";

    const detailSection =
        document.getElementById(
            "room-detail-section"
        );

    detailSection.style.display = "block";

    detailSection.innerHTML = `
        <div class="room-detail-page">

            <button class="back-btn"
                    onclick="backToRooms()">
                ← Quay lại
            </button>

            <h2>Danh sách phòng thường</h2>

            <div class="room-grid">

                <div class="room-card">
                    <img src="../images/hotel/p101.jpg">

                    <h3>Phòng P101</h3>

                    <p>200.000đ / đêm</p>

                    <button>
                        Đặt ngay
                    </button>
                </div>

                <div class="room-card">
                    <img src="../images/hotel/p102.jpg">

                    <h3>Phòng P102</h3>

                    <p>200.000đ / đêm</p>

                    <button>
                        Đặt ngay
                    </button>
                </div>

            </div>

        </div>
    `;

    window.scrollTo({
        top: document.getElementById("viewroom").offsetTop,
        behavior: "smooth"
    });
}
function backToRooms(){

    document.querySelector(".choose-room")
            .style.display = "block";

    document.getElementById(
        "room-detail-section"
    ).style.display = "none";
}