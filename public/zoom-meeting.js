(() => {
  const nonce = new URLSearchParams(location.search).get('nonce');
  const send = (type, message) => parent.postMessage({ type, nonce, message }, location.origin);
  let started = false;
  function script(src) { return new Promise((resolve, reject) => { const tag = document.createElement('script'); tag.src = src; tag.onload = resolve; tag.onerror = () => reject(new Error('No se pudo cargar Zoom. Revisa tu conexión e inténtalo de nuevo.')); document.head.appendChild(tag); }); }
  function stylesheet(href) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link); }
  window.addEventListener('message', async event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'zoom-join' || event.data?.nonce !== nonce || started) return;
    started = true;
    const access = event.data.access;
    try {
      const base = 'https://source.zoom.us/6.10.0';
      stylesheet('https://source.zoom.us/css/bootstrap.css'); stylesheet('https://source.zoom.us/css/react-select.css');
      for (const name of ['react', 'react-dom', 'redux', 'redux-thunk', 'react-redux', 'lodash']) await script(base + '/lib/vendor/' + name + '.min.js');
      await script('https://source.zoom.us/zoom-meeting-6.10.0.min.js');
      const sdk = window.ZoomMtg;
      sdk.setZoomJSLib(base + '/lib', '/av'); sdk.preLoadWasm(); sdk.prepareWebSDK();
      document.getElementById('loading').remove(); document.getElementById('zmmtg-root').style.display = 'block';
      sdk.init({ leaveUrl: location.origin + '/zoom-meeting.html?left=1', patchJsMedia: true,
        success: () => sdk.join({ signature: access.signature, sdkKey: access.sdkKey, meetingNumber: access.meetingNumber, passWord: access.password, userName: access.userName, userEmail: access.userEmail, tk: access.registrantToken || '', success: () => send('zoom-connected'), error: () => send('zoom-error', 'Zoom no permitió el ingreso. Revisa el ID, el código y la configuración de acceso de la reunión.') }),
        error: () => send('zoom-error', 'No se pudo iniciar Zoom en este navegador. Puedes abrir la reunión en Zoom.') });
    } catch (error) { send('zoom-error', error.message || 'No se pudo conectar con Zoom.'); }
  });
  if (new URLSearchParams(location.search).has('left')) { parent.postMessage({ type: 'zoom-left' }, location.origin); document.getElementById('loading').textContent = 'Has salido de la clase.'; }
  else send('zoom-ready');
})();
