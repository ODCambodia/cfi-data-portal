const DEFAULT_COORD = [12.5657, 104.991];
const map = L.map('map', {
  center: DEFAULT_COORD,
  zoom: 7,
  minZoom: 7,
});

let activePoint = null;

function showActivePoint(layer) {
  let radius = layer.getRadius();
  if (activePoint && activePoint.feature.id !== layer.feature.id) {
    radius *= 1.2;
  }

  if (activePoint !== null || !layer) {
    // Reset style|
    activePoint.setStyle({ ...POINT_STYLE.default, ...(layer ? { radius: layer.getRadius() } : {}) });
    activePoint = null;
  }

  if (!layer) { return; }

  // set active in view with offset
  const center = Object.values(layer.getLatLng());
  const offsetCenter = new L.Point(200, 0);
  map.panTo(center, { animate: false });
  map.panBy(offsetCenter, { animate: false });

  layer.bringToFront();
  layer.setStyle({ ...POINT_STYLE.active, radius });

  activePoint = layer;
}

map.setMaxBounds(map.getBounds());

const mapLink = '<a href="http://www.esri.com/">Esri</a>';
const WHO_Link = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const BASE_MAP = {
  'ESRI WordImagery': L.tileLayer(
    'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; ' + mapLink + ', ' + WHO_Link,
    maxZoom: 20,
  }),
  'Open Street Map': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map)
};

L.control.resetView({
  position: "topleft",
  title: "Reset view",
  latlng: L.latLng(DEFAULT_COORD),
  zoom: 7,
}).addTo(map);
L.control.layers(BASE_MAP, null, { position: 'topleft' }).addTo(map);
L.control.scale().addTo(map);

const OVERLAY_MAP = {};
const DemoGraphyChart = (function () {
  const CHARTS_CONF = {
    committee: {
      typeName: defaultProfileTypeName,
      id: 'committeePieChart',
      title: 'committees',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'num_cmte_female',
        total: 'num_cmte_mem',
      },
    },
    population: {
      typeName: defaultChartTypeName,
      id: 'populationPieChart',
      title: 'population',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'num_commune_women',
        total: 'num_commune_ppl',
      },
    }
  };

  async function loadChart(cfr, chartConfig) {
    // maybe a callback to calculate chould be better (more dynamic code)
    let femaleCount = cfr.properties[chartConfig.propertyKeys.female];
    let totalCount = cfr.properties[chartConfig.propertyKeys.total];
    let maleCount;

    // i cant think
    if (typeof femaleCount === 'string' && typeof totalCount === 'string') {
      femaleCount = Number(femaleCount.replaceAll(',', '')) || 0;
      maleCount = (Number(totalCount.replaceAll(',', '')) || 0) - femaleCount;
    } else {
      femaleCount = Number(femaleCount) || 0;
      maleCount = Number(totalCount) - femaleCount;
    }

    if (femaleCount > 0 || maleCount > 0) {
      CustomCharts.pieChart(
        chartConfig.id,
        chartConfig.title,
        chartConfig.labels,
        [femaleCount, maleCount],
      );
    } else {
      document.getElementById(chartConfig.id).remove();
    }
  }

  function loadHeader() {
    const chartWrapper = document.querySelector('.about__body .chart__wrapper .chart__wrapper__body');
    if (chartWrapper.childNodes.length > 0) {
      const chartHeader = document.createElement('h2');
      chartHeader.innerText = I18n.translate('demography');
      chartHeader.classList.add('about__header');
      chartWrapper.parentNode.prepend(chartHeader);
    }
  }

  function loadAllChart(cfr) {
    const promise = Promise.all([
      loadChart(cfr, CHARTS_CONF.committee),
      loadChart(cfr, CHARTS_CONF.population),
    ]);

    promise.then(loadHeader);
    return promise;
  }

  return {
    loadAllChart,
    loadChart,
  };
})();

async function loadRelatedDocuments(cfiId) {
  document.getElementById('relatedDocuments').innerHTML = '';
  const releatedDocuments = await Utils.fetchGeoJson({
    data: {
      typeName: '	cfr:documents',
      CQL_FILTER: `Dwithin(geom, collectGeometries(queryCollection('cfr:cfr_status_assessment_2022','geom','IN(''${cfiId}'')')), 1, meters)`,
    },
  });

  const relatedDocumentsDOM = document.getElementById('relatedDocuments');

  if (!releatedDocuments.features.length > 0) {
    relatedDocumentsDOM.parentElement.classList.add('d-none');
    return;
  }

  const ul = document.createElement('ul');
  releatedDocuments.features.forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.properties.url;
    a.innerText = item.properties[I18n.translate({ kh: 'title', en: 'title_en' })] || item.properties.title || item.properties.title_en; // damn this is terrible code (sorry)
    a.style.color = '#000';
    a.target = '_blank';

    li.append(a);
    ul.append(li);
  });

  relatedDocumentsDOM.append(ul);
  relatedDocumentsDOM.parentElement.classList.remove('d-none');
}

function drawAboutSection() {
  const tableProfile = document.createElement('table');
  tableProfile.style.textAlign = 'left';

  const tableWrapper = document.createElement('div');
  tableWrapper.append(tableProfile);
  tableWrapper.classList.add('about__table__wrapper');

  const chartWrapper = document.createElement('div');
  chartWrapper.classList.add('chart__wrapper');

  const chartWrapperBody = document.createElement('div');
  chartWrapperBody.classList.add('chart__wrapper__body');

  const committeePieChart = document.createElement('canvas');
  committeePieChart.id = 'committeePieChart';

  const populationPieChart = document.createElement('canvas');
  populationPieChart.id = 'populationPieChart';

  // chartWrapper.append(memberPieChart);
  chartWrapperBody.append(committeePieChart);
  chartWrapperBody.append(populationPieChart);
  chartWrapper.append(chartWrapperBody);

  // Appending everything
  const body = document.querySelector('.about__body');
  body.append(tableWrapper);
  body.append(chartWrapper);
}

async function showCFR(data) {
  document.querySelector('.about__body').innerHTML = '';
  drawAboutSection();
  document.body.querySelector('.about__wrapper').classList.add('active');

  if (data.feature.properties.length <= 0) {
    return;
  }

  const tbody = document.createElement('tbody');
  const cfr = {};
  cfr.name = data.feature.properties[I18n.translate({ kh: 'cfr_name', en: 'cfr_name_en' })];
  cfr.cfr_code = data.feature.properties.code;
  cfr.type = data.feature.properties.cfr_type;
  cfr.district = data.feature.properties.district;
  cfr.province = data.feature.properties[I18n.translate({ en: 'province_en', kh: 'province' })];
  cfr.area_dry_season = data.feature.properties.dry_season_area_ha + ' ' + I18n.translate('hectare');
  cfr.area_rainy_season = data.feature.properties.rainy_season_area_ha + ' ' + I18n.translate('hectare');
  cfr.creation_date = data.feature.properties.creation_date;
  cfr.registration_date = data.feature.properties.registration_date;
  cfr.status = data.feature.properties.status;

  for (const key in cfr) {
    const tr = document.createElement('tr');

    if (key === 'creation_date' || key === 'registration_date') {
      cfr[key] = Utils.formatDate(cfr[key]);
    }

    [key, cfr[key]].forEach((x, i) => {
      const td = document.createElement('td');

      if (i > 0) {
        td.innerText = x;

        if (!x) {
          td.innerText = I18n.translate('no_data');
        } else if (Utils.isNumeric(x) && !Utils.isCoordinate(x)) {
          const str = typeof x === 'string' ? x.replace(',', '') : x;
          td.innerText = Utils.toFixed(Number(str), 2);
        }
      } else {
        td.innerText = I18n.translate(x);
      }

      tr.append(td);
    });

    tbody.append(tr);
  }

  const header = document.querySelector('.about__header');
  header.innerText = I18n.translate('community_fish_refuge') + ' ' + cfr.name;

  const profileTable = document.querySelector('.about__table__wrapper table');
  profileTable.append(tbody);

  await loadRelatedDocuments(data.feature.id);
  await DemoGraphyChart.loadAllChart(data.feature);
}

async function loadCFRMap(options) {
  const cfr_data = await Utils.fetchGeoJson({ data: { typeName: defaultProfileTypeName, ...options } });
  const provinceName = document.querySelector('#provinceSelect option:checked').dataset.name;

  if (provinceName) {
    cfr_data.features = cfr_data.features.filter((item) => item.properties.province.trim() === provinceName);
  }

  OVERLAY_MAP[KEYS.CFR_A] = Utils.getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].off('click');
  OVERLAY_MAP[KEYS.CFR_A].on('click', async function (e) {
    toggleLoading(true);
    const cfiId = e.layer.feature.id;
    document.getElementById('cfiSelect').value = cfiId;
    sessionStorage.setItem(`${SERVER}_community`, cfiId);

    await showCFR(e.layer);
    showActivePoint(e.layer);
    toggleLoading(false);
  });

  map.on('zoomend', function () {
    const currentZoom = map.getZoom();
    let radius = currentZoom * 1.2; //or whatever ratio you prefer
    if (currentZoom < 10) {
      radius *= 0.85;
    }

    OVERLAY_MAP[KEYS.CFR_A].setStyle({ radius: radius });
  });

  // load number of CFR
  const label = document.getElementById('cfiCount');
  label.textContent = `(${cfr_data.features.length || 0})`;

  return cfr_data;
}

async function loadCFRSelect(options) {
  const cfr_data = await loadCFRMap(options);
  const cfiSelect = document.getElementById('cfiSelect');

  cfr_data.features.forEach((item) => {
    const option = document.createElement('option');
    option.text = item.properties.cfr_name;
    option.value = item.id;
    cfiSelect.append(option);
  });


  cfiSelect.addEventListener('change', async function (e) {
    toggleLoading(true);
    const val = e.currentTarget.value;
    const selectedCFR = cfr_data.features.find((item) => item.id === val);

    sessionStorage.setItem(`${SERVER}_community`, val);
    document.querySelector('.about__body').innerHTML = '';

    if (OVERLAY_MAP[KEYS.CFR_A]) {
      const polygonsLayers = OVERLAY_MAP[KEYS.CFR_A].getLayers();
      const activeLayer = polygonsLayers.find(
        (layer) => layer.feature.id === val,
      );

      showActivePoint(activeLayer);
    }

    if (selectedCFR) {
      await showCFR({ feature: selectedCFR });
    }

    toggleLoading(false);
  });

  cfiSelect.removeAttribute('disabled');

  return OVERLAY_MAP[KEYS.CFR_A];
}

async function handleProvinceSelect(e, options = {}) {
  document.body.querySelector('.about__wrapper').classList.remove('active');
  document.getElementById('relatedLayers').parentElement.classList.add('d-none');
  document.getElementById('relatedDocuments').parentElement.classList.add('d-none');
  document.querySelector('.province-tooltip .tooltip').classList.remove('active');

  const cfiSelect = document.getElementById('cfiSelect');
  cfiSelect.value = '';
  cfiSelect.innerHTML = '';
  cfiSelect.append(Utils.defaultOptionDOM(I18n.translate('select_a_fish_reservation_community')));

  if (typeof OVERLAY_MAP[KEYS.CFR_A] !== 'undefined') {
    OVERLAY_MAP[KEYS.CFR_A].remove();
  }

  toggleLoading(true);

  const val = e.currentTarget.value;
  const CQL_FILTER = val ? `DWITHIN(geom, collectGeometries(queryCollection('cfr:province_boundary_2014','geom','IN(''${val}'')')), 0, meters)` : '';
  const overlay = await loadCFRSelect({ CQL_FILTER });
  const bounds = overlay.getBounds();

  sessionStorage.setItem(`${SERVER}_province`, val);
  sessionStorage.removeItem(`${SERVER}_community`);

  if (Object.keys(bounds).length > 0) {
    map.flyToBounds(bounds, { maxZoom: 9, animate: !options.shouldNotAnimate });
  }

  toggleLoading(false);
}

async function loadProvinceCFR() {
  try {
    const data = await Utils.fetchGeoJson({
      data: {
        typeName: 'cfr:province_boundary_2014',
        outputFormat: 'application/json',
        propertyname: 'pro_name_k,hrname,pro_code',
        SORTBY: 'pro_code ASC'
      }
    })
    const provinceSelect = document.getElementById('provinceSelect');

    // append options to select
    provinceSelect.append(Utils.defaultOptionDOM(I18n.translate('select_a_province'), {
      disabled: true,
      selected: true,
    }));

    provinceSelect.append(
      Utils.defaultOptionDOM(I18n.translate('all_province'), { value: '' }),
    );

    data.features.forEach((item) => {
      const option = document.createElement('option');
      option.text = item.properties[I18n.translate({ en: 'hrname', kh: 'pro_name_k' })];
      option.value = item.id;
      option.dataset.name = item.properties.pro_name_k;
      provinceSelect.append(option);
    });

    provinceSelect.addEventListener('change', handleProvinceSelect);
  } catch (e) {
    console.warn(e);
  }
}

async function loadSavedOption() {
  const savedProvince = sessionStorage.getItem(`${SERVER}_province`);
  const savedCommunity = sessionStorage.getItem(`${SERVER}_community`);
  if (!savedProvince) {
    toggleLoading(false);
    return;
  }

  const provinceSelect = document.getElementById('provinceSelect');
  const cacheEvent = new Event('cacheLoad', { bubbles: true });

  // dont try to dispatch them separately or else u'll run into race cond 
  provinceSelect.value = savedProvince;
  provinceSelect.addEventListener('cacheLoad', async function (e) {
    await handleProvinceSelect(e, { shouldNotAnimate: true });
    if (!savedCommunity) {
      toggleLoading(false);
      return;
    }

    const cfiEvent = new Event('change');
    const cfiSelect = document.getElementById('cfiSelect');
    cfiSelect.value = savedCommunity;
    cfiSelect.dispatchEvent(cfiEvent);
  });

  provinceSelect.dispatchEvent(cacheEvent);
}

async function init() {
  await I18n.init();
  await loadProvinceCFR();

  const provinceSelect = document.getElementById('provinceSelect');
  provinceSelect.removeAttribute('disabled');

  await loadSavedOption();
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
