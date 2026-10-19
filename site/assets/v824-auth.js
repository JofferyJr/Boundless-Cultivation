import { MAX_SAVE_SLOTS } from "./v815-save-manager-core.mjs";

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
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
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

  function stableStringify(value) {
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    if (value && typeof value === "object") {
      return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  async function payloadHash(payload) {
    const bytes = new TextEncoder().encode(stableStringify(payload || {}));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function archivePayload(payload, source) {
    if (!supabase || !currentUser || !payload || typeof payload !== "object") return;
    const { error } = await supabase.from("boundless_cloud_save_versions").insert({
      user_id: currentUser.id,
      payload,
      payload_hash: await payloadHash(payload),
      source
    });
    if (error) throw error;
  }

  function isSlotKey(key) {
    return SAVE_KEYS.includes(key) || new RegExp("^" + PREFIX + "[1-" + MAX_SAVE_SLOTS + "]$").test(key);
  }

  async function uploadCloud(showStatus = true) {
    if (!supabase || !currentUser) throw new Error("Log masuk diperlukan untuk backup awan.");
    const payload = collectSaves();
    if (!hasLocalSaves(payload)) {
      if (showStatus) setStatus("Belum ada save tempatan untuk disandarkan.", true);
      return false;
    }

    const existing = await fetchCloud();
    const localHash = await payloadHash(payload);
    if (existing?.payload && await payloadHash(existing.payload) === localHash) {
      if (showStatus) setStatus("Backup awan sudah sepadan dengan save pada peranti ini.");
      return true;
    }

    if (existing?.payload) {
      if (!showStatus) {
        setStatus("Perubahan tempatan belum disandarkan kerana backup awan berbeza. Buka Akaun dan pilih Backup Awan untuk menyemak konflik.", true);
        return false;
      }
      if (!window.confirm("Backup awan berbeza daripada save pada peranti ini. Gantikan backup awan dengan save tempatan? Versi cloud lama akan disimpan dalam sejarah dahulu.")) return false;
      await archivePayload(existing.payload, "pre_replace");
      const { data, error } = await supabase.from("boundless_cloud_saves")
        .update({ payload, updated_at: new Date().toISOString() })
        .eq("user_id", currentUser.id)
        .eq("updated_at", existing.updated_at)
        .select("user_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setStatus("Konflik dikesan: backup awan berubah pada peranti lain. Tiada data cloud ditimpa. Muat semula status dan cuba semula.", true);
        return false;
      }
    } else {
      const { error } = await supabase.from("boundless_cloud_saves").insert({
        user_id: currentUser.id,
        payload,
        updated_at: new Date().toISOString()
      });
      if (error) {
        if (error.code === "23505") {
          setStatus("Backup awan baru dicipta pada peranti lain. Muat semula status sebelum mencuba lagi.", true);
          return false;
        }
        throw error;
      }
    }
    if (showStatus) setStatus("Backup awan berjaya dikemas kini. Versi terdahulu dikekalkan apabila backup diganti.");
    return true;
  }

  async function applyCloudPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Format backup awan tidak sah.");
    const local = collectSaves();
    if (hasLocalSaves(local)) await archivePayload(local, "restore_point");
    const accepted = Object.keys(payload).filter(isSlotKey);
    for (const key of [...SAVE_KEYS, ...Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => PREFIX + (i + 1))]) {
      if (!accepted.includes(key)) localStorage.removeItem(key);
    }
    for (const key of accepted) {
      const value = payload[key];
      if (typeof value === "string") localStorage.setItem(key, value);
    }
    setStatus("Backup dipulihkan. Muat semula halaman untuk memuatkan keadaan permainan.");
  }

  async function restoreCloud() {
    const cloud = await fetchCloud();
    if (!cloud || !cloud.payload || typeof cloud.payload !== "object") {
      setStatus("Belum ada backup awan. Muat naik save tempatan dahulu.");
      return;
    }
    if (!window.confirm("Pulihkan backup awan ini? Save tempatan akan disimpan sebagai titik pemulihan sebelum diganti.")) return;
    await applyCloudPayload(cloud.payload);
  }

  async function renderCloudVersions() {
    if (!supabase || !currentUser) throw new Error("Log masuk diperlukan.");
    const host = document.querySelector("#bc-cloud-version-list");
    if (!host) return;
    const { data, error } = await supabase.from("boundless_cloud_save_versions")
      .select("id,source,created_at,payload_hash")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    host.replaceChildren();
    host.hidden = false;
    if (!data?.length) {
      const empty = document.createElement("p");
      empty.textContent = "Belum ada versi backup terdahulu.";
      host.append(empty);
      return;
    }
    for (const version of data) {
      const row = document.createElement("div");
      row.className = "bc-cloud-version-row";
      const label = document.createElement("span");
      const date = new Date(version.created_at);
      label.textContent = (Number.isNaN(date.getTime()) ? version.created_at : date.toLocaleString()) + " · " + ({
        pre_replace: "Backup sebelum diganti",
        restore_point: "Titik pemulihan peranti",
        manual_backup: "Backup manual"
      }[version.source] || version.source);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary";
      button.textContent = "Pulihkan versi";
      button.addEventListener("click", () => restoreCloudVersion(version.id).catch((e) => setStatus(e.message || "Gagal memulihkan versi.", true)));
      row.append(label, button);
      host.append(row);
    }
  }

  async function restoreCloudVersion(versionId) {
    if (!supabase || !currentUser) throw new Error("Log masuk diperlukan.");
    const { data, error } = await supabase.from("boundless_cloud_save_versions")
      .select("id,payload,created_at")
      .eq("id", versionId)
      .eq("user_id", currentUser.id)
      .single();
    if (error) throw error;
    if (!data?.payload || !window.confirm("Pulihkan versi backup terdahulu? Save semasa akan disimpan sebagai titik pemulihan dahulu.")) return;
    await applyCloudPayload(data.payload);
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
      const [localHash, cloudHash] = await Promise.all([payloadHash(local), payloadHash(cloud.payload)]);
      if (localHash === cloudHash) setStatus("Save tempatan sepadan dengan backup awan.");
      else setStatus("Save tempatan dan backup awan berbeza. Pilih Backup Awan untuk menyimpan versi lama dahulu, atau Pulihkan Backup untuk menggunakan versi cloud.");
    } else if (cloud && cloud.payload) {
      setStatus("Backup awan ditemui. Tekan Pulihkan Backup untuk memuatkannya.");
    } else if (hasLocalSaves(local)) {
      setStatus("Save tempatan ditemui. Tekan Backup Awan untuk membuat sandaran pertama.");
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
    // Do not abort merely because a legacy account button exists elsewhere.
    // The settings dashboard needs this panel and its global mount callback.
    if (document.querySelector("#bc-auth-panel")) return;
    const panel = document.createElement("section");
    panel.id = "bc-auth-panel";
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "bc-auth-title");
    panel.innerHTML = '<div class="bc-auth-card"><div class="bc-auth-head"><div><p class="bc-auth-eyebrow">BOUNDLESS CULTIVATION</p><h2 id="bc-auth-title">Akaun & Backup Awan</h2></div><button id="bc-auth-close" type="button" aria-label="Tutup">×</button></div><p id="bc-auth-account">Anda sedang bermain sebagai tetamu. Save tempatan kekal aktif.</p><form id="bc-auth-form"><label>Username<input name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[a-zA-Z0-9_]{3,24}" required placeholder="nama_pemain"></label><label>Kata laluan<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Sekurang-kurangnya 8 aksara"></label><div class="bc-auth-actions"><button type="submit" data-mode="login">Log masuk</button><button type="submit" data-mode="signup" class="secondary">Daftar akaun</button></div><input type="hidden" name="mode" value="login"></form><div id="bc-cloud-actions" hidden><button id="bc-cloud-upload" type="button">Backup Awan</button><button id="bc-cloud-restore" type="button" class="secondary">Pulihkan Backup</button><button id="bc-cloud-versions" type="button" class="secondary">Sejarah Backup</button><button id="bc-auth-logout" type="button" class="secondary">Log keluar</button><div id="bc-cloud-version-list" hidden></div></div><p id="bc-auth-status" role="status" aria-live="polite">Mod tetamu aktif. Log masuk pilihan sahaja.</p><p class="bc-auth-note">Save tempatan tidak dipadam apabila log keluar. Simpan salinan export sebelum memulihkan backup.</p></div>';
    document.body.append(panel);
    let accountCard = panel.querySelector(".bc-auth-card");
    window.__boundlessOpenAccountSettings = (target) => {
      const card = accountCard || panel.querySelector(".bc-auth-card") || document.querySelector(".bc-auth-settings-card");
      if (!target || !card) return false;
      accountCard = card;
      panel.hidden = true;
      target.replaceChildren(card);
      card.classList.add("bc-auth-settings-card");
      const close = card.querySelector("#bc-auth-close");
      if (close) close.hidden = true;
      renderAccount();
      return true;
    };
    document.addEventListener("boundless-open-account-settings", (event) => window.__boundlessOpenAccountSettings?.(event.detail?.target));

    panel.querySelector("#bc-auth-close").addEventListener("click", closePanel);
    panel.querySelector("#bc-auth-form").addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-mode]");
      if (btn) btn.closest("form")?.querySelector('input[name="mode"]') && (btn.closest("form").querySelector('input[name="mode"]').value = btn.dataset.mode);
    });
    panel.querySelector("#bc-auth-form").addEventListener("submit", onSubmit);
    panel.querySelector("#bc-cloud-upload").addEventListener("click", () => uploadCloud().catch((e) => setStatus(e.message, true)));
    panel.querySelector("#bc-cloud-restore").addEventListener("click", () => restoreCloud().catch((e) => setStatus(e.message, true)));
    panel.querySelector("#bc-cloud-versions").addEventListener("click", () => renderCloudVersions().catch((e) => setStatus(e.message || "Gagal memuat sejarah backup.", true)));
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

  window.__boundlessAccountService = {
    status() { return { configured: !!supabase, user: currentUser ? (currentUser.user_metadata?.username || "Pemain") : null }; },
    async authenticate(username, password, mode) {
      if (!supabase) throw new Error("Supabase belum dikonfigurasi. Isi URL dan anon key dalam v824-auth-config.js.");
      username = String(username || "").trim().toLowerCase();
      password = String(password || "");
      if (!USERNAME_RE.test(username)) throw new Error("Username mesti 3–24 aksara: huruf kecil, nombor atau garis bawah.");
      if (password.length < 8) throw new Error("Kata laluan mesti sekurang-kurangnya 8 aksara.");
      const result = mode === "signup"
        ? await supabase.auth.signUp({ email: usernameEmail(username), password, options: { data: { username } } })
        : await supabase.auth.signInWithPassword({ email: usernameEmail(username), password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) throw new Error("Akaun mungkin telah dibuat tetapi tiada sesi. Pastikan Confirm email dimatikan dalam Supabase Auth settings.");
      currentUser = result.data.user || result.data.session?.user || null;
      renderAccount();
      await syncAfterLogin();
      return this.status();
    },
    async logout() {
      if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      currentUser = null; renderAccount();
      return this.status();
    },
    async progression(action, payload = {}) {
      if (!supabase || !currentUser) throw new Error("Log masuk diperlukan.");
      const { data, error } = await supabase.functions.invoke("boundless-account-progression", { body: { action, ...payload } });
      if (error) {
        let message = error.message || "Permintaan pelayan gagal.";
        try { const ctx = error.context; if (ctx && typeof ctx.json === "function") { const body = await ctx.json(); if (body?.error) message = body.error; if (body?.details) message += " " + JSON.stringify(body.details); } } catch {}
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    async accountProgress() { return await this.progression("status"); },
    async requestAccountTier(tier, note = "") {
      return await this.progression("request-tier", { tier, note: String(note || "").trim().slice(0, 500) });
    },
    async adminList() { return await this.progression("admin-list"); },
    async adminReview(userId, decision, note = "") {
      return await this.progression("admin-review", { userId, decision, note: String(note || "").trim().slice(0, 500) });
    },
    async adminAwardExp(userId, amount, reason, referenceId) {
      return await this.progression("admin-award-exp", { userId, amount: Number(amount), reason, referenceId });
    },
    async adminAwardAchievement(userId, achievementCode) {
      return await this.progression("admin-award-achievement", { userId, achievementCode });
    },
    async adminSetRequirements(tier, minimumExp, minimumAchievements) {
      return await this.progression("admin-set-requirements", { tier, minimumExp: Number(minimumExp), minimumAchievements: Number(minimumAchievements) });
    },
    async backup() { return await uploadCloud(true); },
    async restore() { await restoreCloud(); return true; },
    async backupVersions() { await renderCloudVersions(); return true; }
  };

  function patchLocalStorage() {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      const result = original.call(this, key, value);
      if (this === localStorage && (SAVE_KEYS.includes(String(key)) || new RegExp("^" + PREFIX + "[1-" + MAX_SAVE_SLOTS + "]$").test(String(key)))) scheduleSync();
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
        window.__boundlessSupabaseClient = supabase;
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
          window.__boundlessSupabaseClient = supabase;
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
