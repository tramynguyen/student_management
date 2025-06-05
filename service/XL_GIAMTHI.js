// Xử lý các API cho giám thị
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Tra cứu học sinh - chỉ hiển thị học sinh trong lớp được phân công
router.get("/tra-cuu", (req, res) => {
  try {
    const { keyword, userId } = req.query;

    // Lấy danh sách lớp quản lý của giám thị
    let dsLopQuanLy = [];
    if (userId) {
      const giamThiFile = path.join(
        __dirname,
        "data",
        "Giamthi",
        `${userId}.json`
      );
      if (fs.existsSync(giamThiFile)) {
        const giamThiData = JSON.parse(fs.readFileSync(giamThiFile, "utf8"));
        dsLopQuanLy = giamThiData.dsLopQuanLy || [];
      }
    }

    const hocSinhDir = path.join(__dirname, "data", "Hocsinh");
    const files = fs.readdirSync(hocSinhDir);
    const results = [];

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const studentData = JSON.parse(
          fs.readFileSync(path.join(hocSinhDir, file), "utf8")
        );
        const info = studentData.thongTinCaNhan;

        // Chỉ hiển thị học sinh thuộc lớp được phân công
        if (dsLopQuanLy.length > 0 && !dsLopQuanLy.includes(info.lop)) {
          return;
        }

        // Tìm kiếm theo tên, lớp hoặc ID
        if (
          !keyword ||
          info.hoTen.toLowerCase().includes(keyword.toLowerCase()) ||
          info.lop.toLowerCase().includes(keyword.toLowerCase()) ||
          info.id.toLowerCase().includes(keyword.toLowerCase())
        ) {
          results.push({
            id: info.id,
            hoTen: info.hoTen,
            lop: info.lop,
            khoi: info.khoi,
          });
        }
      }
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Lỗi tra cứu:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Ghi nhận điểm danh - kiểm tra quyền truy cập
router.post("/diem-danh", (req, res) => {
  try {
    const { studentId, ngay, ly_do_vang, userId } = req.body;

    // Kiểm tra quyền truy cập
    let dsLopQuanLy = [];
    if (userId) {
      const giamThiFile = path.join(
        __dirname,
        "data",
        "Giamthi",
        `${userId}.json`
      );
      if (fs.existsSync(giamThiFile)) {
        const giamThiData = JSON.parse(fs.readFileSync(giamThiFile, "utf8"));
        dsLopQuanLy = giamThiData.dsLopQuanLy || [];
      }
    }

    const filePath = path.join(
      __dirname,
      "data",
      "Hocsinh",
      `${studentId}.json`
    );

    if (fs.existsSync(filePath)) {
      const studentData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Kiểm tra quyền quản lý lớp của học sinh này
      if (
        dsLopQuanLy.length > 0 &&
        !dsLopQuanLy.includes(studentData.thongTinCaNhan.lop)
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Không có quyền quản lý lớp này" });
      }

      // Kiểm tra xem đã điểm danh ngày này chưa
      const existingIndex = studentData.diemDanh.findIndex(
        (dd) => dd.ngay === ngay
      );

      if (existingIndex >= 0) {
        // Cập nhật điểm danh đã có
        studentData.diemDanh[existingIndex].ly_do_vang = ly_do_vang || "";
      } else {
        // Thêm điểm danh mới
        studentData.diemDanh.push({
          ngay: ngay,
          ly_do_vang: ly_do_vang || "",
        });
      }

      fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2));
      res.json({ success: true, message: "Ghi nhận điểm danh thành công" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy học sinh" });
    }
  } catch (error) {
    console.error("Lỗi điểm danh:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Lấy danh sách điểm danh theo lớp và ngày - kiểm tra quyền truy cập
router.get("/diem-danh/:lop/:ngay", (req, res) => {
  try {
    const { lop, ngay } = req.params;
    const { userId } = req.query;

    // Kiểm tra quyền truy cập
    if (userId) {
      const giamThiFile = path.join(
        __dirname,
        "data",
        "Giamthi",
        `${userId}.json`
      );
      if (fs.existsSync(giamThiFile)) {
        const giamThiData = JSON.parse(fs.readFileSync(giamThiFile, "utf8"));
        const dsLopQuanLy = giamThiData.dsLopQuanLy || [];

        if (dsLopQuanLy.length > 0 && !dsLopQuanLy.includes(lop)) {
          return res.status(403).json({
            success: false,
            message: "Không có quyền quản lý lớp này",
          });
        }
      }
    }

    const hocSinhDir = path.join(__dirname, "data", "Hocsinh");
    const files = fs.readdirSync(hocSinhDir);
    const results = [];

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const studentData = JSON.parse(
          fs.readFileSync(path.join(hocSinhDir, file), "utf8")
        );
        const info = studentData.thongTinCaNhan;

        if (info.lop === lop) {
          const diemDanhNgay = studentData.diemDanh.find(
            (dd) => dd.ngay === ngay
          );
          results.push({
            id: info.id,
            hoTen: info.hoTen,
            vang: diemDanhNgay
              ? diemDanhNgay.ly_do_vang
                ? true
                : false
              : false,
            ly_do_vang: diemDanhNgay ? diemDanhNgay.ly_do_vang : "",
          });
        }
      }
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Lỗi lấy điểm danh:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Lấy danh sách lớp quản lý của giám thị
router.get("/lop-quan-ly/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const giamThiFile = path.join(
      __dirname,
      "data",
      "Giamthi",
      `${userId}.json`
    );

    if (fs.existsSync(giamThiFile)) {
      const giamThiData = JSON.parse(fs.readFileSync(giamThiFile, "utf8"));
      const dsLopQuanLy = giamThiData.dsLopQuanLy || [];
      res.json({ success: true, data: dsLopQuanLy });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giám thị" });
    }
  } catch (error) {
    console.error("Lỗi lấy danh sách lớp:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
