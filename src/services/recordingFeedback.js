export function recordingErrorMessage(error) {
  const message = error?.message || "No pudimos guardar la grabación. Intenta nuevamente.";
  if (/schema cache|external_url|source_type/i.test(message)) {
    return "La publicación por Vimeo aún no está habilitada en la base de datos. Solicita aplicar la actualización de grabaciones y vuelve a intentarlo. Tus datos siguen en el formulario.";
  }
  return message;
}
