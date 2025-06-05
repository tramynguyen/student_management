// Xử lý các API cho học sinh
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Lấy thông tin hồ sơ học sinh
router.get("/ho-so/:id", (req, res) => {
  try {
    const studentId = req.params.id;
    const filePath = path.join(
      __dirname,
      "data",
      "Hocsinh",
      `${studentId}.json`
    );

    if (fs.existsSync(filePath)) {
      const studentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      // Không trả về thông tin đăng nhập
      delete studentData.thongTinDangNhap;
      res.json({ success: true, data: studentData });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy học sinh" });
    }
  } catch (error) {
    console.error("Lỗi lấy hồ sơ:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Cập nhật thông tin cá nhân (điện thoại, địa chỉ, hình ảnh)
router.put("/cap-nhat/:id", (req, res) => {
  try {
    const studentId = req.params.id;
    const { dienThoai, diaChi, hinhAnh } = req.body;
    const filePath = path.join(
      __dirname,
      "data",
      "Hocsinh",
      `${studentId}.json`
    );

    if (fs.existsSync(filePath)) {
      const studentData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Cập nhật thông tin được phép
      if (dienThoai !== undefined)
        studentData.thongTinCaNhan.dienThoai = dienThoai;
      if (diaChi !== undefined) studentData.thongTinCaNhan.diaChi = diaChi;
      if (hinhAnh !== undefined) studentData.thongTinCaNhan.hinhAnh = hinhAnh;

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

module.exports = router;
