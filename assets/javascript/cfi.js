const DEFAULT_COORD = [12.5657, 104.991];
const map = L.map('map', {
  center: DEFAULT_COORD,
  zoom: 7,
  minZoom: 7,
});

const MAX_BOUNDS = [
  ['22.187404', '114.696289'],
  ['6.569938', '96.274414'],
];
map.setMaxBounds(MAX_BOUNDS);

const mapLink = '<a href="https://www.esri.com/">Esri</a>';
const WHO_Link =
  'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const BASE_MAP = {
  'ESRI WordImagery': L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '&copy; ' + mapLink + ', ' + WHO_Link,
      maxZoom: 20,
    },
  ).addTo(map),
  'Open Street Map': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ),
};

L.control
  .resetView({
    position: 'topleft',
    title: 'Reset view',
    latlng: L.latLng(DEFAULT_COORD),
    zoom: 7,
  })
  .addTo(map);
L.control.layers(BASE_MAP, null, { position: 'topleft' }).addTo(map);
L.control.scale().addTo(map);

const OVERLAY_MAP = {};
const REGEX_YEAR = /(_(20)\d{2})/s;
let activePolygon = null;

function showActivePolygon(layer) {
  if (activePolygon !== null) {
    // Reset style|
    activePolygon.setStyle(POLYGON_STYLE.default);
    activePolygon = null;
  }

  if (!layer) {
    activePolygon = null;
    return;
  }

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
  const gCRS = '+proj=longlat +datum=WGS84 +no_defs +type=crs'; //WGS 84
  const lCRS = '+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs +type=crs'; //WGS 84/UTM Zone 48N

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
      const coordArr = coordWGS84_UTM.split(' ').map((x) => Number(x));
      try {
        displayCoord = proj4(lCRS, gCRS, coordArr)
          .reverse()
          .map((x) => x.toFixed(6))
          .join(' ');
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
      text = 'WGS 84 / UTM zone 48N';
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

  const chartWrapperBody = document.createElement('div');
  chartWrapperBody.classList.add('chart__wrapper__body');

  /* Draw chart */
  const memberPieChart = document.createElement('canvas');
  memberPieChart.id = 'memberPieChart';

  const committeePieChart = document.createElement('canvas');
  committeePieChart.id = 'committeePieChart';

  const populationPieChart = document.createElement('canvas');
  populationPieChart.id = 'populationPieChart';

  chartWrapperBody.append(committeePieChart);
  chartWrapperBody.append(memberPieChart);
  chartWrapperBody.append(populationPieChart);
  chartWrapper.append(chartWrapperBody);

  // Appending everything
  const body = document.querySelector('.about__body');
  body.append(tableWrapper);
  body.append(conservationWrapper);
  body.append(chartWrapper);
}

const DemoGraphyChart = (function () {
  const CHARTS_CONF = {
    committee: {
      id: 'committeePieChart',
      title: 'committees',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'cfi_cmte_female',
        total: 'cfi_cmte_total',
      },
    },
    member: {
      id: 'memberPieChart',
      title: 'members',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'cfi_member_female',
        total: 'cfi_member_total',
      },
    },
    population: {
      id: 'populationPieChart',
      title: 'population',
      labels: ['female', 'male'],
      propertyKeys: {
        female: 'population_female',
        total: 'population_total',
      },
    },
  };

  async function loadChart(chartData, chartConfig) {
    // maybe a callback to calculate chould be better (more dynamic code)
    const femaleCount = Utils.parseToNumber(chartData[chartConfig.propertyKeys.female]);
    const maleCount = Utils.parseToNumber(chartData[chartConfig.propertyKeys.total]) - femaleCount;
    const chartDom = $(`#${chartConfig.id}`);

    if (femaleCount && maleCount) {
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
    const chartWrapper = document.querySelector(
      '.about__body .chart__wrapper .chart__wrapper__body',
    );
    if (chartWrapper.childNodes.length > 0) {
      const chartHeader = document.createElement('h2');
      chartHeader.innerText = I18n.translate('demography');
      chartHeader.classList.add('about__header');
      chartWrapper.parentNode.prepend(chartHeader);
    }
  }

  async function loadAllChart(cfiId) {
    const response = await Utils.fetchGeoJson({
      data: {
        typeName: defaultChartTypeName,
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi_boundary_2022','geom','IN(''${cfiId}'')')), 0, meters)`,
      },
    });

    if (!response.features.length > 0) {
      $(`#${CHARTS_CONF.committee.id}`).remove();
      $(`#${CHARTS_CONF.member.id}`).remove();
      $(`#${CHARTS_CONF.population.id}`).remove();

      return;
    }

    const chartData = response.features[0].properties;
    loadChart(chartData, CHARTS_CONF.committee);
    loadChart(chartData, CHARTS_CONF.member);
    loadChart(chartData, CHARTS_CONF.population);
    loadHeader();
  }

  return {
    loadAllChart,
    loadChart,
    loadHeader,
  };
})();

async function loadConservationAreas(cfiId) {
  const conservationArea = await Utils.fetchGeoJson({
    data: {
      typeName: defaultConservationTypeName,
      CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cfi_boundary_2022', 'geom', 'IN(''${cfiId}'')')))`,
    },
  });

  if (conservationArea.features.length < 0) {
    document.querySelector('.conservation__area__wrapper').outerHTML = '';
    return;
  }

  const header = document.createElement('h2');
  const conservationWrapperDom = document.querySelector(
    '.conservation__area__wrapper',
  );
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

      ItemsToShowKeys.forEach((key, i) => {
        const td = document.createElement('td');
        const val = item.properties[key];

        if (Utils.isNumeric(val)) {
          td.innerText =
            Utils.formatNum(Number(val), ' ') + ` ${I18n.translate('hectare')}`;
        } else if (key === 'name') {
          td.innerText = I18n.translate(
            { en: 'name_en', kh: 'name' },
            item.properties,
          );
          const colon = document.createElement('strong');
          colon.innerText = ':';
          colon.style.fontWeight = '600';
          colon.style.marginLeft = '4px';
          td.append(colon);
        }

        tr.append(td);
      });

      tbody.append(tr);
    });

    const conservationTable = document.querySelector(
      '.conservation__area__wrapper table',
    );
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
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi_boundary_2022','geom','IN(''${cfiId}'')')), 0, meters)`,
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
        const item = contents[key];
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
      baseUrl: `/geoserver/${SERVER}/wfs`,
      data: { request: 'GetCapabilities' },
    }),
    Utils.fetchJson({ baseUrl: '/api/active-layers/' + SERVER }),
  ]);

  const ul = document.createElement('ul');
  const featureTypes = cfiRelatedLayers.getElementsByTagName('FeatureType');
  const relatedFeatureTypes = Array.from(featureTypes).filter((featureType) => {
    const name = featureType.getElementsByTagName('Name')[0].textContent;
    const keywordTag = featureType.getElementsByTagName('ows:Keyword');
    if (!keywordTag.length > 0) {
      return false;
    }

    const isInternalLayer = [...keywordTag]
      .map((item) => item.textContent)
      .some((keyword) => keyword === 'internal_layer');
    return !isInternalLayer && layersToShow && layersToShow[name];
  });

  const relatedTypeName = relatedFeatureTypes.map((item) => {
    const typeName = item.getElementsByTagName('Name')[0].textContent;
    return Utils.fetchXml({
      baseUrl: '/geoserver/cfi/wfs',
      data: {
        typeName,
        version: '1.1.0',
        request: 'GetFeature',
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi_boundary_2022', 'geom', 'IN(''${cfiId}'')')), 0, meters)`,
        resultType: 'hits',
      },
    });
  });

  const featureCountArr = await Promise.all(relatedTypeName);
  const hasLayerToShow = featureCountArr.some(
    (item) => Number(item.childNodes[0].getAttribute('numberOfFeatures')) > 0,
  );
  if (hasLayerToShow) {
    document.getElementById('relatedLayers').append(ul);
    document
      .getElementById('relatedLayers')
      .parentElement.classList.remove('d-none');

    relatedFeatureTypes.forEach((featureType, i) => {
      const hasRelatedData =
        Number(
          featureCountArr[i].childNodes[0].getAttribute('numberOfFeatures'),
        ) > 0;
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
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi_boundary_2022','geom','IN(''${cfiId}'')')), 0, meters)`,
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
    a.innerText = I18n.translate(
      { kh: 'title', en: 'title_en' },
      item.properties,
    );
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
    return I18n.translate(
      { en: 'dis_name', kh: 'dis_name_k' },
      districts[0].properties,
    );
  }

  const div = document.createElement('div');
  districts.forEach((item) => {
    const span = document.createElement('span');
    span.classList.add('badge-pill', 'badge-secondary');
    span.innerText = I18n.translate(
      { en: 'dis_name', kh: 'dis_name_k' },
      item.properties,
    );
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
      typeName: 'cfi:district_boundary_2014',
      CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('${defaultProfileTypeName}', 'geom', 'IN(''${data.feature.id}'')')))`,
    },
  });

  const [espg, instersectingDistricts] = await Promise.all([
    fetchEspg,
    fetchDistrict,
  ]);

  const provinceCode = document.querySelector('#provinceSelect option:checked')
    .dataset.provinceCode;
  const districts = instersectingDistricts.features.filter(
    (item) => item.properties.pro_code === Number(provinceCode),
  );

  const { x_coordinate, y_coordinate, sub_name } = data.feature.properties;
  const tbody = document.createElement('tbody');

  // careful about changing key
  // change the listener as well
  const isValidCoord =
    !Utils.isEmptyString(x_coordinate) && !Utils.isEmptyString(y_coordinate);

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
  cfi_b.registration_date = Utils.formatDate(
    data.feature.properties.registration_date,
  );
  cfi_b.coordinate_system = (espg && espg.name) || I18n.translate('no_data');
  cfi_b.referencing_coordinate = coordSpanDOM;
  cfi_b.province = I18n.translate(
    { en: 'province_en', kh: 'province' },
    data.feature.properties,
  );

  if (isValidCoord && espg && espg.name) {
    cfi_b.coordinate_system = getESPGToggleBtn(cfi_b.coordinate_system);
  }

  if (districts && districts.length > 0) {
    cfi_b.district = getDistrictTagDom(districts);
  }

  const NO_FORMATS = ['cfi_code'];

  for (const key in cfi_b) {
    const coloumns = [I18n.translate(key), cfi_b[key]];
    const tr = document.createElement('tr');

    coloumns.forEach((x, i) => {
      const td = document.createElement('td');
      const isKeyCol = i === 0;

      if (x instanceof Element) {
        td.append(x);
      } else if (Utils.isNumeric(x) && !NO_FORMATS.includes(key)) {
        td.innerText = Utils.formatNum(Number(x), ' ');
      } else {
        td.innerText = x;
      }

      if (isKeyCol) {
        const colon = document.createElement('strong');
        colon.innerText = ':';
        colon.style.fontWeight = '600';
        colon.style.marginLeft = '4px';
        td.append(colon);
      }

      if (!isKeyCol && !x) {
        td.innerText = I18n.translate('no_data');
      }

      tr.append(td);
    });

    tbody.append(tr);
  }

  const cfi_name = I18n.translate(
    { en: 'name_en', kh: 'name' },
    data.feature.properties,
  );
  const header = document.querySelector('.about__wrapper .about__header');
  if (I18n.getLang() === 'en') {
    header.innerText = `${sub_name || cfi_name} ${I18n.translate(
      'fishing_community',
    )}`;
  } else {
    header.innerText = `${I18n.translate('fishing_community')}${sub_name || cfi_name
      }`;
  }

  const profileTable = document.querySelector('.about__table__wrapper table');
  profileTable.append(tbody);

  // set conservation table cell width
  const profileTblCell = document.querySelector(
    '.about__table__wrapper table tr td',
  );
  const conservationTblCells = document.querySelectorAll(
    '.conservation__area__wrapper table tr td:first-child',
  );

  if (profileTblCell && conservationTblCells.length > 0) {
    conservationTblCells.forEach((el) => {
      el.style.width = `${profileTblCell.scrollWidth + 1}px`;
    });
  }
}

function addBoundaryClickEvent() {
  OVERLAY_MAP[KEYS.CFI_B].off('click');

  OVERLAY_MAP[KEYS.CFI_B].on('click', async function (e) {
    toggleLoading(true);

    map.setView(e.latlng);
    showActivePolygon(e.layer);

    const cfiId = e.layer.feature.id;
    sessionStorage.setItem(`${SERVER}_community`, cfiId);

    $('.about__body').innerHTML = '';
    $('#cfiSelect').val(cfiId).trigger('change');
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
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi_boundary_2022', 'geom', 'IN(''${cfiId}'')')), 0, meters)`,
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
  const cfiSelect = $('#cfiSelect');
  cfiSelect.append(new Option());

  cfiBoundary.features.forEach((item) => {
    const text = I18n.translate({ en: 'name_en', kh: 'name' }, item.properties);
    const option = new Option(text, item.id, false, false);
    cfiSelect.append(option);
  });

  cfiSelect.off('change.cfi'); // namespace or it will remove select2 event as well
  cfiSelect.on('change.cfi', handleCfiSelect);
  cfiSelect.prop('disabled', false);
}

async function handleProvinceSelect(e, options = {}) {
  $('.about__wrapper').removeClass('active');
  $('#relatedLayers').parent().addClass('d-none');
  $('#relatedDocuments').parent().addClass('d-none');
  $('.province-tooltip .tooltip').removeClass('active');
  $('#cfiSelect')
    .html('')
    .select2({ placeholder: I18n.translate('select_a_fishing_community') });

  const provinceSelect = e.currentTarget;
  const selectedProvinceId = provinceSelect.value;
  const provinceName =
    provinceSelect.options[provinceSelect.selectedIndex].dataset.name;

  // save to cache
  sessionStorage.setItem(`${SERVER}_province`, selectedProvinceId);
  sessionStorage.removeItem(`${SERVER}_community`);

  if (typeof OVERLAY_MAP[KEYS.CFI_B] !== 'undefined') {
    OVERLAY_MAP[KEYS.CFI_B].remove();
  }

  toggleLoading(true);
  let CQL_FILTER = '';

  if (selectedProvinceId && selectedProvinceId !== 'all') {
    CQL_FILTER = `INTERSECTS(geom, collectGeometries(queryCollection('cfi:province_boundary_2014', 'geom', 'IN(''${selectedProvinceId}'')')))`
  }

  const cfiBoundary = await Utils.fetchGeoJson({
    data: {
      typeName: TYPENAME[KEYS.CFI_B],
      CQL_FILTER,
    },
  });

  // load number of CFI
  const label = document.getElementById('cfiCount');
  label.textContent = `(${cfiBoundary.features.length || 0})`;

  if (!cfiBoundary.features.length) {
    toggleLoading(false);
    return;
  }

  if (provinceName) {
    cfiBoundary.features = cfiBoundary.features.filter(
      (item) => item.properties.province.trim() === provinceName,
    );
  }

  cfiBoundary.features.sort();
  OVERLAY_MAP[KEYS.CFI_B] = Utils.getLayer(cfiBoundary, KEYS.CFI_B);
  OVERLAY_MAP[KEYS.CFI_B].addTo(map);

  await loadCfiSelect(cfiBoundary);

  addBoundaryClickEvent();
  toggleLoading(false);

  if (Object.keys(OVERLAY_MAP[KEYS.CFI_B].getBounds()).length > 0) {
    map.flyToBounds(OVERLAY_MAP[KEYS.CFI_B].getBounds(), {
      animate: !options.shouldNotAnimate,
    });
  }
}

async function loadProvince() {
  const provinceSelect = $('#provinceSelect');

  try {
    const res = await Utils.fetchGeoJson({
      data: {
        typeName: 'cfi:province_boundary_2014',
        srsname: 'EPSG:32648',
        outputFormat: 'application/json',
        propertyname: 'pro_name_k,hrname,pro_code',
        SORTBY: 'pro_code ASC',
      },
    });

    const allOption = new Option(I18n.translate('all_province'), 'all');
    provinceSelect.append(new Option());
    provinceSelect.append(allOption).trigger('change');

    res.features.forEach((item) => {
      const option = document.createElement('option');
      option.text = I18n.translate(
        { en: 'hrname', kh: 'pro_name_k' },
        item.properties,
      );
      option.value = item.id;
      option.dataset.name = item.properties.pro_name_k;
      option.dataset.provinceCode = item.properties.pro_code;
      provinceSelect.append(option);
    });

    // const choices = new Choices(provinceSelect);
    $(provinceSelect).on('change', handleProvinceSelect);
  } catch (e) {
    console.warn('Unable to load province select', e);
  }

  $(provinceSelect).prop('disabled', false);
  toggleLoading(false);
}

async function loadSavedOption() {
  const savedProvince = sessionStorage.getItem(`${SERVER}_province`);
  const savedCommunity = sessionStorage.getItem(`${SERVER}_community`);

  if (!savedProvince) { return; }


  $('#provinceSelect').val(savedProvince).trigger('change.select2');
  $('#provinceSelect').on('cacheLoad', async function (e) {
    await handleProvinceSelect(e, { shouldNotAnimate: true });
    if (!savedCommunity) { return; }

    $('#cfiSelect').val(savedCommunity).trigger('change');
  });

  $('#provinceSelect').trigger('cacheLoad');
}

async function loadSettings() {
  const settings = await Utils.fetchJson({
    baseUrl: '/api/default-layer/' + SERVER,
  });

  defaultProfileTypeName = settings['profile'];
  defaultChartTypeName = settings['chart'];
  defaultConservationTypeName = settings['conservation'];
}

$(document).ready(async function () {
  await Promise.all([loadSettings(), I18n.init()]);

  $('#provinceSelect').select2({
    placeholder: I18n.translate('select_a_province'),
  });
  
  $('#cfiSelect').select2({
    placeholder: I18n.translate('select_a_fishing_community')
  });

  await loadProvince();
  await loadSavedOption();
  // toggleLoading(false);
});
