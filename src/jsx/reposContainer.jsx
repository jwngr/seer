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
      },
      organization: {
        name: ""
      },
      defaultOrganizationUsername: "firebase",
      gitHubPublicAccessToken: "d838d4f13e7d8fd3b0446f7b1dac1e330b7b8d3d"
    };
  },

  getQueryStringParameterByName: function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return (results === null) ? "" : decodeURIComponent(results[1].replace(/\+/g, " ").replace(/\//, ""));
  },

  componentWillMount: function() {
    var organization = this.getQueryStringParameterByName("org") || this.state.defaultOrganizationUsername;
    this.getOrganizationNameAndIssues(organization);
  },

  getOrganizationNameAndIssues: function(organization) {
    if (organization !== "") {
      var _this = this;
      $.getJSON("https://api.github.com/orgs/" + organization, {
        access_token: this.state.gitHubPublicAccessToken
      }, function(organizationData) {
        _this.setState({
          organization: {
            name: organizationData.name
          }
        });

        _this.getIssuesForOrganization(organization);
      });
    }
  },

  getIssuesForOrganization: function(organization) {
    var _this = this;
    $.getJSON("https://api.github.com/orgs/" + organization + "/repos", {
      access_token: this.state.gitHubPublicAccessToken,
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
      return <Repo repo={ repo } filters={ this.state.filters } gitHubPublicAccessToken={ this.state.gitHubPublicAccessToken } key={ repo.id } />;
    }.bind(this));

    // Display a loading message if we haven't retrieved any repos yet
    if (repos.length === 0) {
      if (this.state.reposLoaded) {
        repos = <p id="mainReposMessage">No repos match the chosen filters.</p>;
      } else {
       repos = <p id="mainReposMessage">Loading issues for { this.state.organization.name } repos...</p>;
      }
    }

    // Freshness scale

    var freshnessScale = [];
    for (var i = 0; i < 7; ++i) {
      var className = "freshnessLevel" + (i + 1);
      freshnessScale.push(<div className={ className } key={ i }></div>);
    }

    return (
      <div>
        <p id="title">{ this.state.organization.name } Seer</p>

        <div id="freshnessScale">
          <p>Freshness<br />Scale</p>
          { freshnessScale }
        </div>

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

React.render(<ReposContainer />, document.getElementById("reposContainer"));
