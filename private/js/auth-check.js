// Vérification de l'authentification pour les pages protégées
(async function() {
  try {
    const response = await fetch(`${window.location.origin}/api/auth/status`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Erreur de vérification');
    }
    
    const data = await response.json();
    
    if (!data.authenticated) {
      // Rediriger vers la page de connexion (URL secrète)
      window.location.href = '/admin-secret-login-8934';
    }
  } catch (error) {
    console.error('Erreur de vérification d\'authentification:', error);
    // En cas d'erreur, rediriger vers la page de connexion (URL secrète)
    window.location.href = '/admin-secret-login-8934';
  }
})();

