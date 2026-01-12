# ADR-XXX: [Título Corto de la Decisión]

## Status

**[PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED]** - YYYY-MM-DD

<!--
PROPOSED: En discusión, no implementado aún
ACCEPTED: Aprobado y siendo implementado/ya implementado
DEPRECATED: Ya no se recomienda, pero código legacy puede usarlo
SUPERSEDED: Reemplazado por ADR-YYY
-->

---

## Context

<!--
Describe el problema o situación que requiere una decisión arquitectónica.

Preguntas a responder:
- ¿Qué problema estamos resolviendo?
- ¿Por qué es importante resolverlo ahora?
- ¿Qué restricciones tenemos? (técnicas, tiempo, recursos, etc.)
- ¿Qué intentamos lograr?

Incluye:
- Background técnico relevante
- Limitaciones actuales del sistema
- Requisitos de negocio que impulsan esto
-->

### Current Situation

<!-- Describe el estado actual del sistema -->

### Problem Statement

<!-- Define el problema específico que esta decisión resuelve -->

### Constraints

<!-- Lista restricciones técnicas, de tiempo, presupuesto, etc. -->

- Technical:
- Business:
- Timeline:
- Resources:

---

## Decision

<!--
La decisión arquitectónica específica que tomamos.

Debe ser:
- Clara y concisa
- Accionable
- Específica (no vaga)

Ejemplo BUENO: "Usaremos PostgreSQL como base de datos principal"
Ejemplo MALO: "Consideraremos usar una base de datos relacional"
-->

**Decisión:** [Descripción clara de la decisión]

---

## Alternatives Considered

<!--
Lista todas las alternativas consideradas (incluyendo "no hacer nada").

Para cada alternativa:
1. Descripción breve
2. Pros
3. Cons
4. Por qué fue rechazada
-->

### Alternative A: [Nombre]

**Descripción:**
<!-- Qué es esta alternativa -->

**Pros:**
-
-

**Cons:**
-
-

**Por qué fue rechazada:**
<!-- Razón específica por la que no elegimos esto -->

### Alternative B: [Nombre]

**Descripción:**
<!-- Qué es esta alternativa -->

**Pros:**
-
-

**Cons:**
-
-

**Por qué fue rechazada:**
<!-- Razón específica por la que no elegimos esto -->

### Alternative C: Do Nothing

**Descripción:**
Mantener el status quo sin cambios.

**Pros:**
- Sin costo de implementación
- Sin riesgo de introducir bugs

**Cons:**
- [Problemas que persisten]

**Por qué fue rechazada:**
[Los beneficios del cambio superan el costo/riesgo]

---

## Rationale

<!--
Por qué elegimos esta decisión sobre las alternativas.

Incluye:
- Razonamiento detallado
- Trade-offs considerados
- Factores que más pesaron en la decisión
- Datos/métricas que apoyaron la decisión (si los hay)
-->

### Why This Decision

<!-- Argumentos principales a favor -->

### Key Trade-offs

<!-- Qué sacrificamos para obtener qué beneficios -->

### Assumptions

<!-- Qué asumimos que es verdad para que esta decisión sea correcta -->

---

## Consequences

<!--
Impacto de esta decisión.

Divide en:
- Positivas: Beneficios que obtenemos
- Negativas: Costos/problemas que aceptamos
- Neutral: Cambios que son ni buenos ni malos
-->

### Positive ✅

-
-

### Negative ⚠️

-
-

### Neutral 📊

-
-

### Risks

<!-- Riesgos que introduce esta decisión y cómo los mitigamos -->

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| | Baja/Media/Alta | Bajo/Medio/Alto | |

---

## Implementation

<!--
Detalles de implementación necesarios para que esta decisión funcione.

Incluye:
- Cambios de código requeridos
- Cambios de infraestructura
- Proceso de migración
- Rollout plan
-->

### Required Changes

1.
2.
3.

### Migration Plan

<!-- Si hay sistema existente, cómo migramos -->

**Phase 1:**


**Phase 2:**


**Phase 3:**


### Rollback Plan

<!-- Qué hacemos si esto no funciona -->

---

## Validation

<!-- Cómo sabremos si esta decisión fue correcta -->

### Success Criteria

<!-- Métricas/señales de que funciona -->

-
-

### Testing Strategy

<!-- Cómo validamos que funciona -->

-
-

### Monitoring

<!-- Qué monitoreamos para detectar problemas -->

-
-

---

## Timeline

<!-- Cuándo implementamos esto -->

| Milestone | Date | Owner | Status |
|-----------|------|-------|--------|
| ADR Approval | | | |
| Implementation Start | | | |
| Testing Complete | | | |
| Production Rollout | | | |

---

## Team Input

<!-- Registro de discusiones y feedback del equipo -->

### Discussion Notes

<!-- Resumen de discusiones importantes -->

**[YYYY-MM-DD] Meeting Notes:**
- Participantes:
- Decisiones:
- Action items:

### Approvals

<!-- Quién aprobó esto -->

- [ ] Tech Lead: [Nombre]
- [ ] Engineering Manager: [Nombre]
- [ ] Product Owner: [Nombre] (si aplica)
- [ ] Security Team: [Nombre] (si aplica)

---

## Related

<!-- Links a documentos relacionados -->

- **Related ADRs:** ADR-XXX, ADR-YYY
- **Design Docs:** Link
- **Jira Tickets:** PROJ-123
- **Pull Requests:** #456

---

## References

<!-- Links externos que ayudaron en la decisión -->

- [Título](URL)
- [Título](URL)

---

## Notes

<!-- Cualquier nota adicional -->

### Future Considerations

<!-- Cosas a considerar en el futuro relacionadas con esto -->

### Known Limitations

<!-- Limitaciones conocidas de esta decisión -->

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | [Nombre] | Created |
| | | |

---

## Metadata

**Category:** [Architecture | Infrastructure | Process | Security | Performance]
**Impact:** [High | Medium | Low]
**Effort:** [High | Medium | Low]

---

<!--
TIPS for Writing Good ADRs:

1. Be Specific: "Use PostgreSQL" not "Use a database"
2. Explain Why: Rationale is more important than the decision itself
3. Include Trade-offs: No decision is perfect - be honest about cons
4. Think Long-term: How will this age? What if requirements change?
5. Keep it Updated: Mark as DEPRECATED or SUPERSEDED if things change
6. Be Concise but Complete: Aim for 2-3 pages, not a novel
7. Use Data: Include metrics/benchmarks if available
8. Consider Alternatives: Show you thought about other options
9. Make it Actionable: Implementation details help
10. Review Regularly: Re-read ADRs quarterly to see if still valid

WHEN to Write an ADR:

✅ DO write ADR for:
- Choosing frameworks/libraries (React vs Vue, PostgreSQL vs MongoDB)
- Infrastructure decisions (AWS vs GCP, serverless vs containers)
- Architecture patterns (microservices vs monolith, REST vs GraphQL)
- Security approaches (OAuth providers, encryption methods)
- Data modeling approaches
- Testing strategies
- Deployment strategies

❌ DON'T write ADR for:
- Bug fixes
- Minor refactors
- UI tweaks
- Documentation updates
- Simple feature additions

When in doubt, ask: "Will this decision affect the system for months/years?"
If yes → ADR. If no → maybe just a design doc or PR description.
-->
