const schedule = document.getElementById("schedule");
const bookButton = document.getElementById("book-btn");
const statusText = document.getElementById("status");

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://fullstack-booking-system-production.up.railway.app";

let selectedTimeSlotId = null;
let rescheduleOrderNumber = null;

/* =======================
   FETCH WRAPPER (SECURE)
======================= */
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include", // 🔥 KRITISK
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!response.ok) {
    console.warn("API ERROR:", data);
    throw new Error(data.error || "Request failed");
  }

  return data;
}

/* =======================
   LOAD TIME SLOTS
======================= */
async function loadTimeSlots() {
  try {
    const data = await apiFetch(`${API_URL}/api/time-slots`);

    schedule.innerHTML = "";

    if (!data || data.length === 0) {
      schedule.textContent = "Inga tider tillgängliga";
      return;
    }

    const groupedByDate = {};

    data.forEach(slot => {
      if (!groupedByDate[slot.date]) {
        groupedByDate[slot.date] = [];
      }
      groupedByDate[slot.date].push(slot);
    });

    for (const date in groupedByDate) {
      const daySection = document.createElement("div");
      daySection.className = "day";

      const heading = document.createElement("h2");
      heading.textContent = date;

      const slotsContainer = document.createElement("div");
      slotsContainer.className = "slots";

      groupedByDate[date].forEach(slot => {
        const slotDiv = document.createElement("div");
        slotDiv.className = "slot";
        slotDiv.textContent = slot.start_time;
        slotDiv.dataset.id = slot.id;

        slotDiv.onclick = () => {
          selectedTimeSlotId = slot.id;
          highlightSelected();
        };

        slotsContainer.appendChild(slotDiv);
      });

      daySection.appendChild(heading);
      daySection.appendChild(slotsContainer);
      schedule.appendChild(daySection);
    }

  } catch (err) {
    console.error(err);
    schedule.textContent = "Fel vid laddning av tider";
  }
}

/* =======================
   UI SELECT
======================= */
function highlightSelected() {
  document.querySelectorAll(".slot").forEach(slot => {
    slot.classList.remove("selected");

    if (Number(slot.dataset.id) === selectedTimeSlotId) {
      slot.classList.add("selected");
    }
  });
}

/* =======================
   BOOK / RESCHEDULE
======================= */
async function bookSelectedTime() {
  if (selectedTimeSlotId === null) {
    statusText.textContent = "Välj en tid först";
    return;
  }

  try {
    if (rescheduleOrderNumber) {
      statusText.textContent = "Bokar om...";

      await apiFetch(`${API_URL}/api/bookings/${rescheduleOrderNumber}`, {
        method: "PUT",
        body: JSON.stringify({
          newTimeSlotId: selectedTimeSlotId
        })
      });

      statusText.textContent = "Bokningen är ombokad";
    } else {
      statusText.textContent = "Bokar...";

      const data = await apiFetch(`${API_URL}/api/bookings`, {
        method: "POST",
        body: JSON.stringify({
          timeSlotId: selectedTimeSlotId
        })
      });

      statusText.textContent =
        `Bokning klar! Ordernummer: ${data.orderNumber}`;
    }

    selectedTimeSlotId = null;
    rescheduleOrderNumber = null;
    loadTimeSlots();

  } catch (err) {
    console.error(err);
    statusText.textContent = err.message || "Något gick fel";
  }
}

/* =======================
   BUTTON CLICK
======================= */
bookButton.onclick = () => {
  bookSelectedTime();
};

/* =======================
   MODAL
======================= */
const manageBookingBtn = document.getElementById("manage-booking-btn");
const modal = document.getElementById("manageBookingModal");

manageBookingBtn.onclick = () => {
  modal.classList.remove("hidden");
  rescheduleOrderNumber = null;
};

document.getElementById("closeManageBookingBtn").onclick = () => {
  modal.classList.add("hidden");
};

/* =======================
   CANCEL BOOKING
======================= */
const cancelBookingBtn = document.getElementById("cancelBookingBtn");
const orderNumberInput = document.getElementById("orderNumberInput");
const manageBookingMessage = document.getElementById("manageBookingMessage");

const confirmModal = document.getElementById("confirmCancelModal");

cancelBookingBtn.onclick = () => {
  const orderNumber = orderNumberInput.value.trim();

  if (!orderNumber) {
    manageBookingMessage.textContent = "Ange ett ordernummer";
    return;
  }

  confirmModal.classList.remove("hidden");

  document.getElementById("confirmCancelYes").onclick = async () => {
    confirmModal.classList.add("hidden");
    manageBookingMessage.textContent = "Avbokar...";

    try {
      await apiFetch(`${API_URL}/api/bookings/${orderNumber}`, {
        method: "DELETE"
      });

      manageBookingMessage.textContent = "Bokningen är avbokad";
      orderNumberInput.value = "";
      loadTimeSlots();

    } catch (err) {
      console.error(err);
      manageBookingMessage.textContent =
        err.message || "Kunde inte avboka";
    }
  };

  document.getElementById("confirmCancelNo").onclick = () => {
    confirmModal.classList.add("hidden");
  };
};

/* =======================
   RESCHEDULE
======================= */
document.getElementById("rescheduleBookingBtn").onclick = () => {
  const orderNumber = orderNumberInput.value.trim();

  if (!orderNumber) {
    manageBookingMessage.textContent = "Ange ett ordernummer";
    return;
  }

  rescheduleOrderNumber = orderNumber;

  manageBookingMessage.textContent =
    "Välj ny tid och klicka på boka";

  modal.classList.add("hidden");
};

/* =======================
   INIT
======================= */
loadTimeSlots();