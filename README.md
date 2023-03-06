# Local

To run the server locally:

    npm install
    npm start

The documentation of the API can be found at `localhost:3000/api-docs`.
The key for calling all the endpoints is `1234567`. Most of the endpoints called from the swagger and the web client require this authentication, without it only reading is allowed.

# Remote

Remote server is hosted at

    https://express-crud-production-438d.up.railway.app/sentences/list

The api key for navigating around is the same `1234567`
It's possible to upload the large file containing the sentences using the endpoint `misc-parse`, however there's a big chance my google quota will ran out.
The documentation of the api also can be accessed from the remote server `https://express-crud-production-438d.up.railway.app/api-docs`.

It's possible to navigate around the site without authenticating, just click outside of the modal once it appears in the main page.

Also remember to change your server when using Swagger, on the selector from the top left of the screen.
