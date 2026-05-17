const API_URL = 'http://localhost:3000/api';

// Variable global para la fecha actual
let currentDate = '';

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    currentDate = today;
    document.getElementById('fecha').value = today;
    
    loadTransactions();
    loadSummary();
    setupForm();
});

// Configurar formulario
function setupForm() {
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validar campos
        const descripcion = document.getElementById('descripcion').value.trim();
        const monto = document.getElementById('monto').value;
        const categoria = document.getElementById('categoria').value;
        const tipo = document.getElementById('tipo').value;
        const fecha = document.getElementById('fecha').value;
        
        if (!descripcion || !monto || !categoria || !tipo || !fecha) {
            alert('❌ Por favor, complete todos los campos');
            return;
        }
        
        if (parseFloat(monto) <= 0) {
            alert('❌ El monto debe ser mayor a 0');
            return;
        }
        
        const transaction = {
            descripcion: descripcion,
            monto: parseFloat(monto),
            categoria: categoria,
            tipo: tipo,
            fecha: fecha
        };
        
        // Mostrar loading en el botón
        const submitBtn = document.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Registrando...';
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
                alert('✅ Transacción registrada exitosamente');
                // Resetear formulario
                form.reset();
                document.getElementById('fecha').value = currentDate;
                // Recargar datos
                await loadTransactions();
                await loadSummary();
            } else {
                alert(`❌ Error: ${data.error || 'No se pudo registrar la transacción'}`);
            }
        } catch (error) {
            console.error('Error detallado:', error);
            alert('❌ Error de conexión con el servidor. Verifique que el servidor esté ejecutándose en http://localhost:3000');
        } finally {
            // Restaurar botón
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Cargar transacciones
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const transactions = await response.json();
        const container = document.getElementById('transactionsList');
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<div class="loading">📭 No hay transacciones registradas</div>';
            return;
        }
        
        container.innerHTML = transactions
            .sort((a, b) => b.id - a.id)
            .map(trans => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-desc">${escapeHtml(trans.descripcion)}</div>
                        <div class="transaction-details">
                            📂 ${trans.categoria} | 📅 ${trans.fecha}
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
            '<div class="loading">❌ Error al cargar las transacciones. Verifique la conexión con el servidor.</div>';
    }
}

// Eliminar transacción
window.deleteTransaction = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('✅ Transacción eliminada exitosamente');
                await loadTransactions();
                await loadSummary();
            } else {
                alert(`❌ Error: ${data.error || 'No se pudo eliminar la transacción'}`);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('❌ Error de conexión con el servidor');
        }
    }
};

// Cargar resumen financiero
async function loadSummary() {
    try {
        const response = await fetch(`${API_URL}/summary`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const summary = await response.json();
        
        // Actualizar totales
        document.getElementById('totalIngresos').textContent = `$${summary.totalIngresos.toFixed(2)}`;
        document.getElementById('totalGastos').textContent = `$${summary.totalGastos.toFixed(2)}`;
        
        const balanceElement = document.getElementById('balance');
        const balance = summary.balance;
        balanceElement.textContent = `$${balance.toFixed(2)}`;
        
        if (balance >= 0) {
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
        // No mostrar alert para no molestar al usuario
    }
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}