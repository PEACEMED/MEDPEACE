/* js/nav-auth.js – swaps the homepage nav between guest and logged-in buttons.
   Same logic as your old inline script, moved to a file so a strict
   Content-Security-Policy (no inline scripts) will not break it. */
document.addEventListener('DOMContentLoaded', async () => {
  // supabaseClient comes from js/supabase-client.js (a top-level const, not window.supabaseClient)
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

  // Resource Library: signed-in users go to the library, everyone else goes to sign in first.
  // Works for the card and the "Recently used" chip (both carry data-id="library").
  // Ctrl/Cmd/Shift/middle clicks keep the normal link (student/resources.html), whose
  // page is itself protected, so nobody can get in this way without being signed in.
  document.addEventListener('click', async e => {
    const a = e.target.closest('a[data-id="library"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    let signedIn = false;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      signedIn = !!session;
    } catch (err) { console.error('[MEDPEACE nav]', err); }
    location.href = signedIn ? 'student/resources.html' : 'login.html?next=student/resources.html';
  });

  const guestLinks = document.getElementById('guest-links');
  const dashboardLink = document.getElementById('dashboard-link');
  if (!guestLinks || !dashboardLink) return;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {                                   // logged out
      guestLinks.style.display = 'flex';
      dashboardLink.style.display = 'none';
      return;
    }

    guestLinks.style.display = 'none';                // logged in
    const { data: profile } = await supabaseClient
      .from('profiles').select('role').eq('id', session.user.id).maybeSingle();

    dashboardLink.style.display = 'inline-block';
    if (profile && profile.role === 'admin') {
      dashboardLink.href = 'admin/dashboard.html';
      dashboardLink.textContent = 'Admin Panel';
    } else {
      dashboardLink.href = 'student/dashboard.html';
      dashboardLink.textContent = 'My Dashboard';
    }
  } catch (err) {
    console.error('[MEDPEACE nav]', err);             // page still works if Supabase is unreachable
  }
});