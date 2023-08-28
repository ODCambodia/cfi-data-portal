const map = L.map('map', {
  center: [12.5657, 104.991],
  zoom: 7,
});

L.control.scale().addTo(map);

const BASE_MAP = {
  'Open Street Map': L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  ).addTo(map),
};
const OVERLAY_MAP = {};
const SERVER = Utils.getQueryParam('map') || 'cfi';
const GEOSERVER = `/geoserver/${SERVER}/ows`;

const CustomCharts = {
  pieChart: function () {
    const pieData = {
      labels: ['ស្រី', 'ប្រុស'],
      datasets: [{
        label: 'សមភាពយេនឌ័រនៃសហគមន៍',
        data: [Utils.getRandom(), Utils.getRandom()],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
        ],
        hoverOffset: 4
      }]
    };
    const body = document.querySelector('.about__body');

    const pieHeader = document.createElement('p');
    pieHeader.innerText = 'សមភាពយេនឌ័រនៃសហគមន៍';
    pieHeader.style.textAlign = 'center';
    pieHeader.style.color = '#2f4f4f';

    const pieChart = document.createElement('canvas');
    pieChart.id = 'pieChart';

    body.append(pieHeader);
    body.append(pieChart);

    new Chart(document.getElementById('pieChart'), { type: 'pie', data: pieData });
  },
  barChart: function () {
    const barChart = document.createElement('canvas');
    barChart.id = 'barChart';

    const barData = {
      labels: ['2020', '2021', '2022', '2023'],
      datasets: [{
        label: 'ហិរញ្ញទានប្រចាំឆ្នាំ(លានរៀល)',
        data: [Utils.getRandom(), Utils.getRandom(), Utils.getRandom(), Utils.getRandom()],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(255, 205, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 1
      }]
    };

    const body = document.querySelector('.about__body');
    body.append(barChart);

    new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: barData,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      },
    });
  }
}

function showCFI_A(data) {
  const modal = document.getElementById('cfiModal');
  const ul = document.createElement('ul');
  data.features.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.properties.cfi_name;
    btn.classList.add('cfi-btn');

    btn.addEventListener('click', function () {
      const tbody = document.querySelector('#cfiModal tbody');
      tbody.innerHTML = '';
      Utils.omitFromObject(item.properties, ['id_516_cfi', 'date', '_id', '_uuid'])
      for (const key in item.properties) {
        const tr = document.createElement('tr');

        [TRANSLATE[key] || key, item.properties[key]].forEach(x => {
          const td = document.createElement('td');
          td.innerText = x;
          tr.append(td);
        })

        tbody.append(tr);
      }

      modal.style.display = "block";
    });

    const li = document.createElement('li');
    li.append(btn);
    ul.append(li);
  })

  const body = document.querySelector('.about__body');
  body.append(ul);
}

function showCFI_B(data) {
  const { source, sub_name, name, name_en, area, ...cfi_b } = data.feature.properties;
  const tbody = document.createElement('tbody');
  for (const key in cfi_b) {
    // terrible code
    if (key === 'province_en') {
      continue;
    } else if (key === 'province') {
      cfi_b[key] += `(${cfi_b['province_en']})`;
    } else if (key === 'creation_date' || key === 'registration_date' && typeof cfi_b[key] === 'string') {
      cfi_b[key] = cfi_b[key].slice(0, -1);
    }

    const tr = document.createElement('tr');

    [TRANSLATE[key], cfi_b[key]].forEach(x => {
      const td = document.createElement('td');
      td.innerText = x;
      tr.append(td);
    })

    tbody.append(tr);
  }
  const table = document.createElement('table');
  table.append(tbody);
  table.style.marginBottom = '5px';

  const header = document.createElement('strong');
  header.innerText = `ឈ្មោះ​សហគមន៍៖ ${name || sub_name} (${name_en})`;

  const body = document.querySelector('.about__body');
  body.append(header);
  body.append(table);

  CustomCharts.pieChart();
  CustomCharts.barChart();
}

function getLayer(data, key) {
  return L.geoJson(data, {
    style: CONFIGS.styles[key],
    onEachFeature: CONFIGS.eachFeatureHandler[key],
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, CONFIGS.styles[key](feature)),
  });
}

async function getGeoJsonLayer(key, options = {}) {
  const data = await Utils.fetch({
    ...options,
    data: { typeName: TYPENAME[key], ...(options.data ? options.data : {}) },
  });

  return getLayer(data, key);
}

async function handleBoundaryFilter() {
  OVERLAY_MAP[KEYS.CFI_B].off('popupopen');

  OVERLAY_MAP[KEYS.CFI_B].on('popupopen', async function (e) {
    OVERLAY_MAP[KEYS.CFI_A].remove();

    const cfi_data = await Utils.fetch({ data: { typeName: TYPENAME[KEYS.CFI_A], CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${e.layer.feature.id}'')')), 0, meters)` } });
    OVERLAY_MAP[KEYS.CFI_A] = getLayer(cfi_data, KEYS.CFI_A);
    OVERLAY_MAP[KEYS.CFI_A].addTo(map);

    map.setView(e.popup._latlng);
    document.querySelector('.about__body').innerHTML = '';

    if (cfi_data.features.length > 0) {
      showCFI_A(cfi_data);
    }

    document.getElementById('cfiSelect').value = '';
    showCFI_B(e.layer);
  });
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
      option.value = item.properties.pro_code;
      provinceSelect.append(option);
    });

    // on province select
    provinceSelect.addEventListener('change', async function (e) {
      const val = e.currentTarget.value;
      OVERLAY_MAP[KEYS.CFI_B].remove();

      const cfi_b_data = await Utils.fetch({ data: { typeName: TYPENAME[KEYS.CFI_B], CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cambodian_provincial','geom','pro_code = ${val}')))` } });
      OVERLAY_MAP[KEYS.CFI_B] = getLayer(cfi_b_data, KEYS.CFI_B);
      OVERLAY_MAP[KEYS.CFI_B].addTo(map);

      handleBoundaryFilter();
      map.flyToBounds(OVERLAY_MAP[KEYS.CFI_B].getBounds());
      //load cfi select
      const cfiSelect = document.getElementById('cfiSelect');
      cfiSelect.innerHTML = '';
      const uniqueCfi = [...new Map(cfi_b_data.features.map(item => [item.properties.name, item])).values()];

      cfiSelect.append(Utils.defaultOptionDOM('ជ្រើសរើសសហគមន៍នេសាទ'));
      uniqueCfi.forEach((item) => {
        const option = document.createElement('option');
        option.text = item.properties.name;
        option.value = item.id;
        cfiSelect.append(option);
      });

      cfiSelect.addEventListener('change', async function (e) {
        const val = e.currentTarget.value;
        OVERLAY_MAP[KEYS.CFI_A].remove();

        const cfi_data = await Utils.fetch({ data: { typeName: TYPENAME[KEYS.CFI_A], CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${val}'')')), 0, meters)` } });
        OVERLAY_MAP[KEYS.CFI_A] = getLayer(cfi_data, KEYS.CFI_A);
        OVERLAY_MAP[KEYS.CFI_A].addTo(map);


        document.querySelector('.about__body').innerHTML = '';

        if (cfi_data.features.length > 0) {
          map.panBy(L.point(cfi_data.features[0].geometry.coordinates));
          showCFI_A(cfi_data);
        }

        //crap code refactor this
        showCFI_B({ feature: cfi_b_data.features.find((x) => x.id === val) });
      });

      cfiSelect.removeAttribute('disabled')
    });

  } catch (e) {
    console.warn('Unable to load province select', e);
  }
}

function showCFR_A(data) {
  const { cfr_name, sub_name, name_en, ...cfr_a } = data.properties;
  const tbody = document.createElement('tbody');
  Utils.omitFromObject(cfr_a, ['_validation_status', 'Remark', 'cfr_image_URL', 'cfr_image', 'total_men', 'total_women', '_id', '_uuid'])
  for (const key in cfr_a) {
    // terrible code

    const tr = document.createElement('tr');

    [TRANSLATE[key] || key, cfr_a[key]].forEach(x => {
      const td = document.createElement('td');
      td.innerText = x;
      tr.append(td);
    })

    tbody.append(tr);
  }
  const table = document.createElement('table');
  table.append(tbody);
  table.style.display = 'block';
  table.style.marginBottom = '5px';

  const header = document.createElement('strong');
  header.innerText = `ឈ្មោះ​សហគមន៍៖ ${cfr_name}`;

  const body = document.querySelector('.about__body');
  body.innerHTML = '';
  body.append(header);
  body.append(table);

  CustomCharts.pieChart();
  CustomCharts.barChart();
}

async function loadCFIMap() {
  [OVERLAY_MAP[KEYS.CFI_B], OVERLAY_MAP[KEYS.CFI_A]] = await Promise.all([
    getGeoJsonLayer(KEYS.CFI_B),
    getGeoJsonLayer(KEYS.CFI_A),
  ]);

  OVERLAY_MAP[KEYS.CFI_B].addTo(map);
  handleBoundaryFilter();
}

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

async function init() {
  if (SERVER === 'cfi') {
    await loadCFIMap();
  } else if (SERVER === 'cfr') {
    await loadCFRMap();
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  init().then(() => {
    document.getElementById('loadingOverlay').classList.remove('is-active');
    document.getElementById('provinceSelect').removeAttribute('disabled');
  });

  if (SERVER === 'cfr') {
    loadProvinceCFR();
  } else {
    loadProvince();
  }

  const modal = document.getElementById('cfiModal');
  document.getElementsByClassName("close")[0].onclick = function () {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});
