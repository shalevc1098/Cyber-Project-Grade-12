import { GraphQLID, GraphQLNonNull, GraphQLObjectType } from "graphql";
import Books from "./BooksType.js";

const CreateBooksPayload = new GraphQLObjectType({
    name: 'CreateBooksPayload',
    description: 'Books type definition',
    fields: () => ({
        book: {
            type: new GraphQLNonNull(Books)
        }
    })
});

export default CreateBooksPayload;