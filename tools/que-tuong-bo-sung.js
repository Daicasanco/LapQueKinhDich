/*
 * Nội dung bổ sung chép tay từ ảnh chụp sách cho những phần bản OCR bị thiếu.
 * tools/build-que-tuong.js trộn file này vào: quẻ không có trong MD → thêm cả quẻ;
 * quẻ đã có → chỉ điền những mục đang trống (tongQuan / queTuong / lucHao).
 * Mỗi mục là một mảng đoạn văn.
 */
'use strict';

module.exports = {
  // Sách trang 123–124: bản OCR mất trang chứa Lục hào tượng
  'Thiên Thủy Tụng': {
    lucHao: [
      'Huynh đệ trì Thế, Huynh đệ là ý tranh chấp, hào năm là kim, hào năm là miệng, Kim chủ âm thanh, hào Thế khắc, chính là đoạt nhập thanh âm, cùng người đối luận.',
      'Cho nên quẻ này bao hàm ý tranh chấp, tố tụng, cãi lộn, náo nhiệt, ồn ào, biện luận, thảo luận.'
    ]
  },

  // Sách trang 47–48: bản OCR không có quẻ này
  'Hỏa Địa Tấn': {
    palace: 'Càn',
    tag: 'du hồn',
    tongQuan: [
      'Thượng Ly hạ Khôn, tượng mặt trời chiếu sáng mặt đất, vạn vật mềm mại phụ thuộc. Có ý tiến lên, tấn thăng, tấn cấp, tiến kiến. Có ý sẽ tiến thêm một bước về phía trước, phát triển ý tưởng, hoặc mở rộng sự nghiệp quy mô, thăng quan, tấn cấp. Gieo được quẻ này lợi cho học hành, không ngừng tiến bộ. Cầu tài, hỏi cưới không tốt. Lợi cầu tên, cầu quan.'
    ],
    queTuong: [
      'Quẻ ngoại là Ly, là lửa, là Thái Dương. Quẻ nội là Khôn, là đất, Thái Dương ở trên, đại địa ở dưới, tổ hợp chính là Thái Dương từ mặt đất vừa mới thăng lên. Cho nên lấy tên là Tấn. Cổ nhân nói, Tấn, thăng vậy, chính là ý tứ này.'
    ],
    lucHao: [
      'Sơ hào là mặt đất, lâm Phụ Mẫu, Phụ Mẫu chủ mặt đất, lâm thổ lại là đất, cho nên sơ hào chính là đại địa. Hào hai là vị cao hơn mặt đất, lâm Tị hỏa, giống như Thái dương vừa xuất khỏi mặt đất. Mà lại nhìn hào sáu, hào sáu là trời, hào sáu có lục thân tương tự hào hai, cho thấy mặt trời vừa xuất khỏi mặt đất đến trên trời. Cũng là tượng lên cao.',
      'Cho nên quẻ này bên trong bao hàm lên cao, tiến lên, hướng lên, phát đạt, hưng thịnh, hăm hở tiến lên.'
    ]
  },

  // Sách trang 216–217: bản OCR không có quẻ này
  'Thủy Hỏa Ký Tế': {
    palace: 'Khảm',
    tag: '',
    tongQuan: [
      'Ba âm ba dương tất cả đều được vị, hình tượng hoàn chỉnh hoàn mỹ. Dự đoán gặp nhiều khó khăn vì vật cực tất phản. «Ký Tế» ý là đã thành công, mà thực tế hiện tại chưa thành công, cho nên luận ngược lại.'
    ],
    queTuong: [
      'Hạ hỏa thượng thủy, vì hỏa tính nóng, thượng thì lại lấy ôn hàn thủy, thủy ở quẻ ngoại, ở trên, thủy tính chảy xuống, khắc chế hỏa làm hỏa không quá vượng, thủy hỏa chế ước lẫn nhau, bổ khuyết cho nhau, cho nên gọi là Ký Tế.'
    ],
    lucHao: [
      'Thế Ứng tỷ hòa. Nội ngoại đều là Huynh đệ bằng hữu, hòa hợp, có phúc cùng hưởng, như người một nhà, không có khác biệt, cho nên cũng phù hợp hàm nghĩa tên quẻ.',
      'Quẻ này có ý bổ sung, hòa hợp, trợ giúp, bình ổn, viên mãn, ngược lại có lợi ích, ăn khớp, phối hợp.'
    ]
  }
};
