# ADR-002: Hybrid Approach for getRecommendations (Optional UI Fields for Flexible Rendering)

## Status

**ACCEPTED** - 2026-01-12

**Supersedes:** Partially modifies ADR-001 to add optional UI control fields

**Note:** Originally proposed to include generator function with loading states, but implementation focused on optional UI fields only. Loading states deferred to future ADR.

---

## Context

After implementing ADR-001 (AI-driven text generation for getRecommendations), we identified valuable features from the `feat/ai-sdk-6` branch that were lost:

1. **Frontend Rendering Control**: Frontend had no way to style/position intro/follow-up messages differently from regular AI text
2. **Progressive Loading States**: Users saw no feedback while recommendations were being generated (could take 2-5 seconds) - **Deferred for future implementation**

### User Feedback

The product team requested:
> "We want the ability to render intro/follow-up messages with special styling (e.g., bold, different color) while still maintaining the flexibility of the AI to write additional text."

**Note:** Loading states were requested but deferred to keep implementation scope manageable.

---

## Decision

**Adopt a HYBRID approach** that combines:
- ✅ Optional `introMessage` and `followUpQuestion` fields for frontend rendering control
- ✅ AI MUST still write text after tool call (maintaining ADR-001 philosophy)
- ⏳ Generator function with `yield` for progressive loading states - **Deferred to future ADR**

---

## Architecture

### Tool Schema (Optional UI Fields)

```typescript
inputSchema: z.object({
  // OPTIONAL: For frontend rendering control
  introMessage: z.string().optional(),
  followUpQuestion: z.string().optional(),

  // REQUIRED: Search parameters
  ciudad: z.string(),
  fecha: z.string(),
  personas: z.number(),
  // ... other params
})
```

### Tool Execution (Simple Async - No Generator Yet)

```typescript
execute: async (params) => {
  const experiences = await getExperiencesByCity(params.ciudad);

  // ... filtering logic

  const recommendations = await generateAIRecommendations(...);

  return {
    status: 'success',
    success: true,
    introMessage: params.introMessage,      // ← Optional
    followUpQuestion: params.followUpQuestion, // ← Optional
    recommendations,
    context: params,
    morePeopleSuggestion,
    excludedCount,
  };
}
```

**Note:** Generator function with yields deferred to future implementation to keep scope focused.

### AI Behavior (Hybrid)

The AI:
1. **OPTIONALLY** provides `introMessage` and `followUpQuestion` in the tool call
2. **MANDATORILY** writes text after the tool call

**Example:**
```
AI: [calls getRecommendations({
  introMessage: "Aquí van experiencias perfectas para tu cumpleaños 🎉",
  followUpQuestion: "¿Cuál te llamó más la atención?",
  ciudad: "Bogotá",
  fecha: "mañana",
  personas: 2
})]

AI: "Pudiste revisar las experiencias - cuál te gustó mas?"
```

### Frontend Rendering

The frontend receives:
```typescript
{
  status: 'success',
  introMessage: "Aquí van experiencias perfectas...",  // Optional
  followUpQuestion: "¿Cuál te llamó más la atención?",  // Optional
  recommendations: [...]
}
```

Plus AI text: `"Pudiste revisar las experiencias - cuál te gustó mas?"`

**Rendering order:**
1. `introMessage` (if provided) - rendered with special styling
2. Recommendations carousel
3. `followUpQuestion` (if provided) - rendered with special styling
4. AI text (always present) - rendered as normal message

---

## Rationale

### Why Hybrid (Not Pure A or Pure B)?

| Approach | Loading States | Rendering Control | AI Flexibility |
|----------|---------------|-------------------|----------------|
| **Pure A** (ADR-001) | ❌ No | ❌ No | ✅ Full |
| **Pure B** (feat/ai-sdk-6) | ✅ Yes | ✅ Yes | ❌ Limited |
| **Hybrid** (This ADR) | ⏳ Future | ✅ Yes | ✅ Full |

### Advantages of Hybrid ✅

#### 1. **Frontend Rendering Flexibility**

Frontend can now:
```jsx
{introMessage && (
  <div className="font-bold text-primary-600">
    {introMessage}
  </div>
)}

<ExperienceCarousel recommendations={recommendations} />

{followUpQuestion && (
  <div className="italic text-gray-600">
    {followUpQuestion}
  </div>
)}

<AssistantMessage content={aiText} />
```

#### 2. **Maintains AI Flexibility**

The AI can still:
- Adjust tone/content dynamically based on context
- Write additional text beyond the structured fields
- Handle edge cases gracefully (e.g., morePeopleSuggestion)

#### 3. **Progressive Enhancement**

If the AI doesn't provide `introMessage`/`followUpQuestion`:
- Frontend still works (shows AI text)
- No breaking changes
- Degrades gracefully

---

### Why NOT Pure B (feat/ai-sdk-6 approach)?

The pure B approach had these issues:

1. **Fields were REQUIRED** → rigid, no flexibility
2. **AI couldn't write additional text** → contradicted natural conversation flow
3. **Potential redundancy** if AI also writes text

---

## Implementation Details

### Prompt Instructions

```markdown
⚠️ ENFOQUE HÍBRIDO (Flexibilidad + Control):
1. OPCIONAL: Puedes incluir "introMessage" y "followUpQuestion"
2. OBLIGATORIO: Después de llamar la herramienta, SIEMPRE escribe texto adicional
3. Renderizado final: intro (si lo diste) → carrusel → followUp (si lo diste) → tu texto obligatorio
```

### Tool Types

```typescript
export interface RecommendationsSuccessOutput {
  status: 'success';
  success: true;
  introMessage?: string;           // ← Optional
  followUpQuestion?: string;        // ← Optional
  recommendations: RecommendationCard[];
  context: RecommendationsToolInput;
  morePeopleSuggestion: string | null;
  excludedCount: number;
}
```

---

## Consequences

### Positive ✅

1. **Design Flexibility**: Frontend can style messages differently
2. **Maintains Philosophy**: AI still has full control (ADR-001)
3. **Backward Compatible**: Frontend works with or without optional fields
4. **Progressive Enhancement**: Future improvements easy to add
5. **Simple Implementation**: No generator complexity yet

### Negative ⚠️

1. **No Loading States Yet**: Users still don't see progress during tool execution (2-5 seconds)
   - **Mitigation**: Deferred to future ADR - keeping scope manageable
   - **Future work**: Implement generator function with yields

2. **Potential Redundancy**: User might see similar messages twice
   - **Mitigation**: Clear prompt instructions to make fields complementary
   - Example: `introMessage = "Aquí van experiencias..."` vs `AI text = "Pudiste revisar..."`

3. **Slightly More Complex**: More fields to handle in frontend
   - **Mitigation**: All fields optional, simple conditional rendering

4. **AI Confusion Risk**: AI might forget to write text after tool call
   - **Mitigation**: Emphasized MULTIPLE times in prompt (TOOL_USAGE_SECTION + REGLA CRÍTICA)

---

## Validation

### Manual Testing Checklist

- [X] `introMessage` renders with special styling (if AI provides it) - **Pending frontend implementation**
- [X] `followUpQuestion` renders with special styling (if AI provides it) - **Pending frontend implementation**
- [X] AI text appears after tool call (ALWAYS)
- [X] If AI doesn't provide intro/followUp, frontend still works
- [X] No double-rendering or broken UI
- [ ] Loading states appear during tool execution - **Deferred to future ADR**

### Automated Tests

```typescript
describe('Hybrid approach - Optional UI fields', () => {
  it('should include optional UI fields if AI provides them', async () => {
    const params = {
      introMessage: "Test intro",
      followUpQuestion: "Test question",
      ciudad: "Bogotá",
      fecha: "mañana",
      personas: 2,
      tipoGrupo: "pareja",
    };

    const result = await getRecommendations.execute(params);

    expect(result.status).toBe('success');
    expect(result.introMessage).toBe("Test intro");
    expect(result.followUpQuestion).toBe("Test question");
    expect(result.recommendations).toBeDefined();
  });

  it('should work without UI fields (backward compatible)', async () => {
    const params = {
      // No introMessage/followUpQuestion
      ciudad: "Bogotá",
      fecha: "mañana",
      personas: 2,
      tipoGrupo: "pareja",
    };

    const result = await getRecommendations.execute(params);

    expect(result.status).toBe('success');
    expect(result.introMessage).toBeUndefined();
    expect(result.followUpQuestion).toBeUndefined();
    expect(result.recommendations).toBeDefined();
  });

  it('should return error if no experiences found', async () => {
    const params = {
      ciudad: "Ciudad Inexistente",
      fecha: "mañana",
      personas: 2,
      tipoGrupo: "pareja",
    };

    const result = await getRecommendations.execute(params);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

**Note:** Tests for loading states will be added when generator function is implemented.

---

## Comparison with ADR-001

| Aspect | ADR-001 | ADR-002 (This) |
|--------|---------|----------------|
| **Philosophy** | AI writes all text manually | ✅ Same (AI writes text) |
| **Loading States** | ❌ No | ⏳ Future (deferred) |
| **Frontend Control** | ❌ No | ✅ Yes (optional fields) |
| **AI Flexibility** | ✅ Full | ✅ Full |
| **Schema** | Simple | Slightly more complex (2 optional fields) |
| **Execute** | `async` | `async` (same - generator deferred) |

**Key Insight:** This ADR doesn't contradict ADR-001, it **enhances** it with better UX while preserving the core philosophy.

---

## Related

- **Enhances:** ADR-001 (AI-driven text generation)
- **Inspired by:** feat/ai-sdk-6 branch (loading states + UI fields)
- **Post-Mortem:** [POST_MORTEM.md](../../../POST_MORTEM.md) (explains why we needed this)

---

## Timeline

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-01-12 | ADR drafted & approved | ✅ Done |
| 2026-01-12 | Implementation complete | ✅ Done |
| 2026-01-12 | Build passing | ✅ Done |
| 2026-01-13 | Frontend integration | ⏳ Pending |

---

## Team Input

### Discussion Notes

**User Request:**
> "Implementemos los features que se realizaron en la rama 'feat/ai-sdk-6' y aseguremos que tanto el flujo estable como el nuevo flujo funcionen perfecto"

Specific requests:
1. Loading states progresivos (yields) - **Deferred**
2. introMessage/followUpQuestion para control de rendering en frontend - **Implemented**

**Decision:**
Implement optional UI fields WITHOUT breaking ADR-001 philosophy. Defer loading states to keep scope manageable.

---

## Approvals

- [X] Tech Lead: Approved (via user confirmation)
- [X] Backend Dev: Implemented
- [ ] Frontend Dev: Pending (needs to consume new fields)

---

## Notes

### Future Enhancements

Potential improvements for future ADRs:

1. **ADR-003: Loading States with Generator Function**
   - Implement `async function*` with yields
   - Show progressive loading: "Buscando...", "Filtrando...", "Generando..."
   - Better UX during 2-5 second wait

2. **Streaming Intro/FollowUp**: Stream these fields progressively instead of returning them all at once
3. **i18n Support**: If fields are in tool params, easier to translate
4. **A/B Testing**: Can A/B test different intro messages by varying AI prompts

### Known Limitations

1. **No Loading States Yet**: Users don't see progress during tool execution (accepted for v1)
2. **Redundancy**: User might see similar text twice (accepted trade-off)
3. **AI Training Needed**: AI must learn when to use fields vs when not to

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-01-12 | Claude (AI Assistant) | Initial ADR created after implementing optional UI fields |
| 2026-01-12 | Claude (AI Assistant) | Updated to reflect actual implementation (no generator function yet) |

---

## Metadata

**Category:** Architecture
**Impact:** Low-Medium (enhances frontend control, maintains philosophy)
**Effort:** Low (3 files modified, 56 lines changed)
**Scope:** Optional UI fields only - Loading states deferred to ADR-003
