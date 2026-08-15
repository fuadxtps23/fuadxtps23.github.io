const CONFIG = {
  username: "fuadxtps23",
  api: "https://api.github.com",
  raw: "https://raw.githubusercontent.com",
  marked: window.marked,
};

const $ = (sel) => document.querySelector(sel);

/* ============================================================
   Navbar
============================================================ */
(function initNav() {
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  const navAnchors = document.querySelectorAll(".nav-link");

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    links.classList.toggle("open");
  });

  navAnchors.forEach((a) =>
    a.addEventListener("click", () => {
      toggle.classList.remove("open");
      links.classList.remove("open");
    })
  );

  const sections = ["home", "repos"];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navAnchors.forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === `#${id}`)
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
})();

/* ============================================================
   Helpers
============================================================ */
function nfIcon(name) {
  return `<i class="nf ${name}"></i>`;
}

const LANG_ICONS = {
  JavaScript: "nf-dev-javascript",
  TypeScript: "nf-dev-typescript",
  HTML: "nf-dev-html5",
  CSS: "nf-dev-css3",
  PHP: "nf-dev-php",
  Python: "nf-dev-python",
  Shell: "nf-dev-bash",
  Bash: "nf-dev-bash",
  C: "nf-dev-c",
  "C++": "nf-custom-cpp",
  "C#": "nf-dev-csharp",
  Java: "nf-dev-java",
  Go: "nf-dev-go",
  Rust: "nf-dev-rust",
  Lua: "nf-seti-lua",
  Kotlin: "nf-seti-kotlin",
  Swift: "nf-dev-swift",
  Ruby: "nf-dev-ruby",
  Vue: "nf-seti-vue",
  JSON: "nf-cod-json",
  Markdown: "nf-dev-markdown",
  Dockerfile: "nf-dev-docker",
  Makefile: "nf-seti-makefile",
  nix: "nf-seti-nix",
  Zig: "nf-seti-zig",
  Haskell: "nf-dev-haskell",
  "Jupyter Notebook": "nf-dev-jupyter",
  SCSS: "nf-dev-sass",
  Svelte: "nf-seti-svelte",
};

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  PHP: "#4F5D95",
  Python: "#3572A5",
  Shell: "#89e051",
  Bash: "#89e051",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Lua: "#000080",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
  Vue: "#41b883",
  JSON: "#292929",
  Markdown: "#083fa1",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  nix: "#7e7eff",
  Zig: "#ec915c",
  Haskell: "#5e5086",
  "Jupyter Notebook": "#DA5B0B",
  SCSS: "#c6538c",
  Svelte: "#ff3e00",
};

function langInfo(lang) {
  return {
    icon: LANG_ICONS[lang] || "nf-fa-file_code",
    color: LANG_COLORS[lang] || "#8b949e",
  };
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, secs] of units) {
    if (diff >= secs) {
      const n = Math.floor(diff / secs);
      return `${n} ${name}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/* ============================================================
   Profile
============================================================ */
async function loadProfile() {
  try {
    const res = await fetch(`${CONFIG.api}/users/${CONFIG.username}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const u = await res.json();

    $("#avatar").src = u.avatar_url;
    $("#name").textContent = u.name || u.login;
    $("#bio").textContent = u.bio || "no bio yet";

    const meta = [];
    if (u.location) meta.push(`<span>${nfIcon("nf-fa-location_arrow")} ${esc(u.location)}</span>`);
    if (u.company) meta.push(`<span>${nfIcon("nf-fa-briefcase")} ${esc(u.company)}</span>`);
    meta.push(`<span>${nfIcon("nf-md-github")} @${esc(u.login)}</span>`);
    meta.push(`<span>${nfIcon("nf-fa-clock")} joined ${new Date(u.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short" })}</span>`);
    $("#heroMeta").innerHTML = meta.join("");

    const [followers, following, repos] = document.querySelectorAll(".stat-num");
    followers.textContent = u.followers;
    following.textContent = u.following;
    repos.textContent = u.public_repos;
  } catch (err) {
    $("#name").textContent = CONFIG.username;
    $("#bio").textContent = "could not load profile :(";
  }
}

/* ============================================================
   README
============================================================ */
async function loadReadme() {
  const box = $("#readme");
  const refresh = $("#refreshReadme");
  refresh.disabled = true;

  try {
    const raw = `${CONFIG.raw}/${CONFIG.username}/${CONFIG.username}`;
    let md = "";
    for (const branch of ["main", "master"]) {
      const res = await fetch(`${raw}/${branch}/README.md`, { cache: "no-store" });
      if (res.ok) { md = await res.text(); break; }
      if (res.status !== 404) throw new Error(`HTTP ${res.status}`);
    }
    if (!md) throw new Error("no README.md found");

    const rendered = CONFIG.marked.parse(md);
    const wrap = document.createElement("div");
    wrap.className = "markdown-body";
    wrap.innerHTML = rendered;
    wrap.querySelectorAll("a").forEach((a) => (a.target = "_blank"));
    wrap.querySelectorAll("img").forEach((img) => (img.loading = "lazy"));
    box.innerHTML = "";
    box.appendChild(wrap);
  } catch (err) {
    box.innerHTML = `<div class="error"><i class="nf nf-fa-bug"></i> failed to load README: ${esc(err.message)}</div>`;
  } finally {
    refresh.disabled = false;
  }
}

$("#refreshReadme").addEventListener("click", () => {
  $("#readme").innerHTML = `<div class="loading"><i class="nf nf-cod-loading spin"></i> refreshing…</div>`;
  loadReadme();
});

/* ============================================================
   Repos
============================================================ */
const repoState = { list: [], query: "", sort: "updated" };

async function loadRepos() {
  const loading = $("#repoLoading");
  const error = $("#repoError");
  const grid = $("#repoGrid");
  const empty = $("#repoEmpty");

  loading.hidden = false;
  error.hidden = true;
  grid.innerHTML = "";

  try {
    const res = await fetch(
      `${CONFIG.api}/users/${CONFIG.username}/repos?per_page=100&sort=updated`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    repoState.list = await res.json();
    $("#repoCount").textContent = `${repoState.list.length} repos`;
    renderRepos();
  } catch (err) {
    $("#repoErrorMsg").textContent = `failed to fetch repos: ${err.message}`;
    error.hidden = false;
    empty.hidden = true;
  } finally {
    loading.hidden = true;
  }
}

function repoCard(repo) {
  const info = langInfo(repo.language);
  const topics = (repo.topics || [])
    .slice(0, 5)
    .map((t) => `<span class="topic">${esc(t)}</span>`)
    .join("");

  return `
    <div class="repo-card">
      <div class="repo-card-top">
        <span class="repo-icon">${nfIcon(repo.fork ? "nf-fa-code_fork" : "nf-oct-repo")}</span>
        <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener" title="${esc(repo.name)}">${esc(repo.name)}</a>
      </div>
      <p class="repo-desc">${esc(repo.description || "")}</p>
      ${topics ? `<div class="repo-topics">${topics}</div>` : ""}
      <div class="repo-meta">
        <span title="stars">${nfIcon("nf-fa-star")} ${repo.stargazers_count}</span>
        <span title="forks">${nfIcon("nf-fa-code_fork")} ${repo.forks_count}</span>
        <span title="updated">${nfIcon("nf-fa-clock")} ${timeAgo(repo.updated_at)}</span>
        ${repo.language ? `
        <span class="repo-lang" title="${esc(repo.language)}">
          ${nfIcon(info.icon)} ${esc(repo.language)}
        </span>` : ""}
      </div>
    </div>`;
}

function renderRepos() {
  const grid = $("#repoGrid");
  const empty = $("#repoEmpty");

  const query = repoState.query.trim().toLowerCase();
  let list = repoState.list.filter(
    (r) =>
      !query ||
      r.name.toLowerCase().includes(query) ||
      (r.description || "").toLowerCase().includes(query) ||
      (r.language || "").toLowerCase().includes(query) ||
      (r.topics || []).some((t) => t.toLowerCase().includes(query))
  );

  switch (repoState.sort) {
    case "stars":
      list.sort((a, b) => b.stargazers_count - a.stargazers_count);
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "language":
      list.sort((a, b) => (a.language || "").localeCompare(b.language || ""));
      break;
    default:
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  grid.innerHTML = list.map(repoCard).join("");
  empty.hidden = list.length !== 0;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

$("#searchInput").addEventListener("input", debounce((e) => {
  repoState.query = e.target.value;
  renderRepos();
}, 300));

$("#sortSelect").addEventListener("change", (e) => {
  repoState.sort = e.target.value;
  renderRepos();
});

/* ============================================================
   Boot
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadReadme();
  loadRepos();
});