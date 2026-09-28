# Guía para administrar el sitio de Belyni

## Entrar al panel

1. Abre **https://<tu-dominio>/keystatic** desde tu computadora o celular.
2. Toca **Iniciar sesión con GitHub** y usa tu cuenta.
3. Verás el menú: **Datos del salón, Servicios, Equipo, Galería, Marcas, Opiniones, Promociones**.

Cada vez que guardas, el sitio se actualiza solo en **1 a 2 minutos**.

## Cambiar un precio

1. **Servicios** → toca el servicio.
2. Cambia **Precio desde (MXN, opcional)**. Solo números, sin "$" ni comas (ej. `550`).
3. Si lo dejas vacío, el sitio muestra "Precio a consultar".
4. Toca **Guardar**.

## Agregar un servicio

1. **Servicios** → **Agregar**.
2. Llena **Nombre**, **Categoría** y **Descripción** (máximo 160 letras).
3. Foto opcional: horizontal, bien iluminada. **Orden**: número menor = aparece primero.
4. **Guardar**.

## Cambiar el horario

1. **Datos del salón** → **Horario**.
2. Un renglón por turno: día, hora de apertura y cierre en formato 24 h (`09:30`, `19:00`).
3. Si cierran a mediodía, pon **dos renglones** para ese día (ej. `09:00–14:00` y `16:00–19:00`).
4. Días sin renglón aparecen como **Cerrado**.

## Crear una promoción

1. **Promociones** → **Agregar**.
2. Título corto, texto, fecha de inicio y de fin (el día de fin **sí** cuenta).
3. Aparece sola en la franja superior del sitio en esas fechas y desaparece al terminar.

## Fotos

- Usa fotos **reales** del salón y de tu trabajo; generan más confianza que las de internet.
- Horizontales para servicios y galería, verticales para el equipo.
- Siempre llena **Descripción de la foto** (ej. "Balayage rubio en cabello largo").
- Si tu foto pesa más de 5 MB, reduce su tamaño antes de subirla (en el celular: compartir → "Tamaño mediano").
- Si cambias la **foto principal** (Datos del salón), avísale a tu desarrollador para actualizar la imagen que aparece al compartir el enlace en WhatsApp.

## Si algo sale mal

- Si guardas un dato con formato incorrecto (ej. teléfono incompleto), **el sitio no se rompe**: sigue mostrando la versión anterior y te llegará un correo "Deploy failed". Corrige el dato y guarda de nuevo.
- Todo cambio queda registrado y se puede deshacer. Escríbele a tu desarrollador con la fecha y lo que cambiaste.

## Cuentas que son tuyas

| Servicio                      | Para qué                       |
| ----------------------------- | ------------------------------ |
| GitHub                        | Guardar el contenido del sitio |
| Netlify                       | Publicar el sitio              |
| Dominio (ej. belyni.mx)       | La dirección del sitio         |
| Google Business Profile       | Aparecer en Google Maps        |
| Web3Forms / Umami (si aplica) | Formulario y estadísticas      |
