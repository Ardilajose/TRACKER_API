const API_URL = 'http://localhost:3000/api';
let currentDate = '';

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    currentDate = today;
    document.getElementById('fecha').value = today;
    
    loadTransactions();
    loadSummary();
    setupForm();
});

function setupForm() {
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const descripcion = document.getElementById('descripcion').value.trim();
        const monto = document.getElementById('monto').value;
        const categoria = document.getElementById('categoria').value;
        const tipo = document.getElementById('tipo').value;
        const fecha = document.getElementById('fecha').value;
        
        if (!descripcion || !monto || !categoria || !tipo || !fecha) {
            alert('complete todos los campos');
            return;
        }
        
        if (parseFloat(monto) <= 0) {
            alert('el monto debe ser mayor a 0');
            return;
        }
        
        const transaction = {
            descripcion: descripcion,
            monto: parseFloat(monto),
            categoria: categoria,
            tipo: tipo,
            fecha: fecha
        };
        
        const submitBtn = document.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'registrando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(transaction)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('transaccion registrada');
                form.reset();
                document.getElementById('fecha').value = currentDate;
                await loadTransactions();
                await loadSummary();
            } else {
                alert(`error: ${data.error || 'no se pudo registrar'}`);
            }
        } catch (error) {
            console.error('error:', error);
            alert('error de conexion con el servidor');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        
        if (!response.ok) {
            throw new Error(`http error! status: ${response.status}`);
        }
        
        const transactions = await response.json();
        const container = document.getElementById('transactionsList');
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<div class="loading">no hay transacciones registradas</div>';
            return;
        }
        
        container.innerHTML = transactions
            .sort((a, b) => b.id - a.id)
            .map(trans => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-desc">${escapeHtml(trans.descripcion)}</div>
                        <div class="transaction-details">
                            ${trans.categoria} | ${trans.fecha}
                        </div>
                    </div>
                    <div class="transaction-amount ${trans.tipo}">
                        ${trans.tipo === 'ingreso' ? '+' : '-'}$${formatCurrency(trans.monto)}
                    </div>
                    <button class="delete-btn" onclick="deleteTransaction(${trans.id})">
                        eliminar
                    </button>
                </div>
            `).join('');
            
    } catch (error) {
        console.error('error:', error);
        document.getElementById('transactionsList').innerHTML = 
            '<div class="loading">error al cargar las transacciones</div>';
    }
}

window.deleteTransaction = async (id) => {
    if (confirm('eliminar esta transaccion?')) {
        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('transaccion eliminada');
                await loadTransactions();
                await loadSummary();
            } else {
                alert(`error: ${data.error || 'no se pudo eliminar'}`);
            }
        } catch (error) {
            console.error('error:', error);
            alert('error de conexion');
        }
    }
};

async function loadSummary() {
    try {
        const response = await fetch(`${API_URL}/summary`);
        
        if (!response.ok) {
            throw new Error(`http error! status: ${response.status}`);
        }
        
        const summary = await response.json();
        
        document.getElementById('totalIngresos').textContent = `${formatCurrency(summary.totalIngresos)}`;
        document.getElementById('totalGastos').textContent = `${formatCurrency(summary.totalGastos)}`;
        
        const balanceElement = document.getElementById('balance');
        const balance = summary.balance;
        balanceElement.textContent = `${formatCurrency(balance)}`;
        
        if (balance >= 0) {
            balanceElement.style.color = '#10b981';
        } else {
            balanceElement.style.color = '#ef4444';
        }
        
        document.getElementById('catComida').textContent = `${formatCurrency(summary.categorias.comida || 0)}`;
        document.getElementById('catTransporte').textContent = `${formatCurrency(summary.categorias.transporte || 0)}`;
        document.getElementById('catOcio').textContent = `${formatCurrency(summary.categorias.ocio || 0)}`;
        
    } catch (error) {
        console.error('error:', error);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Color de tema

// Inicializar tema
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️ Modo Claro';
    } else {
        document.body.classList.remove('dark-mode');
        if (themeToggle) themeToggle.textContent = '🌙 Modo Oscuro';
    }
}

// Cambiar tema
function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        if (themeToggle) themeToggle.textContent = '🌙 Modo Oscuro';
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        if (themeToggle) themeToggle.textContent = '☀️ Modo Claro';
    }
}

// se agrega evento al botón cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});