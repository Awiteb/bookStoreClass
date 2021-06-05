#!/usr/bin/node


const specialChars = [
    '!', '@', '#', '$', '^', '&', '%',
    '*', '(', ')', '+', '=', '-', '[',
    ']', '',  '/', '{', '}', '|', ':',
    '<', '>', '?', ',', '.', '_', '1',
    '2', '3', '4', '5', '6', '7', '8',
    '9', '0'
    ];

const fs = require("fs");
const jsonFileName = "./storeDate.json";
const firstUpper = (text) => text[0].toUpperCase() + text.slice(1);
const getJson = () => JSON.parse(fs.readFileSync(jsonFileName));
const saveJson = (json) => fs.writeFileSync(jsonFileName, JSON.stringify(json, null, 2));


class BookStore {
    /*
    With this class, you can create a store, display, sell and add books to it
    */
    #minCharacters;
    #name;
    constructor(sName) { // store name
        this.doneMakeDb = false;
        this.#minCharacters = 6;
        this.name = sName;
        this.#addStore();
    }
    set name(newName) {
        newName = firstUpper(newName);
        if (newName.length >= this.#minCharacters && specialChars.indexOf(newName[0]) == -1) { // name bigger or equal minCharacters and first char in newName not specialChar
            if (this.doneMakeDb){
                if (!this.#storeIsExist(newName)) {
                    let data = getJson();
                    let storeIndex = this.#getStoreIndex();
                    data.stores[storeIndex].name = newName;
                    saveJson(data);
                } else {
                    console.error("Name already exists");
                    return;
                }
            } else {
                // pass
            }
            this.#name = newName;
        } else {
            return `Invalid name, '${newName}' must bigger or equal ${this.#minCharacters} character, and first character not special character or number`;
        }
    }
    get name() {
        return this.#name;
    }
    addBook(title, author, price, quantity) {
        let checkArray = [title, author, price, quantity].map(
            item => item != undefined); // Check if there is an missing parameter
            if (!checkArray.every((i) => i == true)) {
                return 'There is a missing parameter';
            } else {
                if (title.length < 5 || author.length < 5) {
                    return "title and author must biger 5";
                } else if (price < 0 || quantity < 0){
                    return "price and quantity must biger 0";
                } else {
                    let bookId = this.#getBookId();
                    let bookOb = {
                        id: bookId,
                        title: title,
                        author: author,
                        price: price,
                        quantity: quantity
                    }
                    this.#pushBook(bookOb);
                    return bookOb;
                }
            }
    }
    getBookById(id){
        let books = this.getBooks();
        let book = books.find(b => { // b = book
            return b.id == id;
        })
        return book == undefined
        ? null
        : book;
    }
    getBookByTitle(title){
        let books = this.getBooks();
        let book = books.find(b => { // b = book
            return b.title == title;
        })
        return book == undefined
        ? null
        : book;
    }
    getBooksByAuthor(author){
        let books = this.getBooks();
        let book = books.filter(b => { // b = book
            return b.author == author;
        })
        return book.length == 0
        ? null
        : book;
    }
    getBooks() {
        let data = getJson();
        let storeIndex = this.#getStoreIndex();
        return data.stores[storeIndex].books;
    }
    updateBookPrice(idOrTitle, newPrice) {
        if (newPrice >= 0) {
            let data = getJson();
            let storeIndex = this.#getStoreIndex();
            let bookIndex = this.#getBookIndex(idOrTitle);
            if (bookIndex != null) {
                data.stores[storeIndex].books[bookIndex].price = newPrice;
                saveJson(data);
                return data.stores[storeIndex].books[bookIndex];
            } else {
                return "book not found";
            }
        } else {
            return "Invalid price"
        }
    }
    updateBookQuantity(idOrTitle, newQuantity) {
        if (newQuantity >= 0) {
            let data = getJson();
            let storeIndex = this.#getStoreIndex();
            let bookIndex = this.#getBookIndex(idOrTitle);
            if (bookIndex != null) {
                data.stores[storeIndex].books[bookIndex].quantity = newQuantity;
                saveJson(data);
                return data.stores[storeIndex].books[bookIndex];
            } else {
                return "book not found";
            }
        } else {
            return "Invalid quantity"
        }
    }
    sellBook(idOrTitle) {
        let data = getJson();
        let storeIndex = this.#getStoreIndex();
        let bookIndex = this.#getBookIndex(idOrTitle);
        let book = data.stores[storeIndex].books[bookIndex];
        if (bookIndex != null) {
            let quantity = data.stores[storeIndex].books[bookIndex].quantity;
            if (quantity == 0) {
                return "The book is out of stock";
            } else {
                data.stores[storeIndex].books[bookIndex].quantity--;
                saveJson(data);
                return this.#makeInvoice(book);
            }
        } else {
            return "book not found";
        }
    }
    #makeInvoice(book) {
        return `Done sell.
        \rTitle: ${book.title}
        \rPrice: ${book.price}$
        \rAuthor: ${book.author}`;
    }
    #pushBook(bookOb) {
        let data = getJson();
        let storeIndex = this.#getStoreIndex();
        let booksTitle = this.getBooks().map(book => {
            return book.title;
        })
        if (!booksTitle.includes(bookOb.title)) {
            data.stores[storeIndex].books.push(bookOb);
        } else {
            return null;
        }
        saveJson(data);
    }
    #getStoreIndex = () => getJson().stores.findIndex(
        store => store.name == this.name);

    #getBookIndex = (idOrTitle) => {
        let storeIndex = this.#getStoreIndex();
        let stores = getJson().stores;
        let booksIdOrTitle = stores[storeIndex].books.map(book => {
            return (typeof idOrTitle == 'number')
            ? book.id
            : book.title
        })
        let bookIndex = booksIdOrTitle.indexOf(idOrTitle);
        return bookIndex == -1
        ? null
        :bookIndex
    }
    #storeIsExist(storeName) {
        storeName = (storeName == undefined) ? this.name :storeName;
        let data = getJson();
        let storesName = data.stores.map(store => {
            return store.name;
        })
        return storesName.indexOf(storeName) != -1;
    }
    #addStore() {
        let storeOb = {
            name: this.name,
            books: []
        }
        this.doneMakeDb = true;
        let data = getJson();
        if (!this.#storeIsExist()){
            data.stores.push(storeOb);
            saveJson(data);
            return storeOb;
        } else {
            return null;
        }
    }
    #getBookId() {
        let books = this.getBooks();
        if (books.length == 0) {
            return 1;
        }else {
            let lastBookId = books[books.length - 1].id;
            return lastBookId+1;
        }
    }
}