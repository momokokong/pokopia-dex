/* Pokopia Pokédex - Centralized i18n Engine */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.POKOPIA_I18N = api;
  }
  if (root && typeof root === 'object') {
    root.POKOPIA_I18N = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  const SUPPORTED_LANGS = ['zh', 'en', 'es'];
  const STORAGE_KEY = 'pokopia-lang';

  const POKEMON_TYPES = [
    { key: 'Normal',   emoji: '⭐',  zh: '一般',   en: 'Normal',   es: 'Normal'    },
    { key: 'Fire',     emoji: '🔥',  zh: '火',     en: 'Fire',     es: 'Fuego'     },
    { key: 'Water',    emoji: '💧',  zh: '水',     en: 'Water',    es: 'Agua'      },
    { key: 'Grass',    emoji: '🌿',  zh: '草',     en: 'Grass',    es: 'Planta'    },
    { key: 'Electric', emoji: '⚡',  zh: '電',     en: 'Electric', es: 'Eléctrico' },
    { key: 'Ice',      emoji: '❄️',  zh: '冰',     en: 'Ice',      es: 'Hielo'     },
    { key: 'Fighting', emoji: '🥊',  zh: '格鬥',   en: 'Fighting', es: 'Lucha'     },
    { key: 'Poison',   emoji: '☠️',  zh: '毒',     en: 'Poison',   es: 'Veneno'    },
    { key: 'Ground',   emoji: '🏜️',  zh: '地面',   en: 'Ground',   es: 'Tierra'    },
    { key: 'Flying',   emoji: '🕊️',  zh: '飛行',   en: 'Flying',   es: 'Volador'   },
    { key: 'Psychic',  emoji: '🔮',  zh: '超能力', en: 'Psychic',  es: 'Psíquico'  },
    { key: 'Bug',      emoji: '🐛',  zh: '蟲',     en: 'Bug',      es: 'Bicho'     },
    { key: 'Rock',     emoji: '🪨',  zh: '岩石',   en: 'Rock',     es: 'Roca'      },
    { key: 'Ghost',    emoji: '👻',  zh: '幽靈',   en: 'Ghost',    es: 'Fantasma'  },
    { key: 'Dragon',   emoji: '🐉',  zh: '龍',     en: 'Dragon',   es: 'Dragón'    },
    { key: 'Steel',    emoji: '🛡️',  zh: '鋼',     en: 'Steel',    es: 'Acero'     },
    { key: 'Fairy',    emoji: '🧚',  zh: '妖精',   en: 'Fairy',    es: 'Hada'      },
    { key: 'Dark',     emoji: '🌑',  zh: '惡',     en: 'Dark',     es: 'Siniestro' }
  ];

  const DICT = {
    zh: {
      // Bottom tab bar labels
      tab_dex: '圖鑑',
      tab_habitats: '棲息地',
      tab_quiz: '猜謎挑戰',
      tab_badges: '徽章',
      tab_settings: '設定',

      // Common UI & Index strings
      search_placeholder: '搜尋寶可夢...',
      filter_all: '全部',
      more_types: '+ 更多',
      drawer_title: '選擇屬性',
      drawer_clear: '清除全部',
      drawer_apply: '確定',
      collected: '✅',
      uncollected: '❓',
      empty_pokemon: '🤔 沒有找到符合的寶可夢',
      trilingual_toggle: '🌐 三語',
      play_all_langs: '🔊 三語連播',

      // Rarity, Time, Weather
      common: '常見',
      uncommon: '較稀有',
      rare: '稀有',
      very_rare: '非常稀有',
      all_day: '全天候',
      all_weather: '全天氣',
      special: '特殊',
      time: '時間',
      weather: '天氣',
      rarity: '稀有度',

      // Detail & Habitat strings
      specialties: '特技',
      ideal_habitat: '理想棲息環境',
      favorites: '喜歡的東西',
      where_to_find: '哪裡可以找到',
      description: 'Pokopia 簡介',
      loved_items: '喜愛物品',
      furniture: '🪑 家具',
      food: '🍎 食物',
      misc: '📦 雜項',
      collect_btn: '收集到了！',
      collected_btn: '✅ 已收集',
      how_to_find: '如何找到',
      zone: '區域',
      no_items: '尚無資料',
      no_data: '尚無資料',
      biome: '棲息地',
      biomes: 'Biome',
      title: '🏝️ 棲息地',
      nav_title: '🏝️ 棲息地',
      pokemon_here: '此處的寶可夢',
      pokemon_in_habitat: '此處的寶可夢',
      requirements: '建造需求',
      back: '← 返回棲息地',
      no_zone: '一般區域',
      special_zone: '特殊區域',
      special_mission: '🌟 特殊任務',
      special_mission_desc: '完成特殊任務才能遇見這隻寶可夢！',
      click_to_expand: '點擊展開',
      palette_town: '🏘️ 調色盤小鎮',
      cloud_island: '☁️🏝️ 雲之島',
      withered_wasteland: '🏜️ 枯萎荒地',
      general_area: '🌿 一般區域',

      // Badges strings (all 13 badges)
      badges_title: '🏅 徽章',
      progress_title: '收集進度',
      collected_of: '已收集',
      locked: '🔒 未解鎖',
      unlocked: '✨ 已解鎖',
      collector: '初級收藏家',
      collector_desc: '收集 10 隻寶可夢',
      explorer: '探險家',
      explorer_desc: '收集 30 隻寶可夢',
      veteran: '老練訓練師',
      veteran_desc: '收集 60 隻寶可夢',
      master: '寶可夢大師',
      master_desc: '收集 100 隻寶可夢',
      legend: '傳說訓練師',
      legend_desc: '收集 150 隻寶可夢',
      completionist: '完美主義者',
      completionist_desc: '收集 200 隻寶可夢',
      ultimate: '究極收藏家',
      ultimate_desc: '收集 250 隻寶可夢',
      god: '寶可夢之神',
      god_desc: '收集所有 303 隻寶可夢',
      type_specialist: '屬性專家',
      type_specialist_desc: '收集 10 隻同屬性寶可夢',
      habitat_hunter: '棲息地獵人',
      habitat_hunter_desc: '解鎖 50 個棲息地',
      night_owl: '夜貓子',
      night_owl_desc: '在深夜使用圖鑑',
      early_bird: '早起的鳥兒',
      early_bird_desc: '在早晨使用圖鑑',
      quiz_master: '猜謎大師',
      quiz_master_desc: '在猜謎挑戰獲得 8 分以上或 5 連擊',

      // Settings strings
      settings_title: '⚙️ 設定',
      settings_lang: '🌐 語言設定',
      settings_trilingual: '📚 三語顯示模式',
      settings_trilingual_desc: '同時顯示三語名稱',
      settings_trilingual_hint: '在卡片上同時顯示中、英、西名稱',
      settings_sync: '🔗 進度碼同步',
      settings_sync_hint: '用進度碼在不同裝置間同步收集進度',
      settings_generate_code: '產生進度碼',
      settings_generate_code_hint: '產生 QR Code 與文字碼',
      settings_import_code: '匯入進度碼',
      settings_import_code_hint: '貼上進度碼還原收集進度',
      settings_code_title: '你的進度碼',
      settings_code_desc: '掃描 QR Code 或複製進度碼到其他裝置',
      settings_copy_code: '📋 複製',
      settings_import_code_title: '匯入進度碼',
      settings_import_code_desc: '貼上從其他裝置複製的進度碼',
      settings_import_confirm: '匯入',
      settings_close: '關閉',
      settings_copied: '已複製！',
      settings_sync_success: '同步成功！已收集 {count} 隻',
      settings_invalid_code: '無效的進度碼',
      settings_data: '💾 資料管理',
      settings_export: '匯出收集進度',
      settings_export_hint: '下載 JSON 檔案備份',
      settings_import: '匯入收集進度',
      settings_import_hint: '從 JSON 檔案還原',
      settings_clear: '清除所有資料',
      settings_clear_hint: '刪除收集進度與設定',
      settings_about: 'ℹ️ 關於',
      settings_version: '版本',
      settings_app: '應用程式',
      settings_pokemon_count: '寶可夢數量',
      settings_collected: '已收集',
      settings_clear_cache: '清除快取',
      settings_disclaimer: '⚠️ 中文與西班牙文描述為 AI 翻譯，僅供教育參考用途。寶可夢名稱為官方譯名。圖片版權歸 Nintendo/Game Freak 所有。',
      settings_clear_confirm_title: '確定要清除所有資料？',
      settings_clear_confirm_desc: '這將刪除你的收集進度與所有設定。此操作無法復原。',
      settings_cancel: '取消',
      settings_clear_confirm: '清除',
      settings_import_success: '匯入成功！',
      settings_export_success: '匯出成功！',

      // All 18 Pokémon types
      ...Object.fromEntries(POKEMON_TYPES.map(t => ['type_' + t.key, t.emoji + ' ' + t.zh]))
    },
    en: {
      // Bottom tab bar labels
      tab_dex: 'Pokédex',
      tab_habitats: 'Habitats',
      tab_quiz: 'Quiz',
      tab_badges: 'Badges',
      tab_settings: 'Settings',

      // Common UI & Index strings
      search_placeholder: 'Search Pokémon...',
      filter_all: 'All',
      more_types: '+ More',
      drawer_title: 'Select Types',
      drawer_clear: 'Clear All',
      drawer_apply: 'Apply',
      collected: '✅',
      uncollected: '❓',
      empty_pokemon: '🤔 No Pokémon found',
      trilingual_toggle: '🌐 3-Lang',
      play_all_langs: '🔊 Play All 3 Languages',

      // Rarity, Time, Weather
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      very_rare: 'Very Rare',
      all_day: 'All day',
      all_weather: 'All weather',
      special: 'Special',
      time: 'Time',
      weather: 'Weather',
      rarity: 'Rarity',

      // Detail & Habitat strings
      specialties: 'Specialties',
      ideal_habitat: 'Ideal Habitat',
      favorites: 'Favorites',
      where_to_find: 'Where to Find',
      description: 'Pokopia Description',
      loved_items: 'Loved Items',
      furniture: '🪑 Furniture',
      food: '🍎 Food',
      misc: '📦 Misc.',
      collect_btn: 'Collected!',
      collected_btn: '✅ Collected',
      how_to_find: 'How to Find',
      zone: 'Zone',
      no_items: 'No data',
      no_data: 'No data',
      biome: 'Biome',
      biomes: 'Biome',
      title: '🏝️ Habitats',
      nav_title: '🏝️ Habitat',
      pokemon_here: 'Pokémon Here',
      pokemon_in_habitat: 'Pokémon in this Habitat',
      requirements: 'Requirements',
      back: '← Back to Habitats',
      no_zone: 'General Area',
      special_zone: 'Special Area',
      special_mission: '🌟 Special Mission',
      special_mission_desc: 'Complete a special mission to meet this Pokémon!',
      click_to_expand: 'Tap to expand',
      palette_town: '🏘️ Palette Town',
      cloud_island: '☁️🏝️ Cloud Island',
      withered_wasteland: '🏜️ Withered Wasteland',
      general_area: '🌿 General Area',

      // Badges strings (all 13 badges)
      badges_title: '🏅 Badges',
      progress_title: 'Collection Progress',
      collected_of: 'collected',
      locked: '🔒 Locked',
      unlocked: '✨ Unlocked',
      collector: 'Junior Collector',
      collector_desc: 'Collect 10 Pokémon',
      explorer: 'Explorer',
      explorer_desc: 'Collect 30 Pokémon',
      veteran: 'Veteran Trainer',
      veteran_desc: 'Collect 60 Pokémon',
      master: 'Pokémon Master',
      master_desc: 'Collect 100 Pokémon',
      legend: 'Legendary Trainer',
      legend_desc: 'Collect 150 Pokémon',
      completionist: 'Completionist',
      completionist_desc: 'Collect 200 Pokémon',
      ultimate: 'Ultimate Collector',
      ultimate_desc: 'Collect 250 Pokémon',
      god: 'Pokémon God',
      god_desc: 'Collect all 303 Pokémon',
      type_specialist: 'Type Specialist',
      type_specialist_desc: 'Collect 10 same-type Pokémon',
      habitat_hunter: 'Habitat Hunter',
      habitat_hunter_desc: 'Unlock 50 habitats',
      night_owl: 'Night Owl',
      night_owl_desc: 'Use Pokédex at night',
      early_bird: 'Early Bird',
      early_bird_desc: 'Use Pokédex in the morning',
      quiz_master: 'Quiz Master',
      quiz_master_desc: 'Score 8+ or reach 5x combo in Quiz',

      // Settings strings
      settings_title: '⚙️ Settings',
      settings_lang: '🌐 Language',
      settings_trilingual: '📚 Trilingual Mode',
      settings_trilingual_desc: 'Show all three languages',
      settings_trilingual_hint: 'Display Chinese, English & Spanish names on cards',
      settings_sync: '🔗 Sync Progress Code',
      settings_sync_hint: 'Use a progress code to sync across devices',
      settings_generate_code: 'Generate Code',
      settings_generate_code_hint: 'Generate QR Code & text code',
      settings_import_code: 'Import Code',
      settings_import_code_hint: 'Paste a progress code to restore',
      settings_code_title: 'Your Progress Code',
      settings_code_desc: 'Scan QR Code or copy code to another device',
      settings_copy_code: '📋 Copy',
      settings_import_code_title: 'Import Progress Code',
      settings_import_code_desc: 'Paste the code from another device',
      settings_import_confirm: 'Import',
      settings_close: 'Close',
      settings_copied: 'Copied!',
      settings_sync_success: 'Synced! Collected {count} Pokémon',
      settings_invalid_code: 'Invalid progress code',
      settings_data: '💾 Data Management',
      settings_export: 'Export Collection',
      settings_export_hint: 'Download JSON backup file',
      settings_import: 'Import Collection',
      settings_import_hint: 'Restore from JSON file',
      settings_clear: 'Clear All Data',
      settings_clear_hint: 'Delete progress & settings',
      settings_about: 'ℹ️ About',
      settings_version: 'Version',
      settings_app: 'App',
      settings_pokemon_count: 'Pokémon Count',
      settings_collected: 'Collected',
      settings_clear_cache: 'Clear Cache',
      settings_disclaimer: '⚠️ Chinese and Spanish descriptions are AI-translated for educational reference only. Pokémon names are official translations. Images © Nintendo/Game Freak.',
      settings_clear_confirm_title: 'Clear all data?',
      settings_clear_confirm_desc: 'This will delete your collection progress and all settings. This cannot be undone.',
      settings_cancel: 'Cancel',
      settings_clear_confirm: 'Clear',
      settings_import_success: 'Import successful!',
      settings_export_success: 'Export successful!',

      // All 18 Pokémon types
      ...Object.fromEntries(POKEMON_TYPES.map(t => ['type_' + t.key, t.emoji + ' ' + t.en]))
    },
    es: {
      // Bottom tab bar labels
      tab_dex: 'Pokédex',
      tab_habitats: 'Hábitats',
      tab_quiz: 'Desafío',
      tab_badges: 'Medallas',
      tab_settings: 'Ajustes',

      // Common UI & Index strings
      search_placeholder: 'Buscar Pokémon...',
      filter_all: 'Todos',
      more_types: '+ Más',
      drawer_title: 'Seleccionar tipos',
      drawer_clear: 'Limpiar',
      drawer_apply: 'Aplicar',
      collected: '✅',
      uncollected: '❓',
      empty_pokemon: '🤔 No se encontraron Pokémon',
      trilingual_toggle: '🌐 3-Idiomas',
      play_all_langs: '🔊 Reproducir 3 Idiomas',

      // Rarity, Time, Weather
      common: 'Común',
      uncommon: 'Poco común',
      rare: 'Raro',
      very_rare: 'Muy raro',
      all_day: 'Todo el día',
      all_weather: 'Todo clima',
      special: 'Especial',
      time: 'Hora',
      weather: 'Clima',
      rarity: 'Rareza',

      // Detail & Habitat strings
      specialties: 'Especialidades',
      ideal_habitat: 'Hábitat Ideal',
      favorites: 'Favoritos',
      where_to_find: 'Dónde encontrar',
      description: 'Descripción Pokopia',
      loved_items: 'Objetos Favoritos',
      furniture: '🪑 Mobiliario',
      food: '🍎 Comida',
      misc: '📦 Varios',
      collect_btn: '¡Recogido!',
      collected_btn: '✅ Recogido',
      how_to_find: 'Cómo encontrar',
      zone: 'Zona',
      no_items: 'Sin datos',
      no_data: 'Sin datos',
      biome: 'Bioma',
      biomes: 'Bioma',
      title: '🏝️ Hábitats',
      nav_title: '🏝️ Hábitat',
      pokemon_here: 'Pokémon Aquí',
      pokemon_in_habitat: 'Pokémon en este Hábitat',
      requirements: 'Requisitos',
      back: '← Volver a Hábitats',
      no_zone: 'Área General',
      special_zone: 'Área Especial',
      special_mission: '🌟 Misión Especial',
      special_mission_desc: '¡Completa una misión especial para encontrar este Pokémon!',
      click_to_expand: 'Toca para expandir',
      palette_town: '🏘️ Pueblo Paleta',
      cloud_island: '☁️🏝️ Isla Nube',
      withered_wasteland: '🏜️ Yermo Marchito',
      general_area: '🌿 Área General',

      // Badges strings (all 13 badges)
      badges_title: '🏅 Medallas',
      progress_title: 'Progreso de Colección',
      collected_of: 'recogidos',
      locked: '🔒 Bloqueado',
      unlocked: '✨ Desbloqueado',
      collector: 'Coleccionista Junior',
      collector_desc: 'Recoge 10 Pokémon',
      explorer: 'Explorador',
      explorer_desc: 'Recoge 30 Pokémon',
      veteran: 'Entrenador Veterano',
      veteran_desc: 'Recoge 60 Pokémon',
      master: 'Maestro Pokémon',
      master_desc: 'Recoge 100 Pokémon',
      legend: 'Entrenador Legendario',
      legend_desc: 'Recoge 150 Pokémon',
      completionist: 'Perfeccionista',
      completionist_desc: 'Recoge 200 Pokémon',
      ultimate: 'Coleccionista Supremo',
      ultimate_desc: 'Recoge 250 Pokémon',
      god: 'Dios Pokémon',
      god_desc: 'Recoge todos los 303 Pokémon',
      type_specialist: 'Especialista de Tipo',
      type_specialist_desc: 'Recoge 10 Pokémon del mismo tipo',
      habitat_hunter: 'Cazador de Hábitats',
      habitat_hunter_desc: 'Desbloquea 50 hábitats',
      night_owl: 'Noctámbulo',
      night_owl_desc: 'Usa el Pokédex de noche',
      early_bird: 'Madrugador',
      early_bird_desc: 'Usa el Pokédex por la mañana',
      quiz_master: 'Maestro del Quiz',
      quiz_master_desc: 'Obtén 8+ puntos o combo 5x en el Quiz',

      // Settings strings
      settings_title: '⚙️ Configuración',
      settings_lang: '🌐 Idioma',
      settings_trilingual: '📚 Modo trilingüe',
      settings_trilingual_desc: 'Mostrar los tres idiomas',
      settings_trilingual_hint: 'Mostrar nombres en chino, inglés y español en las tarjetas',
      settings_sync: '🔗 Sincronizar código',
      settings_sync_hint: 'Usa un código para sincronizar entre dispositivos',
      settings_generate_code: 'Generar código',
      settings_generate_code_hint: 'Generar código QR y texto',
      settings_import_code: 'Importar código',
      settings_import_code_hint: 'Pega un código para restaurar el progreso',
      settings_code_title: 'Tu código de progreso',
      settings_code_desc: 'Escanea el código QR o copia el código a otro dispositivo',
      settings_copy_code: '📋 Copiar',
      settings_import_code_title: 'Importar código de progreso',
      settings_import_code_desc: 'Pega el código desde otro dispositivo',
      settings_import_confirm: 'Importar',
      settings_close: 'Cerrar',
      settings_copied: '¡Copiado!',
      settings_sync_success: '¡Sincronizado! {count} Pokémon coleccionados',
      settings_invalid_code: 'Código de progreso inválido',
      settings_data: '💾 Gestión de datos',
      settings_export: 'Exportar colección',
      settings_export_hint: 'Descargar archivo JSON de respaldo',
      settings_import: 'Importar colección',
      settings_import_hint: 'Restaurar desde archivo JSON',
      settings_clear: 'Borrar todos los datos',
      settings_clear_hint: 'Eliminar progreso y configuración',
      settings_about: 'ℹ️ Acerca de',
      settings_version: 'Versión',
      settings_app: 'Aplicación',
      settings_pokemon_count: 'Cantidad de Pokémon',
      settings_collected: 'Coleccionados',
      settings_clear_cache: 'Limpiar caché',
      settings_disclaimer: '⚠️ Las descripciones en chino y español son traducciones de IA solo para referencia educativa. Los nombres de Pokémon son traducciones oficiales. Imágenes © Nintendo/Game Freak.',
      settings_clear_confirm_title: '¿Borrar todos los datos?',
      settings_clear_confirm_desc: 'Esto eliminará tu progreso de colección y toda la configuración. No se puede deshacer.',
      settings_cancel: 'Cancelar',
      settings_clear_confirm: 'Borrar',
      settings_import_success: '¡Importación exitosa!',
      settings_export_success: '¡Exportación exitosa!',

      // All 18 Pokémon types
      ...Object.fromEntries(POKEMON_TYPES.map(t => ['type_' + t.key, t.emoji + ' ' + t.es]))
    }
  };

  function validateLang(lang) {
    return SUPPORTED_LANGS.includes(lang) ? lang : 'en';
  }

  function getLang() {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return validateLang(saved || 'en');
    } catch {
      return 'en';
    }
  }

  function setLang(lang) {
    const validLang = validateLang(lang);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, validLang);
      }
    } catch {
      // Ignore storage errors
    }
    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: validLang } }));
    }
    return validLang;
  }

  function t(key, lang) {
    const targetLang = lang ? validateLang(lang) : getLang();
    const langDict = DICT[targetLang] || DICT.en;
    if (langDict && Object.prototype.hasOwnProperty.call(langDict, key) && langDict[key] !== undefined && langDict[key] !== '') {
      return langDict[key];
    }
    if (DICT.en && Object.prototype.hasOwnProperty.call(DICT.en, key) && DICT.en[key] !== undefined) {
      return DICT.en[key];
    }
    return key;
  }

  function applyI18nToDOM(root) {
    const container = root || (typeof document !== 'undefined' ? document : null);
    if (!container || typeof container.querySelectorAll !== 'function') return;

    const currentLang = getLang();

    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n') || (el.dataset && el.dataset.i18n);
      if (key) {
        el.textContent = t(key, currentLang);
      }
    });

    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder') || (el.dataset && el.dataset.i18nPlaceholder);
      if (key) {
        el.placeholder = t(key, currentLang);
      }
    });

    container.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title') || (el.dataset && el.dataset.i18nTitle);
      if (key) {
        const val = t(key, currentLang);
        el.title = val;
        el.setAttribute('aria-label', val);
      }
    });
  }

  return {
    SUPPORTED_LANGS,
    POKEMON_TYPES,
    DICT,
    getLang,
    setLang,
    t,
    applyI18nToDOM
  };
});
