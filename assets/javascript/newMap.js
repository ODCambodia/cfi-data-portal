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

function getRandom(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min) + min);
}

function showCFI_A(data) {
  const modal = document.getElementById('cfiModal');
  const ul = document.createElement('ul');
  data.features.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.properties.cfi_name;

    btn.addEventListener('click', function () {
      const tbody = document.querySelector('#cfiModal tbody');
      tbody.innerHTML = '';
      for (const key in item.properties) {
        const tr = document.createElement('tr');

        [key, item.properties[key]].forEach(x => {
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
  const header = document.createElement('h3');
  header.innerText = 'CFI Assessment list';
  body.append(header);
  body.append(ul);
}

function showCFI_B(data) {
  const pieData = {
    labels: [
      'Female',
      'Male',
    ],
    datasets: [{
      label: 'Male and females',
      data: [getRandom(), getRandom()],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
      ],
      hoverOffset: 4
    }]
  };

  const { source, sub_name, name, creation_date, registration_date, ...cfi_b } = data.feature.properties;
  const tbody = document.createElement('tbody');
  for (const key in cfi_b) {
    const tr = document.createElement('tr');

    [key, cfi_b[key]].forEach(x => {
      const td = document.createElement('td');
      td.innerText = x;
      tr.append(td);
    })

    tbody.append(tr);
  }
  const table = document.createElement('table');
  table.append(tbody);
  table.style.marginBottom = '20px';

  const header = document.createElement('h3');
  header.innerText = 'CFI NAME: ' + (sub_name || name);

  const body = document.querySelector('.about__body');
  body.append(header);
  body.append(table);

  const pieChart = document.createElement('canvas');
  pieChart.id = 'pieChart';
  pieChart.style.marginBottom = '20px';

  body.append(pieChart);

  new Chart(document.getElementById('pieChart'), { type: 'pie', data: pieData });


  const barChart = document.createElement('canvas');
  barChart.id = 'barChart';

  const barData = {
    labels: ['2020', '2021', '2022', '2023'],
    datasets: [{
      label: 'My First Dataset',
      data: [getRandom(), getRandom(), getRandom(), getRandom()],
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

    showCFI_B(e.layer);
  });
}

async function loadProvince() {
  try {
    const res = await fetch('/api/provinces');
    const data = await res.json();

    const provinceSelect = document.getElementById('provinceSelect');
    // append options to select
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

        console.log(cfi_data);
        // map.setView();
        document.querySelector('.about__body').innerHTML = '';

        if (cfi_data.features.length > 0) {
          showCFI_A(cfi_data);
        }

        console.log(cfi_b_data);
        console.log(val);
        console.log(cfi_b_data.features.find((x) => x.id === val))
        //crap code refactor this
        showCFI_B({ feature: cfi_b_data.features.find((x) => x.id === val) });
      });

      cfiSelect.removeAttribute('disabled')
    });

    provinceSelect.removeAttribute('disabled');
  } catch (e) {
    console.log('Unable to load province select', e);
  }
}

async function loadCFIMap() {
  [OVERLAY_MAP[KEYS.CFI_B], OVERLAY_MAP[KEYS.CFI_A]] = await Promise.all([
    getGeoJsonLayer(KEYS.CFI_B, KEYS.CFI_A),
    getGeoJsonLayer(KEYS.CFI_A),
  ]);

  OVERLAY_MAP[KEYS.CFI_B].addTo(map);
  handleBoundaryFilter();
}

async function loadCFRMap() {
  OVERLAY_MAP[KEYS.CFR_A] = await getGeoJsonLayer(KEYS.CFR_A);
}

function init() {
  if (SERVER === 'cfi') {
    loadCFIMap();
  } else if (SERVER === 'cfr') {
    loadCFRMap();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadProvince();
  init();

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
