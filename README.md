# prisma-mysql-node-sql-views-demo

## Official doc by : [Prisma.io](https://www.prisma.io/)


[](https://github.com/prisma/prisma)

Documentation

[Guides](https://www.prisma.io/docs/guides) / [Database guides](https://www.prisma.io/docs/guides/database) / [Advanced database tasks](https://www.prisma.io/docs/guides/database/advanced-database-tasks)

SQL views
=========

MySQL

This page explains how to create a [view](https://dev.mysql.com/doc/refman/8.0/en/views.html) in your MySQL database.

In this guide, you will:

*   Create two tables where one references the other via a foreign key.
*   Create a view named `Draft`.
*   Introspect your database to reflect the foreign key relation between the two tables in the Prisma schema.
*   Manually update the Prisma schema to include the view as a model.
*   Generate Prisma Client and write a simple Node.js script to read data from the view.

The workaround described in this guide is by no means a best practice, it instead fills in some gaps for missing functionality in Prisma. **It will not work with Prisma Migrate or introspection**.

There is an [issue](https://github.com/prisma/prisma/issues/678) currently open which aims to add support for database views in Prisma.

Subscribe to the issue for updates on progress and timelines.

[](#prerequisites)Prerequisites
-------------------------------

In order to follow this guide, you need:

*   a [MySQL](https://www.mysql.com/) database server running
*   the [`mysql`](https://dev.mysql.com/doc/refman/5.7/en/mysql.html) command line client for MySQL
*   [Node.js](https://nodejs.org/) installed on your machine

[](#limitations)Limitations
---------------------------

Be aware of the following limitations when using views with Prisma:

*   You must _manually_ add each view as a model to the Prisma schema right now. Introspection does not add views to the schema currently.
*   Views must include a unique column - such as an ID.
*   The generated Prisma Client will include queries such `create`, `delete`, and `update`, even though you cannot perform these queries on a view.
*   Models created for views will be **deleted** from your schema the next time you run an introspection. This is because they **do not** correspond to the tables in the database.
*   Prisma Migrate will treat these views as tables and try to create them. If you have view models, you **cannot** use Prisma Migrate with them.

[](#1-create-a-new-database-and-project-directory)1\. Create a new database and project directory
-------------------------------------------------------------------------------------------------

To create a new database:

1.  Create a project directory where you can put the files you'll create throughout this guide:
    
        mkdir sql-views-demo
        cd sql-views-demo
    
2.  Next, make sure that your database server is running. Then execute the following command in your terminal to create a new database called `SqlViews` (in Mysql terminal):
    
        CREATE DATABASE `SqlViews`;
    
3.  Validate that the database was created by running the following command which lists all tables (_relations_) in your database (right now there are none):
    
        SHOW TABLES in `SqlViews`;
    

[](#2-create-two-tables-with-a-foreign-key)2\. Create two tables with a foreign key
-----------------------------------------------------------------------------------

In this section, you'll **create two tables where one references the other via a foreign key** in the `SqlViews` database.

1.  Create a new file named `sql-views-tables.sql` and add the following code to it:

        CREATE TABLE `SqlViews`.`User` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(256),
        `email` VARCHAR(256) UNIQUE
        );

        CREATE TABLE `SqlViews`.`Post` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(256),
        `content` VARCHAR(256),
        `published` BOOLEAN,
        `authorId` INT,
        CONSTRAINT `author` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`)
        );

    
2.  Run the SQL statement against your database to create the two tables (in Mysql terminal):
    
        USE `SqlViews`;
        SOURCE sql-views-tables.sql;
    
3.  Run the following command to validate that the tables were created (in Mysql terminal):
    
        SHOW TABLES in `SqlViews`;
    

You just created two tables named `User` and `Post` in the database. The `Post` table references the `User` table via the foreign key defined on the `authorId` column.

[](#3-create-a-view-named-draft)3\. Create a view named `Draft`
---------------------------------------------------------------

In this section you will create a view named `Draft`. The `Draft` view represents a query that returns the post title and author email of all posts that have not been published. To create a view:

1.  Create a new file named `sql-views-draft.sql` and add the following code to it:
    
        CREATE VIEW Draft AS
        SELECT published, title, email, Post.id
        FROM Post, User
        WHERE published = false AND Post.authorId = User.id;

    
2.  Run the SQL statement against your database to create the view (in Mysql terminal):
    
        USE `SqlViews`;
        SOURCE sql-views-draft.sql;
    
3.  Run the following command to validate that the view was created (in Mysql terminal):
    
        SHOW FULL TABLES in `SqlViews` WHERE TABLE_TYPE LIKE 'VIEW';
    
    You should see the following list of views:
    
         +----------------+------------+
         | Tables_in_mydb | Table_type |
         +----------------+------------+ 
         | Drafts         | VIEW       |
         +----------------+------------+
    

[](#4-introspect-your-database-with-prisma)4\. Introspect your database with Prisma
-----------------------------------------------------------------------------------

In this section you'll introspect your database to generate the Prisma models for the tables that you created.

> **Note**: You will manually add the `Draft` view to the Prisma schema in a later step.

1.  Set up a new Node.js project and add the `prisma` CLI as a development dependency:
    
        npm init -y
        npm install prisma --save-dev
    
2.  Create a new file named `schema.prisma` and add the following code to it:
    
    schema.prisma
    
        datasource db {
        provider = "mysql"
        url      = env("DATABASE_URL")
        }
    
3.  In order to introspect your database, you need to tell Prisma how to connect to it. You do so by configuring a `datasource` in your Prisma schema. Create a new file named `.env` and set your database connection URL as the `DATABASE_URL` environment variable:
    
        DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
    
    In the above code snippet, you need to replace the uppercase placeholders with your own connection details. For example, if your database is running locally it could look like this:
    
        DATABASE_URL=mysql://janedoe:mypassword@localhost:3306/mydb
    
    The database connection URL is set via an environment variable. The Prisma CLI automatically supports the [`dotenv`](https://github.com/motdotla/dotenv) format which automatically picks up environment variables defined in a file named `.env`.
    
4.  With both the `schema.prisma` and `.env` files in place, run Prisma's introspection with the following command:
    
        npx prisma db pull
    
    This command introspects your database and for each table adds a Prisma model to the Prisma schema:
    
    schema.prisma
    
        datasource db {
          provider = "mysql"
          url      = env("DATABASE_URL")
        }

        model Post {
          authorId  Int?
          content   String?
          id        Int     @id @default(autoincrement())
          published Boolean @default(false)
          title     String
          User      User?   @relation(fields: [authorId], references: [id])
        }

        model User {
          email String  @unique
          id    Int     @id @default(autoincrement())
          name  String?
          Post  Post[]
        }

[](#5-manually-add-the-draft-view-to-the-prisma-schema)5\. Manually add the `Draft` view to the Prisma schema
-------------------------------------------------------------------------------------------------------------

You must manually add views to the Prisma schema.

1.  Add a `Draft` model at the end of the schema as shown:
    
    > **Note**: The name of your view is case sensitive - if you created a view named `draft` in the database, you must create a model named `draft` in the Prisma schema.
    
    schema.prisma
    
        model Draft {
          title     String
          id        Int     @unique
          email     String
          published Boolean
        }
    

[](#6-generate-prisma-client)6\. Generate Prisma Client
-------------------------------------------------------

In this section, you will generate Prisma Client.

1.  Add a `generator` block to your Prisma schema (typically added right below the `datasource` block):
    
    schema.prisma

        generator client {
          provider = "prisma-client-js"
        }
    
2.  Run the following command to install and generate Prisma Client in your project:
    
        npx prisma generate
    

Now you can use Prisma Client to send database queries in Node.js.

[](#9-validate-the-draft-view-in-a-nodejs-script)9\. Validate the `Draft` view in a Node.js script
--------------------------------------------------------------------------------------------------

In the following section, you will use the `drafts` model property to return `Post` records that have not yet been published. To use the `drafts` model property:

1.  Create a new file named `index.js` and add the following code to it:
    
        const { PrismaClient } = require('@prisma/client')

        const prisma = new PrismaClient({})

        async function main() {
          const sarahPosts = await prisma.user.create({
            data: {
              name: 'Sarah',
              email: 'sarah@prisma.io',
              Post: {
                create: [
                  { title: 'My first post', published: false },
                  { title: 'All about databases', published: true },
                  { title: 'Prisma Day 2020', published: false },
               ],
              },
            },
          })

          const emilyPosts = await prisma.user.create({
            data: {
              name: 'Emily',
              email: 'emily@prisma.io',
              Post: {
                create: [
                  { title: 'My first post', published: false },
                  { title: 'All about databases', published: true },
                  { title: 'Prisma Day 2020', published: false },
                ],
              },
            },
          })

          const drafts = await prisma.draft.findMany({})

          console.log(drafts)

          const filteredDrafts = await prisma.draft.findMany({
            where: {
              email: 'sarah@prisma.io',
            },
          })

          console.log(filteredDrafts)
        }

        main()
          .catch((e) => {
            throw e
          })
          .finally(async () => {
            await prisma.$disconnect()
          })
    
    This example:
    
    *   Creates two `User` records with three `Post` records each
    *   Returns all `Draft` records from the view
    *   Returns all `Draft` records from the view where the author's email is `emily@prisma.io`
2.  Run the code with the following command:
    
        node index.js
    
    The following output indicates that the view works as expected - the first query returns all drafts (`Post` records where `published` is `false`), and the second query returns drafts by `emily@prisma.io` only):
    
        /* ALL DRAFTS */
        ;[
          {
            title: 'My first post',
            id: 37,
            email: 'sarah@prisma.io',
            published: false,
          },
          {
            title: 'Prisma Day 2020',
            id: 39,
            email: 'sarah@prisma.io',
            published: false,
          },
          {
            title: 'My first post',
            id: 40,
            email: 'emily@prisma.io',
            published: false,
          },
          {
            title: 'Prisma Day 2020',
            id: 42,
            email: 'emily@prisma.io',
            published: false,
          },
        ][
          /* FILTERED DRAFTS */
          ({
            title: 'My first post',
            id: 37,
            email: 'sarah@prisma.io',
            published: false,
          },
          {
            title: 'Prisma Day 2020',
            id: 39,
            email: 'sarah@prisma.io',
            published: false,
          })
        ]
    