import { supabase } from "../supabase-config.js";

        // --- GLOBAL STATE ---
        let reservations = [];
        let inventory = [];
        let currentDate = new Date();
        let charts = {};
        
        // --- DEFINE FUNCTIONS GLOBALLY ---
        window.switchTab = function(t) {
            ['calendar','analytics','inventory'].forEach(id => {
                document.getElementById('section-'+id).classList.add('hidden');
                document.getElementById('tab-'+id).className = "px-4 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 transition";
            });
            document.getElementById('section-'+t).classList.remove('hidden');
            document.getElementById('tab-'+t).className = "px-4 py-2 rounded-md text-sm font-medium bg-white shadow-sm transition text-gray-900";
            if(t === 'analytics') renderAnalytics();
            if(t === 'inventory') renderInventory();
        };

        window.closeModal = function(id) { document.getElementById(id).classList.add('hidden'); };

        // --- 1. VIEW & EDIT RESERVATION LOGIC ---
        window.viewReservation = function(id) {
            const res = reservations.find(r => r.id === id);
            if(!res) return;

            document.getElementById('edit-res-id').value = res.id;
            document.getElementById('edit-name').value = res.contact.fullName;
            document.getElementById('edit-contact').value = res.contact.contactNumber;
            document.getElementById('edit-email').value = res.contact.email;
            document.getElementById('edit-venue').value = res.event.venue;
            document.getElementById('edit-type').value = res.event.eventType;
            document.getElementById('edit-dates').value = res.event.dates;
            document.getElementById('edit-start').value = res.event.startTime;
            document.getElementById('edit-end').value = res.event.endTime;
            document.getElementById('edit-status').value = res.status;
            document.getElementById('edit-price').value = res.pricing.grandTotal;
            document.getElementById('edit-notes').value = res.notes || "";

            let equipText = "None";
            if(res.equipment && res.equipment.length > 0) {
                equipText = res.equipment.map(e => `${e.qty}x ${e.name} (${e.unit})`).join('\n');
            }
            document.getElementById('edit-equipment-text').value = equipText;

            document.getElementById('reservationModal').classList.remove('hidden');
        };

        window.saveReservationChanges = async function(e) {
            e.preventDefault();
            const id = document.getElementById('edit-res-id').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";

            const res = reservations.find(r => r.id === id);
            try {
                const updatedContact = { 
                    ...res.contact, 
                    fullName: document.getElementById('edit-name').value,
                    contactNumber: document.getElementById('edit-contact').value,
                    email: document.getElementById('edit-email').value
                };
                
                const updatedEvent = {
                    ...res.event,
                    venue: document.getElementById('edit-venue').value,
                    eventType: document.getElementById('edit-type').value,
                    dates: document.getElementById('edit-dates').value,
                    startTime: document.getElementById('edit-start').value,
                    endTime: document.getElementById('edit-end').value
                };
                
                const updatedPricing = {
                    ...res.pricing,
                    grandTotal: parseFloat(document.getElementById('edit-price').value)
                };

                const { error } = await supabase.from('reservations').update({
                    contact: updatedContact,
                    event: updatedEvent,
                    pricing: updatedPricing,
                    status: document.getElementById('edit-status').value,
                    notes: document.getElementById('edit-notes').value
                }).eq('id', id);
                
                if (error) throw error;

                alert("Reservation updated successfully!");
                closeModal('reservationModal');
            } catch (error) {
                console.error("Error updating:", error);
                alert("Error saving changes: " + error.message);
            } finally {
                submitBtn.innerText = originalText;
            }
        };

        // --- PRINT FUNCTION ---
        // REPLACE your existing printReservation function in admin.html with this:

window.printReservation = function(id, event) {
    if(event) event.stopPropagation();
    const res = reservations.find(r => r.id === id);
    if(!res) { alert("Reservation data not found."); return; }

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    
    // --- Helper to split equipment into two columns for the form ---
    const half = Math.ceil((res.equipment?.length || 0) / 2);
    const equipLeft = res.equipment ? res.equipment.slice(0, 5) : []; // First 5 items
    const equipRight = res.equipment ? res.equipment.slice(5, 10) : []; // Next 5 items
    
    // Helper to generate empty rows if list is short
    const fillRows = (arr, max) => {
        let html = '';
        // Add actual items
        arr.forEach(e => {
            html += `<tr><td>${e.name}</td><td class="center">${e.qty}</td><td class="center"></td></tr>`;
        });
        // Add blank rows to fill space
        for(let i=arr.length; i<max; i++) {
            html += `<tr><td>&nbsp;</td><td></td><td></td></tr>`;
        }
        return html;
    };

    // Determine which box to check
    const isPalispis = res.event.venue.includes("Palispis");
    const isGym = res.event.venue.includes("Gymnasium");
    const isPCL = res.event.venue.includes("PCL");
    
    // Date formatting
    const dateGen = new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rental Form - ${res.contact.fullName}</title>
            <style>
                @page { size: A4; margin: 10mm; }
                body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.3; max-width: 800px; margin: 0 auto; }
                
                /* HEADER */
                .header { text-align: center; margin-bottom: 20px; position: relative; }
                .header img { width: 70px; height: 70px; position: absolute; top: 0; }
                .header img.left { left: 40px; }
                .header img.right { right: 40px; }
                .header h3 { margin: 0; font-size: 10pt; font-weight: normal; }
                .header h2 { margin: 0; font-size: 12pt; font-weight: bold; }
                .form-title { text-align: center; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px; margin: 10px 0; font-size: 12pt; }
                
                /* META TOP RIGHT */
                .meta { text-align: right; font-size: 10pt; margin-bottom: 15px; }
                .meta div { margin-bottom: 4px; }
                
                /* ADDRESS BLOCK */
                .addressee { margin-bottom: 15px; font-weight: bold; }
                
                /* BODY TEXT */
                .body-text { text-align: justify; margin-bottom: 10px; text-indent: 30px; }
                .inline-input { border-bottom: 1px solid #000; padding: 0 5px; display: inline-block; min-width: 150px; text-align: center; font-weight: bold; }
                
                /* CHECKBOXES */
                .venues { display: flex; justify-content: space-around; margin: 10px 0 20px 0; padding: 0 20px; }
                .checkbox-item { display: flex; align-items: center; }
                .box { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; margin-right: 5px; text-align: center; line-height: 12px; font-size: 12px; }
                
                /* TABLES */
                .equip-container { display: flex; gap: 20px; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                th, td { border: 1px solid #000; padding: 4px; }
                th { text-align: center; font-weight: bold; background: #f0f0f0; }
                td.center { text-align: center; }
                
                /* DETAILS */
                .details-section { margin-top: 10px; }
                .detail-row { margin-bottom: 5px; display: flex; }
                .detail-label { min-width: 130px; }
                .detail-line { flex-grow: 1; border-bottom: 1px solid #000; padding-left: 10px; font-weight: bold; }
                
                /* CLOSING */
                .closing { margin-top: 20px; text-align: right; }
                .closing-sig { margin-top: 30px; margin-right: 20px; font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 2px; text-align: center; min-width: 200px; }
                
                /* APPROVAL BOX */
                .approval-box { border: 1px solid #000; display: flex; margin-top: 20px; }
                .app-col { flex: 1; border-right: 1px solid #000; padding: 5px; font-size: 9pt; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; }
                .app-col:last-child { border-right: none; }
                .sig-center { text-align: center; margin-top: 30px; font-weight: bold; text-decoration: underline; }
                .sig-title { text-align: center; font-size: 8pt; }
                
                /* PROVISIONS */
                .provisions { font-size: 8pt; margin-top: 10px; text-align: justify; }
                .provisions ol { padding-left: 20px; margin: 0; }
                .provisions li { margin-bottom: 2px; }
                
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            
            <div class="header">
                <img src="benguet.png" class="left" alt="Logo">
                <h3>Republic of the Philippines</h3>
                <h2>PROVINCE OF BENGUET</h2>
                <h3>Capitol, La Trinidad</h3>
                <img src="bagong-pilipinas.png" class="right" alt="Logo" onerror="this.style.display='none'">
            </div>

            <div class="form-title">RENTAL FORM<br><span style="font-size:10pt; font-weight:normal;">(FACILITY)</span></div>

            <div class="meta">
                <div>No.: 2025-F-________</div>
                <div>Date: <u>${dateGen}</u></div>
            </div>

            <div class="addressee">
                HON. MELCHOR D. DICLAS<br>
                Province of Benguet<br>
                Capitol, La Trinidad, Benguet
            </div>

            <div class="body-text">
                The <span class="inline-input" style="min-width:250px"></span> of <span class="inline-input" style="min-width:200px"></span>
                and with contact number <span class="inline-input">${res.contact.contactNumber}</span> respectfully request for the use of the:
            </div>

            <div class="venues">
                <div class="checkbox-item"><span class="box">${isPalispis ? '✓' : '&nbsp;'}</span> Gov. Ben Palispis Auditorium</div>
                <div class="checkbox-item"><span class="box">${isGym ? '✓' : '&nbsp;'}</span> Provincial Gymnasium</div>
                <div class="checkbox-item"><span class="box">${isPCL ? '✓' : '&nbsp;'}</span> PCL Hall</div>
            </div>

            <div style="font-size:10pt; margin-bottom:2px;">Equipment Requested:</div>
            <div class="equip-container">
                <table>
                    <thead><tr><th>FACILITY/EQUIPMENT</th><th>QTY</th><th>NO. OF HRS</th></tr></thead>
                    <tbody>${fillRows(equipLeft, 5)}</tbody>
                </table>
                <table>
                    <thead><tr><th>FACILITY/EQUIPMENT</th><th>QTY</th><th>NO. OF HRS</th></tr></thead>
                    <tbody>${fillRows(equipRight, 5)}</tbody>
                </table>
            </div>

            <div style="font-size: 10pt; font-weight:bold; margin-bottom: 10px;">
                NOTE: Plus PHP 3,000.00 security deposit.<br>
                <div style="display:flex; gap:30px; margin-top:5px; font-weight:normal;">
                    <div style="display:flex; align-items:center;">
                        <span style="color:red; font-weight:bold; margin-right:5px;">**</span> 
                        <span class="box">${res.event.registrationFee === 'With Registration Fee' ? '✓' : ''}</span> With Registration Fee
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="box">${res.event.registrationFee === 'Without Registration Fee' ? '✓' : ''}</span> Without Registration Fee
                    </div>
                </div>
            </div>

            <div class="details-section">
                <div class="detail-row">
                    <span class="detail-label">Inclusive date/s of use :</span>
                    <span class="detail-line">${res.event.dates}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Inclusive time of use :</span>
                    <span class="detail-line">${res.event.startTime} - ${res.event.endTime} (${res.event.totalHours || 0} hours)</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Purpose :</span>
                    <span class="detail-line">${res.event.eventType}</span>
                </div>
            </div>

            <div style="margin-top: 15px;">We shall appreciate your favorable action on this request.</div>

            <div class="closing">
                Very truly yours,<br><br>
                <div class="closing-sig">${res.contact.fullName.toUpperCase()}</div><br>
                <span style="font-size:9pt; margin-right:30px;">Signature over Printed Name and Date</span>
            </div>

            <div class="approval-box">
                <div class="app-col">
                    <div>Venue Available:</div>
                    <div class="sig-center">JENNIFER G. BAHOD</div>
                    <div class="sig-title">Provincial General Services Officer</div>
                </div>
                <div class="app-col">
                    <div>Approved by:</div>
                    <div class="sig-center">MELCHOR D. DICLAS, M.D.</div>
                    <div class="sig-title">Provincial Governor</div>
                </div>
                <div class="app-col">
                    <div>
                        Payment: Rent _______ Security _______<br>
                        Amount: <u>₱${res.pricing.grandTotal.toLocaleString()}</u><br>
                        OR No.: ____________
                    </div>
                    <div class="sig-center">______________________</div>
                    <div class="sig-title">PTO Representative</div>
                </div>
            </div>

            <div class="provisions">
                <strong>ADMINISTRATIVE PROVISIONS:</strong>
                <ol>
                    <li>The requesting party renting the facility shall provide adequate security to maintain peace and order. It shall maintain the cleanliness of the venue at all times.</li>
                    <li>Equipment and/or Facility must be clean after use.</li>
                    <li>Requesting party shall COORDINATE with the PGSO Custodian before their scheduled activity and to present the approved RENTAL FORM for coordination of the activity.</li>
                    <li>The requesting party shall pay the preparation day and should not exceed the date stated above, unless approved and have paid the corresponding rent.</li>
                    <li>Priority shall be given to government activities and functions.</li>
                    <li>Damages or losses of the facilities, equipment, or fixture, shall be the sole responsibility of the requesting party. He shall make necessary repair for damages and replace any equipment destroyed.</li>
                    <li>Security deposit of ₱3,000.00 will be collected to cover any extensions and/or damages incurred, and to be refunded after clearance from the personnel in charge.</li>
                    <li>The electricity consumption of any equipment being brought by the requesting party should pay the corresponding amount based on the computation of the electrical engineer.</li>
                    <li>Event and occasions that require a large audience or general entry are strongly discouraged in order to protect the facility and its equipment.</li>
                    <li>In case of cancellation, inform the office one week prior. Otherwise, paid rent is non-refundable.</li>
                    <li>When water & electricity supply is not available due to uncontrollable/unforeseen circumstances, the Benguet Provincial Government is NOT responsible to supply water & electricity.</li>
                </ol>
                <strong>I have read and understood the administrative provisions</strong>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #3c5473; color: white; border: none; cursor: pointer;">Print Page</button>
            </div>

        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

        // --- SUPABASE LISTENERS ---
        const fetchReservations = async () => {
            const { data } = await supabase.from('reservations').select('*');
            reservations = data || [];
            renderCalendar(); 
            const todayStr = new Date().toISOString().split('T')[0];
            renderReservationList(todayStr);
            renderAnalytics();
            if(!document.getElementById('section-inventory').classList.contains('hidden')) renderInventory();
        };

        supabase.channel('reservations-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                fetchReservations();
            }).subscribe();

        fetchReservations();

        // --- STATUS & DELETE ACTIONS ---
        window.setStatus = async function(id, status, event) {
            if(event) event.stopPropagation();
            try { 
                const { error } = await supabase.from('reservations').update({ status: status }).eq('id', id); 
                if (error) throw error;
            }
            catch(e) { alert("Error: " + e.message); }
        };

        window.deleteRes = async function(id, event) {
            if(event) event.stopPropagation();
            if(confirm("Delete this reservation?")) {
                try { 
                    const { error } = await supabase.from('reservations').delete().eq('id', id);
                    if (error) throw error;
                }
                catch(e) { alert("Error: " + e.message); }
            }
        };

        // --- CALENDAR LOGIC ---
        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            const monthTitle = document.getElementById('currentMonthYear');
            grid.innerHTML = "";
            monthTitle.innerText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
            for(let i=1; i<=daysInMonth; i++) {
                const cell = document.createElement('div');
                cell.className = "cal-cell";
                cell.innerText = i;
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                const events = reservations.filter(r => r.event.dates && r.event.dates.includes(dateStr));
                if(events.length > 0) {
                    cell.classList.add('has-event');
                    if(events.some(e => e.status === 'declined')) cell.classList.add('status-declined');
                    else if(events.some(e => e.status === 'pending')) cell.classList.add('status-pending');
                    else cell.classList.add('status-confirmed');
                }
                cell.onclick = () => {
                    document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('cal-selected'));
                    cell.classList.add('cal-selected');
                    renderReservationList(dateStr);
                };
                grid.appendChild(cell);
            }
        }
        document.getElementById('prevMonth').onclick = () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); };
        document.getElementById('nextMonth').onclick = () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); };

        // --- SIDEBAR LIST ---
        function renderReservationList(dateStr) {
            const list = document.getElementById('reservation-list');
            const displayDate = new Date(dateStr);
            if (!isNaN(displayDate)) { document.getElementById('selected-date-display').innerText = displayDate.toLocaleDateString('en-US', {weekday:'short', month:'long', day:'numeric'}); }
            list.innerHTML = "";
            const matches = reservations.filter(r => r.event.dates && r.event.dates.includes(dateStr));
            if(matches.length === 0) { list.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-400"><p>No reservations.</p></div>`; return; }
            matches.forEach(res => {
                const card = document.createElement('div');
                card.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white cursor-pointer relative group";
                card.onclick = () => viewReservation(res.id);
                let badge = res.status === 'pending' ? "bg-yellow-100 text-yellow-800" : res.status === 'confirmed' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div><h4 class="font-bold text-gray-900 group-hover:text-pgso-blue transition">${res.contact.fullName}</h4><p class="text-xs text-gray-500">${res.event.venue}</p></div>
                        <span class="${badge} text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">${res.status}</span>
                    </div>
                    <div class="text-xs text-gray-600 space-y-1 mb-3 pt-2 border-t border-gray-100">
                        <p><strong>Time:</strong> ${res.event.startTime} - ${res.event.endTime}</p>
                        <p><strong>Total:</strong> ₱${(res.pricing.grandTotal).toLocaleString()}</p>
                    </div>
                    <div class="flex gap-2 relative z-10">
                        ${res.status === 'pending' ? `<button onclick="setStatus('${res.id}', 'confirmed', event)" class="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold hover:bg-green-700">Accept</button><button onclick="setStatus('${res.id}', 'declined', event)" class="flex-1 bg-red-500 text-white py-1.5 rounded text-xs font-bold hover:bg-red-600">Decline</button>` : ''}
                        ${res.status === 'confirmed' ? `<button onclick="printReservation('${res.id}', event)" class="px-3 border border-gray-200 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50" title="Print Permit"><i class="fa-solid fa-print"></i></button>` : ''}
                        <button onclick="deleteRes('${res.id}', event)" class="px-3 border border-gray-200 rounded text-red-400 hover:text-red-600 hover:bg-red-50"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        // --- ANALYTICS ---
        function renderAnalytics() {
            const confirmed = reservations.filter(r => r.status === 'confirmed').length;
            const pending = reservations.filter(r => r.status === 'pending').length;
            const declined = reservations.filter(r => r.status === 'declined').length;
            document.getElementById('stat-total-bookings').innerText = reservations.length;
            document.getElementById('stat-pending').innerText = pending;
            document.getElementById('stat-cancelled').innerText = declined;

            if(charts.venue) charts.venue.destroy();
            if(charts.line) charts.line.destroy();

            const venues = {};
            reservations.forEach(r => { venues[r.event.venue] = (venues[r.event.venue] || 0) + 1; });
            let topV = "N/A", max=0;
            for(let v in venues) { if(venues[v]>max){ max=venues[v]; topV=v; } }
            document.getElementById('stat-venue').innerText = topV;

            const ctxV = document.getElementById('venueChart').getContext('2d');
            charts.venue = new Chart(ctxV, {
                type: 'bar',
                data: { labels: Object.keys(venues), datasets: [{ label: 'Bookings', data: Object.values(venues), backgroundColor: '#3c5473' }] },
                options: { responsive: true, maintainAspectRatio: false }
            });

            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthlyData = new Array(12).fill(0);
            reservations.forEach(r => {
                if(r.timestamp) {
                    const d = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp); 
                    monthlyData[d.getMonth()]++;
                }
            });
            const ctxL = document.getElementById('lineChart').getContext('2d');
            charts.line = new Chart(ctxL, {
                type: 'line',
                data: { labels: months, datasets: [{ label: 'Reservations', data: monthlyData, borderColor: '#8b5cf6', tension: 0.3, fill: true, backgroundColor: 'rgba(139, 92, 246, 0.1)' }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // --- INVENTORY LOGIC (UPDATED WITH CATEGORY) ---
        const fetchInventory = async () => {
            const { data } = await supabase.from('inventory').select('*');
            inventory = data || [];
            renderInventory(); 
        };

        supabase.channel('inventory-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
                fetchInventory();
            }).subscribe();

        fetchInventory();



function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = "";
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Filter for reservations happening TODAY
    const activeRes = reservations.filter(r => 
        (r.status === 'confirmed' || r.status === 'pending') && 
        r.event.dates && r.event.dates.includes(todayStr)
    );

    // 2. SORTING LOGIC: Category Priority + Alphabetical
    const sortedInventory = [...inventory].sort((a, b) => {
        // Define Priority: 1=Equipment, 2=Service, 3=Package
        const getPriority = (cat) => {
            if (!cat || cat === 'equipment') return 1;
            if (cat === 'service') return 2;
            if (cat === 'package') return 3;
            return 4; // Others
        };

        const prioA = getPriority(a.category);
        const prioB = getPriority(b.category);

        // First, compare Priority
        if (prioA !== prioB) {
            return prioA - prioB; 
        }

        // If priority matches, sort Alphabetically by Name
        return a.name.localeCompare(b.name);
    });

    // 3. Loop through the SORTED list
    sortedInventory.forEach(item => {
        let used = 0;
        
        activeRes.forEach(r => {
            if (r.equipment) {
                const eq = r.equipment.find(e => {
                    if (e.id && item.id) return e.id === item.id;
                    return e.name === item.name;
                });
                if (eq) used += parseInt(eq.qty || 0);
            }
        });

        const avail = item.qty - used;
        const cat = item.category ? item.category.toUpperCase() : 'EQUIPMENT';
        
        // Define colors based on category
        let catColor = 'text-gray-500 bg-gray-100';
        if (cat === 'PACKAGE') catColor = 'text-purple-600 bg-purple-50';
        if (cat === 'SERVICE') catColor = 'text-orange-600 bg-orange-50';

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b border-gray-50">
                <td class="px-4 py-3 font-medium">
                    <span class="text-[10px] font-bold px-2 py-1 rounded ${catColor} mr-2 w-16 inline-block text-center">${cat}</span>
                    ${item.name}
                </td>
                <td class="px-4 py-3 text-gray-500">${item.unit}</td>
                <td class="px-4 py-3">₱${item.price}</td>
                <td class="px-4 py-3 text-center font-bold">${item.qty}</td>
                <td class="px-4 py-3 text-center text-orange-600">${used > 0 ? used : '-'}</td>
                <td class="px-4 py-3 text-center font-bold ${avail<=0?'text-red-600':'text-green-600'}">${avail}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="openInventoryModal('${item.id}')" class="text-blue-600 hover:underline text-xs mr-3 font-medium">Edit</button>
                    <button onclick="deleteInventoryItem('${item.id}')" class="text-red-500 hover:underline text-xs font-medium">Delete</button>
                </td>
            </tr>
        `;
    });
}

        window.openInventoryModal = function(id=null) {
            document.getElementById('inventoryModal').classList.remove('hidden');
            if(id) {
                const item = inventory.find(i => i.id === id);
                document.getElementById('inv-modal-title').innerText = "Edit Item";
                document.getElementById('inv-id').value = item.id;
                document.getElementById('inv-category').value = item.category || 'equipment'; // Default
                document.getElementById('inv-name').value = item.name;
                document.getElementById('inv-unit').value = item.unit;
                document.getElementById('inv-price').value = item.price;
                document.getElementById('inv-qty').value = item.qty;
            } else {
                document.getElementById('inv-modal-title').innerText = "Add Item";
                document.getElementById('inv-id').value = "";
                document.forms[0].reset();
                document.getElementById('inv-category').value = 'equipment';
            }
        };

        window.saveInventoryItem = async function(e) {
            e.preventDefault();
            const id = document.getElementById('inv-id').value;
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Saving...";

            const itemData = {
                category: document.getElementById('inv-category').value,
                name: document.getElementById('inv-name').value.trim(),
                unit: document.getElementById('inv-unit').value.trim(),
                price: parseFloat(document.getElementById('inv-price').value),
                qty: parseInt(document.getElementById('inv-qty').value) 
            };

            try {
                if(id) {
                    const { error } = await supabase.from('inventory').update(itemData).eq('id', id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('inventory').insert([itemData]);
                    if (error) throw error;
                }
                document.getElementById('inventoryModal').classList.add('hidden');
                alert("Inventory updated!");
            } catch(err) {
                console.error(err);
                alert("Error saving: " + err.message);
            } finally {
                btn.innerText = originalText;
            }
        };

        window.deleteInventoryItem = async function(id) {
            if(!confirm("Permanently delete this item?")) return;
            try {
                const { error } = await supabase.from('inventory').delete().eq('id', id);
                if (error) throw error;
            } catch(err) {
                alert("Error deleting: " + err.message);
            }
        }