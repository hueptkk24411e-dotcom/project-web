var PETOPIA_KB = [
    {
        keys: ['giá', 'bao nhiêu', 'chi phí', 'phí', 'tiền'],
        reply: 'Bảng giá dịch vụ Petopia:\n• Grooming Cơ bản: từ 200.000đ\n• Grooming Trọn gói: từ 350.000đ\n• Spa Package: từ 450.000đ\n• Chăm sóc móng: từ 120.000đ\n\nPhụ thu kiểu tóc: Teddy +50k | Lion +60k | Korean +70k | Summer +40k 🐾'
    },
    {
        keys: ['dịch vụ', 'gói', 'có gì', 'cung cấp', 'loại'],
        reply: 'Petopia có 4 dịch vụ chính:\n✂️ Grooming Cơ bản — tắm, styling, cắt móng, trị tai\n✂️ Grooming Trọn gói — cơ bản + cắt tóc\n🌿 Spa Package — tắm, massage, chăm sóc da, khử mùi\n💅 Chăm sóc móng — cắt, điều trị, mài móng'
    },
    {
        keys: ['kiểu tóc', 'kiểu', 'teddy', 'lion', 'korean', 'summer'],
        reply: 'Các kiểu tóc tại Petopia:\n💇 Teddy Cut — +50.000đ\n🦁 Lion Cut — +60.000đ\n🌸 Korean Style — +70.000đ\n☀️ Summer Cut — +40.000đ\n\nChọn kiểu trong form đặt lịch phía trên nhé!'
    },
    {
        keys: ['bao lâu', 'mấy tiếng', 'thời gian', 'lâu không'],
        reply: 'Thời gian grooming:\n⏱ Cơ bản: ~1–1.5 tiếng\n⏱ Trọn gói: ~1.5–2 tiếng\n⏱ Spa Package: ~2–2.5 tiếng\n⏱ Chăm sóc móng: ~20–30 phút\n\nTùy kích thước và tình trạng lông thú cưng nhé!'
    },
    {
        keys: ['giờ', 'mấy giờ', 'khi nào', 'làm việc', 'thứ mấy'],
        reply: 'Giờ làm việc Petopia:\n📅 Thứ 2–7: 8:00–19:00\n📅 Chủ nhật: 9:00–17:00\n\nNên đặt lịch trước để tránh chờ nhé! 🐾'
    },
    {
        keys: ['chuẩn bị', 'mang gì', 'cần gì', 'trước khi'],
        reply: 'Cần chuẩn bị trước khi đến Petopia:\n📋 Mang theo giấy tờ tiêm chủng\n💬 Thông báo nếu thú cưng có dị ứng/bệnh lý\n🎀 Nhắn trước kiểu tóc mong muốn\n\nPetopia sẽ lo phần còn lại cho bạn!'
    },
    {
        keys: ['đặt lịch', 'book', 'hẹn', 'đăng ký'],
        reply: 'Bạn điền vào form "Đặt lịch chăm sóc thú cưng" ngay phía trên trang này nhé!\n\nSau khi gửi, đội ngũ xác nhận qua Zalo/SĐT trong vòng 30 phút!'
    },
    {
        keys: ['địa chỉ', 'ở đâu', 'đường', 'quận', 'chỗ nào'],
        reply: '📍 212 Đường Hoàng Diệu, Quận 4, TP.HCM\n🕐 T2–T7: 8:00–19:00 | CN: 9:00–17:00\n📞 0909 123 456'
    },
    {
        keys: ['hủy lịch', 'dời lịch', 'đổi lịch', 'hoàn tiền'],
        reply: '✅ Miễn phí hủy trước 24 giờ\n⚠️ Hủy trong 24h: mất 20% phí đặt cọc\n\nĐể hủy/dời lịch liên hệ:\n📞 0909 123 456 (Zalo/Gọi)'
    },
    {
        keys: ['tần suất', 'thường xuyên', 'bao lâu một lần', 'mấy tuần'],
        reply: 'Tần suất grooming khuyến nghị:\n🐩 Lông dài (Poodle…): 4–6 tuần/lần\n🐕 Lông trung bình: 6–8 tuần/lần\n🐈 Mèo lông ngắn: 8–12 tuần/lần\n🐈 Mèo lông dài: 4–6 tuần/lần'
    }
];

var FALLBACK_REPLY = 'Dạ, Petopia đã nhận được tin nhắn của bạn! 📩\nVấn đề này cần tư vấn trực tiếp để hỗ trợ tốt nhất.\nĐội ngũ nhân viên sẽ liên hệ lại ngay qua:\n📞 0909 123 456 (Zalo/Gọi)\n🌐 petopia.vn ❤️';

function normalizeText(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getBotReply(text) {
    var t = normalizeText(text);
    for (var i = 0; i < PETOPIA_KB.length; i++) {
        var item = PETOPIA_KB[i];
        for (var j = 0; j < item.keys.length; j++) {
            if (t.includes(normalizeText(item.keys[j]))) return item.reply;
        }
    }
    return FALLBACK_REPLY;
}

/* --- DOM refs (khớp đúng với HTML) --- */
var chatFab      = document.getElementById('chatFab');       // nút tròn mở chat
var chatWindow   = document.getElementById('chatWindow');    // khung chat
var chatClose    = document.getElementById('chatClose');     // nút ✕
var chatInput    = document.getElementById('chatInput');     // ô nhập
var chatSend     = document.getElementById('chatSend');      // nút gửi
var chatMessages = document.getElementById('chatMessages');  // vùng tin nhắn
var quickBtns    = document.getElementById('quickBtns');     // nút gợi ý
var chatBadge    = document.getElementById('chatBadge');     // badge đỏ

var chatOpened = false;  // đã hiện lời chào chưa

/* --- Mở / đóng --- */
function openChat() {
    if (!chatWindow) return;
    chatWindow.classList.add('show');
    if (chatFab)   chatFab.classList.add('open');
    if (chatBadge) chatBadge.classList.remove('show');
    if (chatInput) setTimeout(function () { chatInput.focus(); }, 300);

    if (!chatOpened) {
        chatOpened = true;
        setTimeout(function () {
            appendBotMsg('Xin chào! 👋 Mình là trợ lý Petopia, sẵn sàng giải đáp về dịch vụ, giá cả và đặt lịch cho bạn nhé!');
        }, 350);
    }
}

function closeChat() {
    if (!chatWindow) return;
    chatWindow.classList.remove('show');
    if (chatFab) chatFab.classList.remove('open');
}

if (chatFab)   chatFab.addEventListener('click', function () {
    chatWindow && chatWindow.classList.contains('show') ? closeChat() : openChat();
});
if (chatClose) chatClose.addEventListener('click', closeChat);

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeChat();
});

/* --- Hiển thị bubble tin nhắn --- */
function appendBotMsg(text) {
    if (!chatMessages) return;
    var div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.style.whiteSpace = 'pre-line';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* --- Gửi tin nhắn --- */
function handleSendMessage() {
    if (!chatInput || !chatMessages) return;
    var text = chatInput.value.trim();
    if (!text) return;

    /* Hiện tin user */
    var userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = text;
    chatMessages.appendChild(userDiv);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    /* Giữ quick buttons luôn hiện lại sau mỗi lần hỏi */
    if (quickBtns) quickBtns.style.display = '';

    /* Typing indicator */
    var typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg bot typing-indicator';
    typingDiv.id = 'typingDot';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    /* Bot trả lời sau delay */
    var delay = 600 + Math.random() * 500;
    setTimeout(function () {
        var dot = document.getElementById('typingDot');
        if (dot) dot.remove();
        appendBotMsg(getBotReply(text));
    }, delay);
}

if (chatSend)  chatSend.addEventListener('click', handleSendMessage);
if (chatInput) chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleSendMessage();
});

/* --- Quick buttons --- */
document.querySelectorAll('.quick-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        if (!chatInput) return;
        chatInput.value = btn.getAttribute('data-q');
        handleSendMessage();
    });
});
