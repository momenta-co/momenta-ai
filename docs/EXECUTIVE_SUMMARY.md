# Resumen Ejecutivo: Resolución de Conflicto Arquitectónico

**Para:** Equipo de Desarrollo, Product Owner, Tech Lead
**De:** Análisis Post-Mortem
**Fecha:** 2026-01-12
**Prioridad:** 🔴 ALTA

---

## 📌 TL;DR (Too Long; Didn't Read)

Dos ramas (`feat/tune-chat-prompt` y `feat/ai-sdk-6`) implementaron la misma funcionalidad con enfoques arquitectónicos **incompatibles**, resultando en código inconsistente en `dev`. Resolvimos eligiendo un enfoque único y eliminando el otro, pero **perdimos ~15 horas de trabajo**.

**Lección Principal:** 🚨 **Documentar decisiones arquitectónicas ANTES de implementar** 🚨

---

## 🎯 ¿Qué Pasó?

### El Problema

```
feat/tune-chat-prompt:     ✅ Merge a dev (PR #14)
  └─ AI escribe texto DESPUÉS del tool call
  └─ Schema SIN introMessage/followUpQuestion

feat/ai-sdk-6:            ✅ Merge a dev (PR #15)
  └─ AI pone texto DENTRO del tool call
  └─ Schema CON introMessage/followUpQuestion (requeridos)

Resultado en dev:         ❌ INCONSISTENTE
  ├─ Prompt dice: "NO escribas texto después"
  ├─ Prompt dice: "SIEMPRE escribe texto después"  ← CONTRADICCIÓN
  ├─ Schema requiere campos que el prompt dice no usar
  └─ Generator function innecesaria
```

### La Decisión

Después de análisis, elegimos el enfoque de **`feat/tune-chat-prompt`** porque:
- ✅ Más flexible para el AI
- ✅ Más simple (menos campos)
- ✅ Evita redundancia
- ✅ Mejor para futuro multilingüe

**Costo:** 70 líneas eliminadas, ~15 horas desperdiciadas

---

## 💸 Impacto

| Métrica | Valor |
|---------|-------|
| Tiempo de desarrollo perdido | ~11-15 horas |
| Líneas de código eliminadas | 70 líneas |
| Archivos afectados | 3 archivos |
| PRs involucrados | 2 PRs |
| Tiempo de resolución | 2 horas |

---

## 🔍 Causas Raíz (Top 3)

### 1️⃣ Falta de Comunicación
- Dos equipos trabajando en paralelo
- No sabían que el otro estaba modificando lo mismo
- Sin daily standup efectivo

### 2️⃣ Sin ADR (Architecture Decision Record)
- No había documentación de "por qué X enfoque"
- Cada equipo tomó decisiones independientes
- No había "source of truth"

### 3️⃣ Code Review Superficial
- PR aprobado sin detectar contradicciones evidentes
- No hay checklist para cambios arquitectónicos
- Revisor no probó localmente

---

## ✅ Acciones Correctivas Implementadas (HOY)

### Documentos Creados

1. **POST_MORTEM.md** - Análisis completo del incidente
2. **ADR-001** - Decisión arquitectónica documentada (debió existir antes)
3. **PR Template** - Checklist estricto para futuras PRs

### Cambios en el Código

- ✅ Eliminado enfoque `feat/ai-sdk-6` completamente
- ✅ Implementado enfoque puro `feat/tune-chat-prompt`
- ✅ Verificado build exitoso
- ✅ Prompts consistentes con schema

---

## 🎯 Acciones Requeridas (Equipo)

### 🔴 CRÍTICO (Esta Semana)

**1. Revisar y Aprobar ADR-001**
- **Quien:** Tech Lead + 2 Senior Devs
- **Deadline:** Miércoles 2026-01-13
- **Dónde:** `/docs/architecture/decisions/001-getrecommendations-approach.md`

**2. Implementar Contract Tests**
- **Quien:** QA Lead + Backend Dev
- **Deadline:** Viernes 2026-01-15
- **Qué:** Tests que verifiquen consistencia schema ↔ prompts

**3. Adoptar PR Template**
- **Quien:** Todos los devs
- **Desde:** Inmediato (próximo PR)
- **Dónde:** `.github/PULL_REQUEST_TEMPLATE.md`

### 🟡 IMPORTANTE (Este Mes)

**4. Establecer ADR Process**
- **Quien:** Engineering Manager
- **Deadline:** 2026-01-20
- **Qué:** Proceso obligatorio para cambios arquitectónicos

**5. Configurar Feature Flags**
- **Quien:** DevOps
- **Deadline:** 2026-01-25
- **Por qué:** Probar enfoques diferentes sin commits permanentes

**6. Mejorar Daily Standups**
- **Quien:** Scrum Master
- **Desde:** Lunes próximo
- **Agregar:** "¿Qué parte del código estás modificando?"

---

## 📊 Cómo Mediremos Éxito

### Métricas (próximos 3 meses)

| KPI | Baseline | Target |
|-----|----------|--------|
| Conflictos arquitectónicos | 2/2 PRs (100%) | < 10% de PRs |
| PRs con ADR cuando necesario | 0% | 100% |
| Tiempo promedio de branch | 2-3 semanas | < 1 semana |
| Contract tests coverage | 0% | > 80% |

### Revisión Mensual

- Tech Lead revisará progreso cada mes
- Ajustaremos proceso según necesidad

---

## 🎓 Lecciones Principales

### ✨ Para Desarrolladores

> **"Si vas a cambiar arquitectura, primero escribe el ADR."**

- ADR = Architecture Decision Record
- Documenta: Contexto, Decisión, Alternativas, Consecuencias
- Comparte ANTES de implementar

### ✨ Para Code Reviewers

> **"Un merge exitoso ≠ integración exitosa."**

- Git puede fusionar código lógicamente incompatible
- Busca contradicciones en PRs grandes
- Si dudas, pide al autor probar localmente

### ✨ Para Tech Leads

> **"Visibilidad previene duplicación."**

- Kanban board visible para todos
- Daily standups efectivos
- Slack notifications de cambios mayores

---

## 📚 Recursos Disponibles

| Documento | Ubicación | Para Quién |
|-----------|-----------|------------|
| Post-Mortem Completo | `/POST_MORTEM.md` | Todos (lectura obligatoria) |
| ADR-001 | `/docs/architecture/decisions/001-*` | Devs que toquen AI tools |
| PR Template | `/.github/PULL_REQUEST_TEMPLATE.md` | Todos (usar en cada PR) |
| ADR Template | `/docs/architecture/decisions/000-template.md` | Tech Leads |

---

## 🤝 Próximos Pasos

### Esta Semana

**Lunes:**
- [ ] Tech Lead presenta esto en team meeting
- [ ] Todos leen POST_MORTEM.md (15 min)

**Miércoles:**
- [ ] Review y approval de ADR-001
- [ ] Discusión: ¿Qué otros ADRs necesitamos?

**Viernes:**
- [ ] Implementar primeros contract tests
- [ ] Retrospectiva: ¿Qué aprendimos?

### Próximo Sprint

- [ ] Setup feature flags infrastructure
- [ ] Crear ADR-002, ADR-003 (según necesidad)
- [ ] Training session: "Cómo escribir buenos ADRs"

---

## ❓ Preguntas Frecuentes

### ¿Por qué no dejamos ambos enfoques?

**R:** Eran mutuamente excluyentes. El schema no puede al mismo tiempo:
- Requerir `introMessage` (enfoque B)
- No tener `introMessage` (enfoque A)

### ¿Podemos revertir esta decisión?

**R:** Sí, pero:
1. Necesitaríamos escribir un nuevo ADR explicando por qué
2. Implementar el cambio cuidadosamente
3. Migrar prompts, tests, frontend

El ADR no es ley inmutable, pero cambios requieren proceso formal.

### ¿Qué pasa si no sigo el PR template?

**R:** El PR template es **obligatorio** a partir de ahora. Los reviewers pueden rechazar PRs que no lo completen.

### ¿Cada cambio necesita un ADR?

**R:** No. Solo cambios arquitectónicos significativos:
- ✅ Necesita ADR: Cambiar enfoque fundamental de un tool
- ✅ Necesita ADR: Agregar nueva infraestructura (feature flags, cache, etc.)
- ❌ No necesita ADR: Fix de bug
- ❌ No necesita ADR: Cambio de texto en UI

En duda, pregunta al Tech Lead.

---

## 🙏 Agradecimientos

Gracias a todos por la paciencia durante la resolución. Este tipo de problemas nos hacen mejores como equipo.

**Recuerden:** El objetivo del post-mortem NO es asignar culpa, sino **aprender y mejorar**.

---

## 📞 Contacto

**Preguntas sobre este documento:**
- Tech Lead: [email/slack]
- Engineering Manager: [email/slack]

**Sugerencias para mejorar el proceso:**
- Canal Slack: #dev-process-improvement
- O: Meeting 1-on-1 con Tech Lead

---

*Última actualización: 2026-01-12*

**Estado:** ✅ Incidente resuelto, mejoras en progreso
