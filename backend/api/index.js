const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, '../public')));

// Ruta del archivo JSON (esto NO persistirá bien en Vercel)
const dataFilePath = path.join(__dirname, '../data/transactions.json');

// Leer transacciones
const readTransactions = () => {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Escribir transacciones
const writeTransactions = (transactions) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(transactions, null, 2));
};

// ============ API ENDPOINTS ============
app.get('/api/transactions', (req, res) => {
    const transactions = readTransactions();
    res.json(transactions);
});

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

// Exportar para Vercel
module.exports = app;