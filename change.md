# Funcionalidad de Perfiles Personalizados - Pomodoro Settings

## Descripción General

Agregar la funcionalidad de **perfiles personalizados** en Settings, permitiendo que los usuarios creen, editen y gestionen sus propias configuraciones de Focus/Break/Sessions.

---

## Estructura Visual

### Selector de Perfiles (Superior)

- En la parte superior, crear un **selector/dropdown** que muestre el perfil activo (ej: "25/5", "Programación", "Deep Work")
- **Indicador visual** de cuál está seleccionado (ej: highlight, check, o color diferente)
- Al seleccionar un perfil, los valores de Focus, Break y Sessions se cargan automáticamente

### Crear Nuevo Perfil

- Debajo de los inputs de valores, agregar un botón **"+ Crear perfil"**

---

## Modal de Creación/Edición

### Campos del Formulario

- **Nombre del perfil** (campo de texto)
  - Placeholder: "Ej: Programación, Descanso prolongado"
- **Focus** (minutos)
- **Break** (minutos)
- **Sessions** (cantidad de ciclos)

### Información en Tiempo Real

- **Duración total estimada:** Mostrar "X h Y m" calculado como: `sessions × (focus + break)`
- Esta información se actualiza mientras el usuario cambia los valores

### Botones de Acción

- "Guardar" (guarda el perfil en localStorage)
- "Cancelar" (cierra el modal sin guardar)

---

## Gestión de Perfiles

### Opciones de Cada Perfil

- Icono **⋮** (más opciones) o botón de acción al lado de cada nombre en el selector
- Opciones disponibles:
  - **Editar** - Abre modal con los valores actuales
  - **Establecer como predeterminado** ⭐ - Carga este perfil al abrir la app
  - **Eliminar** - Solo si no es un perfil predefinido

### Perfil Predeterminado

- El perfil marcado con ⭐ será el que se cargará automáticamente al abrir la app
- Debe haber siempre un perfil predeterminado seleccionado

### Confirmación antes de Eliminar

- Mostrar modal de confirmación:
  - Título: "¿Deseas eliminar este perfil?"
  - Mensaje: "¿Deseas eliminar '{nombre del perfil}'? Esta acción no se puede deshacer"
  - Botones: "Cancelar" / "Eliminar" (botón en rojo para alertar)

### Perfiles Predefinidos

- Los perfiles predefinidos (`25/5`, `50/10`, `90/20`) **no se pueden eliminar**
- Solo pueden ser editados si el usuario lo desea

---

## Reordenamiento de Perfiles

### Funcionalidad Drag & Drop

- Permitir **drag & drop** en el selector/lista de perfiles
- Los usuarios pueden reordenar según su preferencia personal
- El orden se guarda en localStorage para persistencia

---

## Persistencia de Datos

### Almacenamiento

- Todos los perfiles se guardan en **localStorage**
- Estructura sugerida:
  ```json
  {
    "profiles": [
      {
        "id": "unique-id",
        "name": "Programación",
        "focus": 50,
        "break": 10,
        "sessions": 4,
        "isDefault": false,
        "isPredefined": false
      }
    ],
    "defaultProfileId": "25-5-id"
  }
  ```
- Los perfiles persisten entre sesiones y recargas de página

---

## Casos de Uso

1. **Usuario crea perfil "Deep Work"** (90 min focus, 20 min break, 2 sesiones)
   - Lo establece como predeterminado
   - Al abrir la app, se carga automáticamente

2. **Usuario edita perfil existente**
   - Clica ⋮ → Editar
   - Cambia los valores
   - Guarda y se aplican los cambios inmediatamente

3. **Usuario elimina perfil**
   - Clica ⋮ → Eliminar
   - Confirma en modal
   - El perfil se elimina de localStorage y del selector

4. **Usuario reordena perfiles**
   - Arrastrar y soltar perfiles en el selector
   - El nuevo orden se guarda en localStorage

---

## Notas Técnicas

- **Validación:** Los campos de Focus, Break y Sessions deben ser números positivos
- **Límites sugeridos:** Focus (1-120 min), Break (1-60 min), Sessions (1-10)
- **UX:** Mostrar mensaje de éxito al crear/editar perfil (ej: toast notification)
- **Accesibilidad:** Mantener navegación funcional con teclado (Tab, Enter, Escape)
