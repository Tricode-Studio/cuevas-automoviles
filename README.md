# Cuevas Automóviles 🚗

## Descripción

**Cuevas Automóviles** es una plataforma web orientada a la exhibición y comercialización de vehículos, diseñada para ofrecer una experiencia clara, moderna y eficiente tanto para usuarios como para potenciales clientes.

El objetivo principal del sitio es:

* Mostrar autos en venta de forma organizada
* Generar leads comerciales
* Funcionar como catálogo informativo digital

Además, la plataforma se destaca por integrar múltiples rubros dentro del mismo ecosistema:

* Automóviles
* Náutica
* Bicicletas

---

## Diferenciales

* 🚗 Catálogo dinámico de vehículos
* 🔎 Filtros por marca
* 🧭 Navegación intuitiva por categorías
* 📍 Integración con ubicación (mapa)
* 📲 Contacto directo vía WhatsApp

---

## Funcionalidades principales

* Catálogo de autos
* Filtro por marca
* Navegación por marcas (redirección con filtros aplicados)
* Sección de ubicación con mapa
* Formulario de contacto
* Integración con WhatsApp
* Sistema de favoritos

---

## Configuración de API (VPS)

El stock de vehículos y marcas se consume desde una API externa.

1. Crear un archivo `.env` a partir de `.env.example`.
2. Definir la base del CMS y el tenant:

`PUBLIC_CMS_API_BASE_URL=https://cms.tricode.studio/api/v1`

`PUBLIC_CMS_TENANT_SLUG=cuevas-automoviles`

Opcional para forzar el content-type de inventario (por ejemplo `vehicles`):

`PUBLIC_CMS_VEHICLES_SLUG=vehicles`

La web resuelve dinámicamente:

1. `GET /public/:tenantSlug/integration-manifest`
2. `GET /public/:tenantSlug/content-types/:slug/entries`

Con eso evita hardcodear marcas/autos y usa el content-type real del tenant.

Compatibilidad legacy: opcionalmente podés usar `PUBLIC_CATALOG_API_URL` si tenés una API vieja que expone `/vehicles`.

Si el endpoint público no trae unidades (por ejemplo porque están en `DRAFT`), el cliente intenta automáticamente el endpoint tenant-scoped del CMS para no dejar el catálogo vacío.

---

## Enfoque del proyecto

Este proyecto está diseñado bajo una lógica moderna de desarrollo web:

* Experiencia de usuario optimizada (UX/UI)
* Navegación basada en parámetros (filtros dinámicos)
* Escalabilidad para agregar nuevas categorías o funcionalidades
* Diseño responsive (adaptado a dispositivos móviles)

---



## Autoría

Desarrollado por **Tricode**
🌐 https://tricode.studio

---

## Licencia

Este proyecto es de uso comercial y privado.
