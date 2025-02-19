// --- Global Variables for Edit Mode ---
let pendingEditIndex = null;
let pendingEditOriginal = null;

// --- LocalStorage Helpers ---
function getRecords() {
  const records = localStorage.getItem('records');
  return records ? JSON.parse(records) : [];
}

function setRecords(records) {
  localStorage.setItem('records', JSON.stringify(records));
}

// --- Display Records & Update Footer ---
function displayRecords() {
  const records = getRecords();
  const recordsBody = document.getElementById('records-body');
  recordsBody.innerHTML = '';
  let totalConsumed = 0;
  
  records.forEach((record, index) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-index', index);
    if (record.deleted) {
      tr.classList.add('deleted');
    }
    
    // --- Name Cell ---
    const nameTd = document.createElement('td');
    const nameSpan = document.createElement('span');
    nameSpan.innerText = record.name;
    nameSpan.classList.add('editable');
    nameSpan.contentEditable = record.editing ? "true" : "false";
    nameTd.appendChild(nameSpan);
    
    // --- Receiver Cell ---
    const receiverTd = document.createElement('td');
    const receiverSpan = document.createElement('span');
    receiverSpan.innerText = record.receiver;
    receiverSpan.classList.add('editable');
    receiverSpan.contentEditable = record.editing ? "true" : "false";
    receiverTd.appendChild(receiverSpan);
    
    // --- Amount Cell ---
    const amountTd = document.createElement('td');
    const amountSpan = document.createElement('span');
    amountSpan.innerText = record.amount;
    amountSpan.classList.add('editable');
    amountSpan.contentEditable = record.editing ? "true" : "false";
    amountTd.appendChild(amountSpan);
    amountTd.insertAdjacentHTML('beforeend', ' AFG');
    
    // --- Date Cell ---
    const dateTd = document.createElement('td');
    const dateSpan = document.createElement('span');
    dateSpan.innerText = record.date;
    dateSpan.classList.add('editable');
    dateSpan.contentEditable = record.editing ? "true" : "false";
    dateTd.appendChild(dateSpan);
    
    // --- Actions Cell ---
    const actionsTd = document.createElement('td');
    
    if (record.editing) {
      // In editing mode: Show Save and Cancel Edit buttons
      const saveBtn = document.createElement('button');
      saveBtn.innerText = "Save";
      saveBtn.classList.add('action-btn', 'update-btn');
      saveBtn.addEventListener('click', () => saveEdit(index));
      actionsTd.appendChild(saveBtn);
      
      const cancelEditBtn = document.createElement('button');
      cancelEditBtn.innerText = "Cancel Edit";
      cancelEditBtn.classList.add('action-btn', 'cancel-btn');
      cancelEditBtn.addEventListener('click', () => {
        if (confirm("Do you want to cancel editing? Changes will be lost.")) {
          cancelEdit(index);
        }
      });
      actionsTd.appendChild(cancelEditBtn);
    } else {
      // Not in editing mode: Show Edit, Delete/Undo, and Cancel (permanent delete) buttons
      const editBtn = document.createElement('button');
      editBtn.innerText = "Edit";
      editBtn.classList.add('action-btn', 'update-btn');
      editBtn.addEventListener('click', () => requestEdit(index));
      actionsTd.appendChild(editBtn);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = record.deleted ? "Undo Delete" : "Delete";
      deleteBtn.classList.add('action-btn', record.deleted ? 'undo-btn' : 'delete-btn');
      deleteBtn.addEventListener('click', () => {
        if (confirm("Do you really want to " + (record.deleted ? "undo delete" : "delete") + " this record?")) {
          toggleDelete(index);
        }
      });
      actionsTd.appendChild(deleteBtn);
      
      const cancelBtn = document.createElement('button');
      cancelBtn.innerText = "Cancel";
      cancelBtn.classList.add('action-btn', 'cancel-btn');
      cancelBtn.addEventListener('click', () => {
        if (confirm("Do you really want to permanently delete this record?")) {
          cancelRecord(index);
        }
      });
      actionsTd.appendChild(cancelBtn);
    }
    
    tr.appendChild(nameTd);
    tr.appendChild(receiverTd);
    tr.appendChild(amountTd);
    tr.appendChild(dateTd);
    tr.appendChild(actionsTd);
    recordsBody.appendChild(tr);
    
    // Accumulate total for non-deleted records
    if (!record.deleted) {
      totalConsumed += parseFloat(record.amount);
    }
  });
  
  // Update Footer:
  const mainMoney = parseFloat(localStorage.getItem('globalMainMoney')) || 0;
  document.getElementById('main-money-display').innerText = mainMoney;
  
  document.getElementById('consumed-amount').innerText = totalConsumed;
  
  // Calculate Remaining Money = Main Money - Consumed
  const remainingMoney = mainMoney - totalConsumed;
  document.getElementById('remaining-money').innerText = remainingMoney;
  
  // Determine color for Consumed Amount based on ratio
  const consumedElem = document.getElementById('consumed-amount');
  if (mainMoney > 0) {
    const ratio = totalConsumed / mainMoney;
    if (ratio < 0.5) {
      consumedElem.style.color = "green";
    } else if (ratio < 1) {
      consumedElem.style.color = "orange";
    } else {
      consumedElem.style.color = "red";
    }
  } else {
    consumedElem.style.color = "black";
  }
}

// --- Edit Mode Functions ---
function requestEdit(index) {
  pendingEditIndex = index;
  const records = getRecords();
  pendingEditOriginal = { ...records[index] };
  showModal("Do you want to update this record?");
}

function saveEdit(index) {
  const tr = document.querySelector(`tr[data-index="${index}"]`);
  if (tr) {
    const name = tr.querySelector('td:nth-child(1) .editable').innerText.trim();
    const receiver = tr.querySelector('td:nth-child(2) .editable').innerText.trim();
    const amountText = tr.querySelector('td:nth-child(3) .editable').innerText.trim();
    const date = tr.querySelector('td:nth-child(4) .editable').innerText.trim();
    const amount = parseFloat(amountText) || pendingEditOriginal.amount;
    
    let records = getRecords();
    records[index].name = name;
    records[index].receiver = receiver;
    records[index].amount = amount;
    records[index].date = date;
    records[index].editing = false;
    setRecords(records);
    pendingEditIndex = null;
    pendingEditOriginal = null;
    displayRecords();
  }
}

function cancelEdit(index) {
  let records = getRecords();
  if (pendingEditOriginal && pendingEditIndex === index) {
    records[index] = pendingEditOriginal;
  }
  records[index].editing = false;
  setRecords(records);
  pendingEditIndex = null;
  pendingEditOriginal = null;
  displayRecords();
}

// --- Modal Functions for Update Confirmation ---
function showModal(message) {
  const modal = document.getElementById('modal');
  modal.querySelector('p').innerText = message;
  modal.style.display = 'block';
}

function hideModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('modal-yes').addEventListener('click', () => {
  if (pendingEditIndex !== null) {
    // Enable editing mode for the record
    let records = getRecords();
    records[pendingEditIndex].editing = true;
    setRecords(records);
    displayRecords();
  }
  pendingEditIndex = null;
  pendingEditOriginal = null;
  hideModal();
});

document.getElementById('modal-no').addEventListener('click', () => {
  pendingEditIndex = null;
  pendingEditOriginal = null;
  hideModal();
  displayRecords();
});

// --- Other Record Operations ---
function toggleDelete(index) {
  let records = getRecords();
  records[index].deleted = !records[index].deleted;
  setRecords(records);
  displayRecords();
}

function cancelRecord(index) {
  let records = getRecords();
  records.splice(index, 1);
  setRecords(records);
  displayRecords();
}

function clearAllRecords() {
  if (confirm("Do you really want to delete all records?")) {
    localStorage.removeItem('records');
    displayRecords();
  }
}

// --- Header Operations ---
// Add new record using header values
function addNewRecord() {
  const globalNameInput = document.getElementById('global-name');
  const globalReceiverInput = document.getElementById('global-receiver');
  const newAmountInput = document.getElementById('new-amount');
  
  const name = globalNameInput.value.trim();
  const receiver = globalReceiverInput.value.trim();
  const amount = parseFloat(newAmountInput.value);
  
  if (!name) {
    alert("Please enter your name in the header.");
    return;
  }
  if (!receiver) {
    alert("Please enter the receiver's name in the header.");
    return;
  }
  if (isNaN(amount)) {
    alert("Please enter a valid amount.");
    return;
  }
  
  const records = getRecords();
  const date = new Date().toLocaleString();
  const record = {
    name,
    receiver,
    amount,
    date,
    deleted: false,
    editing: false
  };
  records.push(record);
  setRecords(records);
  newAmountInput.value = '';
  displayRecords();
}

// Update global info (Name, Receiver and Main Money) in localStorage
function updateGlobalInfo() {
  const globalNameInput = document.getElementById('global-name');
  const globalReceiverInput = document.getElementById('global-receiver');
  const globalMainMoneyInput = document.getElementById('global-main-money');
  
  localStorage.setItem('globalName', globalNameInput.value.trim());
  localStorage.setItem('globalReceiver', globalReceiverInput.value.trim());
  localStorage.setItem('globalMainMoney', globalMainMoneyInput.value.trim());
  
  alert("Global info updated.");
}

// Load global info from localStorage on page load
function loadGlobalInfo() {
  const globalName = localStorage.getItem('globalName');
  const globalReceiver = localStorage.getItem('globalReceiver');
  const globalMainMoney = localStorage.getItem('globalMainMoney');
  
  if (globalName) {
    document.getElementById('global-name').value = globalName;
  }
  if (globalReceiver) {
    document.getElementById('global-receiver').value = globalReceiver;
  }
  if (globalMainMoney) {
    document.getElementById('global-main-money').value = globalMainMoney;
  }
}

// --- Event Listeners ---
document.getElementById('update-global-btn').addEventListener('click', updateGlobalInfo);
document.getElementById('submit-record').addEventListener('click', addNewRecord);
document.getElementById('cancel-all').addEventListener('click', clearAllRecords);

// On page load
window.onload = () => {
  loadGlobalInfo();
  displayRecords();
};
