# Agregar un nuevo campo a Organization (Frontend)

## Lo que NO hay que tocar

El middleware llama a `/api/organization/check` que retorna el objeto completo — el nuevo campo llega automáticamente a `Astro.locals.organization` en todas las páginas y layouts.

---

## 1. Si hay lógica que depende del campo (middleware)

`src/middleware/index.ts` — si el campo afecta comportamiento global (ej. mostrar/ocultar algo), agregarlo aquí:

```typescript
function calculateShowAds(user: any, organization: any): boolean {
  if (!organization.miNuevoCampo) return false
  // ...
}
```

---

## 2. Si el campo es editable por el admin de la org

`src/components/admin/AdminSettings.tsx` — agregar estado, inicialización, envío y UI:

```typescript
// Estado
const [miNuevoCampo, setMiNuevoCampo] = useState(false)

// Inicialización (en el useEffect donde se carga la org)
setMiNuevoCampo(organization.miNuevoCampo || false)

// Envío (en el objeto del PATCH)
miNuevoCampo,

// UI (dentro del acordeón correspondiente)
<Switch label="Mi nuevo campo" checked={miNuevoCampo} onChange={setMiNuevoCampo} />
```

---

## 3. Si el campo se usa en componentes de páginas públicas

El objeto `organization` ya llega completo desde `Astro.locals` — solo usarlo directamente:

```typescript
// En cualquier página .astro
const { organization } = Astro.locals
// organization.miNuevoCampo ya está disponible

// En componentes React que reciben la org como prop
// solo agregarlo al tipo si el componente tiene tipado explícito
```
