# Seer ![GitHub Seer Logo - Green Eye](./src/images/greenEye.ico)

Seer is an open-source dashboard to help you manage your GitHub organization's public repositories.
The dashboard uses the [GitHub API](https://developer.github.com/v3/) to retrieve all open issues
and pull requests for your organization's public repos. It assigns each repo a color depending on how
"fresh" it is; that is, how many open issues and pull requests are there and how long has it been
since they have been updated.

Seer can give you a good idea of what repos are becoming unmaintainable within your organization. It
also lets you assign a primary and secondary owner to your repos so everyone knows who is responsible
for what. Seer will help you get a high level view of your repos and give them the love they need.


## Demo

Check out [Firebase Seer](https://seer.firebaseapp.com/) to see the dashboard in action for the
[Firebase](https://www.firebase.com/) organization.


## Usage

There are two ways to view your own organization's dashboard. First, you could just tack on
`?org=<your-organization>` to the [Firebase Seer URL](https://seer.firebaseapp.com/). For example,
here is the link to [Facebook Seer](https://seer.firebaseapp.com?org=facebook).

You can also host your own version of Seer for your organization by cloning this repo. All you need
to do is replace the default organization username and public (no permissions) GitHub access token
[in `reposContainer.js` on this line](https://github.com/jwngr/seer/blob/26c868d29c61ed04acf2a109c9fe901eb0443942/src/jsx/reposContainer.jsx#L365-L366)
with your organization's username and your public GitHub access token.

If you need a place to host your organization's Seer, check out [Firebase Hosting](https://www.firebase.com/hosting.html). You'll have your custom Seer up and running in just a couple minutes.


## Security

Only people who belong to your organization can view and edit ownership data about your repos. Unlike
the repo data (i.e. open issues, pull requests, etc.) which is all public, ownership data is stored
securely in Firebase and only visible to your coworkers. In addition, you can only assign ownership
of a repo to someone if they belong to your organization.


## Contributing

If you'd like to contribute to Seer, you'll need to run the following commands to get your
environment set up:

```bash
$ git clone https://github.com/jwngr/seer.git
$ cd seer               # go to the seer directory
$ npm install -g gulp   # globally install gulp task runner
$ npm install -g bower  # globally install Bower package manager
$ npm install           # install local npm build dependencies
$ bower install         # install local JavaScript dependencies
$ gulp                  # build the distribution files
```

`gulp watch` will watch for changes in the `/src/` directory and compile, lint, concatenate, minify,
and copy the source files when a change occurs. The output files are written to the `/dist/`
directory.

To view Seer locally, you can use Python to spin up a local server:

```
$ python -m SimpleHTTPServer
```

Then, navigate to http://localhost:8000/dist/index.html to view Seer.
