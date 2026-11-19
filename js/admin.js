// js/admin.js
const AdminAuth = (() => {
  async function checkAuth() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) {
      window.location.href = '../login.html';
      return null;
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      alert("Access Denied: You do not have administrator permissions.");
      window.location.href = '../student/dashboard.html';
      return null;
    }
    return session;
  }

  const setupLogout = () => {
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = '../login.html';
    });
  };

  return { checkAuth, setupLogout };
})();