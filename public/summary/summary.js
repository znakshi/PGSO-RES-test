import { supabase } from "../supabase-config.js";

    // Helpers
    const formatCurrency = (amount) => '₱' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const safeText = (text) => (text && text !== "") ? text : "N/A";

    window.returnHome = function() { window.location.href = '../index.html'; }
    
    // --- RULES POPUP LOGIC ---
    window.openRules = function() {
        document.getElementById('rulesModal').classList.remove('hidden');
    }
    
    window.closeRules = function() {
        document.getElementById('rulesModal').classList.add('hidden');
    }

    // Enable/Disable Submit Button based on Checkbox
    const agreeCheckbox = document.getElementById('agree-checkbox');
    const finalSubmitBtn = document.getElementById('final-submit-btn');
    
    agreeCheckbox.addEventListener('change', function() {
        if(this.checked) {
            finalSubmitBtn.disabled = false;
            finalSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            finalSubmitBtn.classList.add('hover:bg-opacity-90');
        } else {
            finalSubmitBtn.disabled = true;
            finalSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            finalSubmitBtn.classList.remove('hover:bg-opacity-90');
        }
    });

    window.goBack = function() {
        const data = JSON.parse(localStorage.getItem('pgsoReservationData'));
        if(!data) return window.location.href = '../index.html';
        const venueName = data.event.venue;
        let backUrl = "../index.html";
        if (venueName.includes("Palispis")) backUrl = "../palispis-reservation/palispis-reservation.html";
        else if (venueName.includes("PCL")) backUrl = "../pcl-reservation/pcl-reservation.html";
        else if (venueName.includes("Gymnasium")) backUrl = "../gym-reservation/gym-reservation.html";
        window.location.href = backUrl;
    };

    window.submitReservation = async function() {
        const data = JSON.parse(localStorage.getItem('pgsoReservationData'));
        if (!data) return alert("No data found.");

        const submitBtn = document.getElementById('final-submit-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        try {
            const { error } = await supabase.from('reservations').insert([{
                ...data,
                status: "pending",
                submittedAt: new Date().toISOString(),
                timestamp: new Date().toISOString()
            }]);
            
            if (error) throw error;

            document.getElementById('rulesModal').classList.add('hidden'); // Close rules
            document.getElementById('successModal').classList.remove('hidden'); // Show success
            localStorage.removeItem('pgsoReservationData'); 

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error sending reservation: " + error.message);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        const data = JSON.parse(localStorage.getItem('pgsoReservationData'));
        if (!data) {
            alert("No reservation data found. Redirecting to home.");
            window.location.href = '../index.html';
            return;
        }

        document.getElementById('summary-name').textContent = safeText(data.contact.fullName);
        document.getElementById('summary-contact').textContent = safeText(data.contact.contactNumber);
        document.getElementById('summary-email').textContent = safeText(data.contact.email);
        document.getElementById('summary-venue').textContent = safeText(data.event.venue);
        document.getElementById('summary-event-type').textContent = safeText(data.event.eventType);
        document.getElementById('summary-date').textContent = safeText(data.event.dates);
        document.getElementById('summary-time').textContent = `${data.event.startTime} - ${data.event.endTime}`;
        document.getElementById('summary-duration').textContent = safeText(data.event.durationLabel);
        document.getElementById('summary-notes').textContent = safeText(data.notes);

        const equipTbody = document.getElementById('equipment-summary-tbody');
        if (data.equipment && data.equipment.length > 0) {
            equipTbody.innerHTML = "";
            data.equipment.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 text-gray-700 font-medium">${item.name}</td>
                    <td class="px-6 py-4 text-center">${item.qty}</td>
                    <td class="px-6 py-4 text-gray-500">${item.unit}</td>
                    <td class="px-6 py-4 text-right">${formatCurrency(item.price)}</td>
                    <td class="px-6 py-4 text-right font-bold text-gray-900">${formatCurrency(item.subtotal)}</td>
                `;
                equipTbody.appendChild(row);
            });
        } else {
            document.getElementById('no-equipment-message').classList.remove('hidden');
        }

        document.getElementById('summary-base-rental').textContent = formatCurrency(data.pricing.venueTotal);
        document.getElementById('summary-equipment-cost').textContent = formatCurrency(data.pricing.equipmentTotal);
        document.getElementById('summary-total-amount').textContent = formatCurrency(data.pricing.grandTotal);
        
        const editLink = document.getElementById('edit-reservation-link');
        let backUrl = "../index.html";
        if (data.event.venue.includes("Palispis")) backUrl = "../palispis-reservation/palispis-reservation.html";
        else if (data.event.venue.includes("PCL")) backUrl = "../pcl-reservation/pcl-reservation.html";
        else if (data.event.venue.includes("Gymnasium")) backUrl = "../gym-reservation/gym-reservation.html";
        editLink.href = backUrl;
    });