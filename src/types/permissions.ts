export type UserRole = 'guest' | 'viewer' | 'author' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt?: string;
  lastLoginAt?: string;
  bio?: string;
  affiliation?: string;
}

export type AtomicPermission =
  | 'compose_article'
  | 'ai_research'
  | 'create_dossier'
  | 'manage_dossier'
  | 'system_settings';

export interface AtomicPermissionMeta {
  id: AtomicPermission;
  name: string;
  category: string;
  shortDesc: string;
  reason: string;
  iconType: 'edit' | 'sparkles' | 'folder' | 'shield' | 'settings';
}

export const ADMIN_EMAILS = [
  'quechoa.everywhere@gmail.com'
];

export const AUTHOR_ACTIVATION_PASSCODES = [
  'OG-AUTHOR-2026',
  'ONENESS-LAB-KEY',
  'RESEARCHER-VIP'
];

export const ROLE_PERMISSIONS: Record<UserRole, AtomicPermission[]> = {
  guest: [], // Pure read-only
  viewer: [], // Read-only for authenticated general readers (cannot create records on system)
  author: ['compose_article', 'ai_research', 'create_dossier', 'manage_dossier'],
  admin: ['compose_article', 'ai_research', 'create_dossier', 'manage_dossier', 'system_settings']
};

export const ATOMIC_PERMISSIONS_CONFIG: Record<AtomicPermission, AtomicPermissionMeta> = {
  compose_article: {
    id: 'compose_article',
    name: 'Soạn Bài Viết & Chỉnh Sửa Nội Dung',
    category: 'Biên Tập & Soạn Thảo',
    shortDesc: 'Biên tập trực tiếp các tiểu mục, thẻ nguyên tử và lưu bản thảo bài viết lên hệ thống.',
    reason: 'Tài khoản người dùng mới mặc định có quyền Độc Giả (Chỉ Xem). Yêu cầu quyền Tác Giả (Author) hoặc Quản Trị Viên để bảo vệ tính toàn vẹn của dữ liệu học thuật.',
    iconType: 'edit'
  },
  ai_research: {
    id: 'ai_research',
    name: 'Nghiên Cứu Sâu AI & Tạo Đề Cương',
    category: 'Trí Tuệ Nhân Tạo & Nghiên Cứu',
    shortDesc: 'Sử dụng Gemini AI để nghiên cứu 4 cấp độ, sinh đề cương 6 trụ cột và tổng hợp bài viết mới.',
    reason: 'Yêu cầu quyền Tác Giả để khởi chạy tác vụ tính toán AI và lưu trữ hồ sơ tri thức mới lên hệ thống đám mây.',
    iconType: 'sparkles'
  },
  create_dossier: {
    id: 'create_dossier',
    name: 'Khởi Tạo Hồ Sơ Nghiên Cứu Mới',
    category: 'Quản Trị Không Gian Học Thuật',
    shortDesc: 'Tạo công trình nghiên cứu mới theo ma trận 6 Trụ Cột Động và lưu bản ghi lên hệ thống.',
    reason: 'Quyền tạo bản ghi hồ sơ mới chỉ dành cho Tác Giả hoặc Quản Trị Viên được xác thực.',
    iconType: 'folder'
  },
  manage_dossier: {
    id: 'manage_dossier',
    name: 'Quản Trị, Đổi Tên & Xóa Hồ Sơ',
    category: 'Quản Trị Dữ Liệu',
    shortDesc: 'Đổi tên công trình, xóa hồ sơ nghiên cứu hoặc tái thiết lập dữ liệu lưu trữ.',
    reason: 'Hành động thay đổi vĩnh viễn cấu trúc dữ liệu hệ thống, yêu cầu quyền Tác Giả/Quản Trị Viên.',
    iconType: 'shield'
  },
  system_settings: {
    id: 'system_settings',
    name: 'Cấu Hình Tham Số Mô Hình AI',
    category: 'Cấu Hình Hệ Thống',
    shortDesc: 'Thay đổi mô hình mặc định, điều chỉnh Temperature, TopP và System Instructions.',
    reason: 'Yêu cầu quyền Quản Trị Viên hoặc Tác Giả để lưu cấu hình mô hình an toàn.',
    iconType: 'settings'
  }
};

