// Service chính - tổng hợp các API
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Import các module xử lý
const hocSinhService = require("./XL_HOCSINH");
const giamThiService = require("./XL_GIAMTHI");
const giaoVuService = require("./XL_GIAOVU");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes cho học sinh
app.use("/api/hocsinh", hocSinhService);

// Routes cho giám thị
app.use("/api/giamthi", giamThiService);

// Routes cho giáo vụ
app.use("/api/giaovu", giaoVuService);

// API đăng nhập
app.post("/api/login", (req, res) => {
  const { username, password, role } = req.body;

  try {
    let userData = null;
    let filePath = "";

    // Xác định đường dẫn file dựa trên role
    switch (role) {
      case "hocsinh":
        filePath = path.join(__dirname, "data", "Hocsinh");
        break;
      case "giamthi":
        filePath = path.join(__dirname, "data", "Giamthi");
        break;
      case "giaovu":
        filePath = path.join(__dirname, "data", "Giaovu");
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Role không hợp lệ" });
    }

    // Đọc các file trong thư mục tương ứng
    const files = fs.readdirSync(filePath);

    for (let file of files) {
      if (file.endsWith(".json")) {
        const data = JSON.parse(
          fs.readFileSync(path.join(filePath, file), "utf8")
        );

        if (role === "hocsinh") {
          if (
            data.thongTinDangNhap &&
            data.thongTinDangNhap.tenDangnhap === username &&
            data.thongTinDangNhap.matkhau === password
          ) {
            userData = {
              id: data.thongTinCaNhan.id,
              hoTen: data.thongTinCaNhan.hoTen,
              role: "hocsinh",
            };
            break;
          }
        } else {
          // Kiểm tra cả cấu trúc cũ và mới cho giám thị/giáo vụ
          let isValidLogin = false;

          // Cấu trúc mới: data.thongTinDangNhap.tenDangnhap
          if (
            data.thongTinDangNhap &&
            data.thongTinDangNhap.tenDangnhap === username &&
            data.thongTinDangNhap.matkhau === password
          ) {
            isValidLogin = true;
            userData = {
              id: data.thongTinCaNhan ? data.thongTinCaNhan.id : data.id,
              hoTen: data.thongTinCaNhan
                ? data.thongTinCaNhan.hoTen
                : data.hoTen,
              role: role,
              dsLopQuanLy: data.dsLopQuanLy || [],
            };
          }
          // Cấu trúc cũ: data.tenDangnhap (fallback)
          else if (data.tenDangnhap === username && data.matkhau === password) {
            isValidLogin = true;
            userData = {
              id: data.id,
              hoTen: data.hoTen,
              role: role,
              dsLopQuanLy: data.dsLopQuanLy || [],
            };
          }

          if (isValidLogin) {
            break;
          }
        }
      }
    }

    if (userData) {
      res.json({ success: true, user: userData });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Thông tin đăng nhập không đúng" });
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Khởi tạo thư mục data nếu chưa có
function initDataDirectories() {
  const dataDir = path.join(__dirname, "data");
  const hocSinhDir = path.join(dataDir, "Hocsinh");
  const giamThiDir = path.join(dataDir, "Giamthi");
  const giaoVuDir = path.join(dataDir, "Giaovu");

  // Chỉ tạo thư mục nếu chưa có, không tạo dữ liệu mẫu
  [dataDir, hocSinhDir, giamThiDir, giaoVuDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Đã tạo thư mục: ${dir}`);
    }
  });
}

// Khởi động server
app.listen(PORT, () => {
  console.log(`Service đang chạy tại http://localhost:${PORT}`);
});
