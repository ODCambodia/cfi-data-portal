const DEFAULT_COORD = [12.5657, 104.991];
const map = L.map('map', {
  center: DEFAULT_COORD,
  zoom: 7,
  minZoom: 7,
});

map.setMaxBounds(map.getBounds());

const mapLink = '<a href="http://www.esri.com/">Esri</a>';
const WHO_Link = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const BASE_MAP = {
  'ESRI WordImagery': L.tileLayer(
    'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; ' + mapLink + ', ' + WHO_Link,
    maxZoom: 20,
  }).addTo(map),
  'Open Street Map': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  )
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
const REGEX_YEAR = /(_(20)\d{2})/s;
let activePolygon = null;

function showActivePolygon(layer) {
  if (activePolygon !== null || !layer) {
    // Reset style|
    activePolygon.setStyle(POLYGON_STYLE.default);
    activePolygon = null;
  }

  if (!layer) { return; }

  // set active in view with offset
  const center = { ...layer.getBounds().getCenter() };
  const offsetCenter = new L.Point(200, 0);
  map.panTo(center, { animate: false });
  map.panBy(offsetCenter, { animate: false });

  activePolygon = layer;
  layer.setStyle(POLYGON_STYLE.active);
}

function getDownloadDom(href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = 'ទាញយក';

  return a;
}

function switchCRS() {
  const currentCRS = document.getElementById('espgToggleBtn').textContent;
  const gCRS = '+proj=longlat +datum=WGS84 +no_defs +type=crs'  //WGS 84
  const lCRS = "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs +type=crs"; //WGS 84/UTM Zone 48N

  const coordDOM = document.getElementById('espgCoordDOM');
  const coordWGS84_UTM = coordDOM.dataset.coordWGS84_UTM;
  const coordWGS84 = coordDOM.dataset.coordWGS84;

  let displayCoord = coordWGS84_UTM.replace(' ', '   '); // show WGS 84 / UTM as default

  // check if have default WGS 84 UTM
  if (typeof coordWGS84_UTM === 'string' && !coordWGS84_UTM.trim()) {
    return false;
  }

  // convert to WGS84
  if (currentCRS === 'WGS 84 / UTM zone 48N') {
    if (Utils.isEmptyString(coordWGS84)) {
      const coordArr = coordWGS84_UTM.split(' ').map(x => Number(x));
      try {
        displayCoord = proj4(lCRS, gCRS, coordArr).reverse().map(x => x.toFixed(6)).join(' ');
        coordDOM.dataset.coordWGS84 = displayCoord;
      } catch (e) {
        coordDOM.dataset.coordWGS84 = '';
        displayCoord = I18n.translate('no_data');
      }
    } else {
      displayCoord = coordWGS84;
    }
  }


  document.getElementById('espgCoordDOM').innerText = displayCoord;
}

function getESPGToggleBtn(text) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.id = 'espgToggleBtn';
  btn.addEventListener('click', function (e) {
    let text = e.currentTarget.textContent;
    if (text === 'WGS 84') {
      text = 'WGS 84 / UTM zone 48N'
    } else if (text === 'WGS 84 / UTM zone 48N') {
      text = 'WGS 84';
    }

    switchCRS();
    e.currentTarget.innerText = text;
  });

  return btn;
}

function drawAboutSection() {
  const tableProfile = document.createElement('table');
  tableProfile.style.textAlign = 'left';

  const tableWrapper = document.createElement('div');
  tableWrapper.append(tableProfile);
  tableWrapper.classList.add('about__table__wrapper');

  const conservationWrapper = document.createElement('div');
  conservationWrapper.classList.add('conservation__area__wrapper');
  conservationWrapper.append(tableProfile.cloneNode(true));

  const chartWrapper = document.createElement('div');
  chartWrapper.classList.add('chart__wrapper');

  /* Draw chart */
  const memberPieChart = document.createElement('canvas');
  memberPieChart.id = 'memberPieChart';

  const committeePieChart = document.createElement('canvas');
  committeePieChart.id = 'committeePieChart';

  const populationPieChart = document.createElement('canvas');
  populationPieChart.id = 'populationPieChart';

  chartWrapper.append(committeePieChart);
  chartWrapper.append(memberPieChart);
  chartWrapper.append(populationPieChart);

  // Appending everything
  const body = document.querySelector('.about__body');
  body.append(tableWrapper);
  body.append(conservationWrapper);
  body.append(chartWrapper);
}

const DemoGraphyChart = (function () {
  const CHARTS_CONF = {
    committee: {
      typeName: 'cfi:cfi_status_assessment_2018',
      id: 'committeePieChart',
      title: 'committees',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'cfi_cmte_female',
        total: 'cfi_cmte_total',
      },
    },
    member: {
      typeName: 'cfi:cfi_status_assessment_2018',
      id: 'memberPieChart',
      title: 'members',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'cfi_member_female',
        total: 'cfi_member_total',
      },
    },
    population: {
      typeName: defaultChartTypeName,
      id: 'populationPieChart',
      title: 'population',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'population_female',
        total: 'population_total',
      },
    }
  };

  async function loadChart(cfiId, chartConfig) {
    const response = await Utils.fetchGeoJson({
      data: {
        typeName: chartConfig.typeName,
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
      },
    });

    if (!response.features.length > 0) {
      document.getElementById(chartConfig.id).remove();
      return;
    }

    const data = response.features[0];
    // maybe a callback to calculate chould be better (more dynamic code)
    const femaleCount = data.properties[chartConfig.propertyKeys.female];
    const maleCount = data.properties[chartConfig.propertyKeys.total] - femaleCount;

    if (femaleCount && maleCount) {
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

  function loadAllChart(cfiId) {
    return Promise.all([
      loadChart(cfiId, CHARTS_CONF.committee),
      loadChart(cfiId, CHARTS_CONF.member),
      loadChart(cfiId, CHARTS_CONF.population),
    ]);
  }

  return {
    loadAllChart,
    loadChart,
  };
})();

async function loadConservationAreas(cfiId) {
  const conservationArea = await Utils.fetchGeoJson({
    data: {
      typeName: defaultConservationTypeName,
      CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cfi', 'geom', 'IN(''${cfiId}'')')))`,
    },
  });

  if (conservationArea.features.length < 0) {
    document.querySelector('.conservation__area__wrapper').outerHTML = '';
    return;
  }

  const header = document.createElement('h2');
  const conservationWrapperDom = document.querySelector('.conservation__area__wrapper');
  header.classList.add('about__header');
  header.innerText = I18n.translate('conservation_area_in_community');
  conservationWrapperDom.prepend(header);

  if (!conservationArea.features.length) {
    conservationWrapperDom.remove();
  }

  if (conservationArea.features.length > 0) {
    const tbody = document.createElement('tbody');
    const ItemsToShowKeys = ['name', 'area'];

    conservationArea.features.forEach((item) => {
      const tr = document.createElement('tr');

      ItemsToShowKeys.forEach((key,i) => {
        const td = document.createElement('td');
        const val = item.properties[key];
        td.style.width = '50%';

        if (Utils.isNumeric(val)) {
          td.innerText = Utils.formatNum(Number(val), ' ') + ` ${I18n.translate('hectare')}`;
        } else if (key === 'name') {
          td.innerText = item.properties[I18n.translate({ en: 'name_en', kh: 'name' })] || item.properties.name;
        }
        tr.append(td);
      });

      tbody.append(tr);
    })

    const conservationTable = document.querySelector('.conservation__area__wrapper table');
    conservationTable.append(tbody);
  }
}

async function handleRelatedLayerClick(e) {
  e.currentTarget.parentNode.childNodes.forEach((item) =>
    item.classList.remove('active'),
  );
  e.currentTarget.classList.add('active');

  const layerName = e.currentTarget.textContent;
  const typeName = e.currentTarget.dataset.name;
  const cfiId = e.currentTarget.dataset.cfiId;
  const layerData = await Utils.fetchGeoJson({
    baseUrl: '/geoserver/cfi/wfs',
    data: {
      typeName,
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
    },
  });

  if (!layerData.features.length > 0) {
    setTimeout(function () {
      alert('មិនមានព័ត៌មាន');
    }, 1);
    return;
  }

  const modalHeader = document.querySelector('#cfiModal .modal-header strong');
  modalHeader.innerText = layerName;

  const table = document.querySelector('#cfiModal table');
  const tbody = document.createElement('tbody');
  table.innerHTML = '';
  table.classList.remove('vertical');

  if (layerData.features.length > 1) {
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const headers = Object.keys(layerData.features[0].properties).map(
      (key) => TRANSLATE[key] || key,
    );

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

      tdKey.innerText = TRANSLATE[key] || key;
      tr.append(tdKey);

      if (Utils.isNumeric(contentObj[key]) && !Utils.isCoordinate(key)) {
        tdVal.innerText = Utils.toFixed(Number(contentObj[key]), 2);
      } else {
        tdVal.innerText = contentObj[key];
      }

      tr.append(tdVal);

      tbody.append(tr);
    }
  }

  table.append(tbody);

  const modal = document.getElementById('cfiModal');
  modal.style.display = 'block';
}

async function loadRelatedLayers(cfiId) {
  document.getElementById('relatedLayers').innerHTML = '';

  const [cfiRelatedLayers, layersToShow] = await Promise.all([
    Utils.fetchXml({
      baseUrl: '/geoserver/cfi/wfs',
      data: { request: 'GetCapabilities' },
    }),
    Utils.fetchJson({ baseUrl: '/api/active-layers/' + SERVER })
  ]);

  const ul = document.createElement('ul');
  const featureTypes = cfiRelatedLayers.getElementsByTagName('FeatureType');
  const relatedFeatureTypes = Array.from(featureTypes).filter(featureType => {
    const name = featureType.getElementsByTagName('Name')[0].textContent;

    return !(layersToShow[name] === undefined ||
      !REGEX_YEAR.test(name) ||
      name.includes('profile') ||
      name.includes('contact'))
  });

  const relatedTypeName = relatedFeatureTypes.map((item => {
    const typeName = item.getElementsByTagName('Name')[0].textContent;
    return Utils.fetchXml({
      baseUrl: '/geoserver/cfi/wfs',
      data: {
        typeName,
        version: '1.1.0',
        request: 'GetFeature',
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi', 'geom', 'IN(''${cfiId}'')')), 0, meters)`,
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
        li.dataset.cfiId = cfiId;
        li.addEventListener('click', handleRelatedLayerClick);
        ul.append(li);
      }
    });
  }

  return [...featureTypes]
    .find((item) => item.childNodes[0].textContent.includes('profile'))
    .childNodes[4].textContent.split('::')[1];
}

async function loadRelatedDocuments(cfiId) {
  document.getElementById('relatedDocuments').innerHTML = '';
  const releatedDocuments = await Utils.fetchGeoJson({
    data: {
      typeName: '	cfi:documents',
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
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

function getDistrictTagDom(districts) {
  if (!Array.isArray(districts) && districts.length < 0) {
    return '';
  }

  if (districts.length === 1) {
    return districts[0].properties[I18n.translate({ en: 'dis_name', kh: 'dis_name_k' })]
  }

  const div = document.createElement('div');
  districts.forEach((item) => {
    const span = document.createElement('span');
    span.classList.add('badge-pill', 'badge-secondary');
    span.innerText = item.properties[I18n.translate({ en: 'dis_name', kh: 'dis_name_k' })];
    span.style.marginRight = '2px';
    div.append(span);
  });

  return div;
}

async function showCFI_B(data, defaultCrs) {
  document.body.querySelector('.about__wrapper').classList.add('active');

  const fetchEspg = Utils.fetchGeoJson(
    { baseUrl: `https://epsg.io/${defaultCrs}.json` },
    false,
  );

  const fetchDistrict = Utils.fetchGeoJson({
    data: {
      typeName: 'cfi:District_kh',
      CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('${defaultProfileTypeName}', 'geom', 'IN(''${data.feature.id}'')')))`,
    },
  });

  const [espg, instersectingDistricts] = await Promise.all([fetchEspg, fetchDistrict]);

  const provinceCode = document.querySelector('#provinceSelect option:checked').dataset.provinceCode;
  const districts = instersectingDistricts.features.filter((item) => item.properties.pro_code === Number(provinceCode));

  const {
    x_coordinate,
    y_coordinate,
    sub_name,
  } = data.feature.properties;
  const tbody = document.createElement('tbody');


  // careful about changing key
  // change the listener as well
  const isValidCoord = !Utils.isEmptyString(x_coordinate) && !Utils.isEmptyString(y_coordinate);

  const coordSpanDOM = document.createElement('pre');
  coordSpanDOM.id = 'espgCoordDOM';
  coordSpanDOM.innerHTML = `${x_coordinate}   ${y_coordinate}`;
  if (isValidCoord) {
    coordSpanDOM.dataset.coordWGS84_UTM = `${x_coordinate} ${y_coordinate}`;
    coordSpanDOM.dataset.coordWGS84 = '';
  }

  const cfi_b = {};
  cfi_b.area_ha = data.feature.properties.area_ha;
  cfi_b.cfi_code = data.feature.properties.cfi_code;
  cfi_b.creation_date = Utils.formatDate(data.feature.properties.creation_date);
  cfi_b.registration_date = Utils.formatDate(data.feature.properties.registration_date)
  cfi_b.coordinate_system = (espg && espg.name) || I18n.translate('no_data');
  cfi_b.referencing_coordinate = coordSpanDOM;
  cfi_b.province = data.feature.properties[I18n.translate({ en: 'province_en', kh: 'province' })];

  if (isValidCoord && espg && espg.name) {
    cfi_b.coordinate_system = getESPGToggleBtn(cfi_b.coordinate_system);
  }

  if (districts && districts.length > 0) {
    cfi_b.district = getDistrictTagDom(districts);
  }

  for (const key in cfi_b) {
    const coloumns = [I18n.translate(key), cfi_b[key]];
    const tr = document.createElement('tr');

    coloumns.forEach((x, i) => {
      const td = document.createElement('td');
      const isKeyCol = i === 0;

      if (x instanceof Element) {
        td.append(x);
      } else if (Utils.isNumeric(x)) {
        td.innerText = Utils.formatNum(Number(x), ' ');
      } else {
        td.innerText = x;
      }

      if (isKeyCol) {
        td.innerText += ':';
      }

      if (!isKeyCol && !x) {
        td.innerText = I18n.translate('no_data');
      }

      tr.append(td);
    });

    tbody.append(tr);
  }

  const cfi_name = data.feature.properties[I18n.translate({ en: 'name_en', kh: 'name' })]
  const header = document.querySelector('.about__wrapper .about__header');
  if (I18n.getLang() === 'en') {
    header.innerText = `${sub_name || cfi_name} ${I18n.translate('fishing_community')}`;
  } else {
    header.innerText = `${I18n.translate('fishing_community')}${sub_name || cfi_name}`;
  }

  const profileTable = document.querySelector('.about__table__wrapper table');
  profileTable.append(tbody);
}

function addBoundaryClickEvent() {
  OVERLAY_MAP[KEYS.CFI_B].off('click');

  OVERLAY_MAP[KEYS.CFI_B].on('click', async function (e) {
    toggleLoading(true);

    map.setView(e.latlng);
    showActivePolygon(e.layer);

    const cfiId = e.layer.feature.id;
    document.querySelector('.about__body').innerHTML = '';
    document.getElementById('cfiSelect').value = cfiId;
    sessionStorage.setItem(`${SERVER}_community`, cfiId);

    drawAboutSection();

    const [cfiProfile] = await Promise.all([  // mostly unrelated function but run them in sync to speed things up
      Utils.fetchGeoJson({
        data: {
          typeName: defaultProfileTypeName,
          SORTBY: 'name ASC',
          CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi', 'geom', 'IN(''${cfiId}'')')), 0, meters)`,
        },
      }),
      loadConservationAreas(cfiId),
      loadRelatedDocuments(cfiId),
      DemoGraphyChart.loadAllChart(cfiId),
    ]);

    const defaultCrs = await loadRelatedLayers(cfiId);
    await showCFI_B({ feature: cfiProfile.features[0] }, defaultCrs);
    toggleLoading(false);
  });
}

async function handleCfiSelect(e) {
  toggleLoading(true);
  const cfiId = e.currentTarget.value;
  document.querySelector('.about__body').innerHTML = '';
  drawAboutSection();

  // save to cache
  sessionStorage.setItem(`${SERVER}_community`, cfiId);

  const [cfiProfile] = await Promise.all([
    Utils.fetchGeoJson({
      data: {
        typeName: defaultProfileTypeName,
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi', 'geom', 'IN(''${cfiId}'')')), 0, meters)`,
      },
    }),
    DemoGraphyChart.loadAllChart(cfiId),
    loadConservationAreas(cfiId),
    loadRelatedDocuments(cfiId),
  ]);

  if (OVERLAY_MAP[KEYS.CFI_B]) {
    const polygonsLayers = OVERLAY_MAP[KEYS.CFI_B].getLayers();
    const activeLayer = polygonsLayers.find(
      (layer) => layer.feature.id === cfiId,
    );

    showActivePolygon(activeLayer);
  }

  if (cfiProfile.features.length > 0) {
    const defaultCrs = await loadRelatedLayers(cfiId);
    await showCFI_B({ feature: cfiProfile.features[0] }, defaultCrs);
  }

  toggleLoading(false);
}

async function loadCfiSelect(cfiBoundary) {
  const tmpCfiSelect = document.getElementById('cfiSelect');
  tmpCfiSelect.innerHTML = '';

  const clone = tmpCfiSelect.cloneNode(true);
  tmpCfiSelect.replaceWith(clone);

  const uniqueCfi = [
    ...new Map(
      cfiBoundary.features.map((item) => [item.properties.name, item]),
    ).values(),
  ].sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'km-KH'));

  const cfiSelect = document.getElementById('cfiSelect');
  cfiSelect.append(Utils.defaultOptionDOM(I18n.translate('select_a_fishing_community')));
  uniqueCfi.forEach((item) => {
    const option = document.createElement('option');
    option.text = item.properties[I18n.translate({ en: 'name_en', kh: 'name' })];
    option.value = item.id;
    cfiSelect.append(option);
  });

  cfiSelect.addEventListener('change', handleCfiSelect);
  cfiSelect.removeAttribute('disabled');
}

async function handleProvinceSelect(e, options = {}) {
  document.body.querySelector('.about__wrapper').classList.remove('active');
  document.getElementById('relatedLayers').parentElement.classList.add('d-none');
  document.getElementById('relatedDocuments').parentElement.classList.add('d-none');
  document.querySelector('.province-tooltip .tooltip').classList.remove('active');

  const provinceSelect = e.currentTarget;
  const selectedProvinceId = provinceSelect.value;
  const provinceName = provinceSelect.options[provinceSelect.selectedIndex].dataset.name;

  // save to cache
  sessionStorage.setItem(`${SERVER}_province`, selectedProvinceId);
  sessionStorage.removeItem(`${SERVER}_community`);

  if (typeof OVERLAY_MAP[KEYS.CFI_B] !== 'undefined') {
    OVERLAY_MAP[KEYS.CFI_B].remove();
  }

  toggleLoading(true);
  const CQL_FILTER = selectedProvinceId
    ? `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cambodian_provincial', 'geom', 'IN(''${selectedProvinceId}'')')))`
    : '';
  const cfiBoundary = await Utils.fetchGeoJson({
    data: {
      typeName: TYPENAME[KEYS.CFI_B],
      CQL_FILTER,
    },
  });

  cfiBoundary.features = cfiBoundary.features.filter((item) => item.properties.province.trim() === provinceName);

  OVERLAY_MAP[KEYS.CFI_B] = Utils.getLayer(cfiBoundary, KEYS.CFI_B);
  OVERLAY_MAP[KEYS.CFI_B].addTo(map);

  await loadCfiSelect(cfiBoundary);

  addBoundaryClickEvent();
  toggleLoading(false);

  if (Object.keys(OVERLAY_MAP[KEYS.CFI_B].getBounds()).length > 0) {
    map.flyToBounds(OVERLAY_MAP[KEYS.CFI_B].getBounds(), { animate: !options.shouldNotAnimate });
  }

  // load number of CFI
  const label = document.getElementById('cfiCount');
  label.textContent = `(${cfiBoundary.features.length || 0})`;
}

async function loadProvince() {
  try {
    const res = await Utils.fetchGeoJson({
      data: {
        typeName: 'cfi:cambodian_provincial',
        srsname: 'EPSG:32648',
        outputFormat: 'application/json',
        propertyname: 'pro_name_k,hrname,pro_code',
        SORTBY: 'pro_code ASC',
      },
    });

    const provinceSelect = document.getElementById('provinceSelect');

    // append options to select
    provinceSelect.append(
      Utils.defaultOptionDOM(I18n.translate('select_a_province'), {
        disabled: true,
        selected: true,
      }),
    );
    provinceSelect.append(
      Utils.defaultOptionDOM(I18n.translate('all_province'), { value: '' }),
    );
    res.features.forEach((item) => {
      const option = document.createElement('option');
      option.text = item.properties[I18n.translate({ en: 'hrname', kh: 'pro_name_k' })];
      option.value = item.id;
      option.dataset.name = item.properties.pro_name_k;
      option.dataset.provinceCode = item.properties.pro_code;
      provinceSelect.append(option);
    });

    // const choices = new Choices(provinceSelect);
    provinceSelect.addEventListener('change', handleProvinceSelect);
  } catch (e) {
    console.warn('Unable to load province select', e);
  }
}

async function loadSavedOption() {
  const savedProvince = sessionStorage.getItem(`${SERVER}_province`);
  const savedCommunity = sessionStorage.getItem(`${SERVER}_community`);

  if (!savedProvince) { return; }

  const provinceSelect = document.getElementById('provinceSelect');
  const cacheEvent = new Event('cacheLoad', { bubbles: true });

  // dont try to dispatch them separately or else u'll run into race cond 
  provinceSelect.value = savedProvince;
  provinceSelect.addEventListener('cacheLoad', async function (e) {
    await handleProvinceSelect(e, { shouldNotAnimate: true });
    if (!savedCommunity) { return; }

    const cfiEvent = new Event('change');
    const cfiSelect = document.getElementById('cfiSelect');
    cfiSelect.value = savedCommunity;
    cfiSelect.dispatchEvent(cfiEvent);
  });

  provinceSelect.dispatchEvent(cacheEvent);
}

async function init() {
  await I18n.init();
  await loadProvince();

  const provinceSelect = document.getElementById('provinceSelect');
  provinceSelect.removeAttribute('disabled');

  await loadSavedOption();
  toggleLoading(false);
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
