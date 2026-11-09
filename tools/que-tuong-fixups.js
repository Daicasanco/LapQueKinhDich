/*
 * Sửa các chỗ OCR đảo trang / lạc đoạn cho tools/build-que-tuong.js.
 * Khóa là tên quẻ đúng như tiêu đề "X cung: <tên>" trong file MD.
 * Mỗi hàm nhận (sec, helpers) và sửa trực tiếp sec.tongQuan / sec.queTuong / sec.lucHao (mảng đoạn văn).
 * helpers.grab(regex, { untilBlank }) lấy các dòng bắt đầu tại dòng khớp regex (tìm theo chữ, không theo số dòng).
 */
'use strict';

module.exports = {
  // Nửa sau "Quẻ tượng" và cả "Lục hào tượng" của Bác bị OCR xếp lẫn vào giữa ví dụ quẻ Phong Địa Quán
  'Sơn Địa Bác': (sec, h) => {
    const head = h.grab(/^Quẻ tượng:\s*quẻ ngoại là Cấn, là núi, là chỗ cao/i, { untilBlank: true });
    const tail = h.grab(/^cao rơi xuống\. Cho nên cổ nhân lấy tên là Bác/i, { untilBlank: true });
    if (head && tail) sec.queTuong = h.paragraphs([h.labelOf(head[0]).rest, ...head.slice(1), ...tail]);
    const lh = h.grab(/^Lục hào tượng:\s*Thế tại hào năm\. Hào năm là tôn vị/i);
    if (lh) sec.lucHao = h.paragraphs([h.labelOf(lh[0]).rest, ...lh.slice(1)]);
  }
};
