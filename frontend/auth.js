// frontend/auth.js

const BASE_API_URL = 'http://localhost/projeto_clinica_fullstack/backend/api_clinica.php'; 
const AUTH_API_URL = `${BASE_API_URL}?entity=auth`;

async function handleLogin(email, senha) {
    try {
        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, senha })
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('user_id', result.id);
            localStorage.setItem('user_cargo', result.cargo);
            localStorage.setItem('user_nome', result.nome);
            window.location.href = 'index.html';
        } else {
            alert(result.message || 'Credenciais inválidas.');
        }

    } catch (error) {
        console.error('Erro de rede durante o login:', error);
        alert('Erro de conexão ao servidor. Verifique o XAMPP/WAMP.');
    }
}

// --- FUNÇÃO DE LOGOUT FINAL E FUNCIONAL ---
async function handleLogout() {
    try {
        // Envia requisição POST para limpar a sessão PHP no servidor (melhor prática de segurança)
        await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' })
        });
        
    } catch (error) {
        // Ignoramos erros de rede no logout, mas garantimos a limpeza local
        console.warn("Falha ao notificar o servidor sobre o logout, mas limpando localmente.");
    }
    
    // 2. Limpa o localStorage e redireciona (Sempre executado)
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_cargo');
    localStorage.removeItem('user_nome');
    window.location.href = 'login.html';
}

// A função de cadastro está aqui para ser acessível, mas não é chamada nas páginas protegidas
async function handleCadastro(data) {
    try {
        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', ...data })
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ Cadastro realizado com sucesso! Faça login.');
            window.location.href = 'login.html';
        } else {
            alert(result.message || 'Erro no cadastro.');
        }
    } catch (error) {
        console.error('Erro de rede durante o cadastro:', error);
        alert('Erro de conexão ao servidor.');
    }
}