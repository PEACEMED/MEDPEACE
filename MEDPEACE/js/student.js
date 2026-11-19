// js/student.js
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check Authentication
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  
  if (sessionError || !session) {
    window.location.href = '../login.html';
    return;
  }

  // 2. Setup Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = '../login.html';
    });
  }

  // 3. Fetch Profile Data
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('full_name, academic_year, role')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Could not load profile", profileError);
    return;
  }

  // Guard: If admin, we will later redirect to admin panel.
  // For now, just display the dashboard.

  // Convert academic year number to text
  const yearMap = {
    1: 'First Year', 2: 'Second Year', 3: 'Third Year',
    4: 'Fourth Year', 5: 'Fifth Year', 6: 'Sixth Year'
  };
  const yearText = yearMap[profile.academic_year] || 'Unknown Year';

  // Update UI with Profile Info
  const nameEl = document.getElementById('student-name');
  const yearEl = document.getElementById('student-year');
  
  if (nameEl) nameEl.textContent = profile.full_name;
  if (yearEl) yearEl.textContent = yearText;

  // 4. Fetch Courses for this Academic Year
  const { data: courses, error: coursesError } = await supabaseClient
    .from('courses')
    .select('*')
    .eq('academic_year', profile.academic_year)
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (coursesError) {
    console.error("Could not load courses", coursesError);
  }

  // 5. Render Courses
  const renderCourses = (containerId, limit = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!courses || courses.length === 0) {
      container.innerHTML = `<div class="empty-text">No courses available yet. Check back soon!</div>`;
      return;
    }

    let coursesToRender = courses;
    if (limit && courses.length > limit) {
      coursesToRender = courses.slice(0, limit);
    }

    container.innerHTML = coursesToRender.map(course => `
      <div class="course-card">
        <h3>${course.title}</h3>
        <p>${course.description || 'No description available.'}</p>
        <a href="course.html?id=${course.id}" class="course-link">View Lectures →</a>
      </div>
    `).join('');
  };

  // Render on Dashboard (limit to 3)
  renderCourses('dashboard-courses', 3);
  
  // Render on Resources Page (show all)
  renderCourses('all-courses');
});