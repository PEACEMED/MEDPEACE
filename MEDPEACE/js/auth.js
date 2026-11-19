// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-msg');

  const showError = (msg) => {
    if(errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    } else {
      alert(msg);
    }
  };

  // --- SIGN UP LOGIC ---
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Creating account...';
      btn.disabled = true;

      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const academicYear = document.getElementById('academicYear').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const universityId = document.getElementById('universityId').value;
      if (password !== confirmPassword) {
        showError('Passwords do not match.');
        btn.textContent = 'Sign Up';
        btn.disabled = false;
        return;
      }

      // Supabase Sign Up
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            university_id: universityId,
            academic_year: parseInt(academicYear)
          }
        }
      });

      if (error) {
        showError(error.message);
        btn.textContent = 'Sign Up';
        btn.disabled = false;
      } else {
        // If email confirmation is ON in Supabase, tell user to check email.
        // If OFF, redirect to dashboard immediately.
        alert('Account created successfully! Please check your email to verify (if required), then log in.');
        window.location.href = 'login.html';
      }
    });
  }

  // --- LOGIN LOGIC ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        showError(error.message);
        btn.textContent = 'Sign In';
        btn.disabled = false;
      } else {
        // Redirect to student dashboard (we will build this in Stage 3)
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile && profile.role === 'admin') {
          window.location.href = 'admin/dashboard.html';
        } else {
          window.location.href = 'student/dashboard.html';
        }
      }
    });
  }
});