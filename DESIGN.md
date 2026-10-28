# DESIGN.md — Entrenador de subnetting

Sistema de diseño de la app. Cada pantalla usa estos tokens por nombre (variables CSS y clases de Tailwind), nunca valores sueltos.

## Dirección

**Formato de lección interactiva:** una pregunta a la vez, campos grandes, una franja inferior que confirma o corrige y una barra de progreso hacia la meta del día. La referencia son las apps de estudio en sesiones cortas, pero con tono de herramienta técnica: sin mascotas ni ilustraciones, y con los datos de red como protagonistas.

**Identidad:** los colores del cable de red T568B. El **naranjo** marca todo lo que es «red» (el prefijo, los bits de red y el avance) y el **azul** las acciones y los bits de host. Las direcciones IP, los binarios y los tiempos van en monoespaciada, porque son datos que se comparan columna a columna. Todo lo demás va en sans.

Esta dirección sale del propio proyecto y de patrones revisados de apps educativas. No se comparó con un catálogo de sitios reales (UXKIN no está conectado).

## Color

| Token | Claro | Oscuro | Rol |
|---|---|---|---|
| `background` | `#eef2f6` | `#0f151c` | Fondo de la página |
| `card` | `#ffffff` | `#17202a` | Tarjeta de la pregunta, campos, paneles |
| `foreground` | `#172230` | `#e6ebf1` | Texto principal |
| `muted-foreground` | `#556271` | `#9aa8b6` | Texto secundario, etiquetas |
| `border` | `#d3dbe4` | `#2b3846` | Bordes y divisores |
| `muted` | `#e4e9ef` | `#1f2a35` | Fondos sutiles, celdas inactivas, pista vacía de la barra de progreso |
| `primary` | `#1f5fbf` | `#6ea6ff` | **Acciones**: botón principal, enlaces, foco |
| `primary-foreground` | `#ffffff` | `#0f151c` | Texto sobre `primary` |
| `red` (naranjo T568B) | `#a64b00` | `#ff9b52` | Prefijo, bits de red, racha, avance de la meta |
| `red-soft` | `#fde8d4` | `#3a2513` | Fondo de bits de red y de bloques destacados |
| `host` (azul T568B) | `#1f5fbf` | `#86b4ff` | Bits de host |
| `host-soft` | `#dde8fa` | `#172a46` | Fondo de bits de host |
| `success` | `#1a6f3f` | `#6fd39a` | Respuesta correcta, franja de acierto |
| `success-soft` | `#ddf1e5` | `#12321f` | Fondo de campo correcto y de la franja |
| `destructive` | `#b42318` | `#ff8f85` | Respuesta incorrecta, acciones de borrar |
| `destructive-soft` | `#fbe3e0` | `#3d1b18` | Fondo de campo incorrecto y de la franja |
| `calor-1` / `calor-2` / `calor-3` | `#f6c79e` / `#e08a45` / `#a64b00` | `#5a3315` / `#a8612a` / `#ff9b52` | Escala secuencial del calendario de práctica (1–4, 5–9 y 10 o más ejercicios en el día). Sin práctica: `muted` |

Todo el texto cumple contraste 4,5:1 sobre su fondo (verificado: el naranjo más bajo da 4,87:1 sobre `red-soft`). El naranjo nunca es un botón: las acciones siempre son azules.

## Tipografía

- **Archivo** (sans, con eje de ancho): interfaz y texto. Los títulos usan ancho 112% y peso 800.
- **JetBrains Mono**: direcciones IP, prefijos, binario, tiempos y respuestas escritas.

| Nombre | Tamaño / interlineado | Uso |
|---|---|---|
| `xs` | 12 / 16 | Leyendas, contadores pequeños |
| `sm` | 14 / 20 | Etiquetas, notas de corrección |
| `base` | 16 / 24 | Texto (mínimo en móvil) |
| `lg` | 18 / 28 | Texto de la franja, campos |
| `xl` | 20 / 28 | Títulos de paso |
| `2xl` | 24 / 32 | Títulos de sección |
| `pregunta` | clamp(32–56) / 1.1 | Dato principal del enunciado (mono 700) |

Pesos: 400, 600, 700 y 800. Las líneas de texto no superan los 70 caracteres.

## Espaciado y medidas

- Escala de 4 px (la de Tailwind): 1 = 4 px, 2 = 8, 3 = 12, 4 = 16, 6 = 24, 8 = 32, 12 = 48.
- Ancho del contenido: 44 rem (704 px) en práctica y examen; los resultados del examen usan el mismo ancho.
- Margen lateral en móvil: 16 px.
- La franja inferior mide al menos 88 px de alto y la página reserva ese espacio abajo para que no tape contenido.
- Objetivos táctiles de 44 px como mínimo.

## Forma y profundidad

- Radios: `sm` 6 px (bits, chips pequeños), `md` 10 px (campos y botones), `lg` 16 px (tarjeta de la pregunta, franja), `full` (pastillas, interruptor).
- Sombras: solo dos. `shadow-sm` para la tarjeta de la pregunta y `shadow-franja` (hacia arriba) para la franja inferior. Nada más tiene sombra.

## Componentes

Los componentes base siguen la estructura de **shadcn/ui** (`components/ui/`, Radix y `class-variance-authority`).

- **Botón:** `default` (azul, acción principal: Revisar, Continuar, Empezar), `outline` (secundaria: Ver solución), `ghost` (terciaria: copiar enlace) y `destructive`. Todos con hover, `focus-visible` con anillo azul de 3 px y `disabled` al 50%. En móvil, la acción principal de la franja ocupa todo el ancho.
- **Campo:** borde de 2 px, mono 18 px y alto de 48 px. Si es correcto, borde y fondo `success`; si es incorrecto, `destructive`. La nota de corrección va debajo y nunca depende solo del color: siempre dice «Correcto» o «Era …».
- **Sí / No:** dos botones de alternancia (ToggleGroup) del mismo alto que los campos.
- **Tarjeta de pregunta:** `card`, radio `lg` y `shadow-sm`. Contiene el tipo (texto naranjo pequeño), la pregunta y el dato en mono grande con el prefijo en naranjo.
- **Franja inferior:** fija abajo, a todo el ancho y con el contenido centrado a 44 rem. Tiene tres estados: *respondiendo* (neutra, con Revisar y Ver solución), *correcto* (fondo `success-soft`, ícono de check y «Todo correcto») e *incorrecto* (fondo `destructive-soft`, ícono de cruz y «3 de 6 correctas»). La acción es siempre «Continuar».
- **Barra superior:** marca, pestañas Práctica / Examen, racha (ícono de llama y número) y meta del día (barra de progreso naranja «4 de 10»).
- **Selector de ejercicio:** un Select con el tipo, un ToggleGroup con la dificultad y un Switch para el cronómetro, en una sola fila que se ajusta en móvil.
- **Explicación:** pasos numerados (son una secuencia), dentro de un Accordion que se abre solo cuando hubo errores.
- **Progreso:** cifras en monoespaciada grande con su etiqueta encima; barras horizontales de un solo color (`red`) para el porcentaje de respuestas correctas, siempre con el número escrito al lado; resultados recientes como cuadros con ícono de check o cruz (nunca solo color); calendario de 12 semanas con la escala `calor` y tooltip con la fecha y la cantidad.
- **Avisos breves (toast):** solo para confirmar acciones sin otro efecto visible, como «Enlace copiado».

## Movimiento

- La franja entra desde abajo en 200 ms cuando se revisa.
- Al acertar todo, el ícono de check hace un pulso breve.
- Con `prefers-reduced-motion`, se elimina todo movimiento y los cambios son instantáneos.

## Íconos e imágenes

- Un solo set de íconos: **Lucide** (el de shadcn/ui), con trazo 2 y 16–20 px. Sin emojis.
- Sin fotos ni ilustraciones: la tira de bits, la tabla de pesos y los bloques del atajo decimal son la parte visual de la app.
