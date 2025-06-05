// Hệ thống giao diện cho giáo vụ
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = 3002;
const SERVICE_URL = "http://localhost:3001";

// Lưu trữ session đơn giản
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
        role: "giaovu",
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
      `${SERVICE_URL}/api/giaovu/tra-cuu?keyword=${encodeURIComponent(
        keyword
      )}&userId=${userId}`
    );
    const result = await response.json();

    if (result.success) {
      const html = generateSearchHTML(
        result.data,
        keyword,
        currentUser.dsLopQuanLy || []
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

// Route quản lý điểm
app.get("/quan-ly-diem", (req, res) => {
  // Kiểm tra đăng nhập
  if (!currentUser) {
    return res.redirect("/login");
  }

  const html = generateGradeManagementHTML(currentUser.dsLopQuanLy || []);
  res.send(html);
});

// Route báo cáo thống kê
app.get("/bao-cao", async (req, res) => {
  try {
    // Kiểm tra đăng nhập
    if (!currentUser) {
      return res.redirect("/login");
    }

    const userId = currentUser.id;

    // Lấy thống kê theo lớp với phân quyền
    const classStatsResponse = await fetch(
      `${SERVICE_URL}/api/giaovu/thong-ke/theo-lop?userId=${userId}`
    );
    const classStatsResult = await classStatsResponse.json();

    const html = generateReportHTML(
      classStatsResult.success ? classStatsResult.data : [],
      currentUser.dsLopQuanLy || [],
      userId
    );
    res.send(html);
  } catch (error) {
    console.error("Lỗi tải báo cáo:", error);
    res.status(500).send("Lỗi server");
  }
});

// API cập nhật thông tin học sinh
app.post("/api/cap-nhat/:id", async (req, res) => {
  try {
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const response = await fetch(
      `${SERVICE_URL}/api/giaovu/cap-nhat/${req.params.id}?userId=${currentUser.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// API chuyển lớp
app.post("/api/chuyen-lop/:id", async (req, res) => {
  try {
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const response = await fetch(
      `${SERVICE_URL}/api/giaovu/chuyen-lop/${req.params.id}?userId=${currentUser.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Lỗi chuyển lớp:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// API thêm/cập nhật điểm
app.post("/api/diem-trung-binh", async (req, res) => {
  try {
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const response = await fetch(
      `${SERVICE_URL}/api/giaovu/diem-trung-binh?userId=${currentUser.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Lỗi thêm điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// API thống kê theo điểm
app.get("/api/thong-ke/theo-diem/:monHoc", async (req, res) => {
  try {
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const response = await fetch(
      `${SERVICE_URL}/api/giaovu/thong-ke/theo-diem/${encodeURIComponent(
        req.params.monHoc
      )}?userId=${currentUser.id}`
    );
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Lỗi thống kê:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Route logout
app.get("/logout", (req, res) => {
  currentUser = null;
  res.redirect("/login");
});

// Hàm tạo CSS chung
function getCommonCSS() {
  return `
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
    }
    .container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
        background: #17a2b8;
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
    .logout-btn {
        background: #dc3545;
        color: white;
    }
    .logout-btn:hover {
        background: #c82333;
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
        margin-right: 5px;
    }
    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-info { background: #17a2b8; color: white; }
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
  `;
}

// Hàm tạo HTML tra cứu học sinh
function generateSearchHTML(students, keyword, dsLopQuanLy) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý học sinh - Giáo vụ</title>
    <style>
        ${getCommonCSS()}
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
        .results-info {
            margin: 20px 0;
            padding: 10px;
            background: #d1ecf1;
            border-radius: 4px;
            color: #0c5460;
        }
        .permission-info {
            background: #e2e3e5;
            color: #383d41;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #d6d8db;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
        }
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover {
            color: black;
        }
        .form-modal .form-group {
            margin-bottom: 15px;
            display: block;
        }
        .form-modal .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-modal .form-group input, .form-modal .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Hệ thống giáo vụ</h1>
            <div class="nav">
                <a href="/tra-cuu" class="active">Quản lý học sinh</a>
                <a href="/quan-ly-diem">Quản lý điểm</a>
                <a href="/bao-cao">Báo cáo thống kê</a>
                <a href="/logout" class="logout-btn">Đăng xuất</a>
            </div>
        </div>
        
        
        <div class="search-form">
            <h3>🔍 Tìm kiếm học sinh</h3>
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
            }</strong> học sinh trong phạm vi quản lý
            ${keyword ? ` với từ khóa "<strong>${keyword}</strong>"` : ""}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Mã HS</th>
                    <th>Họ tên</th>
                    <th>Giới tính</th>
                    <th>Ngày sinh</th>
                    <th>Lớp</th>
                    <th>Khối</th>
                    <th>Điện thoại</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${students
                  .map(
                    (student) => `
                    <tr>
                        <td>${student.id}</td>
                        <td>${student.hoTen}</td>
                        <td>${student.gioiTinh}</td>
                        <td>${student.ngaySinh}</td>
                        <td><span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px;">${student.lop}</span></td>
                        <td>${student.khoi}</td>
                        <td>${student.dienThoai}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editStudent('${student.id}', '${student.hoTen}', '${student.dienThoai}', '${student.diaChi}', '${student.lop}')">
                                ✏️ Sửa
                            </button>
                            <button class="btn btn-info" onclick="transferStudent('${student.id}', '${student.hoTen}', '${student.lop}')">
                                🔄 Chuyển lớp
                            </button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
                ${
                  students.length === 0
                    ? '<tr><td colspan="8" style="text-align: center; color: #666;">❌ Không tìm thấy học sinh nào trong phạm vi quản lý</td></tr>'
                    : ""
                }
            </tbody>
        </table>
    </div>
    
    <!-- Modal sửa thông tin học sinh -->
    <div id="editModal" class="modal">
        <div class="modal-content form-modal">
            <span class="close" onclick="closeModal('editModal')">&times;</span>
            <h3>✏️ Cập nhật thông tin học sinh</h3>
            <form id="editForm">
                <input type="hidden" id="editStudentId">
                <div class="form-group">
                    <label>Họ tên:</label>
                    <input type="text" id="editHoTen" readonly>
                </div>
                <div class="form-group">
                    <label for="editDienThoai">Điện thoại:</label>
                    <input type="tel" id="editDienThoai" required>
                </div>
                <div class="form-group">
                    <label for="editDiaChi">Địa chỉ:</label>
                    <input type="text" id="editDiaChi" required>
                </div>
                <button type="submit" class="btn btn-success">💾 Cập nhật</button>
                <button type="button" class="btn" onclick="closeModal('editModal')">❌ Hủy</button>
            </form>
        </div>
    </div>
    
    <!-- Modal chuyển lớp -->
    <div id="transferModal" class="modal">
        <div class="modal-content form-modal">
            <span class="close" onclick="closeModal('transferModal')">&times;</span>
            <h3>🔄 Chuyển lớp học sinh</h3>
            <form id="transferForm">
                <input type="hidden" id="transferStudentId">
                <div class="form-group">
                    <label>Học sinh:</label>
                    <input type="text" id="transferHoTen" readonly>
                </div>
                <div class="form-group">
                    <label>Lớp hiện tại:</label>
                    <input type="text" id="currentClass" readonly>
                </div>
                <div class="form-group">
                    <label for="newClass">Lớp mới (chỉ trong phạm vi quản lý):</label>
                    <select id="newClass" required>
                        <option value="">Chọn lớp mới...</option>
                        ${dsLopQuanLy
                          .map(
                            (lop) => `<option value="${lop}">${lop}</option>`
                          )
                          .join("")}
                    </select>
                </div>
                <button type="submit" class="btn btn-success">🔄 Chuyển lớp</button>
                <button type="button" class="btn" onclick="closeModal('transferModal')">❌ Hủy</button>
            </form>
        </div>
    </div>
    
    <script>
        function editStudent(id, hoTen, dienThoai, diaChi, lop) {
            document.getElementById('editStudentId').value = id;
            document.getElementById('editHoTen').value = hoTen;
            document.getElementById('editDienThoai').value = dienThoai;
            document.getElementById('editDiaChi').value = diaChi;
            document.getElementById('editModal').style.display = 'block';
        }
        
        function transferStudent(id, hoTen, currentLop) {
            document.getElementById('transferStudentId').value = id;
            document.getElementById('transferHoTen').value = hoTen;
            document.getElementById('currentClass').value = currentLop;
            document.getElementById('transferModal').style.display = 'block';
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        // Xử lý form sửa thông tin
        document.getElementById('editForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('editStudentId').value;
            const data = {
                dienThoai: document.getElementById('editDienThoai').value,
                diaChi: document.getElementById('editDiaChi').value
            };
            
            try {
                const response = await fetch(\`/api/cap-nhat/\${id}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Cập nhật thành công!');
                    closeModal('editModal');
                    location.reload();
                } else {
                    alert('❌ Lỗi: ' + result.message);
                }
            } catch (error) {
                alert('❌ Lỗi kết nối server!');
                console.error('Error:', error);
            }
        });
        
        // Xử lý form chuyển lớp
        document.getElementById('transferForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('transferStudentId').value;
            const lopMoi = document.getElementById('newClass').value;
            
            try {
                const response = await fetch(\`/api/chuyen-lop/\${id}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ lopMoi })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Chuyển lớp thành công!');
                    closeModal('transferModal');
                    location.reload();
                } else {
                    alert('❌ Lỗi: ' + result.message);
                }
            } catch (error) {
                alert('❌ Lỗi kết nối server!');
                console.error('Error:', error);
            }
        });
        
        // Đóng modal khi click outside
        window.onclick = function(event) {
            const editModal = document.getElementById('editModal');
            const transferModal = document.getElementById('transferModal');
            if (event.target == editModal) {
                editModal.style.display = 'none';
            }
            if (event.target == transferModal) {
                transferModal.style.display = 'none';
            }
        }
    </script>
</body>
</html>
  `;
}

// Hàm tạo HTML quản lý điểm
function generateGradeManagementHTML(dsLopQuanLy) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý điểm - Giáo vụ</title>
    <style>
        ${getCommonCSS()}
        .form-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 200px;
            gap: 15px;
            align-items: end;
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
        .permission-info {
            background: #e2e3e5;
            color: #383d41;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #d6d8db;
        }
        .note {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #ffeaa7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Hệ thống giáo vụ</h1>
            <div class="nav">
                <a href="/tra-cuu">Quản lý học sinh</a>
                <a href="/quan-ly-diem" class="active">Quản lý điểm</a>
                <a href="/bao-cao">Báo cáo thống kê</a>
                <a href="/logout" class="logout-btn">Đăng xuất</a>
            </div>
        </div>
        
        
        <div class="note">
            <strong>💡 Lưu ý:</strong> Mã học sinh phải thuộc một trong các lớp: ${dsLopQuanLy.join(
              ", "
            )}. 
            Hệ thống sẽ kiểm tra quyền truy cập trước khi cho phép ghi điểm.
        </div>
        
        <div id="alert-container"></div>
        
        <div class="form-section">
            <h3>📝 Ghi nhận điểm trung bình</h3>
            <form id="gradeForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="studentId">Mã học sinh:</label>
                        <input type="text" id="studentId" placeholder="VD: HS001" required>
                        <small>Phải thuộc lớp được phân công</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="monHoc">Môn học:</label>
                        <select id="monHoc" required>
                            <option value="">Chọn môn học...</option>
                            <option value="Toán">Toán</option>
                            <option value="Văn">Văn</option>
                            <option value="Anh">Tiếng Anh</option>
                            <option value="Lý">Vật Lý</option>
                            <option value="Hóa">Hóa Học</option>
                            <option value="Sinh">Sinh Học</option>
                            <option value="Sử">Lịch Sử</option>
                            <option value="Địa">Địa Lý</option>
                            <option value="GDCD">GDCD</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="hocKy">Học kỳ:</label>
                        <select id="hocKy" required>
                            <option value="">Chọn học kỳ...</option>
                            <option value="1">Học kỳ 1</option>
                            <option value="2">Học kỳ 2</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="diemTrungBinh">Điểm TB:</label>
                        <input type="number" id="diemTrungBinh" min="0" max="10" step="0.1" placeholder="0.0" required>
                    </div>
                    
                    <button type="submit" class="btn btn-success">💾 Lưu điểm</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        document.getElementById('gradeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                studentId: document.getElementById('studentId').value,
                monHoc: document.getElementById('monHoc').value,
                hocKy: parseInt(document.getElementById('hocKy').value),
                diemTrungBinh: parseFloat(document.getElementById('diemTrungBinh').value)
            };
            
            // Validation điểm
            if (data.diemTrungBinh < 0 || data.diemTrungBinh > 10) {
                showAlert('❌ Điểm phải nằm trong khoảng 0-10!', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/diem-trung-binh', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('✅ Ghi nhận điểm thành công!', 'success');
                    document.getElementById('gradeForm').reset();
                } else {
                    showAlert('❌ Lỗi: ' + result.message, 'error');
                }
            } catch (error) {
                showAlert('❌ Lỗi kết nối server!', 'error');
                console.error('Error:', error);
            }
        });
        
        function showAlert(message, type) {
            const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
            const alertHTML = \`<div class="alert \${alertClass}">\${message}</div>\`;
            
            document.getElementById('alert-container').innerHTML = alertHTML;
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                document.getElementById('alert-container').innerHTML = '';
            }, 5000);
        }
    </script>
</body>
</html>
  `;
}

// Hàm tạo HTML báo cáo thống kê
function generateReportHTML(classStats, dsLopQuanLy, userId) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo thống kê - Giáo vụ</title>
    <style>
        ${getCommonCSS()}
        .report-section {
            margin: 30px 0;
        }
        .report-section h3 {
            color: #17a2b8;
            border-bottom: 2px solid #17a2b8;
            padding-bottom: 5px;
        }
        .form-section {
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
        .form-group input, .form-group select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        .permission-info {
            background: #e2e3e5;
            color: #383d41;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #d6d8db;
        }
        .stats-summary {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 15px;
            border: 1px solid #c3e6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Hệ thống giáo vụ</h1>
            <div class="nav">
                <a href="/tra-cuu">Quản lý học sinh</a>
                <a href="/quan-ly-diem">Quản lý điểm</a>
                <a href="/bao-cao" class="active">Báo cáo thống kê</a>
                <a href="/logout" class="logout-btn">Đăng xuất</a>
            </div>
        </div>
        
        
        <div class="report-section">
            <h3>📊 BM3 - Thống kê số học sinh theo lớp</h3>
            
            ${
              classStats.length > 0
                ? `
            <div class="stats-summary">
                <strong>📈 Tổng quan:</strong> 
                ${classStats.length} lớp, 
                ${classStats.reduce(
                  (sum, stat) => sum + stat.soHocSinh,
                  0
                )} học sinh trong phạm vi quản lý
            </div>
            `
                : ""
            }
            
            <table>
                <thead>
                    <tr>
                        <th>Lớp</th>
                        <th>Số học sinh</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    ${classStats
                      .map(
                        (stat) => `
                        <tr>
                            <td><span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px;">${stat.lop}</span></td>
                            <td><strong>${stat.soHocSinh}</strong></td>
                        
                        </tr>
                    `
                      )
                      .join("")}
                    ${
                      classStats.length === 0
                        ? '<tr><td colspan="3" style="text-align: center; color: #666;">Chưa có dữ liệu trong phạm vi quản lý</td></tr>'
                        : ""
                    }
                </tbody>
            </table>
        </div>
        
        <div class="report-section">
            <h3>📈 BM4 - Thống kê số học sinh theo điểm trung bình </h3>
            <div class="form-section">
                <div class="form-group">
                    <label for="monHocSelect">Chọn môn học:</label>
                    <select id="monHocSelect">
                        <option value="">Chọn môn học...</option>
                        <option value="Toán">Toán</option>
                        <option value="Văn">Văn</option>
                        <option value="Anh">Tiếng Anh</option>
                        <option value="Lý">Vật Lý</option>
                        <option value="Hóa">Hóa Học</option>
                        <option value="Sinh">Sinh Học</option>
                        <option value="Sử">Lịch Sử</option>
                        <option value="Địa">Địa Lý</option>
                        <option value="GDCD">GDCD</option>
                    </select>
                    <button type="button" class="btn btn-primary" onclick="loadGradeStats()">📊 Xem thống kê</button>
                </div>
            </div>
            
            <div id="grade-stats-container" style="display: none;">
                <div id="grade-stats-table"></div>
            </div>
        </div>
    </div>
    
    <script>
        async function loadGradeStats() {
            const monHoc = document.getElementById('monHocSelect').value;
            
            if (!monHoc) {
                alert('Vui lòng chọn môn học!');
                return;
            }
            
            try {
                const response = await fetch(\`/api/thong-ke/theo-diem/\${encodeURIComponent(monHoc)}\`);
                const result = await response.json();
                
                if (result.success) {
                    displayGradeStats(result.data);
                    document.getElementById('grade-stats-container').style.display = 'block';
                } else {
                    alert('Lỗi tải thống kê: ' + result.message);
                }
            } catch (error) {
                alert('Lỗi kết nối server!');
                console.error('Error:', error);
            }
        }
        
        function displayGradeStats(data) {
            const tableHTML = \`
                <div class="stats-summary">
                    <strong> Thống kê môn \${data.monHoc}</strong><br>
                    <strong> Phạm vi:</strong> \${data.phamViQuanLy || 'Tất cả các lớp'}<br>
                    <strong> Tổng số học sinh:</strong> \${data.tongSoHocSinh}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Điểm số</th>
                            <th>Số học sinh</th>
                            <th>Tỷ lệ (%)</th>
                        
                        </tr>
                    </thead>
                    <tbody>
                        \${data.thongKe.map(stat => \`
                            <tr>
                                <td><strong>\${stat.doanDiem}</strong></td>
                                <td>\${stat.soHocSinh}</td>
                                <td>\${stat.tyLe}%</td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
            
            document.getElementById('grade-stats-table').innerHTML = tableHTML;
        }
    </script>
</body>
</html>
  `;
}

// Khởi động server
app.listen(PORT, () => {
  console.log(`Hệ thống giáo vụ đang chạy tại http://localhost:${PORT}`);
});
