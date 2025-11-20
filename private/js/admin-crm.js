// Utiliser window.location.origin pour s'adapter à l'environnement
const API_BASE = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') + '/api';

let allClients = [];
let currentClientId = null;
let currentUser = null;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrentUser();
  loadClients();
  setupEventListeners();
  setupLogout();
});

async function fetchCurrentUser() {
  try {
    const response = await fetch(`${window.location.origin}/api/auth/status`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user || null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l’utilisateur courant:', error);
  }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Recherche
  document.getElementById('search-input').addEventListener('input', filterClients);
  document.getElementById('filter-service').addEventListener('change', filterClients);
  document.getElementById('filter-type').addEventListener('change', filterClients);
  document.getElementById('refresh-btn').addEventListener('click', () => loadClients());
  const editTelephoneInput = document.getElementById('edit-telephone');
  if (editTelephoneInput) {
    editTelephoneInput.addEventListener('input', handleTelephoneInputMask);
  }
  
  // Modals
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit-client').addEventListener('click', closeEditModal);
  document.getElementById('edit-client-form').addEventListener('submit', handleEditClientSubmit);
  document.getElementById('close-echange-modal').addEventListener('click', closeEchangeModal);
  document.getElementById('cancel-echange').addEventListener('click', closeEchangeModal);
  document.getElementById('echange-form').addEventListener('submit', handleEchangeSubmit);
  
  // Fermer modal en cliquant à l'extérieur
  document.getElementById('client-modal').addEventListener('click', (e) => {
    if (e.target.id === 'client-modal') closeModal();
  });
  document.getElementById('edit-client-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-client-modal') closeEditModal();
  });
  document.getElementById('echange-modal').addEventListener('click', (e) => {
    if (e.target.id === 'echange-modal') closeEchangeModal();
  });
}

// Charger tous les clients
async function loadClients() {
  try {
    const response = await fetch(`${API_BASE}/clients`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur lors du chargement des clients');
    
    allClients = await response.json();
    displayClients(allClients);
    updateStatistics();
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('clients-container').innerHTML = `
      <div class="text-center py-12">
        <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto"></i>
        <p class="text-red-500 mt-4">Erreur de connexion au serveur. Assurez-vous que le serveur est démarré.</p>
      </div>
    `;
    lucide.createIcons();
  }
}

// Fonction pour parser les services depuis la base de données
function parseServices(serviceDemande) {
  if (!serviceDemande) return [];
  
  try {
    // Essayer de parser comme JSON d'abord
    const parsed = JSON.parse(serviceDemande);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    // Si ce n'est pas du JSON, split par virgule
  }
  
  // Split par virgule et nettoyer
  return serviceDemande.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

// Fonction pour obtenir la couleur d'un service
function getServiceColor(service) {
  const colorMap = {
    'Création de site web': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'Identité de marque': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'Stratégie digitale': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'Diagnostic Web': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    'Autre': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
  };
  
  return colorMap[service] || { bg: 'bg-[#B48A3C]/10', text: 'text-[#B48A3C]', border: 'border-[#B48A3C]/30' };
}

// Afficher les clients
function displayClients(clients) {
  const container = document.getElementById('clients-container');
  
  if (clients.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <i data-lucide="users" class="w-12 h-12 text-[#616972] mx-auto"></i>
        <p class="text-[#616972] mt-4">Aucun client trouvé.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = clients.map(client => {
    const services = parseServices(client.service_demande);
    
    return `
    <div class="bg-white border border-[#B6B4AC]/20 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <h3 class="text-xl font-bold text-[#091A30]">${client.prenom} ${client.nom}</h3>
            ${services.map(service => {
              const colors = getServiceColor(service);
              return `<span class="px-2.5 py-1 ${colors.bg} ${colors.text} ${colors.border} border text-xs font-medium rounded-full whitespace-nowrap">${service}</span>`;
            }).join('')}
          </div>
          <div class="space-y-1 text-sm text-[#616972]">
            ${client.email ? `<div class="flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4"></i> ${client.email}</div>` : ''}
            ${client.telephone ? `<div class="flex items-center gap-2"><i data-lucide="phone" class="w-4 h-4"></i> ${client.telephone}</div>` : ''}
            ${client.siret ? `<div class="flex items-center gap-2"><i data-lucide="building" class="w-4 h-4"></i> SIRET: ${client.siret}</div>` : ''}
          </div>
          <div class="mt-2 text-xs text-[#616972]">
            Créé le ${new Date(client.date_creation).toLocaleDateString('fr-FR')} par ${getClientCreatorLabel(client)}
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="viewClient(${client.id})" 
            class="inline-flex items-center justify-center bg-[#091A30] hover:bg-[#050F1A] text-white px-4 py-2 rounded-md transition-colors text-sm">
            <i data-lucide="eye" class="w-4 h-4 mr-2"></i>
            Voir
          </button>
          <button onclick="openEditClient(${client.id})" 
            class="inline-flex items-center justify-center border-2 border-[#B48A3C] text-[#B48A3C] hover:bg-[#B48A3C]/10 px-4 py-2 rounded-md transition-colors text-sm">
            <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
            Modifier
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');
  
  lucide.createIcons();
}

// Filtrer les clients
function filterClients() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const serviceFilter = document.getElementById('filter-service').value;
  const typeFilter = document.getElementById('filter-type').value;
  
  let filtered = allClients.filter(client => {
    const matchesSearch = !search || 
      client.nom.toLowerCase().includes(search) ||
      client.prenom.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      (client.service_demande && client.service_demande.toLowerCase().includes(search));
    
    // Pour le filtre de service, vérifier si le service fait partie des services du client
    const matchesService = !serviceFilter || 
      (() => {
        const services = parseServices(client.service_demande);
        return services.some(s => s.includes(serviceFilter));
      })();
    
    // Filtre par type (client/prospect)
    const matchesType = !typeFilter || (client.type || 'prospect') === typeFilter;
    
    return matchesSearch && matchesService && matchesType;
  });
  
  displayClients(filtered);
}

// Mettre à jour les statistiques
async function updateStatistics() {
  document.getElementById('total-clients').textContent = allClients.length;
  
  // Compter les clients et prospects
  const clientsActifs = allClients.filter(c => (c.type || 'prospect') === 'client').length;
  const prospects = allClients.filter(c => (c.type || 'prospect') === 'prospect').length;
  
  document.getElementById('total-clients-actifs').textContent = clientsActifs;
  document.getElementById('total-prospects').textContent = prospects;
  
  try {
    const response = await fetch(`${API_BASE}/echanges`, {
      credentials: 'include'
    });
    if (response.ok) {
      const echanges = await response.json();
      document.getElementById('total-echanges').textContent = echanges.length;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des échanges:', error);
  }
}

// Voir un client (avec ses échanges)
async function viewClient(id) {
  currentClientId = id;
  try {
    const response = await fetch(`${API_BASE}/clients/${id}/complet`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur lors du chargement du client');
    
    const client = await response.json();
    displayClientModal(client);
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du chargement du client');
  }
}

// Afficher le modal client
function displayClientModal(client) {
  document.getElementById('modal-title').textContent = `${client.prenom} ${client.nom}`;
  
  const content = `
    <div class="space-y-6">
      <!-- Informations du client -->
      <div>
        <h3 class="text-lg font-semibold text-[#091A30] mb-4 flex items-center gap-2">
          <i data-lucide="user" class="w-5 h-5"></i>
          Informations
        </h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-[#616972]">Nom</label>
            <p class="font-medium text-[#091A30]">${client.nom}</p>
          </div>
          <div>
            <label class="text-sm text-[#616972]">Prénom</label>
            <p class="font-medium text-[#091A30]">${client.prenom}</p>
          </div>
          <div>
            <label class="text-sm text-[#616972]">Email</label>
            <p class="font-medium text-[#091A30]">${client.email || '-'}</p>
          </div>
          <div>
            <label class="text-sm text-[#616972]">Téléphone</label>
            <p class="font-medium text-[#091A30]">${client.telephone || '-'}</p>
          </div>
          <div>
            <label class="text-sm text-[#616972]">SIRET</label>
            <p class="font-medium text-[#091A30]">${client.siret || '-'}</p>
          </div>
          <div>
            <label class="text-sm text-[#616972]">TVA Intracommunautaire</label>
            <p class="font-medium text-[#091A30]">${client.tva_intracommunautaire || '-'}</p>
          </div>
          <div class="md:col-span-2">
            <label class="text-sm text-[#616972]">Type</label>
            <p class="font-medium text-[#091A30]">
              ${(() => {
                const isClient = (client.type || 'prospect') === 'client';
                return isClient 
                  ? '<span class="px-3 py-1 bg-green-100 text-green-700 border border-green-300 text-sm font-medium rounded-full">Client</span>'
                  : '<span class="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-300 text-sm font-medium rounded-full">Prospect</span>';
              })()}
            </p>
          </div>
          <div class="md:col-span-2">
            <label class="text-sm text-[#616972]">Services demandés</label>
            <div class="flex flex-wrap gap-2 mt-1">
              ${(() => {
                const services = parseServices(client.service_demande);
                return services.map(service => {
                  const colors = getServiceColor(service);
                  return `<span class="px-3 py-1.5 ${colors.bg} ${colors.text} ${colors.border} border text-sm font-medium rounded-full">${service}</span>`;
                }).join('');
              })()}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Échanges -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-[#091A30] flex items-center gap-2">
            <i data-lucide="message-circle" class="w-5 h-5"></i>
            Échanges (${client.echanges?.length || 0})
          </h3>
          <button onclick="openNewEchange(${client.id})" 
            class="inline-flex items-center justify-center bg-[#B48A3C] hover:bg-[#9A7332] text-white px-4 py-2 rounded-md text-sm transition-colors">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
            Nouvel échange
          </button>
        </div>
        
        <div id="echanges-list" class="space-y-3">
          ${client.echanges && client.echanges.length > 0 ? 
            client.echanges.map(echange => `
              <div class="border border-[#B6B4AC]/30 rounded-md p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <span class="px-2 py-1 bg-[#091A30]/10 text-[#091A30] text-xs font-medium rounded-full">
                      ${echange.type}
                    </span>
                    ${echange.sujet ? `<span class="ml-2 text-sm font-medium text-[#091A30]">${echange.sujet}</span>` : ''}
                  </div>
                  <div class="flex gap-2">
                    <button onclick="editEchange(${echange.id}, ${client.id})" 
                      class="text-[#616972] hover:text-[#091A30]" title="Modifier">
                      <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteEchange(${echange.id})" 
                      class="text-red-500 hover:text-red-700" title="Supprimer">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
                <p class="text-sm text-[#616972] mb-2">${echange.contenu}</p>
                <p class="text-xs text-[#616972]">${new Date(echange.date_creation).toLocaleString('fr-FR')}</p>
              </div>
            `).join('') : 
            '<p class="text-[#616972] text-sm italic">Aucun échange pour ce client.</p>'
          }
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-4 pt-4 border-t border-[#B6B4AC]/30">
        <button onclick="openEditClient(${client.id})" 
          class="flex-1 inline-flex items-center justify-center border-2 border-[#B48A3C] text-[#B48A3C] hover:bg-[#B48A3C]/10 px-4 py-2 rounded-md transition-colors">
          <i data-lucide="edit" class="w-4 h-4 mr-2"></i>
          Modifier le client
        </button>
        <button onclick="deleteClient(${client.id})" 
          class="inline-flex items-center justify-center border-2 border-red-500 text-red-500 hover:bg-red-50 px-4 py-2 rounded-md transition-colors">
          <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i>
          Supprimer
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('modal-content').innerHTML = content;
  document.getElementById('client-modal').classList.remove('hidden');
  lucide.createIcons();
}

// Fermer le modal
function closeModal() {
  document.getElementById('client-modal').classList.add('hidden');
  currentClientId = null;
}

// Ouvrir le modal d'édition
async function openEditClient(id) {
  try {
    const response = await fetch(`${API_BASE}/clients/${id}/complet`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur lors du chargement du client');
    
    const client = await response.json();
    displayEditClientModal(client);
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du chargement du client');
  }
}

// Afficher le modal d'édition
function displayEditClientModal(client) {
  document.getElementById('edit-client-id').value = client.id;
  document.getElementById('edit-nom').value = client.nom || '';
  document.getElementById('edit-prenom').value = client.prenom || '';
  document.getElementById('edit-email').value = client.email || '';
  document.getElementById('edit-telephone').value = sanitizePhoneValue(client.telephone);
  document.getElementById('edit-siret').value = client.siret || '';
  document.getElementById('edit-tva').value = client.tva_intracommunautaire || '';
  
  // Type
  const type = client.type || 'prospect';
  document.getElementById('edit-type-prospect').checked = type === 'prospect';
  document.getElementById('edit-type-client').checked = type === 'client';
  
  // Services
  const services = parseServices(client.service_demande);
  document.querySelectorAll('input[name="edit-services"]').forEach(checkbox => {
    checkbox.checked = services.includes(checkbox.value);
  });
  
  // Réinitialiser les messages d'erreur
  document.getElementById('edit-services-error').classList.add('hidden');
  document.getElementById('edit-client-message').classList.add('hidden');
  
  // Afficher le modal
  document.getElementById('edit-client-modal').classList.remove('hidden');
  lucide.createIcons();
}

// Fermer le modal d'édition
function closeEditModal() {
  document.getElementById('edit-client-modal').classList.add('hidden');
  document.getElementById('edit-client-form').reset();
}

// Gérer la soumission du formulaire d'édition
async function handleEditClientSubmit(e) {
  e.preventDefault();
  
  const clientId = document.getElementById('edit-client-id').value;
  const nom = document.getElementById('edit-nom').value;
  const prenom = document.getElementById('edit-prenom').value;
  const email = document.getElementById('edit-email').value;
  const telephone = sanitizePhoneValue(document.getElementById('edit-telephone').value);
  const siret = document.getElementById('edit-siret').value;
  const tva = document.getElementById('edit-tva').value;
  const typeRadio = document.querySelector('input[name="edit-type"]:checked');
  const type = typeRadio ? typeRadio.value : 'prospect';
  
  // Récupérer les services sélectionnés
  const selectedServices = Array.from(document.querySelectorAll('input[name="edit-services"]:checked'))
    .map(checkbox => checkbox.value);
  
  // Valider qu'au moins un service est sélectionné
  const servicesError = document.getElementById('edit-services-error');
  if (selectedServices.length === 0) {
    servicesError.classList.remove('hidden');
    return;
  }
  servicesError.classList.add('hidden');
  
  const messageContainer = document.getElementById('edit-client-message');
  
  const requestBody = {
    nom,
    prenom,
    email,
    telephone: telephone || null,
    siret: siret || null,
    tva_intracommunautaire: tva || null,
    service_demande: JSON.stringify(selectedServices),
    type: type
  };
  
  try {
    const response = await fetch(`${API_BASE}/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    messageContainer.classList.remove('hidden');
    messageContainer.className = 'p-4 rounded-md';
    
    if (response.ok) {
      messageContainer.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-400');
      messageContainer.innerHTML = `
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle" class="w-5 h-5"></i>
          <span>Client mis à jour avec succès.</span>
        </div>
      `;
      lucide.createIcons();
      
      setTimeout(async () => {
        closeEditModal();
        await loadClients();
        if (currentClientId == clientId) {
          await viewClient(clientId);
        }
      }, 1000);
    } else {
      messageContainer.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-400');
      messageContainer.innerHTML = `
        <div class="flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-5 h-5"></i>
          <span>${data.error || 'Erreur lors de la mise à jour.'}</span>
        </div>
      `;
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erreur:', error);
    messageContainer.classList.remove('hidden');
    messageContainer.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-400');
    messageContainer.innerHTML = `
      <div class="flex items-center gap-2">
        <i data-lucide="alert-circle" class="w-5 h-5"></i>
        <span>Erreur de connexion au serveur.</span>
      </div>
    `;
    lucide.createIcons();
  }
}

// Supprimer un client
async function deleteClient(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) return;
  
  try {
    const response = await fetch(`${API_BASE}/clients/${id}`, { 
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      closeModal();
      await loadClients();
    } else {
      const data = await response.json();
      alert('Erreur: ' + (data.error || 'Impossible de supprimer le client'));
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la suppression du client');
  }
}

// Ouvrir le modal pour un nouvel échange
function openNewEchange(clientId) {
  document.getElementById('echange-client-id').value = clientId;
  document.getElementById('echange-id').value = '';
  document.getElementById('echange-form').reset();
  document.getElementById('echange-modal-title').textContent = 'Nouvel échange';
  document.getElementById('echange-message').classList.add('hidden');
  document.getElementById('echange-modal').classList.remove('hidden');
}

// Éditer un échange
async function editEchange(echangeId, clientId) {
  try {
    const response = await fetch(`${API_BASE}/clients/${clientId}/echanges`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur lors du chargement des échanges');
    
    const echanges = await response.json();
    const echange = echanges.find(e => e.id === echangeId);
    
    if (!echange) return;
    
    document.getElementById('echange-id').value = echange.id;
    document.getElementById('echange-client-id').value = clientId;
    document.getElementById('echange-type').value = echange.type;
    document.getElementById('echange-sujet').value = echange.sujet || '';
    document.getElementById('echange-contenu').value = echange.contenu;
    document.getElementById('echange-modal-title').textContent = 'Modifier l\'échange';
    document.getElementById('echange-message').classList.add('hidden');
    document.getElementById('echange-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du chargement de l\'échange');
  }
}

function sanitizePhoneValue(value = '') {
  return (value || '').replace(/\D/g, '').slice(0, 10);
}

function handleTelephoneInputMask(event) {
  event.target.value = sanitizePhoneValue(event.target.value);
}

function formatAccountLabel(username) {
  if (!username || typeof username !== 'string') {
    return 'Admin';
  }
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function getClientCreatorLabel(client) {
  if (client?.created_by) {
    return formatAccountLabel(client.created_by);
  }
  return formatAccountLabel(currentUser?.username);
}

// Gérer la soumission du formulaire d'échange
async function handleEchangeSubmit(e) {
  e.preventDefault();
  
  const echangeId = document.getElementById('echange-id').value;
  const clientId = document.getElementById('echange-client-id').value;
  const type = document.getElementById('echange-type').value;
  const sujet = document.getElementById('echange-sujet').value;
  const contenu = document.getElementById('echange-contenu').value;
  
  const messageContainer = document.getElementById('echange-message');
  
  try {
    const url = echangeId ? `${API_BASE}/echanges/${echangeId}` : `${API_BASE}/echanges`;
    const method = echangeId ? 'PUT' : 'POST';
    
    const body = echangeId 
      ? { type, sujet, contenu }
      : { client_id: parseInt(clientId), type, sujet, contenu };
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    messageContainer.classList.remove('hidden');
    
    if (response.ok) {
      messageContainer.className = 'p-4 rounded-md bg-green-100 text-green-800 border border-green-400';
      messageContainer.textContent = data.message || 'Échange enregistré avec succès.';
      
      setTimeout(async () => {
        closeEchangeModal();
        if (currentClientId) {
          await viewClient(currentClientId);
        } else {
          await viewClient(clientId);
        }
        await updateStatistics();
      }, 1000);
    } else {
      messageContainer.className = 'p-4 rounded-md bg-red-100 text-red-800 border border-red-400';
      messageContainer.textContent = data.error || 'Erreur lors de l\'enregistrement.';
    }
  } catch (error) {
    console.error('Erreur:', error);
    messageContainer.classList.remove('hidden');
    messageContainer.className = 'p-4 rounded-md bg-red-100 text-red-800 border border-red-400';
    messageContainer.textContent = 'Erreur de connexion au serveur.';
  }
}

// Fermer le modal d'échange
function closeEchangeModal() {
  document.getElementById('echange-modal').classList.add('hidden');
  document.getElementById('echange-form').reset();
  document.getElementById('echange-message').classList.add('hidden');
}

// Supprimer un échange
async function deleteEchange(echangeId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet échange ?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/echanges/${echangeId}`, { 
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      if (currentClientId) {
        await viewClient(currentClientId);
      }
      await updateStatistics();
    } else {
      const data = await response.json();
      alert('Erreur: ' + (data.error || 'Impossible de supprimer l\'échange'));
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la suppression de l\'échange');
  }
}

// Gérer la déconnexion
async function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) return;
      
      try {
        const apiUrl = window.location.origin + '/api/auth/logout';
        const response = await fetch(apiUrl, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          window.location.href = '/login.html';
        } else {
          alert('Erreur lors de la déconnexion.');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la déconnexion.');
      }
    });
  }
}

// Exposer les fonctions globalement pour les onclick
window.viewClient = viewClient;
window.openEditClient = openEditClient;
window.deleteClient = deleteClient;
window.openNewEchange = openNewEchange;
window.editEchange = editEchange;
window.deleteEchange = deleteEchange;

