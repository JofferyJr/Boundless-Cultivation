(() => {
  "use strict";
  const CONFIG = window.BOUNDLESS_SUPABASE_CONFIG || {};
  const PREFIX = "boundless-cultivation-save-slot-";
  const SAVE_KEYS = ["boundless-save", "boundless-cultivation-save"];
  const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
  let supabase = null;
  let currentUser = null;
  let syncTimer = null;
  let busy = false;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);

  function collectSaves() {
    const saves = {};
    for (const key of SAVE_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) saves[key] = value;
    }
    for (let i = 1; i <= 5; i++) {
      const key = PREFIX + i;
      const value = localStorage.getItem(key);
      if (value !== null) saves[key] = value;
    }
    return saves;
  }

  function hasLocalSaves(saves = collectSaves()) {
    return Object.keys(saves).length > 0;
  }

  function setStatus(message, isError = false) {
    const el = document.querySelector("#bc-auth-status");
    if (!el) return;
    el.textContent = message;
    el.dataset.error = isError ? "true" : "false";
  }

  function usernameEmail(username) {
    return username.toLowerCase() + "@accounts.boundless-cultivation.invalid";
  }

  function renderAccount() {
    const account = document.querySelector("#bc-account-button");
    const details = document.querySelector("#bc-auth-account");
    if (account) account.textContent = currentUser ? "Akaun · " + (currentUser.user_metadata?.username || "Pemain") : "Log masuk / Daftar";
    if (details) details.textContent = currentUser ? "Log masuk sebagai " + (currentUser.user_metadata?.username || "Pemain") : "Anda sedang bermain sebagai tetamu. Save tempatan kekal aktif.";
    const logout = document.querySelector("#bc-auth-logout");
    if (logout) logout.hidden = !currentUser;
    const authForm = document.querySelector("#bc-auth-form");
    if (authForm) authForm.hidden = !!currentUser;
    const cloud = document.querySelector("#bc-cloud-actions");
    if (cloud) cloud.hidden = !currentUser;
  }

  function openPanel() {
    const panel = document.querySelector("#bc-auth-panel");
    if (panel) {
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      const input = panel.querySelector('input[name="username"]');
      if (!currentUser) input?.focus();
    }
  }

  function closePanel() {
    const panel = document.querySelector("#bc-auth-panel");
    if (panel) {
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
    }
  }

  async function fetchCloud() {
    if (!supabase || !currentUser) throw new Error("Log masuk diperlukan untuk backup awan.");
    const { data, error } = await supabase.from("boundless_cloud_saves")
      .select("payload,updated_at").eq("user_id", currentUser.id).maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function uploadCloud(showStatus = true) {
    if (!supabase || !currentUser) return;
    const payload = collectSaves();
    if (!hasLocalSaves(payload)) {
      if (showStatus) setStatus("Belum ada save tempatan untuk disandarkan.", true);
      return;
    }
    const { error } = await supabase.from("boundless_cloud_saves").upsert({
      user_id: currentUser.id,
      payload,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) throw error;
    if (showStatus) setStatus("Backup awan berjaya dikemas kini.");
  }

  async function restoreCloud() {
    const cloud = await fetchCloud();
    if (!cloud || !cloud.payload || typeof cloud.payload !== "object") {
      setStatus("Belum ada backup awan. Muat naik save tempatan dahulu.");
      return;
    }
    const local = collectSaves();
    const hasLocal = hasLocalSaves(local);
    if (hasLocal && !window.confirm("Pulihkan backup awan? Save tempatan yang sepadan akan digantikan. Sebaiknya export save dahulu.")) return;
    for (const key of Object.keys(cloud.payload)) {
      if (SAVE_KEYS.includes(key) || new RegExp("^" + PREFIX + "[1-5]$").test(key)) {
        const value = cloud.payload[key];
        if (typeof value === "string") localStorage.setItem(key, value);
      }
    }
    setStatus("Backup dipulihkan. Muat semula halaman untuk memuatkan keadaan permainan.");
  }

  function scheduleSync() {
    if (!currentUser || !supabase) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      uploadCloud(false).catch((err) => {
        console.warn("[Boundless Auth] Cloud save sync failed:", err?.message || err);
        setStatus("Save tempatan disimpan, tetapi backup awan gagal. Cuba Backup Awan.", true);
      });
    }, 1800);
  }

  async function syncAfterLogin() {
    const cloud = await fetchCloud();
    const local = collectSaves();
    if (cloud && cloud.payload && hasLocalSaves(local)) {
      setStatus("Save tempatan ditemui. Pilih sama ada mahu menghantar save ini ke awan atau memulihkan backup awan.");
    } else if (cloud && cloud.payload) {
      setStatus("Backup awan ditemui. Tekan Pulihkan Backup untuk memuatkannya.");
    } else if (hasLocalSaves(local)) {
      setStatus("Save tempatan ditemui. Tekan Backup Awan untuk menyandarkannya.");
    } else {
      setStatus("Akaun sedia. Permainan tetamu dan save tempatan masih tersedia.");
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = String(data.get("username") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const mode = String(data.get("mode") || "login");
    if (!USERNAME_RE.test(username)) {
      setStatus("Username mesti 3–24 aksara: huruf kecil, nombor atau garis bawah.", true);
      return;
    }
    if (password.length < 8) {
      setStatus("Kata laluan mesti sekurang-kurangnya 8 aksara.", true);
      return;
    }
    if (!supabase) {
      setStatus("Supabase belum dikonfigurasi. Isi URL dan anon key dalam v824-auth-config.js.", true);
      return;
    }
    busy = true;
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      if (mode === "signup") {
        const { data: result, error } = await supabase.auth.signUp({
          email: usernameEmail(username),
          password,
          options: { data: { username } }
        });
        if (error) throw error;
        if (!result.session) {
          setStatus("Akaun mungkin telah dibuat tetapi tiada sesi. Pastikan Confirm email dimatikan dalam Supabase Auth settings.", true);
          return;
        }
        currentUser = result.user;
        renderAccount();
        setStatus("Pendaftaran berjaya. Akaun anda sedia digunakan.");
        await syncAfterLogin();
      } else {
        const { data: result, error } = await supabase.auth.signInWithPassword({
          email: usernameEmail(username), password
        });
        if (error) throw error;
        currentUser = result.user;
        renderAccount();
        setStatus("Log masuk berjaya.");
        await syncAfterLogin();
      }
    } catch (error) {
      const message = String(error?.message || "Ralat tidak diketahui");
      setStatus(message.includes("Invalid login") ? "Username atau kata laluan tidak betul." : message, true);
    } finally {
      busy = false;
      if (submit) submit.disabled = false;
    }
  }

  function installUI() {
    if (document.querySelector("#bc-account-button")) return;
    const panel = document.createElement("section");
    panel.id = "bc-auth-panel";
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "bc-auth-title");
    panel.innerHTML = '<div class="bc-auth-card"><div class="bc-auth-head"><div><p class="bc-auth-eyebrow">BOUNDLESS CULTIVATION</p><h2 id="bc-auth-title">Akaun & Backup Awan</h2></div><button id="bc-auth-close" type="button" aria-label="Tutup">×</button></div><p id="bc-auth-account">Anda sedang bermain sebagai tetamu. Save tempatan kekal aktif.</p><form id="bc-auth-form"><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[a-zA-Z0-9_]{3,24}" required placeholder="nama_pemain"></label><label>Kata laluan<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Sekurang-kurangnya 8 aksara"></label><div class="bc-auth-actions"><button type="submit" data-mode="login">Log masuk</button><button type="submit" data-mode="signup" class="secondary">Daftar akaun</button></div><input type="hidden" name="mode" value="login"></form><div id="bc-cloud-actions" hidden><button id="bc-cloud-upload" type="button">Backup Awan</button><button id="bc-cloud-restore" type="button" class="secondary">Pulihkan Backup</button><button id="bc-auth-logout" type="button" class="secondary">Log keluar</button></div><p id="bc-auth-status" role="status" aria-live="polite">Mod tetamu aktif. Log masuk pilihan sahaja.</p><p class="bc-auth-note">Save tempatan tidak dipadam apabila log keluar. Simpan salinan export sebelum memulihkan backup.</p></div>';
    document.body.append(panel);
    document.addEventListener("boundless-open-account-settings", (event) => {
      const target = event.detail?.target;
      const card = panel.querySelector(".bc-auth-card") || document.querySelector(".bc-auth-settings-card");
      if (!target || !card) return;
      panel.hidden = true;
      target.replaceChildren(card);
      card.classList.add("bc-auth-settings-card");
      const close = card.querySelector("#bc-auth-close");
      if (close) close.hidden = true;
      renderAccount();
    });

    panel.querySelector("#bc-auth-close").addEventListener("click", closePanel);
    panel.querySelector("#bc-auth-form").addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-mode]");
      if (btn) panel.querySelector('input[name="mode"]').value = btn.dataset.mode;
    });
    panel.querySelector("#bc-auth-form").addEventListener("submit", onSubmit);
    panel.querySelector("#bc-cloud-upload").addEventListener("click", () => uploadCloud().catch((e) => setStatus(e.message, true)));
    panel.querySelector("#bc-cloud-restore").addEventListener("click", () => restoreCloud().catch((e) => setStatus(e.message, true)));
    panel.querySelector("#bc-auth-logout").addEventListener("click", async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        currentUser = null;
        renderAccount();
        setStatus("Log keluar berjaya. Save tempatan kekal pada peranti ini.");
      } catch (e) { setStatus(e.message, true); }
    });
  }

  function patchLocalStorage() {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      const result = original.call(this, key, value);
      if (this === localStorage && (SAVE_KEYS.includes(String(key)) || new RegExp("^" + PREFIX + "[1-5]$").test(String(key)))) scheduleSync();
      return result;
    };
  }

  async function init() {
    installUI();
    patchLocalStorage();
    const url = String(CONFIG.url || "").trim();
    const anonKey = String(CONFIG.anonKey || "").trim();
    if (url && anonKey && /^https:\/\//i.test(url)) {
      try {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        supabase = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: "boundless-cultivation-auth-v1",
            flowType: "pkce"
          }
        });
        // Restore the existing Supabase session before showing the account state.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        currentUser = data.session?.user || null;
        renderAccount();
        if (currentUser) {
          syncAfterLogin().catch((e) => {
            console.warn("[Boundless Auth] Could not load cloud-save status:", e?.message || e);
            setStatus("Anda masih log masuk. Status backup awan tidak dapat dimuatkan; cuba lagi apabila sambungan pulih.", true);
          });
        }
        supabase.auth.onAuthStateChange((_event, session) => {
          currentUser = session?.user || null;
          renderAccount();
        });
      } catch (e) {
        console.error("[Boundless Auth] Supabase initialization failed:", e);
        setStatus("Sambungan Supabase gagal. Semak URL dan anon key.", true);
      }
    } else {
      setStatus("Mod tetamu aktif. Untuk akaun, isi URL dan anon key Supabase dalam fail konfigurasi.", false);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
