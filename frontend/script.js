const API_URL = 'http://localhost:3000/api';

// Se cargan datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    loadSummary();
    setupForm();
    
    // Establece la fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
});

//  se configura formulario
function setupForm() {
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const transaction = {
            descripcion: document.getElementById('descripcion').value,
            monto: parseFloat(document.getElementById('monto').value),
            categoria: document.getElementById('categoria').value,
            tipo: document.getElementById('tipo').value,
            fecha: document.getElementById('fecha').value
        };
        
        try {
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
            
            if (response.ok) {
                alert('✅ Transacción registrada exitosamente');
                form.reset();
                document.getElementById('fecha').value = today;
                loadTransactions();
                loadSummary();
            } else {
                alert('❌ Error al registrar la transacción');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error de conexión con el servidor');
        }
    });
}

// Cargar transacciones
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        const transactions = await response.json();
        
        const container = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="loading">No hay transacciones registradas</div>';
            return;
        }
        
        container.innerHTML = transactions
            .sort((a, b) => b.id - a.id)
            .map(trans => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-desc">${trans.descripcion}</div>
                        <div class="transaction-details">
                            ${trans.categoria} | ${trans.fecha}
                        </div>
                    </div>
                    <div class="transaction-amount ${trans.tipo}">
                        ${trans.tipo === 'ingreso' ? '+' : '-'}$${trans.monto.toFixed(2)}
                    </div>
                    <button class="delete-btn" onclick="deleteTransaction(${trans.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            `).join('');
            
    } catch (error) {
        console.error('Error al cargar transacciones:', error);
        document.getElementById('transactionsList').innerHTML = 
            '<div class="loading">❌ Error al cargar las transacciones</div>';
    }
}

// Eliminar transacción
window.deleteTransaction = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('✅ Transacción eliminada');
                loadTransactions();
                loadSummary();
            } else {
                alert('❌ Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error de conexión');
        }
    }
};

// Cargar resumen financiero
async function loadSummary() {
    try {
        const response = await fetch(`${API_URL}/summary`);
        const summary = await response.json();
        
        document.getElementById('totalIngresos').textContent = `$${summary.totalIngresos.toFixed(2)}`;
        document.getElementById('totalGastos').textContent = `$${summary.totalGastos.toFixed(2)}`;
        
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = `$${summary.balance.toFixed(2)}`;
        
        if (summary.balance >= 0) {
            balanceElement.style.color = '#10b981';
        } else {
            balanceElement.style.color = '#ef4444';
        }
        
        // Actualizar categorías
        document.getElementById('catComida').textContent = `$${(summary.categorias.comida || 0).toFixed(2)}`;
        document.getElementById('catTransporte').textContent = `$${(summary.categorias.transporte || 0).toFixed(2)}`;
        document.getElementById('catOcio').textContent = `$${(summary.categorias.ocio || 0).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error al cargar resumen:', error);
    }
}