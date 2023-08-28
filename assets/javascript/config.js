// CONFIG OVERLAY NAME/KEY
// NOTE:: should ONLY need to change key here so everything is consistent 
// should translate here
const KEYS = {
  CFR_A: 'CFR Status Assessment 2022-2023',
  CFI_A: 'CFi Effectiveness Assessment 2022',
  CFI_B: 'CFi Boundary',
};

const TYPENAME = {
  [KEYS.CFR_A]: 'cfr:cfr_wf_assessment_2022',
  [KEYS.CFI_A]: 'cfi:Effectiveness_Assessment_2022',
  [KEYS.CFI_B]: 'cfi:cfi',
}

// CONFIG OVERLAY STYLES
const STYLES = {
  [KEYS.CFI_A]: (feature) => {
    switch (feature.properties.fiac_score) {
      case 'Strong': return {
        color: "green",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      };
      case 'Average': return {
        color: "orange",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      };
      case 'Weak': return {
        color: "red",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      };
      default: return {
        color: "blue",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }
    }
  },
  [KEYS.CFI_B]: (feature) => {
    switch (feature.properties.registration_date) {
      case null: return {
        color: "black",
        fillColor: "yellow",
        weight: 1,
        fillOpacity: 0.5,
        opacity: 0.5,
      };
      default: return {
        color: "black",
        fillColor: "purple",
        weight: 1,
        fillOpacity: 0.5,
        opacity: 0.5,
      }
    }
  },
  [KEYS.CFR_A]: (feature) => {
    switch (feature.properties.is_qualified_cfr) {
      case 'បាទ/ចាស៎': return {
        color: "green",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      };
      case 'ទេ': return {
        color: "red",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      };
      default: return {
        color: "blue",
        radius: 4,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }
    }
  }
}

// OVERLAY FEATURE HANDLER
const EACH_FEATURES_HANDLER = {
  [KEYS.CFI_A]: function (feature, layer) {
    layer.bindPopup(
      '<li>' + `Community: ${feature.properties.cfi_name}` + '</li>' +
      '<li>' + `FiAC Score: ${feature.properties.fiac_score}` + '</li>' +
      '<li>' + `Province: ${feature.properties.province}` + '</li>'
    )
  },
  [KEYS.CFI_B]: function (feature, layer) {
    layer.bindPopup(
      '<li>' + `CFI Name (EN): ${feature.properties.name_en}` + '</li>' +
      '<li>' + `CFI Name (KM): ${feature.properties.name}` + '</li>' +
      '<li>' + `Area (Ha): ${feature.properties.area_ha}` + '</li>' +
      '<li>' + `Province: ${feature.properties.province}` + '</li>' +
      '<li>' + `Type: ${feature.properties.type}` + '</li>' +
      '<li>' + `Created on: ${feature.properties.creation_date}` + '</li>' +
      '<li>' + `Registered on: ${feature.properties.registration_date}` + '</li>'
    )
  },
  [KEYS.CFR_A]: function (feature, layer) {
    layer.bindPopup(
      '<li>' + `Community: ${feature.properties.cfr_name}` + '</li>' +
      '<li>' + `Province: ${feature.properties.province}` + '</li>' +
      '<li>' + `Type: ${feature.properties.cfr_type}` + '</li>' +
      '<li>' + `Qualified?: ${feature.properties.is_qualified_cfr}` + '</li>'
    )
  }
}

// MAIN CONFIG
const CONFIGS = {
  keys: KEYS,
  styles: STYLES,
  eachFeatureHandler: EACH_FEATURES_HANDLER
}

// remove this later and use translation.js
const TRANSLATE = {
  'area_ha': 'ក្រឡា​ផ្ទៃ(ហិកតា)',
  'cfi_code': 'លេខកូដសម្គាល់​សហគមន៍',
  'type': 'ប្រភេទតំបន់',
  'province': 'ខេត្ត',
  'registration_date': 'កាលបរិច្ឆេទ​ចុះបញ្ជី',
  'creation_date': 'កាលបរិច្ឆេទ​បង្កើត'
}