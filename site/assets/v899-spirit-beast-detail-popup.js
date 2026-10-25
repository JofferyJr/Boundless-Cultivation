/* Boundless v8.9.9 — Spirit Beast species detail popup.
 * Opens from a catalogue card; shows canonical info and the four life stages.
 * Missing art is presented as a clear placeholder until the sprite is added.
 */
(() => {
  "use strict";
  if (window.__BC_SPIRIT_BEAST_DETAIL_POPUP_V899__) return;
  window.__BC_SPIRIT_BEAST_DETAIL_POPUP_V899__ = true;

  const ROOT = "/Boundless-Cultivation/game-assets/beasts/";
  const STAGES = [
    { key: "egg", label: "Telur" },
    { key: "baby", label: "Bayi" },
    { key: "adolescent", label: "Remaja" },
    { key: "adult", label: "Dewasa" }
  ];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const slugify = name => String(name || "").toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let activeBeast = null;
  let lastFocus = null;

  function addStyle() {
    if (document.getElementById("bc-spirit-beast-detail-v899-style")) return;
    const style = document.createElement("style");
    style.id = "bc-spirit-beast-detail-v899-style";
    style.textContent = `
      .sbt-card{cursor:pointer;transition:border-color .16s ease,transform .16s ease}
      .sbt-card:hover,.sbt-card:focus-visible{border-color:#c6a95e!important;transform:translateY(-2px);outline:none}
      .sbt-card:focus-visible{box-shadow:0 0 0 2px #c6a95e66}
      #bc-sbt-detail-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,7,5,.82);backdrop-filter:blur(5px)}
      #bc-sbt-detail-overlay[hidden]{display:none}
      #bc-sbt-detail-card{position:relative;box-sizing:border-box;width:min(920px,100%);max-height:min(90vh,900px);overflow:auto;color:#eee5d1;background:linear-gradient(145deg,#14251a,#09120e 70%);border:1px solid #806c3b;border-radius:18px;box-shadow:0 24px 80px #000b;padding:clamp(18px,3vw,30px)}
      #bc-sbt-detail-card *{box-sizing:border-box}
      #bc-sbt-detail-card .bc-sbt-close{position:sticky;top:0;float:right;z-index:2;width:42px;height:42px;border-radius:50%;border:1px solid #806c3b;background:#1a2b20;color:#f4e5bd;font-size:25px;line-height:1;cursor:pointer}
      #bc-sbt-detail-card .bc-sbt-close:hover{background:#c6a95e;color:#10170f}
      #bc-sbt-detail-card .bc-sbt-kicker{color:#c6a95e;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase}
      #bc-sbt-detail-card h2{font:clamp(1.45rem,3vw,2.2rem) Georgia,serif;color:#f5e8c8;margin:7px 48px 8px 0}
      #bc-sbt-detail-card .bc-sbt-summary{color:#b5c4b5;line-height:1.65;margin:0 0 18px}
      #bc-sbt-detail-card .bc-sbt-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:18px 0}
      #bc-sbt-detail-card .bc-sbt-fact{padding:11px 12px;border:1px solid #2c4736;border-radius:10px;background:#0a1710;min-width:0}
      #bc-sbt-detail-card .bc-sbt-fact small{display:block;color:#92a895;font-size:.72rem;margin-bottom:5px}
      #bc-sbt-detail-card .bc-sbt-fact strong{display:block;color:#e8d6a7;font-size:.9rem;overflow-wrap:anywhere}
      #bc-sbt-detail-card .bc-sbt-habitat{padding:13px 14px;border-left:3px solid #b99b51;background:#101d14;border-radius:0 9px 9px 0;color:#c6d0c4;line-height:1.6}
      #bc-sbt-detail-card h3{font:1.1rem Georgia,serif;color:#e8d6a7;margin:22px 0 10px}
      #bc-sbt-detail-card .bc-sbt-stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      #bc-sbt-detail-card .bc-sbt-stage{min-width:0;overflow:hidden;border:1px solid #2c4736;border-radius:12px;background:#0a150f}
      #bc-sbt-detail-card .bc-sbt-stage img{display:block;width:100%;height:clamp(115px,18vw,190px);object-fit:contain;padding:8px;background:radial-gradient(ellipse at center,#213b2a,#0a150f 72%)}
      #bc-sbt-detail-card .bc-sbt-stage figcaption{text-align:center;padding:10px 5px;color:#e0d3b0;font-size:.85rem;border-top:1px solid #20392a}
      #bc-sbt-detail-card .bc-sbt-missing{height:clamp(115px,18vw,190px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px;text-align:center;color:#8fa28f;background:radial-gradient(ellipse at center,#1b3022,#0a150f 72%);font-size:.8rem}
      #bc-sbt-detail-card .bc-sbt-missing span{font-size:1.7rem;color:#c6a95e}
      @media(max-width:600px){
        #bc-sbt-detail-overlay{padding:8px;align-items:flex-end}
        #bc-sbt-detail-card{max-height:94vh;border-radius:16px;padding:16px}
        #bc-sbt-detail-card .bc-sbt-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
        #bc-sbt-detail-card .bc-sbt-stages{grid-template-columns:repeat(2,minmax(0,1fr))}
        #bc-sbt-detail-card .bc-sbt-stage img,#bc-sbt-detail-card .bc-sbt-missing{height:135px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    let overlay = document.getElementById("bc-sbt-detail-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "bc-sbt-detail-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section id="bc-sbt-detail-card" role="dialog" aria-modal="true" aria-labelledby="bc-sbt-detail-title" tabindex="-1">
        <button type="button" class="bc-sbt-close" aria-label="Tutup maklumat haiwan" title="Tutup">×</button>
        <div class="bc-sbt-kicker" data-kicker>Bestiari Haiwan Roh</div>
        <h2 id="bc-sbt-detail-title" data-title></h2>
        <p class="bc-sbt-summary" data-summary></p>
        <div class="bc-sbt-facts" data-facts></div>
        <div class="bc-sbt-habitat" data-habitat></div>
        <h3>Perkembangan Hayat · Telur hingga Dewasa</h3>
        <div class="bc-sbt-stages" data-stages></div>
      </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".bc-sbt-close").addEventListener("click", closePopup);
    overlay.addEventListener("click", event => { if (event.target === overlay) closePopup(); });
    overlay.querySelector("#bc-sbt-detail-card").addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      const close = overlay.querySelector(".bc-sbt-close");
      if (event.shiftKey && document.activeElement === close) {
        event.preventDefault();
        overlay.querySelector("#bc-sbt-detail-card").focus();
      }
    });
    return overlay;
  }

  function showMissing(stage) {
    return '<div class="bc-sbt-missing"><span aria-hidden="true">✧</span><strong>' +
      esc(stage.label) + '</strong><small>Imej belum tersedia</small></div>';
  }

  function openPopup(beast) {
    if (!beast) return;
    const overlay = ensureOverlay();
    lastFocus = document.activeElement;
    activeBeast = beast;
    const card = overlay.querySelector("#bc-sbt-detail-card");
    overlay.querySelector("[data-kicker]").textContent =
      "Spesies " + String(beast.id).padStart(2, "0") + " · Tingkatan asal " + beast.tier;
    overlay.querySelector("[data-title]").textContent = beast.name;
    overlay.querySelector("[data-summary]").textContent =
      "Maklumat rasmi spesies ini. Tingkatan asal tidak berubah; kelangkaan ialah sifat berasingan dan individu boleh berkembang melalui evolusi.";
    const facts = [
      ["Tingkatan asal", beast.tier],
      ["Kelangkaan", beast.rarity],
      ["Elemen", beast.element]
    ];
    overlay.querySelector("[data-facts]").innerHTML = facts.map(([label,value]) =>
      '<div class="bc-sbt-fact"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong></div>'
    ).join("");
    overlay.querySelector("[data-habitat]").innerHTML =
      "<strong>Habitat:</strong> " + (beast.habitat || []).map(esc).join(" · ");
    const slug = slugify(beast.name);
    overlay.querySelector("[data-stages]").innerHTML = STAGES.map(stage => {
      const src = ROOT + slug + "/" + stage.key + ".webp";
      return '<figure class="bc-sbt-stage">' +
        '<div class="bc-sbt-stage-image" data-stage-image="' + stage.key + '">' +
        showMissing(stage) + '</div><figcaption>' + esc(stage.label) + '</figcaption></figure>';
    }).join("");
    overlay.querySelectorAll("[data-stage-image]").forEach((holder, index) => {
      const stage = STAGES[index];
      const img = document.createElement("img");
      img.src = ROOT + slug + "/" + stage.key + ".webp";
      img.alt = beast.name + " — " + stage.label;
      img.loading = "lazy";
      img.onerror = () => { img.remove(); holder.innerHTML = showMissing(stage); };
      img.onload = () => { holder.replaceChildren(img); };
      holder.replaceChildren(img);
    });
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    card.focus({preventScroll:true});
  }

  function closePopup() {
    const overlay = document.getElementById("bc-sbt-detail-overlay");
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
    activeBeast = null;
    if (lastFocus && lastFocus.isConnected && typeof lastFocus.focus === "function") lastFocus.focus({preventScroll:true});
  }

  document.addEventListener("click", event => {
    const beastCard = event.target.closest(".sbt-card");
    if (!beastCard) return;
    const root = beastCard.closest("#boundless-spirit-beast-tiers-v897");
    if (!root) return;
    const heading = beastCard.querySelector("h3");
    const name = (heading?.textContent || "").trim();
    const catalog = window.BoundlessSpiritBeastTiers?.list?.() || [];
    const beast = catalog.find(item => item.name === name);
    if (beast) openPopup(beast);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePopup();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addStyle, {once:true});
  } else addStyle();
})();