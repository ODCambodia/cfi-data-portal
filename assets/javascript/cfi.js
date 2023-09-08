const map = L.map('map', {
  center: [12.5657, 104.991],
  zoom: 7,
});

L.control.scale().addTo(map);

const BASE_MAP = {
  'Open Street Map': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map),
};
const OVERLAY_MAP = {};
const REGEX_YEAR = /(_(20)\d{2})$/s;

function toggleLoading(shouldShow) {
  document
    .getElementById('loadingOverlay')
    .classList.toggle('is-active', shouldShow);
}

function getDownloadDom(href) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = 'ទាញយក';

  return a;
}

function drawAboutSection() {
  const tableProfile = document.createElement('table');
  tableProfile.style.marginBottom = '5px';
  tableProfile.style.textAlign = 'left';

  const tableWrapper = document.createElement('div');
  tableWrapper.append(tableProfile);
  tableWrapper.classList.add('about__table__wrapper');

  const tableContact = tableProfile.cloneNode(true);
  const contactTblWrapper = document.createElement('div');
  const contactHeader = document.createElement('strong');
  contactHeader.innerText = 'ព័ត៌មានទំនាក់ទំនង';

  contactTblWrapper.append(contactHeader);
  contactTblWrapper.append(tableContact);
  contactTblWrapper.classList.add('contact__table__wrapper');

  const chartWrapper = document.createElement('div');
  chartWrapper.classList.add('chart__wrapper');

  /* Draw chart */
  const pieChart = document.createElement('canvas');
  pieChart.id = 'pieChart';

  const barChart = document.createElement('canvas');
  barChart.id = 'barChart';

  chartWrapper.append(pieChart);
  chartWrapper.append(barChart);

  // Appending everything
  const body = document.querySelector('.about__body');
  body.append(tableWrapper);
  body.append(contactTblWrapper);
  body.append(chartWrapper);

  CustomCharts.pieChart(pieChart.id);
  CustomCharts.barChart(barChart.id);
}

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
    setTimeout(function () { alert('មិនមានព័ត៌មាន'); }, 1);
    return;
  }

  const table = document.querySelector('#cfiModal table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.innerHTML = '';

  const headers = Object.keys(layerData.features[0].properties).map((key) => TRANSLATE[key] || key);
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

    contents.push(getDownloadDom(`/geoserver/cfi/wfs?service=WFS&version=1.1.0&request=GetFeature&outputFormat=text/csv&typeName=${typeName}&featureId=${layer.id}`));
    contents.forEach((item) => {
      const td = document.createElement('td');
      td.append(item);
      tr.append(td);
    })

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
  const cfiRelatedLayers = await Utils.fetchXml({
    baseUrl: '/geoserver/cfi/wfs',
    data: { request: 'GetCapabilities' },
  });
  const featureTypes = [
    ...cfiRelatedLayers.getElementsByTagName('FeatureType'),
  ].map((item) => item.childNodes);
  const relatedFeatureTypes = featureTypes.filter(
    (item) =>
      REGEX_YEAR.test(item[1].innerHTML) &&
      !item[1].innerHTML.includes('profile') &&
      !item[1].innerHTML.includes('contact') &&
      !item[1].innerHTML.includes('committee'),
  );

  const ul = document.createElement('ul');
  relatedFeatureTypes.forEach((item) => {
    const name = item[0];
    const titleXml = item[1];
    const li = document.createElement('li');
    li.textContent = titleXml.textContent;
    li.dataset.name = name.textContent;
    li.dataset.cfiId = cfiId;
    li.addEventListener('click', handleRelatedLayerClick);
    ul.append(li);
  });

  document.getElementById('relatedLayers').append(ul);
  return featureTypes
    .find((item) => item[1].textContent.includes('profile'))[4]
    .textContent.split('::')[1];
}

async function loadRelatedDocuments(cfiId) {
  document.getElementById('relatedDocuments').innerHTML = '';
  const releatedDocuments = await Utils.fetchGeoJson({
    data: {
      typeName: '	cfi:documents',
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
    },
  });

  const ul = document.createElement('ul');
  releatedDocuments.features.forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.properties.url;
    a.innerText = item.properties.title;
    a.style.color = '#000';
    a.target = "_blank";

    li.append(a);
    ul.append(li);
  });

  const relatedDocWrapper = document.getElementById('relatedDocuments');
  relatedDocWrapper.append(ul);
}

async function loadCfiContactBody(data) {
  const tbody = document.createElement('tbody');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const cols = {
    cmte_name: 'ឈ្មោះ',
    cmte_phone: 'លេខទូរសព្ទ',
    cmte_position: 'តំណែង'
  };

  const contacts = data.features
    .filter((item) => !!item.properties.cmte_phone)
    .map((item) => item.properties);


  const tempCols = Object.keys(contacts[0]).filter((key) => cols[key] !== undefined);

  // Table header
  tempCols.map((key) => {
    const th = document.createElement('th');
    th.innerText = cols[key];
    trHead.append(th);
  });
  thead.append(trHead);

  contacts.forEach((contact) => {
    const tr = document.createElement('tr');

    for (let key in contact) {
      if (typeof cols[key] === 'undefined') {
        continue;
      }

      const td = document.createElement('td');
      td.innerText = contact[key] || 'មិនមានព័ត៌មាន';
      tr.append(td);
    }

    tbody.append(tr);
  });

  const table = document.querySelector('.contact__table__wrapper table');
  table.append(thead);
  table.append(tbody);
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

  cfi_b['ប្រព័ន្ធនិយាមការ'] = (espg && espg.name) || 'មិនមានព័ត៌មាន';
  cfi_b['និយាមការយោង'] = `${x_coordinate} ${y_coordinate}`;

  for (const key in cfi_b) {
    const tr = document.createElement('tr');
    const translate = TRANSLATE;
    translate['province'] = 'ស្ថិតក្នុងខែត្រ';

    [translate[key] || key, cfi_b[key]].forEach((x, i) => {
      const td = document.createElement('td');

      if (i > 0 && !x) {
        td.innerText = 'មិនមានព័ត៌មាន';
      } else {
        td.innerText = x;
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

function handleBoundaryFilter() {
  OVERLAY_MAP[KEYS.CFI_B].off('click');

  OVERLAY_MAP[KEYS.CFI_B].on('click', async function (e) {
    toggleLoading(true);
    map.setView(e.latlng);
    document.querySelector('.about__body').innerHTML = '';

    document.getElementById('cfiSelect').value = '';
    drawAboutSection();

    const cfiProfile = await Utils.fetchGeoJson({
      data: {
        typeName: 'cfi:cfi_profiles_2023',
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${e.layer.feature.id}'')')), 0, meters)`,
      },
    });
    const defaultCrs = await loadRelatedLayers(e.layer.feature.id);
    showCFI_B({ feature: cfiProfile.features[0] }, defaultCrs);

    const cfiCommitee = await Utils.fetchGeoJson({
      data: {
        maxFeatures: 2,
        typeName: 'cfi:cfi_committee_2018',
        CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${e.layer.feature.id}'')')), 0, meters)`,
      },
    });

    if (cfiCommitee.features.length > 0) {
      loadCfiContactBody(cfiCommitee);
    } else {
      const contactHeader = document.querySelector(
        '.contact__table__wrapper strong',
      );
      contactHeader.innerText = 'មិន​មានព័ត៌មានទំនាក់ទំនង';
    }

    await loadRelatedDocuments(e.layer.feature.id)
    toggleLoading(false);
  });
}

async function handleCfiSelect(e) {
  toggleLoading(true);
  const cfiId = e.currentTarget.value;
  document.querySelector('.about__body').innerHTML = '';
  const cfiProfile = await Utils.fetchGeoJson({
    data: {
      typeName: 'cfi:cfi_profiles_2023',
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
    },
  });

  drawAboutSection();

  if (cfiProfile.features.length > 0) {
    const defaultCrs = await loadRelatedLayers(cfiId);
    showCFI_B({ feature: cfiProfile.features[0] }, defaultCrs);
  }

  const cfiCommitee = await Utils.fetchGeoJson({
    data: {
      maxFeatures: 2,
      typeName: 'cfi:cfi_committee_2018',
      CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${cfiId}'')')), 0, meters)`,
    },
  });
  if (cfiCommitee.features.length > 0) {
    loadCfiContactBody(cfiCommitee);
  } else {
    const contactHeader = document.querySelector(
      '.contact__table__wrapper strong',
    );
    contactHeader.innerText = 'មិន​មានព័ត៌មានទំនាក់ទំនង';
  }

  await loadRelatedDocuments(cfiId)
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
  ];

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
  const selectedProvinceId = e.currentTarget.value;
  OVERLAY_MAP[KEYS.CFI_B].remove();

  const cfiBoundary = await Utils.fetchGeoJson({
    data: {
      typeName: TYPENAME[KEYS.CFI_B],
      CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cambodian_provincial','geom','IN(''${selectedProvinceId}'')')))`,
    },
  });
  OVERLAY_MAP[KEYS.CFI_B] = Utils.getLayer(cfiBoundary, KEYS.CFI_B);
  OVERLAY_MAP[KEYS.CFI_B].addTo(map);

  loadCfiSelect(cfiBoundary);

  handleBoundaryFilter();
  map.flyToBounds(OVERLAY_MAP[KEYS.CFI_B].getBounds());
}

async function loadProvince() {
  try {
    const res = await fetch('/api/provinces');
    const data = await res.json();

    const provinceSelect = document.getElementById('provinceSelect');

    // append options to select
    provinceSelect.append(Utils.defaultOptionDOM('ជ្រើសរើសខេត្តឬក្រុង'));
    data.features.forEach((item) => {
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

// function showCFR_A(data) {
//   const { cfr_name, sub_name, name_en, ...cfr_a } = data.properties;
//   const tbody = document.createElement('tbody');
//   Utils.omitFromObject(cfr_a, ['_validation_status', 'Remark', 'cfr_image_URL', 'cfr_image', 'total_men', 'total_women', '_id', '_uuid'])
//   for (const key in cfr_a) {
//     // terrible code

//     const tr = document.createElement('tr');

//     [TRANSLATE[key] || key, cfr_a[key]].forEach(x => {
//       const td = document.createElement('td');
//       td.innerText = x;
//       tr.append(td);
//     })

//     tbody.append(tr);
//   }
//   const table = document.createElement('table');
//   table.append(tbody);
//   table.style.display = 'block';
//   table.style.marginBottom = '5px';

//   const header = document.createElement('strong');
//   header.innerText = `ឈ្មោះ​សហគមន៍៖ ${cfr_name}`;

//   const body = document.querySelector('.about__body');
//   body.innerHTML = '';
//   body.append(header);
//   body.append(table);

//   // CustomCharts.pieChart();
//   // CustomCharts.barChart();
// }

async function loadCFIMap() {
  OVERLAY_MAP[KEYS.CFI_B] = await Utils.getGeoJsonLayer(KEYS.CFI_B);
  OVERLAY_MAP[KEYS.CFI_B].addTo(map);
}

async function init() {
  await loadCFIMap();
  toggleLoading(false);
  document.getElementById('provinceSelect').removeAttribute('disabled');
  loadProvince();
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
