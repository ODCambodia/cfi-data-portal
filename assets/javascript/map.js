const map = L.map('map', {
  center: [12.5657, 104.991],
  zoom: 7
});

L.control.scale().addTo(map);

const BASE_MAP = {
  "Open Street Map": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)
}
const OVERLAY_MAP = {}
const SERVER = Utils.getQueryParam('map') || 'cfi';
const geoServer = `http://localhost:3000/geoserver/${SERVER}/ows`;

function handleJson(data, key) {
  OVERLAY_MAP[key] = L.geoJson(data, {
    style: CONFIGS.styles[key],
    onEachFeature: CONFIGS.eachFeatureHandler[key],
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, CONFIGS.styles[key](feature)),
  });
}

function handleBoundaryFilter(val) {
  OVERLAY_MAP[KEYS.CFI_B].off('popupopen');

  OVERLAY_MAP[KEYS.CFI_B].on('popupopen', function (e) {
    OVERLAY_MAP[KEYS.CFI_A].remove();
    map.setView(e.popup._latlng);

    Utils.fetch(KEYS.CFI_A, function (data) {
      handleJson(data, KEYS.CFI_A);
      OVERLAY_MAP[KEYS.CFI_A].addTo(map);

      const body = document.querySelector('.about__body');
      body.innerHTML = '';

      const ul = document.createElement('ul');
      data.features.forEach((item) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = item.properties.cfi_name;

        btn.addEventListener('click', function () {
          const body = document.querySelector('.about__body');
          body.innerHTML = '';

          const ul = document.createElement('ul');
          for (const key in item.properties) {
            const li = document.createElement('li');
            li.innerText = key + ': ' + item.properties[key];
            ul.append(li);
          }

          body.append(ul);
        })
        const li = document.createElement('li');
        li.append(btn);
        ul.append(li);
      })
      ul.style.paddingLeft = '20px';
      body.append(ul);
    }, { CQL_FILTER: `DWITHIN(geom, collectGeometries(queryCollection('cfi:cfi','geom','IN(''${e.layer.feature.id}'')')), 0, meters)` });
  });
}

// MAIN 
$(document).ready(function () {
  if (SERVER !== 'cfi' && SERVER !== 'cfr') {
    alert('Wrong Server Params');
    return;
  }

  if (SERVER === 'cfi') {
    Utils.fetch(KEYS.CFI_A, function (data) {
      handleJson(data, [KEYS.CFI_A]);
    });

    Utils.fetch(KEYS.CFI_B, function (data) {
      handleJson(data, KEYS.CFI_B);
      OVERLAY_MAP[KEYS.CFI_B].addTo(map);

    });

  } else if (SERVER === 'cfr') {
    Utils.fetch(KEYS.CFR_A, handleJson)
  }

  $.ajax('/api/provinces  ', {
    type: 'GET',
    async: true,
    dataType: 'json',
    success: function (data) {
      console.log(data);
      data.features.forEach(function (item) {
        $('#provinceSelect').append($('<option>', {
          value: item.properties.pro_code,
          text: item.properties.pro_name_k
        }))
      })
    }
  });


  $('#provinceSelect').on('change', function (e) {
    const val = e.currentTarget.value;
    OVERLAY_MAP[KEYS.CFI_B].remove();

    Utils.fetch(KEYS.CFI_B, function (data) {
      handleJson(data, [KEYS.CFI_B]);
      handleBoundaryFilter(val);
      OVERLAY_MAP[KEYS.CFI_B].addTo(map);
      map.flyToBounds(OVERLAY_MAP[KEYS.CFI_B].getBounds());

    }, { CQL_FILTER: `INTERSECTS(geom, collectGeometries(queryCollection('cfi:cambodian_provincial','geom','pro_code = ${val}')))` });
  });
})