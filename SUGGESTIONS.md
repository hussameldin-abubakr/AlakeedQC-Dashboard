# AlakeedQC Dashboard - Codebase Audit & Suggestions

**Date**: 2026-01-11  
**Audited By**: AI Code Review  

---

## 🐛 BUGS & CRITICAL FIXES

### 1. **Missing `activeVersion` Dependency in `useEffect`** (PromptStudio.tsx)
**File**: `src/components/PromptStudio.tsx` (line 34)  
**Issue**: The `useEffect` hook depends on `activeVersion.content` but `activeVersion` is not in the dependency array. ESLint will warn about this.  
**Risk**: May cause stale closures if the version list changes.  
**Fix**: Add `activeVersion` to the dependency array or restructure to use `state.activeVersionId` only.

---

### 2. **Dynamic Tailwind Classes Won't Work** (SettingsModal.tsx)
**File**: `src/components/SettingsModal.tsx` (lines 68, 75, 83, 90)  
**Issue**: Using dynamic class interpolation like `border-${p.color}-500` will NOT work with Tailwind's JIT compiler because classes aren't statically analyzed.  
**Risk**: Provider selection styling will be broken in production.  
**Fix**: Use a lookup object or `clsx` with full class names:
```tsx
const colorClasses = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-50', ... },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50', ... }
};
```

---

### 3. **ReportViewer Ignoring Historical Data** (ReportViewer.tsx)
**File**: `src/components/ReportViewer.tsx` (line 164)  
**Issue**: The `ParameterRow` always shows "No prior data" even though `param.HistoryValue` and `param.HistoryDate` exist in the API type.  
**Risk**: Users miss valuable trend comparisons.  
**Fix**: Conditionally render the historical data if `param.HistoryValue` is available.

---

### 4. **Supabase Client Initialization Without Validation** (lib/supabase.ts)
**File**: `src/lib/supabase.ts` (line 10)  
**Issue**: `createClient` is called with potentially empty strings `supabaseUrl || ''`. This creates a broken client that will fail silently.  
**Risk**: App crashes or silent failures in production if env vars are missing.  
**Fix**: Throw an error or display a startup warning if credentials are truly undefined.

---

### 5. **`Export Audit` Button Does Nothing** (QCDashboard.tsx)
**File**: `src/components/QCDashboard.tsx` (lines 141-144)  
**Issue**: The "Export Audit" button has no `onClick` handler. It's purely decorative.  
**Risk**: User frustration; broken UX promise.  
**Fix**: Implement CSV/JSON export functionality or hide the button.

---

### 6. **labIdUtils Infinite Loop Edge Case** (labIdUtils.ts)
**File**: `src/utils/labIdUtils.ts` (line 41)  
**Issue**: The `getLabIdRange` function has a safety break at 500 iterations, but if the date portion differs (e.g., "2501010001" to "2502010010"), it will silently return a truncated or incorrect range.  
**Risk**: Bulk processor may skip valid reports or behave unexpectedly.  
**Fix**: Add validation that both IDs share the same date prefix, or implement proper cross-date iteration.

---

### 7. **`checkAbnormal` Function Too Simple** (ReportViewer.tsx)
**File**: `src/components/ReportViewer.tsx` (lines 170-182)  
**Issue**: The function only handles ranges in "min-max" format. It won't flag abnormals for:
- Ranges like `<5.0` or `>1.0`
- Ranges like `10 - 20` (with spaces)
- Qualitative results like "Negative"
**Risk**: Critical abnormal values may go unflagged.  
**Fix**: Enhance the parser to handle common lab range formats.

---

## ⚠️ LOGIC & ARCHITECTURE IMPROVEMENTS

### 8. **Keyboard Shortcuts Disabled During Modal Open**
**File**: `src/App.tsx` (line 195)  
**Issue**: Keyboard shortcuts are disabled when *any* modal is open. This includes the Bulk Processor, preventing advanced users from navigating while the modal is up.  
**Suggestion**: Allow navigation shortcuts (←/→) even when modals are open, or provide in-modal navigation.

---

### 9. **No Error Handling for Settings Sync Failures**
**File**: `src/App.tsx` (line 86)  
**Issue**: If `supabaseService.saveSettings()` fails, the error is logged but the user is not notified.  
**Risk**: Users may think settings are saved when they are not.  
**Suggestion**: Add a toast notification system for success/failure feedback.

---

### 10. **Bulk Processor Rate Limit Too Conservative**
**File**: `src/components/BulkProcessor.tsx` (line 112)  
**Issue**: The 800ms delay between requests is arbitrary. For Cerebras (fast inference) this is wasteful; for Gemini with rate limits, it may still hit throttling.  
**Suggestion**: Make the delay configurable or implement exponential backoff on 429 errors.

---

### 11. **Dashboard Stats Use Client-Side Deduplication**
**File**: `src/components/QCDashboard.tsx` (lines 52-86)  
**Issue**: The deduplication logic (keeping only the latest report per `lab_id`) runs on the frontend after fetching all reports. For large datasets, this is inefficient.  
**Suggestion**: Move deduplication to a Supabase SQL view or use `DISTINCT ON` in the query.

---

### 12. **No Pagination for Dashboard/Audit Register**
**File**: `src/components/QCDashboard.tsx` (line 30)  
**Issue**: The dashboard fetches 60 days of data in one request. If there are thousands of audits, this will be slow and memory-heavy.  
**Suggestion**: Implement server-side pagination with "Load More" or infinite scroll.

---

### 13. **Prompt Versions Not Stored in Supabase Separately**
**File**: `src/services/supabaseService.ts`  
**Issue**: Prompt versions are stored inside a JSON blob within `dashboard_settings`. If the user wants to share prompts across accounts or audit prompt changes historically, this won't scale.  
**Suggestion**: Create a dedicated `prompt_versions` table with user_id, content, timestamps, and an active flag.

---

## 🎨 UI/UX IMPROVEMENTS

### 14. **Mobile Responsiveness Needs Work**
**Files**: Most components  
**Issue**: Several components (SearchHeader, ReportViewer, BulkProcessor, PromptStudio) have `hidden md:flex` or fixed widths that break on mobile.  
**Example**: The Variables Panel in PromptStudio (`w-72`) pushes the editor off-screen on small devices.  
**Suggestion**: Audit all components for responsive breakpoints; consider a mobile-specific navigation pattern.

---

### 15. **No Visual Feedback on Search Input Validity**
**File**: `src/components/SearchHeader.tsx`  
**Issue**: Users can type any string into the Lab ID field. Invalid IDs (wrong length, letters, etc.) are only caught after hitting the API.  
**Suggestion**: Add inline validation/feedback (e.g., red border, helper text) for Lab ID format before submission.

---

### 16. **AI Analysis Panel Scroll Position Resets**
**File**: `src/components/AIAnalysisPanel.tsx`  
**Issue**: When re-analyzing, the scroll position in the Markdown output resets to the top. Users reading a long report lose their place.  
**Suggestion**: Preserve scroll position during re-analysis or provide a "scroll to top" button.

---

### 17. **No Loading State for QCDashboard Report Selection**
**File**: `src/components/QCDashboard.tsx` (line 287)  
**Issue**: Clicking a row in the Audit Register immediately switches views, but the report may still be loading. There's no intermediate loading state.  
**Suggestion**: Show a skeleton loader in the Auditor view while `handleSearch` is in progress.

---

### 18. **Sign Out Confirmation Needed**
**File**: `src/App.tsx` (lines 189-191)  
**Issue**: Clicking sign out immediately logs out without confirmation. If the user has unsaved prompt edits, they are lost.  
**Suggestion**: Add a confirmation modal like the one used for "Reset All Prompts".

---

### 19. **No "Copy Analysis to Clipboard" Button**
**File**: `src/components/AIAnalysisPanel.tsx`  
**Issue**: Users often need to copy the AI analysis to paste into a lab report or email. Currently, they must manually select and copy.  
**Suggestion**: Add a "Copy to Clipboard" icon button next to the "Re-run analysis" button.

---

### 20. **"Model Level 1" Sequence Indicator is Confusing**
**File**: `src/components/QCDashboard.tsx` (lines 316-322)  
**Issue**: The "Sequence" column shows a static "Model Level 1" with 4 blue bars and 1 gray bar. It's unclear what this represents.  
**Suggestion**: Either remove this placeholder or make it meaningful (e.g., display actual confidence scores or audit iteration count).

---

## 🚀 FEATURE SUGGESTIONS

### 21. **Implement Real-Time Dashboard Refresh**
Currently, the dashboard only loads data on mount. For a multi-user lab environment, it would be valuable to see new audits appear in real-time using Supabase Realtime subscriptions.

---

### 22. **Add Multi-Language Support (i18n)**
The application currently uses hardcoded English strings. For deployment in Libya, Arabic localization would significantly improve usability.

---

### 23. **Implement Print/PDF Export for Individual Reports**
Add the ability to export a single report (patient data + AI analysis) as a PDF for archival or attachment to patient files.

---

### 24. **Add Audit Trail / Activity Log**
Track who ran which audits, when prompts were changed, and when settings were modified. Essential for compliance in a medical environment.

---

### 25. **Implement Role-Based Access Control (RBAC)**
Not all personnel should have access to bulk processing or prompt editing. Consider adding user roles (Technician, Supervisor, Admin) with scoped permissions.

---

### 26. **Add Dark Mode**
Many lab technicians work night shifts. A dark mode would reduce eye strain and is a common expectation in modern applications.

---

### 27. **Performance: Code-Split Large Components**
**Relevant**: `BulkProcessor.tsx` (23KB), `QCDashboard.tsx` (20KB), `PromptStudio.tsx` (21KB)  
These components are large and loaded upfront even if the user never uses them. Implementing React.lazy() and Suspense would improve initial load times.

---

## 📋 SUMMARY TABLE

| Priority | Category | Item | File(s) |
|----------|----------|------|---------|
| 🔴 High | Bug | Dynamic Tailwind classes won't work | SettingsModal.tsx |
| 🔴 High | Bug | Export button does nothing | QCDashboard.tsx |
| 🔴 High | Bug | Historical data not displayed | ReportViewer.tsx |
| 🟡 Medium | Bug | Missing useEffect dependency | PromptStudio.tsx |
| 🟡 Medium | Bug | `checkAbnormal` too simple | ReportViewer.tsx |
| 🟡 Medium | Logic | No error feedback for settings sync | App.tsx |
| 🟡 Medium | Logic | Client-side deduplication inefficient | QCDashboard.tsx |
| 🟡 Medium | UX | Mobile responsiveness | Multiple |
| 🟡 Medium | UX | No clipboard copy for analysis | AIAnalysisPanel.tsx |
| 🟢 Low | UX | Sign out confirmation | App.tsx |
| 🟢 Low | Feature | Real-time updates | QCDashboard.tsx |
| 🟢 Low | Feature | i18n / Arabic support | All |
| 🟢 Low | Feature | Dark mode | All |

---

## ✅ WHAT'S WORKING WELL

1. **Clean Component Structure**: Good separation of concerns with single-responsibility components.
2. **Beautiful UI Design**: The glassmorphism, animations, and color palette are premium-quality.
3. **Robust Authentication Flow**: Proper Supabase auth listener with session persistence.
4. **Smart Caching**: The cloud cache + local storage fallback is well-implemented.
5. **Keyboard Shortcuts**: Power-user features like Cmd+P, Cmd+B, and arrow navigation are excellent.
6. **Prompt Versioning**: The version history with activate/restore is a thoughtful feature.

---

**End of Audit Report**
