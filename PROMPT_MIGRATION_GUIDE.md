# Prompt System Migration Guide

## ✅ What Changed?

The large `SYSTEM_PROMPT` constant in `src/app/api/chat/route.ts` has been **modularized** to prevent merge conflicts when multiple team members are working on the AI assistant.

### Before:
```
src/app/api/chat/route.ts (850+ lines)
  └── SYSTEM_PROMPT (300+ lines of text in one constant)
```

### After:
```
src/lib/prompts/
  ├── version.ts         # Version control
  ├── catalog.ts         # Experiences catalog
  ├── intentions.ts      # Intent classification
  ├── flows.ts          # Conversation flows
  ├── examples.ts       # Example conversations
  ├── rules.ts          # Critical rules
  └── index.ts          # Main assembly
```

## 🎯 Benefits

### 1. **Reduced Merge Conflicts**
Multiple developers can now work on different aspects:
- Developer A: Updates catalog → edits `catalog.ts`
- Developer B: Adds examples → edits `examples.ts`
- Developer C: Refines flows → edits `flows.ts`

**No conflicts!** Each person works in their own file.

### 2. **Better Organization**
- Easy to find what you need to change
- Logical separation of concerns
- Smaller, more manageable files

### 3. **Version Tracking**
- Every change updates the version number
- Changelog tracks what changed and who changed it
- Easy to debug prompt-related issues

### 4. **Easier Reviews**
- PR reviewers see only the relevant section
- Smaller diffs = faster reviews
- Clear what aspect of the prompt changed

## 📖 How to Use

### Finding What to Edit

Ask yourself: "What am I changing?"

| What you're changing | File to edit | Example |
|---------------------|--------------|---------|
| Available experiences, categories, prices | `catalog.ts` | "We now have 35 experiences instead of 31" |
| How to classify user messages | `intentions.ts` | "Add new intention type: SCHEDULING" |
| What to do when user has X intention | `flows.ts` | "When user says feedback, also ask if they want more options" |
| Example conversations | `examples.ts` | "Add example for weekend getaway scenario" |
| Conversation rules | `rules.ts` | "Never ask for email until they express interest" |
| Core personality, prompts structure | `index.ts` | "Update the tone from casual to professional" |

### Making a Change

**Example: Adding a new conversation example**

1. **Edit the file**
   ```bash
   # Open the examples file
   code src/lib/prompts/examples.ts
   ```

2. **Add your example** at the bottom of `EXAMPLES_SECTION`

3. **Update version**
   ```bash
   # Open version file
   code src/lib/prompts/version.ts
   ```

   Update:
   ```typescript
   export const PROMPT_VERSION = '1.1.0'; // was 1.0.0

   export const PROMPT_CHANGELOG: Record<string, string> = {
     '1.1.0': 'Added weekend getaway conversation example - Maria',
     '1.0.0': 'Initial modularization',
   };
   ```

## 🚨 Common Gotchas

### 1. Don't Edit route.ts
❌ **Wrong**: Editing `SYSTEM_PROMPT` in `route.ts`
✅ **Right**: Editing the appropriate file in `src/lib/prompts/`

The `route.ts` file now just imports the prompt - don't edit it there!

### 2. Always Update Version
❌ **Wrong**: Make changes without updating `version.ts`
✅ **Right**: Always increment version and add changelog entry

### 3. Test After Changes
❌ **Wrong**: Push without testing
✅ **Right**: Run `npm run dev` and test the chat

---

**Migration Date**: 2026-01-10
**Migrated By**: Nathaly & Claude Code
**Questions?** Ask in team chat or create an issue
