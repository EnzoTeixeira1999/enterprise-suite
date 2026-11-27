export function getPassportShareUrl(passportId?: string) {
  const url = new URL(window.location.href);
  url.hash = "";
  if (/^\/demo\/?$/.test(url.pathname) && passportId && /^[0-9a-f-]{36}$/i.test(passportId)) {
    url.pathname = "/laboratorio/publico/passport/" + passportId;
  }
  return url.href;
}
