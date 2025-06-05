// Hệ thống giao diện cho giám thị
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = 3010;
const SERVICE_URL = "http://localhost:3001";

// Lưu trữ session đơn giản (trong production nên dùng express-session)
let currentUser = null;

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
        role: "giamthi",
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Lưu thông tin user vào session
      currentUser = result.user;
      res.redirect("/tra-cuu");
    } else {
      res.redirect("/login?error=1");
    }
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.redirect("/login?error=1");
  }
});

// Route tra cứu học sinh
app.get("/tra-cuu", async (req, res) => {
  try {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      return res.redirect("/login");
    }

    const keyword = req.query.keyword || "";
    const userId = currentUser.id;

    const response = await fetch(
      `${SERVICE_URL}/api/giamthi/tra-cuu?keyword=${encodeURIComponent(
        keyword
      )}&userId=${userId}`
    );
    const result = await response.json();

    if (result.success) {
      // Lấy danh sách lớp quản lý
      const lopResponse = await fetch(
        `${SERVICE_URL}/api/giamthi/lop-quan-ly/${userId}`
      );
      const lopResult = await lopResponse.json();
      const dsLopQuanLy = lopResult.success
        ? lopResult.data
        : currentUser.dsLopQuanLy || [];

      const html = generateSearchHTML(
        result.data,
        keyword,
        dsLopQuanLy,
        userId
      );
      res.send(html);
    } else {
      res.status(500).send("Lỗi tải dữ liệu");
    }
  } catch (error) {
    console.error("Lỗi tra cứu:", error);
    res.status(500).send("Lỗi server");
  }
});

// Route điểm danh theo lớp
app.get("/diem-danh", async (req, res) => {
  try {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      return res.redirect("/login");
    }

    const userId = currentUser.id;

    // Lấy danh sách lớp quản lý
    const lopResponse = await fetch(
      `${SERVICE_URL}/api/giamthi/lop-quan-ly/${userId}`
    );
    const lopResult = await lopResponse.json();
    const dsLopQuanLy = lopResult.success
      ? lopResult.data
      : currentUser.dsLopQuanLy || [];

    const html = generateAttendanceFormHTML(dsLopQuanLy, userId);
    res.send(html);
  } catch (error) {
    console.error("Lỗi tải form điểm danh:", error);
    res.status(500).send("Lỗi server");
  }
});

// API lấy danh sách điểm danh theo lớp và ngày
app.get("/api/diem-danh/:lop/:ngay", async (req, res) => {
  try {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const { lop, ngay } = req.params;
    const userId = currentUser.id;

    const response = await fetch(
      `${SERVICE_URL}/api/giamthi/diem-danh/${encodeURIComponent(
        lop
      )}/${ngay}?userId=${userId}`
    );
    const result = await response.json();

    res.json(result);
  } catch (error) {
    console.error("Lỗi lấy điểm danh:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Xử lý ghi nhận điểm danh
app.post("/diem-danh", async (req, res) => {
  try {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const userId = currentUser.id;
    const requestData = { ...req.body, userId };

    const response = await fetch(`${SERVICE_URL}/api/giamthi/diem-danh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Lỗi điểm danh:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Route logout
app.get("/logout", (req, res) => {
  currentUser = null;
  res.redirect("/login");
});

// Hàm tạo HTML tra cứu học sinh
function generateSearchHTML(students, keyword, dsLopQuanLy, userId) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tra cứu học sinh - Giám thị</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #28a745;
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav {
            display: flex;
            gap: 10px;
        }
        .nav a {
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            transition: background 0.3s;
        }
        .nav a:hover, .nav a.active {
            background: rgba(255,255,255,0.3);
        }
        .permission-info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #bee5eb;
        }
        .search-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .form-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .form-group input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        .btn-primary {
            background: #007bff;
            color: white;
        }
        .btn-primary:hover {
            background: #0056b3;
        }
        .btn-success {
            background: #28a745;
            color: white;
        }
        .btn-success:hover {
            background: #1e7e34;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #495057;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e3f2fd;
        }
        .results-info {
            margin: 20px 0;
            padding: 10px;
            background: #d1ecf1;
            border-radius: 4px;
            color: #0c5460;
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
            <h1>👮‍♀️ Hệ thống giám thị</h1>
            <div class="nav">
                <a href="/tra-cuu" class="active">Tra cứu học sinh</a>
                <a href="/diem-danh">Điểm danh</a>
                <a href="/logout" class="logout-btn">Đăng xuất</a>
            </div>
        </div>
        

        
        <div class="search-form">
            <h3>🔍 Tra cứu học sinh</h3>
            <form action="/tra-cuu" method="GET">
                <div class="form-group">
                    <label for="keyword">Từ khóa (tên, lớp, mã HS):</label>
                    <input type="text" id="keyword" name="keyword" value="${keyword}" placeholder="Nhập tên học sinh, lớp hoặc mã học sinh...">
                    <button type="submit" class="btn btn-primary">🔍 Tìm kiếm</button>
                </div>
            </form>
        </div>
        
        <div class="results-info">
            📊 Tìm thấy <strong>${
              students.length
            }</strong> học sinh trong các lớp được phân công
            ${keyword ? ` với từ khóa "<strong>${keyword}</strong>"` : ""}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Mã học sinh</th>
                    <th>Họ tên</th>
                    <th>Lớp</th>
                    <th>Khối</th>
                </tr>
            </thead>
            <tbody>
                ${students
                  .map(
                    (student) => `
                    <tr>
                        <td>${student.id}</td>
                        <td>${student.hoTen}</td>
                        <td><span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px;">${student.lop}</span></td>
                        <td>${student.khoi}</td>
                    </tr>
                `
                  )
                  .join("")}
                ${
                  students.length === 0
                    ? '<tr><td colspan="4" style="text-align: center; color: #666;">❌ Không tìm thấy học sinh nào trong các lớp được phân công</td></tr>'
                    : ""
                }
            </tbody>
        </table>
    </div>
</body>
</html>
  `;
}

// Hàm tạo HTML cho form điểm danh
function generateAttendanceFormHTML(dsLopQuanLy, userId) {
  const today = new Date().toISOString().split("T")[0];

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Điểm danh - Giám thị</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #28a745;
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav {
            display: flex;
            gap: 10px;
        }
        .nav a {
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            transition: background 0.3s;
        }
        .nav a:hover, .nav a.active {
            background: rgba(255,255,255,0.3);
        }
        .form-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
        }
        .btn-primary {
            background: #007bff;
            color: white;
        }
        .btn-success {
            background: #28a745;
            color: white;
        }
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
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
        .status-present {
            color: #28a745;
            font-weight: bold;
        }
        .status-absent {
            color: #dc3545;
            font-weight: bold;
        }
        .alert {
            padding: 15px;
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
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 200px;
            gap: 15px;
            align-items: end;
        }
        .permission-info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #bee5eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Hệ thống giám thị</h1>
            <div class="nav">
                <a href="/tra-cuu">Tra cứu học sinh</a>
                <a href="/diem-danh" class="active">Điểm danh</a>
                <a href="/logout" class="logout-btn">Đăng xuất</a>
            </div>
        </div>
        
        <div id="alert-container"></div>
        

        
        <div class="form-section">
            <h3>📝 Điểm danh theo lớp</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label for="lop">Lớp:</label>
                    <select id="lop" required>
                        <option value="">Chọn lớp...</option>
                        ${dsLopQuanLy
                          .map(
                            (lop) => `<option value="${lop}">${lop}</option>`
                          )
                          .join("")}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="ngay">Ngày:</label>
                    <input type="date" id="ngay" value="${today}" required>
                </div>
                
                <button type="button" class="btn btn-primary" onclick="loadAttendanceList()">📋 Tải danh sách</button>
            </div>
        </div>
        
        <div id="attendance-list" style="display: none;">
            <h3>📊 Danh sách điểm danh</h3>
            <div id="attendance-table"></div>
        </div>
    </div>
    
    <script>
        async function loadAttendanceList() {
            const lop = document.getElementById('lop').value;
            const ngay = document.getElementById('ngay').value;
            
            if (!lop || !ngay) {
                showAlert('Vui lòng chọn lớp và ngày!', 'error');
                return;
            }
            
            try {
                const response = await fetch(\`/api/diem-danh/\${encodeURIComponent(lop)}/\${ngay}\`);
                const result = await response.json();
                
                if (result.success) {
                    displayAttendanceTable(result.data, lop, ngay);
                    document.getElementById('attendance-list').style.display = 'block';
                } else {
                    showAlert('Lỗi tải danh sách: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Lỗi kết nối server!', 'error');
                console.error('Error:', error);
            }
        }
        
        function displayAttendanceTable(students, lop, ngay) {
            const tableHTML = \`
                <table>
                    <thead>
                        <tr>
                            <th>Mã HS</th>
                            <th>Họ tên</th>
                            <th>Trạng thái</th>
                            <th>Lý do vắng</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${students.map(student => \`
                            <tr id="row-\${student.id}">
                                <td>\${student.id}</td>
                                <td>\${student.hoTen}</td>
                                <td>
                                    <span class="\${student.vang ? 'status-absent' : 'status-present'}">
                                        \${student.vang ? '❌ Vắng' : '✅ Có mặt'}
                                    </span>
                                </td>
                                <td>\${student.ly_do_vang || '-'}</td>
                                <td>
                                    <button class="btn btn-warning" onclick="markAttendance('\${student.id}', '\${lop}', '\${ngay}')">
                                        ✏️ Điểm danh
                                    </button>
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
            
            document.getElementById('attendance-table').innerHTML = tableHTML;
        }
        
        async function markAttendance(studentId, lop, ngay) {
            const lyDoVang = prompt('Lý do vắng (để trống nếu có mặt):');
            
            if (lyDoVang === null) return; // User cancelled
            
            try {
                const response = await fetch('/diem-danh', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        studentId: studentId,
                        ngay: ngay,
                        ly_do_vang: lyDoVang
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('Ghi nhận điểm danh thành công!', 'success');
                    loadAttendanceList(); // Reload the list
                } else {
                    showAlert('Lỗi ghi nhận điểm danh: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('Lỗi kết nối server!', 'error');
                console.error('Error:', error);
            }
        }
        
        function showAlert(message, type) {
            const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
            const alertHTML = \`<div class="alert \${alertClass}">\${message}</div>\`;
            
            document.getElementById('alert-container').innerHTML = alertHTML;
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                document.getElementById('alert-container').innerHTML = '';
            }, 3000);
        }
    </script>
</body>
</html>
  `;
}

// Khởi động server
app.listen(PORT, () => {
  console.log(`Hệ thống giám thị đang chạy tại http://localhost:${PORT}`);
});
