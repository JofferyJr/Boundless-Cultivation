import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class BrandingTests(unittest.TestCase):
    def test_player_facing_brand_is_boundless_cultivation(self):
        html = (ROOT / "site/index.html").read_text(encoding="utf-8")
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("<title>Boundless Cultivation: Dunia Xianxia</title>", html)
        self.assertIn(">Boundless Cultivation</p>", html)
        self.assertIn("Peta Dunia Boundless Cultivation", bundle)
        self.assertIn("Almanak Boundless Cultivation", bundle)

    def test_runtime_scripts_are_single_and_boundless(self):
        html = (ROOT / "site/index.html").read_text(encoding="utf-8")
        self.assertEqual(html.count("/Cultivation/assets/v815-music.js"), 1)
        self.assertIn("/Cultivation/assets/v817-cultivation-world.js?v=8.1.13-expert", html)
        self.assertIn("/Cultivation/assets/v818-settings-slot-bridge.js?v=8.1.13-expert", html)
        self.assertIn("/Cultivation/assets/v815-save-manager.js?v=8.1.13-expert", html)
        self.assertIn("/Cultivation/assets/v815-release.js?v=8.1.13-expert", html)
        self.assertNotIn("/Cultivation/assets/v816-ai-world.js", html)

    def test_internal_save_key_remains_compatible(self):
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("boundless-save", bundle)

    def test_lore_dao_path_label_is_not_renamed(self):
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("Profesion, laluan kultivasi dan sifat penerima", bundle)

if __name__ == "__main__":
    unittest.main()
