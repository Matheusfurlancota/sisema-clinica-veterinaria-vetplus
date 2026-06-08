// frontend/script.js

// A URL base da API (AJUSTE AQUI SE O NOME DA PASTA FOR DIFERENTE)
const BASE_API_URL = 'http://localhost/projeto_clinica_fullstack/backend/api_clinica.php'; 
const ANIMAL_API_URL = `${BASE_API_URL}?entity=animal`; 

// --- FUNÇÃO DE CHECAGEM DE AUTENTICAÇÃO E SETUP ---
function checkAuthAndSetup() {
    // 1. CHECAGEM DE AUTENTICAÇÃO E REDIRECIONAMENTO (Segurança Crítica)
    if (!localStorage.getItem('user_id')) {
        // Redireciona imediatamente se não houver ID no localStorage
        window.location.href = 'login.html';
        return false;
    }
    
    // 2. CONFIGURAÇÃO VISUAL (INJEÇÃO SEGURA DO BOTÃO SAIR)
    const headerElement = document.querySelector('header');
    const userName = localStorage.getItem('user_nome');
    const userCargo = localStorage.getItem('user_cargo');
    
    const logoutButtonHtml = `<button onclick="handleLogout()" style="margin-left: 20px; padding: 10px 15px; border-radius: 4px; background-color: #dc3545; color: white; border: none; cursor: pointer; float: right; margin-top: 10px;">Sair (${userName} | ${userCargo})</button>`;

    if (headerElement) {
        const logoutDiv = document.createElement('div');
        logoutDiv.innerHTML = logoutButtonHtml;
        logoutDiv.style.alignSelf = 'center';
        logoutDiv.style.marginLeft = 'auto'; 
        logoutDiv.style.position = 'absolute'; 
        logoutDiv.style.right = '20px'; 
        logoutDiv.style.top = '15px'; 

        headerElement.appendChild(logoutDiv);
    }

    // 3. BLOQUEIO DE FORMULÁRIO PARA CLIENTES
    if (userCargo === 'cliente') {
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.innerHTML = '<h3>Acesso Restrito</h3><p>Apenas funcionários podem cadastrar novos pacientes no sistema.</p>';
        }
    }
    return true;
}
// ------------------------------------------

// CHAMADA DE SEGURANÇA IMEDIATA (Executa assim que o script é lido)
if (!checkAuthAndSetup()) {
    // Se não autenticado, não executamos o restante do código
    throw new Error("Não autenticado. Parando execução."); 
}


document.addEventListener('DOMContentLoaded', () => {
    // O restante do código só roda se checkAuthAndSetup() retornou true
    carregarAnimais();
    const form = document.getElementById('formCadastroAnimal');
    if (form) {
        form.addEventListener('submit', cadastrarAnimal);
    }
});

// ... (Restante das funções: carregarAnimais e cadastrarAnimal, sem alterações)
async function carregarAnimais() {
    try {
        const response = await fetch(ANIMAL_API_URL, { method: 'GET' }); 
        
        if (response.status === 401) { 
            alert("Sua sessão expirou. Faça login novamente.");
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Erro ao buscar animais: ' + response.statusText);
        
        const animais = await response.json(); 
        const lista = document.getElementById('listaAnimais');
        lista.innerHTML = ''; 

        if (animais.length === 0) {
            lista.innerHTML = '<li>Nenhum animal cadastrado ainda.</li>';
            return;
        }

        animais.forEach(animal => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${animal.nome}</strong> 
                (Espécie: ${animal.especie} | Raça: ${animal.raca || 'N/A'}) <br>
                <small>ID Paciente: ${animal.id} | Dono ID: ${animal.idUsuario || 'N/A'}</small>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error('Falha no Carregamento:', error);
        alert('❌ Falha ao carregar a lista de animais. Verifique a API e o servidor.');
    }
}

async function cadastrarAnimal(event) {
    event.preventDefault(); 

    const formData = new FormData(event.target);
    const animalData = {
        nome: formData.get('nome'),
        especie: formData.get('especie'),
        raca: formData.get('raca'),
        dataNascimento: formData.get('dataNascimento'), 
        idCliente: parseInt(formData.get('idCliente')) 
    };

    try {
        const response = await fetch(ANIMAL_API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData) 
        });

        if (response.status === 403) { 
            const errorResult = await response.json();
             alert(`❌ Cadastro Negado: ${errorResult.message}`);
             return;
        }
        
        const result = await response.json();

        if (response.ok) {
            alert(`✅ Animal cadastrado com sucesso! ID: ${result.id}`);
            event.target.reset(); 
            carregarAnimais(); 
        } else {
            alert(`❌ Erro no cadastro: ${result.message || response.statusText}`);
        }

    } catch (error) {
        console.error('Erro de Rede:', error);
        alert('❌ Erro de conexão ao tentar cadastrar o animal. Verifique o Console (F12).');
    }
}