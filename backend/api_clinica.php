<?php
// INICIA A SESSÃO para armazenar o ID e cargo do usuário logado
session_start();

// Configurações de Cabeçalho (CORS e Tipo de Conteúdo)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// --- TRATAMENTO CORS ---
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// --- BLOCO CRÍTICO: TRATAMENTO DO OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); 
    exit(); 
}
// --------------------------------------------------------

// --- 1. CONFIGURAÇÃO E CONEXÃO MYSQL ---
$host = 'localhost';
$db   = 'clinica_veterinaria';        // <-- NOME DO BANCO DE DADOS
$user = 'root';              // Usuário padrão XAMPP
$pass = '';                  // Senha padrão XAMPP
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$pdo = null;

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     http_response_code(500);
     error_log("Erro de Conexão com o Banco de Dados MySQL: " . $e->getMessage());
     echo json_encode(["message" => "Erro de Conexão com o Banco de Dados MySQL. Verifique o phpMyAdmin."]); 
     exit();
}
// --------------------------------------------------------

// --- 2. ROTEAMENTO PRINCIPAL ---
$entity = isset($_GET['entity']) ? strtolower($_GET['entity']) : null;
$method = $_SERVER['REQUEST_METHOD'];

if ($entity === 'animal') {
    handleAnimalRequest($pdo, $method);
} elseif ($entity === 'servico') {
    handleServicoRequest($pdo, $method);
} elseif ($entity === 'auth') { 
    handleAuthRequest($pdo, $method);
} else {
    http_response_code(400); 
    echo json_encode(["message" => "Entidade não especificada."]);
}

// --------------------------------------------------------
// --- 3. FUNÇÕES DE MANIPULAÇÃO DE ENTIDADES (LÓGICA) ---
// --------------------------------------------------------

/** Lida com as rotas de LOGIN, CADASTRO, e LOGOUT */
function handleAuthRequest($pdo, $method) {
    if ($method !== 'POST') {
        http_response_code(405); echo json_encode(["message" => "Método não permitido."]); return;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? null;

    if ($action === 'login') {
        $email = $data->email ?? null;
        $senha = $data->senha ?? null;
        
        if (empty($email) || empty($senha)) { http_response_code(400); echo json_encode(["message" => "Email e senha são obrigatórios."]); return; }

        $stmt = $pdo->prepare("SELECT id, nome, senha, cargo, validado_por_admin FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        if ($usuario && password_verify($senha, $usuario['senha'])) {
            
            // Regra: Bloquear login se for Funcionário/Admin não validado
            if ($usuario['cargo'] !== 'cliente' && $usuario['validado_por_admin'] == 0) {
                http_response_code(403); echo json_encode(["message" => "Sua conta de funcionário/admin aguarda validação."]); return;
            }

            // LOGIN BEM-SUCEDIDO: INICIA SESSÃO
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_cargo'] = $usuario['cargo'];
            $_SESSION['usuario_nome'] = $usuario['nome'];
            
            http_response_code(200);
            echo json_encode([
                "message" => "Login bem-sucedido!", "id" => $usuario['id'],
                "nome" => $usuario['nome'], "cargo" => $usuario['cargo']
            ]);
            
        } else {
            http_response_code(401); echo json_encode(["message" => "Credenciais inválidas."]);
        }
    } 
    
    elseif ($action === 'register') {
        $nome = $data->nome ?? null;
        $email = $data->email ?? null;
        $senha = $data->senha ?? null;
        $cargo = $data->cargo ?? 'cliente'; 
        
        if (empty($nome) || empty($email) || empty($senha)) { http_response_code(400); echo json_encode(["message" => "Nome, Email e Senha são obrigatórios para o cadastro."]); return; }

        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
        $validado = ($cargo === 'cliente') ? 1 : 0;
        
        try {
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, cargo, validado_por_admin) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$nome, $email, $senhaHash, $cargo, $validado]);
            
            http_response_code(201);
            echo json_encode(["message" => "Usuário cadastrado com sucesso! Faça login."]);
            
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) { // Email Duplicado
                http_response_code(409); echo json_encode(["message" => "Este e-mail já está cadastrado."]);
            } else {
                http_response_code(500); echo json_encode(["message" => "Erro ao registrar usuário."]);
            }
        }
    }
    
    elseif ($action === 'logout') {
        session_unset();
        session_destroy();
        http_response_code(200); echo json_encode(["message" => "Logout realizado."]);
    }
    
    else {
        http_response_code(400); echo json_encode(["message" => "Ação de autenticação inválida."]);
    }
}

/** Lida com as rotas de ANIMAIS (COM FILTRO DE ACESSO) */
function handleAnimalRequest($pdo, $method) {
    // Autenticação Obrigatória
    if (!isset($_SESSION['usuario_id'])) { http_response_code(401); echo json_encode(["message" => "Acesso não autorizado. Faça login."]); return; }
    
    $idUsuario = $_SESSION['usuario_id'];
    $cargoUsuario = $_SESSION['usuario_cargo'];

    switch ($method) {
        case 'GET': // LISTAR ANIMAIS (COM FILTRO DE ACESSO)
            $sql = "SELECT id, nome, especie, raca, dataNascimento, idUsuario FROM animais WHERE 1=1 "; 
            $params = [];

            // Regra de Acesso: Clientes só veem os próprios animais
            if ($cargoUsuario === 'cliente') {
                $sql .= " AND idUsuario = :idUsuario";
                $params['idUsuario'] = $idUsuario;
            } 
            // Funcionário/Admin veem TODOS

            $stmt = $pdo->prepare($sql . " ORDER BY nome");
            $stmt->execute($params);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'POST': // CADASTRAR ANIMAL
            // Apenas Funcionário/Admin pode cadastrar novos animais
            if ($cargoUsuario === 'cliente') { http_response_code(403); echo json_encode(["message" => "Apenas funcionários podem cadastrar animais."]); return; }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->nome) || empty($data->especie)) { http_response_code(400); echo json_encode(["message" => "Nome e Espécie são obrigatórios."]); return; }
            
            // O animal é vinculado ao ID do usuário LOGADO (Funcionário/Admin que cadastrou)
            $sql = "INSERT INTO animais (nome, especie, raca, dataNascimento, idUsuario) 
                    VALUES (:nome, :especie, :raca, :dataNascimento, :idUsuario)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nome' => $data->nome, 'especie' => $data->especie, 'raca' => $data->raca ?? null,
                'dataNascimento' => $data->dataNascimento ?? null, 'idUsuario' => $idUsuario
            ]);
            http_response_code(201);
            echo json_encode(["message" => "Animal cadastrado com sucesso!", "id" => $pdo->lastInsertId()]);
            break;
        default: http_response_code(405); echo json_encode(["message" => "Método não permitido."]); break;
    }
}

/** Lida com as rotas de SERVIÇOS (COM FILTRO DE ACESSO) */
function handleServicoRequest($pdo, $method) {
    // Autenticação Obrigatória
    if (!isset($_SESSION['usuario_id'])) { http_response_code(401); echo json_encode(["message" => "Acesso não autorizado. Faça login."]); return; }
    
    $idUsuario = $_SESSION['usuario_id'];
    $cargoUsuario = $_SESSION['usuario_cargo'];
    
    if ($method === 'GET') { // CONSULTAR HISTÓRICO POR ANIMAL
        $animalId = isset($_GET['animal_id']) ? (int)$_GET['animal_id'] : null;
        if (!$animalId) { http_response_code(400); echo json_encode(["message" => "ID do animal é obrigatório para consultar serviços."]); return; }
        
        $sql = "SELECT s.*, a.nome AS nomeAnimal, a.idUsuario AS idDono
                FROM servicos s 
                JOIN animais a ON s.idAnimal = a.id 
                WHERE s.idAnimal = :idAnimal";

        $params = ['idAnimal' => $animalId];
        
        // Regra de Acesso: Cliente só pode ver serviços de seu próprio animal
        if ($cargoUsuario === 'cliente') {
            $sql .= " AND a.idUsuario = :idUsuario";
            $params['idUsuario'] = $idUsuario;
        } 
        
        $stmt = $pdo->prepare($sql . " ORDER BY s.dataHora DESC");
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        
    } elseif ($method === 'POST') { // REGISTRAR SERVIÇO
        
        // Apenas Funcionário/Admin pode registrar serviços
        if ($cargoUsuario === 'cliente') { http_response_code(403); echo json_encode(["message" => "Apenas funcionários podem registrar serviços."]); return; }
        
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->idAnimal) || empty($data->tipo) || empty($data->valor)) { http_response_code(400); echo json_encode(["message" => "ID do Animal, Tipo de Serviço e Valor são obrigatórios."]); return; }
        
        $sql = "INSERT INTO servicos (idAnimal, tipo, dataHora, descricao, valor) 
                VALUES (:idAnimal, :tipo, :dataHora, :descricao, :valor)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['idAnimal' => $data->idAnimal, 'tipo' => $data->tipo, 
            'dataHora' => date('Y-m-d H:i:s'), 'descricao' => $data->descricao ?? null, 'valor' => $data->valor
        ]);
        http_response_code(201);
        echo json_encode(["message" => "Serviço registrado com sucesso!", "id" => $pdo->lastInsertId()]);

    } else {
        http_response_code(405); echo json_encode(["message" => "Método não permitido."]);
    }
}
?>