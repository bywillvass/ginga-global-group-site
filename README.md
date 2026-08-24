# Ginga Global Group — website

## What's in this folder
```
index.html        Home
about.html         About (team + player success stories)
programs.html       Elite Neon Cup — Athens 2027 (registration form)
services.html       Services detail
blog.html           Blog listing (pulled live from a Google Sheet)
blog-post.html       Single blog post template (reads ?slug=... from the URL)
contact.html         Contact form
css/style.css       All styling, shared across every page
js/main.js           Nav menu + form submission logic
js/blog.js           Fetches & renders blog posts from the Sheet
images/               Where you drop your photos and logo
Code.gs               Paste into Google Apps Script — see Part 1
.htaccess              Optional — gives blog posts pretty URLs
```

Every page links to the others through the top nav, so it browses like a normal multi-page site, but there's no build step — every file is plain HTML/CSS/JS. Upload the whole folder to Hostinger and it works.

---

## Part 1: connect the forms + blog to Google Sheets

One Google Sheet acts as the backend for everything — form leads land in it, and blog posts are written in it too. No database, no login system, free.

**1. Create the sheet**
- New spreadsheet at [sheets.google.com](https://sheets.google.com), name it `Ginga Global Group — Data`.
- Leave it empty — `EliteNeonCup` and `Contact` tabs are created automatically the first time each form is submitted.
- Manually add one more tab called **`Blog`** with this header row in row 1:
  ```
  Title | Slug | Date | Category | Excerpt | Content | Image | Published
  ```

**2. Add the script**
- `Extensions > Apps Script` in the sheet. Delete the default code, paste in all of `Code.gs` from this folder. Save.

**3. Deploy as a Web App**
- `Deploy > New deployment` → gear icon → **Web app**.
- Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
- Authorize when prompted (click through the "unverified app" warning — normal for your own script).
- Copy the Web app URL (ends in `/exec`).

**4. Wire it into the site**
- Open `js/main.js`, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL. This one file powers every form and the blog on every page.

**5. Test it**
- Open `contact.html` locally, submit a test message, check the `Contact` tab fills in.
- Add a test row to the `Blog` tab (see below), refresh `blog.html`, confirm it shows up.

---

## Part 2: how you (or your dad) add a blog post — no coding

This is the "admin hub." It's the `Blog` tab in the Google Sheet from Part 1. Open the Sheet, add a new row, fill in the columns:

| Column | What goes in it |
|---|---|
| Title | Post headline |
| Slug | Web-friendly version, lowercase, hyphens, e.g. `athens-2027-update` |
| Date | e.g. `2026-08-21` |
| Category | e.g. `Elite Neon Cup`, `Insight`, `Tour` |
| Excerpt | One or two sentences shown on the blog list |
| Content | The full post. Put a blank line between paragraphs — the site splits on blank lines automatically |
| Image | Filename of the photo for this post, e.g. `blog-athens-2027-update.jpg` (upload the actual photo into `/images/` on Hostinger) |
| Published | Type `TRUE` to make it live, `FALSE` to keep it as a draft |

Set `Published` to `TRUE`, and it appears on `blog.html` immediately — no re-upload, no touching the site files. That's the whole workflow: **open the Sheet, add a row, done.** Your dad doesn't need a login to the website at all, just edit access to the Sheet (share it with his Google account like any shared spreadsheet).

**Why a Sheet instead of a "real" admin login page:** a proper login-protected admin panel needs a server and a database behind it, which a plain HTML site on Hostinger doesn't have. The Sheet does the same job — a structured place non-coders can add content — without that complexity, and it's the same tool you're already using for leads. If you outgrow this later (multiple editors, richer formatting, image uploads through a UI), that's the point to look at a proper CMS like WordPress — worth a conversation then, not now.

---

## Part 3: image placeholders

Every image slot on the site shows a dashed gold box with the exact filename it's expecting until you upload one. Just save your photo with that exact name into `/images/` (same name, any of `.jpg`/`.png`/`.webp` — just match the extension shown) and re-upload the folder. No HTML editing required.

**Logo:** `images/logo.png` — until it exists, the site shows the text logo "GINGA GLOBAL GROUP" as a fallback, so the site never looks broken either way.

**Full list of expected filenames:**
| Filename | Used on | Suggested size |
|---|---|---|
| `logo.png` | Every page (header) | ~300×80px, transparent background |
| `home-about.jpg` | Home | 1000×750px |
| `home-elite-neon-cup.jpg` | Home | 800×600px |
| `home-contact.jpg` | Home | 800×600px |
| `about-hero.jpg` | About | 900×1200px |
| `team-theo.jpg` | About | 800×1000px |
| `team-marcos.jpg` | About | 800×1000px |
| `story-william.jpg` | About | 800×600px |
| `story-tiago.jpg` | About | 800×600px |
| `program-elite-neon-cup.jpg` | Programs | 900×675px |
| `program-brazil-tour.jpg` | Programs | 800×600px |
| `program-thailand-tour.jpg` | Programs | 800×600px |
| `service-development.jpg` | Services | 900×675px |
| `service-clubs.jpg` | Services | 900×675px |
| `service-tours.jpg` | Services | 900×675px |
| `blog-{slug}.jpg` | Blog | 1200×675px — one per post, named after that post's Slug, unless you set a different filename in the Image column |

---

## Part 4: upload to Hostinger

1. Hostinger → **File Manager** → `public_html` for `gingaglobalgroup.com`.
2. Upload everything in this folder — all the `.html` files, plus the `css/`, `js/`, `images/` folders, plus `.htaccess`. Keep the folder structure intact.
3. Visit gingaglobalgroup.com to confirm it's live.

---

## Notes
- **Fonts:** Poppins stands in for Gotham (closest free match). Once you have your Adobe Fonts kit ID, add the kit embed `<script>` tag in the `<head>` of every page, above the Google Fonts link.
- **Pulled from footballmanagementservices.com.au:** the About page team bios, player success stories (William Vassilikopoulos, Tiago Armaleo), Brazil/Thailand tour mentions, and the real contact details (info@gingaglobalgroup.com, +61 414 580 591, Instagram/Facebook) are carried over from the old site. I left out the "Creative Connections" service (photographers/DJs/videographers) since your brand notes say football/talent management only, no creative-agency services — say the word if you actually want that back in.
- **Marcos's bio** is a placeholder — the old site had Theo's bio duplicated under his name by mistake, so I didn't carry that over. Send me the real one and I'll drop it in.
- **Spam:** every form has a hidden honeypot field that silently drops bot submissions.
- **Email notifications:** right now leads only land in the Sheet, no email alert. A `MailApp.sendEmail()` line in `Code.gs` would ping you on every new submission — say the word.
