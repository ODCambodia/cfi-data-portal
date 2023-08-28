const Utils = {
  fetch: async function (options = {}) {
    const defaultParams = Object.assign({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      outputFormat: 'application/json',
      srsname: 'EPSG:4326',
    }, options.data);

    delete options.data;

    const res = await fetch(GEOSERVER + '?' + new URLSearchParams(defaultParams), options);
    return res.json();
  },
  getQueryParam: function (key, isDisabled) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  },
  getRandom: function (min = 1, max = 100) {
    return Math.floor(Math.random() * (max - min) + min);
  },
  defaultOptionDOM: function (text = '', isDisabled) {
    const option = document.createElement('option');
    option.text = text;
    option.value = '';
    option.disabled = !!isDisabled;
    return option;
  }
};
