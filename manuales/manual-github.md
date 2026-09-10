# Manual de GitHub - The Route66 Market

Version: 1.0 | Fecha: 10/09/2026
Repositorio: https://github.com/RetroAlienX/tienda-premium
Rama principal: main

## 1. Introduccion

El proyecto se versiona con **Git** y se respalda en **GitHub**. La rama
`main` esta conectada a Netlify: cada push publica el sitio automaticamente.

## 2. Conceptos minimos

- **Working tree**: tus archivos con cambios sin guardar en Git.
- **Staging (index)**: cambios preparados para el commit (`git add`).
- **Commit**: punto guardado en el historial, con mensaje descriptivo.
- **Push**: sube tus commits locales a GitHub (`main`).

## 3. Flujo diario

Abre una terminal en la carpeta del proyecto (o usa un cliente visual como
VS Code / GitHub Desktop).

### Paso 1 - Ver que cambio
    git status

Muestra los archivos modificados (rojo = sin preparar, verde = preparados).

### Paso 2 - Preparar los archivos
Puedes agregar archivos exactos:

    git add admin.html js/admin.js README.md

o preparar todo el working tree:

    git add -A

> Cuidado con `git add -A`: revisa `git status` antes para no incluir basura
> ni archivos con datos sensibles. Los archivos excluidos estan en `.gitignore`
> (por ejemplo `js/config.local.js`, `js/config.netlify.generated.js`,
> `*.sql`, la carpeta `_backup_before_mods/`).

### Paso 3 - Revisar lo preparado
    git diff --staged

Confirma que solo entraron los cambios deseados y que no hay secretos.

### Paso 4 - Crear el commit
    git commit -m "Descripcion clara del cambio"

Reglas del mensaje:
- En espanol, conciso y descriptivo (que se hizo y por que).
- Un commit por tarea logica (no mezclar varias tareas).
- Ejemplo: `"Agrega modal de producto no encontrado al escanear codigo"`.

### Paso 5 - Subir a GitHub
    git push origin main

Dispara el despliegue automatico en Netlify.

## 4. Buenas practicas

- **Nunca subas secretos**: claves de Supabase, tokens, contrasenas o datos
  personales de clientes NO van a GitHub. Van en variables de entorno de
  Netlify o en archivos locales excluidos.
- **No subas los scripts SQL**: por politica del proyecto, `*.sql` esta en
  `.gitignore`; los scripts se ejecutan directo en el SQL Editor de Supabase.
- **Commits pequenos y frecuentes**: facilitan encontrar errores y revertir.
- **Verifica antes de push**: `git status` y `git diff --staged`.
- **No uses `git push --force`**: puede borrar historial compartido.

## 5. Comandos utiles de consulta

    git log --oneline          # historial resumido (ultimos commits)
    git log --oneline -10      # ultimos 10 cambios
    git branch                 # rama actual
    git remote -v              # repositorio(s) conectado(s)

## 6. Restaurar / revertir cambios

### Recuperar un archivo de un commit anterior
    git checkout <hash> -- <archivo>

Ejemplo: `git checkout abc1234 -- js/admin.js` restaura `js/admin.js` tal como
estaba en el commit `abc1234`.

### Deshacer cambios sin guardar de un archivo
    git checkout -- <archivo>

### Deshacer el ultimo commit (manteniendo los cambios en working tree)
    git reset --soft HEAD~1

### Ver que hash usar
    git log --oneline

> En ramas compartidas y conectadas a Netlify, evita reescribir historial con
> `git commit --amend` o `--force`. Si el deploy fallo, corrige y haz un commit
> nuevo en lugar de borrar el anterior.

## 7. Manejo de errores comunes

### "commit did not include any files" / "nothing to commit"
Nada fue preparado con `git add` o no hay cambios. Ejecuta `git add` primero.

### "failed to push some refs"
Hay commits remotos que no tienes local (lo actualizo otra persona/equipo).
Descarga primero:
    git pull origin main

y si hay conflictos resuelvelos manualmente en los archivos que lo indiquen.

### "LF will be replaced by CRLF"
Aviso normal en Windows: Git convierte saltos de linea; no es un error.

### Quieres ignorar un archivo nuevo
Agrega su ruta a `.gitignore` (uno por linea):
    js/mi-archivo-local.js

## 8. Checklist antes de publicar

- [ ] `git status` limpio (o con los cambios esperados).
- [ ] Sin claves, tokens ni datos personales en los archivos a subir.
- [ ] Mensaje de commit claro en espanol.
- [ ] Despues del push, el deploy en Netlify termina en *Publishing*.