// Xử lý các API cho giáo vụ
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Tra cứu học sinh - chỉ hiển thị học sinh trong lớp được phân công
router.get("/tra-cuu", (req, res) => {
  try {
    const { keyword, userId } = req.query;

    // Lấy danh sách lớp quản lý của giáo vụ
    let dsLopQuanLy = [];
    if (userId) {
      const giaoVuFile = path.join(
        __dirname,
        "data",
        "Giaovu",
        `${userId}.json`
      );
      if (fs.existsSync(giaoVuFile)) {
        const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
        dsLopQuanLy = giaoVuData.dsLopQuanLy || [];
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

        if (
          !keyword ||
          info.hoTen.toLowerCase().includes(keyword.toLowerCase()) ||
          info.lop.toLowerCase().includes(keyword.toLowerCase()) ||
          info.id.toLowerCase().includes(keyword.toLowerCase())
        ) {
          results.push({
            id: info.id,
            hoTen: info.hoTen,
            gioiTinh: info.gioiTinh,
            ngaySinh: info.ngaySinh,
            lop: info.lop,
            khoi: info.khoi,
            dienThoai: info.dienThoai,
            diaChi: info.diaChi,
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

// Cập nhật thông tin học sinh - kiểm tra quyền truy cập
router.put("/cap-nhat/:id", (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;
    const { userId } = req.query;

    const filePath = path.join(
      __dirname,
      "data",
      "Hocsinh",
      `${studentId}.json`
    );

    if (fs.existsSync(filePath)) {
      const studentData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Kiểm tra quyền truy cập
      if (userId) {
        const giaoVuFile = path.join(
          __dirname,
          "data",
          "Giaovu",
          `${userId}.json`
        );
        if (fs.existsSync(giaoVuFile)) {
          const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
          const dsLopQuanLy = giaoVuData.dsLopQuanLy || [];

          if (
            dsLopQuanLy.length > 0 &&
            !dsLopQuanLy.includes(studentData.thongTinCaNhan.lop)
          ) {
            return res.status(403).json({
              success: false,
              message: "Không có quyền quản lý lớp này",
            });
          }
        }
      }

      // Cập nhật các trường được phép
      Object.keys(updateData).forEach((key) => {
        if (key in studentData.thongTinCaNhan && key !== "id") {
          studentData.thongTinCaNhan[key] = updateData[key];
        }
      });

      fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2));
      res.json({ success: true, message: "Cập nhật thành công" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy học sinh" });
    }
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Lấy danh sách lớp quản lý của giáo vụ
router.get("/lop-quan-ly/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const giaoVuFile = path.join(__dirname, "data", "Giaovu", `${userId}.json`);

    if (fs.existsSync(giaoVuFile)) {
      const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
      const dsLopQuanLy = giaoVuData.dsLopQuanLy || [];
      res.json({ success: true, data: dsLopQuanLy });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giáo vụ" });
    }
  } catch (error) {
    console.error("Lỗi lấy danh sách lớp:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

router.put("/chuyen-lop/:id", (req, res) => {
  try {
    const studentId = req.params.id;
    const { lopMoi } = req.body;
    const { userId } = req.query;

    // Kiểm tra quyền truy cập
    let dsLopQuanLy = [];
    if (userId) {
      const giaoVuFile = path.join(
        __dirname,
        "data",
        "Giaovu",
        `${userId}.json`
      );
      if (fs.existsSync(giaoVuFile)) {
        const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
        dsLopQuanLy = giaoVuData.dsLopQuanLy || [];
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
      const lopHienTai = studentData.thongTinCaNhan.lop;

      // Kiểm tra quyền quản lý lớp hiện tại
      if (dsLopQuanLy.length > 0 && !dsLopQuanLy.includes(lopHienTai)) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền quản lý lớp hiện tại ${lopHienTai}`,
        });
      }

      // Kiểm tra quyền quản lý lớp đích
      if (dsLopQuanLy.length > 0 && !dsLopQuanLy.includes(lopMoi)) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền chuyển đến lớp ${lopMoi}. Chỉ có thể chuyển trong: ${dsLopQuanLy.join(
            ", "
          )}`,
        });
      }

      studentData.thongTinCaNhan.lop = lopMoi;
      // Cập nhật khối dựa trên lớp mới
      studentData.thongTinCaNhan.khoi = lopMoi.charAt(0);

      fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2));
      res.json({ success: true, message: "Chuyển lớp thành công" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy học sinh" });
    }
  } catch (error) {
    console.error("Lỗi chuyển lớp:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Ghi nhận điểm trung bình - kiểm tra quyền truy cập
router.post("/diem-trung-binh", (req, res) => {
  try {
    const { studentId, monHoc, hocKy, diemTrungBinh } = req.body;
    const { userId } = req.query;

    // Kiểm tra quyền truy cập
    let dsLopQuanLy = [];
    if (userId) {
      const giaoVuFile = path.join(
        __dirname,
        "data",
        "Giaovu",
        `${userId}.json`
      );
      if (fs.existsSync(giaoVuFile)) {
        const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
        dsLopQuanLy = giaoVuData.dsLopQuanLy || [];
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
      const lopHocSinh = studentData.thongTinCaNhan.lop;

      // Kiểm tra quyền quản lý lớp của học sinh này
      if (dsLopQuanLy.length > 0 && !dsLopQuanLy.includes(lopHocSinh)) {
        return res.status(403).json({
          success: false,
          message: `Không có quyền ghi điểm cho lớp ${lopHocSinh}. Bạn chỉ quản lý: ${dsLopQuanLy.join(
            ", "
          )}`,
        });
      }

      // Tìm và cập nhật điểm đã có hoặc thêm mới
      const existingIndex = studentData.diemSo.findIndex(
        (ds) => ds.monHoc === monHoc && ds.hocKy === hocKy
      );

      if (existingIndex >= 0) {
        studentData.diemSo[existingIndex].diemTrungBinh =
          parseFloat(diemTrungBinh);
      } else {
        studentData.diemSo.push({
          monHoc: monHoc,
          hocKy: parseInt(hocKy),
          diemTrungBinh: parseFloat(diemTrungBinh),
        });
      }

      fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2));
      res.json({ success: true, message: "Ghi nhận điểm thành công" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy học sinh" });
    }
  } catch (error) {
    console.error("Lỗi ghi điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Thống kê số học sinh theo lớp (BM3) - chỉ lớp được phân công
router.get("/thong-ke/theo-lop", (req, res) => {
  try {
    const { userId } = req.query;

    // Lấy danh sách lớp quản lý của giáo vụ
    let dsLopQuanLy = [];
    if (userId) {
      const giaoVuFile = path.join(
        __dirname,
        "data",
        "Giaovu",
        `${userId}.json`
      );
      if (fs.existsSync(giaoVuFile)) {
        const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
        dsLopQuanLy = giaoVuData.dsLopQuanLy || [];
      }
    }

    const hocSinhDir = path.join(__dirname, "data", "Hocsinh");
    const files = fs.readdirSync(hocSinhDir);
    const thongKe = {};

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const studentData = JSON.parse(
          fs.readFileSync(path.join(hocSinhDir, file), "utf8")
        );
        const lop = studentData.thongTinCaNhan.lop;

        // Chỉ thống kê lớp được phân công quản lý
        if (dsLopQuanLy.length === 0 || dsLopQuanLy.includes(lop)) {
          if (thongKe[lop]) {
            thongKe[lop]++;
          } else {
            thongKe[lop] = 1;
          }
        }
      }
    });

    const results = Object.keys(thongKe)
      .map((lop) => ({
        lop: lop,
        soHocSinh: thongKe[lop],
      }))
      .sort((a, b) => a.lop.localeCompare(b.lop));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Lỗi thống kê theo lớp:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Thống kê số học sinh theo điểm trung bình (BM4) - chỉ lớp được phân công
router.get("/thong-ke/theo-diem/:monHoc", (req, res) => {
  try {
    const { monHoc } = req.params;
    const { userId } = req.query;

    // Lấy danh sách lớp quản lý của giáo vụ
    let dsLopQuanLy = [];
    if (userId) {
      const giaoVuFile = path.join(
        __dirname,
        "data",
        "Giaovu",
        `${userId}.json`
      );
      if (fs.existsSync(giaoVuFile)) {
        const giaoVuData = JSON.parse(fs.readFileSync(giaoVuFile, "utf8"));
        dsLopQuanLy = giaoVuData.dsLopQuanLy || [];
      }
    }

    const hocSinhDir = path.join(__dirname, "data", "Hocsinh");
    const files = fs.readdirSync(hocSinhDir);

    let duoi5 = 0,
      tu5den7 = 0,
      tu7den9 = 0,
      tren9 = 0,
      tongSo = 0;

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const studentData = JSON.parse(
          fs.readFileSync(path.join(hocSinhDir, file), "utf8")
        );
        const lopHocSinh = studentData.thongTinCaNhan.lop;

        // Chỉ thống kê học sinh thuộc lớp được phân công quản lý
        if (dsLopQuanLy.length === 0 || dsLopQuanLy.includes(lopHocSinh)) {
          const diemMon = studentData.diemSo.find((ds) => ds.monHoc === monHoc);

          if (diemMon) {
            tongSo++;
            const diem = diemMon.diemTrungBinh;

            if (diem < 5) duoi5++;
            else if (diem <= 7) tu5den7++;
            else if (diem <= 9) tu7den9++;
            else tren9++;
          }
        }
      }
    });

    const results = {
      monHoc: monHoc,
      phamViQuanLy:
        dsLopQuanLy.length > 0 ? dsLopQuanLy.join(", ") : "Tất cả các lớp",
      thongKe: [
        {
          doanDiem: "< 5",
          soHocSinh: duoi5,
          tyLe: tongSo > 0 ? Math.round((duoi5 / tongSo) * 100) : 0,
        },
        {
          doanDiem: "5 - 7",
          soHocSinh: tu5den7,
          tyLe: tongSo > 0 ? Math.round((tu5den7 / tongSo) * 100) : 0,
        },
        {
          doanDiem: "7 - 9",
          soHocSinh: tu7den9,
          tyLe: tongSo > 0 ? Math.round((tu7den9 / tongSo) * 100) : 0,
        },
        {
          doanDiem: ">= 9",
          soHocSinh: tren9,
          tyLe: tongSo > 0 ? Math.round((tren9 / tongSo) * 100) : 0,
        },
      ],
      tongSoHocSinh: tongSo,
    };

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Lỗi thống kê theo điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
