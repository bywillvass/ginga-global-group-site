// Blog posts are served from the static /blog-posts.json file,
// kept up to date by a Google Apps Script trigger on the sheet.
//
// Sheet columns used:
//   Tag          — short display label shown on card badge (e.g. "Tours")
//   Series       — grouping for "continue reading" (e.g. "AMF U20 Futsal World Cup Spain 2024")
//   Image        — path to image file
//   ImagePosition — CSS object-position value (optional, defaults to center 20%)
//   Published    — TRUE/FALSE

async function fetchBlogPosts() {
  const res = await fetch(`/blog-posts.json?v=${Date.now()}`);
  if (!res.ok) throw new Error('Could not load posts');
  const posts = await res.json();
  return posts.sort((a, b) => new Date(b.Date) - new Date(a.Date));
}

function slugify(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderBlogCard(post) {
  const slug = post.Slug || slugify(post.Title);
  const img = post.Image || `images/blog-${slug}.jpg`;
  const imgPos = post.ImagePosition || 'center 20%';
  const tag = post.Tag || post.Category || 'GGG';
  const badgeLabel = post.Series || tag;
  return `
    <article class="blog-card">
      <div class="img-slot" style="--ar:16/9;">
        <img src="${img}" alt="${escapeHtml(post.Title)}" style="object-position:${imgPos};" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="img-slot-label"><b>${img}</b><span>1200×675px</span></div>
      </div>
      <div class="blog-card-body">
        <a class="blog-tag tag-link" href="blog.html?tag=${encodeURIComponent(tag)}">${escapeHtml(badgeLabel)}</a>
        <h3>${escapeHtml(post.Title)}</h3>
        <p>${escapeHtml(post.Excerpt || '')}</p>
        <a class="blog-read" href="blog-post.html?slug=${encodeURIComponent(slug)}">Read post →</a>
      </div>
    </article>`;
}

// ---- blog listing grids ----
async function renderBlogList() {
  const grids = document.querySelectorAll('.blog-grid');
  if (!grids.length) return;

  let posts;
  try {
    posts = await fetchBlogPosts();
  } catch (err) {
    grids.forEach(grid => {
      grid.innerHTML = '<div class="blog-empty">Couldn\'t load posts right now.</div>';
    });
    return;
  }

  // Tag filter from URL (?tag=Tours)
  const params = new URLSearchParams(window.location.search);
  const urlTag = params.get('tag');

  // Main blog listing page: wire up filter buttons
  const mainGrid  = document.getElementById('blogGrid');
  const filterBar = document.getElementById('blogFilterBar');
  const filterEl  = document.getElementById('blogFilters');

  if (mainGrid && filterEl) {
    const tags = ['All', ...new Set(posts.map(p => p.Tag || p.Category).filter(Boolean))];
    let active = urlTag || 'All';

    const applyFilter = (tag) => {
      active = tag;
      const filtered = tag === 'All'
        ? posts
        : posts.filter(p => (p.Tag || p.Category || '') === tag);
      mainGrid.innerHTML = filtered.length
        ? filtered.map(p => renderBlogCard(p)).join('')
        : `<div class="blog-empty">No posts tagged "${escapeHtml(tag)}" yet.</div>`;
      filterEl.querySelectorAll('.blog-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === active);
      });
    };

    // Only show the filter bar when there are multiple tags to filter by
    if (tags.length > 2) {
      filterEl.innerHTML = tags.map(t =>
        `<button class="blog-filter-btn${t === active ? ' active' : ''}" data-filter="${escapeHtml(t)}">${escapeHtml(t)}</button>`
      ).join('');
      filterEl.querySelectorAll('.blog-filter-btn').forEach(btn =>
        btn.addEventListener('click', () => applyFilter(btn.dataset.filter))
      );
      filterBar.style.display = '';
    }

    applyFilter(active);
    return;
  }

  // Non-main grids (e.g. blog-post.html related sections)
  grids.forEach(grid => {
    const tagFilter = grid.dataset.tag || null;
    const catFilter = grid.dataset.category || null;

    let filtered = posts;
    if (tagFilter) filtered = filtered.filter(p => (p.Tag || '').toLowerCase() === tagFilter.toLowerCase());
    if (catFilter) filtered = filtered.filter(p => (p.Tag || p.Category || '') === catFilter);

    if (!filtered.length) {
      grid.innerHTML = '<div class="blog-empty">No posts published yet — check back soon.</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => renderBlogCard(p)).join('');
  });
}

// ---- single blog post ----
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
    const post  = posts.find(p => (p.Slug || slugify(p.Title)) === slug);

    if (!post) {
      container.innerHTML = '<div class="post-body wrap"><div class="blog-post-empty">That post couldn\'t be found.</div></div>';
      return;
    }

    document.title = `${post.Title} | Ginga Global Group`;

    const img        = post.Image || `images/blog-${slug}.jpg`;
    const absImg     = img.startsWith('http') ? img : `https://gingaglobalgroup.com/${img}`;
    const desc       = post.Excerpt || post.Title;
    const postUrl    = `https://gingaglobalgroup.com/blog-post.html?slug=${encodeURIComponent(slug)}`;

    // Inject / update meta tags and canonical for this post
    const setMeta = (sel, attr, val) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = postUrl;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', postUrl);
    setMeta('meta[property="og:image"]', 'content', absImg);
    setMeta('meta[name="twitter:title"]', 'content', document.title);
    setMeta('meta[name="twitter:description"]', 'content', desc);
    setMeta('meta[name="twitter:image"]', 'content', absImg);

    // BlogPosting JSON-LD
    const existingLd = document.getElementById('blog-post-ld');
    if (existingLd) existingLd.remove();
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id = 'blog-post-ld';
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.Title,
      "description": desc,
      "image": absImg,
      "datePublished": post.Date || '',
      "author": {"@type": "Organization", "name": "Ginga Global Group"},
      "publisher": {"@type": "Organization", "name": "Ginga Global Group", "url": "https://gingaglobalgroup.com"}
    });
    document.head.appendChild(ldScript);
    const imgPos     = post.ImagePosition || 'center 20%';
    const tag        = post.Tag || post.Category || 'GGG';
    const paragraphs = String(post.Content || '').split(/\n+/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('');

    // Same-series posts (excluding current post)
    const seriesPosts = post.Series
      ? posts.filter(p => p.Series === post.Series && (p.Slug || slugify(p.Title)) !== slug)
      : [];

    // All other posts (not current, not in same series)
    const otherPosts = posts.filter(p => {
      if ((p.Slug || slugify(p.Title)) === slug) return false;
      if (post.Series && p.Series === post.Series) return false;
      return true;
    });

    const seriesSection = seriesPosts.length ? `
      <section class="blog" style="padding-top:60px; padding-bottom:0;">
        <div class="wrap">
          <div class="sec-head-row">
            <div class="sec-head" style="margin-bottom:0;">
              <span class="eyebrow">Continue Reading</span>
              <h2>${escapeHtml(post.Series)}</h2>
            </div>
            <a href="blog.html?tag=${encodeURIComponent(tag)}" class="btn-text">All ${escapeHtml(tag)} posts →</a>
          </div>
          <div class="blog-grid" style="margin-top:32px;">
            ${seriesPosts.map(p => renderBlogCard(p)).join('')}
          </div>
        </div>
      </section>` : '';

    const othersSection = otherPosts.length ? `
      <section class="blog" style="padding-top:60px;">
        <div class="wrap">
          <div class="sec-head-row">
            <div class="sec-head" style="margin-bottom:0;">
              <span class="eyebrow">From the Blog</span>
              <h2>More posts.</h2>
            </div>
            <a href="blog" class="btn-text">View all →</a>
          </div>
          <div class="blog-grid" style="margin-top:32px;">
            ${otherPosts.slice(0, 4).map(p => renderBlogCard(p)).join('')}
          </div>
        </div>
      </section>` : '';

    container.innerHTML = `
      <div class="post-header">
        <div class="wrap">
          <div class="breadcrumb"><a href="blog">Blog</a> / ${escapeHtml(post.Title)}</div>
          <a class="blog-tag tag-link" href="blog.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>
          <h1>${escapeHtml(post.Title)}</h1>
          <div class="post-meta">${escapeHtml(post.Date || '')}</div>
        </div>
      </div>
      <section class="post-body">
        <div class="wrap post-content-wrap">
          <div class="img-slot" style="--ar:16/9;">
            <img src="${img}" alt="${escapeHtml(post.Title)}" style="object-position:${imgPos};" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="img-slot-label"><b>${img}</b><span>1600×900px</span></div>
          </div>
          <div class="post-content">${paragraphs}</div>
        </div>
      </section>
      ${seriesSection}
      ${othersSection}`;
  } catch (err) {
    container.innerHTML = '<div class="post-body wrap"><div class="blog-post-empty">Couldn\'t load this post right now.</div></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderBlogList();
  renderBlogPost();
});
