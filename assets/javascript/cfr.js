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

const DemoGraphyChart = (function () {
  const CHARTS_CONF = {
    committee: {
      typeName: 'cfi:cfi_status_assessment_2018',
      id: 'committeePieChart',
      title: 'ចំនួនគណៈកម្មការ',
      labels: ['ស្រី', 'ប្រុស'],
      propertyKeys: {
        female: 'num_cmte_female',
        total: 'num_cmte_mem',
      },
    },
    // member: {
    //   typeName: 'cfi:cfi_status_assessment_2018',
    //   id: 'memberPieChart',
    //   title: 'ចំនួនសមាជិក',
    //   labels: ['ស្រី', 'ប្រុស'],
    //   propertyKeys: {
    //     female: 'cfi_member_female',
    //     total: 'cfi_member_total',
    //   },
    // },
    population: {
      typeName: defaultChartTypeName,
      id: 'populationPieChart',
      title: 'ចំនួនប្រជាសហគមន៍',
      labels: ['ស្រី', 'ប្រុស'],
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

  function loadAllChart(cfr) {
    return Promise.all([
      loadChart(cfr, CHARTS_CONF.committee),
      loadChart(cfr, CHARTS_CONF.population),
      // loadChart(cfiId, CHARTS_CONF.member),
    ]);
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
      CQL_FILTER: `Dwithin(geom, collectGeometries(queryCollection('cfr:cfr_wf_assessment_2022','geom','IN(''${cfiId}'')')), 1, meters)`,
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
  // const memberPieChart = document.createElement('canvas');
  // memberPieChart.id = 'memberPieChart';

  const committeePieChart = document.createElement('canvas');
  committeePieChart.id = 'committeePieChart';

  const populationPieChart = document.createElement('canvas');
  populationPieChart.id = 'populationPieChart';

  // chartWrapper.append(memberPieChart);
  chartWrapper.append(committeePieChart);
  chartWrapper.append(populationPieChart);

  // Appending everything
  const body = document.querySelector('.about__body');
  body.append(tableWrapper);
  body.append(chartWrapper);
}

async function showCFR_A(data, defaultCrs) {
  drawAboutSection();
  document.body.querySelector('.about__wrapper').classList.add('active');
  // const espg = await Utils.fetchGeoJson(
  //   { baseUrl: `https://epsg.io/${defaultCrs}.json` },
  //   false,
  // );
  const {
    x_coordinate,
    y_coordinate,
    area,
    updated_by,
    name_en,
    cfr_name,
    created_by,
    created_date,
    updated_date,
    province_en,
    app,
    _validation_status,
    _id,
    _uuid,
    ...cfi_b
  } = data.feature.properties;
  const tbody = document.createElement('tbody');

  // cfi_b['ប្រព័ន្ធនិយាមកា'] = (espg && espg.name) || 'មិនមានព័ត៌មាន';
  // cfi_b['និយាមកាយោង'] = `${x_coordinate} ${y_coordinate}`;

  // modify without affecting other translation
  const translate = { ...TRANSLATE };
  translate['province'] = 'ស្ថិតក្នុងខេត្ត';

  for (const key in cfi_b) {
    const tr = document.createElement('tr');

    if (key === 'creation_date' || key === 'registration_date') {
      cfi_b[key] = Utils.formatDate(cfi_b[key]);
    }

    [translate[key] || key, cfi_b[key]].forEach((x, i) => {
      const td = document.createElement('td');
      td.innerText = x;

      if (i > 0 && !x) {
        td.innerText = 'មិនមានព័ត៌មាន';
      }

      tr.append(td);
    });

    tbody.append(tr);
  }

  const header = document.querySelector('.about__header');
  header.innerText = `សហគមន៍នេសាទ${cfr_name}`;

  const profileTable = document.querySelector('.about__table__wrapper table');
  profileTable.append(tbody);


  loadRelatedDocuments(data.feature.id);
  DemoGraphyChart.loadAllChart(data.feature);
}

async function loadCFRMap(options) {
  const cfr_data = await Utils.fetchGeoJson({ data: { typeName: TYPENAME[KEYS.CFR_A], ...options } });
  OVERLAY_MAP[KEYS.CFR_A] = Utils.getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].off('popupopen');
  OVERLAY_MAP[KEYS.CFR_A].on('popupopen', async function (e) {
    showCFR_A(e.layer);
  });
}

async function loadCFRSelect(options) {
  const cfr_data = await Utils.fetchGeoJson({ data: { typeName: TYPENAME[KEYS.CFR_A], ...options } });
  OVERLAY_MAP[KEYS.CFR_A] = Utils.getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].on('popupopen', async function (e) {
    showCFR_A(e.layer);
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
      showCFR_A({ feature: selectedCFR });
    }
  });

  cfiSelect.removeAttribute('disabled');

  return OVERLAY_MAP[KEYS.CFR_A];
}

async function loadProvinceCFR() {
  try {
    const data = await Utils.fetchGeoJson({
      data: {
        typeName: 'cfr:cambodian_provincial',
        outputFormat: 'application/json',
        propertyname: 'ADM1_EN,ADM1_PCODE,ADM0_EN,ADM0_PCODE'
      }
    })
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

      const overlay = await loadCFRSelect({ CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfr:cambodian_provincial','geom','IN(''${val}'')')), 0, meters)` });
      map.flyToBounds(overlay.getBounds(), { maxZoom: 9 });
    });
  } catch (e) {
    console.warn(e);
  }
}

async function loadSettings() {
  const settings = await Promise.all([
    Utils.fetchJson({ baseUrl: 'api/default-profile-layer/cfi' }),
    Utils.fetchJson({ baseUrl: 'api/default-chart-layer/cfi' }),
  ]);

  defaultProfileTypeName = Object.keys(settings[0])[0];
  defaultChartTypeName = Object.keys(settings[1])[0];
}

async function init() {
  await Promise.all([
    loadProvinceCFR(),
    loadCFRMap(),
    loadSettings(),
  ]);
  document.getElementById('provinceSelect').removeAttribute('disabled');
  toggleLoading(false);
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}