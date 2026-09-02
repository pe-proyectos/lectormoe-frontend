# Overhaul del sistema de novelas

Estado: en desarrollo. Documento vivo. Un solo entregable (sin fases/parches),
nivel profesional, pensado para escala de millones de lectores.

## Decisiones de producto (cerradas)
1. Novelas +18 viven en `/red/writings` (reutiliza la infraestructura NSFW ya
   existente: paginas `red/writings/` + mapeo del middleware). Con redirect
   desde el lado normal, `noindex`, exclusion de sitemap y anuncios del lado red.
2. EPUB se importa multi-capitulo siguiendo el spine (volumenes si el TOC tiene
   2 niveles). Conserva el grafo social por capitulo (comentarios, historial,
   reacciones, notificaciones).
3. Subida de novelas/EPUB: roles de org con permiso de capitulos (sin rol nuevo).

## Defaults (ajustables)
- Reimportar EPUB con hash distinto: upsert por numero de capitulo (sobrescribe
  coincidencias, agrega nuevos, nunca borra extras), con diff previo en el dialogo.
- Generos a sembrar: "Contemporaneo" + set estandar (Slice of life, Isekai,
  Wuxia, Xianxia, LitRPG, Romance, Drama, Fantasia, Accion, Misterio).
- Offline: capitulo actual + siguiente (descarga de obra completa como mejora
  opcional futura).

## Estado real del codigo (verificado)
- Novela = `MangaCustom` con `workType='text'`. Texto en `Chapter.bodyMarkdown`.
  Ilustraciones embebidas como `![alt](url "wNN")` (marcador de ancho). Solo URLs
  del R2 propio.
- Editor: `src/components/admin/NovelEditor.tsx` (TipTap + tiptap-markdown + image).
- Lector: `src/components/landing/NovelReader.tsx` (YA robusto: temas, fuente,
  tamano, interlineado, ancho, drop caps, progreso por scroll). Falta: TOC real,
  modo paginado, marcadores por posicion en servidor, offline/PWA, lightbox.
- Pipeline server: `lectormoe-api/src/services/markdown-pipeline.ts`
  (mammoth + turndown + markdown-it + isomorphic-dompurify). BUG: turndown hace
  `remove(['img'])` -> los docx PIERDEN imagenes; y `sanitizeMarkdownInput`
  rechaza en vez de limpiar.
- +18 en novelas bloqueado en `src/components/admin/AdminMangaEdit.tsx` (~l.634-642)
  por un useEffect que fuerza `isNSFW:false` cuando `isWriting`.
- Genero: modelo `Genre` con `category` (FORMAT|GENRE|THEME|CONTENT) y `nsfw`,
  CRUD en `lectormoe-api/src/routes/genre/`. "Contemporaneo" es dato, no codigo.
- Migraciones NO se aplican en deploy (start solo hace `prisma generate`); se
  aplican manualmente.

## Modelo de datos (Prisma, aditivo, cero downtime)
- `Chapter`: `wordCount Int?`, `toc Json?`, `sourceImportId Int?`,
  `@@index([mangaCustomId, deletedAt, releasedAt])`.
- `MangaVolume`: `synopsis String? @db.Text`.
- `UserChapterHistory`: `progress Float?` (0..1).
- Nuevo `NovelImport` (idempotencia por sha256 + reporte de importacion).
- Nuevo `UserNovelBookmark` (marcador por posicion de texto).
- Migracion de existentes: `src/scripts/backfill-novels.ts` (wordCount, toc).

## Backend / API
- `epub-pipeline.ts` (nuevo): JSZip + fast-xml-parser. container.xml -> OPF ->
  spine (orden) + manifest + nav/NCX. Sanea XHTML (allowlist existente),
  preserva `<img>`, extrae imagenes -> R2, reescribe rutas con `wNN`, mapea TOC
  -> capitulos/volumenes. Idempotente (hash). Protecciones: path traversal,
  zip-bomb (ratio + 200MB max), SVG con scripts. Async + polling para grandes.
- Rutas: `routes/files/parse-epub.ts` (nuevo, devuelve importId),
  `routes/novel-import/{get,list}.ts` (nuevo), registrar en `routes/router.ts`.
  Endurecer permisos de `parse-docx`/`parse-md` (hoy guard demasiado laxo).
- `markdown-pipeline.ts`: imagenes docx (mammoth convertImage -> R2), turndown
  dedicado que permite img, sanear-con-warnings en vez de rechazar.
- `controllers/chapter/{create,edit}.ts` + `types/chapter/{create,edit}.ts`:
  validar server-side que las URLs de imagen sean R2 propio; calcular
  wordCount/toc al guardar.
- Progreso: `routes/user-chapter-history/save.ts` acepta `progress`.
- Marcadores: `routes/user-novel-bookmark/index.ts` (calcado de user-page-bookmark).
- +18: dejar de ignorar/forzar isNSFW para text en create/edit.
- Generos: `src/scripts/seed-genres.ts` (upsert idempotente, incluye Contemporaneo).

## Frontend: lector (refactor a `components/landing/reader/`)
- `NovelReaderShell.tsx` (prefs con nanostores persistente entre capitulos).
- `ReaderContent.tsx` (markdown-it + DOMPurify + ids en headings + lightbox img).
- `ReaderTOC.tsx` (drawer: toc del capitulo + lista de capitulos/volumenes).
- `PaginatedView.tsx` (CSS multi-column, sin iframe; gestos + teclado; fallback
  a scroll continuo).
- Progreso: IntersectionObserver -> `progress` 0..1, debounce 5s -> history.
  Restaurar al abrir (sync servidor + fallback local para anonimos).
- Marcadores: guardar `{anchor, progress}`; panel en el drawer.
- Rendimiento: `content-visibility: auto` por secciones; imagenes lazy con
  dimensiones conocidas; Cache-Control/CDN en endpoint de capitulo.
- Accesibilidad: roles/aria, foco atrapado, prefers-reduced-motion.
- Offline/PWA: cachear capitulo actual + siguiente; imagenes R2 cache-first.

## Frontend: editor/admin
- `NovelEditor.tsx`: Image NodeView (redimensionar wNN, mover, alt, eliminar),
  drag-drop y pegar imagen en posicion exacta (sube a R2 primero).
- Preview fiel: usar el MISMO render que el lector (extraer cadena a
  `src/util/novelMarkdown.ts`).
- `NovelImportDialog.tsx` (nuevo): docx/md/epub unificado, progreso, polling del
  NovelImport, reporte y mapeo capitulo<->numero editable antes de confirmar.
- `AdminMangaEdit.tsx`: quitar el forzado isNSFW para writings; checkbox +18
  visible con aviso de que la obra se mueve al lado /red.

## +18: ruteo y propagacion
- Quitar bloqueo en `AdminMangaEdit.tsx`.
- Paginas `writings/[slug]/[type]/[mangaSlug].astro` (+chapter): si `isNSFW` y no
  `nsfwMode`, redirect 302 a `/red/...`.
- SEO: `noindex` + excluir de `sitemap.xml.ts`.
- Anuncios: provider del lado red (mismo layout).
- Buscador/listados: ya segmentan por modo; anadir tests.

## Seguridad
- Toda conversion pasa por el allowlist de `markdown-pipeline.ts`.
- EPUB: rechazar path traversal, zip-bomb, SVG con scripts; solo URLs R2 finales.
- Imponer validacion server-side de URLs R2 en `bodyMarkdown` al guardar.

## Pruebas y aceptacion
- Unit (bun test): epub-pipeline (orden spine, TOC 2 niveles, imagenes reescritas,
  zip malicioso, idempotencia), markdown-pipeline (docx no pierde imagenes; md
  sucio devuelve warnings), validacion R2 en bodyMarkdown.
- Integracion: parse-epub e2e (3 caps + 2 vols + 4 imgs) -> orden y volumenes ok;
  permisos (sin rol -> 403).
- Frontend: round-trip markdown<->editor preserva `wNN` y orden; preview===lector
  (snapshot); progreso guardado/restaurado; TOC navega; paginado conserva posicion.
- E2E/QA: novela +18 aparece solo en /red/writings, redirect, ausente de sitemap.

## Lista de archivos (orden por dependencias)
A. Datos: `prisma/schema.prisma`; scripts `backfill-novels.ts`, `seed-genres.ts`.
B. Pipelines API: `markdown-pipeline.ts`; `epub-pipeline.ts` (nuevo);
   `routes/files/parse-epub.ts` (nuevo), `parse-docx.ts`, `parse-md.ts`;
   `routes/novel-import/` (nuevo) + `routes/router.ts`; `controllers/chapter/{create,edit}.ts`
   + `types/chapter/{create,edit}.ts`; `routes/user-chapter-history/save.ts`;
   `routes/user-novel-bookmark/index.ts` (nuevo).
C. Util compartido: `src/util/novelMarkdown.ts` (nuevo).
D. Lector: `src/components/landing/reader/*` (nuevos) + `NovelReaderContainer.tsx`;
   paginas de capitulo writings + espejo red.
E. Editor/admin: `NovelEditor.tsx`; `NovelImportDialog.tsx` (nuevo) +
   integracion en `AdminChapterDialog.jsx`/`AdminMangaCustomChapters.jsx`;
   `AdminMangaEdit.tsx`.
F. NSFW/SEO: paginas writings (redirect) + `sitemap.xml.ts`; verificar middleware.

## Riesgos
- Modo paginado (CSS columns): recalcular al redimensionar/cambiar fuente,
  anclando por parrafo visible.
- EPUB in-process (sin cola real): un EPUB grande bloquea CPU unos segundos;
  aceptable para subidas admin; mover a worker si se abre a muchos usuarios.
- Reutilizar Chapter en vez de modelo Book: menos pureza, pero conserva el grafo
  social. Trade-off aceptado.

## Progreso de desarrollo
- [x] Plan escrito.
- [x] Genero "Contemporaneo" sembrado (seed-genres.ts; +xianxia, litrpg).
- [x] +18 habilitado en novelas (frontend + ruteo a /red). Desplegado.
- [x] Migracion Prisma: NO necesaria. El TOC y el conteo de palabras se calculan en el cliente; marcadores y progreso reutilizan el modelo existente (UserPageBookmark / historial). NovelImport se pospone (el import ya reporta inline).
- [x] docx fix: imagenes a R2 (pipeline + parse-docx + editor). Commit hecho, PENDIENTE deploy.
- [x] EPUB: epub-pipeline.ts (spine/TOC/volumenes/imagenes R2) + parse-epub. Probado con fixture. PENDIENTE deploy.
- [ ] Pipelines API restante: md-warnings, permisos, validacion R2 server-side en bodyMarkdown.
- [x] Lector: TOC por encabezados + lightbox de ilustraciones. Desplegado. (Ya tenia temas/fuente/progreso/marcadores.)
- [ ] Lector avanzado: modo paginado + PWA offline (opcional).
- [x] Importacion EPUB usable en admin (boton + creacion en lote de capitulos). Desplegado.
- [x] Editor: pegar y soltar imagenes (drag/drop + paste) con subida a R2 en posicion. Desplegado.
- [x] NSFW ruteo: novelas +18 redirigen a /red/writings (detalle y capitulo).
- [ ] SEO opcional: excluir writings NSFW del sitemap (mejora menor pendiente).
