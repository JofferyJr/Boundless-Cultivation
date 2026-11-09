/* Boundless Spirit Beast Catalogue v1
 * Canonical data extracted without changing the existing 37-species catalogue.
 * UI and runtime behaviour remain in the legacy scripts until the adapter migration is tested.
 */
(function (root) {
  "use strict";
  const host = root.BoundlessModules || (root.BoundlessModules = {});
  const TIERS = ["Fana", "Spiritual", "Bumi", "Purba", "Diraja", "Suci", "Ilahi", "Primordial", "Asal Dao"];
  const REGIONS = [
    "Puncak Xuefeng", "Gunung Tianbing", "Dataran Beiming", "Pulau Gunung Bingyao", "Pulau Xuanshuang",
    "Banjaran Xuanbing", "Pergunungan Celestial Spine", "Pergunungan Terapung Yunxiao", "Tundra Hanshui",
    "Pulau Qingshuang", "Pulau Jinlei", "Pulau Gunung Hanluo", "Hutan Muyun", "Dataran Tinggi Xuanyun",
    "Gunung Heiyan", "Gurun Jinsha", "Pulau Qingzhu", "Lembah Tasik Qinghe", "Lembah Huoyun",
    "Dataran Longyuan", "Pulau Tianluo", "Teluk Canghai", "Ngarai Chiyan", "Lembah Bunga Bulan",
    "Oasis Luoshui", "Pulau Chijiao", "Lembah Sungai Qingluo", "Delta Lingshui", "Kepulauan Fengya",
    "Dataran Nanlin", "Lembah Yunhe", "Pesisir Canghai", "Kepulauan Shigu", "Pulau Chisha",
    "Hutan Lingshu", "Kepulauan Mutiara", "Kepulauan Yuelan", "Kepulauan Canglan", "Kepulauan Yunmu",
    "Pulau Lingkong", "Portal Dunia Laut"
  ];
  const BEASTS = [
    {id:1,name:"Azure Wind Wolf",tier:"Spiritual",rarity:"Tidak biasa",element:"Angin",habitat:["Pergunungan Terapung Yunxiao","Lembah Yunhe","Dataran Tinggi Xuanyun"]},
    {id:2,name:"Flamehorn Deer",tier:"Fana",rarity:"Biasa",element:"Api",habitat:["Lembah Huoyun","Gunung Heiyan"]},
    {id:3,name:"Moonlight Rabbit",tier:"Fana",rarity:"Biasa",element:"Bulan",habitat:["Lembah Bunga Bulan","Kepulauan Yuelan"]},
    {id:4,name:"Thunderclaw Leopard",tier:"Bumi",rarity:"Langka",element:"Kilat",habitat:["Pulau Jinlei","Gunung Tianbing"]},
    {id:5,name:"Ironback Turtle",tier:"Fana",rarity:"Biasa",element:"Tanah",habitat:["Teluk Canghai","Pulau Chijiao","Kepulauan Shigu"]},
    {id:6,name:"Jade Feather Crane",tier:"Spiritual",rarity:"Tidak biasa",element:"Angin",habitat:["Pergunungan Terapung Yunxiao","Pulau Lingkong","Kepulauan Yunmu"]},
    {id:7,name:"Cloudstep Tiger",tier:"Bumi",rarity:"Langka",element:"Angin",habitat:["Pergunungan Celestial Spine","Pergunungan Terapung Yunxiao"]},
    {id:8,name:"Frostfang Wolf",tier:"Spiritual",rarity:"Tidak biasa",element:"Ais",habitat:["Puncak Xuefeng","Tundra Hanshui","Dataran Beiming","Pulau Qingshuang"]},
    {id:9,name:"Spiritfire Fox",tier:"Spiritual",rarity:"Langka",element:"Api / Roh",habitat:["Hutan Muyun","Hutan Lingshu"]},
    {id:10,name:"Bluewater Serpent",tier:"Spiritual",rarity:"Tidak biasa",element:"Air",habitat:["Lembah Tasik Qinghe","Lembah Sungai Qingluo","Oasis Luoshui","Kepulauan Mutiara"]},
    {id:11,name:"Golden Ant King",tier:"Fana",rarity:"Tidak biasa",element:"Tanah",habitat:["Gurun Jinsha","Ngarai Chiyan"]},
    {id:12,name:"White Jade Lion",tier:"Bumi",rarity:"Langka",element:"Cahaya / Logam",habitat:["Banjaran Xuanbing","Pergunungan Celestial Spine","Pulau Gunung Hanluo"]},
    {id:13,name:"Purple Lightning Eagle",tier:"Bumi",rarity:"Langka",element:"Kilat",habitat:["Pulau Jinlei","Gunung Tianbing"]},
    {id:14,name:"Green Scale Python",tier:"Fana",rarity:"Biasa",element:"Kayu",habitat:["Hutan Muyun","Dataran Nanlin","Pulau Qingzhu"]},
    {id:15,name:"Red Flame Crow",tier:"Fana",rarity:"Biasa",element:"Api",habitat:["Gunung Heiyan","Lembah Huoyun"]},
    {id:16,name:"Heaven Devouring Dragon",tier:"Primordial",rarity:"Mitos",element:"Kekacauan",habitat:["Portal Dunia Laut","Pergunungan Celestial Spine"]},
    {id:17,name:"Nine-Tailed Heavenly Fox",tier:"Suci",rarity:"Mitos",element:"Ilusi / Yin",habitat:["Hutan Lingshu","Hutan Muyun"]},
    {id:18,name:"Golden Winged Roc",tier:"Suci",rarity:"Mitos",element:"Angin / Ruang",habitat:["Pulau Lingkong","Pergunungan Terapung Yunxiao","Kepulauan Fengya"]},
    {id:19,name:"Heavenly Phoenix",tier:"Suci",rarity:"Mitos",element:"Api / Kelahiran Semula",habitat:["Gunung Heiyan","Lembah Huoyun"]},
    {id:20,name:"Ancient Qilin",tier:"Suci",rarity:"Mitos",element:"Tanah / Nasib",habitat:["Dataran Longyuan","Hutan Lingshu"]},
    {id:21,name:"Black Tortoise",tier:"Suci",rarity:"Mitos",element:"Air / Pertahanan",habitat:["Teluk Canghai","Portal Dunia Laut"]},
    {id:22,name:"White Tiger Emperor",tier:"Diraja",rarity:"Mitos",element:"Logam / Tempur",habitat:["Pergunungan Celestial Spine","Banjaran Xuanbing"]},
    {id:23,name:"Azure Dragon",tier:"Suci",rarity:"Mitos",element:"Kayu / Kehidupan",habitat:["Hutan Lingshu","Lembah Sungai Qingluo","Pulau Tianluo"]},
    {id:24,name:"Netherworld Black Phoenix",tier:"Ilahi",rarity:"Mitos",element:"Kegelapan",habitat:["Pulau Chisha","Portal Dunia Laut"]},
    {id:25,name:"Void Devouring Beast",tier:"Primordial",rarity:"Mitos",element:"Ruang",habitat:["Portal Dunia Laut","Pulau Lingkong"]},
    {id:26,name:"Blood Moon Wolf",tier:"Purba",rarity:"Sangat langka",element:"Darah / Bulan",habitat:["Kepulauan Yuelan","Hutan Lingshu"]},
    {id:27,name:"Nine-Headed Serpent Emperor",tier:"Diraja",rarity:"Mitos",element:"Racun",habitat:["Delta Lingshui","Lembah Sungai Qingluo"]},
    {id:28,name:"Heavenly Thunder Lion",tier:"Diraja",rarity:"Sangat langka",element:"Kilat",habitat:["Gunung Tianbing","Pulau Jinlei"]},
    {id:29,name:"Star Devouring Whale",tier:"Ilahi",rarity:"Mitos",element:"Bintang / Ruang",habitat:["Portal Dunia Laut","Kepulauan Canglan"]},
    {id:30,name:"Primordial Kun",tier:"Primordial",rarity:"Mitos",element:"Air / Kekacauan",habitat:["Portal Dunia Laut","Pesisir Canghai"]},
    {id:31,name:"Hellfire Ape",tier:"Purba",rarity:"Sangat langka",element:"Api / Kekuatan",habitat:["Gunung Heiyan","Ngarai Chiyan"]},
    {id:32,name:"Dream Eater",tier:"Ilahi",rarity:"Mitos",element:"Mimpi / Jiwa",habitat:["Lembah Bunga Bulan","Kepulauan Yuelan"]},
    {id:33,name:"Mountain Shaking Bear",tier:"Purba",rarity:"Langka",element:"Tanah / Kekuatan",habitat:["Puncak Xuefeng","Pergunungan Celestial Spine"]},
    {id:34,name:"Heavenly Jade Snake",tier:"Purba",rarity:"Sangat langka",element:"Ais / Racun",habitat:["Banjaran Xuanbing","Pulau Xuanshuang","Pulau Gunung Bingyao"]},
    {id:35,name:"Golden Blood War Ape",tier:"Diraja",rarity:"Sangat langka",element:"Darah / Pertempuran",habitat:["Ngarai Chiyan","Pergunungan Celestial Spine"]},
    {id:36,name:"Serpent Aquarion",tier:"Bumi",rarity:"Evolusi",element:"Air",habitat:["Lembah Tasik Qinghe","Lembah Sungai Qingluo","Oasis Luoshui","Kepulauan Mutiara"],evolution:{from:"Bluewater Serpent",stage:"Evolusi pertama",optional:true}},
    {id:37,name:"Azure Tide Serpent",tier:"Purba",rarity:"Evolusi",element:"Air",habitat:["Lembah Tasik Qinghe","Lembah Sungai Qingluo","Oasis Luoshui","Kepulauan Mutiara"],evolution:{from:"Serpent Aquarion",stage:"Evolusi kedua · bentuk akhir laluan",optional:true}}
  ];
  const byId = new Map(BEASTS.map(beast => [beast.id, beast]));
  const byName = new Map(BEASTS.map(beast => [beast.name.toLocaleLowerCase(), beast]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const api = Object.freeze({
    version: "1.0.0",
    speciesCount: BEASTS.length,
    tiers: () => [...TIERS],
    regions: () => [...REGIONS],
    list: () => clone(BEASTS),
    get: key => {
      const beast = typeof key === "number" ? byId.get(key) : byName.get(String(key || "").toLocaleLowerCase());
      return beast ? clone(beast) : null;
    },
    atRegion: region => {
      const name = String(region || "").normalize("NFKC").trim().toLocaleLowerCase();
      return clone(BEASTS.filter(beast => beast.habitat.some(item => item.normalize("NFKC").toLocaleLowerCase() === name)));
    },
    validate: () => {
      const errors = [];
      if (BEASTS.length !== 37) errors.push("Expected 37 official species; found " + BEASTS.length);
      if (new Set(BEASTS.map(beast => beast.id)).size !== BEASTS.length) errors.push("Duplicate species IDs");
      if (new Set(BEASTS.map(beast => beast.name)).size !== BEASTS.length) errors.push("Duplicate species names");
      for (const beast of BEASTS) {
        if (!TIERS.includes(beast.tier)) errors.push("Unknown tier for " + beast.name);
        for (const habitat of beast.habitat) if (!REGIONS.includes(habitat)) errors.push("Unknown habitat " + habitat + " for " + beast.name);
      }
      return { valid: errors.length === 0, speciesCount: BEASTS.length, regionCount: REGIONS.length, errors };
    }
  });
  host.spiritBeasts = host.spiritBeasts || {};
  host.spiritBeasts.catalogue = api;
  root.BoundlessSpiritBeastCatalogue = api;
})(window);
