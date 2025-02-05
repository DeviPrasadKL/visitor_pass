// Global Variables
let allBookings = []; // Store all bookings globally
let currentRecord = null; // Store the current record globally
let PassId = ""; // Store the ID of the current booking
let startTimeToShow = "";
let endTimeToShow = "";
let customer_name = "";

// WaveOff Section
let previousValueOfwaveOffAmount = "";
let previousValueOfwaveOffComplimentary = "";
let previousValueOfaccountVerificationBox = "";

let currentValueOfwaveOffAmount = "";
let currentValueOfwaveOffComplimentary = "";
let currentValueOfaccountVerificationBox = "";

// Pagination Variables
let currentPagePending = 1; // Current page number for pending bookings
let totalPagesPending = 1; // Total pages for pending bookings
const itemsPerPage = 10; // Number of items per page for pending bookings

//Submit buttons
const submitRecordBtn = document.querySelector(".submitRecordBtn");

// checkboxesss
const moneyWaveOff = document.getElementById("money_wave_off_checkbox");
const complementaryWaveOff = document.getElementById("complementary_wave_off_checkbox");
const accountVerificationBox = document.getElementById("accounts_verification_checkbox");

// DOM Elements
const slotsContainer = document.getElementById('slotsContainer');
const myDateInput = document.getElementById('myDate');

// DOM Elements
const closeModalBtn = document.querySelector('.closeBtn');
const closeBtnInvoice = document.querySelector('.closeBtn_invoice');

//All Modals
const modal = document.getElementById('my_modal_3');
const modal_invoice = document.getElementById('my_modal_3_invoice');

//Billing Details
const booked_hours = document.getElementById("booked_hours");
const billable_hours = document.getElementById("billable_hours");
const total_price = document.getElementById('total_price');

// Add event listener to close the modal
closeModalBtn.addEventListener('click', function () {
    modal.close(); // Close the modal (if you're using a dialog element)
});


// Event Listener for Date Change
myDateInput.addEventListener('change', function () {
    const selectedDate = this.value;
    let bookingTimesForCurrentRecord = [];

    // If the selected date is the same as the current record's date, use its booking times
    if (currentRecord && selectedDate === currentRecord.booking_date) {
        if (currentRecord.booking_time === "Full Day") {
            fetc
            bookingTimesForCurrentRecord = generateFullDayTimeSlots();
        } else {
            try {
                bookingTimesForCurrentRecord = JSON.parse(currentRecord.booking_time);
            } catch (error) {
                console.error("Error parsing booking_time for current record:", error);
            }
        }
    }

    // Regenerate time slots based on the newly selected date
    generateTimeSlots(selectedDate, bookingTimesForCurrentRecord, currentRecord ? currentRecord.booking_date : null);

});

// Function to generate time slots for a selected date
function generateTimeSlots(date, bookingTimesForCurrentRecord, currentRecordDate) {
    slotsContainer.innerHTML = ''; // Clear existing slots

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:30:00`); // Adjusted to include the last slot at 23:30

    // Exclude the current record from globally booked times
    const globallyBookedTimes = allBookings
        .filter(booking => booking.booking_date === date && booking.name !== (currentRecord ? currentRecord.name : ''))
        .flatMap(booking => {
            try {
                if (booking.booking_time === "Full Day") {
                    return generateFullDayTimeSlots();
                }
                return JSON.parse(booking.booking_time);
            } catch (error) {
                console.error("Error parsing booking_time:", error);
                return [];
            }
        });

    while (start <= end) {
        const hours = String(start.getHours()).padStart(2, '0');
        const minutes = String(start.getMinutes()).padStart(2, '0');
        const timeSlot = `${hours}:${minutes}`;

        // Create slot element
        const slotElement = document.createElement('div');
        slotElement.classList.add('time-slot');
        slotElement.textContent = timeSlot;

        // Check if the slot is globally booked
        const isGloballyBooked = globallyBookedTimes.includes(timeSlot);
        // Check if the slot is part of the current record's booking time
        const isCurrentRecordSlot = bookingTimesForCurrentRecord.includes(timeSlot);
        // Check if the slot is in both globally booked times and the current record
        const isCommonSlot = isGloballyBooked && isCurrentRecordSlot;

        if (date === currentRecordDate) {
            if (isCommonSlot) {
                // Red slots for common slots (globally booked + current record)
                slotElement.classList.add('selected');
                slotElement.style.backgroundColor = 'red';
                slotElement.style.color = 'white';

                // Allow deselection for common slots, and mark as globally booked (disabled) when deselected
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');

                    if (!slotElement.classList.contains('selected')) {
                        // When deselected, mark as globally booked (disabled)
                        slotElement.classList.add('disabled');
                        slotElement.style.backgroundColor = '#999999b8'; // Grey color
                        slotElement.style.color = 'white';
                        slotElement.style.cursor = 'not-allowed';
                    } else {
                        // Re-select (if needed)
                        slotElement.style.backgroundColor = 'red';
                    }
                });
            } else if (isCurrentRecordSlot) {
                // Blue slots for current record's booking times
                slotElement.classList.add('selected');
                slotElement.style.backgroundColor = '#2f41ec';

                // Allow toggling (modification) for current record's slots
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');
                    slotElement.style.backgroundColor = slotElement.classList.contains('selected') ? '#2f41ec' : '';
                });
            } else if (isGloballyBooked) {
                // Grey slots for globally booked times not part of the current record
                slotElement.classList.add('disabled');
                slotElement.style.backgroundColor = '#999999b8';
                slotElement.style.color = 'white';
                slotElement.style.cursor = 'not-allowed';
            } else {
                // Available slots on the current record's date
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');
                    slotElement.style.backgroundColor = slotElement.classList.contains('selected') ? '#4caf50' : '';
                });
            }
        } else {
            // For other dates
            if (isGloballyBooked) {
                // Grey slots for globally booked times
                slotElement.classList.add('disabled');
                slotElement.style.backgroundColor = '#999999b8';
                slotElement.style.color = 'white';
                slotElement.style.cursor = 'not-allowed';
            } else {
                // Available slots on other dates
                slotElement.addEventListener('click', () => {
                    slotElement.classList.toggle('selected');
                    slotElement.style.backgroundColor = slotElement.classList.contains('selected') ? '#4caf50' : '';
                });
            }
        }

        // Append the slot element to the container
        slotsContainer.appendChild(slotElement);

        // Increment the time by 30 minutes
        start.setMinutes(start.getMinutes() + 30);
    }
}

// Fetch single room booking record data for display
function fetchSingleData(id) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Room Booking slot",
            name: id,
        },
        callback: async function (response) {
            const record = response.message;

            // Store the current record's ID
            PassId = id;

            // Also, display the record's details (populate modal, etc.)
            appendDetails(record);
        }
    });
}

// Inserting booking data into modal
function appendDetails(data) {
    document.querySelector(".card").innerHTML = data.status;
    document.querySelector(".pass-id").innerHTML = data.name;
    document.getElementById("price").innerHTML = data.price;
    document.getElementById("date-field").innerHTML = data.room;
    document.getElementById("room_type_show").innerHTML = data.room_type;
    document.getElementById("email-field").innerHTML = data.email ? data.email : data.customer_email;
    document.getElementById("fullname-field").innerHTML = data.customer ? data.customer : data.customer_name;
    document.getElementById("location-field").innerHTML = data.location;
    document.getElementById("myDate").innerHTML = data.booking_date;
    document.getElementById("startTime").innerHTML = startTimeToShow;
    document.getElementById("endTime").innerHTML = endTimeToShow;
    document.getElementById("clientType").innerHTML = data.client_type ? data.client_type : "---------";
    money_collected.value = data.money_collected;
    // card_status.value = data.card_status;
    money_collected_value = data.money_collected;
    // card_status_value = data.card_status;
    document.getElementById("money_wave_off_checkbox").checked = data.wave_off_amount,
        document.getElementById("complementary_wave_off_checkbox").checked = data.wave_off_complimentary,
        document.getElementById("accounts_verification_checkbox").checked = data.verified_by_accounts,

        // Hide money collection dropdown for "Deposit" client
        money_collected_div.style.display = data.client_type === 'Deposit' ? 'none' : 'block';

    // Get the current date and subtract 3 days to get the comparison date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 3); // Subtract 3 days
    const currentDateMinus3Days = new Date(currentDate.toISOString().split('T')[0]); // Set time to 00:00:00

    // Parse the booking time from the data object (ensure it's a valid date)
    const bookingDate = new Date(data.booking_date);

    const readOnlyDivs = document.querySelectorAll(".readOnlyDiv");
    const moneyCollectedReadOnly = document.querySelector(".readOnlyDiv1");
    const cardStatusReadOnly = document.querySelector(".readOnlyDiv2");
    const editDiv = document.getElementById('editDiv');

    // Compare the dates (if bookingDate is less than current date minus 3 days)
    if (bookingDate < currentDateMinus3Days) {
        editDiv.style.display = 'none';
        readOnlyDivs.forEach((div) => {
            div.style.display = 'block';
        });
        submitRecordBtn.style.display = 'none';
    } else {
        editDiv.style.display = 'block';
        readOnlyDivs.forEach((div) => {
            div.style.display = 'none';
        });
        submitRecordBtn.style.display = 'block';
    }

    if (data.client_type !== 'Deposit') {
        // Handle the money collected condition
        if (data.money_collected === "Yes") {
            moneyCollectedReadOnly.style.display = 'block'; // Show money collected read-only div
            document.getElementById('money_collected_div').style.display = 'none'; // Hide dropdown
        } else {
            moneyCollectedReadOnly.style.display = 'none'; // Hide money collected read-only div
            document.getElementById('money_collected_div').style.display = 'block'; // Show dropdown
        }
    }

    let statusDiv = document.querySelector(".status");
    statusDiv.innerHTML = data.status;

    // Set status color based on status
    switch (data.status) {
        case "Pending":
            statusDiv.style.backgroundColor = "#ff7300";
            break;
        case "Approved":
            statusDiv.style.backgroundColor = "green";
            break;
        default:
            statusDiv.style.backgroundColor = "red";
            break;
    }
}

// ----------------------------------------------------------------Filter Start-------------------------------------------------------------
// Fetch form data for customer, location, room type, etc.
function fetchFormDataHome(doctype, field, filters = []) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctype,
            fields: [field],
            filters: filters,
        },
        callback: function (response) {
            if (doctype === 'Property Location' || doctype === 'Room Type') {
                const selectElement = document.getElementById(doctype === 'Property Location' ? 'location_filter' : 'room_type_filter');
                selectElement.innerHTML = '<option value="">Select</option>'; // Clear previous options
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    selectElement.appendChild(option);
                });

                // Restore location from localStorage if available
                if (doctype === 'Property Location') {
                    const storedLocation = localStorage.getItem('selectedLocation');
                    if (storedLocation) {
                        selectElement.value = storedLocation;
                    }
                }

                // Store location in localStorage
                if (doctype === 'Property Location') {
                    selectElement.addEventListener('change', () => {
                        const selectedLocation = selectElement.value;
                        localStorage.setItem('selectedLocation', selectedLocation);
                        updateDetails(selectedLocation);
                    });
                }

            } else if (doctype === 'Rooms') {
                const roomSelectElement = document.getElementById('room_filter');
                roomSelectElement.innerHTML = '<option value="">Select Room</option>';
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    roomSelectElement.appendChild(option);
                });
            }
        }
    });
}

// Set booking date to the current date
let currentDate = new Date().toJSON().slice(0, 10);
document.getElementById("booking_date_filter").value = currentDate;
document.getElementById("toDate").value = currentDate;

// Fetch rooms based on selected location and room type
function fetchRoomsHome(location, roomType) {
    const filters = [
        ['location', '=', location],
        ['room_type', '=', roomType]
        ['status', '=', 'Cancelled']
    ];
    fetchFormDataHome('Rooms', 'room_name', filters);
}

// Event listener for location, date, room type, room changes
function updateDetails() {
    const location = document.getElementById('location_filter').value || localStorage.getItem('selectedLocation');
    let bookingDate = document.getElementById('booking_date_filter').value;
    let toDate = document.getElementById('toDate').value;

    // Default to today's date if bookingDate is empty or null
    if (!bookingDate) {
        const today = new Date();
        bookingDate = today.toISOString().split('T')[0]; // Format as yyyy-mm-dd
    }

    const roomType = document.getElementById('room_type_filter').value;
    const room = document.getElementById('room_filter').value;

    fetchData(currentPagePending, false, location, roomType, room, bookingDate, toDate);
    fetchTotalPages(location, roomType, room, bookingDate, toDate);
}

// Event listener for all filters
document.getElementById('location_filter').addEventListener('change', updateDetails);
document.getElementById('booking_date_filter').addEventListener('change', updateDetails);
document.getElementById('toDate').addEventListener('change', updateDetails);
document.getElementById('room_filter').addEventListener('change', updateDetails);
document.getElementById('room_type_filter').addEventListener('change', function () {
    const selectedLocation = document.getElementById('location_filter').value;
    const selectedRoomType = this.value;
    fetchRoomsHome(selectedLocation, selectedRoomType);
    updateDetails();
});

// ----------------------------------------------------------------Filter end-------------------------------------------------------------

frappe.ready(function () {
    console.clear();
    const user = frappe.session.user;
    if (user === "Guest" || user === "guest") {
        my_modal_1.showModal();
        return;
    }
    main();
});

//Main function to start javascript execution
function main() {
    // Get the current date
    const currentDate = new Date();

    // Format it to yyyy-mm-dd
    const formattedDate = currentDate.toISOString().split('T')[0]; // ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ'

    // Locally stored location
    const storedLocation = localStorage.getItem('selectedLocation');

    // Helper function to get filter values
    const getFilterValues = () => {
        return {
            room: document.getElementById('room_filter').value,
            location: document.getElementById('location_filter').value,
            roomType: document.getElementById('room_type_filter').value,
            bookingDate: document.getElementById('booking_date_filter').value,
            toDate: document.getElementById('toDate').value
        };
    };

    fetchData(currentPagePending, false, storedLocation, null, null, formattedDate, formattedDate);
    fetchTotalPages(storedLocation, null, null, formattedDate, formattedDate); // Fetch total pages first

    submitRecordBtn.addEventListener("click", updateStatus);

    document.querySelector(".prev-page-pending").addEventListener("click", () => {
        if (currentPagePending > 1) {
            currentPagePending--;
            const { location, roomType, room, bookingDate, toDate } = getFilterValues();

            fetchData(currentPagePending, false, location, roomType, room, bookingDate, toDate);
            fetchTotalPages(location, roomType, room, bookingDate, toDate); // Fetch total pages
            document.querySelector("#current-page-pending").innerHTML = currentPagePending;
        }
    });

    document.querySelector(".next-page-pending").addEventListener("click", () => {
        if (currentPagePending < totalPagesPending) {
            currentPagePending++;
            const { location, roomType, room, bookingDate, toDate } = getFilterValues();

            fetchData(currentPagePending, true, location, roomType, room, bookingDate);
            fetchTotalPages(location, roomType, room, bookingDate, toDate); // Fetch total pages
            document.querySelector("#current-page-pending").innerHTML = currentPagePending;
        }
    });
}

// Fetch total pages for pending bookings
async function fetchTotalPages(location, roomType, room, dates, toDate) {

    const filters = [
        ['booking_date', 'between', [dates, toDate]],
        ['status', '=', 'Approved'],
        ['block_temp', '=', '0'],
    ];

    if (location) {
        filters.push(['location', '=', location]);
    }

    if (roomType) {
        filters.push(['room_type', '=', roomType]);
    }

    if (room) {
        filters.push(['room', '=', location + ' - ' + room]);
    }
}

// Fetching booking data (Approved records)
async function fetchData(pagePending, checkData = false, location, roomType, room, dates, toDate) {
    // Start building the noRecordsMessage dynamically
    let noRecordsMessageParts = [`No records to show on ${dates}`];

    let currentDate = new Date(); // Get the current date

    if (dates > toDate) {
        // Set the 'toDate' field to the current date
        document.getElementById('toDate').value = currentDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
        alert('"From Date" cannot be greater than "To Date".');
        return;
    }

    // Initialize the filters array
    const filters = [
        ['booking_date', 'between', [dates, toDate]],
        ['status', '=', 'Cancelled'],
        ['block_temp', '=', '0'],
        ['docstatus', '=', '1']

    ];

    if (location) {
        filters.push(['location', '=', location]);
        noRecordsMessageParts.push(`at ${location} location`);
    }

    // Add filters based on roomType if available
    if (roomType) {
        filters.push(['room_type', '=', roomType]);
        noRecordsMessageParts.push(`and room type ${roomType}`);
    }

    // Add filters based on room if available
    if (room) {
        filters.push(['room', '=', location + ' - ' + room]);
        noRecordsMessageParts.push(`and room name ${room}`);
    }

    // Combine the parts to form the full message
    const noRecordsMessage = noRecordsMessageParts.join(' ');

    let allFieds = [
        'name',
        'status',
        'customer',
        'location',
        'room_type',
        'booking_date',
        'booking_time',
        'block_temp',
        'room',
        'client_type',
        'price',
        'money_collected',
        // 'card_status',
        'customer_name',
        'wave_off_amount',
        'wave_off_complimentary',
        'verified_by_accounts',
        'cancel_time',
    ]

    function checkDateDifferenceAndToggleButtons(data) {
        // Parse the booking_date and cancel_time from the data object
        const bookingDate = new Date(data.booking_date);
        const cancellationDate = data.cancel_time ? new Date(data.cancel_time) : null;

        console.log("booking and cancllation date", bookingDate, cancellationDate)

        if (cancellationDate) {
            // Calculate the difference in days
            const timeDifference = Math.abs(cancellationDate - bookingDate);
            console.log("time difference", timeDifference);

            const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
            console.log("day diff", dayDifference);


            // Disable checkboxes and submit button if the difference is more than 3 days
            if (dayDifference > 3) {
                disableCheckboxesAndButton();
            }
        }
    }

    function disableCheckboxesAndButton() {
        if (moneyWaveOff) moneyWaveOff.disabled = true;
        if (complementaryWaveOff) complementaryWaveOff.disabled = true;
        if (accountVerificationBox) accountVerificationBox.disabled = true;
        if (submitRecordBtn) submitRecordBtn.disabled = true;
    }

    // Call the API to fetch the data
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Room Booking slot",
            fields: allFieds,
            limit_start: (pagePending - 1) * itemsPerPage,
            limit_page_length: itemsPerPage,
            filters: filters
        },
        callback: function (response) {
            const paginationDiv = document.querySelector('.pagination-controls-pending');
            const noRecordsDiv = document.querySelector(".noRecordsDiv");
            const tableBody = document.querySelector(".tableBody");
            const table = document.querySelector(".table");
            tableBody.innerHTML = "";

            if (response.message.length === 0) {
                // If no records
                table.style.display = 'none';
                noRecordsDiv.style.display = 'flex';
                paginationDiv.style.display = 'none';
                noRecordsDiv.innerHTML = `<h4 class="text-purple-800 text-sm font-bold">${noRecordsMessage}</h4>`;
            } else {
                // If records are found
                table.style.display = 'block';
                noRecordsDiv.style.display = 'none';
                paginationDiv.style.display = 'flex';
                response.message.forEach((res, index) => {
                    checkDateDifferenceAndToggleButtons(res);
                    constructTable(res, index + 1, "tableBody");
                });

                togglePaginationButtons('Approved', response.message.length);
            }
        }
    });
}

// Function to toggle pagination buttons
function togglePaginationButtons(type, dataLength) {
    if (type === 'Approved') {
        document.querySelector(".prev-page-pending").disabled = currentPagePending === 1;
        document.querySelector(".next-page-pending").disabled = currentPagePending === totalPagesPending;
    }
}

// Function to add 30 minutes to a end time string in HH:MM format
function add30Minutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    let newMinutes = minutes + 30;
    let newHours = hours;

    if (newMinutes >= 60) {
        newMinutes -= 60;
        newHours += 1;
    }

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Utility function to create tables
function constructTable(data, slNo, tableName) {

    let tableBody = document.querySelector(`.${tableName}`);

    let tableRow = document.createElement("tr");
    tableRow.classList.add("hover", "tableRow");


    // Parse the booking_time JSON string into an array
    const bookingTime = JSON.parse(data.booking_time);
    const startTime = bookingTime[0];
    let endTime = bookingTime[bookingTime.length - 1];

    // Add 30 minutes to the end time
    endTime = add30Minutes(endTime);

    // Formating Date
    let date = data.booking_date.split("-");
    date = `${date[2]}/${date[1]}/${date[0]}`;

    previousValueOfwaveOffAmount = data.wave_off_amount === 0 ? false : true;
    previousValueOfwaveOffComplimentary = data.wave_off_complimentary === 0 ? false : true;
    previousValueOfaccountVerificationBox = data.verified_by_accounts === 0 ? false : true;


    // Create the row with the provided data
    tableRow.setAttribute("onClick", `showDetails('${data.name}', '${startTime}', '${endTime}')`);
    tableRow.innerHTML = `
        <td>${slNo}</td>
        <td>${data.customer ? data.customer : data.customer_name}</td>
        <td>${date}</td>
        <td>${data.location}</td>
        <td>${data.room_type}</td>
        <td class="text-purple-800 font-medium">${data.room}</td>
        
        <td class="text-green-800 font-medium">${startTime}</td>
        <td class="text-red-800 font-medium">${endTime}</td>
        <td class="font-bold ${data.client_type && data.client_type !== 'Deposit' ? 'text-blue-700' : ''}">
            ${data.price}
        </td>
        <td>${data.wave_off_amount === 0 ? "No" : "Yes"}</td>
        <td>${data.wave_off_complimentary === 0 ? "No" : "Yes"}</td>
        <td>${data.verified_by_accounts === 0 ? "No" : "Yes"}</td>
    `;
    tableBody.appendChild(tableRow);
}

function showDetails(id, startTime, endTime) {
    if (submitRecordBtn) {
        submitRecordBtn.disabled = true;
    }

    startTimeToShow = startTime;
    endTimeToShow = endTime;
    my_modal_3.showModal();
    
    // Fetch the specific record to get current checkbox states
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Room Booking slot",
            name: id,
        },
        callback: function (response) {
            const data = response.message;
            
            // Set initial checkbox states
            if (moneyWaveOff) {
                moneyWaveOff.checked = data.wave_off_amount === 1;
                previousValueOfwaveOffAmount = data.wave_off_amount === 1;
            }
            
            if (complementaryWaveOff) {
                complementaryWaveOff.checked = data.wave_off_complimentary === 1;
                previousValueOfwaveOffComplimentary = data.wave_off_complimentary === 1;
            }
            
            if (accountVerificationBox) {
                accountVerificationBox.checked = data.verified_by_accounts === 1;
                previousValueOfaccountVerificationBox = data.verified_by_accounts === 1;
            }

            // Reset current values to match initial state
            currentValueOfwaveOffAmount = previousValueOfwaveOffAmount;
            currentValueOfwaveOffComplimentary = previousValueOfwaveOffComplimentary;
            currentValueOfaccountVerificationBox = previousValueOfaccountVerificationBox;
        }
    });
    
    fetchSingleData(id);
}

function updateStatus() {
    submitRecordBtn.disabled = true;

    // Update the booking in the database
    frappe.call({
        method: "frappe.client.set_value",
        args: {
            doctype: "Room Booking slot",
            name: PassId,
            fieldname: {
                "wave_off_amount": currentValueOfwaveOffAmount ? 1 : 0,
                "wave_off_complimentary": currentValueOfwaveOffComplimentary ? 1 : 0,
                "verified_by_accounts": currentValueOfaccountVerificationBox ? 1 : 0
            }
        },
        callback: function (response) {
            if (response) {
                alert("Record updated successfully!");
                console.log("the cancellation details are...", response);
                
                // Reload the page or update the view
                window.location.reload();
            }
        }
    });
}

// Modify checkbox event listeners
if (moneyWaveOff) {
    moneyWaveOff.addEventListener('change', (e) => {
        currentValueOfwaveOffAmount = e.target.checked;
        
        // Enable submit button only if the value has changed
        submitRecordBtn.disabled = (currentValueOfwaveOffAmount === previousValueOfwaveOffAmount);
    });
}

if (complementaryWaveOff) {
    complementaryWaveOff.addEventListener('change', (e) => {
        currentValueOfwaveOffComplimentary = e.target.checked;
        
        // Enable submit button only if the value has changed
        submitRecordBtn.disabled = (currentValueOfwaveOffComplimentary === previousValueOfwaveOffComplimentary);
    });
}

if (accountVerificationBox) {
    accountVerificationBox.addEventListener('change', (e) => {
        currentValueOfaccountVerificationBox = e.target.checked;
        
        // Enable submit button only if the value has changed
        submitRecordBtn.disabled = (currentValueOfaccountVerificationBox === previousValueOfaccountVerificationBox);
    });
}

// Fetch form data for customer, location, room type, etc.
function fetchFormData(doctype, field, suggestionsElementId, filters = []) {

    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: doctype,
            fields: [field],
            filters: filters,
        },
        callback: function (response) {
            if (doctype === 'Property Location' || doctype === 'Room Type') {
                const selectElement = document.getElementById(doctype === 'Property Location' ? 'location' : 'room_type');
                selectElement.innerHTML = ''; // Clear previous options
                response.message.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[field];
                    option.textContent = item[field];
                    selectElement.appendChild(option);
                });
            } else if (doctype === 'Rooms') {
                const roomSelectElement = document.getElementById('room');
                roomSelectElement.innerHTML = ''; // Clear previous room options

                if (response.message.length === 0) {
                    roomSelectElement.innerHTML = '<option value="">No rooms found</option>';
                } else {
                    response.message.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item[field];
                        option.textContent = item[field];
                        roomSelectElement.appendChild(option);
                    });
                }
            } else {
                const suggestionsElement = document.getElementById(suggestionsElementId);
                suggestionsElement.innerHTML = ''; // Clear previous suggestions
                response.message.forEach(item => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.textContent = item[field];

                    // Add click event to select the suggestion
                    suggestionItem.addEventListener('click', function () {
                        const inputField = doctype === 'Customer' ? 'customer' : 'email';
                        document.getElementById(inputField).value = item[field];
                        suggestionsElement.innerHTML = ''; // Clear suggestions after selection

                        // If a customer is selected, fetch associated leads
                        if (doctype === 'Customer') {
                            fetchLeadsForCustomer(item[field]); // Fetch leads for selected customer
                        }
                    });

                    suggestionsElement.appendChild(suggestionItem);
                });
            }
        }
    });
}

// Fetch static data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchFormData('Property Location', 'name', null); // No suggestions needed
    fetchFormData('Room Type', 'name', null); // No suggestions needed
    fetchFormDataHome('Property Location', 'name'); // Fetch locations
    fetchFormDataHome('Room Type', 'name'); // Fetch room types
});