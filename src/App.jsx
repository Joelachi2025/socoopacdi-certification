import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Folder, FolderOpen, Eye, Download, Trash2, Upload, CheckCircle2, XCircle, ChevronDown, ChevronRight, LayoutDashboard, FileStack, Phone, Pin, FileText, Plus, Pencil, X, ExternalLink, LogOut } from "lucide-react";

// ============================================================
// CONNEXION SUPABASE
// ============================================================
const SUPABASE_URL = "https://uvegckfkwhmgqkvajjdw.supabase.co";
const SUPABASE_KEY = "sb_publishable_M7-8MnZ4UcnVbtoSkyTkGg_FwyHlfX2";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = "documents";

// ============================================================
// ÉCRAN DE CONNEXION
// ============================================================
function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // signin | signup
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup" && !data.session) {
      setError("Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.");
      return;
    }
    onLoggedIn(data.session);
  }

  return (
    <div className="login-root">
      <style>{`
        .login-root { min-height: 100vh; display:flex; align-items:center; justify-content:center;
          background: linear-gradient(135deg, #1f3d2b, #2f5d3f); font-family: 'Inter', system-ui, sans-serif; }
        .login-card { background: white; border-radius: 14px; padding: 34px 32px; width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .login-badge { width: 46px; height: 46px; border-radius: 10px; background: #c08a2e; display:flex;
          align-items:center; justify-content:center; font-weight:700; color:#2a1c05; font-size:20px; margin-bottom: 14px; }
        .login-card h2 { margin: 0 0 4px; font-size: 19px; color: #1f3d2b; }
        .login-card p.sub { margin: 0 0 22px; font-size: 13px; color: #5b6457; }
        .login-card input { width: 100%; padding: 10px 12px; margin-bottom: 12px; border-radius: 8px;
          border: 1px solid #d8ddd2; font-size: 14px; }
        .login-card button[type=submit] { width: 100%; padding: 11px; background: #1f3d2b; color: white;
          border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; }
        .login-card button[type=submit]:hover { background: #2f5d3f; }
        .login-switch { text-align: center; margin-top: 14px; font-size: 12.5px; color: #5b6457; }
        .login-switch span { color: #c08a2e; font-weight: 700; cursor: pointer; }
        .login-error { background: #fbe9e9; color: #c23b3b; font-size: 12.5px; padding: 9px 11px;
          border-radius: 7px; margin-bottom: 12px; }
      `}</style>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-badge">S</div>
        <h2>SOCOOPACDI COOP-CA</h2>
        <p className="sub">Certification RA 2020 · espace documentaire</p>
        {error && <div className="login-error">{error}</div>}
        <input type="email" placeholder="Adresse email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : mode === "signin" ? "Se connecter" : "Créer le compte"}
        </button>
        <div className="login-switch">
          {mode === "signin" ? (
            <>Pas encore de compte ? <span onClick={() => setMode("signup")}>Créer un compte</span></>
          ) : (
            <>Déjà un compte ? <span onClick={() => setMode("signin")}>Se connecter</span></>
          )}
        </div>
      </form>
    </div>
  );
}

// ============================================================
// COMPOSANTS
// ============================================================
function StatusPill({ conforme }) {
  return conforme ? (
    <span className="pill pill-ok"><CheckCircle2 size={13} /> Conforme</span>
  ) : (
    <span className="pill pill-bad"><XCircle size={13} /> Non conforme</span>
  );
}

function FolderCard({ folder, image, onView, onUploaded, onDeleted, onDeleteFolder }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const path = `${folder.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) {
        alert("Erreur d'envoi : " + upErr.message);
        continue;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { data: row, error: dbErr } = await supabase
        .from("documents")
        .insert({
          dossier_id: folder.id,
          nom_fichier: file.name,
          chemin_stockage: path,
          url_publique: pub.publicUrl,
          taille_octets: file.size,
        })
        .select()
        .single();
      if (!dbErr) onUploaded(folder.id, row);
    }
    setUploading(false);
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Supprimer "${doc.nom_fichier}" ?`)) return;
    await supabase.storage.from(BUCKET).remove([doc.chemin_stockage]);
    await supabase.from("documents").delete().eq("id", doc.id);
    onDeleted(folder.id, doc.id);
  }

  return (
    <div className="folder-card">
      <div className="folder-card-image" style={{ backgroundImage: `url(${image})` }}>
        <StatusPill conforme={folder.conforme} />
      </div>
      <div className="folder-card-body">
        <div className="folder-card-title">
          <Folder size={16} className="folder-icon" />
          <span>{folder.nom}</span>
          <Trash2 size={14} className="folder-delete" onClick={() => onDeleteFolder(folder)} />
        </div>
        <div className="folder-card-count">{(folder.documents || []).length} document(s)</div>
        <div className="folder-card-docs">
          {(folder.documents || []).map((d) => (
            <div className="doc-row" key={d.id}>
              <span className="doc-name">
                <FileText size={13} /> {d.nom_fichier.length > 22 ? d.nom_fichier.slice(0, 22) + "..." : d.nom_fichier}
              </span>
              <span className="doc-actions">
                <Eye size={14} onClick={() => onView(d)} />
                <a href={d.url_publique} target="_blank" rel="noreferrer"><Download size={14} /></a>
                <Trash2 size={14} onClick={() => handleDelete(d)} />
              </span>
            </div>
          ))}
        </div>
        <button className="import-btn" onClick={() => inputRef.current.click()} disabled={uploading}>
          <Upload size={14} /> {uploading ? "Envoi..." : "Importer"}
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={handleFiles} />
      </div>
    </div>
  );
}

function ViewerModal({ doc, onClose }) {
  if (!doc) return null;
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.url_publique)}&embedded=true`;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span><FileText size={15} /> {doc.nom_fichier}</span>
          <X size={18} className="modal-close" onClick={onClose} />
        </div>
        <div className="viewer-body" style={{ padding: 0 }}>
          <iframe src={viewerUrl} title={doc.nom_fichier} style={{ width: "100%", height: "70vh", border: "none" }} />
        </div>
      </div>
    </div>
  );
}

function RequirementModal({ initial, onSave, onClose }) {
  const [id, setId] = useState(initial?.id || "");
  const [label, setLabel] = useState(initial?.label || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [exemple, setExemple] = useState(initial?.exemple || "");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{initial ? "Modifier l'exigence" : "Ajouter une exigence"}</span>
          <X size={18} className="modal-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          <label>Numéro (ex: 1.4.1)</label>
          <input value={id} disabled={!!initial} onChange={(e) => setId(e.target.value)} placeholder="1.4.1" />
          <label>Titre de l'exigence</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Titre" />
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <label>Exemple</label>
          <textarea value={exemple} onChange={(e) => setExemple(e.target.value)} rows={2} />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" disabled={!id || !label} onClick={() => onSave({ id, label, description, exemple })}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1612203985729-442bd9e0fb95?w=400&q=60",
  "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400&q=60",
  "https://images.unsplash.com/photo-1611588729417-31a8d2c84478?w=400&q=60",
];

// Images de cacao associées à chaque chapitre (par ordre de création)
const COCOA_IMAGES = [
  "https://images.pexels.com/photos/4198696/pexels-photo-4198696.jpeg?w=900&q=70", // cabosses de cacao sur l'arbre
  "https://images.pexels.com/photos/6157229/pexels-photo-6157229.jpeg?w=900&q=70", // cabosses ouvertes, fèves
  "https://images.pexels.com/photos/7474318/pexels-photo-7474318.jpeg?w=900&q=70", // fèves de cacao séchées
  "https://images.pexels.com/photos/5946071/pexels-photo-5946071.jpeg?w=900&q=70", // plantation de cacaoyers
  "https://images.pexels.com/photos/4197447/pexels-photo-4197447.jpeg?w=900&q=70", // cabosses récoltées
];
function cocoaImageFor(index) {
  if (index < 0) return COCOA_IMAGES[0];
  return COCOA_IMAGES[index % COCOA_IMAGES.length];
}

function ChapterModal({ onSave, onClose }) {
  const [titre, setTitre] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Ajouter un chapitre</span>
          <X size={18} className="modal-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          <label>Titre du chapitre</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Traçabilité" />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" disabled={!titre.trim()} onClick={() => onSave(titre.trim())}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APPLICATION PRINCIPALE
// ============================================================
function Dashboard({ session }) {
  const [chapters, setChapters] = useState([]);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [activeReqId, setActiveReqId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [tab, setTab] = useState("dossiers");
  const [editingReq, setEditingReq] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [addingChapter, setAddingChapter] = useState(false);
  const [allDocs, setAllDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data: ch } = await supabase.from("chapitres").select("*").order("ordre");
    const { data: req } = await supabase.from("exigences").select("*").order("ordre");
    const { data: dos } = await supabase.from("dossiers").select("*");
    const { data: docs } = await supabase.from("documents").select("*");

    const dossiersWithDocs = (dos || []).map((d) => ({
      ...d,
      documents: (docs || []).filter((doc) => doc.dossier_id === d.id),
    }));

    const reqsWithFolders = (req || []).map((r) => ({
      ...r,
      folders: dossiersWithDocs.filter((d) => d.exigence_id === r.id),
    }));

    const chaptersFull = (ch || []).map((c) => ({
      ...c,
      requirements: reqsWithFolders.filter((r) => r.chapitre_id === c.id),
    }));

    setChapters(chaptersFull);
    setAllDocs(docs || []);
    if (chaptersFull.length) {
      setActiveChapterId(chaptersFull[0].id);
      setExpanded({ [chaptersFull[0].id]: true });
      if (chaptersFull[0].requirements[0]) setActiveReqId(chaptersFull[0].requirements[0].id);
    }
    setLoading(false);
  }

  const activeChapter = chapters.find((c) => c.id === activeChapterId);
  const activeReq = activeChapter?.requirements.find((r) => r.id === activeReqId);
  const total = activeChapter?.requirements.length || 0;
  const ok = activeChapter?.requirements.filter((r) => r.conforme).length || 0;

  async function saveChapter(titre) {
    const id = "ch_" + Date.now();
    await supabase.from("chapitres").insert({ id, titre, ordre: chapters.length + 1 });
    setAddingChapter(false);
    setExpanded((e) => ({ ...e, [id]: true }));
    loadAll();
  }

  function openAddRequirement(chapterId) {
    setEditingChapterId(chapterId);
    setEditingReq({});
  }
  function openEditRequirement(chapterId, req) {
    setEditingChapterId(chapterId);
    setEditingReq(req);
  }

  async function saveRequirement(reqData) {
    const exists = chapters.some((c) => c.requirements.some((r) => r.id === reqData.id));
    if (exists) {
      await supabase.from("exigences").update({
        label: reqData.label, description: reqData.description, exemple: reqData.exemple,
      }).eq("id", reqData.id);
    } else {
      await supabase.from("exigences").insert({
        id: reqData.id, chapitre_id: editingChapterId, label: reqData.label,
        description: reqData.description, exemple: reqData.exemple, conforme: false, ordre: 999,
      });
    }
    setEditingReq(null);
    setActiveReqId(reqData.id);
    loadAll();
  }

  async function deleteRequirement(chapterId, reqId) {
    if (!window.confirm("Retirer cette exigence ?")) return;
    await supabase.from("exigences").delete().eq("id", reqId);
    if (activeReqId === reqId) setActiveReqId(null);
    loadAll();
  }

  async function addFolder(reqId) {
    const nom = window.prompt("Nom du dossier (ex: Registre signé)");
    if (!nom || !nom.trim()) return;
    await supabase.from("dossiers").insert({ exigence_id: reqId, nom: nom.trim(), conforme: false });
    loadAll();
  }

  async function deleteFolder(folder) {
    if (!window.confirm(`Supprimer le dossier "${folder.nom}" et tous ses documents ?`)) return;
    const paths = (folder.documents || []).map((d) => d.chemin_stockage);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("dossiers").delete().eq("id", folder.id);
    setAllDocs((d) => d.filter((doc) => doc.dossier_id !== folder.id));
    loadAll();
  }

  function handleUploaded(dossierId, row) {
    setAllDocs((d) => [...d, row]);
    supabase.from("dossiers").update({ conforme: true }).eq("id", dossierId);
    setChapters((chs) => chs.map((c) => ({
      ...c,
      requirements: c.requirements.map((r) => ({
        ...r,
        folders: r.folders.map((f) => f.id === dossierId
          ? { ...f, conforme: true, documents: [...f.documents, row] }
          : f),
      })),
    })));
  }
  function handleDeleted(dossierId, docId) {
    setAllDocs((d) => d.filter((doc) => doc.id !== docId));
    setChapters((chs) => chs.map((c) => ({
      ...c,
      requirements: c.requirements.map((r) => ({
        ...r,
        folders: r.folders.map((f) => {
          if (f.id !== dossierId) return f;
          const remaining = f.documents.filter((d) => d.id !== docId);
          const stillConforme = remaining.length > 0;
          supabase.from("dossiers").update({ conforme: stillConforme }).eq("id", dossierId);
          return { ...f, conforme: stillConforme, documents: remaining };
        }),
      })),
    })));
  }

  if (loading) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>Chargement…</div>;

  return (
    <div className="app-root">
      <style>{`
        * { box-sizing: border-box; }
        .app-root { --bg:#f6f5f1; --panel:#fff; --ink:#1c2418; --ink-soft:#5b6457; --green-deep:#1f3d2b;
          --green-mid:#2f5d3f; --green-line:#d8ddd2; --gold:#c08a2e; --ok-bg:#e7f5ea; --ok-fg:#1f7a3d;
          --bad-bg:#fbe9e9; --bad-fg:#c23b3b; font-family:'Inter',-apple-system,system-ui,sans-serif;
          background:var(--bg); color:var(--ink); min-height:100vh; }
        .topbar { background: linear-gradient(135deg, var(--green-deep), var(--green-mid)); color:white;
          padding:18px 28px; display:flex; align-items:center; justify-content:space-between; }
        .brand { display:flex; align-items:center; gap:14px; }
        .brand-badge { width:42px; height:42px; border-radius:10px; background:var(--gold); display:flex;
          align-items:center; justify-content:center; font-weight:700; font-size:18px; color:#2a1c05; }
        .brand-title { font-weight:700; font-size:17px; }
        .brand-sub { font-size:12.5px; opacity:.75; margin-top:2px; }
        .topbar-right { font-size:13px; opacity:.85; display:flex; gap:18px; align-items:center; cursor:pointer; }
        .nav-tabs { display:flex; gap:28px; padding:0 28px; background:var(--panel); border-bottom:1px solid var(--green-line); }
        .nav-tab { display:flex; align-items:center; gap:7px; padding:14px 4px; font-size:14px; font-weight:600;
          color:var(--ink-soft); cursor:pointer; border-bottom:2.5px solid transparent; }
        .nav-tab.active { color:var(--green-deep); border-bottom-color:var(--gold); }
        .layout { display:flex; }
        .sidebar { width:290px; background:var(--green-deep); color:#e9efe6; min-height:calc(100vh - 110px); padding:18px 0; display:flex; flex-direction:column; }
        .storage-indicator { margin-top:auto; padding:14px 18px; border-top:1px solid rgba(255,255,255,.12); }
        .storage-label { font-size:11px; font-weight:700; color:#cfd6c8; margin-bottom:6px; letter-spacing:.5px; }
        .storage-bar { background:rgba(255,255,255,.15); }
        .storage-sub { font-size:11px; color:#aab5a2; margin-top:5px; }
        .sidebar-heading { font-size:11px; letter-spacing:1.2px; font-weight:700; color:var(--gold); padding:0 18px 12px; opacity:.9; }
        .ch-group { padding:10px 10px; }
        .ch-header { display:flex; align-items:center; gap:8px; padding:10px 10px; font-weight:700; font-size:14px; cursor:pointer; border-radius:6px; }
        .ch-header:hover { background:rgba(255,255,255,.06); }
        .req-list { padding-left:6px; }
        .req-item { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; margin:2px 0;
          border-radius:6px; font-size:13px; cursor:pointer; line-height:1.3; }
        .req-item:hover { background:rgba(255,255,255,.07); }
        .req-item.active { background:rgba(255,255,255,.14); font-weight:600; }
        .req-dot { display:flex; align-items:center; gap:7px; }
        .req-action { opacity:.55; cursor:pointer; }
        .req-action:hover { opacity:1; }
        .add-req-btn { display:flex; align-items:center; gap:6px; padding:9px 12px; margin-top:4px; font-size:12.5px;
          font-weight:600; color:#e7c873; cursor:pointer; border-radius:6px; }
        .add-req-btn:hover { background:rgba(255,255,255,.07); }
        .main { flex:1; padding:26px 30px; }
        .hero { border-radius:14px; overflow:hidden; position:relative;
          background: linear-gradient(120deg, rgba(20,40,25,.45), rgba(30,70,40,.25)),
          url('https://images.unsplash.com/photo-1611588729417-31a8d2c84478?w=1200&q=60');
          background-size:cover; background-position:center; padding:26px 30px; color:white; margin-bottom:22px; }
        .hero-eyebrow { color:var(--gold); font-weight:700; font-size:12.5px; letter-spacing:1px; text-shadow:0 2px 6px rgba(0,0,0,.6); }
        .hero-title { font-size:22px; font-weight:700; margin-top:6px; text-shadow:0 2px 8px rgba(0,0,0,.7); }
        .info-row { display:flex; gap:22px; margin-bottom:24px; }
        .info-card { flex:1; background:var(--panel); border:1px solid var(--green-line); border-radius:12px; padding:18px 20px; }
        .info-card h4 { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--green-deep); margin:0 0 8px; }
        .info-card p { font-size:13.5px; color:var(--ink-soft); line-height:1.55; margin:0; }
        .info-card.example p { font-style:italic; }
        .folders-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:20px; }
        .folder-card { background:var(--panel); border:1px solid var(--green-line); border-radius:12px; overflow:hidden; }
        .folder-card-image { height:110px; background-size:cover; background-position:center; display:flex; align-items:flex-start; justify-content:flex-end; padding:10px; }
        .pill { font-size:11.5px; font-weight:700; padding:4px 9px; border-radius:20px; display:flex; align-items:center; gap:4px; }
        .pill-ok { background:var(--ok-bg); color:var(--ok-fg); }
        .pill-bad { background:var(--bad-bg); color:var(--bad-fg); }
        .folder-card-body { padding:14px 16px; }
        .folder-card-title { display:flex; align-items:flex-start; gap:8px; font-weight:700; font-size:13.5px; line-height:1.35; color:var(--green-deep); }
        .folder-delete { margin-left:auto; flex-shrink:0; cursor:pointer; color:var(--ink-soft); opacity:.6; }
        .folder-delete:hover { color:var(--bad-fg); opacity:1; }
        .folder-icon { flex-shrink:0; margin-top:1px; color:var(--gold); }
        .folder-card-count { font-size:12px; color:var(--ink-soft); margin:4px 0 10px; }
        .doc-row { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; background:var(--bg); border-radius:6px; margin-bottom:6px; font-size:12px; }
        .doc-name { display:flex; align-items:center; gap:6px; color:var(--ink); font-weight:600; }
        .doc-actions { display:flex; gap:8px; color:var(--ink-soft); align-items:center; }
        .doc-actions svg, .doc-actions a { cursor:pointer; color:inherit; }
        .doc-actions svg:hover { color:var(--green-deep); }
        .import-btn { width:100%; margin-top:6px; padding:9px; border-radius:8px; border:1.5px dashed var(--green-line);
          background:transparent; color:var(--green-deep); font-weight:600; font-size:12.5px; display:flex;
          align-items:center; justify-content:center; gap:6px; cursor:pointer; }
        .import-btn:hover { background:var(--ok-bg); border-color:var(--green-mid); }
        .progress-wrap { display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--ink-soft); }
        .progress-bar { flex:1; height:7px; background:var(--green-line); border-radius:4px; overflow:hidden; }
        .progress-fill { height:100%; background:var(--gold); }
        .modal-overlay { position:fixed; inset:0; background:rgba(15,25,16,.5); display:flex; align-items:center; justify-content:center; z-index:100; }
        .modal { background:var(--panel); border-radius:12px; width:420px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,.25); overflow:hidden; }
        .viewer-modal { width:700px; }
        .modal-header { display:flex; align-items:center; justify-content:space-between; background:var(--green-deep);
          color:white; padding:14px 18px; font-weight:700; font-size:14px; gap: 10px; }
        .modal-close { cursor:pointer; opacity:.8; flex-shrink:0; }
        .modal-close:hover { opacity:1; }
        .modal-body { padding:18px; display:flex; flex-direction:column; gap:4px; }
        .modal-body label { font-size:11.5px; font-weight:700; color:var(--ink-soft); margin-top:8px; }
        .modal-body input, .modal-body textarea { padding:9px 10px; border-radius:7px; border:1px solid var(--green-line); font-size:13px; font-family:inherit; resize:vertical; }
        .modal-footer { display:flex; justify-content:flex-end; gap:10px; padding:14px 18px; border-top:1px solid var(--green-line); }
        .btn-primary, .btn-secondary { padding:9px 16px; border-radius:7px; font-weight:600; font-size:13px; cursor:pointer; border:none; }
        .btn-primary { background:var(--green-deep); color:white; }
        .btn-primary:hover { background:var(--green-mid); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .btn-secondary { background:var(--bg); color:var(--ink-soft); }
        .dashboard-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:20px; }
        .dash-card { background:var(--panel); border:1px solid var(--green-line); border-radius:12px; overflow:hidden; }
        .dash-card-image { height:100px; background-size:cover; background-position:center; }
        .dash-card-body { padding:14px 16px; }
        .dash-card-body h4 { margin:0 0 10px; font-size:14px; color:var(--green-deep); }
        .add-folder-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
          min-height:170px; border:1.5px dashed var(--green-line); color:var(--ink-soft); cursor:pointer; font-size:13px; font-weight:600; }
        .add-folder-card:hover { background:var(--ok-bg); border-color:var(--green-mid); color:var(--green-deep); }
      `}</style>

      <div className="topbar">
        <div className="brand">
          <div className="brand-badge">S</div>
          <div>
            <div className="brand-title">SOCOOPACDI COOP-CA – Certification RA 2020</div>
            <div className="brand-sub">2581 producteurs · Divo, CI</div>
          </div>
        </div>
        <div className="topbar-right" onClick={() => supabase.auth.signOut()}>
          <span>{session.user.email}</span>
          <LogOut size={15} /> Déconnexion
        </div>
      </div>

      <div className="nav-tabs">
        <div className={`nav-tab ${tab === "dossiers" ? "active" : ""}`} onClick={() => setTab("dossiers")}><FileStack size={16} /> Dossiers</div>
        <div className={`nav-tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}><LayoutDashboard size={16} /> Tableau de bord</div>
        <div className="nav-tab"><Phone size={16} /> Contact</div>
      </div>

      <div className="layout">
        <div className="sidebar">
          <div className="sidebar-heading">CHAPITRES &amp; EXIGENCES</div>
          {chapters.map((ch, chIndex) => (
            <div className="ch-group" key={ch.id}>
              <div className="ch-header" onClick={() => setExpanded((e) => ({ ...e, [ch.id]: !e[ch.id] }))}>
                {expanded[ch.id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                <FolderOpen size={15} style={{ color: "#e7c873" }} />
                {ch.titre}
              </div>
              {expanded[ch.id] && (
                <div className="req-list">
                  {ch.requirements.map((r) => (
                    <div key={r.id} className={`req-item ${activeReqId === r.id ? "active" : ""}`}
                      onClick={() => { setActiveChapterId(ch.id); setActiveReqId(r.id); }}>
                      <span><b>{r.id}</b> – {r.label}</span>
                      <span className="req-dot">
                        <Pencil size={12} className="req-action" onClick={(e) => { e.stopPropagation(); openEditRequirement(ch.id, r); }} />
                        <X size={13} className="req-action" onClick={(e) => { e.stopPropagation(); deleteRequirement(ch.id, r.id); }} />
                        {r.conforme ? <CheckCircle2 size={14} color="#7fd99a" /> : <XCircle size={14} color="#e88080" />}
                      </span>
                    </div>
                  ))}
                  <div className="add-req-btn" onClick={() => openAddRequirement(ch.id)}><Plus size={13} /> Ajouter une exigence</div>
                </div>
              )}
            </div>
          ))}
          <div className="ch-group">
            <div className="add-req-btn" style={{ fontSize: "13px" }} onClick={() => setAddingChapter(true)}>
              <Plus size={14} /> Ajouter un chapitre
            </div>
          </div>

          <div className="storage-indicator">
            {(() => {
              const totalBytes = allDocs.reduce((sum, d) => sum + (d.taille_octets || 0), 0);
              const limitBytes = 1024 * 1024 * 1024; // 1 Go (plan gratuit Supabase)
              const pct = Math.min(100, (totalBytes / limitBytes) * 100);
              const mb = (totalBytes / (1024 * 1024)).toFixed(1);
              return (
                <>
                  <div className="storage-label">Stockage utilisé</div>
                  <div className="progress-bar storage-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? "#e88080" : "#c08a2e" }} /></div>
                  <div className="storage-sub">{mb} Mo / 1024 Mo</div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="main">
          {tab === "dossiers" && activeReq && (
            <>
              <div
                className="hero"
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(20,40,25,.45), rgba(30,70,40,.25)), url('${cocoaImageFor(chapters.findIndex((c) => c.id === activeChapterId))}')`,
                }}
              >
                <div className="hero-eyebrow">{activeChapter?.titre.toUpperCase()}</div>
                <div className="hero-title">{activeReq.id} – {activeReq.label}</div>
              </div>
              {activeReq.description && (
                <div className="info-row">
                  <div className="info-card"><h4><FileText size={15} /> Description</h4><p>{activeReq.description}</p></div>
                  <div className="info-card example"><h4><Pin size={15} /> Exemple</h4><p>{activeReq.exemple}</p></div>
                </div>
              )}
              <div className="folders-grid">
                {activeReq.folders.map((f, i) => (
                  <FolderCard key={f.id} folder={f} image={PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]}
                    onView={setViewingDoc} onUploaded={handleUploaded} onDeleted={handleDeleted} onDeleteFolder={deleteFolder} />
                ))}
                <div className="folder-card add-folder-card" onClick={() => addFolder(activeReq.id)}>
                  <Plus size={22} />
                  <span>Ajouter un dossier</span>
                </div>
              </div>
            </>
          )}
          {tab === "dossiers" && !activeReq && (
            <div style={{ color: "var(--ink-soft)" }}>Sélectionnez une exigence à gauche.</div>
          )}
          {tab === "dashboard" && (
            <>
              <div
                className="hero"
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(20,40,25,.45), rgba(30,70,40,.25)), url('${cocoaImageFor(0)}')`,
                }}
              >
                <div className="hero-eyebrow">VUE D'ENSEMBLE</div>
                <div className="hero-title">Avancement de la certification</div>
              </div>
              <div className="dashboard-grid">
                {chapters.map((c, i) => {
                  const t = c.requirements.length;
                  const o = c.requirements.filter((r) => r.conforme).length;
                  return (
                    <div className="dash-card" key={c.id}>
                      <div className="dash-card-image" style={{ backgroundImage: `url('${cocoaImageFor(i)}')` }} />
                      <div className="dash-card-body">
                        <h4>{c.titre}</h4>
                        <div className="progress-wrap">
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${t ? (o / t) * 100 : 0}%` }} /></div>
                          <span>{o}/{t} conformes</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {addingChapter && <ChapterModal onSave={saveChapter} onClose={() => setAddingChapter(false)} />}
      {editingReq && (
        <RequirementModal initial={editingReq.id ? editingReq : null} onSave={saveRequirement} onClose={() => setEditingReq(null)} />
      )}
      {viewingDoc && <ViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = chargement

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>Chargement…</div>;
  if (!session) return <LoginScreen onLoggedIn={setSession} />;
  return <Dashboard session={session} />;
}
