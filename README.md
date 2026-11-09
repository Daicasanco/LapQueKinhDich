# Lập Quẻ Lục Hào (web)

Trang web lập quẻ Lục Hào, chạy hoàn toàn trên trình duyệt (HTML/CSS/JS thuần, không cần build).

**Dùng online:** https://daicasanco.github.io/LapQueKinhDich/ · Tra ngày: https://daicasanco.github.io/LapQueKinhDich/tra-ngay.html

## Chạy

- Mở trực tiếp `index.html` bằng trình duyệt, **hoặc**
- Chạy server tĩnh: `npx serve .` rồi mở địa chỉ được in ra.

Triển khai: chép cả thư mục lên bất kỳ host tĩnh nào (GitHub Pages, Netlify, Vercel, Nginx…).

## Tính năng

- 5 phương pháp: Số serial (tự nhập hoặc tạo số ngẫu nhiên), Gieo xu (có hoạt ảnh), Mai Hoa theo thời gian, Mai Hoa theo số, Tự chọn hào (có chọn nhanh 64 quẻ).
  - Số serial: nửa đầu dãy số cộng lại chia 8 → Thượng quái, nửa sau → Hạ quái, tổng chia 6 → hào động (dãy lẻ thì nửa đầu ít hơn một số). Ví dụ 24002019 → Thủy Lôi Truân động hào 6.
- Soi hào: rê chuột (hoặc chạm) vào một hào để xem bảng chi tiết bên cạnh và mũi tên Nhật/Nguyệt → hào và hào động ↔ hào biến; quan hệ giữa các hào hiện bằng thẻ màu trên hàng liên quan (“H5 khắc” = hào 5 khắc hào đó, “khắc H5” = hào đó khắc hào 5, “B5 khắc” = hào biến của hào 5 khắc hào đó); màu theo quan hệ (sinh, trợ, khắc, xung, hợp) và theo ngũ hành. Rê sang nửa quẻ biến của hàng động để soi riêng hào biến (Nhật/Nguyệt sinh khắc, vượng suy, vòng trường sinh: Hóa Mộ / Tuyệt / Trường Sinh / Đế Vượng tại Nhật hoặc Nguyệt). Bấm để ghim, Esc để bỏ.
- Lá quẻ theo mẫu: thông tin thời gian, can chi, Nhật/Nguyệt lệnh, quẻ chủ – quẻ biến, họ (cung), quẻ tượng; bảng Lục thân, Can chi, Phục thần, Tuần không, Lục thú, Thế/Ứng; bảng Nạp giáp, Vượng suy, Quải thần, Lộc, Mã, Quý, Đào.
- Phân tích chi tiết: quẻ hỗ, Lục xung/Lục hợp, Du hồn/Quy hồn, Phục ngâm/Phản ngâm; tứ trụ, tiết khí (giờ giao tiết), Dụng – Nguyên – Kỵ – Cừu thần; từng hào với Nhật/Nguyệt sinh khắc xung hợp, Ám động, vòng Trường sinh; biến hóa hào động (hồi đầu sinh/khắc, tiến/thoái thần, hóa không/mộ/tuyệt…); bảng thần sát.
- Lưu ảnh PNG, In/PDF, sao chép liên kết (quẻ mã hóa trong URL), sao chép dạng chữ, lịch sử lưu trong trình duyệt.
- Rê chuột vào tên quẻ chủ / quẻ biến trên lá quẻ để đọc Tổng quan – Quẻ tượng – Lục hào tượng (An Hạ, *Dịch kinh Chân tủy – Lục hào Tượng giải*). Phần bản OCR bị thiếu được chép tay vào `tools/que-tuong-bo-sung.js` (Hỏa Địa Tấn, Thủy Hỏa Ký Tế, Lục hào tượng của Thiên Thủy Tụng) — đủ 64 quẻ.
- **Ứng kỳ** theo *Cẩm nang ứng kỳ Lục Hào* (Tăng San Bốc Dịch): hồ sơ Dụng thần (vượng suy chấm điểm, Tuần Không Chân/Giả/Động, Nguyệt phá có/không cứu, Nhật mộ/Động mộ/Hóa mộ, hợp trói/hợp trợ, Tuyệt, Xung khởi/Xung tán, Kỵ thần khắc), danh sách chi ứng viên xếp hạng Ưu tiên / Dự phòng / Tham khảo / Cảnh báo kèm ngày, tháng, năm gần nhất; mốc Xuất Không, Qua tháng phá; nút mở trang Tra ngày.
- **Hợp cục · Hình hại · Mộ · Phục thần**: tam hợp / bán hợp cục, tam hình, lục hại, nhập mộ, tùy quỷ nhập mộ, độc phát / độc tĩnh / loạn động, kết luận phục thần hữu dụng / vô dụng.
- **Tra ngày theo Can Chi** (`tra-ngay.html`): chọn can/chi của ngày, tháng, năm, giờ (hoặc gõ nhanh “ngày ất mão tháng tỵ”) để liệt kê các ngày dương lịch khớp, kèm âm lịch, tiết khí, khoảng cách tới hôm nay. Tháng/năm tính theo tiết khí (Lục Hào) hoặc theo âm lịch; ngày giao tiết hiển thị giờ đổi tháng.

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `js/lunar.js` | Âm lịch Việt Nam (thuật toán Hồ Ngọc Đức, UTC+7), can chi, tiết khí chính xác theo kinh độ Mặt Trời |
| `js/iching.js` | Engine an quẻ: bát quái, nạp giáp, bát cung, lục thân, lục thú, phục thần, thần sát, Mai Hoa |
| `js/render.js` | Dựng lá quẻ và các bảng phân tích |
| `js/inspect.js` | Soi hào: mũi tên quan hệ + bảng chi tiết hào |
| `js/que-tuong.js` | Dữ liệu giải quẻ (Tổng quan, Quẻ tượng, Lục hào tượng) — **tự sinh**, đừng sửa tay |
| `tools/build-que-tuong.js` | Trích dữ liệu trên từ file MD *Dịch kinh Chân tủy* (bỏ phần Ví dụ): `node tools/build-que-tuong.js`. File OCR sách không nằm trong repo — đặt nó vào thư mục gốc trên máy rồi chạy. |
| `tools/que-tuong-fixups.js` | Sửa các chỗ OCR đảo trang (tìm theo mốc chữ) |
| `tools/que-tuong-bo-sung.js` | Nội dung chép tay cho phần OCR bị thiếu (tự trộn khi build) |
| `js/app.js` | Giao diện, phương pháp lập quẻ, lịch sử, chia sẻ, xuất ảnh |
| `tra-ngay.html`, `js/lookup.js` | Trang tra ngày theo can chi (engine: `scanDays` trong `js/lunar.js`) |
| `css/style.css` | Giao diện |
| `tests/engine.test.js` | Kiểm thử engine: `node tests/engine.test.js` |

Đổi tên hiển thị trên lá quẻ ở `CONFIG` đầu file `js/app.js` (`siteName`, `siteUrl`).

## Quy ước tính

- Tháng theo tiết khí, năm (trụ) đổi tại Lập Xuân; mặc định từ 23h tính sang ngày mới (có thể tắt).
- Vượng/Tướng/Hưu/Tù/Tử theo ngũ hành Nguyệt lệnh; vòng Trường sinh tính Thổ theo Thủy.
- Lộc, Quý nhân, Dương nhẫn, Văn xương theo can ngày (Quý nhân: Canh Tân → Dần Ngọ); Dịch mã, Đào hoa, Tướng tinh, Hoa cái, Kiếp sát, Tai sát, Mưu tinh theo chi ngày; Thiên hỷ, Thiên y theo tháng.
- Quải thần: Thế hào dương khởi Tý, âm khởi Ngọ, đếm đến hào Thế.
- Hương Khuê: hào bị Quái thân khắc; Sàng Trướng: hào được Quái thân sinh (cột Quải thần trên lá quẻ ghi QT / H.Khuê / S.Trướng).
