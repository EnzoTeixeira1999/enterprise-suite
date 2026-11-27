export function getPassportShareUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  return url.href;
}
