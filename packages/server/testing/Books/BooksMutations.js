import { GraphQLNonNull } from "graphql";
import { createBook, isBookExist } from "../operations/books-operations.js";
import CreateBooksInput from "./CreateBooksInputType.js";
import CreateBooksPayload from "./CreateBooksPayload.js";

const BooksMutations = {
    createBook: {
        type: CreateBooksPayload,
        args: {
            input: { type: new GraphQLNonNull(CreateBooksInput) }
        },
        resolve: (parent, args) => {
            const { input } = args;
            if (isBookExist(input.id)) throw new Error(`Book with id of ${input.id} already exist`);
            return {
                book: createBook(input)
            };
        }
    }
}

export default BooksMutations;