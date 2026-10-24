import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class V815ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        self.css = (ROOT / 'site/assets/v815-release.css').read_text(encoding='utf-8')
        self.runtime = (ROOT / 'site/assets/v815-release.js').read_text(encoding='utf-8')
        self.base_css = (ROOT / 'site/assets/index-BCMgbAyj.css').read_text(encoding='utf-8')

    def test_version_and_save_format(self):
        self.assertIn('var x_=`8.1.11`', self.bundle)
        self.assertIn('saveVersion:30,gameVersion:x_', self.bundle)
        self.assertIn('talents:L,background:he', self.bundle)
        self.assertNotIn('talent:L,background:he', self.bundle)
        self.assertIn('function BC815Migrate', self.bundle)
        self.assertIn('mapView:Ue,activeTab:Ge', self.bundle)
        self.assertIn('o.activeTab', self.bundle)
        self.assertIn('o.mapView', self.bundle)

    def test_multi_talent_rules_are_integrated(self):
        self.assertIn('function BC815NormalizeTalents', self.bundle)
        self.assertIn('function BC815ToggleTalent', self.bundle)
        self.assertIn('function BC815TalentGroup', self.bundle)
        self.assertIn('e.length>=4', self.bundle)
        self.assertIn('L.includes(`True Love`)', self.bundle)
        self.assertIn('BC815Bonuses(L).meditation', self.bundle)
        self.assertIn('BC815Bonuses(L).manualMastery', self.bundle)
        self.assertIn('BC815Bonuses(L).breakthroughChance', self.bundle)

    def test_inventory_hydration_uses_canonical_art(self):
        self.assertIn('BC815Catalog=new Map(Gv.map', self.bundle)
        self.assertIn('function BC815HydrateItem', self.bundle)
        self.assertIn('.map(BC815HydrateItem)', self.bundle)
        self.assertIn('bcArts=[...new Set([e.art,bcCanonical].filter(Boolean))]', self.bundle)
        self.assertIn('onError:()=>bcSetIndex(e=>e+1)', self.bundle)
        self.assertIn('window.location.pathname.startsWith(`/Boundless-Cultivation`)', self.bundle)
        for marker in ['Ug=Hg(`herb`', 'Wg=Hg(`metal`', 'Kg=Hg(`portal`']: self.assertIn(marker, self.bundle)

    def test_canonical_inventory_atlas_exists(self):
        atlas = ROOT / 'site/game-assets/items/item-atlas-v1.webp'
        self.assertTrue(atlas.is_file(), atlas)
        self.assertGreater(atlas.stat().st_size, 5000)
        self.assertIn(atlas.read_bytes()[:4], (b'RIFF', b'\xff\xd8\xff\xe0'))
        self.assertIn('/game-assets/items/item-atlas-v1.webp', self.bundle)
        self.assertIn('BC815Catalog=new Map(Gv.map', self.bundle)

    def test_18_29_portrait_exclusions(self):
        self.assertIn('BC815BlockedCivilian1829=new Set([8,12,14,16,20,23,28,32,40,42,44,50,51,56,62,65,59,71,74,93,97,99,41,45])', self.bundle)
        self.assertIn('BC815BlockedSect1829=new Set([1,2,3,4,8,9,12,13])', self.bundle)
        self.assertIn('Zy(e)!==`18–29`||n===0', self.bundle)
        self.assertIn('label:`Wajah Sekte ${e.index+1}`', self.bundle)
    def test_portrait_paper_and_width_rules(self):
        self.assertIn('Kertas Pemilihan Muka', self.runtime)
        self.assertIn('Pilih Muka Pemain', self.runtime)
        self.assertIn('Pilih Muka Pasangan', self.runtime)
        self.assertIn('grid-template-columns:repeat(6,minmax(0,1fr))', self.css)
        self.assertIn('repeat(4,minmax(0,1fr))', self.css)
        self.assertIn('repeat(2,minmax(0,1fr))', self.css)
        self.assertIn('min-width:0', self.css)
        self.assertNotIn('body{overflow-x:hidden', self.css)
        self.assertNotIn('.true-love-creation>div{align-items:center;gap:11px;display:flex}', self.base_css)

    def test_builtin_music_asset(self):
        music = (ROOT / 'site/assets/v815-music.js').read_text(encoding='utf-8')
        asset = ROOT / 'site/assets/music/ni-tian-xing-loop.ogg'
        self.assertTrue(asset.is_file())
        self.assertGreater(asset.stat().st_size, 5000)
        self.assertIn('Ni Tian Xing (逆天行)', music)
        self.assertIn('BC_BUILTIN_URL', music)
        self.assertIn('source:"builtin"', music)

if __name__ == '__main__':
    unittest.main()
