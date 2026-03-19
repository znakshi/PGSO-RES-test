import { supabase } from "../supabase-config.js";

document.addEventListener('DOMContentLoaded', async function () {
    // --- CONSTANTS ---
    const OVERTIME_RATE = 400;
    const SECURITY_DEPOSIT = 3000;
    const VENUE_NAME = "Provincial Gymnasium";

    // --- DOM ELEMENTS ---
    const allTextInputs = document.querySelectorAll('input[type="text"]');
    const nameInput = allTextInputs[0];
    const contactInput = allTextInputs[1];
    const eventTypeInput = allTextInputs[2];
    const emailInput = document.querySelector('input[type="email"]');
    const notesInput = document.querySelector('textarea');
    const durationRadios = document.getElementsByName('duration');
    const startTimeInput = document.querySelectorAll('input[type="time"]')[0];
    const endTimeInput = document.querySelectorAll('input[type="time"]')[1];

    // IMPORTANT: matches the ID added in HTML
    const tableBody = document.getElementById('equipment-table-body');
    const summaryBtn = document.querySelector('button.pgso-btn');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    // --- STATE ---
    let currentDate = new Date();
    let today = new Date();
    let selectedDates = [];
    let BLOCKED_DATES = [];
    let globalInventory = [];

    // ==========================================
    // 1. IMPROVED EVENT LISTENERS (Delegation)
    // ==========================================
    if (tableBody) {
        // Checkbox Click Logic
        tableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('equipment-checkbox')) {
                const row = e.target.closest('tr');
                const qtyInput = row.querySelector('.equipment-quantity');
                qtyInput.disabled = !e.target.checked;
                qtyInput.value = e.target.checked ? 1 : 0;
                calculateTotal();
            }
        });

        // Quantity Input Logic with Alert
        tableBody.addEventListener('input', (e) => {
            if (e.target.classList.contains('equipment-quantity')) {
                const input = e.target;
                const max = parseInt(input.max);
                const currentVal = parseInt(input.value);

                if (currentVal > max) {
                    alert(`Sorry, only ${max} units are available for these dates.`);
                    input.value = max; // Snap back to max
                }
                calculateTotal();
            }
        });
    }

    // ==========================================
    // 2. LOAD INVENTORY
    // ==========================================
    async function loadInventory() {
        if (!tableBody) return;
        try {
            const { data: snapshot, error } = await supabase.from('inventory').select('*');
            if (error) throw error;
            globalInventory = [];
            tableBody.innerHTML = "";

            if (!snapshot || snapshot.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5' class='text-center p-4'>No equipment found.</td></tr>";
                return;
            }

            snapshot.forEach(item => {
                globalInventory.push({ ...item });

                const row = document.createElement('tr');
                row.dataset.id = item.id;
                row.dataset.price = item.price;
                row.dataset.unit = item.unit;
                row.dataset.name = item.name;

                row.innerHTML = `
                        <td class="p-4"><input type="checkbox" class="equipment-checkbox w-4 h-4 rounded"></td>
                        <td class="py-3 text-gray-900 equipment-name">${item.name}</td>
                        <td class="py-3">${item.unit}</td>
                        <td class="py-3">₱${item.price}</td>
                        <td class="py-3"><input type="number" min="0" value="0" class="equipment-quantity form-input w-full rounded p-1 text-center" disabled></td>
                    `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error loading inventory:", error);
        }
    }

    // ==========================================
    // 3. CHECK AVAILABILITY
    // ==========================================
    async function updateInventoryLimits() {
        const equipmentRows = document.querySelectorAll('#equipment-table-body tr');

        // Step A: Reset UI First
        equipmentRows.forEach(row => {
            const nameCell = row.querySelector('.equipment-name');
            const cleanName = row.dataset.name;
            nameCell.innerHTML = cleanName;
            row.classList.remove('bg-gray-100', 'opacity-50');

            const checkbox = row.querySelector('.equipment-checkbox');
            const qtyInput = row.querySelector('.equipment-quantity');

            if (!checkbox.checked) {
                qtyInput.disabled = true;
                qtyInput.value = 0;
            }
        });

        if (selectedDates.length === 0) return;

        // Step B: Calculate Usage
        const { data: resSnapshot, error } = await supabase.from('reservations').select('*');
        if (error) { console.error(error); return; }
        const usageMap = {};

        resSnapshot.forEach(data => {
            if (data.status !== 'declined' && data.event.dates && data.equipment) {
                const bookedDates = data.event.dates.split(', ');
                if (bookedDates.some(date => selectedDates.includes(date))) {
                    data.equipment.forEach(item => {
                        const key = item.id || item.name;
                        if (!usageMap[key]) usageMap[key] = 0;
                        usageMap[key] += item.qty;
                    });
                }
            }
        });

        // Step C: Apply Limits based on Usage
        equipmentRows.forEach(row => {
            const itemId = row.dataset.id;
            const itemName = row.dataset.name;
            const dbItem = globalInventory.find(i => i.id === itemId);
            if (!dbItem) return;

            const maxStock = parseInt(dbItem.qty || 0);
            const usedStock = (usageMap[itemId] || 0) + (usageMap[itemName] || 0);
            const available = maxStock - usedStock;

            const qtyInput = row.querySelector('.equipment-quantity');
            const checkbox = row.querySelector('.equipment-checkbox');
            const nameCell = row.querySelector('.equipment-name');

            qtyInput.max = available;

            if (available <= 0) {
                // Out of Stock Logic
                checkbox.checked = false;
                checkbox.disabled = true;
                qtyInput.value = 0;
                qtyInput.disabled = true;
                nameCell.innerHTML = `${itemName} <span class="text-red-500 text-xs font-bold">(Out of Stock)</span>`;
                row.classList.add('bg-gray-100', 'opacity-50');
            } else {
                // Available Logic
                if (checkbox.disabled) checkbox.disabled = false;
                nameCell.innerHTML = `${itemName} <span class="text-green-600 text-xs">(${available} available)</span>`;

                // Auto-correct if they already typed too much
                if (parseInt(qtyInput.value) > available) {
                    qtyInput.value = available;
                }
            }
        });
        calculateTotal();
    }

    // ==========================================
    // 4. CALENDAR & BLOCKED DATES
    // ==========================================
    async function fetchBlockedDates() {
        const { data: querySnapshot, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('event->>venue', VENUE_NAME);
        if (error) { console.error(error); return; }
        
        BLOCKED_DATES = [];
        querySnapshot.forEach((data) => {
            if (data.status !== 'declined' && data.event.dates) {
                const datesArray = data.event.dates.split(', ');
                datesArray.forEach(date => { if (!BLOCKED_DATES.includes(date)) BLOCKED_DATES.push(date); });
            }
        });
        renderCalendar();
    }

    function renderCalendar() {
        calendarGrid.innerHTML = "";
        currentMonthYear.innerText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) calendarGrid.appendChild(document.createElement('div'));

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('cal-cell');
            dayCell.innerText = i;
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (new Date(year, month, i).setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
                dayCell.classList.add('cal-past');
            } else if (BLOCKED_DATES.includes(cellDateStr)) {
                dayCell.classList.add('cal-reserved');
            } else {
                dayCell.classList.add('cal-available');
                if (selectedDates.includes(cellDateStr)) dayCell.classList.add('cal-selected');
                dayCell.addEventListener('click', function () {
                    if (selectedDates.includes(cellDateStr)) {
                        selectedDates = selectedDates.filter(d => d !== cellDateStr);
                        this.classList.remove('cal-selected');
                    } else {
                        selectedDates.push(cellDateStr);
                        this.classList.add('cal-selected');
                    }
                    updateInventoryLimits();
                });
            }
            calendarGrid.appendChild(dayCell);
        }
    }

    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // ==========================================
    // 5. CALCULATE TOTAL
    // ==========================================
    function calculateTotal() {
        const equipmentRows = document.querySelectorAll('#equipment-table-body tr');
        const totalDays = selectedDates.length || 0;
        let baseDuration = 0;
        let basePrice = 0;
        let durationLabel = "";

        const selectedRadio = document.querySelector('input[name="duration"]:checked');
        if (selectedRadio) {
            baseDuration = parseInt(selectedRadio.dataset.durationValue);
            durationLabel = selectedRadio.nextElementSibling.innerText.trim();
            basePrice = baseDuration === 4 ? 1500 : 2500;
        }

        let hoursDuration = baseDuration;
        let overtimeCost = 0;

        if (startTimeInput.value && endTimeInput.value) {
            const start = new Date(`1970-01-01T${startTimeInput.value}Z`);
            const end = new Date(`1970-01-01T${endTimeInput.value}Z`);
            let diffMs = end - start;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
            const exactHours = diffMs / (1000 * 60 * 60);
            if (exactHours > 0) hoursDuration = exactHours;
            if (hoursDuration > baseDuration && baseDuration > 0) overtimeCost = Math.ceil(hoursDuration - baseDuration) * OVERTIME_RATE;
        }

        const totalVenueCost = (basePrice + overtimeCost) * (totalDays || 1);
        let totalEquipmentCost = 0;

        equipmentRows.forEach(row => {
            const checkbox = row.querySelector('.equipment-checkbox');
            const qtyInput = row.querySelector('.equipment-quantity');

            if (checkbox && checkbox.checked) {
                const price = parseFloat(row.dataset.price);
                const qty = parseInt(qtyInput.value) || 0;
                const days = totalDays || 1;

                if (row.dataset.unit.includes('hour')) {
                    const billingHours = Math.ceil(hoursDuration) > 0 ? Math.ceil(hoursDuration) : 1;
                    totalEquipmentCost += price * qty * billingHours * days;
                } else {
                    totalEquipmentCost += price * qty * days;
                }
            }
        });

        const displayVenue = totalDays === 0 ? 0 : totalVenueCost;
        const subTotal = displayVenue + totalEquipmentCost;
        const grandTotal = subTotal + SECURITY_DEPOSIT;

        document.getElementById('days-reserved-display').textContent = `${totalDays} day(s)`;

        if (overtimeCost > 0) {
            document.getElementById('base-price-display').innerHTML = `₱${(basePrice * (totalDays || 1)).toLocaleString()} <span class="text-xs text-red-500">(+₱${(overtimeCost * (totalDays || 1)).toLocaleString()} OT)</span>`;
        } else {
            document.getElementById('base-price-display').textContent = `₱${displayVenue.toLocaleString()}`;
        }

        document.getElementById('equipment-cost-display').textContent = `₱${totalEquipmentCost.toLocaleString()}`;
        document.getElementById('subtotal-display').textContent = `₱${subTotal.toLocaleString()}`;
        document.getElementById('estimated-total-display').textContent = `₱${grandTotal.toLocaleString()}`;

        return { totalVenueCost, totalEquipmentCost, grandTotal, hoursDuration, durationLabel, totalDays };
    }

    // --- LISTENERS ---
    durationRadios.forEach(r => r.addEventListener('change', calculateTotal));
    startTimeInput.addEventListener('change', calculateTotal);
    endTimeInput.addEventListener('change', calculateTotal);

    // Clear validation highlights
    [nameInput, contactInput, emailInput, eventTypeInput, startTimeInput, endTimeInput].forEach(el => {
        if (el) {
            el.addEventListener('input', () => el.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50'));
            el.addEventListener('change', () => el.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50'));
        }
    });
    if (calendarGrid) {
        calendarGrid.addEventListener('click', () => calendarGrid.parentElement.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50'));
    }

    summaryBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Reset previous highlights
        const allInputsElements = [nameInput, contactInput, emailInput, eventTypeInput, startTimeInput, endTimeInput, calendarGrid.parentElement];
        allInputsElements.forEach(el => {
            if (el) el.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50');
        });

        let isValid = true;
        let firstInvalidEl = null;

        const checkField = (el, condition) => {
            if (!condition && el) {
                el.classList.add('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = el;
            }
        };

        checkField(nameInput, nameInput.value.trim() !== '');
        checkField(emailInput, emailInput.value.trim() !== '');
        checkField(eventTypeInput, eventTypeInput.value.trim() !== '');
        checkField(contactInput, contactInput.value.trim() !== '' && /^\d{11}$/.test(contactInput.value.trim()));
        checkField(calendarGrid.parentElement, selectedDates.length > 0);
        checkField(startTimeInput, startTimeInput.value !== '');
        checkField(endTimeInput, endTimeInput.value !== '');

        if (!isValid) {
            if (firstInvalidEl) firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const calc = calculateTotal();
        const regFee = document.querySelector('input[name="regFee"]:checked').value;
        const equipmentList = [];

        const equipmentRows = document.querySelectorAll('#equipment-table-body tr');
        equipmentRows.forEach(row => {
            const checkbox = row.querySelector('.equipment-checkbox');
            const qtyInput = row.querySelector('.equipment-quantity');

            if (checkbox && checkbox.checked) {
                const price = parseFloat(row.dataset.price);
                const qty = parseInt(qtyInput.value);
                const days = calc.totalDays || 1;
                let sub = row.dataset.unit.includes('hour') ? price * qty * (Math.ceil(calc.hoursDuration) || 1) * days : price * qty * days;

                equipmentList.push({
                    id: row.dataset.id,
                    name: row.dataset.name,
                    unit: row.dataset.unit,
                    qty: qty,
                    price: price,
                    subtotal: sub
                });
            }
        });

        const reservationData = {
            contact: { fullName: nameInput.value, contactNumber: contactInput.value, email: emailInput.value },
            event: {
                venue: VENUE_NAME,
                eventType: eventTypeInput.value,
                registrationFee: regFee,
                dates: selectedDates.sort().join(', '),
                startTime: startTimeInput.value,
                endTime: endTimeInput.value,
                durationLabel: calc.durationLabel,
                totalHours: Math.ceil(calc.hoursDuration)
            },
            equipment: equipmentList,
            pricing: { venueTotal: calc.totalVenueCost, equipmentTotal: calc.totalEquipmentCost, securityDeposit: SECURITY_DEPOSIT, grandTotal: calc.grandTotal },
            notes: notesInput.value
        };

        localStorage.setItem('pgsoReservationData', JSON.stringify(reservationData));
        window.location.href = '../summary/summary.html';
    });

    // ==========================================
    // 6. RESTORE DATA
    // ==========================================
    function loadSavedData() {
        const savedJSON = localStorage.getItem('pgsoReservationData');
        if (!savedJSON) return;
        const data = JSON.parse(savedJSON);
        if (data.event.venue !== VENUE_NAME) return;

        const clean = (val) => (val === "N/A" ? "" : val);

        if (data.contact) {
            nameInput.value = clean(data.contact.fullName);
            contactInput.value = clean(data.contact.contactNumber);
            emailInput.value = clean(data.contact.email);
        }
        if (data.event) {
            eventTypeInput.value = clean(data.event.eventType);
            startTimeInput.value = data.event.startTime || "";
            endTimeInput.value = data.event.endTime || "";

            if (data.event.durationLabel) {
                if (data.event.durationLabel.includes('4')) document.getElementById('duration-4').checked = true;
                else document.getElementById('duration-8').checked = true;
            }
            if (data.event.registrationFee) {
                const regRadio = document.querySelector(`input[name="regFee"][value="${data.event.registrationFee}"]`);
                if (regRadio) regRadio.checked = true;
            }
            if (data.event.dates && data.event.dates.length > 0) {
                selectedDates = data.event.dates.split(', ');
            }
        }
        if (data.notes) notesInput.value = clean(data.notes);

        if (data.equipment && data.equipment.length > 0) {
            const equipmentRows = document.querySelectorAll('#equipment-table-body tr');
            equipmentRows.forEach(row => {
                const rowId = row.dataset.id;
                const rowName = row.dataset.name;
                const savedItem = data.equipment.find(item => item.id === rowId || item.name === rowName);

                if (savedItem) {
                    const checkbox = row.querySelector('.equipment-checkbox');
                    const qtyInput = row.querySelector('.equipment-quantity');
                    if (checkbox && qtyInput) {
                        checkbox.checked = true;
                        qtyInput.disabled = false;
                        qtyInput.value = savedItem.qty;
                    }
                }
            });
        }
    }

    // --- INIT ---
    await loadInventory();
    await fetchBlockedDates();
    loadSavedData();
    updateInventoryLimits();
    calculateTotal();
});