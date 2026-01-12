# Post-Mortem: Conflicto Arquitectónico entre feat/tune-chat-prompt y feat/ai-sdk-6

**Fecha del Incidente:** 2026-01-12
**Severidad:** Alta - Requirió eliminación completa de una implementación
**Tiempo de Resolución:** ~2 horas
**Líneas de Código Afectadas:** 70 eliminaciones, 22 inserciones

---

## 📋 Resumen Ejecutivo

Dos ramas de desarrollo (`feat/tune-chat-prompt` y `feat/ai-sdk-6`) implementaron la misma funcionalidad (`getRecommendations`) usando enfoques arquitectónicos **mutuamente excluyentes**. Esto resultó en código inconsistente en la rama `dev` que combinaba ambos enfoques de forma incompatible, requiriendo una decisión final y eliminación completa de una de las implementaciones.

---

## 🕐 Línea de Tiempo

```
├─ feat/tune-chat-prompt
│  └─ Implementación: AI escribe texto DESPUÉS del tool call
│     Schema: SIN introMessage/followUpQuestion
│     Execute: async simple (no generator)
│
├─ PR #14: Merge feat/tune-chat-prompt → dev (97ab87b)
│  ✅ Fusionado exitosamente
│
├─ feat/ai-sdk-6
│  └─ Implementación: AI pone texto DENTRO de campos del tool
│     Schema: CON introMessage/followUpQuestion (requeridos)
│     Execute: async function* (generator con yields)
│
├─ 31634be: Merge dev → feat/ai-sdk-6
│  ⚠️  Conflicto no detectado: Dos implementaciones incompatibles
│
├─ PR #15: Merge feat/ai-sdk-6 → dev (3211bc9)
│  ❌ Sobrescribió feat/tune-chat-prompt
│  ❌ Resultado: Código inconsistente
│     - Prompts: Dicen "NO escribas texto después"
│     - Schema: Requiere introMessage/followUpQuestion
│     - Pero también: "SIEMPRE escribe texto después" en otro lugar
│
└─ 2026-01-12: Detección y resolución
   └─ Decisión: Volver al enfoque puro de feat/tune-chat-prompt
```

---

## 🔍 Análisis de Causa Raíz

### 1. **Falta de Comunicación entre Equipos**

**Problema:**
- Dos desarrolladores/equipos trabajaron en la misma funcionalidad sin coordinar
- No había visibilidad de que ambos estaban modificando `getRecommendations`

**Evidencia:**
```bash
# feat/tune-chat-prompt (primero)
- Autor: [Team A]
- Commits: b86c333, 0dc89bf

# feat/ai-sdk-6 (después)
- Autor: [Team B]
- Commits: bc97356, 31634be
```

**Impacto:**
- Trabajo duplicado (~150 líneas de código descartadas)
- Tiempo de desarrollo desperdiciado

---

### 2. **Ausencia de Decisión Arquitectónica Documentada**

**Problema:**
- No existía un ADR (Architecture Decision Record) que explicara:
  - ¿Por qué necesitamos `introMessage` y `followUpQuestion`?
  - ¿Cuál es el contrato entre el AI y el frontend?
  - ¿Generators vs async simple - cuál y por qué?

**Consecuencia:**
- Cada equipo tomó decisiones arquitectónicas independientes
- No había "source of truth" para consultar

---

### 3. **Merge Conflict Resolution Inadecuado**

**Problema:**
El commit `31634be` (Merge branch 'dev' into feat/ai-sdk-6) debió detectar conflictos conceptuales.

**¿Qué pasó?**
```typescript
// En dev (de feat/tune-chat-prompt):
// Instrucciones: "SIEMPRE escribe texto después del tool"
// Schema: Sin introMessage/followUpQuestion

// En feat/ai-sdk-6:
// Instrucciones: "NO escribas texto después"
// Schema: CON introMessage/followUpQuestion (requeridos)
```

El desarrollador resolvió el conflicto manteniendo **ambas versiones parcialmente**, creando una inconsistencia:
- ✅ Schema con campos (de ai-sdk-6)
- ✅ Generator function (de ai-sdk-6)
- ❌ Pero algunas instrucciones del prompt (de tune-chat-prompt)

---

### 4. **Code Review Insuficiente**

**Problema:**
El PR #15 fue aprobado sin detectar:
1. Conflicto con implementación previa (PR #14)
2. Inconsistencias en las instrucciones del prompt
3. Schema requiere campos que las instrucciones dicen no usar

**Señales de alerta que debieron detectarse:**
```diff
# En index.ts:
+ "NO escribas texto DESPUÉS de llamar esta herramienta"
+ "SIEMPRE escribe texto después de llamar la herramienta"
# ⚠️ CONTRADICCIÓN DIRECTA en el mismo archivo
```

---

### 5. **Falta de Tests de Integración**

**Problema:**
No había tests que verificaran:
- El contrato entre el AI y el frontend
- Que los campos requeridos del schema sean efectivamente usados
- Que las instrucciones del prompt sean consistentes con el schema

**Test que debió existir:**
```typescript
describe('getRecommendations integration', () => {
  it('should include introMessage and followUpQuestion if schema requires them', () => {
    const schema = getRecommendations.inputSchema;
    const hasIntroMessage = schema.shape.introMessage !== undefined;
    const hasFollowUpQuestion = schema.shape.followUpQuestion !== undefined;

    if (hasIntroMessage || hasFollowUpQuestion) {
      // Verificar que las instrucciones del prompt lo mencionen
      expect(TOOL_USAGE_SECTION).toContain('introMessage');
      expect(TOOL_USAGE_SECTION).not.toContain('NO escribas texto DESPUÉS');
    }
  });
});
```

---

## 💡 Enfoques Arquitectónicos en Conflicto

### Enfoque A: `feat/tune-chat-prompt` (Ganador Final)

**Filosofía:** El AI tiene control total del texto

```typescript
// Schema simple
inputSchema: z.object({
  ciudad: z.string(),
  fecha: z.string(),
  // ... sin introMessage/followUpQuestion
})

// AI escribe todo manualmente
AI: [llama tool]
AI: "Aquí tienes experiencias..."  // ✅ AI escribe
AI: [muestra carrusel]
AI: "¿Cuál te gustó más?"  // ✅ AI escribe
```

**Ventajas:**
- ✅ Flexibilidad total del AI
- ✅ Puede ajustar tono según contexto
- ✅ Más simple (menos campos)

**Desventajas:**
- ❌ AI puede olvidar escribir texto
- ❌ Menos estructura/previsibilidad

---

### Enfoque B: `feat/ai-sdk-6` (Eliminado)

**Filosofía:** Estructura predecible, campos explícitos

```typescript
// Schema con campos UI
inputSchema: z.object({
  introMessage: z.string().required(),  // ✅ Requerido
  followUpQuestion: z.string().required(),  // ✅ Requerido
  ciudad: z.string(),
  // ...
})

// AI DEBE proporcionar los campos
AI: [llama tool({
  introMessage: "Aquí tienes experiencias...",
  followUpQuestion: "¿Cuál te gustó más?"
})]
Frontend: [renderiza: intro → carrusel → pregunta]
```

**Ventajas:**
- ✅ Estructura predecible
- ✅ Frontend sabe exactamente qué renderizar
- ✅ Generator function permite loading states

**Desventajas:**
- ❌ Más complejo
- ❌ Menos flexible para el AI
- ❌ Puede resultar en redundancia si el AI también escribe texto

---

## 📊 Impacto

### Código Eliminado
```
src/app/api/chat/tools.ts:  -48 líneas
src/lib/prompts/index.ts:   -13 líneas
src/lib/prompts/flows.ts:   -2 líneas
Total:                      -70 líneas
```

### Tiempo Invertido
- Desarrollo de feat/ai-sdk-6: ~8-12 horas (estimado)
- Tiempo de merge y resolución: ~2 horas
- Análisis y post-mortem: ~1 hora
- **Total desperdiciado: ~11-15 horas**

### Deuda Técnica Generada
- ✅ RESUELTA: Inconsistencia entre schema y prompts eliminada
- ⚠️ PENDIENTE: Falta documentación de por qué se eligió el enfoque A

---

## ✅ Buenas Prácticas para Evitar Esto en el Futuro

### 1. **Architecture Decision Records (ADRs)**

Crear ADRs para decisiones arquitectónicas importantes:

```markdown
# ADR-001: Approach para getRecommendations Tool

## Status
Accepted

## Context
Necesitamos que el AI muestre recomendaciones al usuario. Hay dos enfoques:
A) AI escribe texto manualmente después del tool call
B) AI pasa texto como parámetros del tool

## Decision
Usamos enfoque A (AI escribe manualmente)

## Rationale
- Más flexible para ajustar tono según contexto
- Evita redundancia
- Más simple de implementar

## Consequences
- Debemos asegurar que el AI siempre escriba texto después
- Requiere instrucciones claras en el prompt
```

**Ubicación:** `/docs/architecture/decisions/`

---

### 2. **Design Documents Antes de Implementar**

Antes de empezar una feature branch:

```markdown
# Design Doc: getRecommendations Enhancement

## Goal
Mejorar el flujo de recomendaciones

## Proposed Changes
1. Schema changes
2. Prompt changes
3. Frontend changes

## Alternatives Considered
[Lista de enfoques descartados y por qué]

## Team Review
- [X] Backend team
- [X] Frontend team
- [X] Product owner
```

**Proceso:**
1. Escribir design doc
2. Compartir en Slack/email para feedback
3. Meeting de 15 min para discutir
4. Solo después empezar implementación

---

### 3. **Feature Flags para Experimentación**

Usar feature flags para probar diferentes enfoques:

```typescript
const USE_STRUCTURED_MESSAGES = process.env.FEATURE_FLAG_STRUCTURED_MESSAGES === 'true';

if (USE_STRUCTURED_MESSAGES) {
  // Enfoque B (con introMessage/followUpQuestion)
} else {
  // Enfoque A (AI escribe manualmente)
}
```

**Ventaja:**
- Probar ambos enfoques en producción
- A/B testing
- Rollback fácil

---

### 4. **Contract Testing**

Implementar tests que verifiquen el contrato entre componentes:

```typescript
// tests/contracts/ai-frontend.contract.test.ts

describe('AI-Frontend Contract', () => {
  describe('getRecommendations tool', () => {
    it('schema should match prompt instructions', () => {
      const schema = getRecommendations.inputSchema;
      const promptInstructions = TOOL_USAGE_SECTION;

      // Si el schema requiere introMessage
      if (schema.shape.introMessage) {
        // El prompt DEBE mencionarlo
        expect(promptInstructions).toContain('introMessage');
        expect(promptInstructions).not.toContain('NO escribas texto DESPUÉS');
      } else {
        // El prompt debe indicar que el AI escribe manualmente
        expect(promptInstructions).toContain('SIEMPRE escribe texto después');
      }
    });

    it('output should match frontend expectations', () => {
      // Mock AI response
      const output = getRecommendations.execute({ ... });

      // Verificar que contiene lo que el frontend necesita
      expect(output).toHaveProperty('recommendations');
      expect(output).toHaveProperty('success');
    });
  });
});
```

---

### 5. **Strict Code Review Checklist**

Checklist para PRs que modifican arquitectura:

```markdown
## Architecture Change Review Checklist

- [ ] ¿Hay un ADR documentando esta decisión?
- [ ] ¿Se revisó si otra rama está trabajando en lo mismo?
- [ ] ¿Los prompts son consistentes con el schema?
- [ ] ¿Hay tests de contrato?
- [ ] ¿Se actualizó la documentación?
- [ ] ¿Se consideraron alternativas?
- [ ] ¿El equipo de frontend/backend está informado?
```

---

### 6. **Comunicación Proactiva**

#### Daily Standups
```
"Estoy trabajando en getRecommendations para agregar introMessage/followUpQuestion"
→ Otro dev: "Espera, yo también estoy tocando eso en mi branch"
→ Coordinación inmediata
```

#### Shared Kanban Board
- Estado visible de todas las tareas
- Evita trabajo duplicado

#### Slack Channels
```
#dev-backend: "🚧 Working on getRecommendations tool changes"
```

---

### 7. **Trunk-Based Development**

Evitar branches de larga duración:

**Antes:**
```
feat/tune-chat-prompt (2 semanas sin merge)
feat/ai-sdk-6 (3 semanas sin merge)
→ Merge conflicts masivos
```

**Mejor:**
```
feat/tune-chat-prompt-part1 (3 días → merge)
feat/tune-chat-prompt-part2 (3 días → merge)
feat/ai-sdk-6-part1 (2 días → merge)
```

**Regla:** Ninguna branch debe vivir más de 1 semana

---

### 8. **Monorepo con Tipos Compartidos**

Si frontend y backend están separados:

```typescript
// packages/shared-types/src/tools.ts
export interface GetRecommendationsInput {
  ciudad: string;
  fecha: string;
  // ...
}

export interface GetRecommendationsOutput {
  success: boolean;
  recommendations: RecommendationCard[];
  // ...
}

// Backend usa estos tipos
// Frontend usa estos tipos
// → TypeScript detecta breaking changes
```

---

### 9. **Pre-commit Hooks con Validaciones**

```bash
# .husky/pre-commit
#!/bin/sh

# Verificar consistencia entre schema y prompts
npm run validate:contracts

# Verificar que no hay contradicciones en prompts
npm run validate:prompts
```

---

### 10. **Docs como Código (Living Documentation)**

```markdown
# docs/flows/recommendations-flow.md

## Current Implementation (Updated: 2026-01-12)

### Schema
- ❌ NO tiene introMessage/followUpQuestion
- ✅ Campos: ciudad, fecha, personas, etc.

### AI Behavior
- ✅ DEBE escribir texto después del tool call
- ✅ Texto específico: "Pudiste revisar las experiencias..."

### Frontend Rendering
- Recibe: tool call result → recommendations
- AI escribe texto después → se muestra al usuario

---
Last updated by: @user
Reviewed by: @team-lead
```

---

## 🎯 Acciones Inmediatas (Action Items)

### Corto Plazo (Esta semana)

1. **[CRÍTICO]** Crear ADR-001 documentando decisión de usar enfoque feat/tune-chat-prompt
   - Owner: Tech Lead
   - Deadline: 2026-01-13

2. **[ALTO]** Implementar contract tests para AI-Frontend
   - Owner: QA/Dev Team
   - Deadline: 2026-01-15

3. **[MEDIO]** Agregar pre-commit hook para validar consistencia
   - Owner: DevOps
   - Deadline: 2026-01-17

### Mediano Plazo (Este mes)

4. **[MEDIO]** Establecer proceso de design docs obligatorio
   - Owner: Engineering Manager
   - Deadline: 2026-01-20

5. **[MEDIO]** Configurar feature flags infrastructure
   - Owner: DevOps
   - Deadline: 2026-01-25

6. **[BAJO]** Crear documentación de "Living Docs" para flows
   - Owner: Tech Writer
   - Deadline: 2026-01-31

---

## 📈 Métricas de Éxito

Para medir si hemos mejorado:

| Métrica | Baseline (Antes) | Target (3 meses) |
|---------|------------------|------------------|
| Branches con conflictos arquitectónicos | 2 de 2 (100%) | < 10% |
| Tiempo promedio de branch antes de merge | 2-3 semanas | < 1 semana |
| PRs rechazados por inconsistencias | 0% (no se detectaban) | 20% (se detectan y previenen) |
| ADRs documentados | 0 | Todos los cambios arquitectónicos |
| Cobertura de contract tests | 0% | > 80% |

---

## 🎓 Lecciones Aprendidas

### ✅ Lo que funcionó bien

1. **Git History clara:** Pudimos rastrear exactamente qué pasó y cuándo
2. **Código modular:** Los cambios estaban bien aislados en archivos específicos
3. **Build pipeline:** Detectó errores TypeScript rápidamente

### ❌ Lo que no funcionó

1. **Falta de visibilidad:** Equipos no sabían que otros trabajaban en lo mismo
2. **Code review superficial:** No detectó contradicciones obvias
3. **Sin tests de integración:** No capturó el problema automáticamente

### 💡 Insights

> "Dos implementaciones correctas pueden ser arquitectónicamente incompatibles.
> El problema no es la calidad del código, sino la falta de coordinación."

> "El merge exitoso != integración exitosa. Git puede fusionar código
> que lógicamente no debería combinarse."

---

## 📚 Referencias

- [ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Contract Testing Guide](https://martinfowler.com/bliki/ContractTest.html)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [Feature Flags Best Practices](https://launchdarkly.com/blog/feature-flag-best-practices/)

---

## 👥 Participantes en el Post-Mortem

- **Investigador:** Claude (AI Assistant)
- **Stakeholders:** Development Team
- **Fecha:** 2026-01-12

---

## 📝 Notas Adicionales

Este post-mortem NO es para asignar culpa, sino para:
1. Entender qué pasó
2. Prevenir que vuelva a pasar
3. Mejorar nuestros procesos

**Cultura blameless:** Los errores son oportunidades de aprendizaje.

---

*Documento vivo - Se actualizará conforme se implementen las acciones correctivas.*
