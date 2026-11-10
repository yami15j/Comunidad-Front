export const MAX_VIDEO_BYTES = 2 * 1024 ** 3;

export function transferVideoWithProgress(url, options, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const cleanup = () => options.signal?.removeEventListener('abort', abort);
    if (options.signal?.aborted) { reject(new DOMException('Cancelado', 'AbortError')); return; }
    request.open(options.method, url);
    Object.entries(options.headers).forEach(([key, value]) => request.setRequestHeader(key, value));
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    };
    request.onload = () => { cleanup(); resolve(new Response(request.responseText || null, { status: request.status })); };
    request.onerror = () => { cleanup(); reject(new TypeError('Error de conexión')); };
    request.onabort = () => { cleanup(); reject(new DOMException('Cancelado', 'AbortError')); };
    options.signal?.addEventListener('abort', abort, { once: true });
    request.send(options.body);
  });
}

export async function uploadVideoFile(url, file, signal, transfer = fetch, onProgress) {
  if (file.size > MAX_VIDEO_BYTES)
    throw new Error('El video supera el límite de 2 GB del almacenamiento. Reduce su tamaño antes de subirlo.');
  let response;
  try {
    const send = onProgress && transfer === fetch
      ? (target, options) => transferVideoWithProgress(target, options, onProgress)
      : transfer;
    response = await send(url, {
      method: 'PUT', headers: { 'Content-Type': file.type || 'video/mp4' },
      body: file, signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Se interrumpió la conexión con el almacenamiento. Comprueba tu conexión y vuelve a intentar la subida.');
  }
  if (response.ok) return;
  let detail = '';
  let code = '';
  try {
    const payload = await response.json();
    detail = typeof payload.message === 'string' ? payload.message : '';
    code = String(payload.statusCode || payload.code || payload.error || '');
  } catch { /* Storage can return a non-JSON gateway response. */ }
  const reason = `${code} ${detail}`;
  if (response.status === 413 || /EntityTooLarge|PayloadTooLarge|maximum allowed size|exceed.*size|too large/i.test(reason))
    throw new Error('Supabase rechazó el video porque supera el tamaño permitido por el proyecto. Reduce el archivo o ajusta el límite global de Storage y el del contenedor course-videos.');
  if (response.status === 507 || /quota|storage.*limit|insufficient.*storage/i.test(reason))
    throw new Error('El almacenamiento no tiene espacio disponible. Revisa la cuota de Storage en Supabase.');
  if (response.status === 401 || response.status === 403 || /expired|invalid.*token/i.test(reason))
    throw new Error('El permiso temporal de subida venció o fue rechazado. Vuelve a publicar para generar otro permiso.');
  if (/mime|content.type/i.test(reason))
    throw new Error('El almacenamiento rechazó el formato del video. Revisa los formatos permitidos en course-videos.');
  // Do not expose signed URLs, tokens or raw gateway HTML to the UI.
  throw new Error(`El almacenamiento rechazó la subida (HTTP ${response.status})${detail ? ': ' + detail.slice(0, 240) : '. Intenta nuevamente.'}`);
}
