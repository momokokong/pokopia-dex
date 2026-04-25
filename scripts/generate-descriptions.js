const fs = require('fs');
const path = require('path');

// Load data
const dataPath = path.join(__dirname, '..', 'data', 'habitat-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Description generator based on habitat properties
function generateDescriptions(habitat) {
  const name = habitat.name || {};
  const en = (name.en || '').toLowerCase();
  const zh = (name.zh || '');
  const es = (name.es || '').toLowerCase();
  const pokeNames = habitat.pokemon || [];
  const pokeEn = pokeNames.map(p => p.name.en).filter(Boolean);
  const pokeZh = pokeNames.map(p => p.name.zh).filter(Boolean);

  // Helper: get first Pokémon names for description
  const firstPokeEn = pokeEn.slice(0, 2).join(' and ') || 'Pokémon';
  const firstPokeZh = pokeZh.slice(0, 2).join('、') || '寶可夢';

  let zhDesc = '';
  let enDesc = '';
  let esDesc = '';

  // ========== TALL GRASS VARIANTS ==========
  if (en.includes('tall grass') && !en.includes('flower')) {
    if (en.includes('tree shaded')) {
      zhDesc = '大樹遮蔽的草叢，涼爽又舒適，' + firstPokeZh + '喜歡在樹蔭下乘涼休息。';
      enDesc = 'Cool and cozy tall grass shaded by big trees, where ' + firstPokeEn + ' love to rest in the shade.';
      esDesc = 'Hierba alta fresca y acogedora bajo la sombra de grandes árboles, donde ' + firstPokeEn + ' descansa feliz.';
    } else if (en.includes('boulder shaded')) {
      zhDesc = '大岩石遮蔭的高草叢，充滿野性的氣息，' + firstPokeZh + '在這裡展現力量。';
      enDesc = 'Wild tall grass shaded by massive boulders, where ' + firstPokeEn + ' show off their strength.';
      esDesc = 'Hierba alta salvaje bajo rocas enormes, donde ' + firstPokeEn + ' demuestra su fuerza.';
    } else if (en.includes('hydrated')) {
      zhDesc = '濕潤的高草叢，充滿水氣與生機，' + firstPokeZh + '喜歡這裡的潮濕環境。';
      enDesc = 'Moist and lively tall grass where ' + firstPokeEn + ' enjoy the humid environment.';
      esDesc = 'Hierba alta húmeda y llena de vida donde ' + firstPokeEn + ' disfruta del ambiente.';
    } else if (en.includes('seaside')) {
      zhDesc = '海邊的高草叢，吹著舒服的海風，' + firstPokeZh + '喜歡在海邊悠閒散步。';
      enDesc = 'Tall grass by the seaside with refreshing ocean breezes, perfect for ' + firstPokeEn + ' to stroll.';
      esDesc = 'Hierba alta junto al mar con brisa refrescante, ideal para que ' + firstPokeEn + ' camine.';
    } else if (en.includes('elevated')) {
      zhDesc = '位於高處的高草叢，視野遼闊，' + firstPokeZh + '喜歡在這裡展翅高飛。';
      enDesc = 'Elevated tall grass with a wide view, perfect for ' + firstPokeEn + ' to spread their wings.';
      esDesc = 'Hierba alta elevada con vista amplia, perfecta para que ' + firstPokeEn + ' extienda sus alas.';
    } else if (en.includes('illuminated')) {
      zhDesc = '被溫柔光芒照亮的高草叢，閃閃發光像星空一樣，' + firstPokeZh + '在這裡飛舞。';
      enDesc = 'Tall grass softly illuminated with a starry glow, where ' + firstPokeEn + ' dance in the light.';
      esDesc = 'Hierba alta suavemente iluminada con brillo estelar, donde ' + firstPokeEn + ' baila.';
    } else if (en.includes('smooth')) {
      zhDesc = '光滑平整的高草叢，' + firstPokeZh + '喜歡在這裡蜷縮休息。';
      enDesc = 'Smooth and tidy tall grass where ' + firstPokeEn + ' love to curl up and rest.';
      esDesc = 'Hierba alta suave y ordenada donde ' + firstPokeEn + ' ama acurrucarse.';
    } else if (en.includes('yellow')) {
      zhDesc = '金黃色的高草叢，像陽光灑落在地上，' + firstPokeZh + '在這溫暖的地方活動。';
      enDesc = 'Golden yellow tall grass like sunshine on the ground, where ' + firstPokeEn + ' stay active.';
      esDesc = 'Hierba alta amarilla dorada como luz del sol, donde ' + firstPokeEn + ' juega.';
    } else if (en.includes('red')) {
      zhDesc = '紅色的高草叢，充滿熱情與活力，' + firstPokeZh + '在這裡充滿幹勁。';
      enDesc = 'Red tall grass full of passion and energy, where ' + firstPokeEn + ' stays motivated.';
      esDesc = 'Hierba alta roja llena de pasión y energía donde ' + firstPokeEn + ' se motiva.';
    } else if (en.includes('pink')) {
      zhDesc = '粉紅色的高草叢，浪漫又夢幻，' + firstPokeZh + '在這裡自在飛翔。';
      enDesc = 'Pink tall grass that\'s romantic and dreamy, where ' + firstPokeEn + ' flies freely.';
      esDesc = 'Hierba alta rosa, romántica y mágica, donde ' + firstPokeEn + ' vuela libre.';
    } else if (en.includes('marshy')) {
      zhDesc = '濕地的高草叢，充滿泥濘的樂趣，' + firstPokeZh + '喜歡在濕地中玩耍。';
      enDesc = 'Marshy tall grass full of muddy fun, where ' + firstPokeEn + ' loves to play in the wetland.';
      esDesc = 'Hierba alta pantanosa llena de diversión, donde ' + firstPokeEn + ' juega feliz.';
    } else {
      // Default Tall Grass
      zhDesc = '一片茂密的高草叢，' + firstPokeZh + '喜歡在草叢中探險和玩耍。';
      enDesc = 'Lush tall grass where ' + firstPokeEn + ' loves to explore and play.';
      esDesc = 'Hierba alta exuberante donde ' + firstPokeEn + ' ama explorar y jugar.';
    }
  }

  // ========== FLOWER BED VARIANTS ==========
  else if (en.includes('flower') && !en.includes('garden') && !en.includes('field')) {
    if (en.includes('pretty')) {
      zhDesc = '美麗的花床，五彩繽紛的花朵散發香氣，' + firstPokeZh + '在花叢中飛舞。';
      enDesc = 'A pretty flower bed with colorful blooms and sweet scents, where ' + firstPokeEn + ' dances.';
      esDesc = 'Un hermoso jardín de flores coloridas y fragancia dulce donde ' + firstPokeEn + ' baila.';
    } else if (en.includes('tree shaded')) {
      zhDesc = '樹蔭下的花床，涼爽舒適，' + firstPokeZh + '喜歡在樹蔭下乘涼。';
      enDesc = 'A flower bed in cool tree shade where ' + firstPokeEn + ' enjoys the peaceful rest.';
      esDesc = 'Un jardín de flores bajo sombra fresca donde ' + firstPokeEn + ' descansa feliz.';
    } else if (en.includes('hydrated')) {
      zhDesc = '濕潤的花床，花朵綻放得特別美麗，' + firstPokeZh + '被花香吸引而來。';
      enDesc = 'A hydrated flower bed with beautifully blooming flowers that attract ' + firstPokeEn + '.';
      esDesc = 'Un jardín de flores hidratado con flores hermosas que atraen a ' + firstPokeEn + '.';
    } else if (en.includes('elevated')) {
      zhDesc = '位於高處的花床，視野遼闊，' + firstPokeZh + '在這裡享受微風。';
      enDesc = 'An elevated flower bed with wide views, where ' + firstPokeEn + ' enjoys the breeze.';
      esDesc = 'Un jardín elevado con vista amplia donde ' + firstPokeEn + ' disfruta la brisa.';
    } else if (en.includes('field of flowers')) {
      zhDesc = '一片廣闊的花田，五顏六色的花朵隨風搖曳，' + firstPokeZh + '在花海中飛舞。';
      enDesc = 'A vast field of flowers swaying in the breeze, where ' + firstPokeEn + ' dances.';
      esDesc = 'Un vasto campo de flores ondeando en la brisa donde ' + firstPokeEn + ' baila.';
    } else if (en.includes('graceful')) {
      zhDesc = '優雅的花床，花朵姿態優美，' + firstPokeZh + '在這裡優雅漫步。';
      enDesc = 'A graceful flower bed with elegant blossoms where ' + firstPokeEn + ' strolls gracefully.';
      esDesc = 'Un jardín elegante con flores hermosas donde ' + firstPokeEn + ' camina con elegancia.';
    } else if (en.includes('breezy')) {
      zhDesc = '微風輕拂的花床，花朵隨風搖曳，' + firstPokeZh + '在風中快樂飛舞。';
      enDesc = 'A breezy flower bed where blooms sway in the wind and ' + firstPokeEn + ' dances happily.';
      esDesc = 'Un jardín ventoso donde las flores se mecen y ' + firstPokeEn + ' baila feliz.';
    } else if (en.includes('tropical')) {
      zhDesc = '熱帶風情的花床，充滿異國情調，' + firstPokeZh + '在這裡享受熱帶陽光。';
      enDesc = 'A tropical flower bed with exotic vibes, where ' + firstPokeEn + ' enjoys the sunshine.';
      esDesc = 'Un jardín tropical con ambiente exótico donde ' + firstPokeEn + ' disfruta el sol.';
    } else if (en.includes('windy')) {
      zhDesc = '風兒吹拂的花床，花朵隨風起舞，' + firstPokeZh + '在風中自由飛翔。';
      enDesc = 'A windy flower bed where flowers dance in the breeze with ' + firstPokeEn + '.';
      esDesc = 'Un jardín ventoso donde las flores bailan con la brisa y ' + firstPokeEn + '.';
    } else if (en.includes('fluffy')) {
      zhDesc = '蓬鬆柔軟的花床，像雲朵一樣舒適，' + firstPokeZh + '喜歡在這裡休息。';
      enDesc = 'A fluffy flower bed as soft as clouds, where ' + firstPokeEn + ' loves to rest.';
      esDesc = 'Un jardín esponjoso y suave como nubes, donde ' + firstPokeEn + ' ama descansar.';
    } else {
      zhDesc = '五彩繽紛的花床，充滿花香與生機，' + firstPokeZh + '在花叢中飛舞。';
      enDesc = 'A colorful flower bed full of fragrance and life, where ' + firstPokeEn + ' dances.';
      esDesc = 'Un jardín colorido lleno de fragancia y vida donde ' + firstPokeEn + ' baila.';
    }
  }

  // ========== GRAVE & GARDEN ==========
  else if (en.includes('grave')) {
    if (en.includes('flowers')) {
      zhDesc = '擺滿鮮花的墓地，安靜又溫馨，' + firstPokeZh + '在這裡守護著逝去的夥伴。';
      enDesc = 'A grave decorated with fresh flowers, quiet and peaceful, where ' + firstPokeEn + ' keeps watch.';
      esDesc = 'Una tumba decorada con flores frescas, tranquila y pacífica, donde ' + firstPokeEn + ' vigila.';
    } else if (en.includes('creepy') || en.includes('creepy')) {
      zhDesc = '詭異的墓地供品台，散發神秘氛圍，' + firstPokeZh + '在幽暗的角落閃爍著光芒。';
      enDesc = 'A creepy grave offering with mysterious vibes, where ' + firstPokeEn + ' glows in the shadows.';
      esDesc = 'Una ofrenda fúnebre escalofriante y misteriosa donde ' + firstPokeEn + ' brilla en la sombra.';
    } else {
      zhDesc = '神秘的墓地供品台，燭光閃爍，' + firstPokeZh + '在這裡默默守護。';
      enDesc = 'A mysterious grave offering with flickering lights, where ' + firstPokeEn + ' stands guard.';
      esDesc = 'Una ofrenda fúnebre misteriosa con luces parpadeantes donde ' + firstPokeEn + ' vigila.';
    }
  }
  else if (en.includes('flower garden')) {
    zhDesc = '美麗的花園，各種花朵爭奇鬥艷，' + firstPokeZh + '在這裡自在漫步。';
    enDesc = 'A beautiful flower garden with various blooms, where ' + firstPokeEn + ' strolls freely.';
    esDesc = 'Un hermoso jardín de flores variadas donde ' + firstPokeEn + ' camina libremente.';
  }
  else if (en.includes('fresh veggie')) {
    zhDesc = '新鮮蔬菜田，土壤肥沃充滿生機，' + firstPokeZh + '在田裡辛勤工作。';
    enDesc = 'A fresh veggie field with fertile soil, where ' + firstPokeEn + ' works hard in the earth.';
    esDesc = 'Un campo de vegetales frescos con suelo fértil donde ' + firstPokeEn + ' trabaja.';
  }

  // ========== CAMPSITE & RESTING ==========
  else if (en.includes('campsite')) {
    if (en.includes('berry feast')) {
      zhDesc = '充滿莓果香氣的營地，甜蜜的莓果大餐等著你，' + firstPokeZh + '被美味吸引而來。';
      enDesc = 'A campsite filled with berry aroma and sweet berry feasts that attract ' + firstPokeEn + '.';
      esDesc = 'Un campamento lleno de aroma a bayas y dulces festines que atraen a ' + firstPokeEn + '.';
    } else {
      zhDesc = '溫馨的營地，星空下可以舒服地休息，' + firstPokeZh + '喜歡在營火旁取暖。';
      enDesc = 'A cozy campsite under the starry sky where ' + firstPokeEn + ' warms up by the campfire.';
      esDesc = 'Un campamento acogedor bajo el cielo estrellado donde ' + firstPokeEn + ' se calienta.';
    }
  }
  else if (en.includes('resting spot') || en.includes('rest spot')) {
    zhDesc = '舒適的休息區，' + firstPokeZh + '在這裡恢復體力、放鬆身心。';
    enDesc = 'A comfortable resting spot where ' + firstPokeEn + ' recovers energy and relaxes.';
    esDesc = 'Un cómodo lugar de descanso donde ' + firstPokeEn + ' recupera energía y se relaja.';
  }
  else if (en.includes('bed')) {
    if (en.includes('plush')) {
      zhDesc = '鋪著柔軟玩偶的床鋪，超級舒服，' + firstPokeZh + '在這裡做著甜美的夢。';
