class I18n {
  static _defaultLang = 'en';
  static _isReady = false;
  static _translate = {};

  static _getLang() {
    const stored = localStorage.getItem('language');

    if (stored) {
      return stored;
    }

    localStorage.setItem('langauge', this._defaultLang);

    return this._defaultLang;
  }

  static async init() {
    this._lang = this._getLang();
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
      const key = element.getAttribute("data-i18n");

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

  static translate(key) {
    if (typeof key === 'object') {
      return key[this._lang];
    }

    if (!key || typeof this._translate[key] === 'undefined') {
      console.log(this._translate);
      return key;
    }

    return this._translate[key];
  }
}
