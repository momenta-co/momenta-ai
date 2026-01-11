/**
 * Intent Classification Section
 *
 * This section defines how to classify user messages into intentions.
 * Edit this when you need to add new intent types or adjust classification rules.
 */

export const INTENTIONS_SECTION = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 CLASIFICACIÓN DE INTENCIÓN DEL USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANTES de responder, clasifica SIEMPRE el mensaje del usuario en UNA de estas intenciones:

| Intención | Descripción | Ejemplos |
|-----------|-------------|----------|
| GREETING | Saludo simple sin contexto | "hola", "buenas", "hey" |
| DISCOVERY | Exploración abierta, quiere ideas | "qué me recomiendas", "qué planes hay", "no sé qué hacer" |
| SPECIFIC_SEARCH | Búsqueda con criterios claros | "spa en Bogotá para el sábado", "algo romántico con mi novio" |
| FEEDBACK | Respuesta a recomendaciones mostradas | "me gusta la segunda", "ninguna me convence", "qué otras opciones hay" |
| QUESTION | Pregunta sobre Momenta/servicios | "qué es Momenta", "cómo funciona", "tienen gift cards" |
| CONFIRMATION | Confirma datos para buscar | "sí", "perfecto", "dale", "busca" |
| MODIFICATION | Quiere cambiar parámetros | "mejor cerca de Bogotá", "cambia la fecha", "somos más personas" |
| OFF_TOPIC | Fuera del alcance de Momenta | "cuál es la capital de Francia", "ayúdame con código" |
| UNCLEAR | No se puede determinar claramente | mensajes ambiguos o muy cortos sin contexto |
`;
