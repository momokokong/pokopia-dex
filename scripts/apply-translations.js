#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const habitatPath = path.join(REPO_ROOT, 'data/habitat-data.json');
const data = JSON.parse(fs.readFileSync(habitatPath, 'utf8'));

// All translations from 8 batches
const translations = {
  // Batch 01
  "2": {"zh":"樹蔭深草地","es":"Hierba alta bajo la sombra"},
  "3": {"zh":"巨岩深草地","es":"Hierba alta junto a la roca"},
  "5": {"zh":"海濱深草地","es":"Hierba alta junto al mar"},
  "6": {"zh":"高地深草地","es":"Hierba alta en la colina"},
  "7": {"zh":"陽光深草地","es":"Hierba alta soleada"},
  "8": {"zh":"漂亮花壇","es":"Cantero de flores lindo"},
  "9": {"zh":"樹蔭花壇","es":"Cantero de flores bajo la sombra"},
  "10": {"zh":"滋潤花壇","es":"Cantero de flores húmedo"},
  "11": {"zh":"花海原野","es":"Campo de flores"},
  "12": {"zh":"高地花壇","es":"Cantero de flores en la colina"},
  "13": {"zh":"繁花墳場","es":"Tumba con flores"},
  "14": {"zh":"花園","es":"Jardín de flores"},
  "15": {"zh":"新鮮蔬菜地","es":"Huerto de verduras frescas"},
  "16": {"zh":"乘著溫暖上升氣流","es":"Volando en corrientes cálidas"},
  "17": {"zh":"露營地","es":"Campamento"},
  "18": {"zh":"訓練瀑布","es":"Cascada de entrenamiento"},
  "19": {"zh":"誘人的餐桌","es":"Mesa de comedor deliciosa"},
  "20": {"zh":"野餐組","es":"Set de picnic"},
  "21": {"zh":"繁花餐桌","es":"Mesa con flores"},
  "23": {"zh":"發光長椅","es":"Banca iluminada"},
  "24": {"zh":"運動休息區","es":"Lugar de descanso deportivo"},
  "25": {"zh":"急診中心","es":"Centro de urgencias"},
  "26": {"zh":"道館救護站","es":"Primeros auxilios del Gimnasio"},
  "27": {"zh":"路標","es":"Señal de camino"},
  "28": {"zh":"大型行李箱","es":"Maleta grande"},
  // Batch 02
  "29": {"zh":"伐木工的工作坊","es":"Taller de Leñadores"},
  "30": {"zh":"有娃娃的床","es":"Cama con Peluche"},
  "31": {"zh":"光線溫柔的床","es":"Cama de Luz Suave"},
  "32": {"zh":"墓地供品","es":"Ofrenda de Tumba"},
  "33": {"zh":"詭異的墓地供品","es":"Ofrenda Misteriosa"},
  "34": {"zh":"吉利蛋休息區","es":"Zona de Descanso de Chansey"},
  "35": {"zh":"無法抗拒的香氣與光芒","es":"Aroma y Brillo Irresistible"},
  "36": {"zh":"在陰影中漂浮","es":"Flotando en la Sombra"},
  "37": {"zh":"平滑的高草叢","es":"Hierba Alta Suave"},
  "38": {"zh":"工廠倉庫","es":"Almacén de la Fábrica"},
  "39": {"zh":"豪華啾啾大餐","es":"Banquete de Lujo Pío-Pío"},
  "40": {"zh":"樹果大餐營地","es":"Campamento de Banquete de Bayas"},
  "41": {"zh":"雨之舞場地","es":"Lugar de la Danza de la Lluvia"},
  "42": {"zh":"晴天場地","es":"Lugar del Día Soleado"},
  "44": {"zh":"瘋狂原木手工藝","es":"Manualidades Locas de Troncos"},
  "45": {"zh":"超級樹果空間","es":"Espacio Súper Baya"},
  "46": {"zh":"花園露台","es":"Terraza del Jardín"},
  "47": {"zh":"樹蔭下打盹的卡比獸","es":"Snorlax Durmiendo bajo la Sombra"},
  "48": {"zh":"古色古香的古董店","es":"Antigüedades Clásicas"},
  "49": {"zh":"全是精靈球","es":"Solo Poké Balls"},
  "50": {"zh":"黃色高草叢","es":"Hierba Alta Amarilla"},
  "51": {"zh":"樹蔭下的黃色高草叢","es":"Hierba Amarilla bajo la Sombra"},
  "52": {"zh":"高地黃色高草叢","es":"Hierba Amarilla Elevada"},
  "53": {"zh":"水潤的黃色高草叢","es":"Hierba Amarilla Hidratada"},
  "54": {"zh":"沼澤高草叢","es":"Hierba Alta Pantanosa"},
  "55": {"zh":"雜草叢生的自動販賣機","es":"Máquina Expendedora Entre Hierbas"},
  // Batch 03
  "56": {"zh":"微風花圃","es":"Macizo de flores con brisa"},
  "57": {"zh":"熱帶風情","es":"Vibras tropicales"},
  "58": {"zh":"強風花圃","es":"Macizo de flores ventoso"},
  "59": {"zh":"陰涼海灘","es":"Playa sombreada"},
  "60": {"zh":"熱帶海濱","es":"Costa tropical"},
  "61": {"zh":"休息小角落","es":"Rincón de descanso"},
  "62": {"zh":"永遠的亂糟糟","es":"Desorden eterno"},
  "63": {"zh":"垃圾收集站","es":"Sitio de recogida de basura"},
  "64": {"zh":"垃圾桶中心","es":"Central de basureros"},
  "65": {"zh":"垃圾處理場","es":"Sitio de desecho de basura"},
  "66": {"zh":"公園長椅","es":"Banca del parque"},
  "67": {"zh":"誘人餐廳","es":"Restaurante delicioso"},
  "68": {"zh":"桌邊送餐車","es":"Carrito de servicio"},
  "69": {"zh":"啾啾大餐","es":"Comida pio pio"},
  "70": {"zh":"咖啡空間","es":"Espacio café"},
  "71": {"zh":"海邊組合","es":"Set de playa"},
  "72": {"zh":"發光舞台","es":"Escenario brillante"},
  "73": {"zh":"店內驚喜","es":"Sorpresa en la tienda"},
  "74": {"zh":"夜祭會場","es":"Lugar del festival nocturno"},
  "75": {"zh":"更衣區","es":"Área de vestidores"},
  "76": {"zh":"私人化妝台","es":"Tocador privado"},
  "77": {"zh":"編織站","es":"Estación de tejido"},
  "78": {"zh":"溫泉淋浴間","es":"Ducha de aguas termales"},
  "79": {"zh":"渡假村餐點準備區","es":"Prep de comidas del resort"},
  "80": {"zh":"全部打包好","es":"Todo empacado"},
  // Batch 04
  "81": {"zh":"完全回復","es":"Curación Total"},
  "82": {"zh":"鬧鐘睡眠區","es":"Zona de Sueño con Alarma"},
  "83": {"zh":"販賣機休息區","es":"Área de Descanso de Máquinas"},
  "84": {"zh":"販賣機組","es":"Set de Máquinas"},
  "85": {"zh":"小遊戲角落","es":"Rincón de Minijuegos"},
  "87": {"zh":"熔爐區","es":"Lugar del Horno"},
  "89": {"zh":"陰森書房","es":"Estudio Misterioso"},
  "90": {"zh":"海盜扮演中","es":"Jugando a los Piratas"},
  "91": {"zh":"收銀台工作中","es":"Trabajando en la Caja"},
  "92": {"zh":"小畫室","es":"Taller Pequeñito"},
  "94": {"zh":"皮卡丘空間","es":"Espacio de Pikachu"},
  "95": {"zh":"可愛大爆發","es":"Súper Ternura"},
  "96": {"zh":"歡迎渡假村","es":"Resort Bienvenida"},
  "97": {"zh":"平凡生活","es":"Vida Sencilla"},
  "98": {"zh":"紅色高草叢","es":"Hierba Alta Roja"},
  "99": {"zh":"樹蔭紅色高草叢","es":"Hierba Roja bajo Sombra"},
  "100": {"zh":"尖頂樹蔭岩石高草叢","es":"Hierba Roca bajo Árboles"},
  "101": {"zh":"濕潤紅色高草叢","es":"Hierba Roja Húmeda"},
  "102": {"zh":"高地紅色高草叢","es":"Hierba Roja Elevada"},
  "103": {"zh":"草地訓練場","es":"Campo de Entrenamiento"},
  "104": {"zh":"優雅花壇","es":"Cantero Elegante"},
  "105": {"zh":"樹蔭優雅花壇","es":"Cantero bajo la Sombra"},
  "106": {"zh":"濕潤優雅花壇","es":"Cantero Húmedo"},
  "107": {"zh":"花園樹樁舞台","es":"Escenario de Troncos"},
  "108": {"zh":"土壤耕作","es":"Trabajando la Tierra"},
  // Batch 05
  "109": {"zh":"開心水草","es":"Lentejuela Alegre"},
  "110": {"zh":"青苔休息區","es":"Rincón de Musgo"},
  "111": {"zh":"青苔大石頭","es":"Roca Musgosa"},
  "112": {"zh":"青苔溫泉","es":"Aguas Termales Musgosas"},
  "113": {"zh":"露天浴池","es":"Baño al Aire Libre"},
  "114": {"zh":"和諧溫泉","es":"Aguas Termales Armónicas"},
  "115": {"zh":"滾燙岩漿","es":"Lava Muy Caliente"},
  "116": {"zh":"挖掘與燃燒","es":"Excavar y Quemar"},
  "117": {"zh":"叮噹鐵工廠","es":"Construcción de Hierro"},
  "118": {"zh":"怪怪白石頭","es":"Rocas Blancas Misteriosas"},
  "119": {"zh":"零食容器","es":"Contenedor de Bocadillos"},
  "120": {"zh":"餐桌驚喜","es":"Sorpresa en la Mesa"},
  "121": {"zh":"最棒麵包店","es":"La Mejor Panadería"},
  "122": {"zh":"迷你小廚房","es":"Cocina Miniatura"},
  "123": {"zh":"居家派對","es":"Fiesta en Casa"},
  "124": {"zh":"懶洋洋相簿","es":"Álbum de Fotos Perezoso"},
  "125": {"zh":"啁啾音樂會","es":"Recital de Pajaritos"},
  "127": {"zh":"節奏小盒子","es":"Caja al Ritmo"},
  "128": {"zh":"音樂與雜誌","es":"Música y Revistas"},
  "129": {"zh":"迷你博物館","es":"Museo Miniatura"},
  "130": {"zh":"清爽更衣室","es":"Vestidor Refrescante"},
  "131": {"zh":"青銅地標","es":"Monumento de Bronce"},
  "132": {"zh":"鐵路平交道","es":"Cruce de Ferrocarril"},
  "133": {"zh":"大廚廚房","es":"Cocina del Chef"},
  "134": {"zh":"超級豪華區","es":"Lujo Absoluto"},
  "135": {"zh":"沉重之鐵","es":"Hierro Pesado"},
  // Batch 06
  "136": {"zh":"現代起居室","es":"Sala Moderna"},
  "137": {"zh":"粉紅高草叢","es":"Hierba Rosa Alta"},
  "138": {"zh":"樹蔭粉紅高草叢","es":"Hierba Rosa bajo la Sombra"},
  "139": {"zh":"濕潤粉紅高草叢","es":"Hierba Rosa Húmeda"},
  "140": {"zh":"高地粉紅高草叢","es":"Hierba Rosa Elevada"},
  "141": {"zh":"水泥管秘密基地","es":"Base Secreta del Tubo"},
  "142": {"zh":"蓬鬆花壇","es":"Cantero Esponjoso"},
  "143": {"zh":"樹蔭蓬鬆花壇","es":"Cantero bajo la Sombra"},
  "144": {"zh":"濕潤蓬鬆花壇","es":"Cantero Húmedo"},
  "145": {"zh":"水邊小船","es":"Bote junto al Agua"},
  "146": {"zh":"發光瀑布","es":"Cascada Brillante"},
  "147": {"zh":"鳥鳴花園","es":"Jardín de Pajaritos"},
  "148": {"zh":"簡單浴室","es":"Baño Sencillo"},
  "149": {"zh":"單車休息站","es":"Parada de Bicicletas"},
  "150": {"zh":"壁爐小睡處","es":"Siesta junto a la Chimenea"},
  "151": {"zh":"湧動的精神之力","es":"Poder Psíquico Fuerte"},
  "152": {"zh":"占卜師的桌子","es":"Mesa del Adivino"},
  "153": {"zh":"垃圾場電視","es":"Tele del Basurero"},
  "154": {"zh":"巨大垃圾堆場","es":"Gran Montón de Basura"},
  "155": {"zh":"審問桌","es":"Mesa de Interrogatorio"},
  "156": {"zh":"下水道孔檢查","es":"Inspección de Alcantarilla"},
  "157": {"zh":"潔淨洗滌站","es":"Estación de Lavado"},
  "158": {"zh":"家庭劇院","es":"Cine en Casa"},
  "159": {"zh":"學習區","es":"Área de Estudio"},
  "160": {"zh":"律動客廳","es":"Sala Rítmica"},
  // Batch 07
  "161": {"zh":"乾乾淨淨","es":"Súper Limpio"},
  "162": {"zh":"保濕化妝台","es":"Mesa de Maquillaje"},
  "163": {"zh":"迷你圖書館","es":"Mini Biblioteca"},
  "164": {"zh":"遊戲區對戰場","es":"Zona de Batalla de Juegos"},
  "165": {"zh":"遊樂園","es":"Parque de Diversiones"},
  "166": {"zh":"工作書桌","es":"Escritorio de Trabajo"},
  "167": {"zh":"辦公室儲藏室","es":"Bodega de la Oficina"},
  "168": {"zh":"實驗空間","es":"Espacio de Experimentos"},
  "169": {"zh":"教授實習計畫","es":"Programa de Aprendices"},
  "170": {"zh":"研究員書桌","es":"Escritorio del Investigador"},
  "171": {"zh":"公共閱讀區","es":"Lectura Pública"},
  "172": {"zh":"心跳加速驚喜盒","es":"Caja de Sorpresas"},
  "173": {"zh":"惡作劇按鈕","es":"Botón de Bromas"},
  "174": {"zh":"風景優美拍照板","es":"Tablero de Fotos Lindas"},
  "175": {"zh":"輪胎公園","es":"Parque de Llantas"},
  "176": {"zh":"自然市集","es":"Mercado Natural"},
  "177": {"zh":"工地發電機","es":"Generador de Construcción"},
  "178": {"zh":"道場訓練","es":"Entrenamiento de Dojo"},
  "179": {"zh":"反派組織總部","es":"Sede de los Villanos"},
  "180": {"zh":"九道之火","es":"Nueve Llamas"},
  "181": {"zh":"絨毛玩具中心","es":"Centro de Peluches"},
  "182": {"zh":"玩家天堂","es":"Paraíso de los Gamers"},
  "183": {"zh":"頂級流行","es":"Súper Popular"},
  "184": {"zh":"釣魚池","es":"Estanque de Pesca"},
  "185": {"zh":"海洋釣魚點","es":"Lugar de Pesca en el Mar"},
  // Batch 08
  "186": {"zh":"沼澤釣魚點","es":"Lugar de pesca en el pantano"},
  "187": {"zh":"溫泉釣魚點","es":"Lugar de pesca en aguas termales"},
  "188": {"zh":"岩漿釣魚點","es":"Lugar de pesca en magma"},
  "191": {"zh":"邪惡騎士神殿","es":"Santuario de los Caballeros Malvados"},
  "192": {"zh":"吉祥騎士神殿","es":"Santuario de los Caballeros Afortunados"},
  "193": {"zh":"翼龍化石展示區","es":"Exhibición de fósiles de ala"},
  "194": {"zh":"骷髏化石展示區","es":"Exhibición de fósiles de cráneo"},
  "195": {"zh":"頭槌化石展示區","es":"Exhibición de fósiles de cabezazo"},
  "196": {"zh":"盔甲化石展示區","es":"Exhibición de fósiles de armadura"},
  "197": {"zh":"盾牌化石展示區","es":"Exhibición de fósiles de escudo"},
  "198": {"zh":"下顎化石展示區","es":"Exhibición de fósiles de mandíbula"},
  "199": {"zh":"暴君化石展示區","es":"Exhibición de fósiles del déspota"},
  "200": {"zh":"帆鰭化石展示區","es":"Exhibición de fósiles de vela"},
  "201": {"zh":"凍原化石展示區","es":"Exhibición de fósiles de tundra"},
  "202": {"zh":"無邊藍色飲料","es":"Bebida azul infinita"},
  "203": {"zh":"電擊馬鈴薯","es":"Papas eléctricas"},
  "204": {"zh":"火辣辛香料","es":"Especias muy picantes"},
  "205": {"zh":"優雅午後點心","es":"Dulces elegantes de día"},
  "206": {"zh":"黑巧克力餅乾","es":"Galletas de chocolate amargo"},
  "207": {"zh":"綠葉蔬菜三明治","es":"Sándwich de hojas verdes"},
  "208": {"zh":"冰涼刨冰","es":"Hielo raspado muy frío"},
  "209": {"zh":"可愛緞帶蛋糕","es":"Pastel de listón lindo"}
};

// Apply translations
let applied = 0;
for (const [id, trans] of Object.entries(translations)) {
  if (data[id]) {
    if (!data[id].name) data[id].name = {};
    data[id].name.zh = trans.zh;
    data[id].name.es = trans.es;
    applied++;
  } else {
    console.log('WARNING: id ' + id + ' not found in habitat-data.json');
  }
}

fs.writeFileSync(habitatPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Applied ' + applied + ' translations to habitat-data.json');

// Verify completeness
const ids = Object.keys(data);
let missing = 0;
ids.forEach(id => {
  const name = data[id].name || {};
  if (!name.zh || !name.es) {
    console.log('  MISSING: #' + String(id).padStart(3,'0') + ' zh=' + !!name.zh + ' es=' + !!name.es);
    missing++;
  }
});
console.log('Total habitats: ' + ids.length);
console.log('Complete (zh+es): ' + (ids.length - missing));
console.log('Still missing: ' + missing);
