// PokopiaDex Browser Visual & Functional Tests
// Uses agent-browser to test each page visually

const tests = [
  // === 1. Index (Pokédex List) ===
  { name: 'index-default', url: '/', desc: 'Pokédex list - default (zh)', eval: 'document.querySelectorAll(".pokemon-card").length + " cards loaded"' },
  { name: 'index-en', url: '/', desc: 'Pokédex list - English', action: 'click-lang-en', eval: 'document.querySelector(".lang-btn[data-lang=en]").classList.contains("active") ? "EN active" : "EN not active"' },
  { name: 'index-fire-filter', url: '/', desc: 'Pokédex - Fire type filter', action: 'click-fire-filter', eval: 'document.querySelectorAll(".pokemon-card").length + " fire pokemon"' },
  { name: 'index-search', url: '/', desc: 'Pokédex - Search Eevee', action: 'search-eevee', eval: 'document.querySelectorAll(".pokemon-card").length + " results"' },

  // === 2. Detail ===
  { name: 'detail-bulbasaur', url: '/detail.html?id=1', desc: 'Detail - Bulbasaur (zh)', eval: 'document.querySelector(".detail-hero__name-main")?.textContent || "no name"' },
  { name: 'detail-eevee-en', url: '/detail.html?id=133', desc: 'Detail - Eevee (en)', action: 'click-lang-en', eval: 'document.querySelector(".detail-hero__name-main")?.textContent || "no name"' },
  { name: 'detail-collect', url: '/detail.html?id=1', desc: 'Detail - collect button', action: 'click-collect', eval: 'document.querySelector(".collect-btn")?.textContent.trim() || "no btn"' },

  // === 3. Habitats ===
  { name: 'habitats', url: '/habitats.html', desc: 'Habitats list (zh)', eval: 'document.querySelectorAll(".habitat-card, .habitat-zone-section").length + " sections"' },

  // === 4. Habitat Detail ===
  { name: 'habitat-detail-tallgrass', url: '/habitat-detail.html?id=1', desc: 'Habitat detail - Tall Grass', eval: 'document.querySelector(".habitat-hero__title")?.textContent || "no title"' },

  // === 5. Badges ===
  { name: 'badges', url: '/badges.html', desc: 'Badges page (zh)', eval: 'document.querySelectorAll(".badge-card").length + " badges"' },

  // === 6. Settings ===
  { name: 'settings', url: '/settings.html', desc: 'Settings page (zh)', eval: 'document.querySelectorAll(".settings-lang-btn").length + " lang buttons"' },
  { name: 'settings-trilingual', url: '/settings.html', desc: 'Settings - trilingual toggle', action: 'toggle-trilingual', eval: 'document.getElementById("trilingualToggle").checked ? "on" : "off"' },
  { name: 'settings-en', url: '/settings.html', desc: 'Settings - English', action: 'click-lang-en', eval: 'document.querySelector(".settings-section__title")?.textContent || "no title"' },
];

// Output test plan
console.log('=== PokopiaDex Visual & Functional Test Plan ===\n');
console.log(`Total tests: ${tests.length}\n`);
tests.forEach((t, i) => {
  console.log(`${i+1}. ${t.name}: ${t.desc}`);
  console.log(`   URL: ${t.url}`);
  if (t.action) console.log(`   Action: ${t.action}`);
  console.log(`   Verify: ${t.eval}`);
  console.log('');
});