import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class MapSlotSwapTests(unittest.TestCase):
    def test_qinghe_and_yunmu_slot_swap_is_slug_based(self):
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("if(e.slug===`lembah_tasik_qinghe`){n[3]", bundle)
        self.assertIn("name:`Tebing Roh`", bundle)
        self.assertIn("if(e.slug===`kepulauan_yunmu`){n[6]", bundle)
        self.assertIn("name:`Mystic Water Peacock`", bundle)

    def test_primary_arrival_slot_remains_slot_five(self):
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("i(4,{id:o.id", bundle)
        self.assertNotIn("if(e.slug===`lembah_tasik_qinghe`){n[4]", bundle)
        self.assertNotIn("if(e.slug===`kepulauan_yunmu`){n[4]", bundle)

if __name__ == "__main__":
    unittest.main()
