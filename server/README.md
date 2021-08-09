## Single Server

Trying to convert everything into just 1 server instead of having Hasura + Auth0

- a media server + postgres. Just one server. Saving to the filesystem.

Basic premise:

- Something like lowdb to store data
- Authenticate via username & password
  - No emails at all
  - Contact sysadmin for password reset
- Files are posted to an endpoint and saved to disk
  - Once a submit receit mutation is successful, the file gets moved
  - We can clear out old files every so often (nice to have)
- Support upload of images as well as PDFs
  - No need to display them, just offer them as download links
  - Downloads will be resolved via the database

Maybe using something like TypeGraphQL would make sense. This could link
together the GraphQL schema and the database schema. But it's also a bit
complex. Otherwise we need to build the schema by hand. Given that lowdb doesn't
enforce any schemas, the code will be quite fragile.
