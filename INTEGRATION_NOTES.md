# Talent Bridge — Integration Notes (Task 21)

## Fixes Applied (Task 21)

### Frontend (`talent-bridge-frontend`)

#### 1. `src/main.tsx` — Removed React 19 StrictMode (react-dnd compatibility)
- **Before**: Wrapped `<App />` in both `<StrictMode>` and `<DndProvider>`
- **After**: Removed `<StrictMode>` — only `<DndProvider backend={HTML5Backend}>` wraps App
- **Why**: React 19 StrictMode double-invokes effects, causing `react-dnd` v16 to register the
  HTML5 backend twice and throw "Cannot have two HTML5 backends at the same time."
  For the hackathon demo, removing StrictMode ensures drag-drop works reliably.

#### 2. `src/api/client.ts` — Fixed 401 interceptor to not break login flow
- **Before**: Every 401 response cleared localStorage and redirected to /login
- **After**: 401 on auth endpoints (`/api/auth/login`, `/api/auth/register`) is passed through
  without clearing session; only 401 on non-auth endpoints triggers logout + redirect
- **Why**: A wrong password on login returns 401 ("Invalid credentials"), but this should NOT
  log out the user or redirect — it should show the error message in the form

#### 3. `src/api/client.ts` — Removed default Content-Type header
- `baseURL: 'http://localhost:5001'` (direct to ASP.NET Core — CORS handles cross-origin)
- No default Content-Type — axios auto-detects: `application/json` for objects, `multipart/form-data`
  for FormData (CV upload)

#### 4. Sample CV created — `sample_cv.pdf`
- Contains keywords for rule-based skill matching: Data Center Operations, Power Systems,
  Cooling Systems, Networking, Linux Administration, Cybersecurity, etc.
- Expected result: ~10 matched skills, ~75% match score → Silver grade
- Use `python create_sample_cv.py` to regenerate if needed

---

## Integration Architecture Verified

```
Frontend (5173)                    ASP.NET API (5001)          Flask AI (5000)
     │                                      │                        │
     ├─ POST /api/auth/register ──────────► │                        │
     ├─ POST /api/auth/login ─────────────► │                        │
     │    ◄── JWT token (8h expiry) ────────┤                        │
     │                                      │                        │
     ├─ POST /api/cv/upload ──────────────► │                        │
     │    (multipart FormData + JWT)        ├─ POST /ocr-and-match ─► │
     │                                      │ ◄── {extracted_skills,  │
     │                                      │     overall_match_score,│
     │                                      │     method: rule_based} │
     │    ◄── {cvId, matchScore, grade} ────┤                        │
     │                                      │                        │
     ├─ GET /api/cv/{userId}/result ──────► │                        │
     │    ◄── {skills, grade} ──────────────┤                        │
     │                                      │                        │
     ├─ GET /api/courses/recommended ─────► │                        │
     ├─ GET /api/courses/{id}/modules ────► │                        │
     ├─ POST /api/quiz/{moduleId}/submit ─► │                        │
     ├─ GET /api/jobs/matched/{userId} ───► │                        │
```

---

## Error Handling Matrix

| Scenario | Behavior |
|---|---|
| JWT expired / invalid | 401 → frontend clears localStorage → redirect `/login` |
| Wrong password on login | 401 → error shown in form, session NOT cleared |
| Server error (5xx) | Normalised to "Terjadi kesalahan, coba lagi" by `client.ts` interceptor |
| Flask AI model fails to load | `USE_AI_FALLBACK=true` in `.env` → rule-based matching always used |
| File too large (>10MB) | Frontend validates before upload; backend returns 400 |
| Invalid file type | Frontend validates MIME; backend double-checks extension + MIME |
| No CV uploaded | Dashboard shows "Upload CV" prompt; Jobs page shows "Upload CV first" prompt |
| Grade Unranked | Jobs with MinGrade=Unranked still shown; matching works correctly |

---

## CORS Configuration

### ASP.NET Core (port 5001)
```
AllowOrigins: http://localhost:5173, https://localhost:5173, 
              http://127.0.0.1:5173, https://127.0.0.1:5173
AllowAnyHeader + AllowAnyMethod
```
CORS is set before authentication in the middleware pipeline — OPTIONS preflight will succeed.

### Flask (port 5000)
```
CORS(app, resources={r"/*": {"origins": "*"}})
```
Flask is only called server-to-server (ASP.NET → Flask), so CORS origin is irrelevant for browser.

### Vite Dev Server (port 5173)
```
proxy: { '/api': { target: 'http://localhost:5001' } }
```
The Vite proxy is a development convenience. Since Axios uses `baseURL: 'http://localhost:5001'`
(absolute), it bypasses the Vite proxy and makes direct cross-origin requests. CORS handles this.

---

## JWT Configuration

- Expiry: 8 hours (configured in `appsettings.json` → `Jwt.ExpiryHours: 8`)
- Algorithm: HMAC SHA-256
- Claims: userId (NameIdentifier), email, name, role, grade
- On expiry: ASP.NET returns 401 JSON → client.ts interceptor clears session → redirect to /login

---

## Flask AI Fallback

`USE_AI_FALLBACK=true` in `talent-ai-service/.env` forces rule-based mode (no sentence-transformers).

Rule-based matching:
- Checks if skill name (case-insensitive) appears in CV text
- Confidence: base 60% + 5% per additional mention (max 95%)
- Overall score: `min(100, matched/total * 150)` → e.g. 10/20 skills = 75% → Silver

To test true AI fallback (auto-detected):
1. Set `USE_AI_FALLBACK=false` in `.env`
2. Uninstall sentence-transformers: `pip uninstall sentence-transformers`
3. Flask catches the ImportError and sets `AI_AVAILABLE = False`
4. All matching falls back to rule-based automatically

---

## Grade Flow

1. **CV Upload** → Flask returns `overall_match_score` → ASP.NET assigns grade
2. **Quiz Submit** → ASP.NET computes average of all UserProgress scores → grade updates (only increases)
3. **Grade thresholds**: `< 40 = Unranked | 40–59 = Bronze | 60–79 = Silver | ≥ 80 = Gold`

---

## Quiz Drag-Drop Logic

- Frontend: `DragDropQuiz` stores mapping `{ slotIndex: optionId }` in Zustand
- On submit: each drag-drop question gets `dragDropMapping: { "0": "optId", "1": "optId", ... }`
- Backend validates: `option.Position == slotIndex && option.IsCorrect == true`
- All seed drag-drop options have `IsCorrect=true` — user must place ALL 4 items correctly
- Score = correct questions / total questions * 100

---

## Demo Flow (5 minutes)

**Prerequisites**: ASP.NET Core running on port 5001, Flask on port 5000, React on port 5173

1. Open `http://localhost:5173`
2. Click **Register** → fill name/email/password → Submit
3. Auto-logged in → Dashboard shows "Unranked"
4. Click **Upload CV** → drop `sample_cv.pdf` → click **Upload CV**
   - Expected: ~10 skills detected, ~75% match, Silver grade
5. See skill analysis + grade animation
6. Go to **Dashboard** → see detected skills and "Silver" badge
7. Go to **Courses** → click **START COURSE** on "Data Center Fundamentals"
8. **Module 1 (MCQ)**: Answer each question → click **Submit Quiz**
   - Q1: "Menyediakan daya cadangan saat listrik padam" (UPS function)
   - Q2: "Network Switch" (connects servers)
   - Q3: "Power Usage Effectiveness" (PUE meaning)
9. See score/XP/confetti (if ≥70%) → click **NEXT MODULE**
10. **Module 2 (Multi-select)**: Select all correct options → **Submit Quiz**
11. Click **NEXT MODULE**
12. **Module 3 (Drag & Drop)**:
    - Drag UPS → Power Zone ⚡
    - Drag Network Switch → Network Zone 🌐
    - Drag Server Rack → Compute Zone 💻
    - Drag CRAC Unit → Cooling Zone ❄️
    - Click **Submit Quiz**
13. Go to **Jobs** → see matched jobs filtered by grade
14. Filter by "Batam 🇮🇩" and "Singapore 🇸🇬"

---

## Demo Checklist

Before starting demo, verify all 3 services are running:

```powershell
# Terminal 1: ASP.NET Core API
cd talent-bridge-api
dotnet run

# Terminal 2: Flask AI Service  
cd talent-ai-service
python app.py

# Terminal 3: React Frontend
cd talent-bridge-frontend
npm run dev
```

Check:
- [ ] http://localhost:5001/health → Swagger UI loads (or 404 redirected to Swagger root)
- [ ] http://localhost:5000/health → `{"status":"ok","ai_available":false,"mode":"rule_based"}`
- [ ] http://localhost:5173 → Login page loads with pixel-art theme
