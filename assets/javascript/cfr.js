async function loadCFRMap(options) {
  const cfr_data = await Utils.fetch({ data: { typeName: TYPENAME[KEYS.CFR_A], ...options } });
  OVERLAY_MAP[KEYS.CFR_A] = getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].off('popupopen');
  OVERLAY_MAP[KEYS.CFR_A].on('popupopen', async function (e) {
    showCFR_A(e.layer.feature);
  });
}

async function loadCFRSelect(options) {
  const cfr_data = await Utils.fetch({ data: { typeName: TYPENAME[KEYS.CFR_A], ...options } });
  OVERLAY_MAP[KEYS.CFR_A] = getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].on('popupopen', async function (e) {
    showCFR_A(e.layer.feature);
  });

  const cfiSelect = document.getElementById('cfiSelect');

  cfr_data.features.forEach((item) => {
    const option = document.createElement('option');
    option.text = item.properties.cfr_name;
    option.value = item.id;
    cfiSelect.append(option);
  });


  cfiSelect.addEventListener('change', async function (e) {
    const val = e.currentTarget.value;
    const selectedCFR = cfr_data.features.find((item) => item.id === val);

    document.querySelector('.about__body').innerHTML = '';

    if (selectedCFR) {
      showCFR_A(selectedCFR);
    }
  });

  cfiSelect.removeAttribute('disabled');
}

async function loadProvinceCFR() {
  try {
    const res = await fetch('/api/provinces/cfr');
    const data = await res.json();
    const provinceSelect = document.getElementById('provinceSelect');

    // append options to select
    provinceSelect.append(Utils.defaultOptionDOM('ជ្រើសរើសខេត្តឬក្រុង'));
    data.features.forEach((item) => {
      const option = document.createElement('option');
      option.text = item.properties.ADM1_EN || item.properties.province;
      option.value = item.id;
      provinceSelect.append(option);
    });

    provinceSelect.addEventListener('change', async function (e) {
      const val = e.currentTarget.value;
      OVERLAY_MAP[KEYS.CFR_A].remove();

      const cfiSelect = document.getElementById('cfiSelect');
      cfiSelect.value = '';
      cfiSelect.innerHTML = '';
      cfiSelect.append(Utils.defaultOptionDOM('ជ្រើសរើសសហគមន៍នេសាទ'));

      loadCFRSelect({ CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfr:cambodian_provincial','geom','IN(''${val}'')')), 0, meters)` });
    });
  } catch (e) {
    console.warn(e);
  }
}

function init() {
  loadProvinceCFR();
  loadCFRMap().then(() => {
    document.getElementById('loadingOverlay').classList.remove('is-active');
    document.getElementById('provinceSelect').removeAttribute('disabled');
  });
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}