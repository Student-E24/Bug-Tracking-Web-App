window.Auth = (() => {
  const SESSION_KEY = 'submission_auth_session';
  const LOGIN_PAGE = 'login.html';
  const HOME_PAGE = 'index.html';
  //username and password.
  const ADMIN_USERNAME = 'Mieg';
  const ADMIN_PASSWORD = 'TheGamer';

  function getUser() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.username) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(getUser());
  }

  function login(username, password) {
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');
    const isValid = normalizedUsername === ADMIN_USERNAME && normalizedPassword === ADMIN_PASSWORD;

    if (!isValid) return false;

    const session = {
      username: normalizedUsername,
      loginAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = LOGIN_PAGE;
  }

  function requireAuth() {
    if (isLoggedIn()) return true;
    window.location.href = LOGIN_PAGE;
    return false;
  }

  function redirectIfLoggedIn() {
    if (!isLoggedIn()) return false;
    window.location.href = HOME_PAGE;
    return true;
  }

  return {
    login,
    logout,
    getUser,
    isLoggedIn,
    requireAuth,
    redirectIfLoggedIn,
  };
})();
