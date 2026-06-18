# 4.8 — Copilot

> **Manager Dashboard — UI Design**
>
> Asistente de IA para análisis del marketplace.

---

## Purpose

Proveer una interfaz de lenguaje natural para el dashboard donde los gerentes puedan hacer preguntas, analizar tendencias y obtener recomendaciones sobre los datos del marketplace.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                               Copilot                               │
│                                                                     │
│                        ┌───────────────────────────────┐            │
│                        │ ¡Hola! Soy el Copilot de       │            │
│                        │ BiciMarket.                    │            │
│                        │                                │            │
│                        │ Preguntas sugeridas:           │            │
│                        │                                │            │
│                        │ • ¿Cómo fueron las ventas      │            │
│                        │   esta semana?                 │            │
│                        │ • ¿Qué vendedor tuvo mejor     │            │
│                        │   rendimiento?                 │            │
│                        │ • Mostrame liquidaciones       │            │
│                        │   pendientes                   │            │
│                        │ • ¿Por qué bajaron las ventas  │            │
│                        │   ayer?                        │            │
│                        └───────────────────────────────┘            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ → ¿Cómo fueron las ventas esta semana?                      │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  [Respuesta del asistente — no implementado]                 │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [Preguntale al copilot...]                              [➤]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
```

## Widgets

### 1. Mensajes del Chat
- **Component**: Burbuja de chat personalizada
- **Usuario**: alineado a la derecha
- **Asistente**: alineado a la izquierda
- **Nota**: Sin respuestas mock implementadas — shell listo para Vercel AI SDK (`useChat` de `ai/react`)

### 2. Estado Vacío (Welcome)
- **Component**: Mensaje de bienvenida con preguntas sugeridas
- **Texto**: "¡Hola! Soy el Copilot de BiciMarket."
- **Preguntas**: "¿Cómo fueron las ventas esta semana?", "¿Qué vendedor tuvo mejor rendimiento?", "Mostrame liquidaciones pendientes", "¿Por qué bajaron las ventas ayer?"

### 3. Preguntas Sugeridas
- **Component**: Pills estáticos que llenan el input (pero no envían automáticamente)
- **Data Source**: Lista predefinida en español

### 4. Input
- **Component**: Campo de texto
- **Placeholder**: "Preguntale al copilot..."

## Estados

### Empty State
```
┌─────────────────────────────────────────────────────────────────┐
│  ¡Hola! Soy el Copilot de BiciMarket.                           │
│                                                                  │
│  Preguntas sugeridas:                                           │
│  • ¿Cómo fueron las ventas esta semana?                         │
│  • ¿Qué vendedor tuvo mejor rendimiento?                        │
│  • Mostrame liquidaciones pendientes                            │
│  • ¿Por qué bajaron las ventas ayer?                            │
└─────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────┐
│  ⏳ Analizando...                                                │
│  ────▐▓▓▓▓▓░░░░░░░────  Consultando datos...                   │
└─────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ No pude responder esa pregunta.                             │
│                                                                  │
│  Posibles causas:                                                │
│  • La fuente de datos puede no estar disponible                  │
│  • La pregunta puede requerir datos a los que no tengo acceso   │
│  • Intentá reformular la pregunta                                │
│                                                                  │
│  [Reintentar]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

- **Component**: `Copilot` — página completa en `/admin/copilot`
- **State Management**: `useChat` de Vercel AI SDK (`ai/react`)
- **Integración**: Listo para integración con Vercel AI SDK con streaming
- **Nota**: Sin respuestas mock — solo shell de UI implementado
