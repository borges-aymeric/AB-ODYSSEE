// Vérifie qu'un utilisateur est authentifié avant d'accéder aux pages protégées
(async function () {
  const apiBase = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';

  try {
    const response = await fetch(`${apiBase}/api/auth/status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur de vérification');
    }

    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Erreur de vérification d\'authentification:', error);
    window.location.href = '/login.html';
  }
})();

