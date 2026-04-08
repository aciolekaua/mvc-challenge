# 🏗️ Introdução ao Padrão MVC com PHP

> Guia prático para entender e aplicar o padrão de arquitetura **Model-View-Controller** usando **PHP, HTML, CSS e JavaScript**.

---

## 📚 O que é MVC?

MVC é um padrão de arquitetura de software que separa uma aplicação em três camadas com responsabilidades distintas:

| Camada | Responsabilidade |
|--------|-----------------|
| **Model** | Dados, regras de negócio e comunicação com o banco |
| **View** | Interface com o usuário — HTML, CSS e JS |
| **Controller** | Intermediário entre Model e View; processa as requisições |

### Fluxo básico

```
Usuário → Controller → Model → Controller → View → Usuário
```

---

## 📁 Estrutura de Pastas Recomendada

```
mvc-challenge/
├── app/
│   ├── controllers/
│   │   └── UserController.php
│   ├── models/
│   │   └── UserModel.php
│   └── views/
│       └── users/
│           └── index.php
├── public/
│   ├── index.php        ← entrada da aplicação (front controller)
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── core/
│   └── Router.php
└── .htaccess
```

---

## 🧩 Exemplo Prático — Cadastro de Usuários

### 1. Front Controller (`public/index.php`)
> Toda requisição passa por aqui. O `.htaccess` redireciona tudo para este arquivo.

```php
<?php
require_once '../core/Router.php';

$router = new Router();

$router->get('/', 'UserController', 'index');
$router->get('/users', 'UserController', 'index');
$router->post('/users/store', 'UserController', 'store');
$router->get('/users/delete', 'UserController', 'delete');

$router->dispatch();
```

---

### 2. `.htaccess`
> Redireciona todas as requisições para o `public/index.php`.

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

---

### 3. Router (`core/Router.php`)
> Mapeia a URL para o Controller e método correto.

```php
<?php
class Router {
    private array $routes = [];

    public function get(string $path, string $controller, string $method): void {
        $this->routes['GET'][$path] = ['controller' => $controller, 'method' => $method];
    }

    public function post(string $path, string $controller, string $method): void {
        $this->routes['POST'][$path] = ['controller' => $controller, 'method' => $method];
    }

    public function dispatch(): void {
        $httpMethod = $_SERVER['REQUEST_METHOD'];
        $uri = strtok($_SERVER['REQUEST_URI'], '?');

        if (isset($this->routes[$httpMethod][$uri])) {
            $route = $this->routes[$httpMethod][$uri];
            $controllerName = $route['controller'];
            $methodName = $route['method'];

            require_once "../app/controllers/{$controllerName}.php";
            $controller = new $controllerName();
            $controller->$methodName();
        } else {
            http_response_code(404);
            echo "<h1>404 — Página não encontrada</h1>";
        }
    }
}
```

---

### 4. Model (`app/models/UserModel.php`)
> Responsável pelos **dados** e regras de negócio.

```php
<?php
class UserModel {
    public static function getAll(): array {
        return $_SESSION['users'] ?? [];
    }

    public static function create(string $name, string $email): array {
        $user = [
            'id'    => uniqid(),
            'name'  => $name,
            'email' => $email,
        ];
        $_SESSION['users'][] = $user;
        return $user;
    }

    public static function delete(string $id): bool {
        foreach ($_SESSION['users'] as $key => $user) {
            if ($user['id'] === $id) {
                unset($_SESSION['users'][$key]);
                $_SESSION['users'] = array_values($_SESSION['users']);
                return true;
            }
        }
        return false;
    }
}
```

---

### 5. Controller (`app/controllers/UserController.php`)
> Recebe a requisição, chama o Model e carrega a View.

```php
<?php
session_start();

require_once '../app/models/UserModel.php';

class UserController {
    public function index(): void {
        $users = UserModel::getAll();
        require_once '../app/views/users/index.php';
    }

    public function store(): void {
        $name  = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');

        if (empty($name) || empty($email)) {
            $_SESSION['error'] = 'Nome e e-mail são obrigatórios.';
            header('Location: /users');
            exit;
        }

        UserModel::create($name, $email);
        header('Location: /users');
        exit;
    }

    public function delete(): void {
        $id = $_GET['id'] ?? '';

        if (!UserModel::delete($id)) {
            $_SESSION['error'] = 'Usuário não encontrado.';
        }

        header('Location: /users');
        exit;
    }
}
```

---

### 6. View (`app/views/users/index.php`)
> A camada visual: HTML + CSS e JS do `public/`.

```php
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usuários</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <h1>👥 Usuários</h1>

        <?php if (!empty($_SESSION['error'])): ?>
            <p class="error"><?= htmlspecialchars($_SESSION['error']) ?></p>
            <?php unset($_SESSION['error']); ?>
        <?php endif; ?>

        <form action="/users/store" method="POST" class="form-card">
            <input type="text"  name="name"  placeholder="Nome"   required>
            <input type="email" name="email" placeholder="E-mail" required>
            <button type="submit">Adicionar</button>
        </form>

        <ul class="user-list">
            <?php foreach ($users as $user): ?>
                <li>
                    <span><?= htmlspecialchars($user['name']) ?> — <?= htmlspecialchars($user['email']) ?></span>
                    <a href="/users/delete?id=<?= $user['id'] ?>" class="btn-delete">Remover</a>
                </li>
            <?php endforeach; ?>

            <?php if (empty($users)): ?>
                <li class="empty">Nenhum usuário cadastrado ainda.</li>
            <?php endif; ?>
        </ul>
    </div>
    <script src="/js/main.js"></script>
</body>
</html>
```

---

### 7. CSS (`public/css/style.css`)

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Segoe UI', sans-serif;
    background: #f0f2f5;
    color: #333;
}

.container { max-width: 640px; margin: 60px auto; padding: 0 20px; }

h1 { margin-bottom: 24px; font-size: 1.8rem; }

.form-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #fff;
    padding: 24px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 28px;
}

input {
    padding: 10px 14px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
}

button {
    padding: 10px;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
}

button:hover { background: #4338ca; }

.user-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }

.user-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 14px 18px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.btn-delete { color: #ef4444; text-decoration: none; font-size: 0.9rem; }
.btn-delete:hover { text-decoration: underline; }
.empty { color: #999; text-align: center; padding: 20px 0; }
.error {
    background: #fee2e2;
    color: #b91c1c;
    padding: 10px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
}
```

---

### 8. JavaScript (`public/js/main.js`)
> Adiciona interatividade à View sem misturar lógica de negócio.

```js
document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const confirmed = confirm('Tem certeza que deseja remover este usuário?');
        if (!confirmed) e.preventDefault();
    });
});
```

---

## ▶️ Como rodar

Você precisa de **PHP 8+** instalado na máquina.

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mvc-challenge.git
cd mvc-challenge/public

# Inicie o servidor embutido do PHP
php -S localhost:8000
```

Acesse: [http://localhost:8000](http://localhost:8000)

> ⚠️ O `.htaccess` só funciona com Apache (XAMPP, Laragon etc.).  
> Com o servidor embutido do PHP, o roteamento pode precisar de adaptação.

---

## 💡 Boas Práticas

- O Controller **nunca** gera HTML diretamente — isso é papel da View
- O Model **nunca** lê `$_POST` ou `$_GET` — isso é papel do Controller
- Use sempre `htmlspecialchars()` ao exibir dados do usuário na View
- Valide os dados no Controller **antes** de passar para o Model
- Separe o CSS e o JS em arquivos próprios — nunca inline na View

---

---

# 🎯 Desafio — Coloca em Prática!

Agora é com você! Aplique tudo que aprendeu criando uma aplicação web completa seguindo o padrão MVC com PHP puro.

## 📋 Tema: Lista de Tarefas (To-Do List)

### Rotas esperadas

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET` | `/tasks` | Listar todas as tarefas |
| `POST` | `/tasks/store` | Criar nova tarefa |
| `GET` | `/tasks/complete` | Alternar status (concluída/pendente) |
| `GET` | `/tasks/delete` | Remover uma tarefa |

### Estrutura de uma Tarefa

```php
[
    'id'          => 'abc123',
    'title'       => 'Estudar MVC',
    'description' => 'Ler o guia e fazer o desafio',
    'done'        => false,
    'created_at'  => '2026-04-08 10:00:00',
]
```

### Regras de negócio

- `title` é **obrigatório** na criação
- `done` inicia como `false` e `created_at` é preenchido automaticamente
- A rota `/tasks/complete` deve alternar o status `done` (toggle)
- Exibir mensagens de erro quando os dados forem inválidos
- Dados mantidos em `$_SESSION` (sem banco de dados necessário)

### Estrutura esperada de pastas

```
mvc-challenge/
├── app/
│   ├── controllers/
│   │   └── TaskController.php
│   ├── models/
│   │   └── TaskModel.php
│   └── views/
│       └── tasks/
│           └── index.php
├── public/
│   ├── index.php
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── core/
│   └── Router.php
└── .htaccess
```

### ✅ Critérios de avaliação

- [ ] Estrutura de pastas MVC respeitada
- [ ] Todas as 4 rotas funcionando corretamente
- [ ] Validações com mensagens de erro exibidas na tela
- [ ] View com HTML semântico e CSS próprio (sem frameworks)
- [ ] JS usado em pelo menos uma interação (confirmação, toggle visual, etc.)
- [ ] Código limpo, com nomes descritivos e sem mistura de responsabilidades

### 🌟 Bônus (opcional)

- [ ] Filtrar tarefas por status: `/tasks?filter=done`
- [ ] Registrar `completed_at` ao marcar como concluída
- [ ] Estilizar tarefas concluídas com texto riscado via CSS
- [ ] Animação suave ao adicionar ou remover tarefa com JS puro

---

> **Dica:** A maior armadilha do MVC é misturar as camadas. Sempre se pergunte: *"Isso é dado, visual ou lógica?"* — e coloque no lugar certo. Boa sorte! 💪
