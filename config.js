/* =====================================================================
   NỘI DUNG BỨC THƯ — sửa ở đây là đủ, không cần đụng vào code khác.

   - {to}   : tên / biệt danh của bạn gái      - {from} : cách anh ký tên
   - *chữ*  : tô nổi bật bằng bút dạ quang       - ♥ : trái tim đỏ nhỏ
   - Có thể đổi tên nhanh bằng link, ví dụ:  ...?to=Linh&from=Bảo
   ===================================================================== */
window.LETTER = {
  to: 'Em yêu',
  from: 'Anh',
  date: '24.11.2026',

  // Điền ngày bắt đầu yêu (YYYY-MM-DD) để màn cuối hiện "đã bên nhau X ngày". Để null để ẩn.
  since: null,

  pages: [
    {
      type: 'greet',
      kicker: 'Gửi {to},',
      lines: [
        'Hôm nay là 24 tháng 11 —',
        'ngày thế giới có thêm một *cô gái đáng yêu nhất*,',
        'và anh thật may mắn khi được là người yêu em ♥',
      ],
      effect: 'confetti',
    },
    {
      type: 'cake',
      title: 'Thổi nến nào',
      lines: ['Trước khi đọc tiếp, em thổi nến và ước một điều nhé.'],
      after: [
        'Điều ước của em, anh nghe thấy hết rồi đó nha ✨',
        'Anh sẽ cố gắng *biến nó thành thật*.',
      ],
      effect: 'sparkles',
    },
    {
      type: 'text',
      title: 'Anh có chuyện này muốn nói…',
      lines: [
        'Ừm… em ơi.',
        'Anh có chuyện này muốn nói, nhưng mà… anh hơi ngại.',
        'Em còn nhớ cái tối hôm đó không? Sau bữa đi ăn, anh chở em về…',
        'Cả đoạn đường, anh cứ im im. Trong đầu thì *chạy loạn hết cả lên*.\nAnh nghĩ, nghĩ nữa, rồi lại… thôi, để lát nữa.',
      ],
    },
    {
      type: 'text',
      title: 'Cái tối hôm đó',
      lines: [
        'Rồi anh nói. Mà còn nói không đàng hoàng nữa:',
        { t: '"Bà làm bạn gái tui nha." 🙈', cls: 'quote shy', fx: 'shy' },
        'Giờ nghĩ lại, anh vẫn thấy mình *ngố* kinh khủng.',
        'Mà em lại *đồng ý* ♥',
      ],
      effect: 'stars',
    },
    {
      type: 'text',
      title: 'Anh muốn nói lại',
      lines: [
        'Mình yêu nhau lâu rồi, mà thỉnh thoảng anh vẫn thấy tim đập nhanh như tối hôm đó.',
        'Nên lần này, anh nói lại cho đàng hoàng nhé.\nKhông "bà", không "tui" nữa…',
        { t: '"Anh yêu em, nhiều lắm." ♥', cls: 'quote big', fx: 'blush' },
      ],
    },
    {
      type: 'text',
      title: 'Cảm ơn em',
      lines: [
        'Cảm ơn em vì đã xuất hiện trong cuộc sống của anh.',
        'Cảm ơn vì những buổi chiều rất bình thường, mà có em là thành *đặc biệt*.',
        'Cảm ơn em đã kiên nhẫn với sự vụng về của anh, và vẫn cười dịu dàng như chưa có chuyện gì ♥',
      ],
      effect: 'hearts',
    },
    {
      type: 'text',
      title: 'Điều anh ước',
      lines: [
        'Anh ước tuổi mới của em có thật nhiều *tiếng cười*,',
        'ít một chút muộn phiền,',
        'mỗi sáng thức dậy đều có điều gì đó để mong chờ,',
        'và mọi ước mơ của em đều dần *thành sự thật*.',
      ],
      effect: 'shooting',
    },
    {
      type: 'text',
      title: 'Lời hứa của anh',
      lines: [
        'Anh không hứa mình sẽ hoàn hảo.',
        'Nhưng anh hứa sẽ luôn ở đây — nắm tay em đi qua mọi mùa, kể cả những ngày mưa.',
        'Anh yêu em, *nhiều hơn* những gì lời nói có thể kể hết ♥',
      ],
      effect: 'heartRain',
    },
    {
      type: 'finale',
      big: 'Anh yêu em',
      lines: ['Chúc mừng sinh nhật, {to}!'],
      sign: 'Mãi yêu bbi húiiii',
    },
  ],
};
