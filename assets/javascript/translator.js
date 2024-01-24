class I18n {
  static _defaultLang = 'kh';
  static _langs = ['kh', 'en'];
  static _isReady = false;
  static _translate = {};

  static getLang() {
    const stored = localStorage.getItem('lang');

    if (stored) {
      return stored;
    }

    localStorage.setItem('lang', this._defaultLang);

    return this._defaultLang;
  }

  static async init() {
    this._lang = this.getLang();
    this._translate = await this._fetch(this._lang);
    this._isReady = true;

    this._translateAllHtml();
  }

  static async _fetch(lang) {
    const lng = lang || this._defaultLang;
    const data = await fetch(`/lang/${lng}.json`);
    return data.json();
  }

  static _translateAllHtml() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');

      if (!key) {
        return;
      }

      const text = this.translate(key);

      if (text) {
        element.innerText = text;
        element.setAttribute('innerText', text);
      } else {
        console.error(`Could not find text for attribute ${key}`);
      }
    });
  }

  static translate(key, translateObj) {
    if (typeof key === 'object') {
      const translateKey = key[this._lang];

      if (!translateObj) {
        return translateKey;
      }

      if (translateObj[translateKey]) {
        return translateObj[translateKey];
      }

      const hasKeyLang = this._langs.find((lng) => key[lng] && translateObj[key[lng]]);

      return hasKeyLang && translateObj[key[hasKeyLang]] || key;
      ;
    }

    if (!key || typeof this._translate[key] === 'undefined') {
      return key;
    }

    return this._translate[key];
  }
}
