# Seer

Seer is an open-source dashboard which allows you to view the freshness of a GitHub organization's
public repositories. The dashboard uses the [GitHub API](https://developer.github.com/v3/) to
retrieve an organization's list of repos and then displays all the open issues and pull requests for
those repos. It assigns each repo a color depending on how "fresh" the repo is. That is, how many
open issues and pull requests are there and how long has it been since they have been updated.

Seer can give you a good idea of what repos are becoming unmaintainable within your organization.
You can then either give them some more love or deprecate them.


## Demo

Check out [Firebase Seer](https://seer.firebaseapp.com/) to see the dashboard in action for the
[Firebase](https://www.firebase.com/) organization.


## Usage

There are two ways to view your own organization's dashboard. First, you could just tack on
`?org=<your-organization>` to the [Firebase Seer URL](https://seer.firebaseapp.com/). For example,
here is the link to [Facebook Seer](https://seer.firebaseapp.com?org=facebook).

You can also host your own version of Seer for your organization by cloning this repo. All you need
to do is replace the default organization username and public (no permissions) GitHub access token
[in `reposContainer.js` on this line](https://github.com/jacobawenger/seer/blob/d1ccf3359a46e7e841f4e40ad523aa7bd6178cc0/js/reposContainer.js#L15-L16)
with your organization's username and your public GitHub access token.

If you need a place to host your organization's Seer, check out [Firebase Hosting](https://www.firebase.com/hosting.html). You'll have your custom Seer up and running in just a couple minutes.


## Contributing

I will gladly accept pull requests for new features or bug fixes. There are two main things I'd like
to improve:

* __Pagination:__ The GitHub API only returns 100 repos at a time for an organization so if your
organization has more than that, only the first 100 will be shown. For example, check out
[GitHub Seer](https://seer.firebaseapp.com?org=github).

* __Freshness Algorithm__: The freshness algorithm is pretty basic at the moment. It only
looks at time since last update for the open issues. It completely ignores the number of open issues
and pull requests as well as the time since last update for the open pull requests. I'm hoping
someone want to implement a smarter algorithm for that!


## License

MIT
