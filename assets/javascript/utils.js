const Utils = {
  fetchJson: function (options) {
    return this.fetchGeoJson(options, false);
  },
  fetchGeoJson: async function (options = {}, hasDefault = true) {
    const defaultSetting = hasDefault ? {
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      outputFormat: 'application/json',
      srsname: 'EPSG:4326',
    } : {};

    const defaultParams = Object.assign(defaultSetting, options.data);

    delete options.data;
    const baseUrl = options.baseUrl || GEOSERVER;

    const res = await fetch(baseUrl + '?' + new URLSearchParams(defaultParams), options);
    return res.json();
  },
  fetchXml: async function (options = {}) {
    const defaultParams = Object.assign({
      service: 'WFS',
    }, options.data);

    delete options.data;
    const baseUrl = options.baseUrl || GEOSERVER;

    const res = await fetch(baseUrl + '?' + new URLSearchParams(defaultParams), options);
    const txt = await res.text();
    let xmlDoc;

    if (window.DOMParser) {
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(txt, "text/xml");
    }
    else // Internet Explorer
    {
      xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = false;
      xmlDoc.loadXML(txt);
    }

    return xmlDoc;
  },
  handleFetchPromise: function (promise, callback) {
    return promise
      .then(response => response.text())
      .then(text => {
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(text);
        }
        console.log(data);
        if (data.error) {
          throw new Error(data.error);
        }

        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch((err) => {
        console.log(err);
        setTimeout(() => { alert(err.message); })
      })
  },
  getQueryParam: function (key, isDisabled) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  },
  getServer: function () {
    const server = window.location.href.split('/').slice(-1)[0];

    if (server === 'cfi' || server === 'cfr') {
      return server;
    }

    return 'cfi';
  },
  getRandom: function (min = 1, max = 100) {
    return Math.floor(Math.random() * (max - min) + min);
  },
  defaultOptionDOM: function (text = '', attr = {}) {
    const option = document.createElement('option');
    option.text = text;
    option.value = '';
    Object.assign(option, attr);
    return option;
  },
  pickFromObject: function (obj, keyArr) {
    const temp = {}
    keyArr.forEach((key) => {
      if (key in obj) {
        temp[key] = obj;
      }
    })

    return temp;
  },
  omitFromObject: function (obj, keyArr) {
    keyArr.forEach((key) => {
      if (key in obj) {
        delete obj[key];
      }
    })

    return obj;
  },
  getLayer: function (data, key) {
    return L.geoJson(data, {
      style: CONFIGS.styles[key],
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, CONFIGS.styles[key](feature)),
    });
  },
  getGeoJsonLayer: async function (key, options = {}) {
    const data = await this.fetchGeoJson({
      ...options,
      data: { typeName: TYPENAME[key], ...(options.data ? options.data : {}) },
    })

    return this.getLayer(data, key);
  },
  formatDate: function (dateStr, separator = ' ') {
    if (!dateStr) {
      return 'មិនមានព័ត៌មាន';
    }
    const d = new Date(dateStr);
    const day = ("0" + d.getDate()).slice(-2);;
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();

    return day + separator + (TRANSLATE[month] || month) + separator + year;
  }
};

const CustomCharts = {
  pieChart: function (selectorId, title, labels, data) {
    const pieData = {
      labels,
      datasets: [{
        data,
        label: title,
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
        ],
        hoverOffset: 4,
        borderWidth: 0,
      }]
    };

    const pieHeader = document.createElement('p');
    pieHeader.innerText = title;
    pieHeader.style.textAlign = 'center';
    pieHeader.style.color = '#2f4f4f';

    const canvas = document.getElementById(selectorId);
    canvas.parentNode.insertBefore(pieHeader, canvas);

    return new Chart(canvas, { type: 'pie', data: pieData });
  },
  barChart: function (selectorId) {
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

    return new Chart(document.getElementById(selectorId), {
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
