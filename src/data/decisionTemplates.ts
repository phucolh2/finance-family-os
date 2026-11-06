import type { FamilyDecisionRecord } from '../types/finance';

export interface DecisionTemplate {
  id: string;
  title: string;
  category: FamilyDecisionRecord['category'];
  contextType: FamilyDecisionRecord['contextType'];
  description: string;
  defaultHusband: {
    wants: string;
    concerns: string;
    targetOutcome: string;
  };
  defaultWife: {
    wants: string;
    concerns: string;
    targetOutcome: string;
  };
  sampleEvidence: {
    type: 'FACT' | 'CALCULATION' | 'ASSUMPTION' | 'EMOTIONAL_CONCERN';
    content: string;
  }[];
  samplePerspectives: {
    analystView: string;
    skepticView: string;
    strategistView: string;
    mediatorView: string;
  };
  sampleOptions: FamilyDecisionRecord['options'];
  recommendedGuardrails: string;
}

export const FAMILY_DECISION_TEMPLATES: DecisionTemplate[] = [
  {
    id: 'template_car_purchase',
    title: 'Mua Ô tô Gia đình (Xe Mới vs Xe Lướt vs Tiếp tục Đi Xe Máy/Taxi)',
    category: 'lifestyle',
    contextType: 'complicated',
    description: 'Bất đồng về việc nên mua ô tô phục vụ đưa đón con và an toàn gia đình hay giữ tiền để đầu tư sinh lời.',
    defaultHusband: {
      wants: 'Mua xe SUV mới tầm giá 800 - 900 triệu (trả góp 50% nếu cần) để đi lại an toàn mùa mưa nắng, đưa đón con và gia đình về quê.',
      concerns: 'Sợ bỏ lỡ cơ hội hưởng thụ khi con còn nhỏ, nhưng cũng lo tiền nuôi xe (gửi xe, bảo dưỡng, xăng) ngốn 6 - 8 triệu/tháng.',
      targetOutcome: 'Gia đình có phương tiện che mưa che nắng, an toàn và nâng cao chất lượng cuộc sống.',
    },
    defaultWife: {
      wants: 'Giữ tiền mặt để gửi tiết kiệm hoặc tích lũy mua đất, đi lại nội thành thì đi taxi/Grab cho tiện và không phải lo chỗ đỗ.',
      concerns: 'Xe là tiêu sản mất giá 10%/năm, sợ gánh nặng chi phí hàng tháng ảnh hưởng đến quỹ dự phòng và tiền học của con.',
      targetOutcome: 'Tài chính gia đình an toàn tuyệt đối, không phát sinh chi phí cố định hàng tháng quá lớn.',
    },
    sampleEvidence: [
      { type: 'FACT', content: 'Chi phí taxi/Grab gia đình hiện tại khoảng 3.5 triệu/tháng cho các chuyến đi xa và đưa đón đột xuất.' },
      { type: 'CALCULATION', content: 'Mua xe 800 triệu: Khấu hao ~65 triệu/năm + Nuôi xe ~70 triệu/năm = Chi phí cơ hội ~11.2 triệu/tháng.' },
      { type: 'ASSUMPTION', content: 'Có xe sẽ giúp gia đình gắn kết hơn qua các chuyến dã ngoại cuối tuần và giảm nguy cơ tai nạn giao thông xe máy.' },
      { type: 'EMOTIONAL_CONCERN', content: 'Vợ cảm thấy bất an khi thấy số dư tài khoản giảm đột ngột và sợ áp lực trả nợ nếu công việc có biến động.' },
    ],
    samplePerspectives: {
      analystView: 'Xe hơi là tiêu sản thuần túy. Nếu dòng tiền tự do hàng tháng > 25 triệu và Quỹ dự phòng đủ 6 tháng chi phí thì ngân sách chịu tải được.',
      skepticView: 'Mua xe mới trả góp trong giai đoạn kinh tế biến động sẽ tạo gánh nặng dòng tiền kép (lãi vay + chi phí vận hành).',
      strategistView: 'Giải pháp dung hòa: Chọn xe lướt (qua sử dụng 2-3 năm) giá chỉ 450 - 550 triệu, khấu hao đã giảm 30%, trả thẳng 100% không vay.',
      mediatorView: 'Công nhận nhu cầu an toàn cho con của Chồng là chính đáng, đồng thời tôn trọng nhu cầu an tâm tài chính của Vợ. Tránh vay nợ tiêu sản.',
    },
    sampleOptions: [
      {
        id: 'opt_1',
        name: 'Phương án A: Mua xe lướt 2-3 năm tuổi (Trả thẳng 100%)',
        description: 'Dùng tối đa 500 triệu từ nguồn thanh khoản nhàn rỗi (không đụng quỹ dự phòng), trả thẳng để không chịu lãi suất vay.',
        pros: ['Tiết kiệm 300 triệu so với xe mới', 'Không có nợ vay hàng tháng', 'Đảm bảo an toàn che mưa nắng cho con'],
        cons: ['Phải kiểm tra kỹ chất lượng xe cũ', 'Bảo hành hãng sắp hết'],
        costEstimate: 500,
        riskLevel: 'low',
        reversibility: 'moderate',
        score: 88,
      },
      {
        id: 'opt_2',
        name: 'Phương án B: Mua xe mới 800 triệu (Vay ngân hàng 40%)',
        description: 'Trả trước 480 triệu, vay 320 triệu trong 4 năm, mỗi tháng trả gốc + lãi ~8.5 triệu.',
        pros: ['Xe mới tinh 100%, bảo hành 5 năm', 'Cảm giác an tâm tuyệt đối'],
        cons: ['Áp lực trả nợ 4 năm', 'Chi phí nuôi xe + lãi vay ngốn 15 triệu/tháng'],
        costEstimate: 800,
        riskLevel: 'high',
        reversibility: 'difficult',
        score: 62,
      },
      {
        id: 'opt_3',
        name: 'Phương án C: Giữ nguyên hiện trạng + Tăng ngân sách Taxi 1 năm',
        description: 'Chưa mua xe ngay. Cấp ngân sách 5 triệu/tháng gọi taxi thoải mái, đánh giá lại sau 12 tháng.',
        pros: ['Bảo toàn 100% vốn đầu tư sinh lời', 'Không phải lo bảo dưỡng, gửi xe'],
        cons: ['Bất tiện khi đi xa đột xuất hoặc ngày lễ tết'],
        costEstimate: 60,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 75,
      },
    ],
    recommendedGuardrails: 'Tổng chi phí vận hành xe không được vượt quá 15% tổng thu nhập hàng tháng của gia đình. Quỹ dự phòng khẩn cấp phải giữ nguyên tối thiểu 6 tháng.',
  },
  {
    id: 'template_real_estate_investment',
    title: 'Đầu tư Bất Động Sản (Mua Đất / Căn hộ thứ 2 dùng Đòn Bẩy)',
    category: 'property',
    contextType: 'complex',
    description: 'Chồng muốn dùng đòn bẩy ngân hàng để chốt bất động sản tiềm năng vs Vợ sợ rủi ro thanh khoản và áp lực lãi thả nổi.',
    defaultHusband: {
      wants: 'Vay 800 triệu - 1 tỷ để mua lô đất / căn hộ tiềm năng đón đầu chu kỳ hạ tầng.',
      concerns: 'Sợ bỏ lỡ cơ hội giá tốt (FOMO), nhưng cũng áp lực nếu đất đóng băng thanh khoản không thoát được hàng.',
      targetOutcome: 'Tạo đột phá tài sản ròng cho gia đình sau 3-5 năm.',
    },
    defaultWife: {
      wants: 'Chỉ mua khi có đủ 70-80% tiền mặt, hoặc tiếp tục gửi tiết kiệm/vàng cho chắc ăn.',
      concerns: 'Sợ lãi suất ngân hàng tăng vọt sau thời gian ưu đãi, nếu giảm thu nhập thì gia đình mất khả năng trả nợ.',
      targetOutcome: 'Bảo vệ mái ấm và dòng tiền sinh hoạt gia đình không bị đe dọa bởi nợ xấu.',
    },
    sampleEvidence: [
      { type: 'FACT', content: 'Tỷ lệ nợ trên thu nhập (DTI) của gia đình hiện tại là 0%.' },
      { type: 'CALCULATION', content: 'Vay 1 tỷ thời hạn 20 năm, lãi suất 10.5%/năm: Gốc + lãi hàng tháng ~12.5 triệu.' },
      { type: 'ASSUMPTION', content: 'Bất động sản tăng giá tối thiểu 12%/năm trong 3 năm tới.' },
      { type: 'EMOTIONAL_CONCERN', content: 'Vợ mất ngủ vì lo lắng nếu có tháng không đủ tiền trả nợ ngân hàng sẽ bị siết tài sản.' },
    ],
    samplePerspectives: {
      analystView: 'Áp lực trả nợ 12.5 triệu chiếm khoảng 30% thặng dư dòng tiền hàng tháng. Nằm ở ngưỡng an toàn nếu thu nhập ổn định.',
      skepticView: 'Bất động sản thanh khoản chậm. Nếu gia đình cần tiền khẩn cấp thì không thể bán ngay trong 1 tuần được.',
      strategistView: 'Chỉ nên vay tối đa 30% giá trị tài sản. Lập quỹ dự phòng trả nợ riêng biệt đủ cho 12 tháng trả gốc lãi.',
      mediatorView: 'Điều kiện tiên quyết để Vợ đồng thuận: Phải có Quỹ bảo hiểm trả nợ 12 tháng gửi riêng ở tài khoản tiết kiệm.',
    },
    sampleOptions: [
      {
        id: 'opt_1',
        name: 'Phương án A: Mua với tỷ lệ vay an toàn ≤ 30% + Lập quỹ trả nợ 12 tháng',
        description: 'Chọn tài sản vừa tầm tài chính, chỉ vay tối đa 30%, trích riêng 150 triệu gửi tiết kiệm chỉ để trả nợ nếu có biến cố.',
        pros: ['Vẫn đón được sóng tăng trưởng', 'Vợ hoàn toàn yên tâm vì có quỹ gối đầu 1 năm'],
        cons: ['Phải hạ tiêu chuẩn chọn bất động sản nhỏ hơn'],
        costEstimate: 1200,
        riskLevel: 'medium',
        reversibility: 'difficult',
        score: 90,
      },
      {
        id: 'opt_2',
        name: 'Phương án B: Vay tối đa 50% để mua tài sản vị trí đắc địa',
        description: 'Vay 1 tỷ để mua tài sản trung tâm, áp lực trả nợ 14 triệu/tháng.',
        pros: ['Tài sản thanh khoản tốt, tăng giá cao'],
        cons: ['Rủi ro dòng tiền rất cao nếu lãi suất tăng'],
        costEstimate: 2000,
        riskLevel: 'high',
        reversibility: 'difficult',
        score: 58,
      },
      {
        id: 'opt_3',
        name: 'Phương án C: Tích lũy thêm 18 tháng, đầu tư tài sản thanh khoản cao',
        description: 'Tạm thời chưa mua BĐS, phân bổ tiền vào chứng khoán cổ tức và tiền gửi có kỳ hạn.',
        pros: ['An toàn 100%, thanh khoản tức thì'],
        cons: ['Có thể giá đất tăng nhanh hơn tốc độ tiết kiệm'],
        costEstimate: 0,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 74,
      },
    ],
    recommendedGuardrails: 'Tổng nghĩa vụ trả nợ hàng tháng (DTI) không bao giờ vượt quá 35% thu nhập ròng. Luôn duy trì Quỹ trả nợ gối đầu 12 tháng.',
  },
  {
    id: 'template_child_education',
    title: 'Đầu tư Học vấn cho Con (Trường Tư/Quốc tế vs Trường Công + Học thêm)',
    category: 'education',
    contextType: 'complicated',
    description: 'Bất đồng về việc nên dành ngân sách lớn cho con học trường quốc tế/song ngữ hay trường công lập để dành tiền du học sau này.',
    defaultHusband: {
      wants: 'Cho con học trường công lập chuẩn quốc gia để rèn luyện tính tự lập, dành tiền tiết kiệm đầu tư vào quỹ du học đại học.',
      concerns: 'Học trường tư học phí tăng 10-15% mỗi năm, nếu lỡ đứt gánh giữa chừng chuyển trường sẽ ảnh hưởng tâm lý con.',
      targetOutcome: 'Chi phí học phổ thông hợp lý, tối ưu quỹ tài chính du học khi con 18 tuổi.',
    },
    defaultWife: {
      wants: 'Cho con học trường song ngữ/tư thục chất lượng cao ngay từ cấp 1 để môi trường tiếng Anh tốt, không bị áp lực học thêm.',
      concerns: 'Sợ trường công quá tải sĩ số, cô giáo dạy thêm, con thiếu kỹ năng mềm và sự tự tin giao tiếp quốc tế.',
      targetOutcome: 'Con phát triển toàn diện, tự tin và hạnh phúc mỗi ngày đến trường.',
    },
    sampleEvidence: [
      { type: 'FACT', content: 'Học phí trường song ngữ hiện tại: 18 - 25 triệu/tháng. Trường công: 2.5 - 4 triệu/tháng (đã gồm bán trú).' },
      { type: 'CALCULATION', content: 'Chênh lệch 12 năm học phổ thông là khoảng 2.2 - 2.8 tỷ đồng (chưa tính lạm phát học phí).' },
      { type: 'ASSUMPTION', content: 'Khoản tiền 2.5 tỷ nếu đầu tư với lãi kép 10%/năm trong 12 năm sẽ đạt hơn 6.5 tỷ đồng khi con 18 tuổi.' },
      { type: 'EMOTIONAL_CONCERN', content: 'Cả hai đều muốn điều tốt nhất cho con nhưng sợ con thua thiệt so với bạn bè cùng trang lứa.' },
    ],
    samplePerspectives: {
      analystView: 'Học phí là chi phí cam kết dài hạn 12 năm, không thể cắt giảm đột ngột. Chi phí học vấn chỉ nên chiếm tối đa 20% thu nhập gia đình.',
      skepticView: 'Trường tư tạo môi trường tốt nhưng gia đình sẽ bị phụ thuộc tài chính nặng nề, khó tạo dựng các quỹ đầu tư khác.',
      strategistView: 'Giải pháp lai: Học trường công chất lượng cao + đầu tư khóa học tiếng Anh bản ngữ & câu lạc bộ kỹ năng mềm 6 triệu/tháng.',
      mediatorView: 'Con cái học tốt nhất khi cha mẹ hòa thuận, không bị áp lực nợ nần đè nặng làm mất đi niềm vui gia đình.',
    },
    sampleOptions: [
      {
        id: 'opt_1',
        name: 'Phương án A: Mô hình Lai (Trường Công Chất Lượng + CLB Song Ngữ Chuyên Sâu)',
        description: 'Học trường công điểm gần nhà + đầu tư gói tiếng Anh bản ngữ và kỹ năng 6 triệu/tháng. Dành 10 triệu/tháng tích lũy quỹ du học.',
        pros: ['Chi phí cân bằng (8-10 tr/tháng)', 'Có sẵn quỹ đại học khủng cho con', 'Vẫn đảm bảo tiếng Anh xuất sắc'],
        cons: ['Bố mẹ phải chịu khó đưa đón học thêm ngoại khóa'],
        costEstimate: 120,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 92,
      },
      {
        id: 'opt_2',
        name: 'Phương án B: Cho con học trường song ngữ toàn phần (22 triệu/tháng)',
        description: 'Đăng ký trường song ngữ quốc tế, gia đình cắt giảm chi tiêu mua sắm và du lịch.',
        pros: ['Môi trường chuẩn mực, con không phải đi học thêm'],
        cons: ['Chiếm hơn 30% thu nhập, hạn chế khả năng tích lũy đầu tư'],
        costEstimate: 260,
        riskLevel: 'medium',
        reversibility: 'difficult',
        score: 70,
      },
      {
        id: 'opt_3',
        name: 'Phương án C: Thử nghiệm trường tư 1 năm cấp 1, rà soát lại trước khi lên cấp 2',
        description: 'Cho con học thử 1 năm để đánh giá sự thích nghi và khả năng tài chính thực tế.',
        pros: ['Kiểm chứng được con có hợp môi trường không'],
        cons: ['Nếu đổi trường sau 1 năm con có thể hụt hẫng'],
        costEstimate: 200,
        riskLevel: 'medium',
        reversibility: 'moderate',
        score: 78,
      },
    ],
    recommendedGuardrails: 'Tổng chi phí giáo dục cho tất cả các con không vượt quá 20% tổng thu nhập hàng tháng của gia đình.',
  },
  {
    id: 'template_lending_to_relatives',
    title: 'Hỗ trợ Tài chính / Cho Người Thân Vay Tiền Làm Ăn',
    category: 'relatives',
    contextType: 'complex',
    description: 'Người thân trong gia đình nội/ngoại hỏi vay một khoản tiền lớn (100 - 300 triệu), hai vợ chồng băn khoăn giữa tình nghĩa và an toàn tài chính.',
    defaultHusband: {
      wants: 'Muốn hỗ trợ vì là anh em ruột thịt / người thân trong lúc khó khăn cần vốn làm ăn.',
      concerns: 'Sợ công việc làm ăn của người thân rủi ro, không thu hồi được nợ làm vợ chồng xích mích.',
      targetOutcome: 'Tròn vẹn nghĩa tình gia đình mà không làm rạn nứt kinh tế vợ chồng.',
    },
    defaultWife: {
      wants: 'Nếu giúp thì chỉ giúp số tiền trong khả năng chấp nhận mất trắng, không cho vay hết số tiền nhàn rỗi.',
      concerns: 'Cho vay dễ, đòi nợ khó; sợ mất cả tiền lẫn mất tình cảm anh em họ hàng.',
      targetOutcome: 'Bảo vệ nguồn tài chính gia đình và nguyên tắc tài chính minh bạch.',
    },
    sampleEvidence: [
      { type: 'FACT', content: 'Khoản tiền hỏi vay: 200 triệu đồng, dự kiến trả sau 1 năm không tính lãi.' },
      { type: 'CALCULATION', content: '200 triệu chiếm khoảng 40% Quỹ khẩn cấp và Tiết kiệm thanh khoản hiện có của gia đình.' },
      { type: 'ASSUMPTION', content: 'Dự án kinh doanh của người thân có biên độ rủi ro khá cao trong năm đầu tiên.' },
      { type: 'EMOTIONAL_CONCERN', content: 'Nỗi lo sợ bị mang tiếng ích kỷ với họ hàng nếu từ chối, nhưng lại ấm ức nếu cho vay mà bị mất.' },
    ],
    samplePerspectives: {
      analystView: 'Quy tắc vàng tài chính gia đình: Chỉ cho người thân vay số tiền mà nếu mất 100% thì gia đình vẫn sinh hoạt bình thường.',
      skepticView: 'Cho vay không tài sản thế chấp và không hợp đồng pháp lý có tỷ lệ chậm trả hoặc mất vốn lên tới 60%.',
      strategistView: 'Chuyển từ "cho vay số lớn" sang "tặng/hỗ trợ không hoàn lại một khoản nhỏ" hoặc cho vay tối đa 50 triệu.',
      mediatorView: 'Tuyệt đối thống nhất giữa hai vợ chồng trước khi trả lời. Nếu từ chối, lấy lý do tiền đang gửi sổ tiết kiệm dài hạn.',
    },
    sampleOptions: [
      {
        id: 'opt_1',
        name: 'Phương án A: Cho vay tối đa 50 triệu (Mức chấp nhận mất mà không ảnh hưởng gia đình)',
        description: 'Giải thích tiền lớn đang nằm trong sổ tiết kiệm chưa đến hạn, hỗ trợ 50 triệu để san sẻ khó khăn.',
        pros: ['Vẫn giữ được tình nghĩa', 'Nếu không đòi được cũng không làm gia đình lao đao', 'Vợ thoải mái tâm lý'],
        cons: ['Người thân có thể phải tìm thêm nguồn khác'],
        costEstimate: 50,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 95,
      },
      {
        id: 'opt_2',
        name: 'Phương án B: Cho vay đủ 200 triệu nhưng có thỏa thuận mốc hoàn trả rõ ràng',
        description: 'Cho vay 200 triệu, yêu cầu có mốc trả từng quý 50 triệu để gia đình xoay sở.',
        pros: ['Giúp được người thân trọn vẹn'],
        cons: ['Rủi ro mất thanh khoản và rạn nứt tình cảm nếu bị chậm nợ'],
        costEstimate: 200,
        riskLevel: 'high',
        reversibility: 'difficult',
        score: 55,
      },
      {
        id: 'opt_3',
        name: 'Phương án C: Tặng/Hỗ trợ không hoàn lại 20 triệu + Giới thiệu kênh vay tín chấp uy tín',
        description: 'Thẳng thắn trao đổi gia đình đang có kế hoạch riêng, gửi tặng 20 triệu xem như san sẻ một phần khó khăn.',
        pros: ['Không có nợ nần dây dưa, dứt khoát', 'Bảo toàn 100% tài chính gia đình'],
        cons: ['Cần cách nói khéo léo để không làm phật lòng người thân'],
        costEstimate: 20,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 85,
      },
    ],
    recommendedGuardrails: 'Không bao giờ rút tiền từ Quỹ khẩn cấp (Emergency Fund) để cho người khác vay mượn dưới bất kỳ hình thức nào.',
  },
  {
    id: 'template_career_transition',
    title: 'Khởi Nghiệp / Chuyển Đổi Nghề Nghiệp (Nghỉ Việc Văn Phòng Mở Kinh Doanh)',
    category: 'career',
    contextType: 'complex',
    description: 'Một bên muốn bứt phá mở kinh doanh riêng vs Bên còn lại lo mất nguồn thu nhập cố định đang nuôi sống gia đình.',
    defaultHusband: {
      wants: 'Nghỉ việc văn phòng để khởi nghiệp kinh doanh dự án ấp ủ, dùng 200 triệu vốn khởi đầu.',
      concerns: 'Sợ thất bại sẽ làm gánh nặng tài chính dồn hết lên vai vợ.',
      targetOutcome: 'Làm chủ sự nghiệp, tự do thời gian và gia tăng tiềm năng thu nhập vượt bậc.',
    },
    defaultWife: {
      wants: 'Chồng duy trì công việc ổn định, hoặc chỉ khởi nghiệp bán thời gian (side-project) khi đã có doanh thu ổn.',
      concerns: 'Gia đình có con nhỏ, nếu mất nguồn lương cố định thì áp lực chi tiêu hàng tháng sẽ gây căng thẳng cực độ.',
      targetOutcome: 'Cuộc sống gia đình êm ấm, không bị rơi vào cảnh túng thiếu bấp bênh.',
    },
    sampleEvidence: [
      { type: 'FACT', content: 'Chi tiêu sinh hoạt tối thiểu của gia đình là 25 triệu/tháng.' },
      { type: 'CALCULATION', content: 'Nếu nghỉ việc, cần chuẩn bị tối thiểu 12 tháng sinh hoạt phí (300 triệu) + 200 triệu vốn kinh doanh = 500 triệu.' },
      { type: 'ASSUMPTION', content: 'Dự án kinh doanh cần 6 - 9 tháng để đạt điểm hòa vốn (Break-even point).' },
      { type: 'EMOTIONAL_CONCERN', content: 'Chồng cảm thấy tù túng nếu mãi làm thuê; Vợ cảm thấy hoang mang nếu mất đi cột trụ thu nhập ổn định.' },
    ],
    samplePerspectives: {
      analystView: 'Khởi nghiệp cần "đường băng tài chính" (Runway) tối thiểu 12-18 tháng để không bị áp lực cơm áo gạo tiền bóp nghẹt.',
      skepticView: '90% doanh nghiệp khởi nghiệp gặp khó khăn dòng tiền trong năm đầu. Không nên dồn toàn bộ nguồn lực gia đình vào một canh bạc.',
      strategistView: 'Mô hình "Khởi nghiệp có đệm đỡ": Làm thêm ngoài giờ (Part-time / Weekend) đến khi có khách hàng trả tiền đều đặn mới nộp đơn nghỉ việc.',
      mediatorView: 'Đặt ra mốc thời gian rõ ràng: Nếu sau 12 tháng không đạt mốc doanh thu X triệu/tháng thì cam kết quay lại công việc văn phòng.',
    },
    sampleOptions: [
      {
        id: 'opt_1',
        name: 'Phương án A: Khởi nghiệp bán thời gian (Dual-Track) 6 tháng đầu',
        description: 'Vẫn đi làm văn phòng nhận lương, dành buổi tối và cuối tuần xây dựng sản phẩm và tìm kiếm 10 khách hàng đầu tiên.',
        pros: ['Không mất nguồn thu nhập nuôi gia đình', 'Kiểm chứng thị trường thực tế với chi phí 0 đồng'],
        cons: ['Áp lực thời gian và sức khỏe của Chồng'],
        costEstimate: 50,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 94,
      },
      {
        id: 'opt_2',
        name: 'Phương án B: Nghỉ việc toàn phần nhưng có Runway 12 tháng cách ly',
        description: 'Trích riêng 300 triệu vào tài khoản vợ để lo sinh hoạt 12 tháng. Chồng cầm 150 triệu làm vốn khởi nghiệp trong 12 tháng.',
        pros: ['Toàn tâm toàn ý 100% cho dự án', 'Gia đình có đệm đỡ sinh hoạt 1 năm an toàn'],
        cons: ['Tiêu hao 450 triệu vốn tích lũy'],
        costEstimate: 450,
        riskLevel: 'medium',
        reversibility: 'moderate',
        score: 80,
      },
      {
        id: 'opt_3',
        name: 'Phương án C: Dùng toàn bộ tiền tiết kiệm và vay thêm để mở lớn',
        description: 'Dồn 500 triệu và vay thêm 300 triệu mở cửa hàng quy mô lớn ngay từ đầu.',
        pros: ['Hình ảnh chuyên nghiệp, cơ hội lớn'],
        cons: ['Rủi ro phá sản đe dọa sinh kế gia đình'],
        costEstimate: 800,
        riskLevel: 'critical',
        reversibility: 'irreversible',
        score: 40,
      },
    ],
    recommendedGuardrails: 'Giới hạn lỗ tối đa (Stop-loss): Nếu sau 9 tháng doanh thu chưa đạt 50% kế hoạch hoặc số vốn chạm đáy 150 triệu thì dừng lại để bảo toàn vốn cho con.',
  },
  {
    id: 'template_portfolio_rebalance',
    title: 'Tái Cấu Trúc Danh Mục Đầu Tư (Chốt Lời Phòng Thủ vs Tiếp Tục Gồng Lãi)',
    category: 'investment',
    contextType: 'complicated',
    description: 'Sau giai đoạn thị trường tăng nóng, một bên muốn chốt lời chuyển về tài sản an toàn (vàng, gửi tiết kiệm) vs Bên còn lại muốn tái đầu tư mở rộng.',
    defaultHusband: {
      wants: 'Tiếp tục tái đầu tư số lãi vào cổ phiếu tăng trưởng / crypto để tối đa hóa sức mạnh lãi kép.',
      concerns: 'Sợ chốt non mất cơ hội nhân tài sản (chốt ngay chân sóng).',
      targetOutcome: 'Tăng tốc tiến trình tự do tài chính (FIRE) về đích sớm.',
    },
    defaultWife: {
      wants: 'Chốt 50-70% phần lãi chuyển về mua vàng vật chất hoặc sổ tiết kiệm ngân hàng.',
      concerns: 'Lãi trên bảng điện tử chỉ là số ảo, thị trường đảo chiều sẽ mất hết thành quả bao năm tích cóp.',
      targetOutcome: 'Hiện thực hóa lợi nhuận thành của cải thực tế, an toàn cho tổ ấm.',
    },
    sampleEvidence: [
      { type: 'FACT', content: 'Danh mục đầu tư hiện tại đã có mức sinh lời +45% so với vốn gốc.' },
      { type: 'CALCULATION', content: 'Tỷ trọng tài sản rủi ro (Cổ phiếu + Crypto) hiện chiếm 65% tổng tài sản, vượt xa mục tiêu ban đầu là 35%.' },
      { type: 'ASSUMPTION', content: 'Thị trường tài chính đang ở vùng định giá cao, có rủi ro điều chỉnh 15-20% trong quý tới.' },
      { type: 'EMOTIONAL_CONCERN', content: 'Vợ lo âu khi thấy tài sản biến động hàng chục triệu mỗi ngày theo thị trường.' },
    ],
    samplePerspectives: {
      analystView: 'Quy tắc tái cân bằng danh mục (Rebalancing): Khi một lớp tài sản lệch quá 10% so với tỷ trọng mục tiêu, bắt buộc phải chốt bớt để đưa về thế cân bằng.',
      skepticView: 'Lòng tham thường khiến nhà đầu tư gồng lãi đến khi thị trường sập rồi bán tháo trong hoảng loạn.',
      strategistView: 'Chiến lược "Rút gốc giữ lãi": Bán chốt đủ số vốn gốc ban đầu đưa về két sắt/sổ tiết kiệm, chỉ để phần lãi chạy tiếp trên thị trường.',
      mediatorView: 'Giải pháp làm cả hai cùng vui: Chốt 50% tiền lãi mua 1 lượng vàng vật chất cho Vợ cất két, 50% còn lại cho Chồng tiếp tục đầu tư.',
    },
    sampleOptions: [
      {
        id: 'opt_1',
        name: 'Phương án A: Chốt 50% lợi nhuận chuyển sang Vàng & Tiết kiệm (Quy tắc 50/50)',
        description: 'Chốt lời 50% chuyển về mua vàng nhẫn và gửi sổ tiết kiệm, 50% còn lại giữ nguyên để đón sóng tiếp theo.',
        pros: ['Khóa chặt thành quả thực tế', 'Vợ an tâm 100%', 'Chồng vẫn còn vị thế đầu tư trên thị trường'],
        cons: ['Lợi nhuận tương lai giảm một nửa nếu thị trường tiếp tục bay cao'],
        costEstimate: 0,
        riskLevel: 'low',
        reversibility: 'easy',
        score: 96,
      },
      {
        id: 'opt_2',
        name: 'Phương án B: Giữ nguyên 100% và dùng lệnh chặn lãi (Trailing Stop)',
        description: 'Không bán, nhưng đặt quy tắc nếu thị trường giảm 8% từ đỉnh thì lập tức bán 50%.',
        pros: ['Tối ưu hóa tối đa đà tăng giá'],
        cons: ['Phải theo dõi thị trường sát sao, tâm lý căng thẳng'],
        costEstimate: 0,
        riskLevel: 'medium',
        reversibility: 'easy',
        score: 82,
      },
      {
        id: 'opt_3',
        name: 'Phương án C: Chốt sạch 100% rút về tiền mặt gửi ngân hàng',
        description: 'Bán hết danh mục đầu tư đưa về tiền gửi kỳ hạn 1 năm.',
        pros: ['Bảo toàn tuyệt đối lợi nhuận'],
        cons: ['Bỏ lỡ toàn bộ đà tăng tiếp theo, tiền chịu trượt giá lạm phát'],
        costEstimate: 0,
        riskLevel: 'low',
        reversibility: 'moderate',
        score: 72,
      },
    ],
    recommendedGuardrails: 'Không bao giờ để tỷ trọng tài sản rủi ro cao (Crypto/Cổ phiếu đầu cơ) vượt quá 40% tổng danh mục đầu tư của gia đình.',
  },
];
