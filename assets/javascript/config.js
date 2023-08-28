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
  'creation_date': 'កាលបរិច្ឆេទ​បង្កើត',
  'facilitator_1': 'អ្នកសម្របសម្រួល ១',
  'facilitator_2': 'អ្នកសម្របសម្រួល ២',
  'facilitator_3': 'អ្នកសម្របសម្រួល ៣',
  'cfi_name': 'ឈ្មោះសហគមន៍នេសាទ',
  'fiac_score': 'ពិន្ទុ fiac',
  'id_survey_2018': 'id ការស្ទង់មតិ 2018',
  'id_grand_150_cfi': 'លេខសម្គាល់Grand150សហគមន៍នេសាទ',
  'province': 'ខេត្ត',
  'has_conserve_area': 'មានតំបន់អភិរក្ស',
  'has_useful_conserve_area': 'មានតំបន់អភិរក្សមានប្រយោជន៍',
  'resolve_cfi_conflict': 'ដោះស្រាយជម្លោះសហគមន៍នេសាទ',
  'cmt_reduce_illegal_act': 'cmt កាត់បន្ថយអំពើខុសច្បាប់',
  'patrol_regularly': 'ល្បាតជាប្រចាំ',
  'lvl_law_enforce': 'ការអនុវត្តច្បាប់ lvl',
  'promote_law_to_member': 'ផ្សព្វផ្សាយច្បាប់ដល់សមាជិក',
  'cmt_meet_member': 'cmt ជួបសមាជិក',
  'cmt_impl_dev_plan': 'cmt impl ផែនការអភិវឌ្ឍន៍',
  'cmt_reelect_full_participate': 'cmt ជ្រើសរើសអ្នកចូលរួមពេញលេញឡើងវិញ',
  'cmt_reelect_open': 'cmt បើកឡើងវិញ',
  'cmt_decision_open': 'cmt ការសម្រេចចិត្តបើក',
  'cmt_decision_represent': 'cmt តំណាងឱ្យការសម្រេចចិត្ត',
  'cmt_equal_right': 'cmt ស្មើគ្នា',
  'increase_fish_resource': 'បង្កើនធនធានត្រី',
  'fish_resource_vs_non_member': 'ធនធានត្រីធៀបនឹងសមាជិកមិន',
  'member_equal_benefit': 'សមាជិកទទួលបានអត្ថប្រយោជន៍ស្មើគ្នា',
  'involve_female_decision': 'ពាក់ព័ន្ធនឹងការសម្រេចចិត្តរបស់ស្ត្រី',
  'lvl_member_pride': 'មោទនភាពសមាជិក lvl',
  'has_other_socio_benefit': 'មានអត្ថប្រយោជន៍សង្គមផ្សេងទៀត។',
  'other_socio_benefit': 'ផលប្រយោជន៍សង្គមផ្សេងទៀត។',
  'lvl_se_benefit': 'lvl ទទួលបានអត្ថប្រយោជន៍',
  'se_benefit_vs_non_member': 'se អត្ថប្រយោជន៍ធៀបនឹងសមាជិកមិន',
  'increase_fish_catch': 'បង្កើនការចាប់ត្រី',
  'increase_income': 'បង្កើនប្រាក់ចំណូល',
  'increase_fish_market': 'បង្កើនទីផ្សារត្រី',
  'more_alt_livelihood_source': 'ប្រភពចិញ្ចឹមជីវិតបន្ថែម',
  'fish_ground_for_income': 'ដីត្រីសម្រាប់ប្រាក់ចំណូល',
  'fish_ground_for_food_sec': 'ដីត្រីសម្រាប់អាហារ sec',
  'fish_stock_stat': 'ស្ថានភាពស្តុកត្រី',
  'fish_brood_stock_stat': 'ស្ថានភាពស្តុកកូនត្រី',
  'restore_flood_forest': 'ស្តារព្រៃលិចទឹក។',
  'restore_coral_ref': 'ស្តារថ្មប៉ប្រះទឹកផ្កាថ្ម',
  'restore_mangrove': 'ស្តារព្រៃកោងកាង',
  'restore_seagrass': 'ស្តារស្មៅសមុទ្រ',
  'lvl_awareness_member': 'សមាជិកនៃការយល់ដឹងរបស់ lvl',
  'future_number_fisher': 'អ្នកនេសាទលេខនាពេលអនាគត',
  'future_lvl_paticipate': 'lvl នាពេលអនាគតចូលរួម',
  'future_bylaw_knowledge': 'ចំណេះដឹងច្បាប់នាពេលអនាគត',
  'future_cmt_capacity': 'សមត្ថភាព cmt នាពេលអនាគត',
  'future_income': 'ប្រាក់ចំណូលនាពេលអនាគត',
  'has_cmty_budget': 'មានថវិកា cmty',
  'future_cmty_budget': 'ថវិកា cmty នាពេលអនាគត',
  'fund_source': 'ប្រភពមូលនិធិ',
  'fund_source_a': 'ប្រភពមូលនិធិ ក',
  'fund_source_b': 'ប្រភពមូលនិធិ ខ',
  'fund_source_a_1': 'ប្រភពមូលនិធិ ក ១',
  'fund_source_b_1': 'ប្រភពមូលនិធិ ខ ១',
  'fund_source_a_2': 'ប្រភព​មូលនិធិ ក ២',
  'fund_source_b_2': 'ប្រភពមូលនិធិ ខ ២',
  'fund_source_a_3': 'ប្រភព​មូលនិធិ ក ៣',
  'fund_source_b_3': 'ប្រភពមូលនិធិ ខ ៣',
  'fund_source_a_4': 'ប្រភព​មូលនិធិ ក ៤',
  'fund_source_b_4': 'ប្រភពមូលនិធិ ខ ៤',
  'fund_source_a_5': 'ប្រភព​មូលនិធិ ក ៥',
  'fund_source_b_5': 'ប្រភពមូលនិធិ ខ ៥',
  'other_fund_source': 'ប្រភពមូលនិធិផ្សេងទៀត។',
  'future_fisheries_mgmt': 'ជលផលនាពេលអនាគត mgmt',
  'future_fisheries_control': 'ការគ្រប់គ្រងជលផលនាពេលអនាគត',
  'future_rule_compliance': 'ការអនុលោមតាមច្បាប់នាពេលអនាគត',
  'future_patrol': 'ការល្បាតនាពេលអនាគត',
  'q5_3_e': 'q5 3 និង',
  'future_fish_resource': 'ធនធានត្រីនាពេលអនាគត',
  'future_fish_habitat': 'ជម្រកត្រីនាពេលអនាគត',
  'strong_cmty_criteria': 'លក្ខណៈវិនិច្ឆ័យ cmty ខ្លាំង',
  '_submission_time': ' ពេលវេលានៃការដាក់ស្នើ',
  're_Management': 'ការគ្រប់គ្រងឡើងវិញ',
  're_Committee': 'គណៈកម្មាធិការឡើងវិញ',
  're_Impacts': 'ផលប៉ះពាល់ឡើងវិញ',
  're_Sustainability': 'និរន្តរភាពឡើងវិញ',
  're_TotalScore': 'ពិន្ទុសរុបឡើងវិញ',
  're_Types': 'ប្រភេទឡើងវិញ',
  'Management2018': 'ការគ្រប់គ្រងឆ្នាំ 2018',
  'Committee2018': 'គណៈកម្មាធិការឆ្នាំ ២០១៨',
  'Impacts2018': 'ផលប៉ះពាល់ឆ្នាំ 2018',
  'Sustainability2018': 'និរន្តរភាពឆ្នាំ 2018',
  'TotalScore2018': 'ពិន្ទុសរុបឆ្នាំ 2018',
  'CFi_Type2018': 'ប្រភេទសហគមន៍នេសាទឆ្នាំ 2018',
  'Score_FiAC': 'ពិន្ទុ FiAC',
  'Score_Assessment': 'ការវាយតម្លៃពិន្ទុ',
  'today': 'ថ្ងៃនេះ',
  'username': 'ឈ្មោះ​អ្នកប្រើប្រាស់',
  'deviceid': 'ឧបករណ៍',
  'phonenumber': 'លេខទូរសព្ទ',
  'simserial': 'ស៊ីមសៀរៀល',
  'objectives': 'គោលបំណង',
  'cfr_geopoint': 'cfr ទីតាំងភូមិសាស្ត្រ',
  '_cfr_geopoint_latitude': 'cfr រយៈទទឹងទីតាំងភូមិសាស្ត្រ',
  '_cfr_geopoint_longitude': 'cfr រយៈបណ្តោយទីតាំងភូមិសាស្ត្រ',
  '_cfr_geopoint_altitude': 'cfr រយៈកម្ពស់ភូមិសាស្ត្រ',
  '_cfr_geopoint_precision': 'ភាពជាក់លាក់នៃទីតាំងភូមិសាស្ត្រ cfr',
  'cfr_image': 'រូបភាព cfr',
  'cfr_image_URL': 'cfr រូបភាព URL',
  'faci_name': 'អ្នកបង្កើតឈ្មោះ',
  'faci_phone': 'អ្នកនៅលើទូរស័ព្ទ',
  'note_name': 'ឈ្មោះចំណាំ',
  'note_phone': 'ចំណាំទូរស័ព្ទ',
  'total_participants': 'អ្នកចូលរួមសរុប',
  'total_men': 'បុរសសរុប',
  'total_women': 'ស្ត្រីសរុប',
  'cfr_rep_name': 'ឈ្មោះតំណាង cfr',
  'cfr_rep_phone': 'cfr ទូរស័ព្ទតំណាង',
  'participant_roles': 'តួនាទីរបស់អ្នកចូលរួម',
  'o_participant_roles': 'o តួនាទីរបស់អ្នកចូលរួម',
  'cfr_id': 'លេខសម្គាល់ cfr',
  'village': 'ភូមិ',
  'commune': 'ឃុំ',
  'district': 'ស្រុក',
  'ខេត្ត': 'ខេត្ត',
  'num_benefit_villages': 'ចំនួនភូមិដែលមានប្រយោជន៍',
  'distance_nearest_village': 'ចម្ងាយភូមិដែលនៅជិតបំផុត។',
  'num_village_ppl': 'ភូមិលេខ ppl',
  'num_village_women': 'ស្ត្រីភូមិ',
  'num_village_family': 'គ្រួសារ ភូមិ',
  'percentage_fishermen': 'ភាគរយអ្នកនេសាទ',
  'num_commune_ppl': 'ចំនួនឃុំ ppl',
  'num_commune_women': 'ស្ត្រីឃុំ',
  'num_commune_young': 'ឃុំ ក្មេង',
  'is_official_cfr': 'គឺជា cfr ផ្លូវការ',
  'recognized_year': 'ឆ្នាំទទួលស្គាល់',
  'recognized_by': 'ទទួលស្គាល់ដោយ',
  'recognized_by_COM_ADMIN': 'ទទួលស្គាល់ដោយ COM ADMIN',
  'recognized_by_DIS_ADMIN': 'ទទួលស្គាល់ដោយ DIS ADMIN',
  'recognized_by_FIAC': 'ទទួលស្គាល់ដោយ FIAC',
  'recognized_by_FIA': 'ទទួលស្គាល់ដោយ FIA',
  'recognized_by_PDAFF': 'ទទួលស្គាល់ដោយ PDAFF',
  'recognized_by_PRO_ADMIN': 'ទទួលស្គាល់ដោយ PRO ADMIN',
  'recognized_by_OTHER': 'ទទួលស្គាល់ដោយ OTHER',
  'o_recognized_by': 'o ទទួលស្គាល់ដោយ',
  'has_cfr_cmte': 'មាន cfr cmte',
  'year_establish_cfr_cmte': 'ឆ្នាំបង្កើត cfr cmte',
  'num_cmte_mem': 'ថា​តើ​បាន​ឬ​មិន​បាន',
  'num_cmte_female': 'លេខ cmte ស្រី',
  'cfr_is_active': 'cfr សកម្ម',
  'inactive_date': 'កាលបរិច្ឆេទអសកម្ម',
  'want_reactivate': 'ចង់ដំណើរការឡើងវិញ',
  'has_cmte_election': 'មានការបោះឆ្នោត cmte',
  'year_cmte_election': 'ការបោះឆ្នោត cmte ឆ្នាំ',
  'has_fund_sources': 'មានប្រភពមូលនិធិ',
  'external_fund': 'មូលនិធិខាងក្រៅ',
  'external_fund_DONER': 'មូលនិធិខាងក្រៅ DONER',
  'external_fund_PRIVATE': 'មូលនិធិខាងក្រៅឯកជន',
  'external_fund_NGO': 'មូលនិធិខាងក្រៅរបស់អង្គការក្រៅរដ្ឋាភិបាល',
  'external_fund_RELIGION': 'មូលនិធិខាងក្រៅ RELIGION',
  'external_fund_GOV': 'មូលនិធិខាងក្រៅ GOV',
  'external_fund_OTHER': 'មូលនិធិខាងក្រៅ OTHER',
  'external_fund_COMMUNE': 'មូលនិធិខាងក្រៅ COMMUNE',
  'o_external_fund': 'o មូលនិធិខាងក្រៅ',
  'internal_fund': 'មូលនិធិផ្ទៃក្នុង',
  'internal_fund_FISHERMAN': 'មូលនិធិផ្ទៃក្នុង FISHERMAN',
  'internal_fund_FISHING': 'មូលនិធិផ្ទៃក្នុង FISHING',
  'internal_fund_INTERNAL_MICRO': 'មូលនិធិផ្ទៃក្នុង INTERNAL MICRO',
  'internal_fund_RELIGION': 'មូលនិធិផ្ទៃក្នុង RELIGION',
  'internal_fund_NON_FISHERMAN': 'មូលនិធិផ្ទៃក្នុង NON FISHERMAN',
  'internal_fund_TOURISM': 'មូលនិធិផ្ទៃក្នុងទេសចរណ៍',
  'internal_fund_OTHER': 'មូលនិធិផ្ទៃក្នុង ផ្សេងទៀត។',
  'o_internal_fund': 'o មូលនិធិផ្ទៃក្នុង',
  'cfr_type': 'ប្រភេទ cfr',
  'is_new_cfr': 'គឺជា cfr ថ្មី។',
  'dry_season_area_ha': 'តំបន់​រដូវប្រាំង ហ',
  'dry_season_length_m': 'ប្រវែង​រដូវប្រាំង m',
  'dry_season_width_m': 'ទទឹង​រដូវ​ប្រាំង m',
  'dry_season_depth_m': 'ជម្រៅរដូវប្រាំង ម',
  'rainy_season_area_ha': 'តំបន់រដូវវស្សា ហ',
  'rainy_season_length_m': 'ប្រវែង​រដូវវស្សា ម',
  'rainy_season_width_m': 'ទទឹង​រដូវ​វស្សា m',
  'rainy_season_depth_m': 'ជម្រៅ​រដូវវស្សា m',
  'conservation_area_ha': 'តំបន់​អភិរក្ស',
  'paddy_field_area_ha': 'ផ្ទៃដីវាលស្រែ ហិកតា',
  'related_paddy_field_area_ha': 'ផ្ទៃដី​ស្រែ​ដែល​ទាក់ទង​នឹង​ហិកតា',
  'is_cfr_in_cfi': 'គឺ cfr ក្នុងសហគមន៍នេសាទ',
  'part5_description': 'ផ្នែកទី 5 ការពិពណ៌នា',
  'has_official_doc': 'មានឯកសារផ្លូវការ',
  'implement_plan': 'អនុវត្តផែនការ',
  'know_plan_purposes': 'ដឹងពីគោលបំណងនៃផែនការ',
  'purpose_1': 'គោលបំណង ១',
  'purpose_2': 'គោលបំណង ២',
  'purpose_3': 'គោលបំណង ៣',
  'know_plan_activities': 'ដឹងពីសកម្មភាពផែនការ',
  'activity_1': 'សកម្មភាព 1',
  'activity_2': 'សកម្មភាព ២',
  'activity_3': 'សកម្មភាព ៣',
  'released_spawning_fish': 'បានដោះលែងត្រីពង',
  'amount_spawning_fish': 'ចំនួនត្រីពង',
  'released_fish_species': 'ប្រភេទត្រីដែលបានចេញផ្សាយ',
  'amount_fish_species': 'ចំនួនប្រភេទត្រី',
  'complied_rules': 'អនុលោមតាមច្បាប់',
  'fishing_pract_change': 'ការផ្លាស់ប្តូរការអនុវត្តនេសាទ',
  'num_offense_deterred': 'បទល្មើសចំនួនត្រូវបានរារាំង',
  'num_offense_addressed': 'បទល្មើសលេខត្រូវបានដោះស្រាយ',
  'patrol_change': 'ការផ្លាស់ប្តូរល្បាត',
  'num_patrol_group': 'ក្រុមល្បាតលេខ',
  'num_patrol_mem': 'num ល្បាត meme',
  'num_patrol_female': 'ស្ត្រីល្បាតលេខ',
  'patrol_freq': 'ប្រេកង់ល្បាត',
  'offense_solutions': 'ដំណោះស្រាយបទល្មើស',
  'part6_description': 'ផ្នែកទី 6 ការពិពណ៌នា',
  'pond_expand': 'ស្រះពង្រីក',
  'infra_built': 'អ៊ីនហ្វ្រាដែលបានសាងសង់',
  'installed_signs': 'សញ្ញាដែលបានដំឡើង',
  'sign_cnd': 'ចុះហត្ថលេខា cnd',
  'non_cfr_impact': 'ផលប៉ះពាល់មិនមែន cfr',
  'non_cfr_impact_des': 'គ្មានផលប៉ះពាល់ cfr នៃ',
  'part7_description': 'ផ្នែកទី 7 ការពិពណ៌នា',
  'inc_fish_catch': 'inc ការចាប់ត្រី',
  'inc_income': 'ប្រាក់ចំណូល inc',
  'dec_conflict': 'ជម្លោះខែធ្នូ',
  'imp_env': 'impEnv',
  'imp_pride': 'មោទនភាព',
  'has_o_benefits': 'មានអត្ថប្រយោជន៍',
  'o_benefits': 'o អត្ថប្រយោជន៍',
  'o_benefits_lvl': 'o អត្ថប្រយោជន៍ lvl',
  'future_plan': 'ផែនការអនាគត',
  'future_plan_IMP_ENV': 'ផែនការអនាគត IMP ENV',
  'future_plan_IMP_MNGT': 'ផែនការអនាគត IMP MNGT',
  'future_plan_IMP_ENGAGE': 'ផែនការអនាគត IMP ENGAGE',
  'future_plan_SAME': 'ផែនការអនាគតដូចគ្នា។',
  'future_plan_DEC_EFFORT_MNGT': 'ផែនការអនាគត DEC EFORT MNGT',
  'have_future_sug': 'មានអនាគតល្អ',
  'sug_1': 'ស្ករ1',
  'sug_2': 'ស៊ុក២',
  'sug_3': 'ស៊ុក 3',
  'is_qualified_cfr': 'មានលក្ខណៈសម្បត្តិគ្រប់គ្រាន់ cfr',
  'reason_yes': 'ហេតុផល បាទ',
  'reason_no': 'ហេតុផលទេ។',
  '__version__': 'កំណែ',
  'ពេលវេលានៃការដាក់ស្នើ': 'ពេលវេលានៃការដាក់ស្នើ',
  '_notes': 'កំណត់ចំណាំ',
  '_status': 'ស្ថានភាព',
  '_submitted_by': 'ដាក់​ជូន​ដោយ',
  '_tags': ' ស្លាក',
  '_index': 'សន្ទស្សន៍',
}