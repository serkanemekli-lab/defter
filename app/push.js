// =====================================================================
//  Telefon bildirimleri: Dart ile tarayici arasindaki kopru
// =====================================================================
//  lib/core/push/push_platform_web.dart `window.birkesePush`i cagirir.
//  Firebase'in tarayici kutuphanesi YALNIZCA bildirim aciksa ya da
//  aciliyorsa yuklenir: bildirim istemeyen kimse icin Google'a istek
//  gitmez.
//
//  iPhone: bildirim yalnizca ana ekrana eklenmis web uygulamasinda var
//  (iOS 16.4+) ve izin penceresi yalnizca bir DOKUNUSUN icinde acilir:
//  enable() izni ilk is olarak ister.
// =====================================================================
(function () {
  var SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
  var CONFIG = self.BIRKESE_FIREBASE || {};
  var VAPID = self.BIRKESE_VAPID_KEY || "";
  var configured = !!(CONFIG.apiKey && CONFIG.projectId && CONFIG.appId &&
    CONFIG.messagingSenderId && VAPID);

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function standalone() {
    return window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
  }

  function supported() {
    return configured && "serviceWorker" in navigator &&
      "PushManager" in window && "Notification" in window;
  }

  function permission() {
    if (!configured) return "unsupported";
    // iPhone'da Safari sekmesinde bildirim yok; ana ekrana eklenince var.
    if (isIos() && !standalone()) return "needs-home-screen";
    if (!supported()) return "unsupported";
    return Notification.permission; // granted | denied | default
  }

  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  var messagingPromise = null;
  function messaging() {
    if (!messagingPromise) {
      messagingPromise = load(SDK + "firebase-app-compat.js")
        .then(function () { return load(SDK + "firebase-messaging-compat.js"); })
        .then(function () {
          if (!firebase.apps.length) firebase.initializeApp(CONFIG);
          return firebase.messaging();
        });
      // Basarisizsa (internet yok) bir sonraki denemede yeniden yuklensin.
      messagingPromise.catch(function () { messagingPromise = null; });
    }
    return messagingPromise;
  }

  function registration() {
    // Bildirim calisani uygulamanin klasorunde (/defter/app/). Abonelik
    // ETKIN bir calisan ister: kaydin hazir olmasini bekle (ilk acista
    // calisan henuz kuruluyor olabilir).
    return navigator.serviceWorker
      .register("firebase-messaging-sw.js")
      .then(function () { return navigator.serviceWorker.ready; });
  }

  function token() {
    if (permission() !== "granted") return Promise.resolve(null);
    return Promise.all([registration(), messaging()])
      .then(function (r) {
        return r[1].getToken({ vapidKey: VAPID, serviceWorkerRegistration: r[0] });
      })
      .then(function (t) { return t || null; })
      .catch(function () { return null; });
  }

  // Cikista: aboneligi DOGRUDAN bizim calisan uzerinden iptal et. Firebase'in
  // deleteToken'i bu sayfa getToken cagirmadiysa site kokunde varsayilan
  // calisan arar (GitHub Pages'te yok) ve basarisiz olurdu; abonelik
  // surerdi. Iptal edilen aboneligin anahtarina giden bildirim reddedilir,
  // push-send de kaydi siler.
  function unsubscribe() {
    if (!("serviceWorker" in navigator)) return Promise.resolve(null);
    return navigator.serviceWorker.getRegistration()
      .then(function (reg) {
        return reg && reg.pushManager ? reg.pushManager.getSubscription() : null;
      })
      .then(function (sub) { return sub ? sub.unsubscribe() : null; })
      .then(function () { return null; })
      .catch(function () { return null; });
  }

  window.birkesePush = {
    permission: permission,

    // Dokunusun icinde cagrilmali: izin penceresi ILK IS acilir.
    enable: function () {
      if (permission() === "needs-home-screen" || !supported()) {
        return Promise.resolve(null);
      }
      return Notification.requestPermission().then(function (p) {
        return p === "granted" ? token() : null;
      });
    },

    token: token,

    deleteToken: unsubscribe,

    // Uygulama acikken gelen bildirim: calisan haber verir (bildirimi de
    // her zaman gosterir), veri Dart'a JSON metni olarak gider.
    onMessage: function (cb) {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.addEventListener("message", function (e) {
        if (e.data && e.data.birkese === "push") {
          cb(JSON.stringify(e.data.data || {}));
        }
      });
    }
  };
})();
