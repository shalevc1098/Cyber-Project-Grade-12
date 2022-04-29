import authors from '../db/authors.js';
import { getBooks } from './books-operations.js';

export const getAuthors = () => authors;

export const getAuthor = (id) => authors.find(author => author.id == id);

export const addAuthor = (author) => {
    authors.push(author);
    return author;
}

export const getBooksByAuthor = (id) => {
    return getBooks().filter(book => book.authorId == id);
};