// Datos de ejemplo para la aplicación
const sampleTransactions = [
  { id: 1, type: 'sent', amount: -50.00, description: 'Transferencia a María López', date: '2023-06-15' },
  { id: 2, type: 'received', amount: 120.00, description: 'Pago de Juan Pérez', date: '2023-06-14' },
  { id: 3, type: 'deposit', amount: 200.00, description: 'Depósito inicial', date: '2023-06-10' },
  { id: 4, type: 'sent', amount: -35.50, description: 'Pago de servicios', date: '2023-06-08' }
];

const sampleContacts = [
  { id: 1, name: 'María López', email: 'maria@example.com' },
  { id: 2, name: 'Juan Pérez', email: 'juan@example.com' },
  { id: 3, name: 'Carlos Rodríguez', email: 'carlos@example.com' },
  { id: 4, name: 'Ana García', email: 'ana@example.com' }
];

// Estado de la aplicación
let currentUser = null;
let userBalance = 1250.75;
let transactions = [...sampleTransactions];
let contacts = [...sampleContacts];

// Funciones para gestionar la navegación
function showPage(pageId) {
  // Oculta todas las páginas y muestra la solicitada
  $('.page').addClass('d-none');
  $(`#${pageId}`).removeClass('d-none');

  // Ajusta la visibilidad de la barra de navegación (simulación)
  if (pageId === 'login-page') {
    $('nav').hide();
  } else {
    $('nav').show();
  }
}

// Inicialización de la aplicación
$(document).ready(function() {
  // Verificar si el usuario está logueado
  const savedUser = localStorage.getItem('alkeWalletUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showPage('menu-page');
    updateBalanceDisplay();
  } else {
    showPage('login-page');
  }

  // Cargar datos iniciales
  loadRecentTransactions();
  loadFrequentContacts();
  loadAllTransactions();

  // Configurar eventos
  setupEventHandlers();
});

// Configuración de manejadores de eventos
function setupEventHandlers() {
  // Login
  $('#loginForm').on('submit', function(e) {
    e.preventDefault();
    const email = $('#email').val();
    const password = $('#password').val();

    // Validación simple (en un caso real, esto sería una llamada a un servidor)
    if (email === 'test@alkewallet.com' && password === '123456') { // Credenciales dummy
      currentUser = { email, name: 'Usuario Demo' };
      localStorage.setItem('alkeWalletUser', JSON.stringify(currentUser));
      $('#loginError').addClass('d-none');
      showPage('menu-page');
      updateBalanceDisplay();
    } else {
      $('#loginError').removeClass('d-none');
    }
  });

  // Logout
  $('#logoutBtn').on('click', function(e) {
    e.preventDefault(); // Previene la navegación si se mantiene un href="#"
    currentUser = null;
    localStorage.removeItem('alkeWalletUser');
    showPage('login-page');
    $('#loginForm')[0].reset();
  });

  // Enviar dinero
  $('#sendMoneyForm').on('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat($('#amount').val());
    const description = $('#description').val();
    const contactName = $('#contactSearch').val(); // Usamos el nombre del campo de búsqueda

    if (!contactName) {
      showMessage('Error', 'Debe seleccionar o escribir un contacto válido.');
      return;
    }

    if (amount > userBalance) {
      showMessage('Error', 'Saldo insuficiente para realizar esta transacción.');
      return;
    }

    // Actualizar saldo
    userBalance -= amount;
    updateBalanceDisplay();

    // Agregar transacción
    const newTransaction = {
      id: transactions.length + 1,
      type: 'sent',
      amount: -amount,
      description: `Transferencia a ${contactName}` + (description ? `: ${description}` : ''),
      date: new Date().toISOString().split('T')[0]
    };

    transactions.unshift(newTransaction);
    loadRecentTransactions();
    loadAllTransactions();

    // Mostrar mensaje de éxito
    showMessage('Éxito', `Has enviado $${amount.toFixed(2)} a ${contactName} correctamente.`);

    // Limpiar formulario
    $(this)[0].reset();
    $('#searchResults').hide();
  });

  // Agregar contacto
  $('#addContactForm').on('submit', function(e) {
    e.preventDefault();
    const name = $('#contactName').val();
    const email = $('#contactEmail').val();

    // Verificar si el contacto ya existe
    const existingContact = contacts.find(contact =>
      contact.email.toLowerCase() === email.toLowerCase()
    );

    if (existingContact) {
      showMessage('Aviso', 'Este contacto ya existe en tu lista.');
      return;
    }

    // Agregar nuevo contacto
    const newContact = {
      id: contacts.length + 1,
      name,
      email
    };

    contacts.push(newContact);
    loadFrequentContacts();

    // Mostrar mensaje de éxito
    showMessage('Éxito', `Contacto "${name}" agregado correctamente.`);

    // Limpiar formulario
    $(this)[0].reset();
  });

  // Realizar depósito
  $('#depositForm').on('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat($('#depositAmount').val());
    const paymentMethod = $('#paymentMethod').val();

    if (!paymentMethod) {
      showMessage('Error', 'Debe seleccionar un método de pago.');
      return;
    }

    // Actualizar saldo
    userBalance += amount;
    updateBalanceDisplay();

    // Agregar transacción
    const newTransaction = {
      id: transactions.length + 1,
      type: 'deposit',
      amount: amount,
      description: `Depósito vía ${getPaymentMethodName(paymentMethod)}`,
      date: new Date().toISOString().split('T')[0]
    };

    transactions.unshift(newTransaction);
    loadRecentTransactions();
    loadAllTransactions();

    // Mostrar mensaje de éxito
    showMessage('Éxito', `Has depositado $${amount.toFixed(2)} correctamente.`);

    // Limpiar formulario
    $(this)[0].reset();
  });

  // Búsqueda de contactos con autocompletar
  $('#contactSearch').on('input', function() {
    const searchTerm = $(this).val().toLowerCase();
    const results = $('#searchResults');

    if (searchTerm.length < 2) {
      results.hide().empty();
      return;
    }

    const filteredContacts = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm)
    );

    results.empty();

    if (filteredContacts.length > 0) {
      filteredContacts.forEach(contact => {
        results.append(`
                          <div class="contact-item" data-contact-id="${contact.id}" data-contact-name="${contact.name}">
                              <strong>${contact.name}</strong><br>
                              <small class="text-muted">${contact.email}</small>
                          </div>
                      `);
      });

      // Configurar evento para seleccionar contacto
      $('.contact-item').on('click', function() {
        const contactName = $(this).data('contact-name');
        $('#contactSearch').val(contactName);
        results.hide();
      });

      // Mostrar resultados
      results.show();
    } else {
      results.hide();
    }
  });

  // Cerrar resultados de búsqueda al hacer clic fuera
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.search-box').length) {
      $('#searchResults').hide();
    }
  });

  // Simulación de navegación entre páginas (usando los enlaces de la navbar)
  $('a[href="menu.html"]').on('click', function(e) {
    e.preventDefault();
    showPage('menu-page');
  });

  $('a[href="transactions.html"]').on('click', function(e) {
    e.preventDefault();
    showPage('transactions-page');
  });

  $('a[href="deposit.html"]').on('click', function(e) {
    e.preventDefault();
    showPage('deposit-page');
  });

  $('a[href="sendmoney.html"]').on('click', function(e) {
    e.preventDefault();
    showPage('sendmoney-page');
  });
}

// Funciones auxiliares
function loadRecentTransactions() {
  const container = $('#recentTransactions');
  container.empty();

  const recent = transactions.slice(0, 3);

  if (recent.length === 0) {
    container.append('<p class="text-muted">No hay transacciones recientes</p>');
    return;
  }

  recent.forEach(transaction => {
    const amountClass = transaction.amount > 0 ? 'positive text-success' : 'negative text-danger';
    const amountSign = transaction.amount > 0 ? '+' : '';

    container.append(`
                  <div class="transaction-item border-bottom py-2">
                      <div class="d-flex justify-content-between">
                          <div>
                              <strong>${transaction.description}</strong><br>
                              <small class="text-muted">${transaction.date}</small>
                          </div>
                          <div class="${amountClass} fw-bold">
                              ${amountSign}$${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                      </div>
                  </div>
              `);
  });
}

function loadAllTransactions() {
  const container = $('#allTransactions');
  container.empty();

  if (transactions.length === 0) {
    container.append('<p class="text-muted">No hay transacciones</p>');
    return;
  }

  transactions.forEach(transaction => {
    const amountClass = transaction.amount > 0 ? 'positive text-success' : 'negative text-danger';
    const amountSign = transaction.amount > 0 ? '+' : '';
    // Icono basado en el signo del monto
    const icon = transaction.amount > 0 ? 'fa-arrow-down' : 'fa-arrow-up';
    const iconClass = transaction.amount > 0 ? 'text-success' : 'text-danger';

    container.append(`
                  <div class="transaction-item border-bottom py-2">
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="d-flex align-items-center">
                              <i class="fas ${icon} ${iconClass} me-3 fa-lg"></i>
                              <div>
                                  <strong>${transaction.description}</strong><br>
                                  <small class="text-muted">${transaction.date}</small>
                              </div>
                          </div>
                          <div class="${amountClass} fw-bold">
                              ${amountSign}$${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                      </div>
                  </div>
              `);
  });
}

function loadFrequentContacts() {
  const container = $('#frequentContacts');
  container.empty();

  const frequent = contacts.slice(0, 4);

  if (frequent.length === 0) {
    container.append('<p class="text-muted">No hay contactos</p>');
    return;
  }

  frequent.forEach(contact => {
    container.append(`
                  <div class="contact-item py-2 border-bottom">
                      <div class="d-flex align-items-center">
                          <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                              ${contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                              <strong>${contact.name}</strong><br>
                              <small class="text-muted">${contact.email}</small>
                          </div>
                      </div>
                  </div>
              `);
  });
}

function updateBalanceDisplay() {
  // Asegura que el saldo se muestre con dos decimales
  $('#currentBalance').text(userBalance.toFixed(2));
}

function getPaymentMethodName(method) {
  switch(method) {
    case 'credit': return 'Tarjeta de Crédito';
    case 'debit': return 'Tarjeta de Débito';
    case 'transfer': return 'Transferencia Bancaria';
    default: return 'Método desconocido';
  }
}

function showMessage(title, message) {
  $('#messageModalTitle').text(title);
  $('#messageModalBody').text(message);
  // Usa la función de Bootstrap para mostrar el modal
  const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
  messageModal.show();
}
