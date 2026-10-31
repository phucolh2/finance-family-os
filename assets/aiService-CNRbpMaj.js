import{t as e}from"./vendor-ai-Bnau-XoX.js";function t(e){return e>=1e3?(e/1e3).toLocaleString(`vi-VN`,{minimumFractionDigits:1,maximumFractionDigits:2})+` Tỷ`:e.toLocaleString(`vi-VN`,{minimumFractionDigits:1,maximumFractionDigits:2})+` Tr`}var n=(e,t=!1)=>{let{profile:n,incomeSchedule:r,budgetSchedule:i,lifeEvents:a,investmentDeals:o=[],assumptions:s,savingsDeposits:c=[],sinkingFunds:l=[],debts:u=[],resolvedMonthlyDb:d=[]}=e,f=r.length>0?r[0].incomeMonthly:80,p=i.length>0?i[0]:null,m=``;p&&p.rootGroups&&(m=p.rootGroups.map(e=>`- ${e.name}: ${e.ratioPercent}% (~${(f*e.ratioPercent/100).toFixed(1)} tr/tháng)`).join(`
`));let h=c.filter(e=>e.status===`active`).reduce((e,t)=>e+(t.principal||0),0),g=l.filter(e=>e.status===`active`).reduce((e,t)=>e+(t.currentBalance??t.initialDeposit??0),0),_=o.filter(e=>e.status===`active`).reduce((e,t)=>e+(t.capital||0),0),v=u.filter(e=>e.status===`active`).reduce((e,t)=>e+(t.remainingBalance??t.principal??0),0),y=n?.startingCapital||0,b=Math.round((y+h+g+_-v)*10)/10,x=[...d].filter(e=>e.totalActualExpenseMonthly!==void 0&&e.totalActualExpenseMonthly>0||e.income>0).slice(-12),S=``;S=x.length>0?x.map(e=>{let t=e.totalActualExpenseMonthly||0,n=Math.round((e.income-t)*10)/10,r=``;return e.actualExpenseByGroup&&Object.keys(e.actualExpenseByGroup).length>0&&(r=Object.entries(e.actualExpenseByGroup).filter(([e,t])=>t>0).map(([e,t])=>`${e}: ${t} tr`).join(`, `)),`- Tháng ${e.month}/${e.year} (${e.periodKey}): Thu nhập ${e.income} tr | Chi tiêu thực tế: ${t} tr | Dư tích lũy: ${n} tr ${r?`[Chi tiết: ${r}]`:``}`}).join(`
`):`Chưa có bản ghi chi tiêu tháng cũ được lưu. (Mặc định thu nhập hiện tại 80 tr/tháng, tiền thuê nhà 9 tr/tháng).`;let C=``;C=l.length>0?l.map(e=>{let t=e.currentBalance??e.initialDeposit??0,n=Math.max(0,e.targetAmount-t),r=e.monthlyContribution>0?Math.ceil(n/e.monthlyContribution):`Chưa đặt góp đều`,i=e.targetDate||`Bắt đầu: ${e.startMonth}/${e.startYear}`;return`- ${e.name}: Hiện có ${t} tr / Mục tiêu ${e.targetAmount} tr (Còn thiếu: ${n} tr). Góp hàng tháng: ${e.monthlyContribution} tr/tháng. Thời điểm: ${i}. Dự kiến cần: ${r} tháng nữa.`}).join(`
`):`Gia đình đang chuẩn bị kế hoạch tích lũy quỹ đón thiên thần nhỏ (mục tiêu ~80 - 100 triệu).`;let w=``;w=c.length>0?c.map(e=>`- ${e.name}: Gốc ${e.principal} tr | Lãi suất ${e.interestRateAnnual}%/năm | Kỳ hạn ${e.termMonths} tháng | Bắt đầu: ${e.startMonth}/${e.startYear} | Trạng thái: ${e.status===`active`?`Đang gửi`:`Đã tất toán`}`).join(`
`):`Chưa có sổ tiết kiệm cá nhân.`;let T=``;T=u.length>0?u.map(e=>{let t=e.remainingBalance??e.principal??0,n=e.monthlyPayment?`${e.monthlyPayment} tr/tháng`:`Theo kỳ hạn`;return`- ${e.name} (${e.type}): Dư nợ ${t} tr (Gốc ban đầu ${e.principal} tr) | Trả góp: ${n} | Lãi suất ${e.interestRateAnnual}%/năm | Kỳ hạn ${e.termMonths} tháng từ ${e.startMonth}/${e.startYear}`}).join(`
`):`Gia đình hiện tại không có nợ xấu hoặc khoản vay lớn.`;let E=x.length>0?x.reduce((e,t)=>e+(t.totalActualExpenseMonthly||30),0)/x.length:30,D=E*12,O=Math.round(D/.04*10)/10,k=Math.max(0,O-b),A=Math.max(0,f-E),j=A>0?(k/(A*12)).toFixed(1):`Chưa xác định`;return`Bạn là "Trợ lý Gia đình" - Người bạn đồng hành và Chuyên gia hoạch định tài chính gia đình thân thiết, tri kỷ của hai vợ chồng.
Bạn trả lời trực tiếp các câu hỏi của người dùng dựa trên CHÍNH DỮ LIỆU TÀI CHÍNH THỰC TẾ của gia đình được cung cấp dưới đây.

============================================================
============================================================
BỨC TRANH TÀI CHÍNH TOÀN DIỆN CỦA GIA ĐÌNH:
============================================================
- HÔM NAY LÀ NGÀY: ${new Date().toLocaleDateString(`vi-VN`)}
- Tổng tài sản ròng ước tính (Net Worth): ${b} triệu VNĐ
- Vốn khởi điểm: ${y} triệu VNĐ
- Thu nhập hiện tại: ${f} triệu VNĐ/tháng
- Tiền thuê nhà cố định: Khoảng 9 triệu VNĐ/tháng
- Lạm phát dự kiến: ${s.generalInflationRateAnnual}% / năm
- Lãi suất đầu tư kỳ vọng: ${s.investmentYieldExpectationAnnual}% / năm

1. DỮ LIỆU CHI TIÊU THỰC TẾ TỪNG THÁNG (LỊCH SỬ THỰC):
${S}

2. CƠ CẤU PHÂN BỔ NGÂN SÁCH DỰ KIẾN (4 TRỤ CỘT):
${m||`Chưa cấu hình chi tiết.`}

3. TIẾN ĐỘ CÁC QUỸ TÍCH LŨY MỤC TIÊU (SINKING FUNDS):
Tổng tích lũy hiện có: ${g} triệu VNĐ
${C}

4. DANH MỤC SỔ TIẾT KIỆM (SAVINGS DEPOSITS):
Tổng tiền gửi tiết kiệm: ${h} triệu VNĐ
${w}

5. NỢ & NGHĨA VỤ TÀI CHÍNH (DEBTS):
Tổng dư nợ còn lại: ${v} triệu VNĐ
${T}

6. DANH MỤC ĐẦU TƯ & TÀI SẢN (INVESTMENT DEALS):
Tổng vốn đầu tư: ${_} triệu VNĐ
${o.length===0?`Chưa có thương vụ đầu tư lớn.`:o.map(e=>`- [${e.assetType}] ${e.name}: Vốn ${e.capital} tr (Trạng thái: ${e.status}, Lợi nhuận: ${e.realizedProfit||0} tr).`).join(`
`)}

7. KẾ HOẠCH TƯƠNG LAI & CHI TIÊU LINH HOẠT (LIFE EVENTS):
${a.length===0?`Kế hoạch trọng tâm: Chuẩn bị tài chính đón thiên thần nhỏ.`:a.map(e=>`- ${e.name} (${e.type}): Tháng ${e.month}/${e.year}, Số tiền: ${e.amount} tr. Ghi chú: ${e.note||`Không`}`).join(`
`)}

8. CHỈ SỐ TỰ DO TÀI CHÍNH (FIRE TARGET):
- Chi phí sinh hoạt ước tính: ${E.toFixed(1)} tr/tháng (~${D.toFixed(1)} tr/năm).
- Số tiền cần có để đạt Tự Do Tài Chính (quy tắc 4%): ${O} triệu VNĐ (~${(O/1e3).toFixed(2)} Tỷ).
- Khoảng cách còn lại (FIRE Gap): ${k} triệu VNĐ.
- Tốc độ tích lũy thặng dư hàng tháng: ~${A.toFixed(1)} triệu VNĐ/tháng.
- Dự kiến thời gian đạt FIRE: khoảng ${j} năm nữa (nếu giữ vững kỷ luật tài chính và tái đầu tư sinh lời ${s.investmentYieldExpectationAnnual}%/năm).

============================================================
QUY TẮC PHẢN HỒI & TƯ VẤN (BẮT BUỘC TUÂN THỦ):
============================================================
1. KHI ĐƯỢC HỎI VỀ CHI TIÊU QUÁ KHỨ (VD: "Tháng qua sài nhiêu tiền?", "Tháng nào chi nhiều nhất?"):
   - Đọc NGAY từ mục 1 (DỮ LIỆU CHI TIÊU THỰC TẾ).
   - Nêu chính xác con số: Thu nhập bao nhiêu, tổng chi thực tế bao nhiêu, dư tiết kiệm bao nhiêu.
   - Chỉ ra khoản chi lớn nhất (VD: Tiền nhà 9 triệu, ăn uống...).
   - So sánh với ngân sách kế hoạch: Tiết kiệm tốt hay vượt mức, lời động viên chân thành.

2. KHI ĐƯỢC HỎI VỀ DỰ ĐOÁN THỜI GIAN ĐẠT MỤC TIÊU (VD: "Bao lâu tôi đạt được...", "Khi nào gom đủ quỹ sinh con?", "Bao lâu nữa tự do tài chính?"):
   - Tính toán rõ ràng:
     + Mục tiêu cần bao nhiêu (Target), hiện có bao nhiêu (Current) -> Còn thiếu bao nhiêu (Gap).
     + Với tốc độ tích lũy / trích quỹ hiện tại (X triệu/tháng): Số tháng = Gap / X.
     + Quy đổi ra mốc thời gian cụ thể: "Sau X tháng nữa, dự kiến vào khoảng Tháng MM/YYYY".
     + Đưa ra kịch bản tối ưu: "Nếu hai vợ chồng tăng trích thêm Y triệu/tháng thì sẽ rút ngắn được Z tháng".

3. ⚠️ QUY TẮC BẮT BUỘC ĐỐI VỚI GIÁ THỊ TRƯỜNG THỜI GIAN THỰC (QUAN TRỌNG NHẤT):
   TÌNH TRẠNG KẾT NỐI INTERNET HIỆN TẠI CỦA BẠN LÀ: **[${t?`ONLINE - CÓ INTERNET`:`OFFLINE - KHÔNG CÓ INTERNET`}]**

   CÁC LOẠI THÔNG TIN SAU ĐÂY THAY ĐỔI HÀNG NGÀY VÀ CÓ THỂ CHÊNH LỆCH HÀNG CHỤC TRIỆU ĐỒNG NẾU SAI:
   - Giá vàng (SJC, nhẫn 24K 9999, vàng thế giới quy đổi...)
   - Lãi suất tiết kiệm ngân hàng (Vietcombank, BIDV, Techcombank, VPBank...)
   - Tỷ giá USD/VNĐ, EUR/VNĐ
   - Chỉ số chứng khoán VN-Index, giá cổ phiếu
   - Giá xăng dầu, giá bất động sản khu vực

   👉 NẾU NGƯỜI DÙNG HỎI BẤT KỲ THÔNG TIN NÀO TRONG DANH SÁCH TRÊN VÀ TÌNH TRẠNG LÀ [OFFLINE]:
   BẠN BẮT BUỘC PHẢI TỪ CHỐI TRẢ LỜI CON SỐ CỤ THỂ VÀ TRẢ LỜI Y HỆT NHƯ SAU:
   "⚠️ **Lưu ý quan trọng**: Tôi không có kết nối Internet tại thời điểm này nên không thể tra cứu giá thực tế hôm nay. Giá vàng/lãi suất/thị trường thay đổi hàng ngày và kiến thức của tôi có thể đã lỗi thời. Để có con số chính xác nhất, vui lòng bật chế độ '🌐 Tra cứu Internet' rồi hỏi lại, hoặc kiểm tra trực tiếp tại:
   - Giá vàng SJC: sjc.com.vn
   - Lãi suất ngân hàng: Website chính thức từng ngân hàng
   - Giá vàng nhẫn: pnj.com.vn hoặc doji.vn"
   TUYỆT ĐỐI KHÔNG BỊA RA HOẶC DÙNG DỮ LIỆU CŨ TỪ TRAINING DATA ĐỂ ĐOÁN GIÁ VÀNG/LÃI SUẤT. BẠN PHẢI TỪ CHỐI CUNG CẤP SỐ LIỆU NẾU OFFLINE.

   👉 NẾU TÌNH TRẠNG LÀ [ONLINE]:
   Sử dụng TRỰC TIẾP con số từ kết quả tìm kiếm Google Search, ghi rõ nguồn và thời điểm cập nhật.
   **LƯU Ý QUAN TRỌNG VỀ NGUỒN VÀ THỜI GIAN:** 
   1. Bạn phải kiểm tra kỹ NGÀY THÁNG của kết quả. Nếu là dữ liệu của nhiều tháng trước hoặc năm ngoái, bạn PHẢI nói rõ: "Kết quả tôi tìm được là dữ liệu cũ từ [Tháng/Năm]". KHÔNG ĐƯỢC khẳng định đó là giá hôm nay.
   2. ƯU TIÊN TUYỆT ĐỐI tra cứu từ các nguồn chuyên biệt như: '24hmoney.vn' (thế giới, crypto, giá vàng, lãi suất, tỷ giá, futures) và 'giavang.org'.

4. KHI ĐƯỢC HỎI TRA CỨU KIẾN THỨC / THÔNG TIN ĐỜI SỐNG / INTERNET (VD: Chi phí sinh con viện Từ Dũ/Vinmec, bảo hiểm thai sản):
   - Cung cấp thông tin thực tế, cập nhật, chi tiết từng gói chi phí (sinh thường, sinh mổ, chi phí phòng dịch vụ, quyền lợi bảo hiểm).
   - Luôn đối chiếu với bức tranh tài chính của gia đình (VD: "Gói sinh khoảng 40-55 triệu, với quỹ hiện tại X triệu và tốc độ góp Y triệu/tháng thì hoàn toàn nằm trong tầm kiểm soát an toàn của gia đình").

5. KHI ĐƯỢC HỎI VỀ MÔ PHỎNG GIẢ ĐỊNH / WHAT-IF (VD: "Nếu giảm 10 triệu ở đầu tư thì ảnh hưởng gì?", "Nếu tăng thêm 10 triệu thu nhập giúp ích gì?"):
   - PHÂN TÍCH THEO 2 MẶT CÂN ĐỐI (DÒNG TIỀN NGẮN HẠN vs TÀI SẢN DÀI HẠN):
     + **Nếu giảm đầu tư X triệu/tháng**:
       * Ngắn hạn: Tăng thặng dư tiền mặt sinh hoạt/an toàn, giảm áp lực nếu đang cần vốn cho mục tiêu cận kề (như quỹ sinh con, quỹ khẩn cấp).
       * Dài hạn: Làm chậm tác động của lãi kép. Tính cụ thể: Với lãi suất kỳ vọng ${s.investmentYieldExpectationAnnual}%/năm, sau 5 năm sẽ mất đi bao nhiêu triệu tài sản ròng, và thời gian đạt FIRE sẽ bị lùi lại bao lâu.
     + **Nếu tăng thu nhập X triệu/tháng**:
       * Đề xuất phân bổ chuẩn 4 Trụ Cột: Trích bao nhiêu % vào Tích lũy mục tiêu, bao nhiêu % vào Đầu tư sinh lời.
       * Tính toán tác động tích cực cụ thể: Rút ngắn thời gian đạt FIRE được bao nhiêu năm, gom đủ các quỹ mục tiêu sớm hơn bao nhiêu tháng.
   - Luôn đưa ra con số ước lượng rõ ràng (triệu VNĐ, số tháng/năm) dựa trên bức tranh tài chính hiện tại để hai vợ chồng dễ dàng ra quyết định.

6. PHONG CÁCH GIAO TIẾP:
   - Xưng hô lịch sự, ấm áp, đồng cảm như một người bạn tri kỷ am hiểu tài chính gia đình.
   - Định dạng Markdown rõ ràng, dễ đọc (bullet points, in đậm con số tiền Triệu VNĐ, bảng nếu cần).

7. QUY TẮC GỢI MỞ CÂU HỎI TIẾP THEO (BẮT BUỘC):
   - Ở cuối cùng của MỌI câu trả lời, bạn hãy LUÔN gợi ý chính xác 2 đến 3 câu hỏi ngắn gọn, gợi mở sâu sắc và thực tế nhất mà hai vợ chồng có thể muốn hỏi tiếp dựa trên chính câu trả lời bạn vừa cung cấp.
   - Định dạng chuẩn xác ở cuối phản hồi như sau:
   [GỢI Ý TIẾP THEO]
   - [Câu hỏi gợi ý tiếp theo 1]
   - [Câu hỏi gợi ý tiếp theo 2]
   - [Câu hỏi gợi ý tiếp theo 3]`};async function r(t,n,r){if(!t||!t.trim())throw Error(`Chưa cấu hình Gemini API Key.`);let i=new e(t.trim()),a=[`gemini-1.5-pro`,`gemini-1.5-flash`,`gemini-3-flash-preview`,`gemini-3.1-flash-lite`,`gemini-3.5-flash`,`gemini-3.6-flash`],o=null;for(let e of a)try{let t=(await i.getGenerativeModel({model:e,systemInstruction:n,generationConfig:{maxOutputTokens:2048,temperature:.7}}).generateContent(r)).response.text();if(t&&t.trim().length>0)return t}catch(t){o=t,console.warn(`[Gemini API] Thử model ${e} thất bại, thử model tiếp theo...`,t)}throw Error(`Không thể kết nối Gemini API: ${o?.message||`Vui lòng kiểm tra lại API Key.`}`)}function i(e){if(!e||e.length===0)return[];let t=e.filter(e=>e.parts&&e.parts.length>0&&e.parts.some(e=>e.text&&e.text.trim())),n=t.findIndex(e=>e.role===`user`);if(n===-1)return[];let r=t.slice(n),i=[];for(let e of r)if(i.length===0)i.push({role:e.role,parts:[{text:e.parts.map(e=>e.text).join(`
`)}]});else{let t=i[i.length-1];t.role===e.role?t.parts[0].text+=`
`+e.parts.map(e=>e.text).join(`
`):i.push({role:e.role,parts:[{text:e.parts.map(e=>e.text).join(`
`)}]})}for(;i.length>0&&i[i.length-1].role!==`model`;)i.pop();return i}var a=async(t,r,a,o,s=!1)=>{if(!t)throw Error(`Chưa cấu hình Gemini API Key.`);let c=new e(t.trim()),l=n(o,s),u=i(a),d=null;if(s)for(let e of[`gemini-1.5-pro`,`gemini-1.5-flash`,`gemini-3-flash-preview`,`gemini-3.6-flash`])try{let t=c.getGenerativeModel({model:e,systemInstruction:l,tools:[{googleSearchRetrieval:{dynamicRetrievalConfig:{mode:`MODE_DYNAMIC`,dynamicThreshold:0}}}]}).startChat({history:u,generationConfig:{maxOutputTokens:2e3,temperature:.7}}),n=r+`

(YÊU CẦU HỆ THỐNG ĐỐI VỚI AI: BẠN ĐANG DÙNG CÔNG CỤ GOOGLE SEARCH. HÃY ƯU TIÊN TRA CỨU TỪ CÁC NGUỒN UY TÍN SAU: 24hmoney.vn (vàng, lãi suất, crypto, hàng hóa, tỷ giá) hoặc giavang.org. BẠN NÊN THÊM TỪ KHÓA 'site:24hmoney.vn' HOẶC 'site:giavang.org' VÀO LỆNH TÌM KIẾM CỦA MÌNH ĐỂ CÓ SỐ LIỆU CHÍNH XÁC NHẤT. HÃY TÌM KIẾM DỮ LIỆU CỦA NGÀY HÔM NAY. NẾU KẾT QUẢ LÀ DỮ LIỆU CŨ, BẠN PHẢI NÓI RÕ LÀ DỮ LIỆU CŨ TỪ QUÁ KHỨ VÀ KHÔNG BÁO CÁO NHƯ THỂ LÀ GIÁ HÔM NAY!)`,i=await(await t.sendMessage(n)).response,a=i.text(),o=i.candidates;if(o&&o.length>0&&o[0].groundingMetadata&&o[0].groundingMetadata.groundingChunks){let e=o[0].groundingMetadata.groundingChunks.map(e=>e.web?.uri).filter(Boolean);if(e.length>0){let t=Array.from(new Set(e));a+=`

🌐 **Nguồn dữ liệu AI vừa tra cứu:**
`+t.map(e=>`- ${e}`).join(`
`)}}if(a&&a.trim().length>0)return a}catch(t){d=t,console.warn(`[Google Search ${e}] Thử tra cứu thất bại hoặc quá tải, chuyển sang model tiếp theo:`,t)}let f=s?n(o,!1)+`

⚠️ GHI CHÚ QUAN TRỌNG: Quá trình gọi công cụ Search bị lỗi mạng. Bắt buộc phải thông báo cho người dùng là không thể tra cứu do lỗi kết nối. (Mã lỗi hệ thống: `+(d?.message||`Unknown Error`)+`)`:l;for(let e of[`gemini-1.5-pro`,`gemini-1.5-flash`,`gemini-3-flash-preview`,`gemini-3.1-flash-lite`,`gemini-3.5-flash`,`gemini-3.6-flash`])try{let t=(await(await c.getGenerativeModel({model:e,systemInstruction:f}).startChat({history:u,generationConfig:{maxOutputTokens:2e3,temperature:.7}}).sendMessage(r)).response).text();if(t&&t.trim().length>0)return s&&d?t+`\n\n*(🔍 Thông tin gỡ lỗi hệ thống: Google Search API bị từ chối phục vụ. Mã lỗi: ${d.message})*`:t}catch(t){d=t,console.warn(`[Trợ lý Gia đình API] Model ${e} gặp lỗi (${t?.status||t?.message}), chuyển model dự phòng tiếp theo...`),await new Promise(e=>setTimeout(e,250));continue}throw Error(`Không thể kết nối Trợ lý Gia đình: ${d?.message||`Máy chủ AI đang bận, vui lòng thử lại sau giây lát.`}`)},o=async(e,t,i,a)=>{let o=`Gia đình chúng tôi có mức thu nhập quan sát tháng này là **${i} triệu VNĐ**.
Chi phí cố định tiền thuê nhà: **9 triệu VNĐ/tháng**.
Gia đình đang trong giai đoạn đặc biệt: **Chuẩn bị kế hoạch đón thiên thần nhỏ (em bé)**.
${a?`Yêu cầu thêm từ vợ chồng tôi: "${a}"`:``}

Hãy đưa ra lời tư vấn cụ thể, rõ ràng, sâu sắc theo mô hình **4 Trụ Cột Hạnh Phúc Chuẩn Quốc Tế**:
1. **Trụ cột 1: Chi phí Thiết yếu (~25% = ${(i*.25).toFixed(1)} tr)**
   - Bảo đảm tiền thuê nhà 9 triệu.
   - Ngân sách ăn uống dinh dưỡng thực phẩm sạch bồi bổ sức khỏe cho mẹ bầu tương lai.
2. **Trụ cột 2: Kết nối & Giữ lửa Hôn nhân (~12.5% = ${(i*.125).toFixed(1)} tr)**
   - Hẹn hò lãng mạn cuối tuần, quỹ du lịch nghỉ dưỡng (Babymoon) và hiếu kính cha mẹ.
3. **Trụ cột 3: Quỹ Đón Con & Dự Phòng An Toàn (~20% = ${(i*.2).toFixed(1)} tr)**
   - Quỹ Chào Đời (8-10 tr/tháng tích lũy cho viện quốc tế, đồ sơ sinh, vắc-xin).
   - Quỹ Y tế & khẩn cấp bảo vệ mẹ và bé.
4. **Trụ cột 4: Đầu tư Tích sản Bền vững (~42.5% = ${(i*.425).toFixed(1)} tr)**
   - Đầu tư dài hạn tạo lãi kép tự do tài chính, tuyệt đối an tâm, không phải rút non.

Vui lòng viết lời khuyên bằng tiếng Việt, phân tích rành mạch từng số tiền, kèm lời chúc ấm áp gửi tới hai vợ chồng!`;return r(e,n(t),o)},s=async(e,t,i,a,o,s)=>{let c=`Gia đình chúng tôi đang cân nhắc một khoản chi lớn: **"${i}"** với tổng chi phí **${a} triệu VNĐ**.
Dữ liệu tài chính hiện tại của gia đình:
- Thanh khoản an toàn hiện có: **${o} triệu VNĐ**.
- Dòng tiền thặng dư hàng tháng trung bình: **${s} triệu VNĐ/tháng**.

Hãy giúp hai vợ chồng tôi:
1. **Đánh giá tính khả thi:** Gia đình có nên thực hiện khoản chi này vào thời điểm này không?
2. **Đề xuất cấu trúc chi trả tối ưu:** 
   - Trả trước (upfront): Bao nhiêu triệu từ quỹ thanh khoản dư mà không làm thủng sàn khẩn cấp 3 tháng?
   - Trả góp (monthly payment): Chia đều trong bao nhiêu tháng và mỗi tháng trích bao nhiêu triệu từ thặng dư để cuộc sống vẫn thoải mái?
3. **Lời khuyên tài chính:** Cách quản lý dòng tiền để không bị áp lực nợ nần sau khi mua sắm.`;return r(e,n(t),c)},c=e=>{let{thu_nhap_du_phong:n,goc_phan_bo:r,current_liquidity:i}=e,a=r>0?r:n>0?n:80,o=e.housingCost||9,s=Math.max(e.chi_phi_hang_thang,25),c={muc_tieu_tu_do_tai_chinh:a*300,dau_tu_de_xuat:a*.4,quy_khan_cap_can:s*3,chi_phi_thiet_yeu_de_xuat:a*.25},l=[],u=o/a*100;u>25?l.push({muc_do:`trung_binh`,tieu_de:`Tỷ trọng chi phí nhà ở`,noi_dung:`Tiền thuê nhà hiện tại (${o} triệu) chiếm ${u.toFixed(1)}% thu nhập.`,de_xuat_hanh_dong:`Nên kiểm soát các chi phí sinh hoạt điện nước khác để tổng chi phí thiết yếu không vượt quá 35%.`}):l.push({muc_do:`thong_tin`,tieu_de:`Chi phí nhà ở an toàn`,noi_dung:`Tiền thuê nhà ${o} triệu chiếm ${u.toFixed(1)}% thu nhập, đạt tỷ lệ vàng theo chuẩn quốc tế (<20%).`,de_xuat_hanh_dong:`Duy trì sự ổn định không gian sống thoải mái để giữ gìn sức khỏe gia đình.`}),i<c.quy_khan_cap_can&&l.push({muc_do:`cao`,tieu_de:`Củng cố Quỹ Khẩn Cấp`,noi_dung:`Thanh khoản hiện tại (${t(i)}) dưới mức sàn an toàn 3 tháng (${t(c.quy_khan_cap_can)}).`,de_xuat_hanh_dong:`Ưu tiên trích lập quỹ khẩn cấp trước khi dồn quá nhiều tiền vào các kênh đầu tư khó thanh khoản.`}),l.push({muc_do:`thong_tin`,tieu_de:`Chuẩn bị chào đón thiên thần nhỏ`,noi_dung:`Gia đình đang chuẩn bị đón bé, cần thiết lập riêng Quỹ Chào Đời (8-10 triệu/tháng) tích lũy trong 12 tháng.`,de_xuat_hanh_dong:`Trích riêng quỹ này để chi trả viện phí quốc tế, đồ dùng sơ sinh và vắc-xin mà không chạm vào tiền đầu tư.`});let d=12.5,f=42.5;return{goc_phan_bo:a,thang_du:0,benchmarks:c,canh_bao:l,de_xuat_phan_bo:{needs:{percent:25,amount:a*25/100,label:`Chi phí Thiết yếu`,details:`Gồm tiền thuê nhà (${o}tr) + Ăn uống dinh dưỡng, di chuyển, điện nước.`},romance_family:{percent:d,amount:a*d/100,label:`Hạnh phúc & Yêu thương`,details:`Hẹn hò cuối tuần vợ chồng, tích lũy du lịch nghỉ dưỡng và hiếu kính cha mẹ.`},baby_reserve:{percent:20,amount:a*20/100,label:`Đón con & Dự phòng an toàn`,details:`Quỹ Chào Đời cho bé (sinh viện quốc tế, đồ sơ sinh) + Quỹ Y tế, khẩn cấp.`},investment:{percent:f,amount:a*f/100,label:`Đầu tư Bền vững`,details:`Tích sản dài hạn tạo lãi kép tự do tài chính, an tâm không lo rút non.`},ly_do:`Mô hình cân bằng chuẩn quốc tế: Sống thoải mái hôm nay, chuẩn bị chu đáo nhất cho con, và tài sản vẫn tăng trưởng vượt trội.`},targetGroupRatios:{housing_basic:25,family_experience:7,wants:5.5,safety_reserve:10,baby_fund:10,future_investing:42.5},tong_ket:`Dựa trên thu nhập ${a} triệu và tiền nhà cố định ${o} triệu, AI đề xuất cấu trúc "Hạnh phúc & Đón con": Dành trọn vẹn 37.5% cho cuộc sống gia đình ấm cúng, 20% sẵn sàng cho bé chào đời và duy trì 42.5% đầu tư tích sản tăng trưởng vững vàng.`}};export{a as i,o as n,s as r,c as t};