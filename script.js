// =============================================
// GLOBAL BUYER DISCOVERY DASHBOARD
// =============================================

// Load saved buyers from localStorage
let buyers = JSON.parse(
  localStorage.getItem("buyerDiscoveryDataV2")
) || [];

let selectedBuyerId = null;
let placesSearchResults = [];

// Bootstrap modal
const buyerModal = new bootstrap.Modal(
  document.getElementById("buyerModal")
);

// Short function to get HTML elements
const $ = id => document.getElementById(id);


// =============================================
// BASIC HELPER FUNCTIONS
// =============================================

function saveData() {
  localStorage.setItem(
    "buyerDiscoveryDataV2",
    JSON.stringify(buyers)
  );
}

function emailIsValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

// Escape text before displaying it as HTML
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Check whether a website is a valid HTTP/HTTPS URL
function safeWebsite(url) {
  try {
    const parsed = new URL(url);

    if (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:"
    ) {
      return parsed.href;
    }
  } catch (error) {
    return "";
  }

  return "";
}

function findBuyer(id) {
  return buyers.find(buyer => buyer.id === Number(id));
}

// Check whether a Google Places business already exists
function isDuplicateBusiness(business) {
  const placeId = business.id;

  const name = (
    business.displayName?.text || ""
  ).toLowerCase().trim();

  return buyers.some(buyer => {

    if (placeId && buyer.placeId === placeId) {
      return true;
    }

    return (
      name &&
      (buyer.name || "").toLowerCase().trim() === name &&
      (buyer.country || "").toLowerCase().trim() ===
        ($("country").value || "").toLowerCase().trim()
    );
  });
}


// =============================================
// DASHBOARD STATISTICS
// =============================================

function renderStats() {
  $("totalCount").textContent = buyers.length;

  $("validCount").textContent = buyers.filter(
    buyer => emailIsValid(buyer.email)
  ).length;

  $("contactedCount").textContent = buyers.filter(
    buyer => buyer.status === "Contacted"
  ).length;

  $("followupCount").textContent = buyers.filter(
    buyer => buyer.status === "Follow-up"
  ).length;
}


// =============================================
// BUYER DIRECTORY
// =============================================

function renderBuyers() {
  const search = $("searchInput").value.toLowerCase().trim();
  const category = $("typeFilter").value;
  const status = $("statusFilter").value;
  const source = $("sourceFilter").value;
  const emailFilter = $("emailFilter").value;

  const filteredBuyers = buyers.filter(buyer => {

    const searchText = [
      buyer.name,
      buyer.country,
      buyer.email,
      buyer.phone
    ].join(" ").toLowerCase();

    const matchesSearch = searchText.includes(search);

    const matchesCategory =
      !category || buyer.category === category;

    const matchesStatus =
      !status || buyer.status === status;

    const matchesSource =
      !source || buyer.source === source;

    const validEmail = emailIsValid(buyer.email);

    const matchesEmail =
      !emailFilter ||
      (emailFilter === "valid" && validEmail) ||
      (emailFilter === "invalid" && !validEmail);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesSource &&
      matchesEmail
    );
  });

  $("buyerTable").innerHTML = "";

  $("emptyMessage").hidden = filteredBuyers.length !== 0;

  filteredBuyers.forEach(buyer => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <button
          class="btn btn-link p-0 text-start buyer-select"
          data-id="${buyer.id}">
          ${esc(buyer.name)}
        </button>
      </td>

      <td>${esc(buyer.country)}</td>

      <td>${esc(buyer.email || "Not available")}</td>

      <td>${esc(buyer.category)}</td>

      <td>${esc(buyer.source)}</td>

      <td>
        <span class="badge text-bg-primary">
          ${esc(buyer.status)}
        </span>
      </td>

      <td>
        <button
          class="btn btn-sm btn-outline-primary edit-buyer"
          data-id="${buyer.id}">
          Edit
        </button>

        <button
          class="btn btn-sm btn-outline-danger delete-buyer"
          data-id="${buyer.id}">
          Delete
        </button>
      </td>
    `;

    $("buyerTable").appendChild(row);
  });
}

function render() {
  renderStats();
  renderBuyers();
}


// =============================================
// SELECT BUYER AND DISPLAY DETAILS
// =============================================

function selectBuyer(id) {
  const buyer = findBuyer(id);

  if (!buyer) return;

  selectedBuyerId = buyer.id;

  const website = safeWebsite(buyer.website);

  $("selectedBuyer").innerHTML = `
    <h5 class="fw-bold">${esc(buyer.name)}</h5>

    <p><strong>Country:</strong> ${esc(buyer.country)}</p>

    <p><strong>Email:</strong>
      ${esc(buyer.email || "Not available")}
    </p>

    <p><strong>Phone:</strong>
      ${esc(buyer.phone || "Not available")}
    </p>

    <p><strong>Website:</strong>
      ${
        website
          ? `<a href="${esc(website)}" target="_blank" rel="noopener noreferrer">Visit website</a>`
          : "Not available"
      }
    </p>

    <p><strong>Category:</strong> ${esc(buyer.category)}</p>

    <p><strong>Source:</strong> ${esc(buyer.source)}</p>

    <p><strong>Notes:</strong> ${esc(buyer.notes || "No notes")}</p>
  `;

  $("outreachStatus").value = buyer.status;
  $("followupDate").value = buyer.followup || "";
}


// =============================================
// ADD AND EDIT BUYERS
// =============================================

function resetBuyerForm() {
  $("buyerForm").reset();

  $("buyerId").value = "";

  $("modalTitle").textContent = "Add New Buyer";
}

function openEditBuyer(id) {
  const buyer = findBuyer(id);

  if (!buyer) return;

  $("modalTitle").textContent = "Edit Buyer";

  $("buyerId").value = buyer.id;
  $("buyerName").value = buyer.name;
  $("buyerCountry").value = buyer.country;
  $("buyerEmail").value = buyer.email || "";
  $("buyerPhone").value = buyer.phone || "";
  $("buyerWebsite").value = buyer.website || "";
  $("buyerCategory").value = buyer.category;
  $("buyerSource").value = buyer.source;
  $("buyerStatus").value = buyer.status;
  $("buyerNotes").value = buyer.notes || "";

  buyerModal.show();
}

// Reset form when modal closes
$("buyerModal").addEventListener(
  "hidden.bs.modal",
  resetBuyerForm
);

// Save buyer form
$("buyerForm").addEventListener("submit", function(event) {

  event.preventDefault();

  const id = $("buyerId").value;

  const buyerData = {

    id: id ? Number(id) : Date.now(),

    placeId: id
      ? (findBuyer(id)?.placeId || "")
      : "",

    name: $("buyerName").value.trim(),

    country: $("buyerCountry").value.trim(),

    email: $("buyerEmail").value.trim(),

    phone: $("buyerPhone").value.trim(),

    website: $("buyerWebsite").value.trim(),

    category: $("buyerCategory").value,

    source: $("buyerSource").value,

    status: $("buyerStatus").value,

    notes: $("buyerNotes").value.trim(),

    followup: id
      ? (findBuyer(id)?.followup || "")
      : ""
  };

  // Email is optional, but if entered it must be valid
  if (
    buyerData.email &&
    !emailIsValid(buyerData.email)
  ) {
    alert("Please enter a valid email address.");
    return;
  }

  // Check duplicate email only when an email is provided
  const duplicateEmail = buyerData.email && buyers.some(buyer =>
    (buyer.email || "").toLowerCase() ===
      buyerData.email.toLowerCase() &&
    buyer.id !== buyerData.id
  );

  if (duplicateEmail) {
    alert("This email address already exists.");
    return;
  }

  if (id) {

    buyers = buyers.map(buyer =>
      buyer.id === buyerData.id ? buyerData : buyer
    );

  } else {

    buyers.push(buyerData);
  }

  saveData();

  render();

  buyerModal.hide();

  selectBuyer(buyerData.id);
});


// =============================================
// BUYER DIRECTORY BUTTONS
// =============================================

$("buyerTable").addEventListener("click", function(event) {

  const selectButton = event.target.closest(".buyer-select");

  const editButton = event.target.closest(".edit-buyer");

  const deleteButton = event.target.closest(".delete-buyer");

  if (selectButton) {
    selectBuyer(selectButton.dataset.id);
  }

  if (editButton) {
    openEditBuyer(editButton.dataset.id);
  }

  if (deleteButton) {

    const id = Number(deleteButton.dataset.id);

    if (confirm("Are you sure you want to delete this buyer?")) {

      buyers = buyers.filter(buyer => buyer.id !== id);

      if (selectedBuyerId === id) {

        selectedBuyerId = null;

        $("selectedBuyer").textContent =
          "Select a buyer from the directory.";

      }

      saveData();

      render();
    }
  }
});


// =============================================
// SEARCH AND FILTER
// =============================================

[
  "searchInput",
  "typeFilter",
  "statusFilter",
  "sourceFilter",
  "emailFilter"
].forEach(id => {

  $(id).addEventListener("input", renderBuyers);

});


// =============================================
// OUTREACH STATUS AND FOLLOW-UP
// =============================================

$("saveOutreachBtn").addEventListener("click", function() {

  if (!selectedBuyerId) {
    alert("Please select a buyer first.");
    return;
  }

  const buyer = findBuyer(selectedBuyerId);

  if (!buyer) return;

  buyer.status = $("outreachStatus").value;

  buyer.followup = $("followupDate").value;

  saveData();

  render();

  alert("Outreach details saved successfully.");
});


// =============================================
// EMAIL OUTREACH
// =============================================

function getEmailContent() {

  if (!selectedBuyerId) {
    alert("Please select a buyer first.");
    return null;
  }

  const buyer = findBuyer(selectedBuyerId);

  if (!buyer || !emailIsValid(buyer.email)) {

    alert(
      "This buyer does not have a valid email address. Please add one first."
    );

    return null;
  }

  return {
    email: buyer.email,
    subject: $("emailSubject").value,
    body: $("emailBody").value
  };
}

// Open email draft
$("openEmailBtn").addEventListener("click", function() {

  const email = getEmailContent();

  if (!email) return;

  const mailto =
    `mailto:${encodeURIComponent(email.email)}` +
    `?subject=${encodeURIComponent(email.subject)}` +
    `&body=${encodeURIComponent(email.body)}`;

  window.location.href = mailto;
});

// Copy email
$("copyEmailBtn").addEventListener("click", async function() {

  const email = getEmailContent();

  if (!email) return;

  const content =
    `To: ${email.email}\n` +
    `Subject: ${email.subject}\n\n` +
    email.body;

  try {

    await navigator.clipboard.writeText(content);

    alert("Email details copied successfully.");

  } catch (error) {

    alert("Unable to copy. Please copy the email manually.");

  }
});


// =============================================
// CSV EXPORT
// =============================================

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

$("exportBtn").addEventListener("click", function() {

  const headers = [
    "name",
    "country",
    "email",
    "phone",
    "website",
    "category",
    "source",
    "status",
    "notes",
    "followup"
  ];

  const rows = buyers.map(buyer =>
    headers.map(header => csvEscape(buyer[header])).join(",")
  );

  const csv = [
    headers.join(","),
    ...rows
  ].join("\n");

  const blob = new Blob(
    [csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "global-buyers.csv";

  link.click();

  URL.revokeObjectURL(url);
});


// =============================================
// CSV IMPORT
// =============================================

// Read CSV values, including values containing commas
function parseCSVLine(line) {

  const values = [];

  let value = "";

  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {

    const character = line[i];

    if (character === '"') {

      if (insideQuotes && line[i + 1] === '"') {

        value += '"';

        i++;

      } else {

        insideQuotes = !insideQuotes;

      }

    } else if (character === "," && !insideQuotes) {

      values.push(value);

      value = "";

    } else {

      value += character;

    }
  }

  values.push(value);

  return values;
}

$("importFile").addEventListener("change", function(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function() {

    const lines = String(reader.result)
      .split(/\r?\n/)
      .filter(line => line.trim() !== "");

    if (lines.length < 2) {

      alert("The CSV file is empty.");

      event.target.value = "";

      return;
    }

    const headers = parseCSVLine(lines[0]).map(header =>
      header.trim().replace(/^\uFEFF/, "").toLowerCase()
    );

    // Email is no longer a required CSV column
    const required = ["name", "country"];

    if (!required.every(header => headers.includes(header))) {

      alert("CSV must contain name and country columns.");

      event.target.value = "";

      return;
    }

    let imported = 0;

    let skipped = 0;

    lines.slice(1).forEach(line => {

      const values = parseCSVLine(line);

      const record = {};

      headers.forEach((header, index) => {
        record[header] = (values[index] || "").trim();
      });

      // Skip records without name or country
      if (!record.name || !record.country) {

        skipped++;

        return;
      }

      // Validate email only if provided
      if (record.email && !emailIsValid(record.email)) {

        skipped++;

        return;
      }

      // Check duplicate email only when provided
      const duplicateEmail = record.email && buyers.some(buyer =>
        (buyer.email || "").toLowerCase() ===
        record.email.toLowerCase()
      );

      if (duplicateEmail) {

        skipped++;

        return;
      }

      buyers.push({

        id: Date.now() + Math.floor(Math.random() * 1000000),

        placeId: "",

        name: record.name,

        country: record.country,

        email: record.email || "",

        phone: record.phone || "",

        website: record.website || "",

        category: record.category || "Other",

        source: record.source || "Other",

        status: record.status || "New",

        notes: record.notes || "",

        followup: record.followup || ""

      });

      imported++;

    });

    saveData();

    render();

    alert(
      imported + " buyer(s) imported successfully.\n" +
      skipped + " record(s) skipped."
    );

    event.target.value = "";

  };

  reader.readAsText(file);
});


// =============================================
// GOOGLE PLACES API - BUSINESS SEARCH
// =============================================

async function searchBusinesses() {

  const category = $("category").value.trim();

  const country = $("country").value.trim();

  const message = $("searchMessage");

  const results = $("placesResults");

  const button = $("searchBusinessesBtn");

  if (!category || !country) {

    message.textContent =
      "Please enter both business category and country.";

    message.className = "text-danger small mt-3";

    return;
  }

  button.disabled = true;

  message.textContent =
    "Searching businesses using Google Places API...";

  message.className = "text-primary small mt-3";

  results.innerHTML = "";

  placesSearchResults = [];

  $("placesSelectionActions").hidden = true;

  $("addSelectedBuyersBtn").disabled = true;

  $("selectAllPlaces").checked = false;

  $("selectedPlacesCount").textContent = "0 selected";

  try {

    const response = await fetch(
      "http://localhost:3000/api/search",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          category: category,
          country: country
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Google Places search failed.");
    }

    if (!Array.isArray(data) || data.length === 0) {

      message.textContent =
        "No businesses found. Try another category or country.";

      message.className = "text-secondary small mt-3";

      return;
    }

    // Store search results temporarily.
    // Do not add anything to the buyer directory here.
    placesSearchResults = data;

    displayPlacesResults(data);

    $("placesSelectionActions").hidden = false;

    message.textContent =
      `${data.length} businesses found. Select the businesses you want to add.`;

    message.className = "text-success small mt-3";

  } catch (error) {

    console.error("Places API error:", error);

    message.textContent = "Error: " + error.message;

    message.className = "text-danger small mt-3";

  } finally {

    button.disabled = false;

  }
}


// =============================================
// DISPLAY GOOGLE PLACES RESULTS
// =============================================

function displayPlacesResults(data) {

  const results = $("placesResults");

  results.innerHTML = "";

  data.forEach((business, index) => {

    const name =
      business.displayName?.text || "Unknown business";

    const address =
      business.formattedAddress || "Address unavailable";

    const phone =
      business.nationalPhoneNumber || "Not available";

    const website =
      safeWebsite(business.websiteUri || "");

    const alreadyExists = isDuplicateBusiness(business);

    const card = document.createElement("div");

    card.className = "col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="business-card h-100">

        <div class="form-check mb-3">

          <input
            class="form-check-input place-checkbox"
            type="checkbox"
            value="${index}"
            id="placeCheckbox${index}"
            ${alreadyExists ? "disabled" : ""}>

          <label
            class="form-check-label fw-bold"
            for="placeCheckbox${index}">
            Select this business
          </label>

        </div>

        <h5 class="fw-bold">
          ${esc(name)}
        </h5>

        <p class="small text-secondary">
          ${esc(address)}
        </p>

        <p class="small">
          <strong>Phone:</strong> ${esc(phone)}
        </p>

        <p class="small">
          <strong>Website:</strong>
          ${
            website
              ? `<a href="${esc(website)}" target="_blank" rel="noopener noreferrer">Visit website</a>`
              : "Not available"
          }
        </p>

        ${
          alreadyExists
            ? `<span class="badge text-bg-secondary">Already in directory</span>`
            : `<span class="badge text-bg-info">Not added yet</span>`
        }

      </div>
    `;

    results.appendChild(card);

  });

  updateSelectionControls();
}


// =============================================
// UPDATE SELECTION COUNT AND BUTTON
// =============================================

function updateSelectionControls() {

  const checkboxes = document.querySelectorAll(
    ".place-checkbox:not(:disabled)"
  );

  const checkedBoxes = document.querySelectorAll(
    ".place-checkbox:checked"
  );

  const selectedCount = checkedBoxes.length;

  $("selectedPlacesCount").textContent =
    `${selectedCount} selected`;

  $("addSelectedBuyersBtn").disabled =
    selectedCount === 0;

  const allSelected =
    checkboxes.length > 0 &&
    selectedCount === checkboxes.length;

  $("selectAllPlaces").checked = allSelected;

  $("selectAllPlaces").disabled =
    checkboxes.length === 0;
}


// Individual checkbox selection
$("placesResults").addEventListener("change", function(event) {

  if (event.target.classList.contains("place-checkbox")) {

    updateSelectionControls();

  }

});


// Select all available businesses
$("selectAllPlaces").addEventListener("change", function() {

  const checkboxes = document.querySelectorAll(
    ".place-checkbox:not(:disabled)"
  );

  checkboxes.forEach(checkbox => {

    checkbox.checked = $("selectAllPlaces").checked;

  });

  updateSelectionControls();

});


// =============================================
// ADD ONLY SELECTED BUSINESSES TO DIRECTORY
// =============================================

$("addSelectedBuyersBtn").addEventListener("click", function() {

  const selectedCheckboxes = document.querySelectorAll(
    ".place-checkbox:checked"
  );

  if (selectedCheckboxes.length === 0) {

    alert("Please select at least one business.");

    return;
  }

  const category = $("category").value.trim();

  const country = $("country").value.trim();

  let added = 0;

  let duplicates = 0;

  selectedCheckboxes.forEach(checkbox => {

    const index = Number(checkbox.value);

    const business = placesSearchResults[index];

    if (!business) return;

    // Check duplicates again before saving
    if (isDuplicateBusiness(business)) {

      duplicates++;

      return;
    }

    const newBuyer = {

      id: Date.now() + Math.floor(Math.random() * 1000000),

      placeId: business.id || "",

      name:
        business.displayName?.text || "Unknown business",

      country: country,

      email: "",

      phone:
        business.nationalPhoneNumber || "",

      website:
        business.websiteUri || "",

      category: category,

      source: "Google Places API",

      status: "New",

      notes:
        business.formattedAddress || "Address unavailable",

      followup: ""

    };

    buyers.push(newBuyer);

    added++;

  });

  // Save selected buyers
  if (added > 0) {

    saveData();

    render();

  }

  // Clear all temporary search results
  placesSearchResults = [];

  $("placesResults").innerHTML = "";

  // Clear business category and country
  $("category").value = "";

  $("country").value = "";

  // Reset selection controls
  $("selectAllPlaces").checked = false;

  $("selectAllPlaces").disabled = false;

  $("selectedPlacesCount").textContent = "0 selected";

  $("addSelectedBuyersBtn").disabled = true;

  // Hide selection controls
  $("placesSelectionActions").hidden = true;

  // Display completion message
  $("searchMessage").textContent =
    `${added} selected business(es) added successfully. ` +
    `${duplicates} duplicate(s) skipped. Search fields and results cleared.`;

  $("searchMessage").className =
    "text-success small mt-3";

  alert(
    `${added} business(es) added to Buyer Directory.\n` +
    `${duplicates} duplicate(s) skipped.\n\n` +
    "Remaining search results have been cleared."
  );

});

// =============================================
// GOOGLE PLACES SEARCH BUTTON
// =============================================

$("searchBusinessesBtn").addEventListener(
  "click",
  searchBusinesses
);


// =============================================
// INITIAL DASHBOARD DISPLAY
// =============================================

render();