import { supabase } from "./supabase-config.js";

let basePath = window.location.pathname.includes('-reservation') ? '../' : '';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('client-login-modal')) return;

    const modalHTML = `
    <div id="client-login-modal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity opacity-0 duration-300">
        <div id="client-login-container" class="bg-white flex flex-col md:flex-row w-[90%] max-w-3xl min-h-[450px] rounded-sm overflow-hidden shadow-2xl relative transform scale-95 transition-transform duration-300">
            <!-- Left Side -->
            <div class="hidden md:block w-1/2 relative bg-cover bg-center" style="background-image: url('${basePath}provincial-gym.jpg');">
                <div class="absolute inset-0 bg-black/50 overflow-hidden"></div>
                <div class="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-8">
                    <h2 class="text-3xl font-bold mb-4 drop-shadow-md">Welcome</h2>
                    <p class="text-sm font-light text-gray-100 leading-relaxed drop-shadow-sm">
                        Please log in using your personal<br>information to stay connected<br>with us.
                    </p>
                </div>
            </div>
            
            <!-- Right Side (Forms) -->
            <div class="w-full md:w-1/2 p-10 flex flex-col justify-center relative bg-white">
                <button type="button" id="close-login-modal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                
                <!-- LOGIN VIEW -->
                <div id="login-view" class="flex flex-col w-full transition-opacity duration-300">
                    <h2 class="text-2xl font-bold text-center mb-6 tracking-wide text-gray-900 border-none">LOGIN</h2>
                    <div id="login-error-msg" class="hidden bg-red-100 text-red-600 text-xs p-2 rounded mb-4 text-center border-l-2 border-red-500"></div>
                    
                    <form id="client-login-form" class="flex flex-col gap-4">
                        <div>
                            <input type="email" id="login-email" placeholder="Email" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        <div class="relative">
                            <input type="password" id="login-password-input" placeholder="Password" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                            <button type="button" id="toggle-login-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition bg-transparent border-none">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                        
                        <div class="text-left mb-1">
                            <a href="#" class="text-xs text-cyan-500 hover:text-cyan-600 transition tracking-wide">Forgot password?</a>
                        </div>
                        
                        <button type="submit" id="login-submit-btn" class="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 rounded-sm transition shadow border-none disabled:opacity-75 disabled:cursor-not-allowed">
                            Log In
                        </button>
                        
                        <p class="text-center text-xs text-gray-700 mt-6 tracking-wide">
                            Don't have an account? <a href="#" id="show-signup-link" class="text-cyan-400 hover:text-cyan-500 font-medium border-none underline-none cursor-pointer">Signup</a>
                        </p>
                    </form>
                </div>

                <!-- SIGNUP VIEW -->
                <div id="signup-view" class="hidden flex flex-col w-full transition-opacity duration-300">
                    <h2 class="text-2xl font-bold text-center mb-6 tracking-wide text-gray-900 border-none">SIGN UP</h2>
                    <div id="signup-error-msg" class="hidden bg-red-100 text-red-600 text-xs p-2 rounded mb-4 text-center border-l-2 border-red-500"></div>
                    <div id="signup-success-msg" class="hidden bg-green-100 text-green-700 text-xs p-2 rounded mb-4 text-center border-l-2 border-green-500"></div>
                    
                    <form id="client-signup-form" class="flex flex-col gap-4">
                        <div>
                            <input type="text" id="signup-name" placeholder="Full Name" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        <div>
                            <input type="email" id="signup-email" placeholder="Email" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        <div class="relative">
                            <input type="password" id="signup-password-input" placeholder="Password" minlength="6" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                            <button type="button" id="toggle-signup-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition bg-transparent border-none">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                        <div>
                            <input type="password" id="signup-confirm-password" placeholder="Confirm Password" minlength="6" class="w-full border border-gray-400 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" required>
                        </div>
                        
                        <button type="submit" id="signup-submit-btn" class="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 mt-2 rounded-sm transition shadow border-none disabled:opacity-75 disabled:cursor-not-allowed">
                            Sign Up
                        </button>
                        
                        <p class="text-center text-xs text-gray-700 mt-4 tracking-wide">
                            Already have an account? <a href="#" id="show-login-link" class="text-cyan-400 hover:text-cyan-500 font-medium border-none underline-none cursor-pointer">Login</a>
                        </p>
                    </form>
                </div>

            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('client-login-modal');
    const container = document.getElementById('client-login-container');
    const closeBtn = document.getElementById('close-login-modal');
    
    // View Toggles
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');
    
    // Password toggles
    const toggleLoginPwd = document.getElementById('toggle-login-password');
    const loginPwdInput = document.getElementById('login-password-input');
    const toggleSignupPwd = document.getElementById('toggle-signup-password');
    const signupPwdInput = document.getElementById('signup-password-input');

    // Forms
    const loginForm = document.getElementById('client-login-form');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    
    const signupForm = document.getElementById('client-signup-form');
    const signupErrorMsg = document.getElementById('signup-error-msg');
    const signupSuccessMsg = document.getElementById('signup-success-msg');
    const signupSubmitBtn = document.getElementById('signup-submit-btn');

    const openBtns = document.querySelectorAll('.open-client-login');
    openBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Check current session
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            // If already logged in
            if (user) {
                const wantLogout = confirm('You are currently logged in as ' + user.email + '.\n\nWould you like to LOG OUT? (Click OK to Log Out, or Cancel to stay logged in).');
                if (wantLogout) {
                    await supabase.auth.signOut();
                    alert("You have been successfully logged out!");
                }
                // If they click Cancel, they just stay logged in
                return;
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            void modal.offsetWidth;
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            container.classList.remove('scale-95');
            container.classList.add('scale-100');
            
            // Reset to login view
            signupView.classList.add('hidden');
            loginView.classList.remove('hidden');
            loginForm.reset();
            signupForm.reset();
            loginErrorMsg.classList.add('hidden');
            signupErrorMsg.classList.add('hidden');
            signupSuccessMsg.classList.add('hidden');
        });
    });

    const closeModal = () => {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        container.classList.remove('scale-100');
        container.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Toggle views
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    // Toggle passwords
    const configurePasswordToggle = (toggleBtn, input) => {
        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        });
    };
    configurePasswordToggle(toggleLoginPwd, loginPwdInput);
    configurePasswordToggle(toggleSignupPwd, signupPwdInput);

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = loginPwdInput.value;
        
        loginSubmitBtn.innerText = "Verifying...";
        loginSubmitBtn.disabled = true;
        loginErrorMsg.classList.add('hidden');
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            
            const user = data.user;
            
            // Note: If Supabase requires email confirmation, login will fail with an error
            // "Email not confirmed". We handle that below.
            
            alert("Login successful!");
            closeModal();
            // We should update the UI here (e.g. Change "Client Login" to "My Profile" or similar)
            
        } catch (error) {
            console.error(error);
            loginErrorMsg.classList.remove('hidden');
            if (error.message.includes('Invalid login credentials')) {
                loginErrorMsg.innerText = "Incorrect email or password.";
            } else if (error.message.includes('Email not confirmed')) {
                loginErrorMsg.innerText = "Please verify your email before logging in. Check your inbox.";
            } else if (error.message.includes('rate limit')) {
                loginErrorMsg.innerText = "Too many failed attempts. Try again later.";
            } else {
                loginErrorMsg.innerText = "Login failed: Try Again";
            }
        } finally {
            loginSubmitBtn.innerText = "Log In";
            loginSubmitBtn.disabled = false;
        }
    });

    // Signup Logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = signupPwdInput.value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        signupErrorMsg.classList.add('hidden');
        signupSuccessMsg.classList.add('hidden');
        
        if (password !== confirmPassword) {
            signupErrorMsg.innerText = "Passwords do not match!";
            signupErrorMsg.classList.remove('hidden');
            return;
        }
        
        signupSubmitBtn.innerText = "Creating Account...";
        signupSubmitBtn.disabled = true;
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });
            
            if (error) throw error;
            
            signupForm.reset();
            signupSuccessMsg.innerText = "Account created successfully! A verification link has been sent to your email. Please verify before logging in.";
            signupSuccessMsg.classList.remove('hidden');
            
            // Optionally, switch to login view after 3 seconds
            setTimeout(() => {
                showLoginLink.click();
            }, 5000);
            
        } catch (error) {
            console.error(error);
            signupErrorMsg.classList.remove('hidden');
            if (error.message.includes('already registered')) {
                signupErrorMsg.innerText = "This email is already registered.";
            } else if (error.message.includes('weak password')) {
                signupErrorMsg.innerText = "Password should be at least 6 characters.";
            } else {
                signupErrorMsg.innerText = error.message || "Sign Up failed: Try Again";
            }
        } finally {
            signupSubmitBtn.innerText = "Sign Up";
            signupSubmitBtn.disabled = false;
        }
    });
});
