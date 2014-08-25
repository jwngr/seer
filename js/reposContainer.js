/** @jsx React.DOM */
var ReposContainer = React.createClass({
  getInitialState: function() {
    return {
      repos: [],
      reposLoaded: false,
      filters: {
        freshness: "all",
        issues: "all",
        pullRequests: "all"
      }
    };
  },

  componentWillMount: function() {
    var _this = this;
    $.getJSON("https://api.github.com/orgs/firebase/repos", {
      access_token: "d838d4f13e7d8fd3b0446f7b1dac1e330b7b8d3d",
      per_page: 100
    }, function(repos) {
      // TODO: add pagination (https://developer.github.com/guides/traversing-with-pagination/)
      if (repos.length === 100) {
        alert("GitHub only returns 100 repos per page and this organization has over 100 repos so some will be missing. Pagination must be implemented.");
      }

      // Sort the repos alphabetically
      repos.sort(function(a, b) {
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        } else {
          return -1;
        }
      });

      _this.setState({
        repos: repos,
        reposLoaded: true
      });
    });
  },

  updateFreshnessFilter: function(event) {
    var updatedFilters = this.state.filters;
    updatedFilters.freshness = event.target.value;
    this.setState({
      filters: updatedFilters
    });
  },

  updateNumIssuesFilter: function(event) {
    var updatedFilters = this.state.filters;
    updatedFilters.issues = event.target.value;
    this.setState({
      filters: updatedFilters
    });
  },

  updateNumPullRequestsFilter: function(event) {
    var updatedFilters = this.state.filters;
    updatedFilters.pullRequests = event.target.value;
    this.setState({
      filters: updatedFilters
    });
  },

  render: function() {
    // Create the JSX for each repo
    var repos = this.state.repos.map(function(repo) {
      return <Repo repo={ repo } filters={ this.state.filters } key={ repo.id } />;
    }.bind(this));

    // Display a loading message if we haven't retrieved any repos yet
    if (repos.length === 0) {
      if (this.state.reposLoaded) {
        repos = <p id="mainReposMessage">No repos match the chosen filters.</p>;
      } else {
       repos = <p id="mainReposMessage">Loading issues for Firebase repos...</p>;
      }
    }

    return (
      <div>
        <p id="title">Firebase GitHub Issues</p>

        <div id="filters">
          <div>
            <label>Freshness</label>
            <select onChange={ this.updateFreshnessFilter }>
              <option value="all">All</option>
              <option value="browning">Browning and worse</option>
              <option value="moldy">Moldy and worse</option>
              <option value="stale">Stale and worse</option>
              <option value="rotten">Rotten and worse</option>
              <option value="putrid">Putrid and worse</option>
              <option value="dead">Dead</option>
            </select>
          </div>

          <div>
            <label>Issues</label>
            <select onChange={ this.updateNumIssuesFilter }>
              <option value="all">All</option>
              <option value="none">None</option>
              <option value="some">Some</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label>Pull Requests</label>
            <select onChange={ this.updateNumPullRequestsFilter }>
              <option value="all">All</option>
              <option value="none">None</option>
              <option value="some">Some</option>
            </select>
          </div>
        </div>

        <div>
          { repos }
        </div>
      </div>
    );
  }
});

React.renderComponent(<ReposContainer />, document.getElementById("reposContainer"));