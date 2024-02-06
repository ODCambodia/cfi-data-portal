const DEFAULT_COORD = [12.5657, 104.991];
const map = L.map('map', {
  center: DEFAULT_COORD,
  zoom: 7,
  minZoom: 7,
});

let activePoint = null;

function showActivePoint(layer) {
  let radius;
  if (layer && activePoint && activePoint.feature.id !== layer.feature.id) {
    radius = layer.getRadius() * 1.2;
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

const MAX_BOUNDS = [
  ['22.187404', '114.696289'],
  ['6.569938', '96.274414']
]
map.setMaxBounds(MAX_BOUNDS);

const mapLink = '<a href="https://www.esri.com/">Esri</a>';
const WHO_Link = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const BASE_MAP = {
  'ESRI WordImagery': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
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
      typeName: defaultProfileTypeName,
      id: 'populationPieChart',
      title: 'population_related_village',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'num_village_women',
        total: 'num_village_ppl',
      },
    }
  };

  async function loadChart(cfr, chartConfig) {
    // maybe a callback to calculate chould be better (more dynamic code)
    let femaleCount = cfr.properties[chartConfig.propertyKeys.female];
    let totalCount = cfr.properties[chartConfig.propertyKeys.total];
    let maleCount;
    const chartDom = $(`#${chartConfig.id}`);

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
    } else if (chartDom.length) {
      chartDom.remove();
    }
  }

  function loadHeader() {
    const chartWrapper = $('.about__body .chart__wrapper .chart__wrapper__body');
    if (chartWrapper.children().length > 0) {
      const chartHeader = document.createElement('h2');
      chartHeader.innerText = I18n.translate('demography');
      chartHeader.classList.add('about__header');
      chartWrapper.parent().prepend(chartHeader);
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

async function handleRelatedLayerClick(e) {
  e.currentTarget.parentNode.childNodes.forEach((item) =>
    item.classList.remove('active'),
  );
  e.currentTarget.classList.add('active');

  const layerName = e.currentTarget.textContent;
  const typeName = e.currentTarget.dataset.name;
  const cfrId = e.currentTarget.dataset.cfrId;
  const layerData = await Utils.fetchGeoJson({
    data: {
      typeName,
      CQL_FILTER: `Dwithin(geom, collectGeometries(queryCollection('${defaultProfileTypeName}','geom','IN(''${cfrId}'')')), 10, meters)`,
    },
  });

  if (!layerData.features.length > 0) {
    setTimeout(function () {
      alert('មិនមានព័ត៌មាន');
    }, 1);
    return;
  }

  const modalHeader = $('#cfrModal .modal-header strong');
  modalHeader.innerText = layerName;

  const table = $('#cfrModal table');
  const tbody = document.createElement('tbody');
  table.innerHTML = '';
  table.classList.remove('vertical');

  if (layerData.features.length > 1) {
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const headers = Object.keys(layerData.features[0].properties);

    headers.forEach((head) => {
      const th = document.createElement('th');
      th.innerText = head;
      trHead.append(th);
    });

    layerData.features.forEach((layer) => {
      const contents = Object.values(layer.properties);
      const tr = document.createElement('tr');

      for (key in contents) {
        const item = contents[key]
        const td = document.createElement('td');

        if (Utils.isNumeric(item) && !Utils.isCoordinate(key)) {
          td.innerText = Utils.toFixed(Number(item), 2);
        } else {
          td.append(item);
        }

        tr.append(td);
      }

      tbody.append(tr);
    });

    thead.append(trHead);
    table.append(thead);
  } else {
    const contentObj = layerData.features[0].properties;
    tbody.style.textAlign = 'left';
    table.classList.add('vertical');

    for (key in contentObj) {
      const tr = document.createElement('tr');
      const tdKey = document.createElement('td');
      const tdVal = document.createElement('td');

      tdKey.innerText = key;
      tr.append(tdKey);
      tdVal.innerText = contentObj[key];
      tr.append(tdVal);

      tbody.append(tr);
    }
  }

  table.append(tbody);

  const modal = document.getElementById('cfrModal');
  modal.style.display = 'block';
}

async function loadRelatedLayers(cfrId) {
  document.getElementById('relatedLayers').innerHTML = '';

  const [cfrRelatedLayers, layersToShow] = await Promise.all([
    Utils.fetchXml({
      baseUrl: `/geoserver/${SERVER}/wfs`,
      data: { request: 'GetCapabilities' },
    }),
    Utils.fetchJson({ baseUrl: '/api/active-layers/' + SERVER })
  ]);

  const ul = document.createElement('ul');
  const featureTypes = cfrRelatedLayers.getElementsByTagName('FeatureType');
  const relatedFeatureTypes = Array.from(featureTypes).filter(featureType => {
    const name = featureType.getElementsByTagName('Name')[0].textContent;
    const keywordTag = featureType.getElementsByTagName('ows:Keyword');
    if (!keywordTag.length > 0) {
      return false;
    }

    const isInternalLayer = [...keywordTag].map((item) => item.textContent).some((keyword) => keyword === 'internal_layer');
    return !isInternalLayer && layersToShow && layersToShow[name];
  });

  const relatedTypeName = relatedFeatureTypes.map((item => {
    const typeName = item.getElementsByTagName('Name')[0].textContent;
    return Utils.fetchXml({
      baseUrl: `/geoserver/${SERVER}/wfs`,
      data: {
        typeName,
        version: '1.1.0',
        request: 'GetFeature',
        CQL_FILTER: `Dwithin(geom, collectGeometries(queryCollection('${defaultProfileTypeName}','geom','IN(''${cfrId}'')')), 10, meters)`,
        resultType: 'hits',
      },
    });
  }));

  const featureCountArr = await Promise.all(relatedTypeName);
  const hasLayerToShow = featureCountArr.some(item => Number(item.childNodes[0].getAttribute('numberOfFeatures')) > 0);
  if (hasLayerToShow) {
    document.getElementById('relatedLayers').append(ul);
    document.getElementById('relatedLayers').parentElement.classList.remove('d-none');

    relatedFeatureTypes.forEach((featureType, i) => {
      const hasRelatedData = Number(featureCountArr[i].childNodes[0].getAttribute('numberOfFeatures')) > 0;
      if (hasRelatedData) {
        const name = featureType.getElementsByTagName('Name')[0].textContent;
        const title = featureType.getElementsByTagName('Title')[0].textContent;
        const li = document.createElement('li');
        li.textContent = title;
        li.dataset.name = name;
        li.dataset.cfrId = cfrId;
        li.addEventListener('click', handleRelatedLayerClick);
        ul.append(li);
      }
    });
  }
}


async function loadRelatedDocuments(cfrId) {
  document.getElementById('relatedDocuments').innerHTML = '';
  const releatedDocuments = await Utils.fetchGeoJson({
    data: {
      typeName: 'cfr:documents',
      CQL_FILTER: `Dwithin(geom, collectGeometries(queryCollection('${defaultProfileTypeName}','geom','IN(''${cfrId}'')')), 1, meters)`,
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
    a.innerText = I18n.translate({ kh: 'title', en: 'title_en' }, item.properties);
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
  const body = $('.about__body');
  body.append(tableWrapper);
  body.append(chartWrapper);
}

async function showCFR(data) {
  $('.about__body').innerHTML = '';
  drawAboutSection();
  document.body.querySelector('.about__wrapper').classList.add('active');

  if (data.feature.properties.length <= 0) {
    return;
  }

  const tbody = document.createElement('tbody');
  const cfr = {};
  cfr.cfr_code = data.feature.properties.cfr_id;
  cfr.type = I18n.translate({ kh: 'cfr_type', en: 'cfr_type_en' }, data.feature.properties);
  cfr.district = data.feature.properties.district;
  cfr.province = I18n.translate({ kh: 'province', en: 'province_en' }, data.feature.properties);
  cfr.area_dry_season = data.feature.properties.dry_season_area_ha;
  cfr.area_rainy_season = data.feature.properties.rainy_season_area_ha;
  cfr.recognized_by_law = data.feature.properties.is_official_cfr;
  if (cfr.recognized_by_law === 'បាទ/ចាស៎') {
    cfr.recognized_year = Utils.formatDate(data.feature.properties.recognized_year);
  }

  if (Utils.isNumeric(cfr.area_dry_season)) {
    cfr.area_dry_season = Utils.formatNum(cfr.area_dry_season);
  }
  cfr.area_dry_season += ' ' + I18n.translate('hectare');

  if (Utils.isNumeric(cfr.area_rainy_season)) {
    cfr.area_rainy_season = Utils.formatNum(cfr.area_rainy_season);
  }
  cfr.area_rainy_season += ' ' + I18n.translate('hectare');

  for (const key in cfr) {
    const tr = document.createElement('tr');
    [key, cfr[key]].forEach((x, i) => {
      const td = document.createElement('td');

      if (i > 0) {
        td.innerText = x;

        if (!x) {
          td.innerText = I18n.translate('no_data');
        }
      } else {
        td.innerText = I18n.translate(x);
      }

      tr.append(td);
    });

    tbody.append(tr);
  }

  $('.about__header').innerText = I18n.translate('community_fish_refuge') + ' ' + I18n.translate({ kh: 'cfr_name', en: 'cfr_name_en' }, data.feature.properties);
  $('.about__table__wrapper table').append(tbody);

  await loadRelatedDocuments(data.feature.id);
  await loadRelatedLayers(data.feature.id);
  await DemoGraphyChart.loadAllChart(data.feature);
}

async function loadCFRMap(options) {
  const cfr_data = await Utils.fetchGeoJson({ data: { typeName: defaultProfileTypeName, ...options } });
  const provinceName = $('#provinceSelect option:selected').data('name');

  if (provinceName) {
    cfr_data.features = cfr_data.features.filter((item) => item.properties.province.trim() === provinceName);
  }

  OVERLAY_MAP[KEYS.CFR_A] = Utils.getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].off('click');
  OVERLAY_MAP[KEYS.CFR_A].on('click', async function (e) {
    toggleLoading(true);
    const cfrId = e.layer.feature.id;
    $('#cfrSelect').value = cfrId;
    sessionStorage.setItem(`${SERVER}_community`, cfrId);

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
  $('#cfrCount').text(`(${cfr_data.features.length || 0})`);

  return cfr_data;
}

async function loadCFRSelect(options) {
  const cfr_data = await loadCFRMap(options);
  const cfrSelect = $('#cfrSelect');
  cfrSelect.append(new Option());

  cfr_data.features.forEach((item) => {
    const option = new Option(item.properties.cfr_name, item.id);
    cfrSelect.append(option);
  });

  cfrSelect.on('change', async function (e) {
    toggleLoading(true);
    const val = e.currentTarget.value;
    const selectedCFR = cfr_data.features.find((item) => item.id === val);

    sessionStorage.setItem(`${SERVER}_community`, val);
    $('.about__body').innerHTML = '';

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

  cfrSelect.prop('disabled', false);

  return OVERLAY_MAP[KEYS.CFR_A];
}

async function handleProvinceSelect(e, options = {}) {
  $('.about__wrapper').removeClass('active');
  $('#relatedLayers').parent().addClass('d-none');
  $('#relatedDocuments').parent().addClass('d-none');
  $('.province-tooltip .tooltip').removeClass('active');

  const cfrSelect = $('#cfrSelect');
  cfrSelect.html('').select2({ placeholder: I18n.translate('select_a_fish_reservation_community') });

  if (typeof OVERLAY_MAP[KEYS.CFR_A] !== 'undefined') {
    OVERLAY_MAP[KEYS.CFR_A].remove();
  }

  toggleLoading(true);

  let CQL_FILTER = '';
  const provinceId = e.currentTarget.value;
  if (provinceId && provinceId !== 'all') {
    CQL_FILTER = `DWITHIN(geom, collectGeometries(queryCollection('cfr:province_boundary_2014','geom','IN(''${provinceId}'')')), 0, meters)`;
  }

  const overlay = await loadCFRSelect({ CQL_FILTER });
  const bounds = overlay.getBounds();

  sessionStorage.setItem(`${SERVER}_province`, provinceId);
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
        SORTBY: 'pro_code ASC'
      }
    })

    const provinceSelect = $('#provinceSelect');
    const allOption = new Option(I18n.translate('all_province'), 'all');
    provinceSelect.append(new Option());
    provinceSelect.append(allOption);

    data.features.forEach((item) => {
      const option = new Option(I18n.translate({ en: 'hrname', kh: 'pro_name_k' }, item.properties), item.id);
      option.dataset.name = item.properties.pro_name_k;
      provinceSelect.append(option);
    });

    provinceSelect.on('change', handleProvinceSelect);
    provinceSelect.prop('disabled', false);
  } catch (e) {
    console.warn(e);
  }

  toggleLoading(false);
}

async function loadSavedOption() {
  const savedProvince = sessionStorage.getItem(`${SERVER}_province`);
  const savedCommunity = sessionStorage.getItem(`${SERVER}_community`);
  if (!savedProvince) { return; }

  const provinceSelect = $('#provinceSelect');
  provinceSelect.val(savedProvince).trigger('change.select2');

  provinceSelect.on('cacheLoad', async function (e) {
    await handleProvinceSelect(e, { shouldNotAnimate: true });
    if (!savedCommunity) { return; }
    $('#cfrSelect').val(savedCommunity).trigger('change');
  })

  provinceSelect.trigger('cacheLoad');
}

async function loadSettings() {
  const settings = await Promise.all([
    Utils.fetchJson({ baseUrl: '/api/default-profile-layer/' + SERVER })
  ]);

  defaultProfileTypeName = Object.keys(settings[0])[0];
}

$(document).ready(async function () {
  await Promise.all([loadSettings(), I18n.init()]);

  $('#cfrSelect').select2({ placeholder: I18n.translate('select_a_province') });
  $('#provinceSelect').select2({
    placeholder: I18n.translate('select_a_fish_reservation_community'),
  });

  await loadProvinceCFR();
  await loadSavedOption();
});

