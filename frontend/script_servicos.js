// frontend/script_servicos.js

// A URL base da API (AJUSTE AQUI SE O NOME DA PASTA FOR DIFERENTE)
const BASE_API_URL = 'http://localhost/projeto_clinica_fullstack/backend/api_clinica.php'; 
const ANIMAL_API_URL = `${BASE_API_URL}?entity=animal`;
const SERVICO_API_URL = `${BASE_API_URL}?entity=servico`;

// --- FUNÇÃO DE CHECAGEM DE AUTENTICAÇÃO E SETUP ---
function checkAuthAndSetup() {
    // 1. CHECAGEM DE AUTENTICAÇÃO IMEDIATA E REDIRECIONAMENTO (Segurança Crítica)
    if (!localStorage.getItem('user_id')) {
        // Redireciona imediatamente se não houver ID no localStorage
        window.location.href = 'login.html';
        return false;
    }
    
    // 2. CONFIGURAÇÃO VISUAL (INJEÇÃO SEGURA DO BOTÃO SAIR)
    const userName = localStorage.getItem('user_nome');
    const userCargo = localStorage.getItem('user_cargo');
    const headerElement = document.querySelector('header');
    
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
            formContainer.innerHTML = '<h3>Acesso Restrito</h3><p>Apenas funcionários podem registrar novos serviços.</p>';
        }
    }
    return true;
}
// ----------------------------------------------------

// CHAMADA DE SEGURANÇA IMEDIATA
if (!checkAuthAndSetup()) {
    // Se não autenticado, para a execução do script IMEDIATAMENTE.
    throw new Error("Não autenticado. Redirecionando."); 
}


document.addEventListener('DOMContentLoaded', () => {
    // O restante do código só roda se checkAuthAndSetup() retornou true
    carregarAnimaisParaSelects();
    
    const form = document.getElementById('formRegistroServico');
    if (form) {
        form.addEventListener('submit', registrarServico);
    }
    
    const selectHistorico = document.getElementById('selectAnimalHistorico');
    selectHistorico.addEventListener('change', consultarHistorico);
});

async function carregarAnimaisParaSelects() {
    try {
        const response = await fetch(ANIMAL_API_URL);
        if (!response.ok) throw new Error('Falha ao carregar pacientes.');
        const animais = await response.json();
        const selectAnimalReg = document.getElementById('idAnimal');
        const selectAnimalHist = document.getElementById('selectAnimalHistorico');

        selectAnimalReg.innerHTML = '<option value="">-- Selecione o Paciente --</option>';
        selectAnimalHist.innerHTML = '<option value="">-- Selecione para Ver o Histórico --</option>';
        
        animais.forEach(animal => {
            const optionReg = new Option(`${animal.nome} (ID: ${animal.id})`, animal.id);
            const optionHist = new Option(`${animal.nome} (ID: ${animal.id})`, animal.id);
            selectAnimalReg.appendChild(optionReg);
            selectAnimalHist.appendChild(optionHist);
        });

    } catch (error) {
        console.error('Erro de Carregamento:', error);
        alert('❌ Não foi possível carregar a lista de pacientes. Verifique a API PHP.');
    }
}

async function registrarServico(event) {
    event.preventDefault(); 

    const formData = new FormData(event.target);
    const servicoData = {
        idAnimal: parseInt(formData.get('idAnimal')),
        tipo: formData.get('tipo'),
        descricao: formData.get('descricao'),
        valor: parseFloat(formData.get('valor'))
    };

    try {
        const response = await fetch(SERVICO_API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(servicoData) 
        });

        if (response.status === 403) { 
             const errorResult = await response.json();
             alert(`❌ Registro Negado: ${errorResult.message}`);
             return;
        }

        const result = await response.json();

        if (response.ok) {
            alert(`✅ ${result.message}`);
            event.target.reset(); 
            carregarAnimaisParaSelects(); 
            consultarHistorico(); 
        } else {
            alert(`❌ Erro no registro: ${result.message || response.statusText}`);
        }

    } catch (error) {
        console.error('Erro de Rede:', error);
        alert('❌ Erro de conexão ao tentar registrar o serviço.');
    }
}

async function consultarHistorico() {
    const animalId = document.getElementById('selectAnimalHistorico').value;
    const resultadosDiv = document.getElementById('historicoResultados');

    if (!animalId) {
        resultadosDiv.innerHTML = '<p>Nenhum paciente selecionado.</p>';
        return;
    }

    const HISTORICO_URL = `${SERVICO_API_URL}&animal_id=${animalId}`;

    try {
        const response = await fetch(HISTORICO_URL, { method: 'GET' }); 
        
        if (response.status === 403) { 
             resultadosDiv.innerHTML = `<p style="color:red;">Acesso negado: Este paciente não está vinculado ao seu ID.</p>`;
             return;
        }

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Falha ao buscar histórico.');
        }
        
        const servicos = await response.json(); 
        
        if (servicos.length === 0) {
            resultadosDiv.innerHTML = `<p>Nenhum serviço encontrado para o paciente ID ${animalId}.</p>`;
            return;
        }

        let html = '<table class="table-historico"><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>';
        
        servicos.forEach(servico => {
             const dataFormatada = new Date(servico.dataHora).toLocaleDateString('pt-BR', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit' 
            });

            html += `
                <tr>
                    <td>${dataFormatada}</td>
                    <td>${servico.tipo}</td>
                    <td>R$ ${parseFloat(servico.valor).toFixed(2).replace('.', ',')}</td>
                    <td>${servico.descricao || 'N/A'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        resultadosDiv.innerHTML = html;

    } catch (error) {
        console.error('Erro ao consultar histórico:', error);
        resultadosDiv.innerHTML = `<p style="color:red;">Falha ao carregar o histórico: ${error.message}</p>`;
    }
}