// =====================================================================
//  Bildirim calisani (service worker)
// =====================================================================
//  Firebase'in kendi calisanini KULLANMIYORUZ (2026-11-25):
//   - Uygulama acikken o bildirim gostermiyor; Safari (iPhone) ekranda
//     bildirim gostermeyen push'lari birkac kez gorunce aboneligi iptal
//     ediyor -> bildirimler sessizce dururdu.
//   - Google'dan kutuphane yuklemesi gerekiyordu.
//  Bu calisan her push'ta bildirimi MUTLAKA gosterir, acik uygulamaya da
//  haber verir (uyelik gozcusu hemen baksin). Dokununca uygulamayi
//  acar / one getirir. Sayfa isteklerine (fetch) karismaz, onbellek
//  tutmaz. Anahtari almak (getToken) sayfanin isi (push.js).
//
//  Gelen veri Firebase'in web push bicimi: { notification: {title, body,
//  icon, tag}, data: {...} }. push-send baslik ve metni data'ya da koyuyor.
// =====================================================================

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

function appUrl() {
  return new URL("./", self.registration.scope).href;
}

self.addEventListener("push", function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }
  var n = payload.notification || {};
  var d = payload.data || {};
  var title = n.title || d.title || "Birkese";
  var body = n.body || d.body || "";
  var tag = n.tag || d.kind || "birkese";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (list) {
        list.forEach(function (c) {
          c.postMessage({ birkese: "push", data: d });
        });
        return self.registration.showNotification(title, {
          body: body,
          tag: tag,
          icon: "icons/Icon-192.png",
          data: { url: appUrl() }
        });
      })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = appUrl();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (list) {
        for (var i = 0; i < list.length; i++) {
          var c = list[i];
          if (c.url.indexOf(url) === 0 && "focus" in c) return c.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
