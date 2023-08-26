class Translator {
  constructor(options = {}) {
    this._config = Object.assign({}, this.defaultConfig, options);
    this._elements = document.querySelectorAll("[data-i18n]");
    this._cache = new Map();
    this._config.defaultLang = this.__getLang();

    this.load(this._config.defaultLang);
  }

  __getLang() {
    const stored = localStorage.getItem("language");

    if (stored) {
      return stored;
    }

    return this.defaultConfig.defaultLang;
  }

  _fetch(path) {
    return fetch(path)
      .then(response => response.json())
      .catch(() => {
        console.error(
          `Could not load ${path}. Please make sure that the file exists.`
        );
      });
  }

  async _getResource(lang) {
    if (this._cache.has(lang)) {
      return JSON.parse(this._cache.get(lang));
    }

    const translation = await this._fetch(
      `${this._config.filesLocation}/${lang}.json`
    );

    if (!this._cache.has(lang)) {
      this._cache.set(lang, JSON.stringify(translation));
    }

    return translation;
  }

  async load(lang) {
    if (!this._config.languages.includes(lang)) {
      return;
    }

    this._translate(await this._getResource(lang));

    document.documentElement.lang = lang;

    if (this._config.persist) {
      localStorage.setItem("language", lang);
    }
  }

  async getTranslationByKey(lang, key) {
    if (!key || typeof key !== "string") {
      throw new Error(
        `Expected a non-empty string for the key parameter`
      );
    }

    const translation = await this._getResource(lang);

    return this._getValueFromJSON(key, translation, true);
  }

  _getValueFromJSON(key, json, fallback) {
    const text = key.split(".").reduce((obj, i) => obj[i], json);

    if (!text && this._config.defaultLang && fallback) {
      const fallbackTranslation = JSON.parse(
        this._cache.get(this._config.defaultLang)
      );

      text = this._getValueFromJSON(key, fallbackTranslation, false);
    } else if (!text) {
      text = key;
      console.warn(`Could not find text for attribute "${key}".`);
    }

    return text;
  }

  _translate(translation) {
    this._elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");

      if (!key) {
        return;
      }

      const text = this._getValueFromJSON(key, translation, true);

      if (text) {
        element.innerText = text;
        element.setAttribute('innerText', text);
      } else {
        console.error(`Could not find text for attribute ${key}`);
      }
    });
  }

  get defaultConfig() {
    return {
      persist: false,
      languages: ["en", "kh"],
      defaultLang: "en",
      filesLocation: "/lang"
    };
  }
}
