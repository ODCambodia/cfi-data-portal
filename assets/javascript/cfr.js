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
  }),
  'Open Street Map': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map)
};

L.control.scale().addTo(map);
L.control.layers(BASE_MAP).addTo(map);
L.control.resetView({
  position: "topleft",
  title: "Reset view",
  latlng: L.latLng(DEFAULT_COORD),
  zoom: 7,
}).addTo(map);

const OVERLAY_MAP = {};
const DemoGraphyChart = (function () {
  const CHARTS_CONF = {
    committee: {
      typeName: defaultProfileTypeName,
      id: 'committeePieChart',
      title: I18n.translate('committees'),
      labels: [I18n.translate('female'), I18n.translate('male')],
      propertyKeys: {
        female: 'num_cmte_female',
        total: 'num_cmte_mem',
      },
    },
    population: {
      typeName: defaultChartTypeName,
      id: 'populationPieChart',
      title: I18n.translate('population'),
      labels: [I18n.translate('female'), I18n.translate('male')],
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

async function showCFR_A(data) {
  drawAboutSection();
  document.body.querySelector('.about__wrapper').classList.add('active');
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

  // modify without affecting other translation
  cfi_b['in_province'] = data.feature.properties[I18n.translate({ en: 'province_en', kh: 'province' })];

  for (const key in cfi_b) {
    const tr = document.createElement('tr');

    if (key === 'creation_date' || key === 'registration_date') {
      cfi_b[key] = Utils.formatDate(cfi_b[key]);
    }

    [key, cfi_b[key]].forEach((x, i) => {
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
  header.innerText = I18n.translate('fish_reservation_community') + ' ' + cfr_name;

  const profileTable = document.querySelector('.about__table__wrapper table');
  profileTable.append(tbody);


  loadRelatedDocuments(data.feature.id);
  DemoGraphyChart.loadAllChart(data.feature);
}

async function loadCFRMap(options) {
  const cfr_data = await Utils.fetchGeoJson({ data: { typeName: TYPENAME[KEYS.CFR_A], ...options } });
  const provinceName = document.querySelector('#provinceSelect option:checked').dataset.name;

  if (provinceName) {
    cfr_data.features = cfr_data.features.filter((item) => item.properties.province.trim() === provinceName);
  }

  OVERLAY_MAP[KEYS.CFR_A] = Utils.getLayer(cfr_data, KEYS.CFR_A);
  OVERLAY_MAP[KEYS.CFR_A].addTo(map);
  OVERLAY_MAP[KEYS.CFR_A].off('click');
  OVERLAY_MAP[KEYS.CFR_A].on('click', function (e) {
    showCFR_A(e.layer);
  });

  // load number of CFR
  const label = document.getElementById('cfiCount');
  label.textContent = `[${cfr_data.features.length || 0}]`;

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

    provinceSelect.addEventListener('change', async function (e) {
      document.body.querySelector('.about__wrapper').classList.remove('active');
      document.getElementById('relatedLayers').parentElement.classList.add('d-none');
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
      const CQL_FILTER = val ? `DWITHIN(geom, collectGeometries(queryCollection('cfr:cambodian_provincial','geom','IN(''${val}'')')), 0, meters)` : '';
      const overlay = await loadCFRSelect({ CQL_FILTER });
      const bounds = overlay.getBounds();

      if (Object.keys(bounds).length > 0) {
        map.flyToBounds(bounds, { maxZoom: 9 });
      }

      toggleLoading(false);
    });
  } catch (e) {
    console.warn(e);
  }
}

async function init() {
  await I18n.init();
  await loadProvinceCFR();
  document.getElementById('provinceSelect').removeAttribute('disabled');
  toggleLoading(false);
}

if (document.readyState !== 'loading') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
