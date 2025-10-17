// ⚠️ استبدل هذه القيم من STEP 1
const msalConfig = {
    auth: {
        clientId: "cfd08665-82ef-4569-811d-6a00a19fc32f",  // من App Registration
        authority: "https://login.microsoftonline.com/3971483f-4751-43be-b778-bc164f9ad884",
        redirectUri: "https://azuretest100.site/admin/callback"
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    }
};

const loginRequest = {
    scopes: ["User.Read"]
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// Initialize MSAL
async function initializeMsal() {
    try {
        await msalInstance.initialize();
        const accounts = msalInstance.getAllAccounts();
        
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
            showAdminSection(accounts[0]);
        }
    } catch (error) {
        console.error('MSAL init error:', error);
    }
}

// Sign In
async function signIn() {
    try {
        const response = await msalInstance.loginPopup(loginRequest);
        msalInstance.setActiveAccount(response.account);
        showAdminSection(response.account);
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
    }
}

// Sign Out
function signOut() {
    msalInstance.logoutPopup();
}

// Show Admin Section
function showAdminSection(account) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('userName').textContent = account.name || account.username;
    
    loadAdminData();
}

// Get Access Token
async function getAccessToken() {
    const account = msalInstance.getActiveAccount();
    if (!account) {
        throw new Error('No active account');
    }

    try {
        const response = await msalInstance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: account
        });
        return response.accessToken;
    } catch (error) {
        // Fallback to interactive
        const response = await msalInstance.acquireTokenPopup({
            scopes: ["User.Read"]
        });
        return response.accessToken;
    }
}

// Load Admin Data
async function loadAdminData() {
    try {
        const response = await fetch('https://api.azuretest100.site/api/visitors');
        const data = await response.json();
        document.getElementById('adminVisitors').textContent = data.visitorCount;
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Admin Reset Counter
async function adminResetCounter() {
    if (!confirm('Are you sure you want to reset the counter?')) return;
    
    try {
        const token = await getAccessToken();
        
        const response = await fetch('https://api.azuretest100.site/api/admin/reset', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Reset failed');
        
        const data = await response.json();
        showToast('✅ Counter reset successfully!', 'success');
        loadAdminData();
        
    } catch (error) {
        console.error('Reset error:', error);
        showToast('Reset failed: ' + error.message, 'error');
    }
}

// Admin Increment Counter
async function adminIncrementCounter() {
    try {
        const token = await getAccessToken();
        
        const response = await fetch('https://api.azuretest100.site/api/increment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Increment failed');
        
        const data = await response.json();
        showToast('✅ Counter incremented!', 'success');
        loadAdminData();
        
    } catch (error) {
        console.error('Increment error:', error);
        showToast('Increment failed: ' + error.message, 'error');
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.className = 'toast', 3000);
}

// Initialize on load
initializeMsal();