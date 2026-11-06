const express = require('express');
const mysql = require('mysql2');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1266',
    database: 'yashashvini_bookstore'
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err.message);
    } else {
        console.log('MySQL Database Connected Successfully!');
    }
});

// HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


// ======================================
// BOOK MANAGEMENT
// ======================================

// GET ALL BOOKS
app.get('/api/books', (req, res) => {
    db.query(
        'SELECT * FROM books ORDER BY book_id DESC',
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
        }
    );
});

// ADD BOOK
app.post('/api/books', (req, res) => {
    const { title, author, category, price, quantity } = req.body;

    if (!title || !title.trim() ||
        price === undefined || quantity === undefined ||
        !Number.isFinite(Number(price)) ||
        !Number.isInteger(Number(quantity)) ||
        Number(price) < 0 || Number(quantity) < 0) {
        return res.status(400).json({
            message: 'Enter valid book details.'
        });
    }

    const status = Number(quantity) > 0 ? 'Available' : 'Out of Stock';

    const sql = `
        INSERT INTO books (title, author, category, price, quantity, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        title.trim(), author, category,
        Number(price), Number(quantity), status
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            message: 'Book added successfully!',
            book_id: result.insertId
        });
    });
});

// UPDATE BOOK
app.put('/api/books/:id', (req, res) => {
    const { title, author, category, price, quantity } = req.body;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1 ||
        !title || !title.trim() ||
        price === undefined || quantity === undefined ||
        !Number.isFinite(Number(price)) ||
        !Number.isInteger(Number(quantity)) ||
        Number(price) < 0 || Number(quantity) < 0) {
        return res.status(400).json({
            message: 'Enter valid book details.'
        });
    }

    const status = Number(quantity) > 0 ? 'Available' : 'Out of Stock';

    const sql = `
        UPDATE books
        SET title=?, author=?, category=?, price=?, quantity=?, status=?
        WHERE book_id=?
    `;

    db.query(sql, [
        title.trim(), author, category,
        Number(price), Number(quantity), status, id
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Book not found.' });
        }

        res.json({ message: 'Book updated successfully!' });
    });
});

// DELETE BOOK
app.delete('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: 'Invalid book ID.' });
    }

    db.query(
        'DELETE FROM books WHERE book_id=?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Could not delete this book. It may be linked to a sale.',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Book not found.' });
            }

            res.json({ message: 'Book deleted successfully!' });
        }
    );
});


// ======================================
// CUSTOMER MANAGEMENT
// ======================================

// GET ALL CUSTOMERS
app.get('/api/customers', (req, res) => {
    db.query(
        'SELECT * FROM customers ORDER BY customer_id DESC',
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
        }
    );
});

// ADD CUSTOMER
app.post('/api/customers', (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: 'Customer name is required.'
        });
    }

    const sql = `
        INSERT INTO customers (name, email, phone, address)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [
        name.trim(),
        email || null,
        phone || null,
        address || null
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            message: 'Customer added successfully!',
            customer_id: result.insertId
        });
    });
});

// UPDATE CUSTOMER
app.put('/api/customers/:id', (req, res) => {
    const { name, email, phone, address } = req.body;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1 ||
        !name || !name.trim()) {
        return res.status(400).json({
            message: 'Enter valid customer details.'
        });
    }

    const sql = `
        UPDATE customers
        SET name=?, email=?, phone=?, address=?
        WHERE customer_id=?
    `;

    db.query(sql, [
        name.trim(), email || null,
        phone || null, address || null, id
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Customer not found.'
            });
        }

        res.json({ message: 'Customer updated successfully!' });
    });
});

// DELETE CUSTOMER
app.delete('/api/customers/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            message: 'Invalid customer ID.'
        });
    }

    db.query(
        'DELETE FROM customers WHERE customer_id=?',
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'This customer may be linked to an existing sale.',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Customer not found.'
                });
            }

            res.json({
                message: 'Customer deleted successfully!'
            });
        }
    );
});


// ======================================
// SALES MANAGEMENT
// ======================================

// GET ALL SALES
app.get('/api/sales', (req, res) => {
    const sql = `
        SELECT
            sales.sale_id,
            sales.sale_date,
            sales.total_amount,
            customers.name AS customer_name
        FROM sales
        LEFT JOIN customers
        ON sales.customer_id = customers.customer_id
        ORDER BY sales.sale_id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// RECORD A SALE
app.post('/api/sales', (req, res) => {
    const { customer_id, items } = req.body;

    if (!Number.isInteger(Number(customer_id)) ||
        Number(customer_id) < 1 ||
        !Array.isArray(items) ||
        items.length === 0) {
        return res.status(400).json({
            message: 'Select a customer and add at least one book.'
        });
    }

    // Validate all items
    const bookIds = new Set();

    for (const item of items) {
        const bookId = Number(item.book_id);
        const quantity = Number(item.quantity);

        if (!Number.isInteger(bookId) || bookId < 1 ||
            !Number.isInteger(quantity) || quantity < 1 ||
            bookIds.has(bookId)) {
            return res.status(400).json({
                message: 'Enter valid book details. Each book should appear only once.'
            });
        }

        bookIds.add(bookId);
    }

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        let totalAmount = 0;
        const selectedBooks = [];
        let index = 0;

        function rollback(message, code = 400) {
            db.rollback(() => {
                res.status(code).json({ message });
            });
        }

        // CHECK BOOK STOCK AND PRICE
        function checkNextBook() {
            if (index >= items.length) {
                return createSale();
            }

            const item = items[index];
            const bookId = Number(item.book_id);
            const quantity = Number(item.quantity);

            db.query(
                'SELECT * FROM books WHERE book_id=? FOR UPDATE',
                [bookId],
                (err, result) => {
                    if (err) {
                        return rollback('Could not check book details.', 500);
                    }

                    if (result.length === 0) {
                        return rollback('Selected book not found.');
                    }

                    const book = result[0];

                    if (book.quantity < quantity) {
                        return rollback(
                            `Not enough stock for ${book.title}. Available: ${book.quantity}`
                        );
                    }

                    const price = Number(book.price);
                    const subtotal = price * quantity;

                    totalAmount += subtotal;

                    selectedBooks.push({
                        book_id: bookId,
                        quantity: quantity,
                        price: price,
                        subtotal: subtotal
                    });

                    // REDUCE STOCK
                    db.query(
                        `UPDATE books
                         SET quantity = quantity - ?,
                             status = IF(quantity - ? > 0, 'Available', 'Out of Stock')
                         WHERE book_id = ? AND quantity >= ?`,
                        [quantity, quantity, bookId, quantity],
                        (err, updateResult) => {
                            if (err) {
                                return rollback('Could not update book stock.', 500);
                            }

                            if (updateResult.affectedRows === 0) {
                                return rollback('Book stock changed. Please try again.');
                            }

                            index++;
                            checkNextBook();
                        }
                    );
                }
            );
        }

        // CREATE SALE
        function createSale() {
            db.query(
                `INSERT INTO sales
                 (customer_id, user_id, sale_date, total_amount)
                 VALUES (?, NULL, CURRENT_DATE(), ?)`,
                [Number(customer_id), totalAmount],
                (err, result) => {
                    if (err) {
                        return rollback('Could not record the sale. Check the customer.', 500);
                    }

                    const saleId = result.insertId;
                    let itemIndex = 0;

                    // SAVE SALE ITEMS
                    function saveNextItem() {
                        if (itemIndex >= selectedBooks.length) {
                            return db.commit((err) => {
                                if (err) {
                                    return rollback('Could not complete the sale.', 500);
                                }

                                res.json({
                                    message: 'Sale recorded successfully!',
                                    sale_id: saleId,
                                    total_amount: totalAmount
                                });
                            });
                        }

                        const item = selectedBooks[itemIndex];

                        db.query(
                            `INSERT INTO sale_items
                             (sale_id, book_id, quantity, price, subtotal)
                             VALUES (?, ?, ?, ?, ?)`,
                            [
                                saleId,
                                item.book_id,
                                item.quantity,
                                item.price,
                                item.subtotal
                            ],
                            (err) => {
                                if (err) {
                                    return rollback('Could not save sale items.', 500);
                                }

                                itemIndex++;
                                saveNextItem();
                            }
                        );
                    }

                    saveNextItem();
                }
            );
        }

        checkNextBook();
    });
});


// ======================================
// TEST ROUTE
// ======================================

app.get('/test', (req, res) => {
    res.send('Yashashvini Bookstore Server is Running!');
});


// START SERVER
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});