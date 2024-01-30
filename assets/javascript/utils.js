const Utils = {
  fetchJson: function (options) {
    return this.fetchGeoJson(options, false);
  },
  fetchGeoJson: async function (options = {}, hasDefault = true) {
    const defaultSetting = hasDefault ? {
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      outputFormat: 'application/json',
      srsname: 'EPSG:4326',
    } : {};

    const defaultParams = Object.assign(defaultSetting, options.data);

    delete options.data;
    const baseUrl = options.baseUrl || GEOSERVER;

    const res = await fetch(baseUrl + '?' + new URLSearchParams(defaultParams), options);
    if (res && (res.status === 200 || res.status === 201)) {
      return res.json();
    }

    return res.text();
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
      });
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
    if (typeof dateStr !== 'string' || !dateStr.trim() || this.isEmptyString(dateStr)) {
      return I18n.translate('no_data');
    }

    const isYearOnly = /^\d{4}$/.test(dateStr);
    const isYearMonth = /^((0?[1-9])|(1[0-2]))(\/|-| )(\d{4})$/.test(dateStr);

    if (isYearMonth || isYearOnly) {
      return dateStr;
    }

    let dateObj = dayjs(dateStr);
    let formattedDate = dateObj.format('DD MMM YYYY');

    if (I18n.getLang() === 'kh') {
      try {
        const dates = formattedDate.split(' ');

        //month
        dates[1] = I18n.translate(dates[1]);

        return dates.join(separator || ' ');
      } catch (e) {
        return dateStr;
      }
    }

    if (formattedDate && separator !== ' ') {
      formattedDate = formattedDate.replace(' ', separator);
    }

    return typeof formattedDate === 'string' ? formattedDate : dateStr;
  },
  isNumeric: function (str) {
    // number with 0 infront and is not float is not numeric
    // EX: 0234234 (not numeric), 0.2 (numeric)
    if (typeof str === 'string' && str[0] === '0' && !(str[1] === '.' || str[1] === ',')) {
      return false;
    }

    return /^-?[0-9][0-9,\.]+$/.test(str);
  },
  isEmptyString: function (str) {
    return !str || (typeof str === 'string' && !str.trim());
  },
  formatNum: function (num, separator = ',', fraction = '.') {
    const n = this.toFixed(num);
    const fmtNum = Number(n).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
    const res = fmtNum.split('.');

    if (res.length === 1 || res[1].length <= 1) {
      return num;
    }

    return fmtNum.replace(/\./, fraction).replace(/,/g, separator);
  },
  toFixed: function (num, fixed = 2) {
    const regex = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    if (typeof num === 'string' && num.indexOf(',') !== -1) {
      return num.replace(/,/g, '').match(regex)[0];
    }

    if (typeof num === 'number') {
      return num.toString().match(regex)[0];
    }

    return num;
  },
  isCoordinate: function (key) {
    const hashs = {
      'x_coord': 1,
      'y_coord': 1,
      'lat': 1,
      'long': 1,
      'latitude': 1,
      'longtitude': 1,
      '_cfr_geopoint_latitude': 1,
      '_cfr_geopoint_longitude': 1,
      '_cfr_geopoint_altitude': 1,
      '_cfr_geopoint_precision': 1,
    };
    return hashs[key] !== undefined;
  }
};

const CustomCharts = {
  pieChart: function (selectorId, title, labels, data) {
    const translatedLabels = labels.map((item) => I18n.translate(item));
    const pieData = {
      labels: translatedLabels,
      datasets: [{
        data,
        label: title,
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
        ],
        hoverOffset: 4,
        borderWidth: 0,
      }],
    };
    const options = {
      legend: { reverse: true },
      plugins: {
        datalabels: {
          formatter: (value, ctx) => {
            const dataArr = ctx.chart.data.datasets[0].data;
            const sum = dataArr.reduce((total, item) => total + item, 0);
            const percentage = (value * 100 / sum);
            if (percentage === 0) {
              return '';
            }

            return `${percentage.toFixed(2)}%`;
          },
          color: '#fff',
          font: { size: 12 },

        }
      }
    };

    const pieHeader = document.createElement('p');
    pieHeader.innerText = I18n.translate(title);
    pieHeader.style.textAlign = 'center';
    pieHeader.style.color = '#2f4f4f';
    pieHeader.style.paddingTop = '5px';

    const canvas = document.getElementById(selectorId);
    canvas.parentNode.insertBefore(pieHeader, canvas);
    canvas.style.paddingBottom = '10px';
    canvas.style.borderBottom = '1px dashed #000';

    return new Chart(canvas, { type: 'pie', data: pieData, options });
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
