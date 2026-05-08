# Development Workflow

## Before Every Commit

**ALWAYS** run these checks before pushing:

### 1. Run All Tests ✅
```bash
npm test
```
- **Required:** All tests must pass (64/64)
- **Action:** If tests fail, fix them before committing
- **Never:** Skip tests or use `--no-verify` unless absolutely necessary

### 2. Build Verification ✅
```bash
npm run build
```
- **Required:** Build must complete successfully
- **Action:** Fix any TypeScript or build errors
- **Check:** Verify all routes are generated correctly

### 3. Type Checking ✅
```bash
npx tsc --noEmit
```
- **Required:** No TypeScript errors
- **Action:** Fix type errors before committing

### 4. Linting (Optional but Recommended)
```bash
npm run lint
```
- **Recommended:** Should have no errors
- **Action:** Fix linting issues when possible

## Commit Message Format

Use conventional commits:

```
type(scope): short description

Longer explanation of what changed and why.

Fixes: #issue-number or error description
```

**Types:**
- `fix`: Bug fixes
- `feat`: New features
- `test`: Test changes
- `refactor`: Code refactoring
- `docs`: Documentation
- `chore`: Build/tooling changes

**Examples:**
```
fix: resolve React hydration error on results page

test: fix flaky exam-error-handling test

feat: add lazy loading for PDF parser
```

## Testing Checklist

Before marking a feature as complete:

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Build succeeds without warnings
- [ ] TypeScript compilation succeeds
- [ ] Manual testing completed (if UI changes)
- [ ] No console errors in browser
- [ ] Changes deployed and verified on staging/production

## Git Workflow

### Standard Process
```bash
# 1. Make changes
git add .

# 2. Run tests
npm test

# 3. Run build
npm run build

# 4. If all pass, commit
git commit -m "type: description"

# 5. Push
git push origin master
```

### If Tests Fail
```bash
# DON'T use --no-verify
# Instead, fix the failing tests

# 1. Check what failed
npm test

# 2. Fix the issue
# Edit the failing test or source code

# 3. Verify fix
npm test

# 4. Then commit normally
git commit -m "fix: description"
```

## Pre-Commit Hook

Husky runs tests automatically before commit. If it fails:

1. **Don't bypass** with `--no-verify`
2. **Check the error** - it's telling you something is broken
3. **Fix the issue** - update test or code
4. **Re-run** tests to verify
5. **Then commit** normally

### When `--no-verify` is Acceptable

Only use in these rare cases:
- Tests are flaky due to external services
- Emergency hotfix needed immediately
- You're committing a WIP on a feature branch (not master)

**NEVER** use on master for production deploys.

## Debugging Workflow

### Local Testing
```bash
# Start dev server
npm run dev

# In another terminal, run tests
npm test

# Check specific test
node --test tests/specific-test.test.ts
```

### Production Issues

1. **Check Vercel logs** first
2. **Reproduce locally** if possible
3. **Add logging** to diagnose
4. **Test fix locally** (tests + build)
5. **Deploy and verify**

## Quality Gates

Before pushing to master:

| Check | Command | Required |
|-------|---------|----------|
| Tests | `npm test` | ✅ Yes |
| Build | `npm run build` | ✅ Yes |
| Types | `npx tsc --noEmit` | ✅ Yes |
| Lint | `npm run lint` | ⚠️ Recommended |

## Post-Push Verification

After pushing:

1. **Check Vercel deployment** status
2. **Monitor build logs** for errors
3. **Test on production** once deployed
4. **Check error monitoring** (if configured)

## Summary

✅ **Always verify before push:**
- Run `npm test` → All pass
- Run `npm run build` → Success
- Commit with clear message
- Push to trigger deployment

❌ **Never:**
- Push without running tests
- Use `--no-verify` on master
- Ignore build warnings
- Skip manual testing for UI changes

---

**Remember:** Taking 2 minutes to run tests saves hours of debugging production issues.
