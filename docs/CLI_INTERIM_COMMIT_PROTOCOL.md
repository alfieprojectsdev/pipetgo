# CLI Claude Interim Commit Protocol

**Purpose:** Ensure work-in-progress is safely committed before session breaks, allowing Web Claude to access current state without conflicts.

**Last Updated:** 2025-11-07 04:10 UTC

---

## 🎯 Why Interim Commits Matter

**Problem:** Web Claude can only see committed code, not work-in-progress
**Solution:** CLI commits work at logical breakpoints before session breaks
**Benefit:** Web Claude can analyze current state without conflicts

---

## 📋 When to Create Interim Commits

### Required Before Session Break:
- ✅ After completing any full task
- ✅ After implementing a working feature
- ✅ After fixing a set of issues
- ✅ Before switching context
- ✅ When taking a break >30 minutes

### NOT Required:
- ❌ In middle of implementing a function
- ❌ With broken/non-compiling code
- ❌ Before running tests
- ❌ When code is incomplete

---

## ✅ Interim Commit Rules

### Rule 1: Code Must Work
```bash
# BEFORE committing, verify:
npm test              # All tests pass
npm run type-check    # TypeScript clean
npm run lint          # Linting passes

# OR for Python:
pytest                # All tests pass
mypy src/             # Type checking clean
ruff check .          # Linting passes
```

**If tests fail:** Fix first, then commit
**If cannot fix quickly:** Stash changes instead

---

### Rule 2: Use WIP Prefix for Incomplete Work
```bash
# For work-in-progress commits
git commit -m "wip(phase5): task 2 accessibility fixes (3/7 complete)

Fixed:
- Color contrast on quote form labels
- Keyboard navigation for approve button
- ARIA labels for status badges

Remaining:
- Focus indicators on input fields
- Screen reader text for quote amounts
- Error message associations
- Form validation feedback

Tests: All passing
Lint: Clean
Build: Working

Next: Complete remaining 4 P0 fixes before Task 3"
```

---

### Rule 3: Include Context for Web Claude
```bash
# Good interim commit message template
git commit -m "[wip|feat|fix](scope): brief description

Status: [X/Y] complete OR In Progress

Completed:
- [Specific item 1]
- [Specific item 2]

In Progress:
- [Current work]

Remaining:
- [Next item 1]
- [Next item 2]

Quality Checks:
- Tests: [passing/failing with reason]
- Lint: [clean/issues with reason]
- Build: [working/broken with reason]

Next Step: [What to do when resuming]

Safe for Web Claude: [yes/no - what analysis is safe]"
```

---

## 📝 Interim Commit Templates

### Template 1: Task Partially Complete

```bash
git add [files]
git commit -m "wip(phase5): accessibility fixes in progress (3/7 P0 issues fixed)

Completed P0 Fixes:
- Quote form color contrast (WCAG 2.1 AA compliant)
- Keyboard navigation on approval buttons
- ARIA labels for all status badges

In Progress:
- Focus indicators for form inputs

Remaining P0 Fixes:
- Screen reader text for monetary amounts
- Error message associations
- Form validation feedback messages

Quality:
- Tests: 220/220 passing ✅
- TypeScript: Clean ✅
- Lint: Clean ✅
- Build: Working ✅

Next: Complete focus indicators, then remaining 3 P0 fixes

Safe for Web Claude: YES
- Can review completed fixes
- Can analyze remaining P0 issues
- Can document accessibility improvements
- AVOID: Modifying quote form components"
```

---

### Template 2: Task Complete, Phase In Progress

```bash
git add [files]
git commit -m "feat(phase5): complete task 2 - UX accessibility review

Task 2 Complete:
- @ux-reviewer audit performed
- 7 P0 accessibility issues identified
- All 7 P0 issues fixed
- WCAG 2.1 AA compliance verified

Files Modified:
- src/app/dashboard/lab/orders/[id]/quote/page.tsx
- src/app/dashboard/client/orders/[id]/approve/page.tsx
- src/components/ui/status-badge.tsx

Files Created:
- docs/ACCESSIBILITY_AUDIT_PHASE5.md

Quality:
- Tests: 220/220 passing ✅
- TypeScript: Clean ✅
- Lint: Clean ✅
- WCAG 2.1 AA: Compliant ✅

Phase 5 Progress: 2/5 tasks complete (40%)
Next Task: Task 3 - Quality/Security Review (30 min)

Safe for Web Claude: YES
- Can review all Phase 5 work to date
- Can analyze Task 2 implementation
- Can prepare for Task 3
- AVOID: Writing Task 3 code/tests"
```

---

### Template 3: Session Break (Work Paused)

```bash
git add [files]
git commit -m "wip(phase0): task 4 path utilities delegated to @developer

Session Status: On Break

Completed Tasks:
- Task 1: CLI Interface ✅
- Task 2: Core Scanner ✅
- Task 3: Checkpoint Manager ✅

Current Task:
- Task 4: Path Utilities (delegated to @developer agent)
- Agent implementing cross-platform path handling
- Expected files: src/drive_archaeologist/utils/paths.py

Remaining Tasks:
- Task 5: Project Setup (30 min)
- Task 6: Tests (2 hours)
- Task 7: Documentation (1 hour)

Quality:
- Tests: Not yet run (waiting for Task 4 completion)
- Lint: Clean (existing code) ✅
- Build: N/A (Python project)

Phase 0 Progress: 3/7 tasks complete (43%)
Estimated Remaining: ~3.5 hours

Next Session:
- Receive Task 4 implementation from @developer
- Review and integrate path utilities
- Proceed to Task 5 (Project Setup)

Safe for Web Claude: YES
- Can review Tasks 1-3 implementation
- Can analyze architecture decisions
- Can plan Phase 1
- Can document Phase 0 progress
- AVOID: Implementing Task 4-7 code"
```

---

## 🔄 Commit → Push → Web Claude Workflow

### Step 1: CLI Claude Creates Interim Commit

```bash
# Verify quality
npm test && npm run type-check && npm run lint

# Create interim commit (use template above)
git add [relevant files]
git commit -m "wip(scope): description with context for Web Claude"

# Push to remote so Web Claude can access
git push origin [branch-name]
```

---

### Step 2: Update Coordination

```bash
# Update project status file
# Example for pipetgo:
vim /home/ltpt420/repos/claude-config/coordination/project-status/pipetgo-status.md

# Add interim status:
**Interim Commit (Nov 7, 04:30):**
- Phase 5 Task 2 complete (accessibility fixes)
- All tests passing (220/220)
- Ready for Task 3 (Quality/Security Review)
- Safe for Web Claude analysis: YES
- Branch: main, Commit: abc1234
```

---

### Step 3: Alfie Hands Off to Web Claude

```bash
# Copy latest commit hash
cd /home/ltpt420/repos/pipetgo
git log --oneline -1

# Provide to Web Claude:
```

**Prompt to Web Claude:**

```
CLI Claude has committed interim work on PipetGo Phase 5.

Latest commit: [hash] - "wip(phase5): task 2 complete - accessibility fixes"

Your safe task: Code Quality Review of Accessibility Fixes

Context:
- CLI completed Task 2 (UX/Accessibility Review)
- Fixed 7 P0 accessibility issues
- CLI is on break before Task 3

Review Files:
- src/app/dashboard/lab/orders/[id]/quote/page.tsx
- src/app/dashboard/client/orders/[id]/approve/page.tsx
- src/components/ui/status-badge.tsx
- docs/ACCESSIBILITY_AUDIT_PHASE5.md

Analyze:
1. Quality of accessibility fixes
2. WCAG 2.1 AA compliance verification
3. Any missed edge cases
4. Additional improvements possible
5. Documentation completeness

Constraints:
- READ ONLY review
- NO code modifications
- Work on branch: web-claude/review-accessibility-20251107

Output: docs/reviews/ACCESSIBILITY_FIXES_REVIEW.md

This is safe because CLI is on break and won't modify these files until Task 3.
```

---

## 🚨 Emergency: Uncommitted Work During Break

**If you must break with uncommitted work:**

### Option 1: Quick Stash
```bash
# Stash changes with descriptive message
git stash push -m "Phase 5 Task 3: In middle of implementing security fixes (2/5 complete)"

# Add note for yourself
echo "Stashed: $(date)" >> .work-in-progress-notes.txt
echo "Task: Implementing security fixes (2/5 complete)" >> .work-in-progress-notes.txt

# Push .work-in-progress-notes.txt if it exists
git add .work-in-progress-notes.txt
git commit -m "notes: session break with stashed work"
git push
```

**Tell Web Claude:**
```
CLI has stashed uncommitted work and is on break.

Safe task: Review COMPLETED work only (up to last commit)

Latest commit: [hash]
Stashed work: Security fixes (in progress, not reviewable)

Focus your analysis on committed code only.
```

---

### Option 2: Commit Broken Code (Not Recommended)
```bash
# Only if absolutely necessary
git add [files]
git commit -m "wip(phase5): BROKEN - task 3 security fixes incomplete

⚠️ WARNING: This commit does not build/pass tests

Reason: Emergency break during implementation

Status:
- Tests: FAILING (5 new failures)
- Build: BROKEN (TypeScript errors)
- Lint: Has violations

DO NOT USE THIS COMMIT for Web Claude analysis.
Use previous commit [hash] instead.

Will fix on resume."

git push
```

**Tell Web Claude:**
```
⚠️ Latest commit is BROKEN (emergency break)

Use commit [previous-hash] for analysis instead.

Safe for review: Everything up to [previous-hash]
AVOID: Latest commit (broken code, will be fixed)
```

---

## 📊 Interim Commit Frequency Guidelines

**Minimum:** Before any break >30 minutes
**Recommended:** After each completed task/subtask
**Ideal:** Every 1-2 hours of work

### Good Commit Points:

✅ **After completing a task**
```bash
git commit -m "feat(phase5): complete task 2 - accessibility review"
```

✅ **After fixing a set of issues**
```bash
git commit -m "fix(ux): resolve 7 P0 accessibility issues"
```

✅ **After passing a milestone**
```bash
git commit -m "wip(phase0): tasks 1-3 complete, 57% done"
```

✅ **Before switching contexts**
```bash
git commit -m "wip(phase5): task 2 done, preparing for task 3"
```

---

## 🎯 Benefits Summary

**For CLI Claude:**
- ✅ Safe to take breaks anytime
- ✅ Work is backed up
- ✅ Progress is documented
- ✅ Easy to resume

**For Web Claude:**
- ✅ Can access current state
- ✅ Can perform safe analysis
- ✅ Can complement CLI work
- ✅ No risk of conflicts

**For Alfie:**
- ✅ Always know current status
- ✅ Can leverage both instances
- ✅ Progress visible in git log
- ✅ Coordination is clear

---

## ✅ Quick Checklist

Before ending CLI session:

- [ ] All tests passing
- [ ] TypeScript/type checking clean
- [ ] Linting clean
- [ ] Work committed (or stashed with note)
- [ ] Commit message includes Web Claude safety info
- [ ] Pushed to remote
- [ ] Updated coordination/project-status/[project]-status.md
- [ ] Left clear "Next steps" in commit message

---

**Remember: Interim commits are communication tools, not just backups!**

They tell Web Claude (and future you) exactly what's safe to touch and what to avoid.
