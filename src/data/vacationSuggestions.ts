// Vacation destination suggestions and travel tips
// Budget suggestions are for 2 adults, 3 days 2 nights (base reference)

export interface DestinationSuggestion {
  name: string;
  emoji: string;
  region: 'domestic' | 'international';
  budgetMin: number;  // triệu VND for 2 adults, 3D2N
  budgetMax: number;
  highlight: string;
  bestMonths?: string;
}

export const DESTINATION_SUGGESTIONS: DestinationSuggestion[] = [
  // Trong nước
  { name: 'Đà Lạt', emoji: '🌸', region: 'domestic', budgetMin: 4, budgetMax: 8, highlight: 'Homestay giá tốt, thời tiết mát mẻ', bestMonths: 'Quanh năm' },
  { name: 'Phú Quốc', emoji: '🏖️', region: 'domestic', budgetMin: 8, budgetMax: 15, highlight: 'Resort cao cấp, ăn hải sản tươi', bestMonths: 'T11 - T4' },
  { name: 'Huế - Đà Nẵng - Hội An', emoji: '🏯', region: 'domestic', budgetMin: 6, budgetMax: 12, highlight: 'Di tích lịch sử, biển đẹp, phố cổ', bestMonths: 'T2 - T8' },
  { name: 'Sapa', emoji: '⛰️', region: 'domestic', budgetMin: 5, budgetMax: 10, highlight: 'Trekking, ruộng bậc thang, homestay bản làng', bestMonths: 'T9 - T11, T3 - T5' },
  { name: 'Hà Nội', emoji: '🗼', region: 'domestic', budgetMin: 5, budgetMax: 10, highlight: 'Phố cổ, ẩm thực đường phố, bảo tàng', bestMonths: 'T10 - T12, T3 - T4' },
  { name: 'Nha Trang', emoji: '🌊', region: 'domestic', budgetMin: 5, budgetMax: 12, highlight: 'Lặn biển, vinpearl, hải sản', bestMonths: 'T1 - T8' },
  { name: 'Quy Nhơn', emoji: '🌅', region: 'domestic', budgetMin: 4, budgetMax: 9, highlight: 'Biển hoang sơ, bún chả cá, yên tĩnh', bestMonths: 'T3 - T9' },
  { name: 'Hạ Long', emoji: '🚢', region: 'domestic', budgetMin: 6, budgetMax: 15, highlight: 'Du thuyền, hang động, kayak', bestMonths: 'T4 - T10' },
  { name: 'Côn Đảo', emoji: '🏝️', region: 'domestic', budgetMin: 8, budgetMax: 18, highlight: 'Lặn biển, rùa biển, hoang sơ', bestMonths: 'T3 - T9' },
  // Quốc tế
  { name: 'Bangkok', emoji: '🇹🇭', region: 'international', budgetMin: 10, budgetMax: 20, highlight: 'Visa-free, street food, chùa chiền', bestMonths: 'T11 - T3' },
  { name: 'Tokyo', emoji: '🇯🇵', region: 'international', budgetMin: 25, budgetMax: 45, highlight: 'JR Pass, konbini, sakura / lá đỏ', bestMonths: 'T3 - T5, T10 - T11' },
  { name: 'Seoul', emoji: '🇰🇷', region: 'international', budgetMin: 15, budgetMax: 30, highlight: 'K-culture, skincare, BBQ', bestMonths: 'T3 - T5, T9 - T11' },
  { name: 'Singapore', emoji: '🇸🇬', region: 'international', budgetMin: 15, budgetMax: 25, highlight: 'Universal Studios, Gardens by the Bay', bestMonths: 'Quanh năm' },
  { name: 'Bali', emoji: '🇮🇩', region: 'international', budgetMin: 12, budgetMax: 25, highlight: 'Villa riêng, đền chùa, cánh đồng lúa', bestMonths: 'T4 - T10' },
];

export interface TravelTip {
  id: string;
  category: string;
  emoji: string;
  title: string;
  content: string;
}

export const TRAVEL_TIPS: TravelTip[] = [
  // Vé máy bay
  { id: 'tip_flight_1', category: 'Vé máy bay', emoji: '✈️', title: 'Đặt trước 2-3 tháng', content: 'Giá vé rẻ nhất thường rơi vào khoảng 2-3 tháng trước ngày bay. Đặt sớm hơn hoặc muộn hơn đều đắt hơn.' },
  { id: 'tip_flight_2', category: 'Vé máy bay', emoji: '✈️', title: 'Bay giữa tuần', content: 'Thứ 3, thứ 4 thường có giá vé rẻ nhất. Tránh bay cuối tuần và ngày lễ.' },
  { id: 'tip_flight_3', category: 'Vé máy bay', emoji: '✈️', title: 'So sánh giá trên nhiều nền tảng', content: 'Dùng Google Flights, Skyscanner, hoặc Traveloka để so sánh. Đôi khi đặt trực tiếp trên web hãng bay lại rẻ hơn.' },
  { id: 'tip_flight_4', category: 'Vé máy bay', emoji: '✈️', title: 'Bật thông báo giá', content: 'Google Flights cho phép theo dõi giá vé. Khi giá giảm sẽ có email thông báo.' },
  // Chỗ ở
  { id: 'tip_stay_1', category: 'Chỗ ở', emoji: '🏨', title: 'Homestay thay vì khách sạn', content: 'Homestay thường rẻ hơn 30-50%, lại có bếp nấu ăn tiết kiệm thêm.' },
  { id: 'tip_stay_2', category: 'Chỗ ở', emoji: '🏨', title: 'Booking early bird', content: 'Booking.com và Agoda thường có flash sale. Chọn loại "miễn phí hủy" để linh hoạt.' },
  { id: 'tip_stay_3', category: 'Chỗ ở', emoji: '🏨', title: 'Ở xa trung tâm một chút', content: 'Khách sạn cách trung tâm 2-3km thường rẻ hơn 40% mà vẫn tiện di chuyển bằng grab.' },
  // Ăn uống
  { id: 'tip_food_1', category: 'Ăn uống', emoji: '🍜', title: 'Ăn sáng tại khách sạn', content: 'Chọn khách sạn có bao gồm bữa sáng. Tiết kiệm 100-200k/ngày cho cả gia đình.' },
  { id: 'tip_food_2', category: 'Ăn uống', emoji: '🍜', title: 'Tìm quán local', content: 'Hỏi dân địa phương hoặc search "quán ăn ngon [tên thành phố]" trên Google Maps. Quán local vừa ngon vừa rẻ.' },
  { id: 'tip_food_3', category: 'Ăn uống', emoji: '🍜', title: 'Mang theo đồ ăn vặt', content: 'Mang sẵn bánh, nước từ siêu thị. Tiết kiệm khi đi tham quan cả ngày.' },
  // Với trẻ nhỏ
  { id: 'tip_kid_1', category: 'Du lịch với bé', emoji: '👶', title: 'Chọn nơi có hồ bơi', content: 'Trẻ em thích nước! Resort/khách sạn có hồ bơi giúp bé vui mà bố mẹ được nghỉ ngơi.' },
  { id: 'tip_kid_2', category: 'Du lịch với bé', emoji: '👶', title: 'Lịch trình thoải mái', content: 'Đừng nhồi nhét quá nhiều điểm. 2-3 điểm/ngày là đủ. Dành thời gian cho bé ngủ trưa.' },
  { id: 'tip_kid_3', category: 'Du lịch với bé', emoji: '👶', title: 'Mang đồ quen thuộc', content: 'Gối ôm, đồ chơi yêu thích giúp bé ngủ ngon hơn ở nơi lạ.' },
  // Tiết kiệm chung
  { id: 'tip_save_1', category: 'Tiết kiệm chung', emoji: '💡', title: 'Đi mùa thấp điểm', content: 'Giá phòng và vé máy bay rẻ hơn 30-50% ngoài mùa cao điểm. Ít đông đúc hơn.' },
  { id: 'tip_save_2', category: 'Tiết kiệm chung', emoji: '💡', title: 'Dùng thẻ tín dụng tích điểm', content: 'Thanh toán bằng thẻ tín dụng tích miles/điểm. Tích lũy đủ có thể đổi vé máy bay miễn phí.' },
  { id: 'tip_save_3', category: 'Tiết kiệm chung', emoji: '💡', title: 'Lập ngân sách trước', content: 'Xác định rõ tổng ngân sách và phân bổ cho từng hạng mục. Có kế hoạch = ít bị "vung tay".' },
];

export const PACKING_CHECKLIST = [
  { id: 'pack_1', label: 'Giấy tờ tùy thân (CMND/CCCD/Passport)', category: 'Giấy tờ' },
  { id: 'pack_2', label: 'Vé máy bay / xe (in hoặc lưu điện thoại)', category: 'Giấy tờ' },
  { id: 'pack_3', label: 'Voucher khách sạn', category: 'Giấy tờ' },
  { id: 'pack_4', label: 'Bảo hiểm du lịch', category: 'Giấy tờ' },
  { id: 'pack_5', label: 'Quần áo (đủ ngày + 1 bộ dự phòng)', category: 'Trang phục' },
  { id: 'pack_6', label: 'Đồ bơi', category: 'Trang phục' },
  { id: 'pack_7', label: 'Áo khoác nhẹ / áo mưa', category: 'Trang phục' },
  { id: 'pack_8', label: 'Kem chống nắng SPF 50+', category: 'Vệ sinh' },
  { id: 'pack_9', label: 'Bàn chải, kem đánh răng', category: 'Vệ sinh' },
  { id: 'pack_10', label: 'Thuốc cá nhân / sơ cứu', category: 'Sức khỏe' },
  { id: 'pack_11', label: 'Thuốc say xe / tiêu chảy', category: 'Sức khỏe' },
  { id: 'pack_12', label: 'Sạc điện thoại / pin dự phòng', category: 'Thiết bị' },
  { id: 'pack_13', label: 'Tai nghe', category: 'Thiết bị' },
  { id: 'pack_14', label: 'Máy ảnh / GoPro', category: 'Thiết bị' },
  { id: 'pack_15', label: 'Bỉm, sữa, đồ ăn dặm (nếu có bé)', category: 'Cho bé yêu' },
  { id: 'pack_16', label: 'Đồ chơi / sách tô màu cho bé', category: 'Cho bé yêu' },
];

/**
 * Scale budget suggestion based on number of people and days.
 * Base reference: 2 adults, 3 days 2 nights.
 */
export function scaleBudget(
  baseBudgetMin: number,
  baseBudgetMax: number,
  adults: number,
  children: number,
  days: number
): { min: number; max: number } {
  const basePeople = 2;
  const baseDays = 3;
  const effectivePeople = adults + children * 0.5; // children count as half
  const peopleRatio = effectivePeople / basePeople;
  const dayRatio = days / baseDays;
  return {
    min: Math.round(baseBudgetMin * peopleRatio * dayRatio * 10) / 10,
    max: Math.round(baseBudgetMax * peopleRatio * dayRatio * 10) / 10,
  };
}
