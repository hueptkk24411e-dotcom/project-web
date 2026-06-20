require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017/petopia_db";

// ==========================================================
// 1. ĐỊNH NGHĨA CÁC MODEL (SẢN PHẨM & PHÒNG)
// ==========================================================
const productSchema = new mongoose.Schema({
    id: String,
    name: String,
    brand: String,
    link: String,
    image: String,
    price: Number,
    original_price: String,
    discount: String,
    sold: String,
    status: { type: String, default: "in_stock" }
});
const Product = mongoose.model('Product', productSchema);

const roomSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    image: String,
    description: String,
    type: String, // 'dog' hoặc 'cat'
    status: { type: String, default: "available" }
});
const Room = mongoose.model('Room', roomSchema);

// ==========================================================
// 2. HÀM TỰ ĐỘNG NẠP DỮ LIỆU TỪ FILE VÀO MONGODB
// ==========================================================

// --- Nạp phòng khách sạn từ hotel.json ---
async function importHotelToMongo() {
    try {
        const hotelPath = path.join(__dirname, '..', 'dataset', 'hotel.json');
        
        if (!fs.existsSync(hotelPath)) {
            console.log("⚠️ Không tìm thấy file hotel.json tại: " + hotelPath);
            return;
        }

        const count = await Room.countDocuments();
        if (count > 0) {
            console.log(`💡 MongoDB đã có sẵn ${count} phòng khách sạn. Không nạp chồng.`);
            return;
        }

        const rawData = fs.readFileSync(hotelPath, 'utf-8');
        const hotelData = JSON.parse(rawData);
        let formattedRooms = [];

        for (const type in hotelData) {
            if (Array.isArray(hotelData[type])) {
                hotelData[type].forEach(room => {
                    formattedRooms.push({
                        id: room.id || undefined,
                        name: room.name,
                        price: Number(String(room.price).replace(/[^0-9]/g, '')) || 0, 
                        image: room.image,
                        description: room.description || "",
                        type: type
                    });
                });
            }
        }

        await Room.insertMany(formattedRooms);
        console.log(`🏨 ĐÃ NẠP THÀNH CÔNG ${formattedRooms.length} PHÒNG KHÁCH SẠN VÀO MONGODB!`);
    } catch (error) {
        console.error("❌ Lỗi nạp dữ liệu khách sạn:", error);
    }
}

// --- Nạp sản phẩm từ product.xml ---
async function importXMLToMongo() {
    try {
        const xmlPath = path.join(__dirname, '..', 'product.xml'); 
        if (!fs.existsSync(xmlPath)) {
            console.log("⚠️ Không tìm thấy file product.xml ở thư mục cha.");
            return;
        }

        const count = await Product.countDocuments();
        if (count > 0) {
            console.log(`💡 MongoDB đang có sẵn ${count} sản phẩm. Bỏ qua bước nạp.`);
            return;
        }

        const xmlData = fs.readFileSync(xmlPath, 'utf-8');
        const parser = new xml2js.Parser({ explicitArray: false });

        parser.parseString(xmlData, async (err, result) => {
            if (err) return console.error("❌ Lỗi phân tích XML:", err);
            if (!result || !result.products || !result.products.product) return;

            let productsArray = result.products.product;
            if (!Array.isArray(productsArray)) productsArray = [productsArray];

            const formattedProducts = productsArray.map(p => {
                return {
                    id: p.$.id || undefined,
                    name: p.name || "",
                    brand: p.brand || "",
                    link: p.link || "",
                    image: p.image || "",
                    price: Number(String(p.price).replace(/[^0-9]/g, '')) || 0,
                    original_price: p.original_price || "",
                    discount: p.discount || "",
                    sold: p.sold || "",
                    status: p.status || "in_stock"
                };
            });

            await Product.insertMany(formattedProducts);
            console.log(`📦 ĐÃ NẠP THÀNH CÔNG ${formattedProducts.length} SẢN PHẨM VÀO MONGODB!`);
        });
    } catch (error) {
        console.error("❌ Lỗi xử lý XML:", error);
    }
}

// ==========================================================
// 3. ĐỊNH NGHĨA CÁC ĐƯỜNG DẪN API (CHO FRONTEND GỌI)
// ==========================================================

// API lấy danh sách phòng (Có hỗ trợ lọc theo loại: /api/rooms?type=dog)
app.get('/api/rooms', async (req, res) => {
    try {
        const { type } = req.query; 
        let filter = {};
        if (type) filter.type = type;

        const rooms = await Room.find(filter);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: "Lỗi không lấy được danh sách phòng!" });
    }
});

// API lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống, không thể lấy dữ liệu sản phẩm!" });
    }
});

// ==========================================================
// 4. KẾT NỐI DATABASE VÀ KHỞI ĐỘNG SERVER
// ==========================================================
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Đã kết nối thành công với MongoDB!');
        importXMLToMongo();   // Tự động nạp sản phẩm
        importHotelToMongo(); // Tự động nạp phòng khách sạn
    })
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});