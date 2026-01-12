# ADR-001: Approach para getRecommendations Tool (AI-Driven Text Generation)

## Status

**ACCEPTED** - 2026-01-12

## Context

El sistema de chat AI de Momenta necesita mostrar recomendaciones de experiencias a los usuarios. La pregunta arquitectónica clave es: **¿Quién es responsable de generar los textos que acompañan las recomendaciones?**

### Opciones Consideradas

#### Opción A: AI escribe texto manualmente (ELEGIDA)
```typescript
// Schema simple - solo parámetros de búsqueda
inputSchema: z.object({
  ciudad: z.string(),
  fecha: z.string(),
  personas: number,
  // ... otros parámetros de búsqueda
})

// Flujo:
// 1. AI llama tool con parámetros de búsqueda
// 2. Tool devuelve recommendations[]
// 3. AI escribe introducción manualmente
// 4. Frontend renderiza carrusel
// 5. AI escribe pregunta de seguimiento manualmente
```

**Ejemplo real:**
```
AI: [llama getRecommendations({ ciudad: "Bogotá", fecha: "mañana", personas: 2 })]
AI: "¡Aquí van experiencias románticas para mañana! 🌹"
Frontend: [renderiza carrusel con 3 experiencias]
AI: "Pudiste revisar las experiencias - cuál te gustó mas?"
```

#### Opción B: Texto estructurado en parámetros del tool (RECHAZADA)
```typescript
// Schema con campos UI explícitos
inputSchema: z.object({
  introMessage: z.string().required(),      // ← Texto introducción
  followUpQuestion: z.string().required(),  // ← Texto pregunta
  ciudad: z.string(),
  fecha: z.string(),
  // ... otros parámetros
})

// Flujo:
// 1. AI llama tool CON textos incluidos
// 2. Tool devuelve { introMessage, recommendations[], followUpQuestion }
// 3. Frontend renderiza en orden: intro → carrusel → pregunta
```

**Ejemplo real:**
```
AI: [llama getRecommendations({
  introMessage: "¡Aquí van experiencias románticas para mañana! 🌹",
  followUpQuestion: "¿Cuál te llamó más la atención?",
  ciudad: "Bogotá",
  fecha: "mañana",
  personas: 2
})]
Frontend: [renderiza todo automáticamente en orden]
```

---

## Decision

**Adoptamos Opción A: AI escribe texto manualmente**

El AI tiene control total del flujo conversacional y escribe todos los textos antes/después de llamar al tool `getRecommendations`.

---

## Rationale

### Ventajas de Opción A ✅

#### 1. **Flexibilidad Contextual**
El AI puede ajustar dinámicamente el tono/contenido según:
- Ocasión (cumpleaños, aniversario, salida casual)
- Tipo de grupo (pareja, familia, amigos)
- Historial de conversación (primera búsqueda vs refinamiento)

**Ejemplo:**
```
Contexto: Usuario busca por tercera vez, rechazó opciones anteriores
AI puede escribir: "Entiendo que las anteriores no te convencieron, aquí van opciones diferentes..."

vs.

Con campos fijos: Siempre diría lo mismo, sin contexto
```

#### 2. **Simplicidad del Schema**
- Menos parámetros requeridos = menos errores
- Tool enfocado en lógica de negocio (búsqueda/filtrado)
- Separación de responsabilidades clara

#### 3. **Evita Redundancia**
Con Opción B, podríamos tener:
```
AI genera introMessage: "Aquí van experiencias..."
Tool devuelve introMessage: "Aquí van experiencias..."
AI también escribe texto: "Aquí van experiencias..." (si las instrucciones no son claras)
→ Duplicación confusa
```

#### 4. **Mejor para Multilingüe (Futuro)**
Si expandimos a inglés/otros idiomas:
- AI ajusta lenguaje automáticamente en todo el flujo
- No necesitamos pasar idioma como parámetro al tool

#### 5. **Consistencia con otros Tools**
Otros tools (requestFeedback, etc.) ya siguen este patrón:
- AI escribe texto → llama tool → AI continúa escribiendo

---

### Desventajas de Opción A ⚠️

#### 1. **Dependencia en Instrucciones del Prompt**
- El AI DEBE seguir las instrucciones consistentemente
- Si las instrucciones son ambiguas, puede olvidar escribir texto

**Mitigación:**
- Instrucciones claras y repetidas en múltiples lugares del prompt
- Validación en tests de integración

#### 2. **Menos Estructura Predecible**
- El frontend no sabe exactamente qué formato/orden recibirá
- Puede variar entre llamadas

**Mitigación:**
- Aunque el texto varía, el orden es consistente: texto → tool → texto
- Frontend diseñado para manejar texto flexible

---

### Por qué Rechazamos Opción B ❌

#### 1. **Complejidad Innecesaria**
```typescript
// Requiere validar más campos
introMessage: z.string().min(10).max(500),  // ¿Cuántos caracteres?
followUpQuestion: z.string().min(5).max(200),  // ¿Formato específico?
```

#### 2. **Falta de Contexto**
El AI generaría estos textos en el momento del tool call, pero:
- No puede ajustarlos después de ver los resultados
- No puede reaccionar a `morePeopleSuggestion` dinámicamente

#### 3. **Rigidez**
Si queremos cambiar el flujo (ej: agregar texto intermedio), necesitamos:
- Cambiar schema
- Cambiar backend
- Cambiar frontend
- Cambiar prompts

Con Opción A: Solo cambiar prompts.

---

## Consequences

### Positivas ✅

1. **Developer Experience:** Más fácil iterar en prompts sin tocar código
2. **Mantenimiento:** Menos campos = menos bugs potenciales
3. **Escalabilidad:** Fácil agregar más contexto al AI sin cambiar tools

### Negativas ⚠️

1. **Requiere Instrucciones Rigurosas:** Debemos ser muy claros en el prompt
2. **Testing más Complejo:** Necesitamos verificar comportamiento del AI, no solo schema

### Neutral 📊

1. **Generator Functions:** No son necesarias con este enfoque
   - Opción A: `async (params) => { ... }`
   - Opción B requería: `async function* (params) => { yield ... }`

---

## Implementation Details

### Prompt Instructions (CRITICAL)

El prompt DEBE incluir:

```markdown
⚠️ REGLA CRÍTICA DE HERRAMIENTAS:
Cuando llamas una herramienta (tool), SIEMPRE debes continuar tu respuesta con texto.
NUNCA termines tu mensaje solo con una llamada a herramienta.

Específicamente:
- Después de getRecommendations → SIEMPRE pregunta:
  "Pudiste revisar las experiencias - cuál te gustó mas?"
```

### Tool Schema

```typescript
export const getRecommendations = tool({
  description: `
    Busca experiencias en la base de datos.

    ⚠️ OBLIGATORIO AL FINAL:
    SIEMPRE termina con: "Pudiste revisar las experiencias, ¿cuál te gustó más?"
  `,
  inputSchema: z.object({
    ciudad: z.string(),
    fecha: z.string(),
    personas: z.number(),
    // ... otros parámetros de búsqueda
    // ❌ NO introMessage
    // ❌ NO followUpQuestion
  }),
  execute: async (params) => {
    // Lógica de búsqueda
    return {
      success: true,
      recommendations: [...],
      morePeopleSuggestion: "...", // opcional
    };
  }
});
```

### Frontend Rendering

```tsx
// El frontend renderiza:
// 1. Texto del AI (antes del tool)
// 2. Carrusel de recommendations
// 3. Texto del AI (después del tool)

<AssistantMessage content={message.content} />
{messageRecommendations && (
  <ExperienceCarousel recommendations={messageRecommendations} />
)}
```

---

## Validation

### Manual Testing Checklist

- [ ] AI escribe introducción antes de llamar tool
- [ ] Tool devuelve recommendations correctamente
- [ ] AI escribe pregunta de seguimiento después del tool
- [ ] Si hay `morePeopleSuggestion`, AI lo menciona apropiadamente
- [ ] Tono/estilo se ajusta según ocasión

### Automated Tests

```typescript
describe('getRecommendations behavior', () => {
  it('AI should write text after tool call', async () => {
    const response = await chatCompletion({
      messages: [{ role: 'user', content: 'Busco algo para mañana' }]
    });

    const hasToolCall = response.toolCalls?.some(t => t.name === 'getRecommendations');
    const hasTextAfterTool = response.content.includes('Pudiste revisar');

    if (hasToolCall) {
      expect(hasTextAfterTool).toBe(true);
    }
  });
});
```

---

## Alternatives Considered

### Opción C: Híbrido (RECHAZADA)

Combinar ambos enfoques:
- Schema CON introMessage/followUpQuestion
- PERO AI también puede escribir texto adicional

**Por qué se rechazó:**
- Lo peor de ambos mundos: complejidad + redundancia
- Confuso determinar responsabilidades

---

## Related

- **ADR-002:** [Futuro] Multilingual Support Strategy
- **ADR-003:** [Futuro] Frontend-Backend Contract Testing

---

## References

- [AI SDK Documentation - Tool Calling](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Post-Mortem: Architecture Conflict](../../../POST_MORTEM.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-01-12 | Tech Lead | Initial decision documented after conflict resolution |

---

## Notes

Este ADR se creó **retrospectivamente** después de resolver un conflicto entre dos implementaciones incompatibles. En el futuro, ADRs deben crearse **antes** de comenzar la implementación.

**Lección aprendida:** La falta de este ADR resultó en:
- 2 implementaciones divergentes
- ~70 líneas de código eliminadas
- ~15 horas de trabajo desperdiciado
- 2 horas de tiempo de resolución

Ver: [POST_MORTEM.md](../../../POST_MORTEM.md) para análisis completo.
