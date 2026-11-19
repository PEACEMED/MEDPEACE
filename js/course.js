// js/course.js
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Check
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError || !session) {
    window.location.href = '../login.html';
    return;
  }

  // 2. Logout Logic
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '../login.html';
  });

  // 3. Get Course ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    window.location.href = 'resources.html';
    return;
  }

  const loadingMsg = document.getElementById('loading-message');
  const courseContent = document.getElementById('course-content');

  try {
    // 4. Fetch Course Details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) throw new Error("Course not found or you don't have access.");

    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-desc').textContent = course.description || '';

    // 5. Fetch Lectures
    const { data: lectures, error: lecturesError } = await supabaseClient
      .from('lectures')
      .select('*')
      .eq('course_id', courseId)
      .order('display_order', { ascending: true });

    if (lecturesError) throw lecturesError;

    if (!lectures || lectures.length === 0) {
      loadingMsg.textContent = "No lectures have been added to this course yet.";
      return;
    }

    // 6. Fetch User's Progress for these lectures
    const lectureIds = lectures.map(l => l.id);
    const { data: progressData, error: progressError } = await supabaseClient
      .from('lecture_progress')
      .select('lecture_id, is_completed')
      .eq('student_id', session.user.id)
      .in('lecture_id', lectureIds);

    if (progressError) console.error("Error loading progress", progressError);

    // Create a map for quick lookup: { "lecture-uuid": true/false }
    const progressMap = {};
    if (progressData) {
      progressData.forEach(p => {
        progressMap[p.lecture_id] = p.is_completed;
      });
    }

    // 7. YouTube Helper Function
    function getYouTubeId(url) {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }

    const videoPlayer = document.getElementById('video-player');
    const currentTitle = document.getElementById('current-lecture-title');
    const lectureListContainer = document.getElementById('lecture-list');

    // 8. Progress Bar Logic
    const updateProgressBar = () => {
      const total = lectures.length;
      let completed = 0;
      
      lectures.forEach(l => {
        if (progressMap[l.id]) completed++;
      });

      const percent = Math.round((completed / total) * 100);
      document.getElementById('progress-percent').textContent = `${percent}%`;
      document.getElementById('progress-fill').style.width = `${percent}%`;
    };

    // 9. Handle Checkbox Toggle
    const toggleProgress = async (lectureId, isChecked, checkboxEl, itemContainer) => {
      checkboxEl.disabled = true; // Prevent rapid clicking
      
      // Optimistic UI update
      progressMap[lectureId] = isChecked;
      if (isChecked) {
        itemContainer.classList.add('completed');
      } else {
        itemContainer.classList.remove('completed');
      }
      updateProgressBar();

      // Sync with Supabase
      const { error } = await supabaseClient
        .from('lecture_progress')
        .upsert({ 
          student_id: session.user.id, 
          lecture_id: lectureId, 
          is_completed: isChecked,
          completed_at: isChecked ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'student_id, lecture_id' 
        });

      if (error) {
        console.error("Failed to save progress", error);
        // Revert if error
        progressMap[lectureId] = !isChecked;
        checkboxEl.checked = !isChecked;
        if (!isChecked) itemContainer.classList.add('completed');
        else itemContainer.classList.remove('completed');
        updateProgressBar();
        alert("Could not save progress. Please check your connection.");
      }
      
      checkboxEl.disabled = false;
    };

    // 10. Render Playlist
    const loadVideo = (lecture, element) => {
      const videoId = getYouTubeId(lecture.youtube_url);
      
      document.querySelectorAll('.lecture-item').forEach(el => el.classList.remove('active'));
      element.classList.add('active');
      
      currentTitle.textContent = lecture.title;

      if (videoId) {
        videoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      } else {
        videoPlayer.src = ''; 
        currentTitle.textContent = lecture.title + " (Video Unavailable)";
      }
    };

    lectures.forEach((lecture, index) => {
      const isCompleted = !!progressMap[lecture.id];
      
      const item = document.createElement('div');
      item.className = `lecture-item ${isCompleted ? 'completed' : ''}`;
      
      item.innerHTML = `
        <label class="lecture-checkbox-wrapper" title="Mark as attended">
          <input type="checkbox" class="lecture-checkbox" ${isCompleted ? 'checked' : ''}>
        </label>
        <span class="icon">▶</span>
        <span class="title">${index + 1}. ${lecture.title}</span>
      `;
      
      const checkbox = item.querySelector('.lecture-checkbox');
      
      // Checkbox Click Event (Stop propagation so it doesn't trigger video load)
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      checkbox.addEventListener('change', (e) => {
        toggleProgress(lecture.id, e.target.checked, e.target, item);
      });

      // Item Click Event (Loads Video)
      item.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          loadVideo(lecture, item);
        }
      });
      
      lectureListContainer.appendChild(item);

      // Auto-load the first lecture
      if (index === 0) {
        loadVideo(lecture, item);
      }
    });

    // Initial Progress Calculation
    updateProgressBar();

    // Show the UI
    loadingMsg.style.display = 'none';
    courseContent.style.display = 'grid';

  } catch (error) {
    console.error(error);
    loadingMsg.textContent = error.message || "An error occurred while loading the course.";
    loadingMsg.style.color = "#ff9b9b";
  }
});