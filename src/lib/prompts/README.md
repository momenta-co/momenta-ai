# Modular Prompt System

This directory contains the modularized system prompt for the Momenta AI chat assistant. The prompt has been broken down into separate files to prevent merge conflicts when multiple team members are working on different aspects.

## 📁 File Structure

```
src/lib/prompts/
├── README.md              # This file
├── version.ts             # Version tracking and changelog
├── catalog.ts             # Available experiences catalog
├── intentions.ts          # User intent classification
├── flows.ts              # Conversation flows by intention
├── examples.ts           # Example conversations (most frequently updated)
├── rules.ts              # Critical conversation rules
└── index.ts              # Main assembly file (combines all sections)
```

## 🎯 Which File to Edit?

### Edit `catalog.ts` when:
- Adding/removing experience categories
- Updating city information
- Changing available experience types
- Updating price ranges

### Edit `intentions.ts` when:
- Adding new user intention types
- Adjusting intent classification rules
- Refining intent descriptions

### Edit `flows.ts` when:
- Changing how the AI responds to specific intentions
- Updating conversation flow logic
- Adjusting question patterns

### Edit `examples.ts` when:
- Adding new conversation scenarios
- Updating example responses
- Adding edge cases discovered in production

### Edit `rules.ts` when:
- Adding critical conversation rules
- Updating non-negotiable guidelines
- Changing flow constraints

### Edit `version.ts` when:
- Making any significant change (increment version)
- Documenting changes in changelog

### Edit `index.ts` when:
- Changing core personality traits
- Updating context extraction rules
- Modifying tool usage guidelines
- Restructuring the prompt assembly

## 🔄 Workflow for Making Changes

### 1. **Before Making Changes**
```bash
# Pull latest changes to avoid conflicts
git pull origin main
```

### 2. **Make Your Changes**
- Edit the specific file(s) related to your change
- Update `version.ts` with version number and changelog entry
- Add your name to CONTRIBUTORS if making significant changes

### 3. **Version Updates**
Use semantic versioning:
- **Major (X.0.0)**: Breaking changes to prompt structure
- **Minor (0.X.0)**: New features, new sections, significant additions
- **Patch (0.0.X)**: Small tweaks, bug fixes, example updates

Example:
```typescript
// version.ts
export const PROMPT_VERSION = '1.1.0';
export const PROMPT_CHANGELOG: Record<string, string> = {
  '1.1.0': 'Added new feedback flow patterns - Maria',
  '1.0.0': 'Initial modularization',
};
```

### 4. **Testing Your Changes**
```bash
# Run the development server
npm run dev

# Test the chat interface at http://localhost:3000
```

### 5. **Commit and Push**
```bash
git add src/lib/prompts/
git commit -m "feat(prompts): [brief description of change]"
git push
```

## 🚨 Important Guidelines

### DO:
✅ Update version.ts whenever you make changes
✅ Keep sections focused and cohesive
✅ Test your changes in the dev environment
✅ Add examples when introducing new patterns
✅ Document significant changes in changelog

### DON'T:
❌ Edit multiple sections in different files simultaneously (increases merge risk)
❌ Remove sections without team discussion
❌ Make breaking changes without versioning
❌ Skip testing after changes
❌ Forget to update the changelog

## 🔀 Handling Merge Conflicts

If you encounter merge conflicts:

1. **Identify the conflicted file**
   ```bash
   git status
   ```

2. **Resolve the conflict**
   - Since files are now modular, conflicts should be isolated
   - If conflict is in `examples.ts`, both sets of examples can usually coexist
   - If conflict is in `flows.ts` or `rules.ts`, discuss with the team

3. **Test after resolving**
   ```bash
   npm run dev
   # Test the chat thoroughly
   ```

## 📊 Tracking Changes

You can see who changed what and when:

```bash
# See all changes to a specific file
git log src/lib/prompts/examples.ts

# See what changed in a specific commit
git show <commit-hash>

# See current version
cat src/lib/prompts/version.ts
```

## 🤝 Collaboration Tips

### Working in Parallel
Multiple team members can work on different files simultaneously:
- **Person A**: Updates `catalog.ts` with new experiences
- **Person B**: Adds examples to `examples.ts`
- **Person C**: Refines flows in `flows.ts`

All three can merge without conflicts! 🎉

### Communication
Even though conflicts are reduced, still communicate with your team:
- Announce major changes in team chat
- Link to your PR for review
- Tag relevant team members

## 📝 Example Workflow

**Scenario**: Adding a new conversation example for corporate team building

1. Open `src/lib/prompts/examples.ts`
2. Add your example in the appropriate section
3. Open `src/lib/prompts/version.ts`
4. Update version: `1.0.0` → `1.1.0`
5. Add changelog entry: `'1.1.0': 'Added corporate team building example - [Your Name]'`
6. Test in dev environment
7. Commit: `git commit -m "feat(prompts): add corporate team building example"`
8. Push and create PR

## 🆘 Need Help?

- Check the main assembly in `index.ts` to see how sections are combined
- Review recent commits to see examples of changes
- Ask in team chat before making breaking changes
- Test thoroughly before pushing to production

---

**Last Updated**: 2026-01-10
**Current Version**: 1.0.0
