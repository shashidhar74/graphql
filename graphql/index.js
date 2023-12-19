const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema, GraphQLInt } = require('graphql');
const { Pool } = require('pg');
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
    }=require('graphql')
const app = express();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'New_db',
  password: 'root',
  port: 5432,
});

const BookType =new GraphQLObjectType({
    name:'Books',
    fields:()=>({
        id:{type:GraphQLNonNull(GraphQLInt)},
        name:{type:GraphQLNonNull(GraphQLString)},
        author_id:{type:GraphQLNonNull(GraphQLString)},
        authorsData:{
            type:AuthorType,
            resolve:(parent)=>{
                if (parent.author_id === null) {
                    return null; 
                }
                return pool.query('SELECT * FROM authors WHERE id = $1', [parent.author_id])
                    .then(result => result.rows[0])
                    .catch(error => {
                        console.error('Error fetching author data:', error);
                        throw error;
                    });
            }
        
            }
        
    })
  })
  const AuthorType =new GraphQLObjectType({
    name:'Authours',
    //description:'this represnts the Authors object',
    fields:()=>({
        id:{type:GraphQLNonNull(GraphQLInt)},
        name:{type:GraphQLNonNull(GraphQLString)},
    })
  })
const MainQueryType=new GraphQLObjectType({
    name:'FirstQuery',
    description:'Books & Authours',
    fields:()=>({
    
        books:{
            type:new GraphQLList(BookType),
            resolve:()=>{
                return pool.query('SELECT * FROM books').then(result => result.rows);
            }
        },
        book: {
            type: BookType,
            args: { id: { type: GraphQLInt } },
            resolve(parent, args) {
              return pool.query('SELECT * FROM books WHERE id = $1', [args.id]).then(result => result.rows[0]);
            },
          },

        authorsData:{
            type:new GraphQLList(BookType),
            description:'My All Authors',
            resolve:()=>{
                return pool.query('SELECT * FROM authors').then(result => result.rows);
            }
        }
        
    })
})
const MainMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'My mutations here',
    fields: () => ({
        addBook: {
            type: BookType,
            description: 'Add new book',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                authorId: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: async (parent, args) => {
                try {
                    const query = 'INSERT INTO books (name, author_id) VALUES ($1, $2) RETURNING *';
                    const values = [args.name, args.authorId];
                    const result = await pool.query(query, values);
                    const insertedBook = result.rows[0];
                    return insertedBook;
                } catch (error) {
                    console.error('Error inserting book into the database:', error);
                    throw error;
                }
            }
        },
        editBook: {
            type: BookType,
            description: 'Edit existing book',
            args: {
              id: { type: GraphQLNonNull(GraphQLInt) },
              name: { type: GraphQLNonNull(GraphQLString) },
              author_id: { type: GraphQLNonNull(GraphQLInt) },
            },
            resolve: async (parent, args) => {
              try {
                const query =
                  'UPDATE books SET name = $1, author_id = $2 WHERE id = $3 RETURNING *';
                const values = [args.name, args.author_id, args.id];
                const result = await pool.query(query, values);
                const updatedBook = result.rows[0];
                return updatedBook;
              } catch (error) {
                console.error('Error updating book in the database:', error);
                throw error;
              }
            },
          },
          deleteBook:{
            type: BookType,
      description: 'Delete a book',
      args: {
        id: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (parent, args) => {
        const deletedBook = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [args.id]);
        return deletedBook.rows[0];
      },
          }
        
    })
});


const schema=new GraphQLSchema({
    query:MainQueryType,
    mutation:MainMutationType
})

app.use('/graphql', graphqlHTTP({
    schema:schema,
  graphiql: true, 
}));
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/graphql`);
});

