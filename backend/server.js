const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Usamos middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// definimos la ruta del archivo JSON
const dataFilePath = path.join(__dirname, 'data', 'transactions.json');

// Asegurarse que el directorio data existe
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Inicializamos archivo si no existe
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
}

// Leemos transacciones
const readTransactions = () => {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
};

// Escribirmos transacciones
const writeTransactions = (transactions) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(transactions, null, 2));
};

// api endpoints.

// Se recopilan todas las transacciones
app.get('/api/transactions', (req, res) => {
    const transactions = readTransactions();
    res.json(transactions);
});

// Conseguimos el resumen financiero
app.get('/api/summary', (req, res) => {
    const transactions = readTransactions();
    
    let totalIngresos = 0;
    let totalGastos = 0;
    const categorias = {};

    transactions.forEach(trans => {
        if (trans.tipo === 'ingreso') {
            totalIngresos += trans.monto;
        } else {
            totalGastos += trans.monto;
        }

        if (!categorias[trans.categoria]) {
            categorias[trans.categoria] = 0;
        }
        if (trans.tipo === 'gasto') {
            categorias[trans.categoria] += trans.monto;
        }
    });

    const balance = totalIngresos - totalGastos;

    res.json({
        totalIngresos,
        totalGastos,
        balance,
        categorias
    });
});

// para crear una nueva transacción
app.post('/api/transactions', (req, res) => {
    const { descripcion, monto, categoria, tipo, fecha } = req.body;
    
    if (!descripcion || !monto || !categoria || !tipo || !fecha) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const transactions = readTransactions();
    
    const newTransaction = {
        id: Date.now(),
        descripcion,
        monto: parseFloat(monto),
        categoria,
        tipo,
        fecha
    };

    transactions.push(newTransaction);
    writeTransactions(transactions);
    
    res.status(201).json(newTransaction);
});

// Eliminar una transacción
app.delete('/api/transactions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let transactions = readTransactions();
    
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    writeTransactions(filteredTransactions);
    res.json({ message: 'Transacción eliminada correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Aplicación de Control de Gastos Personales`);
    console.log(`👨‍🎓 Estudiante: Jose A. Ardila Cuello`);
});