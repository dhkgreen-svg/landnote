# 📊 Anti-Gravity 통합 시스템 상태 보고서 (SYSTEM_STATE.md)

> **총괄 마스터**: 김대희 대표님  
> **기준 타임스탬프**: 2026-10-04 14:40:39  
> **현재 Git 브랜치**: `google_drive_docs_search`  
> **최신 커밋**: ``  

---

## 1. 프로젝트별 실서버 운영 현황

| 프로젝트명 | 정식 서비스 명칭 | 로컬 포트 | 공식 프로덕션 도메인 | 운영 상태 |
| :--- | :--- | :---: | :--- | :---: |
| **paki** | **파크골프 올인원 (ParkGolf All-in-One)** | `3008` | [https://www.parkgolfallinone.com](https://www.parkgolfallinone.com) | 🟢 **Live (정상 가동)** |
| **landnote** | **랜드노트 (LandNote CRM)** | `3000` | [https://landnote-web.vercel.app](https://landnote-web.vercel.app) | 🟢 **Live (정상 가동)** |
| **landnote-api** | 랜드노트 백엔드 API | `4000` | [https://api.landnote.kr](https://api.landnote.kr) | 🟢 **Live (정상 가동)** |
| **marketing** | 마케팅 총괄 관제센터 | `4005` | `http://localhost:4005` | 🟢 **Active** |

---

## 2. 파크골프 올인원 핵심 마일스톤 달성 현황

- [x] **Phase 1: 카카오톡 인앱 브라우저 1초 자동 탈출 엔진** (안드로이드 크롬 인텐트 + iOS 사파리 스킴 + 원터치 골드 배너) ➔ **실서버 배포 완료 (`ccce299`)**
- [x] **Phase 2: 시니어 맞춤 1-Touch PWA 홈 화면 설치 UX** (원클릭 시스템 설치 다이얼로그 + 3D 파키 2스텝 가이드 모달) ➔ **실서버 배포 완료 (`ccce299`)**
- [x] **Phase 3: 필드 경기 진행 & 방안 A 4대 탭** (코스별 9H / 통합 18~36H / 현장 갤러리 / 4K 챔피언 완주증) ➔ **구현 완료**
- [x] **Phase 4: 한/일/영 3개국어 다국어 & 1,500+ 구장 DB** (한국 400여 개 + 일본 1,126개 NPGA 공식 구장) ➔ **탑재 완료**
- [ ] **Phase 5: 랜드노트 CRM 연동 & 옴니채널 마케팅 자동화** ➔ **관제센터 연계 운용 중**

---

## 3. 대표님 실기기(스마트폰/노트북) 즉시 체감 포인트

1. **스마트폰 카톡 링크 클릭 시**:
   - [https://www.parkgolfallinone.com](https://www.parkgolfallinone.com)을 카톡으로 보내고 터치하면 상단에 **`[ 🚀 크롬/사파리에서 열기 (1초 탈출) ]`** 배너 표출 ➔ 터치 즉시 바깥 브라우저로 안전 전환.
2. **모바일 바탕화면 1초 앱 설치**:
   - 일반 브라우저에서 대문 배너의 **`[ 📲 스마트폰 바탕화면에 1초 만에 깔기 ]`** 터치 즉시 홈 화면에 귀여운 파키 아이콘 앱 설치 완료.
3. **노트북 및 사무실 PC**:
   - 언제든 `python hub/run.py --app paki --action dev` 한 줄로 로컬 서버(포트 3008) 즉시 기동.

---

## 4. 최근 작업 변경 파일 목록
```text
?? .git.worktree_bak
?? apps/parkon/audit_400_bilingual_simulation_result.json
?? apps/parkon/audit_5_users_result.json
?? apps/parkon/simulate_400_bilingual_users.js
?? apps/parkon/test_1000_virtual_users.js
?? apps/parkon/test_100_virtual_users.js
?? apps/parkon/test_5000_ux_audit.js
?? apps/parkon/test_5_representative_virtual_users.js
?? apps/parkon/test_5_users_post_improvement.js
?? apps/parkon/test_step3_national_tour.js
?? apps/parkon/test_step4_enhancements.js
?? apps/restore_backup_before_global.py
?? apps/restore_backup_before_step1.py
?? apps/restore_backup_before_step2.py
?? apps/restore_backup_before_step3.py
?? apps/restore_backup_before_step4.py
?? apps/restore_backup_board_complete.py
?? apps/restore_backup_golden.py
?? apps/restore_backup_golden_20260930.py
?? apps/restore_backup_tutorial.py
?? apps/web/public/worker-b3fcd49e78fac557.js
?? rules.html
?? scratch/__pycache__/
?? scratch/analyze_custom_courses.js
?? scratch/analyze_japan_datasets.cjs
?? scratch/analyze_jp_courses.js
?? scratch/audit_200k_bilingual_result.json
?? scratch/audit_200k_bilingual_users.js
?? scratch/audit_japanese_courses.cjs
?? scratch/audit_production.py
?? scratch/batch_engine.py
?? scratch/build_complete_japan_database.cjs
?? scratch/build_korean_address_translator.cjs
?? scratch/capture_full_admin_dashboard.py
?? scratch/check_all_52_specs.py
?? scratch/check_analytics_deploy.cjs
?? scratch/check_chunks.js
?? scratch/check_course_ids.cjs
?? scratch/check_courses.js
?? scratch/check_courses_undefined.cjs
?? scratch/check_dev_css.cjs
?? scratch/check_domains.js
?? scratch/check_html_bundle.js
?? scratch/check_live_deploy.js
?? scratch/check_production_deployment.cjs
?? scratch/convert_all_52_images.py
?? scratch/crawl_minpg_deep.cjs
?? scratch/enrich_all_38_courses.cjs
?? scratch/enrich_japanese_courses.cjs
?? scratch/find_52_images.py
?? scratch/find_hole_in_one.py
?? scratch/fix_admin.cjs
?? scratch/generate_all_1126_japan_courses.cjs
?? scratch/generate_bilingual_courses.cjs
?? scratch/generate_japan_full_db.cjs
?? scratch/inspect_52_images.py
?? scratch/inspect_browser_admin.py
?? scratch/inspect_chronicle_page_chunk.js
?? scratch/inspect_chunk_content.js
?? scratch/inspect_japanese_metrics.cjs
?? scratch/inspect_kml.cjs
?? scratch/inspect_mascot_folders.py
?? scratch/inspect_production_chunks.js
?? scratch/link_japan_db.cjs
?? scratch/list_all_52.py
?? scratch/list_scripts.js
?? scratch/merge_japan_courses.cjs
?? scratch/minpg_all_courses.json
?? scratch/minpg_all_discovered_urls.json
?? scratch/minpg_full_detailed_courses.json
?? scratch/monitor_deploy.js
?? scratch/monitor_pwa_deploy.js
?? scratch/monitor_vercel_deploy.js
?? scratch/npga_all_official_courses.json
?? scratch/npga_courses.kml
?? scratch/old_38_courses.ts
?? scratch/page_with_board.tsx
?? scratch/parse_kml.cjs
?? scratch/poll_5000_result.json
?? scratch/poll_deploy.js
?? scratch/scan_52_images.py
?? scratch/scrape_all_minpg_details.cjs
?? scratch/scrape_minpg.cjs
?? scratch/scrape_npga_official.cjs
?? scratch/seed_to_exact_160.cjs
?? scratch/simulate_100_users.js
?? scratch/simulate_200k_users.js
?? scratch/simulate_200k_users_result.json
?? scratch/simulate_5000_naming_poll.js
?? scratch/sync_baseline_to_supabase.cjs
?? scratch/test_1_and_5.py
?? scratch/test_admin_login_submit.py
?? scratch/test_canvas_image.js
?? scratch/test_canvas_image.py
?? scratch/test_colors.py
?? scratch/test_combine_all.cjs
?? scratch/test_db_builder.cjs
?? scratch/test_enrich.js
?? scratch/test_full_merger.cjs
?? scratch/test_get_all_courses.cjs
?? scratch/test_hole_script.js
?? scratch/test_import_cycle.cjs
?? scratch/test_ko_to_ja_fields.cjs
?? scratch/test_minpg_detail.cjs
?? scratch/test_minpg_pagination.cjs
?? scratch/test_minpg_parser_sample.cjs
?? scratch/test_npga_menu.cjs
?? scratch/test_npga_page.cjs
?? scratch/test_npga_parser.cjs
?? scratch/test_ocr.py
?? scratch/test_popup.py
?? scratch/test_replace_text.py
?? scratch/test_reset_flow.py
?? scratch/test_return_and_courses.py
?? scratch/test_ribbon_color.py
?? scratch/test_seamless.py
?? scratch/test_search_all_regions.cjs
?? scratch/test_smart_replace.py
?? scratch/test_unverified_spec_flow_v2.py
?? scratch/verify_all_field_ux.py
?? scratch/verify_chronicle_deletion_and_badges.py
?? scratch/verify_deploy.js
?? scratch/verify_japan_db_stats.cjs
?? scratch/verify_live_admin_mobile.py
?? scratch/verify_live_production.py
?? scratch/verify_photo_and_download_ux.py
?? scratch/verify_rules.js
?? scratch/verify_step2_and_camera.py
?? scratch/verify_tab_counts.cjs
?? scratch/verify_tokyo_and_localization.cjs
?? scratch/verify_total_courses.cjs
?? scratch/verify_unverified_flow.py
?? scratch/verify_unverified_spec_flow.js
?? scratch/wait_for_prod_160.cjs
?? scratch/write_admin.js
?? scratch_check.js
?? scratch_poll.js
```
