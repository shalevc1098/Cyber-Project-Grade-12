import books from '../db/books.js';

export const getBooks = () => books;

export const getBook = (id) => books.find(book => book.id == id);

export const createBook = (book) => {
    books.push(book);
    return book;
}

export const isBookExist = (id) => {
    return books.find(b => b.id == id) != undefined;
}