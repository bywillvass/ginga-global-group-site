// =====================================================================
// GOOGLE SHEETS ENDPOINT
// Same URL used for form submissions (leads/contact) AND for pulling
// blog posts on blog.html / blog-post.html. See README.md.
// =====================================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWvcBORDl_1Q-H44cAmCG-UsVt6E3IA2KLGg6jActvXVbgFmGMMw07moBZk_Hdk5kHsg/exec";

// ---- mobile nav ----
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      navLinks.style.display = isOpen ? 'none' : 'flex';
      navLinks.style.cssText += isOpen
        ? 'display:none;'
        : 'position:absolute; top:100%; left:0; right:0; flex-direction:column; background:#070921; padding:20px 24px; gap:18px; display:flex;';
    });
  }
});

// ---- generic form -> Google Sheet submit handler ----
function handleFormSubmit(form, statusEl, submitLabel) {
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const honeypot = form.querySelector('input[name="company"]');
    if (honeypot && honeypot.value) return; // silently drop bot submissions

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    const data = new FormData(form);

    try {
      await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data });
      statusEl.textContent = "Thanks — we've got it. We'll be in touch shortly.";
      statusEl.className = 'form-status ok';
      form.reset();
    } catch (err) {
      statusEl.textContent = "Something went wrong sending that. Please email info@gingaglobalgroup.com directly.";
      statusEl.className = 'form-status err';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
}
