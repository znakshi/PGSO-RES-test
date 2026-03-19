import { supabase } from "../supabase-config.js";

        // 3. HANDLE LOGIN
        document.getElementById('login-form').addEventListener('submit', async (event) => {
            event.preventDefault(); // Stop page reload

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const errorMsg = document.getElementById('error-msg');

            // Reset UI
            btn.innerText = "Verifying...";
            btn.disabled = true;
            btn.classList.add('opacity-75', 'cursor-not-allowed');
            errorMsg.classList.add('hidden');

            try {
                // Attempt login
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                // If successful, redirect
                window.location.href = "../admin-dashboard/admin-dashboard.html";
                
            } catch (error) {
                console.error("Login Error:", error.message);
                
                // Show Error
                btn.innerText = "Sign In";
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
                errorMsg.classList.remove('hidden');

                if (error.message.includes('Invalid login credentials')) {
                    errorMsg.innerText = "Incorrect email or password.";
                } else if (error.message.includes('rate limit')) {
                    errorMsg.innerText = "Too many failed attempts. Try again later.";
                } else {
                    errorMsg.innerText = "Login failed: Try Again ";
                }
            }
        });