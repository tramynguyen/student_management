// Hệ thống giao diện cho học sinh
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;
const SERVICE_URL = "http://localhost:3001";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Route trang chủ - đăng nhập
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Xử lý đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const response = await fetch(`${SERVICE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        role: "hocsinh",
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Chuyển hướng đến trang hồ sơ với ID học sinh
      res.redirect(`/ho-so?id=${result.user.id}`);
    } else {
      res.redirect("/login?error=1");
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.redirect("/login?error=1");
  }
});

// Route hiển thị hồ sơ học sinh
app.get("/ho-so", async (req, res) => {
  try {
    const studentId = req.query.id;

    if (!studentId) {
      return res.redirect("/login");
    }

    const response = await fetch(
      `${SERVICE_URL}/api/hocsinh/ho-so/${studentId}`
    );
    const result = await response.json();

    if (result.success) {
      // Tạo HTML động với thông tin học sinh
      const html = generateProfileHTML(result.data, studentId, req.query);
      res.send(html);
    } else {
      res.redirect("/login?error=2");
    }
  } catch (error) {
    console.error("Lỗi lấy hồ sơ:", error);
    res.redirect("/login?error=2");
  }
});

// Route cập nhật thông tin
app.post("/cap-nhat/:id", async (req, res) => {
  try {
    const studentId = req.params.id;
    const { dienThoai, diaChi, hinhAnh } = req.body;

    const response = await fetch(
      `${SERVICE_URL}/api/hocsinh/cap-nhat/${studentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dienThoai, diaChi, hinhAnh }),
      }
    );

    const result = await response.json();

    if (result.success) {
      res.redirect(`/ho-so?id=${studentId}&success=1`);
    } else {
      res.redirect(`/ho-so?id=${studentId}&error=1`);
    }
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.redirect(`/ho-so?id=${req.params.id}&error=1`);
  }
});

// Hàm tạo HTML cho trang hồ sơ
function generateProfileHTML(studentData, studentId, queryParams) {
  const info = studentData.thongTinCaNhan;
  const diemSo = studentData.diemSo || [];
  const diemDanh = studentData.diemDanh || [];

  // Tạo thông báo
  let alertHtml = "";
  if (queryParams.success) {
    alertHtml =
      '<div class="alert alert-success">✅ Cập nhật thông tin thành công!</div>';
  } else if (queryParams.error) {
    alertHtml =
      '<div class="alert alert-error">❌ Có lỗi xảy ra khi cập nhật!</div>';
  }

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hồ sơ học sinh - ${info.hoTen}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #007bff;
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .profile-section {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .avatar {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: #666;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 10px;
            align-items: center;
        }
        .label {
            font-weight: bold;
            color: #333;
        }
        .value {
            color: #666;
        }
        .section {
            margin: 30px 0;
        }
        .section h3 {
            color: #007bff;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .form-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: #0056b3;
        }
        .alert {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .logout-btn {
            background: #dc3545;
            color: white;
        }
        .logout-btn:hover {
            background: #c82333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Hồ sơ học sinh</h1>
            <a href="/login" class="btn logout-btn">Đăng xuất</a>
        </div>
        
        ${alertHtml}
        
        <div class="profile-section">
            <div class="avatar">
                👤
            </div>
            <div class="info-grid">
                <div class="label">Họ tên:</div>
                <div class="value">${info.hoTen}</div>
                
                <div class="label">Mã học sinh:</div>
                <div class="value">${info.id}</div>
                
                <div class="label">Giới tính:</div>
                <div class="value">${info.gioiTinh}</div>
                
                <div class="label">Ngày sinh:</div>
                <div class="value">${info.ngaySinh}</div>
                
                <div class="label">CMND:</div>
                <div class="value">${info.cmnd}</div>
                
                <div class="label">Lớp:</div>
                <div class="value">${info.lop}</div>
                
                <div class="label">Khối:</div>
                <div class="value">${info.khoi}</div>
                
                <div class="label">Địa chỉ:</div>
                <div class="value">${info.diaChi}</div>
                
                <div class="label">Điện thoại:</div>
                <div class="value">${info.dienThoai}</div>
            </div>
        </div>
        

        
        
        <div class="form-section">
            <h3>✏️ Cập nhật thông tin cá nhân</h3>
            <form action="/cap-nhat/${studentId}" method="POST">
                <div class="form-group">
                    <label for="dienThoai">Số điện thoại:</label>
                    <input type="tel" id="dienThoai" name="dienThoai" value="${info.dienThoai}">
                </div>
                
                <div class="form-group">
                    <label for="diaChi">Địa chỉ:</label>
                    <input type="text" id="diaChi" name="diaChi" value="${info.diaChi}">
                </div>
                
                <div class="form-group">
                    <label for="hinhAnh">Tên file hình ảnh:</label>
                    <input type="text" id="hinhAnh" name="hinhAnh" value="${info.hinhAnh}" placeholder="Ví dụ: avatar.jpg">
                </div>
                
                <button type="submit" class="btn">💾 Cập nhật thông tin</button>
            </form>
        </div>
    </div>
</body>
</html>
  `;
}

// Khởi động server
app.listen(PORT, () => {
  console.log(`Hệ thống học sinh đang chạy tại http://localhost:${PORT}`);
});
