import { Dossier } from '../types';
import {
  VideoProductionProject,
  VideoScene,
  AudioPodcastProject,
  PodcastDialogueTurn,
  InfographicProject,
  SlideDeckProject,
  SlideItem
} from '../types/multimedia';

/**
 * Generates initial fallback or template Video Project from Dossier content
 */
export function generateVideoProjectFallback(dossier: Dossier): VideoProductionProject {
  const scenes: VideoScene[] = [
    {
      sceneNumber: 1,
      durationSeconds: 8,
      sceneTitle: 'Phần 1: Khởi Nguyên & Tầm Nhìn Đề Án',
      visualPrompt: `Cinematic aerial shot, architectural concept rendering of ${dossier.title}, modern Vietnamese rustic wabi-sabi garden, morning sunlight filtering through mist, 8k photorealistic.`,
      visualType: 'concept_architecture',
      voiceoverText: `Chào mừng bạn đến với chuyên đề: "${dossier.title}". Hôm nay, chúng ta cùng giải mã cấu trúc chuyển hóa tri thức và bài toán thực tiễn nhân sinh.`,
      onScreenText: `${dossier.title.toUpperCase()}\nBẢN THỂ & KHỞI NGUYÊN BỐI CẢNH`,
      transition: 'fade',
      cameraAngle: 'Aerial Drone Slow Push-In',
      musicMood: 'Ambient Zen & Soft Strings'
    },
    {
      sceneNumber: 2,
      durationSeconds: 12,
      sceneTitle: 'Phần 2: Cơ Chế Vận Hành & Động Lực Học',
      visualPrompt: `High tech dynamic infographic overlay with nodes and connections, flows of resource and energy, minimalist clean aesthetic, dark slate and emerald tones.`,
      visualType: 'flow_diagram',
      voiceoverText: `Mọi hệ thống bền vững đều vận hành dựa trên những quy luật cơ học nội tại. Khi các dòng chảy thông tin và tài nguyên được liên kết chặt chẽ, hiệu suất được tối ưu hóa.`,
      onScreenText: `CƠ CHẾ VẬN HÀNH NỘI TẠI\n[Dữ Liệu] ➔ [Xử Lý Lõi] ➔ [Giá Trị Thực]`,
      transition: 'slide_left',
      cameraAngle: 'Frontal Medium Shot with Smooth Pan',
      musicMood: 'Modern Tech Acoustic'
    },
    {
      sceneNumber: 3,
      durationSeconds: 15,
      sceneTitle: 'Phần 3: Bản Vẽ Kiến Trúc Thực Thi',
      visualPrompt: `Close-up architectural blueprint drawing with natural wooden textures, laterite stone, natural breeze airflow arrows, sustainable eco-friendly construction.`,
      visualType: 'concept_architecture',
      voiceoverText: `Kiến trúc thực thi không chỉ nằm trên giấy tờ mà chuyển hóa thành từng phân kỳ cụ thể: Từ hạ tầng nền tảng, cơ chế kiểm soát rủi ro đến bước nghiệm thu thực tế.`,
      onScreenText: `KIẾN TRÚC THỰC THI 3 PHÂN KỲ\nGiai đoạn 1: Nền tảng • Giai đoạn 2: Tăng tốc • Giai đoạn 3: Bền vững`,
      transition: 'cross_dissolve',
      cameraAngle: 'Slow Macro Pan over Blueprint & Textures',
      musicMood: 'Inspiring Ambient Momentum'
    },
    {
      sceneNumber: 4,
      durationSeconds: 12,
      sceneTitle: 'Phần 4: Tâm Điểm Cân Bằng & Hành Động Ngay',
      visualPrompt: `A serene center pillar (Shinbashira philosophy), balanced stone and wood courtyard in Vietnam, peaceful open garden with lush green foliage.`,
      visualType: 'typography_impact',
      voiceoverText: `Giữa vạn biến của thị trường, một điểm tựa đạo đức và kỷ luật nội tại sẽ giúp đề án trường tồn. Hãy cùng bắt tay vào hành động ngay hôm nay!`,
      onScreenText: `KẾT LUẬN & HÀNH ĐỘNG NGAY\n"Chuyển Hóa Tri Thức Thành Giá Trị Thực"`,
      transition: 'zoom_in',
      cameraAngle: 'Centered Symmetry Wide Shot',
      musicMood: 'Uplifting Warm Crescendo'
    }
  ];

  return {
    id: `vid-${dossier.id}-${Date.now()}`,
    title: `Video Thuyết Minh: ${dossier.title}`,
    subtitle: dossier.subtitle || 'Chuyển hóa tri thức đề án thành video phân cảnh trực quan',
    targetAspect: '16:9',
    targetStyle: 'architectural_showcase',
    estimatedDurationSeconds: 47,
    voiceoverGender: 'male_deep',
    backgroundMusicStyle: 'ambient_zen',
    scenes,
    executiveHook: `Khám phá toàn bộ luận điểm và kiến trúc thực thi của "${dossier.title}" trong 1 phút súc tích.`,
    callToAction: 'Bắt tay vào triển khai các hành động tiên quyết và tải về tài liệu đề án chi tiết.',
    createdAt: new Date().toISOString()
  };
}

/**
 * Generates initial fallback or template Audio Podcast (Gemini NotebookLM style) from Dossier
 */
export function generateAudioPodcastFallback(dossier: Dossier): AudioPodcastProject {
  const turns: PodcastDialogueTurn[] = [
    {
      id: 'turn-1',
      speaker: 'host_a',
      speakerName: 'Minh Triết',
      speakerRole: 'expert_analyst',
      avatarColor: 'bg-indigo-600',
      text: `Chào bạn, hôm nay chúng ta sẽ cùng mở hồ sơ nghiên cứu "${dossier.title}". Đây là một công trình rất thú vị khi kết hợp giữa tư tưởng triết học với kỹ nghệ thực thi thực chiến.`,
      durationSecondsEstimate: 9,
      topicTag: 'Giới thiệu đề án'
    },
    {
      id: 'turn-2',
      speaker: 'host_b',
      speakerName: 'Hải An',
      speakerRole: 'curious_questioner',
      avatarColor: 'bg-emerald-600',
      text: `Đúng vậy Minh Triết! Điều làm tôi ấn tượng nhất là cách đề án này không hề lý thuyết suông, mà ngay từ Trụ cột I và II đã trả lời câu hỏi: Người làm thực tế có thể áp dụng điều này vào vận hành ra sao?`,
      durationSecondsEstimate: 11,
      topicTag: 'Bản chất thực chiến'
    },
    {
      id: 'turn-3',
      speaker: 'host_a',
      speakerName: 'Minh Triết',
      speakerRole: 'expert_analyst',
      avatarColor: 'bg-indigo-600',
      text: `Chính xác. Hãy nhìn vào cơ chế động lực học: Toàn bộ quy trình được phân rã như một mạng lưới Multi-Agent hoặc hệ sinh thái tuần hoàn, trong đó mọi mắt xích đều có điểm tựa cân bằng Shinbashira.`,
      durationSecondsEstimate: 12,
      topicTag: 'Cơ chế vận hành'
    },
    {
      id: 'turn-4',
      speaker: 'host_b',
      speakerName: 'Hải An',
      speakerRole: 'curious_questioner',
      avatarColor: 'bg-emerald-600',
      text: `Và còn cả yếu tố vật liệu, không gian xanh bản địa nhiệt đới nữa! Việc kết nối thiên nhiên với công nghệ giúp giải phóng áp lực và tối ưu hóa năng lượng vi khí hậu một cách tự nhiên.`,
      durationSecondsEstimate: 10,
      topicTag: 'Sinh thái & Không gian'
    },
    {
      id: 'turn-5',
      speaker: 'host_a',
      speakerName: 'Minh Triết',
      speakerRole: 'expert_analyst',
      avatarColor: 'bg-indigo-600',
      text: `Tóm lại, thông điệp cốt lõi là: Hãy bắt đầu từ một ý niệm nguyên bản rõ ràng, xây dựng cơ chế tự cân bằng và kiên định với những hành động thực tế ngay hôm nay.`,
      durationSecondsEstimate: 9,
      topicTag: 'Đúc kết & Hành động'
    }
  ];

  return {
    id: `pod-${dossier.id}-${Date.now()}`,
    title: `Audio Deep Dive: ${dossier.title}`,
    subtitle: 'Đối thoại học thuật chuyển hóa tri thức phong cách Google NotebookLM',
    formatStyle: 'notebook_deep_dive',
    hostAName: 'Minh Triết (Chuyên Gia)',
    hostBName: 'Hải An (Nhà Phân Tích)',
    dialogueTurns: turns,
    totalEstimatedMinutes: 1,
    summaryTakeaway: `Hồ sơ "${dossier.title}" đúc kết giải pháp chuyển hóa tri thức và thực thi bền vững.`,
    recommendedPromptNotebookLM: `Dựa trên toàn bộ tài liệu nguồn đính kèm, hãy tạo một bản thảo luận Podcast 2 người (Deep Dive Audio) theo ngôn ngữ đời thường, phân tích sâu về 6 trụ cột của "${dossier.title}".`,
    createdAt: new Date().toISOString()
  };
}

/**
 * Generates initial fallback or template Infographic Project from Dossier
 */
export function generateInfographicFallback(dossier: Dossier): InfographicProject {
  return {
    id: `info-${dossier.id}-${Date.now()}`,
    title: `Infographic Tri Thức: ${dossier.title}`,
    subtitle: 'Bản đồ trực quan hóa số liệu, kiến trúc 6 trụ cột và luồng hành động',
    layoutTheme: 'emerald_zen',
    coreProblem: 'Làm thế nào để chuyển hóa tri thức phức tạp thành hành động thực tiễn có giá trị cao?',
    breakthroughSolution: 'Ứng dụng khung 6 Trụ Cột Động kết hợp vật liệu bền vững và cơ chế tự cân bằng.',
    metrics: [
      { id: 'm1', value: '100%', label: 'Thực Chiến', subtext: 'Loại bỏ lý thuyết rườm rà', trend: 'up', color: 'emerald' },
      { id: 'm2', value: '6 Trụ Cột', label: 'Cân Bằng Động', subtext: 'Bao quát toàn diện đề án', trend: 'neutral', color: 'purple' },
      { id: 'm3', value: '3 Giai Đoạn', label: 'Lộ Trình Phân Kỳ', subtext: 'Nghiệm thu rõ ràng', trend: 'up', color: 'amber' },
      { id: 'm4', value: '0-Trust', label: 'Kỷ Luật Vận Hành', subtext: 'An toàn & Liêm chính', trend: 'up', color: 'cyan' }
    ],
    pillarBlocks: [
      {
        pillarNum: 'I',
        title: 'Bản Thể Luận & Ý Niệm',
        coreInsight: 'Xác định bài toán cốt lõi và định vị giá trị nguyên bản',
        takeaway: 'Khởi đầu từ giá trị thực',
        tag: 'Bản Thể'
      },
      {
        pillarNum: 'II',
        title: 'Cơ Chế & Động Lực Học',
        coreInsight: 'Quy luật dòng tiền, dữ liệu và tương tác các bộ phận',
        takeaway: 'Vận hành tự thông suốt',
        tag: 'Vận Hành'
      },
      {
        pillarNum: 'III',
        title: 'Kiến Trúc & Phân Kỳ',
        coreInsight: 'Bản vẽ thi công, chuẩn kỹ thuật và mốc bàn giao',
        takeaway: 'Lộ trình minh bạch',
        tag: 'Kiến Trúc'
      },
      {
        pillarNum: 'IV',
        title: 'Biện Chứng & Phòng Rủi Ro',
        coreInsight: 'Nhận diện điểm nghẽn và phương án phòng vệ sự cố',
        takeaway: 'Chủ động trước rủi ro',
        tag: 'Phòng Vệ'
      },
      {
        pillarNum: 'V',
        title: 'Điểm Tựa Cân Bằng (Shinbashira)',
        coreInsight: 'Khoảng lặng đạo đức và sức bền tinh thần nội bộ',
        takeaway: 'Bền bỉ giữa biến động',
        tag: 'Tĩnh Tâm'
      },
      {
        pillarNum: 'VI',
        title: 'Sinh Thái Xanh & Đất Trời',
        coreInsight: 'Giao hòa thiên nhiên, bảo tồn sinh thái và trường tồn',
        takeaway: 'Giá trị cộng đồng dài hạn',
        tag: 'Trường Tồn'
      }
    ],
    asciiPipeline: '[Ý Niệm Nguyên Bản] --(Khảo sát bối cảnh)--> [Xây Dựng Cơ Chế] --(Thi công phân kỳ)--> [Kiến Trúc Thực Thi] --(Kiểm thử rủi ro)--> [Giá Trị Bền Vững]',
    keyActionSteps: [
      'Xác định rõ ràng mục tiêu tiên quyết của giai đoạn 1',
      'Thành lập đội ngũ nòng cốt và phân định trách nhiệm RACI',
      'Định kỳ kiểm tra các chỉ số sức khỏe và mức độ hài hòa sinh thái'
    ],
    calloutQuote: {
      quote: 'Mọi công trình vĩ đại đều bắt đầu từ một ý niệm trong sáng và được dựng xây bằng kỷ luật bền bỉ.',
      author: 'Oneness Governance Framework'
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Generates initial fallback or template SlideDeck Project from Dossier
 */
export function generateSlideDeckFallback(dossier: Dossier): SlideDeckProject {
  const slides: SlideItem[] = [
    {
      slideNumber: 1,
      slideType: 'cover',
      title: dossier.title,
      subtitle: dossier.subtitle || 'Báo Cáo Thuyết Trình Chuyển Hóa Tri Thức & Kế Hoạch Hành Động',
      bullets: [
        `Chủ đề: ${dossier.discipline || 'Học thuật Liên ngành & Thực chiến'}`,
        `Thời gian: ${new Date().toLocaleDateString('vi-VN')}`,
        'Khung tham chiếu: 6 Trụ Cột Động Oneness Governance'
      ],
      speakerNotes: 'Mở đầu buổi thuyết trình bằng việc nhấn mạnh sứ mệnh chuyển hóa tri thức thành hành động thực tế.',
      recommendedVisual: 'Logo Oneness Governance và phối cảnh kiến trúc sinh thái toàn cảnh'
    },
    {
      slideNumber: 2,
      slideType: 'problem_statement',
      title: 'Bài Toán Sống Còn & Bối Cảnh Thực Tế',
      subtitle: 'Tại sao chúng ta cần đề án này ngay lúc này?',
      bullets: [
        'Tri thức hàn lâm phong phú nhưng thường bị cô lập trong tháp ngà lý thuyết.',
        'Các đề án thực tế thường thiếu điểm tựa cân bằng văn hóa và quản trị rủi ro.',
        'Cần một mô hình tích hợp giữa khoa học hệ thống, sinh thái xanh và hiệu quả kinh tế.'
      ],
      highlightMetric: {
        value: '85%',
        label: 'Dự án gặp điểm nghẽn do thiếu kiến trúc vận hành mạch lạc'
      },
      speakerNotes: 'Nêu bật nỗi đau của thị trường và lý do cấp bách cần giải pháp.',
      recommendedVisual: 'Sơ đồ so sánh giữa cách làm truyền thống và mô hình chuyển hóa mới'
    },
    {
      slideNumber: 3,
      slideType: 'architecture_pillar',
      title: 'Khung 6 Trụ Cột Động: Kiến Trúc Toàn Diện',
      subtitle: 'Cấu trúc chịu lực và phát triển bền vững',
      bullets: [
        'Trụ cột I & II: Khởi sinh ý niệm và thiết lập cơ chế vận động nội tại.',
        'Trụ cột III & IV: Bản vẽ thi công chi tiết và kịch bản phòng vệ rủi ro.',
        'Trụ cột V & VI: Điểm tựa đạo đức tĩnh tại và giao hòa sinh thái trường tồn.'
      ],
      asciiDiagram: '[Trụ I: Bản Thể] <-> [Trụ II: Cơ Chế] <-> [Trụ III: Kiến Trúc]\n      ^                      ^                      ^\n[Trụ IV: Biện Chứng] <-> [Trụ V: Tĩnh Tâm] <-> [Trụ VI: Đất Trời]',
      speakerNotes: 'Giải thích nguyên lý Shinbashira: Trụ giữa giữ thăng bằng cho toàn bộ kết cấu.',
      recommendedVisual: 'Mô hình 3D phối cảnh kiến trúc với tâm điểm giếng trời thông thoáng'
    },
    {
      slideNumber: 4,
      slideType: 'mechanism_flow',
      title: 'Quy Trình Triển Khai & Dòng Chảy Giá Trị',
      subtitle: 'Từ dữ liệu đầu vào đến sản phẩm nghiệm thu',
      bullets: [
        'Bước 1: Tiếp nhận và chuẩn hóa dữ liệu theo chuẩn liên ngành.',
        'Bước 2: Phân tích động lực học và mô phỏng phản biện đa chiều.',
        'Bước 3: Xuất bản báo cáo thực chiến, video storyboard và kịch bản podcast.'
      ],
      asciiDiagram: '[Đầu Vào] --(Sàng Lọc)--> [Động Lực Học AI] --(Tối Ưu)--> [Bản Xuất Bản Thực Chiến]',
      speakerNotes: 'Nhấn mạnh tính tự động hóa và khả năng tái sử dụng tài nguyên.',
      recommendedVisual: 'Sơ đồ luồng phẳng ASCII kết hợp giao diện làm việc trực quan'
    },
    {
      slideNumber: 5,
      slideType: 'action_plan',
      title: 'Lộ Trình Phân Kỳ 3 Giai Đoạn',
      subtitle: 'Hành động cụ thể và mốc nghiệm thu',
      bullets: [
        'Giai Đoạn 1 (Tháng 1-2): Khảo sát thực địa, xác lập khuôn khổ và chốt bộ chỉ số.',
        'Giai Đoạn 2 (Tháng 3-6): Triển khai mô hình điểm và tối ưu hóa quy trình.',
        'Giai Đoạn 3 (Tháng 7+): Mở rộng quy mô và tích hợp hệ sinh thái cộng đồng.'
      ],
      highlightMetric: {
        value: '3 MỐC',
        label: 'Nghiệm thu độc lập đảm bảo đúng tiến độ'
      },
      speakerNotes: 'Cam kết về tiến độ và phân công trách nhiệm rõ ràng.',
      recommendedVisual: 'Biểu đồ Gantt phân kỳ với các mốc Milestone vàng'
    },
    {
      slideNumber: 6,
      slideType: 'summary_conclusion',
      title: 'Đúc Kết & Kêu Gọi Hành Động',
      subtitle: 'Chuyển hóa tri thức - Kiến tạo giá trị thực',
      bullets: [
        'Đề án sẵn sàng triển khai với đầy đủ tài liệu, bản vẽ và kịch bản.',
        'Đề xuất phê duyệt hạn mức triển khai cho Giai đoạn 1.',
        'Mời các chuyên gia và đối tác cùng tham gia đồng hành.'
      ],
      speakerNotes: 'Kết thúc bài thuyết trình bằng thông điệp truyền cảm hứng và mở rộng phần hỏi đáp Q&A.',
      recommendedVisual: 'Thông điệp tri ân, thông tin liên hệ và mã QR tài liệu đầy đủ'
    }
  ];

  return {
    id: `slide-${dossier.id}-${Date.now()}`,
    title: `Slidedeck Báo Cáo: ${dossier.title}`,
    subtitle: 'Bộ slide thuyết trình đa năng dành cho Ban Giám Đốc và Hội đồng',
    targetAudience: 'investors_board',
    slides,
    themeColor: 'purple',
    createdAt: new Date().toISOString()
  };
}
