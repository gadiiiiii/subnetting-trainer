/**
 * Preferencias y récords guardados en el navegador. El almacenamiento puede
 * no estar disponible (modo privado, bloqueado), así que todo falla en
 * silencio y la app funciona igual sin él.
 */

export function leer<T>(clave: string, defecto: T): T {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? defecto : (JSON.parse(texto) as T);
  } catch {
    return defecto;
  }
}

export function guardar(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento: no se guarda, pero la app sigue funcionando.
  }
}
