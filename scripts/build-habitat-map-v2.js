const https = require('https');
const fs = require('fs');

// Build complete habitat image mapping from GameWith data
// We already have the 209 PokopiaDex slugs from the browser
// And we know GameWith habitat numbering matches PokopiaDex sequential order

const pdexSlugs = [
  "tall-grass-001","tree-shaded-tall-grass-002","boulder-shaded-tall-grass-003","hydrated-tall-grass-004",
  "seaside-tall-grass-005","elevated-tall-grass-006","illuminated-tall-grass-007","pretty-flower-bed-008",
  "tree-shaded-flower-bed-009","hydrated-flower-bed-010","field-of-flowers-011","elevated-flower-bed-012",
  "grave-with-flowers-013","flower-garden-014","fresh-veggie-field-015","riding-warm-updrafts-016",
  "campsite-017","training-waterfall-018","tantalizing-dining-set-019","picnic-set-020",
  "flowery-table-021","bench-with-greenery-022","illuminated-bench-023","exercise-resting-spot-024",
  "urgent-care-025","gym-first-aid-026","road-sign-027","large-luggage-carrier-028",
  "lumberjacks-workplace-029","bed-with-a-plush-030","gently-lit-bed-031","grave-offering-032",
  "creepy-grave-offering-033","chansey-resting-area-034","irresistible-scent-and-glow-035","floating-in-the-shade-036",
  "smooth-tall-grass-037","factory-storage-038","luxury-chirp-chirp-meal-039","berry-feast-campsite-040",
  "rain-dance-site-041","sunny-day-site-042","professors-treasure-trove-043","crazy-log-handicrafts-044",
  "very-berry-space-045","garden-terrace-046","tree-shaded-snoozing-snorlax-047","good-old-fashioned-antiques-048",
  "nothin-but-poke-balls-049","yellow-tall-grass-050","tree-shaded-yellow-tall-grass-051","elevated-yellow-tall-grass-052",
  "hydrated-yellow-tall-grass-053","marshy-tall-grass-054","overgrowth-vending-machine-055","breezy-flower-bed-056",
  "tropical-vibes-057","windy-flower-bed-058","shaded-beach-059","tropical-seaside-060","resting-spot-061",
  "perpetual-mess-062","trash-collection-site-063","trash-can-central-064","trash-disposal-site-065",
  "park-bench-066","tantalizing-restaurant-067","tableside-delivery-cart-068","chirp-chirp-meal-069",
  "cafe-space-070","beach-set-071","light-up-stage-072","surprise-in-store-073","night-festival-venue-074",
  "changing-area-075","private-makeup-stand-076","knitting-station-077","hot-spring-shower-078",
  "resort-meal-prep-079","all-packed-up-080","full-recovery-081","alarm-clock-sleep-zone-082",
  "vending-machine-break-area-083","vending-machine-set-084","mini-game-corner-085","waterwheel-spot-086",
  "furnace-spot-087","dock-088","spooky-study-089","playing-pirate-090","working-the-register-091",
  "tiny-atelier-092","gourmets-altar-093","pikachu-space-094","cuteness-overload-095","welcoming-resort-096",
  "plain-life-097","red-tall-grass-098","tree-shaded-red-tall-grass-099","pointy-tree-shaded-rocky-tall-grass-100",
  "hydrated-red-tall-grass-101","elevated-red-tall-grass-102","grassy-training-field-103","graceful-flower-bed-104",
  "tree-shaded-graceful-flower-bed-105","hydrated-graceful-flower-bed-106","flower-garden-stump-stage-107",
  "toil-in-the-soil-108","uplifting-duckweed-109","mossy-rest-spot-110","mossy-boulder-111","mossy-hot-spring-112",
  "open-air-bath-113","harmonious-hot-spring-114","piping-hot-lava-115","digging-and-burning-116",
  "clink-clang-iron-construction-117","creepy-white-rocks-118","container-snacking-119","dinner-table-surprise-120",
  "best-bread-bakery-121","mini-kitchen-122","house-party-123","lazy-photo-album-scrolling-124",
  "chirping-recital-125","recital-stage-126","box-to-the-rhythm-127","music-and-magazines-128",
  "mini-museum-129","refreshing-locker-room-130","bronze-landmark-131","railroad-crossing-132",
  "chefs-kitchen-133","absolute-luxury-134","heavy-iron-135","modern-living-136","pink-tall-grass-137",
  "tree-shaded-pink-tall-grass-138","hydrated-pink-tall-grass-139","elevated-pink-tall-grass-140",
  "concrete-pipe-secret-base-141","fluffy-flower-bed-142","tree-shaded-fluffy-flower-bed-143",
  "hydrated-fluffy-flower-bed-144","waterside-dinghy-145","illuminated-waterfall-146","birdsong-garden-147",
  "simple-bathroom-148","cycling-rest-stop-149","fireplace-nap-spot-150","surging-psychic-power-151",
  "fortune-tellers-table-152","trash-site-tv-153","oversized-dumping-ground-154","interrogation-desk-155",
  "sewer-hole-inspection-156","spotless-washing-station-157","home-theater-158","study-area-159",
  "rhythmic-living-room-160","squeaky-clean-161","moisturizing-makeup-stand-162","mini-library-163",
  "game-corner-battle-zone-164","playland-165","work-desk-166","office-storeroom-167","experiment-space-168",
  "professors-apprentice-program-169","researchers-desk-170","public-reading-material-171",
  "heart-pounding-surprise-box-172","prank-button-173","picturesque-photo-cutout-board-174","tire-park-175",
  "natures-market-176","construction-site-generator-177","dojo-training-178","evil-organization-hq-179",
  "nine-flames-180","plush-central-181","gamers-paradise-182","top-pop-183","fishing-pond-184",
  "ocean-fishing-spot-185","marsh-fishing-spot-186","hot-spring-fishing-spot-187","magma-fishing-spot-188",
  "amped-rock-stage-189","low-key-rock-stage-190","malicious-knights-shrine-191","auspicious-knights-shrine-192",
  "wing-fossil-display-193","skull-fossil-display-194","headbutt-fossil-display-195","armor-fossil-display-196",
  "shield-fossil-display-197","jaw-fossil-display-198","despot-fossil-display-199","sail-fossil-display-200",
  "tundra-fossil-display-201","boundless-blue-beverage-202","electrifying-potatoes-203","burning-hot-spice-204",
  "elegant-daytime-treats-205","dark-chocolate-cookies-206","leafy-greens-sandwich-207","chilly-shaved-ice-208",
  "lovely-ribbon-cake-209"
];

// GameWith data from browser (truncated to first 30, but pattern is clear)
// We need to fetch full names from GameWith or use a default mapping
// The key insight: PokopiaDex slugs are in the same order as GameWith habitat numbers

var mapping = {};
for (var i = 0; i < pdexSlugs.length; i++) {
  var gwId = i + 1; // GameWith IDs start at 1
  var slug = pdexSlugs[i];
  var imgNum = String(gwId).padStart(3, '0');
  mapping[slug] = {
    gwId: gwId,
    img: 'habitats/habitat_' + imgNum + '.png'
  };
}

// Save the mapping
fs.writeFileSync('../data/habitat-image-map.json', JSON.stringify(mapping, null, 2), 'utf8');
console.log('Saved habitat-image-map.json with ' + Object.keys(mapping).length + ' entries');
console.log('First 5:', JSON.stringify(Object.entries(mapping).slice(0, 5), null, 2));