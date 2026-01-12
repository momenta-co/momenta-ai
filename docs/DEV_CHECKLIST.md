# Developer Quick Reference Checklist

**📌 Pin this! Use before cada PR y cambio arquitectónico**

---

## 🚀 Before Starting Implementation

### ☑️ Planning Phase

- [ ] **Check Kanban Board:** ¿Alguien más está trabajando en esto?
- [ ] **Slack Announcement:** Anuncio en #dev qué voy a modificar
  ```
  🚧 Working on: [Feature]
  📁 Files: [Lista de archivos principales]
  ⏱️ ETA: [Estimado]
  ```
- [ ] **Branch from Latest:** `git pull origin dev && git checkout -b feat/xxx`
- [ ] **Read Related ADRs:** ¿Hay decisiones arquitectónicas relevantes?

### ☑️ Architecture Changes Only

- [ ] **Write Design Doc** (share in Slack for feedback)
- [ ] **Create ADR Draft** (if changing fundamental design)
- [ ] **Get Buy-in:** Mini meeting (15 min) con tech lead + 1-2 devs

---

## 💻 During Implementation

### ☑️ Code Quality

- [ ] **TypeScript:** No `any`, todo tipado correctamente
- [ ] **ESLint:** No warnings (run `npm run lint`)
- [ ] **No Dead Code:** Eliminar código comentado
- [ ] **No Console.logs:** Excepto en dev
- [ ] **Comments:** Solo donde lógica no es obvia

### ☑️ AI/LLM Changes (Prompts, Tools)

- [ ] **Schema ↔ Prompt Match:**
  ```bash
  # Si schema tiene campo X:
  grep -r "X" src/lib/prompts/
  # ↑ Debe mencionarse en prompts
  ```

- [ ] **No Contradictions:**
  ```bash
  # Buscar contradicciones
  grep -i "NO escribas" src/lib/prompts/
  grep -i "SIEMPRE escribe" src/lib/prompts/
  # ↑ ¿Están contradiciendo?
  ```

- [ ] **Clear Instructions:** El AI podría entenderlas sin contexto?
- [ ] **Examples Included:** Al menos 1 ejemplo en el prompt

### ☑️ Testing

- [ ] **Unit Tests:** Nuevos tests para nueva funcionalidad
- [ ] **Integration Tests:** Si cambié contratos (tool schemas, APIs)
- [ ] **Manual Test:** Probé el flujo completo end-to-end
- [ ] **Build Passes:** `npm run build` sin errores

---

## 📝 Before Creating PR

### ☑️ Pre-PR Checklist

- [ ] **Rebase:** `git fetch origin dev && git rebase origin/dev`
- [ ] **Self Review:** Revisar mi propio diff antes de abrir PR
  ```bash
  git diff origin/dev...HEAD
  ```
- [ ] **Remove WIP/TODO:** No dejar TODOs sin resolver
- [ ] **Update Docs:** Si cambié comportamiento, actualicé README/docs
- [ ] **Commit Messages:** Son claros y descriptivos

### ☑️ PR Description

- [ ] **Complete Template:** Llenar TODO el PR template (no skip items)
- [ ] **Link Issues:** `Closes #123` o `Fixes #456`
- [ ] **Screenshots:** Si hay cambios visuales
- [ ] **Test Evidence:** Logs/screenshots mostrando que funciona

### ☑️ Architecture Changes Only

- [ ] **ADR Reference:** Link al ADR en PR description
- [ ] **Breaking Changes:** Documentados claramente
- [ ] **Migration Notes:** Si hay breaking changes

---

## 👀 Code Review (as Reviewer)

### ☑️ First Pass

- [ ] **Understand the Why:** ¿Por qué este cambio?
- [ ] **Read PR Description:** Entender contexto completo
- [ ] **Check Template:** ¿Completó todos los checkboxes?

### ☑️ Code Review

- [ ] **Logical Correctness:** ¿El código hace lo que dice?
- [ ] **Edge Cases:** ¿Consideró edge cases?
- [ ] **Performance:** ¿Introduce regresiones?
- [ ] **Security:** ¿Hay vulnerabilidades obvias?

### ☑️ For Architecture Changes

- [ ] **Read ADR:** Si hay ADR, leerlo primero
- [ ] **Question Alternatives:** "¿Por qué este approach?"
- [ ] **Think Long-term:** "¿Nos pintará en una esquina?"

### ☑️ For AI/LLM Changes

- [ ] **Read Prompts Carefully:** Línea por línea
- [ ] **Mental Test:** "Si yo fuera el AI, ¿entendería?"
- [ ] **Check Consistency:**
  ```bash
  # En el PR diff, buscar:
  # - Campos en schema vs instrucciones en prompts
  # - Instrucciones contradictorias
  ```

### ☑️ Final Check

- [ ] **Tests Pass:** CI green
- [ ] **Ask Questions:** Si algo no está claro, preguntar
- [ ] **Request Changes or Approve:** No dejar PR en limbo

---

## ✅ After Merge

### ☑️ Post-Merge Checklist

- [ ] **Monitor Deploy:** Ver logs de staging/production
- [ ] **Verify in Staging:** Probar manualmente en staging
- [ ] **Watch Metrics:** Errores, performance, etc.
- [ ] **Close Issues:** Cerrar Jira tickets relacionados
- [ ] **Update Docs:** Si prometiste en PR, hacerlo ahora
- [ ] **Notify Team:** Si hay breaking changes, avisar en Slack

---

## 🚨 Red Flags (Stop & Ask for Help)

Stop coding y pregunta al tech lead si:

- ❌ **Multiple Files Conflict:** Git muestra muchos conflictos en rebase
- ❌ **Breaking Tests:** Tests que funcionaban ahora fallan
- ❌ **Major Architecture Change:** Estás cambiando enfoque fundamental
- ❌ **Duplicate Work:** Encontraste que alguien ya hizo algo similar
- ❌ **Scope Creep:** Tu PR creció mucho más de lo planeado
- ❌ **Uncertainty:** No estás seguro si este es el approach correcto

**Mejor preguntar temprano que arreglar después.**

---

## 🔄 Daily Workflow

### Morning (Start of Day)

```bash
# 1. Pull latest
git checkout dev
git pull origin dev

# 2. Rebase your branch
git checkout feat/my-feature
git rebase dev

# 3. Check Slack for updates
# - ¿Alguien tocó mis archivos?
# - ¿Hay cambios que me afectan?
```

### During Work

```bash
# Commit frequently (pequeños commits)
git add .
git commit -m "feat: descripción clara"

# Test frequently
npm run test
npm run build
```

### End of Day

```bash
# Push para backup (aunque no esté listo el PR)
git push origin feat/my-feature

# Update Jira/Kanban con progreso
```

---

## 📊 Quick Commands

### Find Files
```bash
# Buscar archivos por nombre
find . -name "*tools*"

# Listar archivos modificados recientemente
git log --name-only --since="1 week ago"
```

### Search Code
```bash
# Buscar texto en código
grep -r "getRecommendations" src/

# Buscar en prompts específicamente
grep -r "introMessage" src/lib/prompts/

# Buscar contradicciones
grep -i "NO escribas\|NUNCA escribas" src/lib/prompts/
grep -i "SIEMPRE escribe\|DEBES escribir" src/lib/prompts/
```

### Check Consistency
```bash
# Ver todos los tool schemas
cat src/app/api/chat/tools.ts | grep "z.object"

# Ver todas las instrucciones de tools
cat src/lib/prompts/index.ts | grep "🔧"
```

---

## 🎯 Quick Decision Tree

### Should I write an ADR?

```
¿El cambio afectará el sistema por meses/años?
├─ Sí → ✅ Write ADR
└─ No → Continue

¿Estoy cambiando enfoque fundamental?
├─ Sí → ✅ Write ADR
└─ No → Continue

¿Hay múltiples formas válidas de hacer esto?
├─ Sí → ✅ Write ADR (documenta por qué elegiste una)
└─ No → Continue

¿Es solo un bug fix o feature pequeño?
├─ Sí → ❌ No ADR needed
└─ No → Maybe ADR
```

### Should I ask for help?

```
¿Llevas >2 horas stuck?
├─ Sí → ✅ Ask for help
└─ No → Continue

¿No estás seguro si es el approach correcto?
├─ Sí → ✅ Ask for help
└─ No → Continue

¿Encontraste algo inesperado/confuso?
├─ Sí → ✅ Ask for help
└─ No → Continue

¿Tu solución te parece "hacky"?
├─ Sí → ✅ Ask for help
└─ No → Continue
```

---

## 💬 Communication Templates

### Slack: Starting Work
```
🚧 Starting work on: [Feature name]
📋 Jira: PROJ-123
📁 Main files: src/app/api/chat/tools.ts, src/lib/prompts/index.ts
⏱️ ETA: 2 days
```

### Slack: Need Help
```
🆘 Need help with: [Brief description]
🔍 What I tried: [What you've done]
❓ Question: [Specific question]
📎 Context: [Link to branch/file]
```

### Slack: Breaking Change
```
⚠️ Breaking change merged in PR #123
📋 What changed: [Description]
🔧 Action needed: [What team needs to do]
📚 Migration guide: [Link]
```

---

## 📚 Resources

| Resource | Location | Use When |
|----------|----------|----------|
| ADR Template | `/docs/architecture/decisions/000-template.md` | Writing new ADR |
| PR Template | `/.github/PULL_REQUEST_TEMPLATE.md` | Creating PR |
| Post-Mortem | `/POST_MORTEM.md` | Learning from past mistakes |
| Executive Summary | `/docs/EXECUTIVE_SUMMARY.md` | Quick overview |

---

## 🎓 Remember

> "Code is written once, read many times."
> Make it easy for future you (and teammates) to understand.

> "When in doubt, ask."
> 5 minutes asking > 5 hours fixing.

> "Document decisions, not just code."
> Future developers (including you) will thank you.

---

**Questions?** Ask in #dev-help

**Last Updated:** 2026-01-12
