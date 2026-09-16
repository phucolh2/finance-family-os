const fs = require('fs');

const replacements = [
  {
    file: 'src/components/layout/Sidebar.tsx',
    rules: [
      { from: /title: 'Đời sống Gia đình'/g, to: "title: 'Góc Tổ Ấm'" },
      { from: /name: 'Kho Giấy tờ'/g, to: "name: 'Tủ Giấy Tờ'" },
      { from: /name: 'Sổ Hiếu hỷ'/g, to: "name: 'Sổ Ân Tình'" },
      { from: /name: 'Nhật ký Sức khoẻ'/g, to: "name: 'Nhật Ký Khỏe Mạnh'" },
      { from: /title: 'Tiện ích Gia đình'/g, to: "title: 'Chăm Sóc Nhà Cửa'" },
      { from: /name: 'Thiết bị & Bảo hành'/g, to: "name: 'Đồ Đạc Trong Nhà'" },
      { from: /name: 'Quản lý Thuê bao'/g, to: "name: 'Dịch Vụ Đang Dùng'" },
      { from: /name: 'Danh bạ Dịch vụ'/g, to: "name: 'Danh Bạ Bỏ Túi'" },
      { from: /title: 'Nuôi dạy & Sinh hoạt'/g, to: "title: 'Bếp Núc & Con Cái'" },
      { from: /name: 'Thực đơn & Đi chợ'/g, to: "name: 'Cơm Nhà & Đi Chợ'" },
      { from: /name: 'Việc nhà & Khen thưởng'/g, to: "name: 'Cùng Làm Việc Nhà'" },
      { from: /name: 'Sổ tay Tăng trưởng'/g, to: "name: 'Hành Trình Khôn Lớn'" },
      { from: /name: 'Tầm nhìn Gia đình'/g, to: "name: 'Ước Mơ Của Cả Nhà'" }
    ]
  },
  {
    file: 'src/pages/DocumentVault.tsx',
    rules: [
      { from: /Kho Giấy tờ/g, to: "Tủ Giấy Tờ Gia Đình" },
      { from: /Sổ tay quản lý các giấy tờ quan trọng của gia đình/g, to: "Nơi cất giữ an toàn những giấy tờ quan trọng của cả nhà" }
    ]
  },
  {
    file: 'src/pages/GivingLedger.tsx',
    rules: [
      { from: /Sổ Hiếu hỷ & Biếu tặng/g, to: "Sổ Ân Tình (Hiếu Hỷ)" },
      { from: /Sổ tay quản lý dòng tiền hiếu hỷ, biếu tặng/g, to: "Ghi nhớ những ân tình, quà cáp, cưới hỏi để vợ chồng luôn trọn vẹn trước sau" }
    ]
  },
  {
    file: 'src/pages/HealthTracker.tsx',
    rules: [
      { from: /Nhật ký Sức khoẻ/g, to: "Nhật Ký Khỏe Mạnh" },
      { from: /Theo dõi lịch sử khám chữa bệnh và y bạ/g, to: "Theo dõi sức khỏe, lịch khám để cả nhà luôn an tâm sống khỏe" }
    ]
  },
  {
    file: 'src/pages/HomeInventory.tsx',
    rules: [
      { from: /Quản lý Thiết bị & Bảo hành/g, to: "Đồ Đạc Trong Nhà" },
      { from: /Sổ tay theo dõi tài sản, nhắc lịch vệ sinh\/bảo dưỡng đồ điện máy trong nhà/g, to: "Ghi nhớ lịch bảo dưỡng, thời hạn bảo hành để đồ đạc luôn bền đẹp" }
    ]
  },
  {
    file: 'src/pages/SubscriptionTracker.tsx',
    rules: [
      { from: /Quản lý Thuê bao/g, to: "Các Dịch Vụ Đang Dùng" },
      { from: /Theo dõi chi phí định kỳ và nhắc lịch gia hạn các dịch vụ/g, to: "Theo dõi tiền mạng, truyền hình, giải trí... để không lãng phí chi tiêu" }
    ]
  },
  {
    file: 'src/pages/FamilyContacts.tsx',
    rules: [
      { from: /Danh bạ Dịch vụ Gia đình/g, to: "Danh Bạ Bỏ Túi" },
      { from: /Danh bạ chia sẻ của gia đình, truy cập nhanh các dịch vụ thiết yếu/g, to: "Số điện thoại thợ thầy, bác sĩ quen, cô giáo... khi cần là có ngay" }
    ]
  },
  {
    file: 'src/pages/MealPlanner.tsx',
    rules: [
      { from: /Thực đơn & Đi chợ/g, to: "Cơm Nhà & Đi Chợ" },
      { from: /Lên thực đơn tuần và checklist những món cần mua/g, to: "Món ngon mỗi ngày và danh sách mua sắm cho bữa cơm gia đình thêm ấm cúng" }
    ]
  },
  {
    file: 'src/pages/ChoreChart.tsx',
    rules: [
      { from: /Việc nhà & Điểm thưởng/g, to: "Cùng Làm Việc Nhà" },
      { from: /Giao việc nhà và khuyến khích các bé thông qua điểm thưởng/g, to: "Khuyến khích các thiên thần nhỏ san sẻ việc nhà và nhận sao khen thưởng" }
    ]
  },
  {
    file: 'src/pages/ChildGrowth.tsx',
    rules: [
      { from: /Sổ tay Tăng trưởng/g, to: "Hành Trình Khôn Lớn" },
      { from: /Ghi chép hành trình phát triển thể chất và tinh thần của các bé/g, to: "Lưu giữ từng mốc phát triển, từng khoảnh khắc đáng yêu của các con" }
    ]
  },
  {
    file: 'src/pages/VisionBoard.tsx',
    rules: [
      { from: /Tầm nhìn Gia đình/g, to: "Ước Mơ & Văn Hóa" },
      { from: /Nơi lưu giữ ước mơ chung và văn hoá của gia đình/g, to: "Những mong muốn cả nhà sẽ cùng làm và những nguyên tắc yêu thương" }
    ]
  }
];

replacements.forEach(task => {
  if (fs.existsSync(task.file)) {
    let content = fs.readFileSync(task.file, 'utf8');
    task.rules.forEach(rule => {
      content = content.replace(rule.from, rule.to);
    });
    fs.writeFileSync(task.file, content, 'utf8');
    console.log(`Updated ${task.file}`);
  } else {
    console.log(`File not found: ${task.file}`);
  }
});
