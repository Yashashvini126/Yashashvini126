// ======================================
// BOOK MANAGEMENT
// ======================================

const bookForm = document.getElementById('bookForm');

let allBooks = [];

async function loadBooks() {

    const table = document.getElementById('bookTable');

    if (!table) return;

    try {

        const response = await fetch('/api/books');

        if (!response.ok) {
            throw new Error('Unable to load books');
        }

        allBooks = await response.json();

        displayBooks(allBooks);
        displayBookGallery(allBooks);

    } catch (error) {

        table.innerHTML =
            '<tr><td colspan="8">Error loading books. Check server connection.</td></tr>';

    }
}


// DISPLAY BOOK INVENTORY

function displayBooks(books) {

    const table = document.getElementById('bookTable');

    if (!table) return;

    if (books.length === 0) {

        table.innerHTML =
            '<tr><td colspan="8">No books found. Add your first book!</td></tr>';

        return;
    }

    table.innerHTML = books.map(book => `

        <tr>

            <td>${book.book_id}</td>

            <td>${escapeHTML(book.title)}</td>

            <td>${escapeHTML(book.author || '-')}</td>

            <td>${escapeHTML(book.category || '-')}</td>

            <td>₹${Number(book.price).toFixed(2)}</td>

            <td>${book.quantity}</td>

            <td class="${book.quantity > 0 ? 'status-available' : 'status-out'}">
                ${book.quantity > 0 ? 'Available' : 'Out of Stock'}
            </td>

            <td>

                <button class="edit-btn"
                    onclick="editBook(${book.book_id})">
                    Edit
                </button>

                <button class="delete-btn"
                    onclick="deleteBook(${book.book_id})">
                    Delete
                </button>

            </td>

        </tr>

    `).join('');

}


// ======================================
// BOOK COVER GALLERY
// ======================================

async function displayBookGallery(bookList) {

    const gallery = document.getElementById('bookGallery');

    if (!gallery) return;

    gallery.innerHTML = '';

    if (bookList.length === 0) {

        gallery.innerHTML = '<p>No books available.</p>';

        return;
    }

    for (const book of bookList) {

        const card = document.createElement('div');

        card.className = 'gallery-card';

        // PLACEHOLDER IMAGE

        const placeholder = document.createElement('div');

        placeholder.className = 'gallery-placeholder';

        placeholder.textContent = '📚';

        // BOOK COVER IMAGE

        const image = document.createElement('img');

        image.alt = book.title + ' book cover';

        image.style.display = 'none';

        // BOOK TITLE

        const title = document.createElement('h3');

        title.textContent = book.title;

        // BOOK AUTHOR

        const author = document.createElement('small');

        author.textContent = book.author || 'Unknown Author';

        // BOOK PRICE

        const price = document.createElement('div');

        price.className = 'gallery-price';

        price.textContent =
            '₹' + Number(book.price).toFixed(2);

        card.appendChild(placeholder);

        card.appendChild(image);

        card.appendChild(title);

        card.appendChild(author);

        card.appendChild(price);

        gallery.appendChild(card);


        // GET BOOK COVER FROM GOOGLE BOOKS

        try {

            const query =
                `intitle:${book.title} inauthor:${book.author || ''}`;

            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
            );

            if (!response.ok) continue;

            const data = await response.json();

            if (data.items && data.items.length > 0) {

                const cover =
                    data.items[0].volumeInfo.imageLinks;

                if (cover && cover.thumbnail) {

                    const imageURL =
                        cover.thumbnail.replace(/^http:/, 'https:');

                    if (imageURL.startsWith('https://')) {

                        image.src = imageURL;

                        image.onload = () => {

                            placeholder.style.display = 'none';

                            image.style.display = 'block';

                        };

                    }

                }

            }

        } catch (error) {

            console.log(
                'Book cover unavailable:',
                book.title
            );

        }

    }

}


// ======================================
// COMMON HTML SECURITY FUNCTION
// ======================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'

    })[char]);

}


// ======================================
// ADD OR UPDATE BOOK
// ======================================

if (bookForm) {

    bookForm.addEventListener('submit', async function(event) {

        event.preventDefault();

        const id = document.getElementById('bookId').value;

        const book = {

            title: document.getElementById('title').value.trim(),

            author: document.getElementById('author').value.trim(),

            category: document.getElementById('category').value.trim(),

            price: document.getElementById('price').value,

            quantity: document.getElementById('quantity').value

        };

        try {

            const response = await fetch(

                id ? `/api/books/${id}` : '/api/books',

                {

                    method: id ? 'PUT' : 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(book)

                }

            );

            const result = await response.json();

            if (!response.ok) {

                throw new Error(result.message || result.error);

            }

            alert(result.message);

            bookForm.reset();

            resetBookForm();

            loadBooks();

            loadDashboard();

        } catch (error) {

            alert(error.message);

        }

    });

}


// ======================================
// EDIT BOOK
// ======================================

function editBook(id) {

    const book = allBooks.find(item => item.book_id === id);

    if (!book) return;

    document.getElementById('bookId').value = book.book_id;

    document.getElementById('title').value = book.title;

    document.getElementById('author').value = book.author || '';

    document.getElementById('category').value = book.category || '';

    document.getElementById('price').value = book.price;

    document.getElementById('quantity').value = book.quantity;

    document.getElementById('formTitle').innerText = '✏️ Edit Book';

    document.getElementById('saveBtn').innerText = 'Update Book';

    document.getElementById('cancelBtn').hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}


// ======================================
// DELETE BOOK
// ======================================

async function deleteBook(id) {

    const confirmDelete = confirm(
        'Are you sure you want to delete this book?'
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(`/api/books/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.message || result.error);

        }

        alert(result.message);

        loadBooks();

        loadDashboard();

    } catch (error) {

        alert(error.message);

    }

}


// ======================================
// RESET BOOK FORM
// ======================================

function resetBookForm() {

    if (!bookForm) return;

    document.getElementById('bookId').value = '';

    document.getElementById('formTitle').innerText =
        '➕ Add New Book';

    document.getElementById('saveBtn').innerText =
        'Add Book';

    document.getElementById('cancelBtn').hidden = true;

}


const cancelBtn = document.getElementById('cancelBtn');

if (cancelBtn) {

    cancelBtn.addEventListener('click', () => {

        bookForm.reset();

        resetBookForm();

    });

}


// ======================================
// SEARCH BOOKS
// ======================================

const searchBook = document.getElementById('searchBook');

if (searchBook) {

    searchBook.addEventListener('input', function() {

        const search = this.value.toLowerCase();

        const filteredBooks = allBooks.filter(book =>

            book.title.toLowerCase().includes(search) ||

            (book.author || '').toLowerCase().includes(search) ||

            (book.category || '').toLowerCase().includes(search)

        );

        displayBooks(filteredBooks);

        displayBookGallery(filteredBooks);

    });

}


// ======================================
// DASHBOARD STATISTICS
// ======================================

async function loadDashboard() {

    if (!document.getElementById('totalBooks')) return;

    try {

        const [
            booksResponse,
            customersResponse,
            salesResponse
        ] = await Promise.all([

            fetch('/api/books'),

            fetch('/api/customers'),

            fetch('/api/sales')

        ]);

        if (
            !booksResponse.ok ||
            !customersResponse.ok ||
            !salesResponse.ok
        ) {
            return;
        }

        const books = await booksResponse.json();

        const customers = await customersResponse.json();

        const sales = await salesResponse.json();

        document.getElementById('totalBooks').innerText =
            books.length;

        document.getElementById('totalCustomers').innerText =
            customers.length;

        document.getElementById('totalSales').innerText =
            sales.length;

        document.getElementById('availableStock').innerText =

            books.reduce(
                (total, book) => total + Number(book.quantity),
                0
            );

    } catch (error) {

        console.log(
            'Dashboard statistics will be available after API setup.'
        );

    }

}


// ======================================
// CUSTOMER MANAGEMENT
// ======================================

let allCustomers = [];


async function loadCustomers() {

    const table = document.getElementById('customerTable');

    if (!table) return;

    try {

        const response = await fetch('/api/customers');

        if (!response.ok) {
            throw new Error('Unable to load customers');
        }

        allCustomers = await response.json();

        displayCustomers(allCustomers);

    } catch (error) {

        table.innerHTML =
            '<tr><td colspan="6">Error loading customers.</td></tr>';

    }

}


// DISPLAY CUSTOMERS

function displayCustomers(customers) {

    const table = document.getElementById('customerTable');

    if (!table) return;

    if (customers.length === 0) {

        table.innerHTML =
            '<tr><td colspan="6">No customers found. Add your first customer!</td></tr>';

        return;
    }

    table.innerHTML = customers.map(customer => `

        <tr>

            <td>${customer.customer_id}</td>

            <td>${escapeHTML(customer.name)}</td>

            <td>${escapeHTML(customer.email || '-')}</td>

            <td>${escapeHTML(customer.phone || '-')}</td>

            <td>${escapeHTML(customer.address || '-')}</td>

            <td>

                <button class="edit-btn"
                    onclick="editCustomer(${customer.customer_id})">
                    Edit
                </button>

                <button class="delete-btn"
                    onclick="deleteCustomer(${customer.customer_id})">
                    Delete
                </button>

            </td>

        </tr>

    `).join('');

}


// ADD OR UPDATE CUSTOMER

const customerForm = document.getElementById('customerForm');

if (customerForm) {

    customerForm.addEventListener('submit', async function(event) {

        event.preventDefault();

        const id = document.getElementById('customerId').value;

        const customer = {

            name: document.getElementById('customerName').value.trim(),

            email: document.getElementById('customerEmail').value.trim(),

            phone: document.getElementById('customerPhone').value.trim(),

            address: document.getElementById('customerAddress').value.trim()

        };

        try {

            const response = await fetch(

                id ? `/api/customers/${id}` : '/api/customers',

                {

                    method: id ? 'PUT' : 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(customer)

                }

            );

            const result = await response.json();

            if (!response.ok) {

                throw new Error(result.message || result.error);

            }

            alert(result.message);

            customerForm.reset();

            resetCustomerForm();

            loadCustomers();

            loadDashboard();

        } catch (error) {

            alert(error.message);

        }

    });

}


// EDIT CUSTOMER

function editCustomer(id) {

    const customer = allCustomers.find(
        item => item.customer_id === id
    );

    if (!customer) return;

    document.getElementById('customerId').value =
        customer.customer_id;

    document.getElementById('customerName').value =
        customer.name;

    document.getElementById('customerEmail').value =
        customer.email || '';

    document.getElementById('customerPhone').value =
        customer.phone || '';

    document.getElementById('customerAddress').value =
        customer.address || '';

    document.getElementById('customerFormTitle').innerText =
        '✏️ Edit Customer';

    document.getElementById('customerSaveBtn').innerText =
        'Update Customer';

    document.getElementById('customerCancelBtn').hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}


// DELETE CUSTOMER

async function deleteCustomer(id) {

    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }

    try {

        const response = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.message || result.error);

        }

        alert(result.message);

        loadCustomers();

        loadDashboard();

    } catch (error) {

        alert(error.message);

    }

}


// RESET CUSTOMER FORM

function resetCustomerForm() {

    if (!customerForm) return;

    document.getElementById('customerId').value = '';

    document.getElementById('customerFormTitle').innerText =
        '➕ Add New Customer';

    document.getElementById('customerSaveBtn').innerText =
        'Add Customer';

    document.getElementById('customerCancelBtn').hidden = true;

}


const customerCancelBtn =
    document.getElementById('customerCancelBtn');

if (customerCancelBtn) {

    customerCancelBtn.addEventListener('click', () => {

        customerForm.reset();

        resetCustomerForm();

    });

}


// SEARCH CUSTOMERS

const searchCustomer = document.getElementById('searchCustomer');

if (searchCustomer) {

    searchCustomer.addEventListener('input', function() {

        const search = this.value.toLowerCase();

        const filteredCustomers = allCustomers.filter(customer =>

            customer.name.toLowerCase().includes(search) ||

            (customer.email || '').toLowerCase().includes(search) ||

            (customer.phone || '').toLowerCase().includes(search)

        );

        displayCustomers(filteredCustomers);

    });

}


// ======================================
// INITIALIZE ALL PAGES
// ======================================

loadBooks();

loadDashboard();

loadCustomers();