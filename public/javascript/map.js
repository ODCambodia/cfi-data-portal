function getQueryParam(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

let map = L.map('map', {
  center: [12.5657, 104.991],
  zoom: 7
});

let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const BASE_MAP = { "Open Street Map": osm }
const OVERLAY_MAP = {}

const server = getQueryParam('map') || 'cfi';
const geoServer = `https://staging.fia.db.opendevcam.net/geoserver/${server}/wms`;

function handleJson(data, key) {
  console.log(CONFIGS.styles(key));
  OVERLAY_MAP[key] = L.geoJson(data, {
    style: CONFIGS.styles(key),
    onEachFeature: CONFIGS.eachFeatureHandler[key],
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, CONFIGS.styles(key)),
  });

  console.log(OVERLAY_MAP[key])

  map.flyToBounds(OVERLAY_MAP[key].getBounds());

  // IMPORTANT MAKE THIS DYNAMIC
  const len = Object.keys(OVERLAY_MAP).length;
  const shouldAddLayer = (server === 'cfi' && len === 2) || (server === 'cfr' && len === 1);

  if (shouldAddLayer) {
    OVERLAY_MAP[key].addTo(map);
    L.control.layers(BASE_MAP, OVERLAY_MAP).addTo(map);
  }
}

L.control.scale().addTo(map);

function handleJsonCFI_B(data) {
  handleJson(data, KEYS.CFI_B)
}

function handleJsonCFI_A(data) {
  handleJson(data, KEYS.CFI_A)
}

function handleJsonCFR_A(data) {
  handleJson(data, KEYS.CFR_A)
}

function getAjax(key,) {
  const PARAM = {
    CFI_A: {
      typename: 'cfi:Effectiveness_Assessment_2022',
      callback: 'callback:handleJsonCFI_A'
    },
    CFI_B: {
      typename: 'cfi:cfi',
      callback: 'callback:handleJsonCFI_B'
    },
    CFR_A: {
      typename: 'cfr:cfr_wf_assessment_2022',
      callback: 'callback:handleJsonCFR_A'
    }
  };

  const CQL = getQueryParam('province') ? `province = '${getQueryParam('province')}'` : '';

  $.ajax(geoServer, {
    type: 'GET',
    async: false,
    data: {
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typename: PARAM[key].typename,
      CQL_FILTER: CQL,
      srsname: 'EPSG:4326',
      outputFormat: 'text/javascript',
    },
    dataType: 'jsonp',
    jsonpCallback: PARAM[key].callback,
    jsonp: 'format_options'
  });
}

// MAIN 
$(document).ready(function () {
  if (server === 'cfi') {
    // CFI assessment
    getAjax('CFI_A');

    // CFI Boundary
    getAjax('CFI_B');

  } else if (server === 'cfr') {
    //CFR Assessment
    getAjax('CFR_A');
  }

  document.getElementById('provinceSelect').addEventListener('change', function (e) {
    const val = e.currentTarget.value;

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("province", e.currentTarget.value);

    window.location.href = 'index.html?' + searchParams.toString();
  });

  if (getQueryParam('province')) {
    $('#provinceSelect').val(getQueryParam('province'))
  }
})