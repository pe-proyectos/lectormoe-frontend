# 📦 Cómo publicar CapibaraTraductor en Google Play — todo en un lugar

Este archivo tiene TODO lo necesario para subir la app a la Play Store.

---

## 1. Datos de la app (identidad)

| Dato | Valor |
|---|---|
| **Nombre de la app** | `CapibaraTraductor` |
| **Nombre del paquete (Application ID)** | `com.capibaratraductor.app` |
| **Versión visible (versionName)** | `1.0` |
| **Código de versión (versionCode)** | `1` |
| **Categoría** | Cómics (Comics) |
| **Idioma principal** | Español (es) |
| **URL de política de privacidad** | https://capibaratraductor.com/privacy |

> El Application ID `com.capibaratraductor.app` es PERMANENTE: una vez publicado
> no se puede cambiar. Cada actualización debe subir el `versionCode` en +1
> (editar `android/app/build.gradle`).

---

## 2. El archivo que se sube (AAB)

Google Play exige un **Android App Bundle (.aab)**, no el APK.

- **Sube este:** `capibara-android-build/capibaratraductor-aab/app-release.aab`
- El APK (`.../capibaratraductor-apk/app-release.apk`) es solo para instalar de
  prueba en un teléfono directamente (activando "orígenes desconocidos").

Ambos ya están **firmados** con tu keystore.

### Para regenerar el AAB/APK (cuando hagas cambios)
1. Sube el `versionCode` en `android/app/build.gradle`.
2. `git push` a la rama `mobile-app-overhaul` (o crea un tag `v*`). Eso dispara
   el workflow de GitHub Actions que compila y firma.
3. Descarga el artefacto:
   `gh run download <run-id> -D <carpeta>`
   (o desde la pestaña Actions del repo → el run → Artifacts).

---

## 3. 🔑 Keystore de firma (GUÁRDALO — es crítico)

La app está firmada con esta clave. **Si la pierdes, NO podrás publicar
actualizaciones nunca más** (tendrías que publicar una app nueva desde cero).

| Dato | Valor |
|---|---|
| **Archivo** | `capibara-release.keystore` |
| **Ubicación actual** | carpeta scratchpad de la sesión (temporal) |
| **Alias** | `capibara` |
| **Contraseña (store y key)** | `Capibara1784820728Key!` |
| **Validez** | 10.000 días (~27 años) |

**HAZ ESTO YA:** copia `capibara-release.keystore` a un lugar seguro y permanente
(gestor de contraseñas, disco cifrado, respaldo en la nube privado). No lo subas
al repositorio (ya está en `.gitignore`).

Los secretos para el CI ya están cargados en GitHub (`gh secret list`):
`CAPIBARA_KEYSTORE_BASE64`, `CAPIBARA_KEYSTORE_PASSWORD`, `CAPIBARA_KEY_ALIAS`.

> Recomendado: activa **Play App Signing** al crear la app (Google guarda la
> clave de firma final y tú solo usas esta como "clave de subida"). Así, si
> pierdes esta keystore, Google puede ayudarte a resetear la clave de subida.

---

## 4. Recursos gráficos de la ficha (ya listos en esta carpeta)

| Recurso | Archivo | Medida |
|---|---|---|
| Ícono | `icon-512.png` | 512×512 |
| Gráfico destacado | `feature-graphic.png` | 1024×500 |
| Captura 1 | `screenshots/screenshot-1.png` | 1080×2160 |
| Captura 2 | `screenshots/screenshot-2.png` | 1080×2160 |
| Captura 3 | `screenshots/screenshot-3.png` | 1080×2160 |
| Anuncios (extra) | `ads/ad-wide-1200x628.png`, `ads/ad-square-1080.png` | — |

Todos validados con las medidas exactas que pide Play.

---

## 5. Textos de la ficha

**Nombre:** CapibaraTraductor

**Descripción corta (máx 80):**
> Lee manga y novelas de tus scans favoritos, con descargas para leer sin conexión.

**Descripción completa:** ver `listing.md` (está redactada y lista para pegar).

---

## 6. Pasos en Google Play Console

1. Entra a https://play.google.com/console con tu cuenta de desarrollador (ya pagaste los US$25 de licencia).
2. **Crear app** → nombre `CapibaraTraductor`, idioma español, tipo App, Gratis o de pago (ver sección 8).
3. **Configuración → Firma de app:** activa Play App Signing.
4. **Ficha de Play Store principal:** pega los textos (sección 5) y sube los gráficos (sección 4).
5. **Producción → Crear nueva versión:** sube `app-release.aab`.
6. Completa los cuestionarios obligatorios:
   - **Clasificación de contenido** (ver aviso en sección 7).
   - **Público objetivo y contenido.**
   - **Seguridad de los datos** (declara qué datos recopila la app: cuenta, email, etc.).
   - **Política de privacidad:** https://capibaratraductor.com/privacy
7. Envía a revisión. La primera revisión suele tardar de unas horas a varios días.

---

## 7. ⚠️ Avisos importantes (léelos)

- **Contenido +18:** la plataforma tiene contenido para adultos en el modo `red`.
  Al llenar la **clasificación de contenido** debes declararlo con honestidad, o
  la app puede ser retirada. Considera filtrar/ocultar el +18 dentro de la app
  para la versión de Play si quieres una clasificación más baja y menos fricción.

- **Contenido de terceros (scanlation):** la app da acceso a manga traducido por
  comunidades. Google Play y los dueños de los derechos son estrictos con apps
  que monetizan contenido con copyright sin licencia. Es un riesgo real de
  retiro o reclamo — más aún si la app es **de pago**. Es tu decisión de negocio,
  pero conviene tenerlo claro antes de publicar.

- **Requisito de funcionalidad:** una app que solo "envuelve un sitio web" puede
  ser rechazada. La nuestra añade valor nativo real (descargas cifradas offline),
  lo que la justifica como app legítima.

---

## 8. Modelo de precio — mi recomendación

Ver la conversación: recomendación de **app gratuita** monetizada con lo que ya
existe (suscripciones por scan + anuncios + el límite de descargas 6/24 como
gancho a premium). Cobrar por la app (pago único o suscripción) reduce mucho la
descarga y suma riesgo legal por el contenido de terceros. Si aun así se quiere
cobrar, un precio bajo ajustado a LATAM (US$1.99–2.99) o un único plan premium
in-app. Decisión final tuya.
