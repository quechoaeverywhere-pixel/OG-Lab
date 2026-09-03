import { Dossier, DynamicPillar, ProjectAnalysisResult, ProjectActionScenario, LexiconTerm } from '../types';

/**
 * Helper to slugify strings for tags
 */
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generates 6 dynamic pillars specifically tailored for each scenario domain
 */
export function buildScenarioDynamicPillars(
  scenarioKey: string,
  projectTitle: string,
  scenarioTitle: string
): DynamicPillar[] {
  switch (scenarioKey) {
    case 'sop_workflows':
      return [
        {
          id: `p-sop-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Bản Thể Quy Trình & Tiêu Chuẩn Hóa Chuỗi Giá Trị',
          description: 'Ý niệm gốc rễ về tiêu chuẩn chất lượng, nguyên lý tinh gọn và định vị điểm chạm cốt lõi.',
          chapters: [
            { id: `ch-sop-1-1-${Date.now()}`, title: 'Chương 1.1: Khảo Sát Bối Cảnh Hiện Trạng & Tinh Gọn Hóa Quy Trình', status: 'pending' },
            { id: `ch-sop-1-2-${Date.now()}`, title: 'Chương 1.2: Chuẩn Hóa Danh Mục SOPs & Bộ Tiêu Chí Nghiệm Thu (DoD)', status: 'pending' }
          ]
        },
        {
          id: `p-sop-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Sơ Đồ Luồng Tiến Trình & Điều Phối Nguồn Lực',
          description: 'Quy luật dòng chảy công việc, sơ đồ tiến trình ASCII Flow phẳng và nhịp độ vận hành.',
          chapters: [
            { id: `ch-sop-2-1-${Date.now()}`, title: 'Chương 2.1: Sơ Đồ Luồng Vận Hành ASCII & Chuỗi Chuyển Giao Dữ Liệu', status: 'pending' },
            { id: `ch-sop-2-2-${Date.now()}`, title: 'Chương 2.2: Cơ Chế Cân Bằng Tải & Phân Bổ Nguồn Lực Thời Gian Thực', status: 'pending' }
          ]
        },
        {
          id: `p-sop-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Kiến Trúc Phân Kỳ 3 Giai Đoạn & Ma Trận RACI',
          description: 'Hiện thực hóa thành kế hoạch thi công, phân công trách nhiệm rõ ràng cho từng mắt xích.',
          chapters: [
            { id: `ch-sop-3-1-${Date.now()}`, title: 'Chương 3.1: Lộ Trình Phân Kỳ 3 Giai Đoạn (Khởi động - Thi công - Vận hành)', status: 'pending' },
            { id: `ch-sop-3-2-${Date.now()}`, title: 'Chương 3.2: Ma Trận Phân Quyền & Trách Nhiệm Giải Trình (RACI Matrix)', status: 'pending' }
          ]
        },
        {
          id: `p-sop-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Biện Chứng Điểm Nghẽn & Kiểm Soát Sự Cố Vận Hành',
          description: 'Phản biện các điểm nghẽn (bottlenecks), bẫy trễ hạn và quy trình ứng phó rủi ro khẩn cấp.',
          chapters: [
            { id: `ch-sop-4-1-${Date.now()}`, title: 'Chương 4.1: Ma Trận 5 Điểm Nghẽn Tiềm Ẩn & Phương Án Phòng Ngừa', status: 'pending' },
            { id: `ch-sop-4-2-${Date.now()}`, title: 'Chương 4.2: Kịch Bản Ứng Phó Khẩn Cấp & Kích Hoạt Dự Phòng (Fallbacks)', status: 'pending' }
          ]
        },
        {
          id: `p-sop-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Chuẩn Mực An Toàn & Kỷ Luật Tuân Thủ (Shinbashira)',
          description: 'Khoảng lặng đạo đức, kỷ luật giám sát hiện trường và chuẩn mực an toàn không thỏa hiệp.',
          chapters: [
            { id: `ch-sop-5-1-${Date.now()}`, title: 'Chương 5.1: Bộ Nguyên Tắc Kỷ Luật Vận Hành & Văn Hóa An Toàn', status: 'pending' },
            { id: `ch-sop-5-2-${Date.now()}`, title: 'Chương 5.2: Cơ Chế Kiểm Tra Độc Lập & Báo Cáo Sự Cố Không Phạt', status: 'pending' }
          ]
        },
        {
          id: `p-sop-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Tối Ưu Hóa Tuần Hoàn & Nâng Cấp Hệ Thống Liên Tục',
          description: 'Vòng lặp Kaizen cải tiến liên tục, tích hợp công nghệ số và vận hành sinh thái bền vững.',
          chapters: [
            { id: `ch-sop-6-1-${Date.now()}`, title: 'Chương 6.1: Vòng Lặp Phản Hồi Kaizen & Đo Lường Năng Suất Tinh Gọn', status: 'pending' },
            { id: `ch-sop-6-2-${Date.now()}`, title: 'Chương 6.2: Tự Động Hóa & Chuyển Đổi Vận Hành Xanh', status: 'pending' }
          ]
        }
      ];

    case 'executive_report':
      return [
        {
          id: `p-exec-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Luận Điểm Đề Án & Đề Xuất Giá Trị Thẩm Định',
          description: 'Khảo sát nền tảng ý niệm, luận điểm chiến lược và đề xuất giá trị cốt lõi (Core Value Proposition).',
          chapters: [
            { id: `ch-exec-1-1-${Date.now()}`, title: 'Chương 1.1: Tóm Tắt Điều Hành (Executive Summary) & Bối Cảnh Đầu Tư', status: 'pending' },
            { id: `ch-exec-1-2-${Date.now()}`, title: 'Chương 1.2: Đề Xuất Giá Trị Khác Biệt & Lợi Thế Cạnh Tranh Bền Vững', status: 'pending' }
          ]
        },
        {
          id: `p-exec-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Mô Hình Tài Chính, Dòng Tiền & Cấu Trúc Vốn',
          description: 'Động lực học dòng tiền, dự toán phân kỳ ngân sách và các kịch bản hoàn vốn đầu tư.',
          chapters: [
            { id: `ch-exec-2-1-${Date.now()}`, title: 'Chương 2.1: Dự Toán Ngân Sách Phân Kỳ & Điểm Hòa Vốn (Break-even)', status: 'pending' },
            { id: `ch-exec-2-2-${Date.now()}`, title: 'Chương 2.2: Cơ Cấu Huy Động Vốn & Kế Hoạch Quản Trị Thanh Khoản', status: 'pending' }
          ]
        },
        {
          id: `p-exec-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Kế Hoạch Đầu Tư, OKRs & Khung Đánh Giá KPIs',
          description: 'Hiện thực hóa mục tiêu thành các mốc chỉ số định lượng có thể đo lường và thẩm định độc lập.',
          chapters: [
            { id: `ch-exec-3-1-${Date.now()}`, title: 'Chương 3.1: Hệ Thống Mục Tiêu Cốt Lõi OKRs Theo Từng Quý', status: 'pending' },
            { id: `ch-exec-3-2-${Date.now()}`, title: 'Chương 3.2: Bộ Chỉ Số Đo Lường Hiệu Suất Chiến Lược (Strategic KPIs)', status: 'pending' }
          ]
        },
        {
          id: `p-exec-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Ma Trận Quản Trị Rủi Ro & Cơ Chế Phòng Vệ',
          description: 'Biện chứng phản biện các kịch bản rủi ro thị trường, pháp lý, tài chính và giải pháp phòng thủ.',
          chapters: [
            { id: `ch-exec-4-1-${Date.now()}`, title: 'Chương 4.1: Ma Trận Đánh Giá Rủi Ro Đa Chiều (Risk Assessment Matrix)', status: 'pending' },
            { id: `ch-exec-4-2-${Date.now()}`, title: 'Chương 4.2: Cơ Chế Hàng Rào Phòng Vệ & Quỹ Dự Phòng Rủi Ro', status: 'pending' }
          ]
        },
        {
          id: `p-exec-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Quản Trị Minh Bạch, Trách Nhiệm Giải Trình & An Toàn',
          description: 'Trụ cột giữ vững niềm tin: cơ chế giám sát độc lập, đạo đức kinh doanh và quản trị nội bộ.',
          chapters: [
            { id: `ch-exec-5-1-${Date.now()}`, title: 'Chương 5.1: Khung Quản Trị Doanh Nghiệp & Trách Nhiệm Hội Đồng', status: 'pending' },
            { id: `ch-exec-5-2-${Date.now()}`, title: 'Chương 5.2: Quy Trình Kiểm Toán Độc Lập & Minh Bạch Thông Tin', status: 'pending' }
          ]
        },
        {
          id: `p-exec-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Trách Nhiệm ESG & Tầm Nhìn Phát Triển Bền Vững',
          description: 'Sự hòa hợp với hệ sinh thái xã hội, trách nhiệm môi trường và định hướng 5-10 năm.',
          chapters: [
            { id: `ch-exec-6-1-${Date.now()}`, title: 'Chương 6.1: Khung Thực Hành Môi Trường, Xã Hội & Quản Trị (ESG)', status: 'pending' },
            { id: `ch-exec-6-2-${Date.now()}`, title: 'Chương 6.2: Tầm Nhìn Chiến Lược Dài Hạn & Di Sản Đề Án', status: 'pending' }
          ]
        }
      ];

    case 'internal_team_comm':
      return [
        {
          id: `p-team-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Tuyên Ngôn Sứ Mệnh & Giá Trị Cốt Lõi Đồng Thuận',
          description: 'Truyền tải lý tưởng nguyên thủy và lý do sống còn vì sao cả đội ngũ cùng dấn thân.',
          chapters: [
            { id: `ch-team-1-1-${Date.now()}`, title: 'Chương 1.1: Tuyên Ngôn Sứ Mệnh Đề Án: Bức Tranh Lớn & Ý Nghĩa Dấn Thân', status: 'pending' },
            { id: `ch-team-1-2-${Date.now()}`, title: 'Chương 1.2: Hệ Giá Trị Cốt Lõi: Những Điều Chúng Ta Tôn Vinh & Cam Kết', status: 'pending' }
          ]
        },
        {
          id: `p-team-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Cơ Chế Phối Hợp Liên Phòng Ban & Dòng Chảy Thông Tin',
          description: 'Quy luật tương tác nội bộ, xóa bỏ ốc đảo thông tin (silos) và nhịp giao tiếp minh bạch.',
          chapters: [
            { id: `ch-team-2-1-${Date.now()}`, title: 'Chương 2.1: Nhịp Giao Tiếp Hàng Tuần (Cadence) & Kênh Chia Sẻ Thông Suốt', status: 'pending' },
            { id: `ch-team-2-2-${Date.now()}`, title: 'Chương 2.2: Giao Thức Phối Hợp Liên Chức Năng (Cross-functional Protocol)', status: 'pending' }
          ]
        },
        {
          id: `p-team-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Cẩm Nang Hành Động Thực Chiến 1-Trang Cho Nhân Sự',
          description: 'Chuyển hóa chiến lược vĩ mô thành cẩm nang hành động dễ hiểu cho từng vị trí.',
          chapters: [
            { id: `ch-team-3-1-${Date.now()}`, title: 'Chương 3.1: Bộ Quy Tắc Ứng Xử 1-Trang (One-page Playbook) Thực Chiến', status: 'pending' },
            { id: `ch-team-3-2-${Date.now()}`, title: 'Chương 3.2: Danh Mục 10 Việc Ưu Tiên Hàng Đầu Cho Từng Trưởng Nhóm', status: 'pending' }
          ]
        },
        {
          id: `p-team-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Bộ Q&A Tháo Gỡ Kháng Cự & Điểm Nghẽn Tâm Lý',
          description: 'Đối diện thẳng thắn với lo âu, nghi ngại về khối lượng công việc và rủi ro thay đổi.',
          chapters: [
            { id: `ch-team-4-1-${Date.now()}`, title: 'Chương 4.1: Bộ Q&A Giải Đáp 15 Câu Hỏi Hóc Búa Nhất Của Đội Ngũ', status: 'pending' },
            { id: `ch-team-4-2-${Date.now()}`, title: 'Chương 4.2: Kế Hoạch Quản Trị Sự Thay Đổi (Change Management Roadmap)', status: 'pending' }
          ]
        },
        {
          id: `p-team-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Văn Hóa Đồng Lòng, Điểm Tựa Tâm Lý & Sức Bền Đội Ngũ',
          description: 'Khoảng lặng gắn kết, tri ân đóng góp thầm lặng và xây dựng môi trường an toàn tâm lý.',
          chapters: [
            { id: `ch-team-5-1-${Date.now()}`, title: 'Chương 5.1: Xây Dựng Không Gian An Toàn Tâm Lý (Psychological Safety)', status: 'pending' },
            { id: `ch-team-5-2-${Date.now()}`, title: 'Chương 5.2: Cơ Chế Ghi Nhận, Tuyên Dương & Tiếp Sức Cho Nhân Sự', status: 'pending' }
          ]
        },
        {
          id: `p-team-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Cộng Hưởng Năng Lực & Không Gian Sáng Tạo Đột Phá',
          description: 'Tạo đà để mỗi thành viên phát huy tối đa tiềm năng, học hỏi và đồng kiến tạo tương lai.',
          chapters: [
            { id: `ch-team-6-1-${Date.now()}`, title: 'Chương 6.1: Vườn Ươm Sáng Kiến Nội Bộ & Thưởng Đột Phá', status: 'pending' },
            { id: `ch-team-6-2-${Date.now()}`, title: 'Chương 6.2: Khung Phát Triển Năng Lực Dài Hạn Cho Đội Ngũ Kế Thừa', status: 'pending' }
          ]
        }
      ];

    case 'public_community_comm':
      return [
        {
          id: `p-pub-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Tự Sự Cốt Lõi: Tại Sao Dự Án Này Lại Cần Thiết?',
          description: 'Câu chuyện khởi nguồn nhân văn, chạm đến trái tim và khơi dậy sự thấu cảm cộng đồng.',
          chapters: [
            { id: `ch-pub-1-1-${Date.now()}`, title: 'Chương 1.1: Câu Chuyện Khởi Nguồn Nhân Văn: Động Lực Phụng Sự Đời Sống', status: 'pending' },
            { id: `ch-pub-1-2-${Date.now()}`, title: 'Chương 1.2: Định Vị Thông Điệp Cốt Lõi (Core Narrative) Truyền Cảm Hứng', status: 'pending' }
          ]
        },
        {
          id: `p-pub-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Chuyển Hóa Biệt Ngữ Phức Tạp Sang Tiếng Nói Đời Thường',
          description: 'Quy tắc biên dịch kiến thức chuyên môn thành ngôn ngữ giản dị, gần gũi và dễ hiểu.',
          chapters: [
            { id: `ch-pub-2-1-${Date.now()}`, title: 'Chương 2.1: Bộ Từ Điển Thuật Ngữ Đời Thường Dành Cho Công Chúng', status: 'pending' },
            { id: `ch-pub-2-2-${Date.now()}`, title: 'Chương 2.2: Các Phép Ẩn Dụ Trực Quan & So Sánh Đời Sống Thân Thuộc', status: 'pending' }
          ]
        },
        {
          id: `p-pub-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Kế Hoạch Chiến Dịch Truyền Thông Đa Kênh & Infographic',
          description: 'Kế hoạch triển khai nội dung mạng xã hội, báo chí, sự kiện cộng đồng và tài liệu thị giác.',
          chapters: [
            { id: `ch-pub-3-1-${Date.now()}`, title: 'Chương 3.1: Lộ Trình 4 Giai Đoạn Chiến Dịch Truyền Thông Lan Tỏa', status: 'pending' },
            { id: `ch-pub-3-2-${Date.now()}`, title: 'Chương 3.2: Kịch Bản Nội Dung Đa Phương Tiện (Articles, Video, Infographic)', status: 'pending' }
          ]
        },
        {
          id: `p-pub-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Đối Thoại Phản Biện & Giải Tỏa Định Kiến Dư Luận',
          description: 'Lắng nghe dư luận đa chiều, xử lý các nghi ngại xã hội và phòng ngừa khủng hoảng truyền thông.',
          chapters: [
            { id: `ch-pub-4-1-${Date.now()}`, title: 'Chương 4.1: Ma Trận Tiếp Nhận & Đối Thoại Với Ý Kiến Trái Chiều', status: 'pending' },
            { id: `ch-pub-4-2-${Date.now()}`, title: 'Chương 4.2: Kế Hoạch Phản Ứng Khủng Hoảng Truyền Thông (Issue Management)', status: 'pending' }
          ]
        },
        {
          id: `p-pub-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Đạo Đức Truyền Thông & Xây Dựng Niềm Tin Thật Sự',
          description: 'Cam kết nói thật, không thổi phồng, tôn trọng sự thật và đặt lợi ích cộng đồng lên trên hết.',
          chapters: [
            { id: `ch-pub-5-1-${Date.now()}`, title: 'Chương 5.1: Chuẩn Mực Đạo Đức Truyền Thông: Nói Sự Thật & Trách Nhiệm', status: 'pending' },
            { id: `ch-pub-5-2-${Date.now()}`, title: 'Chương 5.2: Cơ Chế Tiếp Nhận Phản Hồi Trực Tiếp Từ Người Dân', status: 'pending' }
          ]
        },
        {
          id: `p-pub-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Lan Tỏa Cộng Đồng & Lời Kêu Gọi Đồng Kiến Tạo',
          description: 'Kêu gọi cộng đồng cùng chung tay hành động, tạo hiệu ứng mạng lưới và giá trị xã hội lan tỏa.',
          chapters: [
            { id: `ch-pub-6-1-${Date.now()}`, title: 'Chương 6.1: Chiến Lược Kết Nối Đối Tác Xã Hội & Mạng Lưới Tình Nguyện', status: 'pending' },
            { id: `ch-pub-6-2-${Date.now()}`, title: 'Chương 6.2: Lời Kêu Gọi Hành Động (Call-to-Action) Vì Tương Lai Bền Vững', status: 'pending' }
          ]
        }
      ];

    case 'market_research':
      return [
        {
          id: `p-mkt-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Bối Cảnh Ngành & Bản Chất Nhu Cầu Tiềm Ẩn',
          description: 'Định nghĩa gốc rễ thị trường, dung lượng ngành và nguồn gốc nhu cầu chưa được đáp ứng.',
          chapters: [
            { id: `ch-mkt-1-1-${Date.now()}`, title: 'Chương 1.1: Tổng Quan Quy Mô Thị Trường (TAM/SAM/SOM) & Xu Hướng Ngành', status: 'pending' },
            { id: `ch-mkt-1-2-${Date.now()}`, title: 'Chương 1.2: Khám Phá Nhu Cầu Tiềm Ẩn (Latent Needs) Của Thị Trường', status: 'pending' }
          ]
        },
        {
          id: `p-mkt-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Động Lực Học Thị Trường & Cấu Trúc Cung - Cầu',
          description: 'Quy luật biến động cung - cầu, cấu trúc chuỗi cung ứng và rào cản gia nhập ngành.',
          chapters: [
            { id: `ch-mkt-2-1-${Date.now()}`, title: 'Chương 2.1: Phân Tích 5 Lực Lượng Cạnh Tranh (Porter’s 5 Forces)', status: 'pending' },
            { id: `ch-mkt-2-2-${Date.now()}`, title: 'Chương 2.2: Rào Cản Gia Nhập & Động Lực Dịch Chuyển Cung Cầu', status: 'pending' }
          ]
        },
        {
          id: `p-mkt-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Ma Trận Đối Thủ & Bản Đồ Định Vị Khoảng Trống (Market Gap)',
          description: 'So sánh đối thủ trực tiếp/gián tiếp, tìm ra khoảng trống đại dương xanh và định vị USP.',
          chapters: [
            { id: `ch-mkt-3-1-${Date.now()}`, title: 'Chương 3.1: Ma Trận Điểm Mạnh/Yếu Của Top 5 Đối Thủ Cạnh Tranh', status: 'pending' },
            { id: `ch-mkt-3-2-${Date.now()}`, title: 'Chương 3.2: Bản Đồ Định Vị (Perceptual Map) & Điểm Khác Biệt Độc Nhất (USP)', status: 'pending' }
          ]
        },
        {
          id: `p-mkt-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Rủi Ro Biến Động Ngành & Bẫy Cạnh Tranh Giá',
          description: 'Phản biện các nguy cơ chiến tranh giá, bão hòa thị trường và các điểm nghẽn chính sách.',
          chapters: [
            { id: `ch-mkt-4-1-${Date.now()}`, title: 'Chương 4.1: Nhận Diện Rủi Ro Bão Hòa & Bẫy Hạ Giá Phá Thị Trường', status: 'pending' },
            { id: `ch-mkt-4-2-${Date.now()}`, title: 'Chương 4.2: Động Thái Dự Báo Phản Đòn Của Các Đơn Vị Thống Lĩnh', status: 'pending' }
          ]
        },
        {
          id: `p-mkt-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Trực Giác Thị Trường & Chuẩn Mực Đạo Đức Khảo Sát',
          description: 'Tính trung thực trong dữ liệu nghiên cứu, không thiên kiến và tôn trọng quyền riêng tư.',
          chapters: [
            { id: `ch-mkt-5-1-${Date.now()}`, title: 'Chương 5.1: Phương Pháp Thu Thập Dữ Liệu Khách Quan & Loại Bỏ Thiên Kiến', status: 'pending' },
            { id: `ch-mkt-5-2-${Date.now()}`, title: 'Chương 5.2: Đạo Đức Khảo Sát & Bảo Vệ Quyền Dữ Liệu Của Khách Hàng', status: 'pending' }
          ]
        },
        {
          id: `p-mkt-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Xu Hướng Tương Lai & Động Lực Tăng Trưởng Xanh',
          description: 'Dự phóng thị trường 3-5 năm tới, các cơ hội chuyển đổi xanh và công nghệ mới nổi.',
          chapters: [
            { id: `ch-mkt-6-1-${Date.now()}`, title: 'Chương 6.1: Dự Báo Xu Hướng Tiêu Dùng Mới Nổi Trong 3-5 Năm Tới', status: 'pending' },
            { id: `ch-mkt-6-2-${Date.now()}`, title: 'Chương 6.2: Chiến Lược Mở Rộng Thị Trường Sang Các Phân Khúc Tiềm Năng', status: 'pending' }
          ]
        }
      ];

    case 'consumer_psychology':
      return [
        {
          id: `p-psy-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Bản Đồ Chân Dung Khách Hàng (Target Personas)',
          description: 'Phân tích chiều sâu nhân khẩu học, tâm lý học và thế giới quan của đối tượng mục tiêu.',
          chapters: [
            { id: `ch-psy-1-1-${Date.now()}`, title: 'Chương 1.1: Hồ Sơ Chân Dung 3 Nhóm Khách Hàng Điển Hình (Archetypes)', status: 'pending' },
            { id: `ch-psy-1-2-${Date.now()}`, title: 'Chương 1.2: Bối Cảnh Sống, Hệ Giá Trị & Động Lực Nội Tại Của Khách Hàng', status: 'pending' }
          ]
        },
        {
          id: `p-psy-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Cơ Chế Ra Quyết Định & Rào Cản Tâm Lý Thầm Kín',
          description: 'Quy luật hành vi mua sắm, các điểm kháng cự vô thức và nỗi sợ rủi ro của người tiêu dùng.',
          chapters: [
            { id: `ch-psy-2-1-${Date.now()}`, title: 'Chương 2.1: Hành Trình Ra Quyết Định & Các Điểm Chạm Tâm Lý Trọng Yếu', status: 'pending' },
            { id: `ch-psy-2-2-${Date.now()}`, title: 'Chương 2.2: Rào Cản Tâm Lý Thầm Kín & Nỗi Sợ Mất Mát (Loss Aversion)', status: 'pending' }
          ]
        },
        {
          id: `p-psy-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Bản Đồ Thấu Cảm (Empathy Map): Nỗi Đau & Khát Vọng',
          description: 'Phân tích ma trận Nghĩ & Cảm, Thấy, Nghe, Nói & Làm, Nỗi đau (Pains) & Khát vọng (Gains).',
          chapters: [
            { id: `ch-psy-3-1-${Date.now()}`, title: 'Chương 3.1: Ma Trận Bản Đồ Thấu Cảm Toàn Diện (Empathy Map Grid)', status: 'pending' },
            { id: `ch-psy-3-2-${Date.now()}`, title: 'Chương 3.2: Danh Mục Nỗi Đau Khắc Khoải & Đòn Bẩy Kích Hoạt Hành Động', status: 'pending' }
          ]
        },
        {
          id: `p-psy-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Kịch Bản Thuyết Phục & Xử Lý Từ Chối Thực Chiến',
          description: 'Kỹ nghệ xử lý phản biện, hóa giải do dự và kịch bản tư vấn giải pháp chân thành.',
          chapters: [
            { id: `ch-psy-4-1-${Date.now()}`, title: 'Chương 4.1: Bộ Kịch Bản Hóa Giải 10 Lý Do Từ Chối Phổ Biến Nhất', status: 'pending' },
            { id: `ch-psy-4-2-${Date.now()}`, title: 'Chương 4.2: Kỹ Thuật Đặt Câu Hỏi Thấu Cảm & Dẫn Dắt Nhận Thức', status: 'pending' }
          ]
        },
        {
          id: `p-psy-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Điểm Chạm Cảm Xúc Chân Thành & Trải Nghiệm Khách Hàng',
          description: 'Trụ cột niềm tin: bán hàng bằng sự tử tế, chăm sóc chu đáo và không thao túng tâm lý.',
          chapters: [
            { id: `ch-psy-5-1-${Date.now()}`, title: 'Chương 5.1: Thiết Kế Khoảnh Khắc Bất Ngờ & Hài Lòng (Delight Moments)', status: 'pending' },
            { id: `ch-psy-5-2-${Date.now()}`, title: 'Chương 5.2: Chuẩn Mực Tư Vấn Đạo Đức & Trách Nhiệm Đồng Hành', status: 'pending' }
          ]
        },
        {
          id: `p-psy-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Lòng Trung Thành Khách Hàng & Hiệu Ứng Lan Tỏa Truyền Miệng',
          description: 'Chuyển hóa khách hàng thành người đồng hành trung thành và đại sứ thương hiệu tự nhiên.',
          chapters: [
            { id: `ch-psy-6-1-${Date.now()}`, title: 'Chương 6.1: Vòng Đời Gắn Kết Khách Hàng (Customer Retention & Advocacy)', status: 'pending' },
            { id: `ch-psy-6-2-${Date.now()}`, title: 'Chương 6.2: Cơ Chế Kích Hoạt Hiệu Ứng Lan Tỏa Truyền Miệng (Word of Mouth)', status: 'pending' }
          ]
        }
      ];

    default:
      return [
        {
          id: `p-gen-1-${Date.now()}`,
          conceptualType: 'concept',
          title: `Trụ cột I: Bản Thể Luận & Đề Xuất Giá Trị (${scenarioTitle})`,
          description: 'Ý niệm khởi nguyên và mục tiêu cốt lõi.',
          chapters: [
            { id: `ch-gen-1-1-${Date.now()}`, title: 'Chương 1.1: Khởi Nguyên Bối Cảnh & Tái Định Nghĩa Bài Toán', status: 'pending' },
            { id: `ch-gen-1-2-${Date.now()}`, title: 'Chương 1.2: Mô Hình Giá Trị Cốt Lõi & Đề Xuất Khác Biệt', status: 'pending' }
          ]
        },
        {
          id: `p-gen-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Động Lực Học Vận Hành & Quy Luật Tương Tác',
          description: 'Cơ chế vận hành và các dòng chảy nguồn lực nội tại.',
          chapters: [
            { id: `ch-gen-2-1-${Date.now()}`, title: 'Chương 2.1: Sơ Đồ Quy Trình & Dòng Chảy Thông Tin Thực Tế', status: 'pending' },
            { id: `ch-gen-2-2-${Date.now()}`, title: 'Chương 2.2: Cơ Chế Tương Tác & Phối Hợp Các Khâu Vận Hành', status: 'pending' }
          ]
        },
        {
          id: `p-gen-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Kiến Trúc Thực Thi & Lộ Trình Triển Khai',
          description: 'Hiện thực hóa các giải pháp thành hành động thực tiễn.',
          chapters: [
            { id: `ch-gen-3-1-${Date.now()}`, title: 'Chương 3.1: Kế Hoạch Triển Khai & Danh Mục Hành Động Cụ Thể', status: 'pending' },
            { id: `ch-gen-3-2-${Date.now()}`, title: 'Chương 3.2: Phân Công Nguồn Lực & Hệ Thống Đo Lường Kết Quả', status: 'pending' }
          ]
        },
        {
          id: `p-gen-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Biện Chứng Rủi Ro & Cơ Chế Khắc Phục Điểm Nghẽn',
          description: 'Phản biện các mâu thuẫn, điểm nghẽn và phương án phòng vệ rủi ro.',
          chapters: [
            { id: `ch-gen-4-1-${Date.now()}`, title: 'Chương 4.1: Ma Trận Đánh Giá Rủi Ro & Dự Báo Điểm Nghẽn Tiềm Ẩn', status: 'pending' },
            { id: `ch-gen-4-2-${Date.now()}`, title: 'Chương 4.2: Phương Án Dự Phòng & Kịch Bản Khắc Phục Sự Cố', status: 'pending' }
          ]
        },
        {
          id: `p-gen-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Chuẩn Mực Quản Trị, Đạo Đức & Kỷ Luật (Shinbashira)',
          description: 'Khoảng lặng đạo đức, kỷ luật và bảo vệ tính bền vững.',
          chapters: [
            { id: `ch-gen-5-1-${Date.now()}`, title: 'Chương 5.1: Nguyên Tắc Giữ Vững Cân Bằng & Kỷ Luật Vận Hành', status: 'pending' },
            { id: `ch-gen-5-2-${Date.now()}`, title: 'Chương 5.2: Kiểm Soát Chất Lượng & Văn Hóa Trách Nhiệm', status: 'pending' }
          ]
        },
        {
          id: `p-gen-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Hòa Hợp Sinh Thái & Phát Triển Dài Hạn',
          description: 'Tầm nhìn phát triển bền vững và lan tỏa giá trị xã hội.',
          chapters: [
            { id: `ch-gen-6-1-${Date.now()}`, title: 'Chương 6.1: Tối Ưu Hóa & Nâng Cấp Hệ Thống Bền Vững', status: 'pending' },
            { id: `ch-gen-6-2-${Date.now()}`, title: 'Chương 6.2: Lan Tỏa Giá Trị & Di Sản Dài Hạn Của Đề Án', status: 'pending' }
          ]
        }
      ];
  }
}

/**
 * Generates the full suite of in-depth Dossiers from 1 Project Analysis Result:
 * 1. Master Strategy Appraisal Dossier
 * 2. SOP & Operational Roadmap Dossier
 * 3. Strategic Executive Board Dossier
 * 4. Internal Team Alignment & Playbook Dossier
 * 5. Public Storytelling & Community Impact Dossier
 * 6. Market Intelligence & Competitive Gap Dossier
 * 7. Consumer Psychology & Empathy Map Dossier
 */
export function buildMultiScenarioDossierSuite(
  analysis: ProjectAnalysisResult,
  originalDocContent?: string
): {
  masterDossier: Dossier;
  scenarioDossiers: Dossier[];
  allDossiers: Dossier[];
} {
  const projectSlug = slugify(analysis.projectTitle || 'du-an');
  const now = new Date().toISOString();
  const baseDiscipline = analysis.projectDomain || 'Quản Trị Dự Án & Kinh Tế';

  // 1. MASTER STRATEGY & APPRAISAL DOSSIER
  const masterPillars: DynamicPillar[] = analysis.pillarsForDossier && analysis.pillarsForDossier.length >= 6
    ? analysis.pillarsForDossier
    : [
        {
          id: `p-m-1-${Date.now()}`,
          conceptualType: 'concept',
          title: 'Trụ cột I: Bản Thể Luận & Đề Xuất Giá Trị Đề Án',
          description: 'Ý niệm nguyên thủy, căn nguyên bối cảnh và định vị giá trị cốt lõi.',
          chapters: [
            { id: `ch-m-1-1-${Date.now()}`, title: 'Chương 1.1: Khởi Nguyên Bối Cảnh & Tái Định Nghĩa Bài Toán', status: 'pending' },
            { id: `ch-m-1-2-${Date.now()}`, title: 'Chương 1.2: Mô Hình Giá Trị Cốt Lõi & Đề Xuất Khác Biệt', status: 'pending' }
          ]
        },
        {
          id: `p-m-2-${Date.now()}`,
          conceptualType: 'context',
          title: 'Trụ cột II: Động Lực Học Vận Hành & Quy Luật Dòng Tiền',
          description: 'Các quy luật vận động nội tại, dòng chảy thông tin và chu chuyển tài chính.',
          chapters: [
            { id: `ch-m-2-1-${Date.now()}`, title: 'Chương 2.1: Sơ Đồ Quy Trình & Dòng Chảy Thông Tin Thực Tế', status: 'pending' },
            { id: `ch-m-2-2-${Date.now()}`, title: 'Chương 2.2: Quy Luật Chu Chuyển Nguồn Lực & Dòng Tiền Hoàn Vốn', status: 'pending' }
          ]
        },
        {
          id: `p-m-3-${Date.now()}`,
          conceptualType: 'application',
          title: 'Trụ cột III: Kiến Trúc Phân Kỳ 3 Giai Đoạn & Phân Bổ Nguồn Lực',
          description: 'Hiện thực hóa thành các phân kỳ cụ thể với nguồn lực và mốc tiến độ rõ ràng.',
          chapters: [
            { id: `ch-m-3-1-${Date.now()}`, title: 'Chương 3.1: Phân Kỳ 3 Giai Đoạn Triển Khai (Khảo sát - Thi công - Vận hành)', status: 'pending' },
            { id: `ch-m-3-2-${Date.now()}`, title: 'Chương 3.2: Kế Hoạch Bố Trí Nhân Lực & Hạ Tầng Kỹ Thuật', status: 'pending' }
          ]
        },
        {
          id: `p-m-4-${Date.now()}`,
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Biện Chứng Rủi Ro & Cơ Chế Khắc Phục Điểm Nghẽn',
          description: 'Phản biện các mâu thuẫn thực tiễn, điểm nghẽn và phương án phòng vệ rủi ro.',
          chapters: [
            { id: `ch-m-4-1-${Date.now()}`, title: 'Chương 4.1: Ma Trận Điểm Nghẽn Thực Tiễn & Rủi Ro Tiềm Ẩn', status: 'pending' },
            { id: `ch-m-4-2-${Date.now()}`, title: 'Chương 4.2: Cơ Chế Khắc Phục & Phương Án Dự Phòng Khẩn Cấp', status: 'pending' }
          ]
        },
        {
          id: `p-m-5-${Date.now()}`,
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Quản Trị Trọng Tâm, Đạo Đức & Kỷ Luật Vận Hành',
          description: 'Khoảng lặng đạo đức, kỷ luật và bộ tiêu chuẩn đánh giá minh bạch.',
          chapters: [
            { id: `ch-m-5-1-${Date.now()}`, title: 'Chương 5.1: Bộ Chuẩn Mực Quản Trị Minh Bạch & Đạo Đức Nghề Nghiệp', status: 'pending' },
            { id: `ch-m-5-2-${Date.now()}`, title: 'Chương 5.2: Kỷ Luật Tuân Thủ & Cơ Chế Đánh Giá Giám Sát', status: 'pending' }
          ]
        },
        {
          id: `p-m-6-${Date.now()}`,
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Hòa Hợp Sinh Thái, Xã Hội & Phát Triển Bền Vững',
          description: 'Khả năng lan tỏa giá trị, hài hòa môi trường và sự trường tồn của dự án.',
          chapters: [
            { id: `ch-m-6-1-${Date.now()}`, title: 'Chương 6.1: Tác Động Môi Trường, Xã Hội & Cộng Đồng Bản Địa', status: 'pending' },
            { id: `ch-m-6-2-${Date.now()}`, title: 'Chương 6.2: Khung Phát Triển Trường Tồn & Di Sản Cho Tương Lai', status: 'pending' }
          ]
        }
      ];

  const masterMarkdown = `# BÁO CÁO THẨM ĐỊNH CHIẾN LƯỢC TOÀN DIỆN
**Đề Án:** ${analysis.projectTitle}
**Lĩnh Vực:** ${analysis.projectDomain} | **Chỉ Số Khả Thi:** ${analysis.feasibilityScore}/100 | **Lộ Trình:** ${analysis.detectedTimeline || '6-12 Tháng'}

---

## 1. NHẬN ĐỊNH THẨM ĐỊNH ĐIỀU HÀNH (EXECUTIVE DIAGNOSIS)
${analysis.executiveDiagnosis}

---

## 2. ĐIỂM MẠNH & LỢI THẾ CẠNH TRANH CỐT LÕI (CORE STRENGTHS)
${analysis.coreStrengths.map((s, i) => `${i + 1}. **${s}**`).join('\n\n')}

---

## 3. ĐIỂM NGHẼN, SAI SÓT & RỦI RO TIỀM ẨN (FAILURE MODES & RISKS)
${analysis.failureModesAndRisks.map((r, i) => `${i + 1}. ⚠️ **${r}**`).join('\n\n')}

---

## 4. HÀNH ĐỘNG SỐNG CÒN CẦN LÀM NGAY (STRATEGIC IMPERATIVES)
${analysis.strategicImperatives.map((a, i) => `${i + 1}. ⚡ **${a}**`).join('\n\n')}

---

## 5. CÁC YẾU TỐ CẦN BỔ SUNG & ĐỐI TƯỢNG MỤC TIÊU
${analysis.missingElements && analysis.missingElements.length > 0 ? `### Khía cạnh cần hoàn thiện thêm:\n${analysis.missingElements.map(e => `- ${e}`).join('\n')}\n` : ''}
${analysis.targetPersonas && analysis.targetPersonas.length > 0 ? `### Chân dung đối tượng thụ hưởng:\n${analysis.targetPersonas.map(p => `- ${p}`).join('\n')}\n` : ''}
`;

  const masterDossier: Dossier = {
    id: `dossier-master-${projectSlug}-${Date.now()}`,
    pillarId: 'pillar-master',
    pillarTitle: 'Báo Cáo Thẩm Định Chiến Lược Tổng Thể',
    chapterNumber: 1,
    title: `[Đề Án] ${analysis.projectTitle}: Thẩm Định Chiến Lược & Tổng Quan Thực Thi`,
    subtitle: `${analysis.projectSubtitle || 'Khung chiến lược hành động đa chiều'} • Độ khả thi ${analysis.feasibilityScore}%`,
    topic: analysis.projectTitle,
    discipline: baseDiscipline,
    interdisciplinaryFields: [baseDiscipline, 'Thẩm Định Dự Án', 'Quản Trị Chiến Lược', 'Kinh Tế'].filter(Boolean),
    tags: ['project-master', 'action-plan', 'strategic-governance', `project-${projectSlug}`],
    abstract: analysis.executiveDiagnosis || 'Báo cáo thẩm định toàn diện mức độ khả thi, bản đồ rủi ro và các trụ cột chiến lược.',
    contentMarkdown: masterMarkdown,
    keyFindings: analysis.strategicImperatives || [],
    philosophicalBasis: [],
    technicalMappings: [],
    citations: [],
    autoCapturedTerms: analysis.extractedTerms || [],
    lastModified: now,
    status: 'draft',
    isDynamicProject: true,
    projectStructure: masterPillars,
    mode: 'deep'
  };

  // 2. SCENARIO DOSSIERS (6 SCENARIOS)
  const scenarioDossiers: Dossier[] = (analysis.scenarios || []).map((scenario, index) => {
    const pillars = buildScenarioDynamicPillars(scenario.key, analysis.projectTitle, scenario.title);
    const scenarioPrefix = (() => {
      switch (scenario.key) {
        case 'sop_workflows': return '[Quy Trình]';
        case 'executive_report': return '[Chiến Lược]';
        case 'internal_team_comm': return '[Nội Bộ]';
        case 'public_community_comm': return '[Đại Chúng]';
        case 'market_research': return '[Thị Trường]';
        case 'consumer_psychology': return '[Tâm Lý]';
        default: return '[Kịch Bản]';
      }
    })();

    let scenarioContent = `${scenario.contentMarkdown}\n\n`;

    if (scenario.actionItems && scenario.actionItems.length > 0) {
      scenarioContent += `---\n\n## DANH MỤC HÀNH ĐỘNG TIÊN QUYẾT (ACTION CHECKLIST)\n`;
      scenarioContent += scenario.actionItems.map((act, i) => `- [ ] **Khâu ${i + 1}:** ${act}`).join('\n');
      scenarioContent += `\n\n`;
    }

    scenarioContent += `---\n\n## ĐỐI TƯỢNG HƯỚNG ĐẾN & NGUYÊN TẮC ÁP DỤNG\n`;
    scenarioContent += `- **Đối tượng mục tiêu:** ${scenario.targetAudience}\n`;
    scenarioContent += `- **Đề án trực thuộc:** ${analysis.projectTitle} (${analysis.projectDomain})\n`;
    scenarioContent += `- **Chỉ số khả thi đề án:** ${analysis.feasibilityScore}/100\n`;

    const specificTags = (() => {
      switch (scenario.key) {
        case 'sop_workflows': return ['sop-workflows', 'operations', 'execution-roadmap', 'action-checklist'];
        case 'executive_report': return ['executive-board', 'financial-model', 'okr-kpi', 'governance'];
        case 'internal_team_comm': return ['internal-team', 'team-alignment', 'culture-playbook', 'change-management'];
        case 'public_community_comm': return ['public-community', 'storytelling', 'social-impact', 'media-campaign'];
        case 'market_research': return ['market-research', 'competitive-matrix', 'usp-positioning', 'industry-analysis'];
        case 'consumer_psychology': return ['consumer-psychology', 'empathy-map', 'sales-playbook', 'customer-retention'];
        default: return ['action-scenario'];
      }
    })();

    return {
      id: `dossier-scenario-${scenario.key}-${projectSlug}-${Date.now()}-${index}`,
      pillarId: `pillar-${scenario.key}`,
      pillarTitle: scenario.title,
      chapterNumber: index + 2,
      title: `${scenarioPrefix} ${analysis.projectTitle}: ${scenario.title}`,
      subtitle: `${scenario.shortDesc} • Hướng đến: ${scenario.targetAudience}`,
      topic: `${analysis.projectTitle} - ${scenario.title}`,
      discipline: baseDiscipline,
      interdisciplinaryFields: [baseDiscipline, scenario.title, 'Thực Chiến', 'Hành Động'].filter(Boolean),
      tags: [...specificTags, `project-${projectSlug}`, 'scenario-dossier'],
      abstract: `${scenario.shortDesc} Được tối ưu hóa cho đối tượng ${scenario.targetAudience} nhằm hiện thực hóa đề án vào thực tiễn.`,
      contentMarkdown: scenarioContent,
      keyFindings: scenario.actionItems || [],
      philosophicalBasis: [],
      technicalMappings: [],
      citations: [],
      autoCapturedTerms: analysis.extractedTerms || [],
      lastModified: now,
      status: 'draft',
      isDynamicProject: true,
      projectStructure: pillars,
      mode: 'deep'
    };
  });

  return {
    masterDossier,
    scenarioDossiers,
    allDossiers: [masterDossier, ...scenarioDossiers]
  };
}
