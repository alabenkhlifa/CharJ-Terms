'use strict';
(() => {
  const copy = {
    fr: {
      eyebrow: 'Itinéraire partagé', title: 'Préparez votre prochaine recharge.', intro: 'Un conducteur a partagé sa destination et ses arrêts de recharge avec vous.',
      loading: 'Chargement de l’itinéraire…', unavailable: 'Ce lien a expiré, a été désactivé ou n’existe pas.', error: 'Impossible de charger l’itinéraire. Vérifiez votre connexion et réessayez.', retry: 'Réessayer',
      destination: 'Destination', stops: 'Arrêts de recharge suggérés', empty: 'Aucun arrêt partagé. Charj peut calculer les besoins de recharge pour votre voiture.', missing: 'Station indisponible',
      disclaimer: 'Ces arrêts sont des suggestions. Vérifiez la disponibilité et recalculez depuis votre position avec votre voiture et votre niveau de batterie.',
      open: 'Ouvrir dans Charj', openHint: 'Si le lien ne s’ouvre pas, relancez Charj puis réessayez.', installTitle: 'Trouvez les bornes en Tunisie.', installBody: 'Charj est gratuit et sans publicité. Consultez les stations et les retours récents des conducteurs.',
      ios: 'Installer sur iPhone', android: 'Installer sur Android', privacy: 'Confidentialité', noTracking: 'Aucun suivi publicitaire sur cette page.',
      dates: 'Partagé le {created} · Expire le {expires}', updated: 'État actuel de la station', private: 'Maison privée — urgences uniquement', restricted: 'Accès limité',
      status: { operational: 'Opérationnelle', under_repair: 'En réparation', planned: 'Prévue', unknown: 'État inconnu' },
    },
    ar: {
      eyebrow: 'مسار مشترك', title: 'خطّط لمحطة شحنك القادمة.', intro: 'شارك سائق وجهته ومحطات الشحن المقترحة معك.',
      loading: 'جارٍ تحميل المسار…', unavailable: 'انتهت صلاحية الرابط أو تم تعطيله أو أنه غير موجود.', error: 'تعذر تحميل المسار. تحقق من اتصالك وأعد المحاولة.', retry: 'إعادة المحاولة',
      destination: 'الوجهة', stops: 'محطات الشحن المقترحة', empty: 'لم تتم مشاركة محطات. يمكن لتطبيق Charj حساب احتياجات الشحن لسيارتك.', missing: 'المحطة غير متاحة',
      disclaimer: 'هذه المحطات مقترحة. تحقق من توفرها وأعد الحساب من موقعك باستخدام سيارتك ومستوى البطارية الحالي.',
      open: 'فتح في Charj', openHint: 'إذا لم يفتح الرابط، أعد تشغيل Charj ثم حاول مرة أخرى.', installTitle: 'اعثر على الشواحن في تونس.', installBody: 'Charj مجاني وبدون إعلانات. تصفح المحطات وتجارب السائقين الأخيرة.',
      ios: 'تثبيت على iPhone', android: 'تثبيت على Android', privacy: 'الخصوصية', noTracking: 'لا يوجد تتبع إعلاني في هذه الصفحة.',
      dates: 'تمت المشاركة في {created} · ينتهي في {expires}', updated: 'حالة المحطة الحالية', private: 'منزل خاص — للطوارئ فقط', restricted: 'دخول محدود',
      status: { operational: 'تعمل', under_repair: 'قيد الإصلاح', planned: 'مخطط لها', unknown: 'الحالة غير معروفة' },
    },
    en: {
      eyebrow: 'Shared itinerary', title: 'Plan your next charging stop.', intro: 'A driver shared their destination and charging stops with you.',
      loading: 'Loading itinerary…', unavailable: 'This link has expired, been revoked, or does not exist.', error: 'Could not load the itinerary. Check your connection and try again.', retry: 'Try again',
      destination: 'Destination', stops: 'Suggested charging stops', empty: 'No stops were shared. Charj can calculate charging needs for your vehicle.', missing: 'Station unavailable',
      disclaimer: 'These stops are suggestions. Check availability and recalculate from your location using your vehicle and current battery level.',
      open: 'Open in Charj', openHint: 'If the link does not open, restart Charj and try again.', installTitle: 'Find chargers across Tunisia.', installBody: 'Charj is free and ad-free. Browse stations and recent driver reports.',
      ios: 'Install on iPhone', android: 'Install on Android', privacy: 'Privacy', noTracking: 'No advertising tracking on this page.',
      dates: 'Shared {created} · Expires {expires}', updated: 'Current station status', private: 'Private house — emergencies only', restricted: 'Restricted access',
      status: { operational: 'Operational', under_repair: 'Under repair', planned: 'Planned', unknown: 'Status unknown' },
    },
  };
  const endpoint = 'https://sblkoeronfuhqklvnhtn.supabase.co/functions/v1/shared-itinerary';
  const byId = (id) => document.getElementById(id);
  let language = navigator.language?.startsWith('ar') ? 'ar' : navigator.language?.startsWith('en') ? 'en' : 'fr';
  let content = null;
  let state = 'loading';
  let generation = 0;
  let token = '';
  let pending = null;
  const t = (key) => key.split('.').reduce((value, part) => value?.[part], copy[language]) ?? key;
  const date = (value) => new Date(value).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
  function render() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = `${t('eyebrow')} · Charj`;
    byId('language').value = language;
    document.querySelectorAll('[data-text]').forEach((node) => { node.textContent = t(node.dataset.text); });
    byId('privacy').href = `privacy-${language}.html`;
    byId('status').hidden = state === 'ready';
    byId('itinerary').hidden = state !== 'ready';
    byId('status-text').textContent = t(state);
    byId('retry').hidden = state !== 'error';
    if (state !== 'ready' || !content) return;
    const { itinerary, stops } = content;
    byId('trip-title').textContent = itinerary.payload.title;
    byId('destination-name').textContent = itinerary.payload.destination.name;
    byId('dates').textContent = t('dates').replace('{created}', date(itinerary.created_at)).replace('{expires}', date(itinerary.expires_at));
    byId('open-app').href = `charj://shared-plan/${token}`;
    const list = byId('stops');
    list.replaceChildren();
    for (const id of itinerary.payload.stop_ids) {
      const station = stops.find((item) => item.id === id);
      const row = document.createElement('li');
      const body = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = station ? (language === 'ar' ? station.name_ar : language === 'fr' ? station.name_fr : station.name) || station.name : t('missing');
      body.append(name);
      if (station) {
        const status = document.createElement('p');
        status.textContent = station.access_type === 'private_emergency' ? t('private') : `${t('updated')}: ${t(`status.${station.status}`)}`;
        if (station.status !== 'operational' || station.access_type !== 'public') status.classList.add('warning');
        body.append(status);
        if (station.access_type !== 'public' && station.access_type !== 'private_emergency') {
          const access = document.createElement('p'); access.textContent = t('restricted'); body.append(access);
        }
        const connectors = document.createElement('p');
        connectors.textContent = station.connectors.map((connector) => `${connector.type} · ${connector.power_kw} kW`).join(' / ');
        body.append(connectors);
      }
      row.append(body); list.append(row);
    }
    if (itinerary.payload.stop_ids.length === 0) {
      const empty = document.createElement('li'); empty.className = 'muted'; empty.textContent = t('empty'); list.append(empty);
    }
  }
  function valid(value) {
    const itinerary = value?.itinerary;
    const payload = itinerary?.payload;
    return payload?.version === 1 && typeof payload.title === 'string' && payload.title.length <= 80 &&
      typeof payload.destination?.name === 'string' && Array.isArray(payload.stop_ids) && payload.stop_ids.length <= 8 &&
      payload.stop_ids.every((id) => typeof id === 'string') && Number.isFinite(Date.parse(itinerary.created_at)) &&
      Number.isFinite(Date.parse(itinerary.expires_at)) && Array.isArray(value.stops) && value.stops.every((station) =>
        typeof station.id === 'string' && typeof station.name === 'string' && typeof station.status === 'string' &&
        Array.isArray(station.connectors) && station.connectors.every((connector) => typeof connector.type === 'string' && Number.isFinite(connector.power_kw)));
  }
  async function load() {
    const current = ++generation;
    pending?.abort(); const controller = new AbortController(); pending = controller;
    token = location.hash.slice(1);
    content = null;
    if (!/^[a-f0-9]{32}$/.test(token)) { state = 'unavailable'; render(); return; }
    state = 'loading'; render();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal });
      if (current !== generation) return;
      if (response.status === 404) { state = 'unavailable'; return; }
      if (!response.ok) throw new Error('unavailable');
      const result = await response.json();
      if (current !== generation) return;
      if (!valid(result)) throw new Error('invalid_response');
      if (Date.parse(result.itinerary.expires_at) <= Date.now()) { state = 'unavailable'; return; }
      content = result; state = 'ready';
    } catch {
      if (current === generation) state = 'error';
    } finally {
      clearTimeout(timeout);
      if (current === generation) render();
    }
  }
  byId('language').addEventListener('change', (event) => { if (copy[event.target.value]) { language = event.target.value; render(); } });
  byId('retry').addEventListener('click', () => { void load(); });
  window.addEventListener('hashchange', () => { void load(); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) void load(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void load(); });
  void load();
})();
