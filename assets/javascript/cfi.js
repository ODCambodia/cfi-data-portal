const map = L.map('map', {
  center: [12.5657, 104.991],
  zoom: 7,
});

L.control.scale().addTo(map);
const mapLink = '<a href="http://www.esri.com/">Esri</a>';
const WHO_Link = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const BASE_MAP = {
  'Open Street Map': L.tileLayer(
    'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; ' + mapLink + ', ' + WHO_Link,
    maxZoom: 20,
  }).addTo(map),
};

const OVERLAY_MAP = {};
const REGEX_YEAR = /(_(20)\d{2})/s;
let activePolygon = null;

function showActivePolygon(layer) {
  if (activePolygon !== null) {
    // Reset style|
    activePolygon.setStyle(POLYGON_STYLE.default);
    activePolygon = null;
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
  const gCRS = '+proj=longlat +datum=WGS84 +no_defs +type=crs'  //WGS 84
  const lCRS = "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs +type=crs"; //WGS 84/UTM Zone 48N
  let currentCoord = document.getElementById('espgCoordDOM').textContent;
  let newCorrdinate = '';
  let decimalsPos = 2;
  if (!currentCoord) { return }

  currentCoord = currentCoord.split(' ').map(x => Number(x));
  if (currentCRS === 'WGS 84') {
    currentCoord.reverse();
    newCorrdinate = proj4(gCRS, lCRS, currentCoord); // but it take function as x,y ???
    decimalsPos = 2;
  } else {
    console.log('else')
    newCorrdinate = proj4(lCRS, gCRS, currentCoord); // return as long, lat for some reason ???
    newCorrdinate.reverse();
    decimalsPos = 6;
  }

  console.log({ newCorrdinate });
  document.getElementById('espgCoordDOM').innerText = newCorrdinate.map(x => Number(x).toFixed(decimalsPos)).join(' ');
}

function getESPGToggleBtn(text, coordinateDOM) {
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
  tableProfile.style.marginBottom = '5px';
  tableProfile.style.textAlign = 'left';

  const tableWrapper = document.createElement('div');
  tableWrapper.append(tableProfile);
  tableWrapper.classList.add('about__table__wrapper');

  const chartWrapper = document.createElement('div');
  chartWrapper.classList.add('chart__wrapper');

  /* Draw chart */
  const memberPieChart = document.createElement('canvas');
  memberPieChart.id = 'memberPieChart';

  const committeePieChart = document.createElement('canvas');
  committeePieChart.id = 'committeePieChart';

  const populationPieChart = document.createElement('canvas');
  populationPieChart.id = 'populationPieChart';

  chartWrapper.append(memberPieChart);
  chartWrapper.append(committeePieChart);
  chartWrapper.append(populationPieChart);

  // Appending everything
  const body = document.querySelector('.about__body');
  body.append(tableWrapper);
  body.append(chartWrapper);
}

const DemoGraphyChart = (function () {
  const CHARTS_CONF = {
    committee: {
      typeName: 'cfi:cfi_status_assessment_2018',
      id: 'committeePieChart',
      title: 'ចំនួនគណៈកម្មការ',
      labels: ['ស្រី', 'ប្រុស'],
      propertyKeys: {
        female: 'cfi_cmte_female',
        total: 'cfi_cmte_total',
      },
    },
    member: {
      typeName: 'cfi:cfi_status_assessment_2018',
      id: 'memberPieChart',
      title: 'ចំនួនសមាជិក',
      labels: ['ស្រី', 'ប្រុស'],
      propertyKeys: {
        female: 'cfi_member_female',
        total: 'cfi_member_total',
      },
    },
    population: {
      typeName: defaultChartTypeName,
      id: 'populationPieChart',
      title: 'ចំនួនប្រជាសហគមន៍',
      labels: ['ស្រី', 'ប្រុស'],
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

async function handleRelatedLayerClick(e) {
  e.currentTarget.parentNode.childNodes.forEach((item) =>
    item.classList.remove('active'),
  );
  e.currentTarget.classList.add('active');

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

  const table = document.querySelector('#cfiModal table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.innerHTML = '';

  const headers = Object.keys(layerData.features[0].properties).map(
    (key) => TRANSLATE[key] || key,
  );
  const trHead = document.createElement('tr');

  headers.push('ទាញយក');
  headers.forEach((head) => {
    const th = document.createElement('th');
    th.innerText = head;
    trHead.append(th);
  });

  layerData.features.forEach((layer) => {
    const contents = Object.values(layer.properties);
    const tr = document.createElement('tr');

    contents.push(
      getDownloadDom(
        `/geoserver/cfi/wfs?service=WFS&version=1.1.0&request=GetFeature&outputFormat=text/csv&typeName=${typeName}&featureId=${layer.id}`,
      ),
    );
    contents.forEach((item) => {
      const td = document.createElement('td');
      td.append(item);
      tr.append(td);
    });

    tbody.append(tr);
  });

  thead.append(trHead);
  table.append(thead);
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
    a.innerText = item.properties.title;
    a.style.color = '#000';
    a.target = '_blank';

    li.append(a);
    ul.append(li);
  });

  relatedDocumentsDOM.append(ul);
  relatedDocumentsDOM.parentElement.classList.remove('d-none');
}

async function showCFI_B(data, defaultCrs) {
  document.body.querySelector('.about__wrapper').classList.add('active');
  const espg = await Utils.fetchGeoJson(
    { baseUrl: `https://epsg.io/${defaultCrs}.json` },
    false,
  );
  const {
    x_coordinate,
    y_coordinate,
    area,
    updated_by,
    name,
    name_en,
    sub_name,
    created_by,
    created_date,
    updated_date,
    province_en,
    app,
    ...cfi_b
  } = data.feature.properties;
  const tbody = document.createElement('tbody');

  // careful about changing key
  // change the listener as well
  cfi_b['ប្រព័ន្ធនិយាមកា'] = (espg && espg.name) || 'មិនមានព័ត៌មាន';
  cfi_b['និយាមកាយោង'] = `${x_coordinate} ${y_coordinate}`;

  // modify without affecting other translation
  const translate = { ...TRANSLATE };
  translate['province'] = 'ស្ថិតក្នុងខេត្ត';

  for (const key in cfi_b) {
    const tr = document.createElement('tr');

    if (key === 'creation_date' || key === 'registration_date') {
      cfi_b[key] = Utils.formatDate(cfi_b[key]);
    } else if (key === 'ប្រព័ន្ធនិយាមកា') {
      cfi_b[key] = getESPGToggleBtn(cfi_b[key]);
    } else if (key === 'និយាមកាយោង') {
      const span = document.createElement('span');
      span.id = 'espgCoordDOM'
      span.innerText = cfi_b[key];
      cfi_b[key] = span;
    }

    [translate[key] || key, cfi_b[key]].forEach((x, i) => {
      const td = document.createElement('td');

      if (x instanceof Element) {
        td.append(x);
      } else {
        td.innerText = x;
      }

      if (i > 0 && !x) {
        td.innerText = 'មិនមានព័ត៌មាន';
      }

      tr.append(td);
    });

    tbody.append(tr);
  }

  const header = document.querySelector('.about__header');
  header.innerText = `សហគមន៍នេសាទ${sub_name || name}`;

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

    drawAboutSection();
    await DemoGraphyChart.loadAllChart(cfiId);

    const cfiProfile = await Utils.fetchGeoJson({
      data: {
        typeName: defaultProfileTypeName,
        SORTBY: 'name ASC',
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
      },
    });
    const defaultCrs = await loadRelatedLayers(cfiId);
    await showCFI_B({ feature: cfiProfile.features[0] }, defaultCrs);

    await loadRelatedDocuments(cfiId);
    toggleLoading(false);
  });
}

async function handleCfiSelect(e) {
  toggleLoading(true);
  const cfiId = e.currentTarget.value;
  document.querySelector('.about__body').innerHTML = '';
  const cfiProfile = await Utils.fetchGeoJson({
    data: {
      typeName: defaultProfileTypeName,
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
    },
  });

  drawAboutSection();
  await DemoGraphyChart.loadAllChart(cfiId);
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

  await loadRelatedDocuments(cfiId);
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
  cfiSelect.append(Utils.defaultOptionDOM('ជ្រើសរើសសហគមន៍នេសាទ'));
  uniqueCfi.forEach((item) => {
    const option = document.createElement('option');
    option.text = item.properties.name;
    option.value = item.id;
    cfiSelect.append(option);
  });

  cfiSelect.addEventListener('change', handleCfiSelect);
  cfiSelect.removeAttribute('disabled');
}

async function handleProvinceSelect(e) {
  document.body.querySelector('.about__wrapper').classList.remove('active');
  document.getElementById('relatedLayers').parentElement.classList.add('d-none');


  const selectedProvinceId = e.currentTarget.value;

  if (typeof OVERLAY_MAP[KEYS.CFI_B] !== 'undefined') {
    OVERLAY_MAP[KEYS.CFI_B].remove();
  }

  toggleLoading(true);
  const CQL_FILTER = selectedProvinceId
    ? `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cambodian_provincial','geom','IN(''${selectedProvinceId}'')')))`
    : '';
  const cfiBoundary = await Utils.fetchGeoJson({
    data: {
      typeName: TYPENAME[KEYS.CFI_B],
      CQL_FILTER,
    },
  });
  OVERLAY_MAP[KEYS.CFI_B] = Utils.getLayer(cfiBoundary, KEYS.CFI_B);
  OVERLAY_MAP[KEYS.CFI_B].addTo(map);

  await loadCfiSelect(cfiBoundary);

  addBoundaryClickEvent();
  toggleLoading(false);
  map.flyToBounds(OVERLAY_MAP[KEYS.CFI_B].getBounds());

  // load number of CFI
  const label = document.getElementById('cfiCount');
  label.textContent = `[${cfiBoundary.numberReturned}]`;
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
      Utils.defaultOptionDOM('ជ្រើសរើសខេត្តឬក្រុង', {
        disabled: true,
        selected: true,
      }),
    );
    provinceSelect.append(
      Utils.defaultOptionDOM('ខេត្តទាំងអស់', { value: '' }),
    );
    res.features.forEach((item) => {
      const option = document.createElement('option');
      option.text = item.properties.pro_name_k;
      option.value = item.id;
      provinceSelect.append(option);
    });

    provinceSelect.addEventListener('change', handleProvinceSelect);
  } catch (e) {
    console.warn('Unable to load province select', e);
  }
}

async function init() {
  await loadProvince();
  toggleLoading(false);
  document.getElementById('provinceSelect').removeAttribute('disabled');
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
