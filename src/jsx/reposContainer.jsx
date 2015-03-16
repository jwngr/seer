/** @jsx React.DOM */
var ReposContainer = React.createClass({
  getInitialState: function() {
    return {
      ref: new Firebase("https://" + this.props.firebase + ".firebaseio.com"),
      repos: {},
      members: undefined,
      reposLoaded: false,
      repoLayout: "card",
      organization: {},
      isLoggedIn: false,
      belongsToOrganization: false,
      filters: {
        freshness: "all",
        issues: "all",
        pullRequests: "all"
      }
    };
  },

  getQueryStringParameterByName: function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return (results === null) ? "" : decodeURIComponent(results[1].replace(/\+/g, " ").replace(/\//, ""));
  },

  componentWillMount: function() {
    var _this = this;

    var organizationUsername = this.getQueryStringParameterByName("org") || this.getQueryStringParameterByName("organization") || this.props.organizationUsername;

    // Get the organization's public metadata
    var organizationData, repos;
    this.getOrganizationPublicMetadata(organizationUsername).then(function(result) {
      organizationData = result;

      return RSVP.all([
        // Get the organization's public repos
        _this.getOrganizationPublicRepos(organizationData),

        // Get the organization's public members
        _this.getOrganizationPublicMembers(organizationData)
      ]);
    }).then(function(values) {
      repos = values[0];
      if (_this.state.isLoggedIn && _this.state.belongsToOrganization) {
        _this.getRepoOwners(organizationData, repos);
      } else {
        _this.setState({
          repos: repos,
          reposLoaded: true
        });
      }
    }).catch(function(error) {
      console.log('Error:', error);
    });

    // Every time auth state changes
    this.state.ref.onAuth(function(authData) {
      this.setState({
        isLoggedIn: (authData !== null)
      });

      if (authData) {
        // Add the logged-in user to Firebase (or update their existing data)
        this.addOrUpdateUserDataInFirebase(authData).then(function(loggedInUsersOrganizations) {
          // Check if the logged-in user belongs to the current organization
          var belongsToOrganization = false;
          Object.keys(loggedInUsersOrganizations).forEach(function(key) {
            belongsToOrganization = belongsToOrganization || (loggedInUsersOrganizations[key] === organizationUsername);
          });

          if (belongsToOrganization) {
            if (_this.state.reposLoaded) {
              _this.getRepoOwners(organizationData, repos);
            }

            _this.setState({
              belongsToOrganization: true
            });
          }
        });
      }
    }, this);
  },

  getRepoOwners: function(organizationData, repos) {
    return new RSVP.Promise(function(resolve, reject) {
      this.state.ref.child("orgs").child(organizationData.id).on("value", function(snapshot) {
        snapshot.forEach(function(repoSnapshot) {
          var repoName = repoSnapshot.key().toLowerCase();
          var repoData = repoSnapshot.val();
          var primaryOwnerName = repoData.owners.primary;
          var secondaryOwnerName = repoData.owners.secondary;

          repos[repoName].seerOwners = {
            primary: this.state.members[primaryOwnerName],
            secondary: this.state.members[secondaryOwnerName]
          };
        }.bind(this));

        this.setState({
          repos: repos,
          reposLoaded: true
        });
      }, function(error) {
        console.log("Error retrieving repo owners from Firebase:", error);
      }, this);
    }.bind(this));
  },

  addOrUpdateUserDataInFirebase: function(authData, callback) {
    return new RSVP.Promise(function(resolve, reject) {
      var userRef = this.state.ref.child("users").child(authData.uid);
      this.getOrganizationsUserBelongsTo(authData.github.username).then(function(loggedInUsersOrganizations) {
        userRef.set({
          github: authData.github,
          orgs: loggedInUsersOrganizations
        }, function(error) {
          if (error) {
            console.log("Error adding " + authData.uid + " to the users node:", error);
          }

          return resolve(loggedInUsersOrganizations);
        });
      });
    }.bind(this));
  },

  getOrganizationsUserBelongsTo: function(username, callback) {
    return new RSVP.Promise(function(resolve, reject) {
      $.getJSON("https://api.github.com/users/" + username + "/orgs", {
        access_token: this.props.gitHubPublicAccessToken
      }, function(organizations) {
        var filteredOrganizations = {};
        organizations.forEach(function(organization) {
          filteredOrganizations[organization.id] = organization.login;
        });

        return resolve(filteredOrganizations);
      });
    }.bind(this));
  },

  getOrganizationPublicMetadata: function(organizationUsername) {
    return new RSVP.Promise(function(resolve, reject) {
      $.getJSON("https://api.github.com/orgs/" + organizationUsername, {
        access_token: this.props.gitHubPublicAccessToken
      }, function(organization) {
        var organizationData = {
          id: organization.id,
          name: organization.name,
          username: organizationUsername,
          html_url: organization.html_url,
          avatar_url: organization.avatar_url
        };

        this.setState({
          organization: organizationData
        });

        return resolve(organizationData);
      }.bind(this));
    }.bind(this));
  },

  getOrganizationPublicRepos: function(organizationData) {
    return new RSVP.Promise(function(resolve, reject) {
      $.getJSON("https://api.github.com/orgs/" + organizationData.username + "/repos", {
        access_token: this.props.gitHubPublicAccessToken,
        per_page: 100
      }, function(repos) {
        // TODO: add pagination (https://developer.github.com/guides/traversing-with-pagination/)
        if (repos.length === 100) {
          alert("GitHub only returns 100 repos per page and this organization has over 100 repos so some will be missing. Pagination must be implemented.");
        }

        // Convert the list into a dictionary, keyed by repo ID
        var filteredRepos = {};
        repos.forEach(function(repo) {
          repo.ref = this.state.ref.child("orgs").child(organizationData.id).child(repo.id);
          repo.seerOwners = {
            primary: "",
            seconday: ""
          };
          filteredRepos[repo.id] = repo;
        }.bind(this));

        return resolve(filteredRepos);
      }.bind(this));
    }.bind(this));
  },

  getOrganizationPublicMembers: function(organizationData) {
    return new RSVP.Promise(function(resolve, reject) {
      $.getJSON("https://api.github.com/orgs/" + organizationData.username + "/members", {
        access_token: this.props.gitHubPublicAccessToken,
        per_page: 100
      }, function(members) {
        // TODO: add pagination (https://developer.github.com/guides/traversing-with-pagination/)
        if (members.length === 100) {
          alert("GitHub only returns 100 members per page and this organization has over 100 members so some will be missing. Pagination must be implemented.");
        }

        var filteredMembers = {};
        members.forEach(function(member) {
          filteredMembers[member.login] = {
            name: member.login,  // TODO: use name instead of username
            username: member.login,
            url: member.url,
            html_url: member.html_url,
            avatar_url: member.avatar_url
          };
        });

        this.setState({
          members: filteredMembers
        }, function() {
          return resolve(filteredMembers);
        });
      }.bind(this));
    }.bind(this));
  },

  getSortedRepoIds: function() {
    var repoIds = Object.keys(this.state.repos);
    repoIds.sort(function(a, b) {
      if (this.state.repos[a].name.toLowerCase() > this.state.repos[b].name.toLowerCase()) {
        return 1;
      } else {
        return -1;
      }
    }.bind(this));
    return repoIds;
  },

  toggleAuthState: function() {
    if (this.state.isLoggedIn) {
      this.state.ref.unauth();
    } else {
      this.state.ref.authWithOAuthPopup("github", function(error, authData) {
        if (error) {
          console.log("Error login in with GitHub:", error);
        }
      });
    }
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

  toggleRepoLayout: function() {
    this.setState({
      repoLayout: (this.state.repoLayout === "card") ? "table" : "card"
    });
  },

  render: function() {
    // Create the JSX for each repo
    var sortedRepoIds = this.getSortedRepoIds();
    var repos = sortedRepoIds.map(function(repoId) {
      var repo = this.state.repos[repoId];
      var isAdmin = this.state.isLoggedIn && this.state.belongsToOrganization;
      return <Repo
                key={ repo.id }
                repo={ repo }
                isAdmin={ isAdmin }
                filters={ this.state.filters }
                members={ this.state.members }
                repoLayout= { this.state.repoLayout }
                gitHubPublicAccessToken={ this.props.gitHubPublicAccessToken } />;
    }.bind(this));

    // Display a loading message if we haven't retrieved any repos yet
    if (repos.length === 0) {
      if (this.state.reposLoaded) {
        repos = <p id="mainReposMessage">No repos match the chosen filters.</p>;
      } else {
        repos = <p id="mainReposMessage">Loading issues for { this.state.organization.name } repos...</p>;
      }
    }

    // Login / logout button text
    var loginLogoutButtonText = this.state.isLoggedIn ? "Logout" : "Login with GitHub";

    return (
      <div>
        <a id="loginLogoutButton" className="btn-auth btn-github large" href="#" onClick={ this.toggleAuthState }>
          { loginLogoutButtonText }
        </a>

        <p id="title">{ this.state.organization.name } Seer</p>

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

        <div id="repoLayoutCheckbox">
          <input type="checkbox" name="repoLayoutIsTable" onChange={ this.toggleRepoLayout } /> Table View
        </div>

        <div>
          { repos }
        </div>
      </div>
    );
  }
});

React.render(
  <ReposContainer
    firebase="seer"
    organizationUsername="firebase"
    gitHubPublicAccessToken="d838d4f13e7d8fd3b0446f7b1dac1e330b7b8d3d" />, document.getElementById("reposContainer")
);
