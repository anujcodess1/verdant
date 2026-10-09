const GIS_SRC = 'https://accounts.google.com/gsi/client';

let loader = null;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    const script = existing ?? Object.assign(document.createElement('script'), { src: GIS_SRC, async: true });
    const timer = setTimeout(() => reject(new Error('Google took too long to load. Check your connection.')), 12000);
    script.addEventListener('load', () => {
      clearTimeout(timer);
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error('Google sign-in is unavailable in this browser.'));
    });
    script.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('Google sign-in script was blocked.'));
    });
    if (!existing) document.head.appendChild(script);
  });
  return loader;
}

export function renderGoogleButton(container, { clientId, onSuccess, onError }) {
  if (!window.google?.accounts?.id || !clientId || !container) return false;
  container.replaceChildren();
  window.google.accounts.id.initialize({
    client_id: clientId,
    ux_mode: 'popup',
    auto_select: false,
    callback: (response) => {
      if (response?.credential) onSuccess(response.credential);
      else onError(new Error('Google did not return a credential'));
    },
  });
  window.google.accounts.id.renderButton(container, {
    theme: 'filled_black',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    logo_alignment: 'left',
    width: 296,
  });
  return true;
}
