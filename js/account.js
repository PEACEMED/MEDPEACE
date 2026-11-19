/* js/account.js – student/account.html. Needs supabase-client.js and student-common.js. */
(async () => {
  'use strict';

  const ctx = await MPStudent.guard();
  if (!ctx) return;
  const { session, profile } = ctx;
  const $ = s => document.querySelector(s);

  /* ---------- profile (textContent only: never inject user data as HTML) ---------- */
  $('#acc-name').textContent = profile.full_name || 'Not set';
  $('#acc-email').textContent = session.user.email || 'Not set';
  $('#acc-uid').textContent = profile.university_id || 'Not set';
  $('#acc-year').textContent = MPStudent.yearLabel(profile.academic_year);
  $('#pw-username').value = session.user.email || '';      // helps password managers

  MPStudent.bindLogout('#logout-btn');

  /* ---------- show / hide password ---------- */
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.toggle);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
    });
  });

  /* ---------- change password ---------- */
  const form = $('#pw-form'), msg = $('#pw-msg'), btn = $('#update-pw-btn');
  const cur = $('#current-password'), next = $('#new-password'), conf = $('#confirm-password');
  let busy = false;

  const show = (type, text) => { msg.className = 'acc-msg ' + type; msg.textContent = text; msg.hidden = false; };
  const fail = (input, text) => { input.setAttribute('aria-invalid', 'true'); show('error', text); input.focus(); };
  const issues = pw => [
    pw.length < 8 && 'at least 8 characters',
    !/[a-z]/.test(pw) && 'a lower-case letter',
    !/[A-Z]/.test(pw) && 'an upper-case letter',
    !/\d/.test(pw) && 'a number'
  ].filter(Boolean);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    msg.hidden = true;
    [cur, next, conf].forEach(i => i.removeAttribute('aria-invalid'));

    if (!cur.value) return fail(cur, 'Enter your current password.');
    const missing = issues(next.value);
    if (missing.length) return fail(next, 'New password needs ' + missing.join(', ') + '.');
    if (next.value === cur.value) return fail(next, 'Choose a password different from your current one.');
    if (next.value !== conf.value) return fail(conf, 'The new passwords do not match.');

    busy = true; btn.disabled = true; btn.textContent = 'Updating…';

    // 1) Prove it is really the owner (protects a phone or laptop left signed in).
    const { error: authErr } = await supabaseClient.auth.signInWithPassword({
      email: session.user.email, password: cur.value
    });
    if (authErr) {
      busy = false; btn.disabled = false; btn.textContent = 'Update password';
      return fail(cur, MPStudent.friendlyAuthError(authErr));
    }

    // 2) Set the new password.
    const { error } = await supabaseClient.auth.updateUser({ password: next.value });
    busy = false; btn.disabled = false; btn.textContent = 'Update password';
    if (error) return show('error', MPStudent.friendlyAuthError(error));

    form.reset();
    show('ok', 'Password updated successfully.');
  });
})();