# Pull Request

## Description

<!-- Breve descripción de qué hace este PR -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 🏗️ Architecture change (modifies fundamental design/structure)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI update (no functional changes)

## Related Issues

<!-- Link to related issues: Closes #123, Fixes #456 -->

---

## Architecture Changes Checklist

**⚠️ REQUIRED if you checked "Architecture change" above**

- [ ] **ADR Created:** ¿Hay un ADR documentando esta decisión en `/docs/architecture/decisions/`?
- [ ] **Coordination Check:** ¿Verificaste si otra rama/persona está trabajando en la misma área?
- [ ] **Design Doc:** ¿Compartiste un design doc antes de implementar?
- [ ] **Breaking Changes:** ¿Identificaste y documentaste breaking changes?
- [ ] **Migration Plan:** Si hay breaking changes, ¿hay un plan de migración?

---

## AI/LLM Changes Checklist

**⚠️ REQUIRED if you modified prompts, tools, or AI behavior**

### Consistency Verification

- [ ] **Schema-Prompt Match:** Las instrucciones en los prompts son consistentes con el schema del tool
  - Si el schema requiere campos, el prompt debe mencionarlos
  - Si el schema NO requiere campos, el prompt NO debe indicar usarlos

- [ ] **No Contradictions:** Busqué contradicciones en las instrucciones del prompt
  - Ejemplo de contradicción: "NO escribas X" y "SIEMPRE escribe X" en el mismo archivo
  - Usé buscar/grep para verificar términos contradictorios

- [ ] **Tool Descriptions Updated:** Si cambié el schema, actualicé la descripción del tool

### Examples & Documentation

- [ ] **Prompt Examples:** Incluí ejemplos claros en las instrucciones del prompt
- [ ] **Edge Cases:** Consideré edge cases y los documenté

---

## Testing Checklist

- [ ] **Unit Tests:** Agregué/actualicé unit tests
- [ ] **Integration Tests:** Agregué/actualicé integration tests
- [ ] **Contract Tests:** Si cambié un tool, agregué contract tests (AI ↔ Frontend)
- [ ] **Manual Testing:** Probé manualmente el flujo completo
- [ ] **Build Passes:** `npm run build` pasa sin errores

### Test Evidence

<!-- Opcional: Screenshots, videos, logs mostrando que funciona -->

---

## Code Quality

- [ ] **TypeScript:** No hay errores de TypeScript
- [ ] **ESLint:** No hay warnings/errors de linting
- [ ] **No Console Logs:** Eliminé console.logs de debugging (excepto en desarrollo)
- [ ] **Comments:** Comenté código complejo donde sea necesario
- [ ] **No Dead Code:** Eliminé código comentado/no utilizado

---

## Dependencies

- [ ] **No New Dependencies:** No agregué dependencias nuevas
- [ ] **Dependencies Justified:** Si agregué dependencias, justifiqué por qué son necesarias
- [ ] **Lock File Updated:** package-lock.json está actualizado

---

## Frontend Changes (if applicable)

- [ ] **Responsive:** Verifiqué que funciona en mobile/tablet/desktop
- [ ] **Accessibility:** Consideré accesibilidad (a11y)
- [ ] **Performance:** No introduje regresiones de performance

---

## Deployment Considerations

- [ ] **Environment Variables:** ¿Requiere nuevas env vars? (documenté en README)
- [ ] **Database Migrations:** ¿Requiere migración de DB?
- [ ] **Backward Compatible:** Es backward compatible con la versión actual en producción
- [ ] **Rollback Plan:** Tengo un plan de rollback si algo sale mal

---

## Review Guidelines for Reviewers

### For Architecture Changes

1. **Check ADR:** Leer el ADR referenciado (debe existir)
2. **Verify Consistency:** Buscar contradicciones entre schema y prompts
3. **Question Alternatives:** "¿Por qué este enfoque y no X?"
4. **Think Long-term:** "¿Esto nos pintará en una esquina?"

### For AI/LLM Changes

1. **Read Prompts Carefully:** Las instrucciones son claras y no ambiguas
2. **Test Mentally:** "Si yo fuera el AI, ¿entendería qué hacer?"
3. **Look for Conflicts:** Buscar instrucciones contradictorias
4. **Verify Examples:** Los ejemplos en el prompt son correctos

### For All Changes

1. **Understand the Why:** Entender por qué este cambio es necesario
2. **Test Locally:** Si es posible, probar el PR localmente
3. **Ask Questions:** Si algo no está claro, preguntar

---

## Screenshots (if applicable)

<!-- Screenshots mostrando before/after, o nueva funcionalidad -->

---

## Additional Notes

<!-- Cualquier información adicional que los reviewers deban saber -->

---

## Pre-Merge Checklist (for author)

- [ ] Rebase con `dev` más reciente
- [ ] Resolvió todos los comentarios de reviewers
- [ ] CI/CD pasa (tests, build, lint)
- [ ] Al menos 1 approval de reviewer
- [ ] Squashed commits si es apropiado

---

## Post-Merge Checklist (for author)

- [ ] Monitoreé el deploy
- [ ] Verifiqué que funciona en staging/production
- [ ] Notifiqué al equipo si hay breaking changes
- [ ] Actualicé documentación relacionada
- [ ] Cerré issues relacionados

---

**Por favor, marca TODOS los checkboxes relevantes antes de request review.**

Si tienes dudas sobre algún item del checklist, pregunta en el canal de Slack #dev-help.
