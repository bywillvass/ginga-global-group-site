// Fetches published rows from the "Blog" tab of the Google Sheet (via the
// same Apps Script deployment used for form submissions) and renders them.
// Requires SCRIPT_URL from main.js to be set.

async function fetchBlogPosts() {
  const res = await fetch(`${SCRIPT_URL}?sheet=Blog`);
  if (!res.ok) throw new Error('Could not load posts');
  const posts = await res.json();
  // newest first, published only
  return posts
    .filter(p => String(p.Published).toUpperCase() === 'TRUE')
    .sort((a, b) => new Date(b.Date) - new Date(a.Date));
}

function slugify(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---- blog grids: render one or more grids, with optional category filtering ----
// Grids are matched by the .blog-grid class. If a grid has a data-category
// attribute, only posts whose Category field matches exactly are shown.
async function renderBlogList() {
  const grids = document.querySelectorAll('.blog-grid');
  if (!grids.length) return;

  let posts;
  try {
    posts = await fetchBlogPosts();
  } catch (err) {
    grids.forEach(grid => {
      grid.innerHTML = '<div class="blog-empty">Couldn\'t load posts right now. Refresh, or check the Script URL in js/main.js.</div>';
    });
    return;
  }

  grids.forEach(grid => {
    const category = grid.dataset.category || null;
    const filtered = category ? posts.filter(p => p.Category === category) : posts;

    if (!filtered.length) {
      grid.innerHTML = '<div class="blog-empty">No posts published yet — check back soon.</div>';
      return;
    }

    grid.innerHTML = filtered.map(post => {
      const slug = post.Slug || slugify(post.Title);
      const img = post.Image || `images/blog-${slug}.jpg`;
      return `
        <article class="blog-card">
          <div class="img-slot" style="--ar:16/9;">
            <img src="${img}" alt="${escapeHtml(post.Title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="img-slot-label"><b>${img}</b><span>1200×675px</span></div>
          </div>
          <div class="blog-card-body">
            <span class="blog-tag">${escapeHtml(post.Category || 'GGG')}</span>
            <h3>${escapeHtml(post.Title)}</h3>
            <p>${escapeHtml(post.Excerpt || '')}</p>
            <a class="blog-read" href="blog-post.html?slug=${encodeURIComponent(slug)}">Read post →</a>
          </div>
        </article>`;
    }).join('');
  });
}

// ---- blog-post.html: render a single post ----
async function renderBlogPost() {
  const container = document.getElementById('postContainer');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    container.innerHTML = '<div class="post-body wrap"><div class="blog-post-empty">No post specified.</div></div>';
    return;
  }

  try {
    const posts = await fetchBlogPosts();
    const post = posts.find(p => (p.Slug || slugify(p.Title)) === slug);

    if (!post) {
      container.innerHTML = '<div class="post-body wrap"><div class="blog-post-empty">That post couldn\'t be found.</div></div>';
      return;
    }

    document.title = `${post.Title} | Ginga Global Group`;
    const img = post.Image || `images/blog-${slug}.jpg`;
    const paragraphs = String(post.Content || '').split(/\n+/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('');

    container.innerHTML = `
      <div class="post-header">
        <div class="wrap">
          <div class="breadcrumb"><a href="blog">Blog</a> / ${escapeHtml(post.Title)}</div>
          <span class="blog-tag">${escapeHtml(post.Category || 'GGG')}</span>
          <h1>${escapeHtml(post.Title)}</h1>
          <div class="post-meta">${escapeHtml(post.Date || '')}</div>
        </div>
      </div>
      <section class="post-body">
        <div class="wrap post-content-wrap">
          <div class="img-slot" style="--ar:16/9;">
            <img src="${img}" alt="${escapeHtml(post.Title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="img-slot-label"><b>${img}</b><span>1600×900px</span></div>
          </div>
          <div class="post-content">${paragraphs}</div>
        </div>
      </section>`;
  } catch (err) {
    container.innerHTML = '<div class="post-body wrap"><div class="blog-post-empty">Couldn\'t load this post right now.</div></div>';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  renderBlogList();
  renderBlogPost();
});
