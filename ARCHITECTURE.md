# KIẾN TRÚC HỆ THỐNG ONENESS GOVERNANCE (ARCHITECTURE.MD)

Tài liệu mô tả chi tiết kiến trúc kỹ thuật, luồng dữ liệu (Data Flow), hạ tầng AI và cơ chế phân quyền bảo mật Zero-Trust của ứng dụng **Oneness Governance**.

---

## 1. Sơ Đồ Tổng Quan Kiến Trúc (High-Level Topology)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER (React 18 + Vite)                │
│                                                                         │
│  ┌───────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │   AuthContext     │  │  PermissionContext  │  │   Presentation    │  │
│  │ (Firebase Auth)   │  │ (Zero-Trust Matrix) │  │  (Zen Presentation│  │
│  └─────────┬─────────┘  └──────────┬──────────┘  └───────────────────┘  │
│            │                       │                                    │
│  ┌─────────▼───────────────────────▼─────────────────────────────────┐  │
│  │              Publisher Studio & Matrix 6 Trụ Cột                  │  │
│  │  (Biên Soạn • Sổ Từ Điển • Sổ Trích Dẫn • NotebookLM Prompt Lab)  │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ (REST APIs / Firebase SDK)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE & BACKEND SERVICES                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js Server (Port 3000)                 │   │
│  │  • /api/gemini/research      - Gọi Gemini AI đa tầng             │   │
│  │  • /api/dossiers             - CRUD bộ nhớ đệm hồ sơ khảo luận   │   │
│  │  • /api/dossiers/batch-sync  - Đồng bộ hàng loạt hồ sơ           │   │
│  │  • /api/extract-url          - Crawler & trích xuất tri thức     │   │
│  └─────────┬────────────────────────────────────────────────────────┘   │
└────────────┼────────────────────────────────────────────────────────────┘
             │
             ├────────────────────────────────────────┬───────────────────┐
             ▼                                        ▼                   ▼
┌────────────────────────┐               ┌──────────────────────┐  ┌─────────────┐
│  Google GenAI (Gemini) │               │  Firebase Firestore  │  │ Google Drive│
│  • Gemini 3.7 Flash    │               │  • users             │  │ 1-Way Sync  │
│  • Search Grounding    │               │  • dossiers          │  │ (Docs/Sheets│
│  • Token Tracker       │               │  • settings/security │  │  Markdown)  │
│  • 4-Tier Reasoning    │               │  • systemLogs        │  │             │
└────────────────────────┘               └──────────────────────┘  └─────────────┘
```

---

## 2. Luồng Dữ Liệu & Phân Tầng AI (AI Research Pipeline)

### Chu trình 4 bước chuyển hóa tri thức:
1. **User Intent Input**: Người dùng nhập chủ đề nghiên cứu (ví dụ: *"Cơ chế đồng thuận trong hệ thống phân tán"*).
2. **Backend Synthesis (`/api/gemini/research`)**:
   - Máy chủ nạp chỉ thị cốt lõi từ `AGENTS.md` và `GeminiSettings`.
   - Kích hoạt **Google Search Grounding** để lấy dữ liệu nghiên cứu mới nhất từ arXiv, IEEE và whitepapers.
   - Vận dụng **4 Cấp Độ Phân Tầng Học Thuật** nội tại:
     1. *Cấp độ 1: Bản thể luận & Tiên đề*.
     2. *Cấp độ 2: Động lực học cơ chế*.
     3. *Cấp độ 3: Kiến trúc & Ánh xạ CS*.
     4. *Cấp độ 4: Biện chứng & Failure Modes*.
3. **Knowledge Transforming Output**:
   - Chuyển ngữ toàn bộ nội dung sang ngôn ngữ thực chiến, tự nhiên theo 6 Trụ Cột Động.
   - Tự động bóc tách các thuật ngữ chuyên sâu vào mảng `extractedTerms`.
   - Trích xuất các nguồn tham khảo vào mảng `extractedCitations`.
4. **Client State & Persistence**:
   - Ghi nhận vào state `dossiers`.
   - Đồng bộ lên `localStorage`, `data_store/dossiers.json` qua Express server, và `Firestore` (nếu đã đăng nhập).

---

## 3. Kiến Trúc Phân Quyền Zero-Trust (Security Matrix)

### A. Ma Trận Vai Trò (Role Hierarchy)
```
  [Admin (quechoa.everywhere@gmail.com)] ── Toàn quyền cấu hình & phân quyền
       ▲
       │ (Nhập Passcode Ủy Quyền: OG-AUTHOR-2026 / ONENESS-MASTER)
  [Author] ── Quyền biên soạn, chạy AI nghiên cứu, tạo bài viết mới
       ▲
       │ (Đăng nhập Google Sign-In)
  [Viewer] ── Chế độ độc giả an toàn, bảo vệ dữ liệu chống ghi đè
       ▲
       │
  [Guest]  ── Truy cập vãng lai (Chỉ xem và tra cứu từ điển)
```

### B. Quyền Hạn Nguyên Tử (Atomic Permissions)
| Permission Key | Tên Quyền | Guest | Viewer | Author | Admin |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `compose_article` | Biên soạn & Sửa bài viết | ❌ | ❌ | ✅ | ✅ |
| `ai_research` | Chạy AI Nghiên cứu Gemini | ❌ | ❌ | ✅ | ✅ |
| `create_dossier` | Khởi tạo hồ sơ khảo luận | ❌ | ❌ | ✅ | ✅ |
| `manage_dossier` | Xóa & Khôi phục hồ sơ | ❌ | ❌ | ✅ | ✅ |
| `system_settings` | Cấu hình tham số AI & Khóa | ❌ | ❌ | ❌ | ✅ |

### C. Cơ Chế Khóa Kép (Dual Locking)
- **Shinbashira Session Guard**: Lưu trạng thái khóa trong `sessionStorage` để bảo vệ màn hình khi mở tab mới.
- **Global Content Edit Lock**: Lưu trạng thái trong Firestore `settings/global` và `localStorage`, vô hiệu hóa toàn bộ các nút chỉnh sửa trên UI khi được kích hoạt bởi Owner.

---

## 4. Mô Hình Lưu Trữ Dữ Liệu (Data Schema)

### Firestore Collections:
- **`users/{uid}`**: Lưu hồ sơ học giả (`email`, `displayName`, `affiliation`, `bio`, `role`, `lastLoginAt`).
- **`dossiers/{id}`**: Lưu hồ sơ khảo luận học thuật (`title`, `summary`, `pillars`, `extractedTerms`, `isPublic`, `ownerId`).
- **`settings/global`**: Lưu trạng thái khóa biên tập (`isContentEditLocked`, `updatedBy`, `updatedAt`).
- **`systemLogs/{id}`**: Nhật ký vận hành và thống kê tiêu thụ token AI (`action`, `tokenCount`, `userId`, `timestamp`).

---

## 5. Chiến Lược Dự Phòng & Khôi Phục (Backup & Disaster Recovery)

1. **Local State First**: Ứng dụng luôn duy trì trạng thái mượt mà trên trình duyệt qua `localStorage` và `React Context`.
2. **Server-Side Fallback Cache**: Tự động ghi bản sao đệm xuống `data_store/dossiers.json` trên Express server.
3. **Firestore Cloud Sync**: Tự động hòa giải (reconciliation) dữ liệu đám mây khi người dùng đăng nhập.
4. **1-Click Full JSON Export/Import**: Cho phép người dùng kết xuất và khôi phục toàn bộ hệ thống (Hồ sơ, Từ điển, Trích dẫn, Cài đặt) ra file `.json` độc lập.
