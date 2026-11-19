/* js/student-common.js – shared by every page in /student/ (dashboard, resources, account).
   Load after supabase-client.js. Uses your global `supabaseClient`.

   Remember: this guard improves the experience only. The database (RLS) is what
   actually decides which data a user can read or change. */
const MPStudent = (() => {
  'use strict';

  const YEARS = { 1: 'First Year', 2: 'Second Year', 3: 'Third Year', 4: 'Fourth Year', 5: 'Fifth Year', 6: 'Sixth Year' };
  const yearLabel = n => YEARS[n] || 'Not set';

  const currentNext = () => location.pathname.split('/').filter(Boolean).slice(-2).join('/') + location.search;

  function toLogin(reason) {
    let url = '../login.html?next=' + encodeURIComponent(currentNext());
    if (reason) url += '&reason=' + reason;
    location.replace(url);
    return new Promise(() => { });                 // never resolves: stops the calling page script
  }

  function showFatal(text) {
    document.body.classList.remove('guard-pending');
    const main = document.querySelector('main');
    if (main) main.textContent = text;
  }

  const signOutLocal = () => supabaseClient.auth.signOut({ scope: 'local' });   // this device only

  /* Returns { session, profile } for a valid, active student – otherwise redirects. */
  async function guard() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      showFatal('The site is not configured correctly. Please contact the MEDPEACE team.');
      return null;
    }

    let session;
    try {
      ({ data: { session } } = await supabaseClient.auth.getSession());
    } catch (err) {
      console.error('[MEDPEACE guard]', err);
      showFatal('Cannot reach the server. Check your connection and refresh.');
      return null;
    }
    if (!session) return toLogin();

    // select('*') so this keeps working whether or not optional columns (e.g. university_id) exist.
    const { data: profile, error } = await supabaseClient
      .from('profiles').select('*').eq('id', session.user.id).maybeSingle();

    if (error) {
      console.error('[MEDPEACE guard]', error);
      if (error.code === 'PGRST301' || /jwt/i.test(error.message || '')) { await signOutLocal(); return toLogin(); }
      showFatal('Could not load your account. Check your connection and refresh.');
      return null;
    }
    if (!profile) { await signOutLocal(); return toLogin('noprofile'); }
    if (profile.is_active === false) { await signOutLocal(); return toLogin('disabled'); }

    document.body.classList.remove('guard-pending');
    return { session, profile };
  }

  function bindLogout(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try { await signOutLocal(); } catch (err) { console.error(err); }
      location.replace('../login.html');
    });
  }

  function friendlyAuthError(err) {
    console.error('[MEDPEACE auth]', err);
    const code = (err && err.code) || '';
    const msg = ((err && err.message) || '').toLowerCase();
    if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Your current password is incorrect.';
    if (code === 'same_password') return 'Choose a password different from your current one.';
    if (code === 'weak_password') return 'That password is too weak. Use at least 8 characters with upper-case, lower-case and a number.';
    if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || (err && err.status === 429) || msg.includes('rate limit'))
      return 'Too many attempts. Please wait a few minutes and try again.';
    if ((err && err.name === 'AuthRetryableFetchError') || msg.includes('failed to fetch') || msg.includes('network'))
      return 'Cannot reach the server. Check your internet connection and try again.';
    return 'Something went wrong. Please try again.';
  }

  return { YEARS, yearLabel, guard, bindLogout, friendlyAuthError };
})();