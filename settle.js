// =====================================================================
//  Hesaplaşma — lib/data/settlement.dart'ın birebir JavaScript karşılığı
// =====================================================================
//  Uygulama ile web sayfası aynı bakiyeden AYNI ödeme planını çıkarmalı;
//  yoksa uygulamada "Ali → Ayşe 120" yazarken bağlantıda başka bir şey
//  görünür. Bu yüzden:
//    - Yuvarlama Dart'ınki gibi: yarım kuruş sıfırdan uzağa
//      (JS'in Math.round'u -12.5'i -12 yapar, Dart -13).
//    - Eşit tutarda sıralama kimliğe göre, aynı karakter sırasıyla.
//  Dart tarafındaki çıktılar settlement_golden.js'de; test.html ikisini
//  karşılaştırır (bkz. test/settlement_golden_test.dart).
// =====================================================================

const SETTLE_EPSILON = 0.01;

function settleRound(v) {
  return (Math.sign(v) * Math.round(Math.abs(v) * 100)) / 100;
}

/** nets: { id: net } (pozitif = alacaklı). Döner: [{from, to, amount}] */
function minimalTransfers(nets) {
  const debtors = [];
  const creditors = [];
  for (const id of Object.keys(nets)) {
    const net = nets[id];
    if (net < -SETTLE_EPSILON) debtors.push({ id, amount: -net });
    else if (net > SETTLE_EPSILON) creditors.push({ id, amount: net });
  }

  const byAmountThenId = (a, b) => {
    if (b.amount !== a.amount) return b.amount > a.amount ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
  debtors.sort(byAmountThenId);
  creditors.sort(byAmountThenId);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amount = settleRound(d.amount < c.amount ? d.amount : c.amount);
    if (amount > SETTLE_EPSILON) {
      transfers.push({ from: d.id, to: c.id, amount });
    }
    d.amount = settleRound(d.amount - amount);
    c.amount = settleRound(c.amount - amount);
    if (d.amount <= SETTLE_EPSILON) i++;
    if (c.amount <= SETTLE_EPSILON) j++;
  }
  return transfers;
}

/** Sunucudaki bakiye satırından net: ödedi - payı + gönderdi - aldı. */
function netOf(b) {
  return b.paid - b.owed + b.sent - b.received;
}
