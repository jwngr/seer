/** @jsx React.DOM */
var Repo = React.createClass({
  getInitialState: function() {
    return {
      issues: [],
      pullRequests: [],
      freshnessLevels: [ "fresh", "browning", "moldy", "stale", "rotten", "putrid", "dead" ],
      freshnessLevel: -1,
      freshnessScore: -1
    };
  },

  componentWillMount: function() {
    var _this = this;
    if (this.props.repo.has_issues) {
      $.getJSON(this.props.repo.issues_url.split("{")[0], {
        access_token: this.props.gitHubPublicAccessToken
      }, function(issuesAndPullRequests) {
        // Ignore pull requests
        var issues = issuesAndPullRequests.filter(function(issue) {
          return (typeof issue.pull_request === "undefined");
        });

        var pullRequests = issuesAndPullRequests.filter(function(issue) {
          return (typeof issue.pull_request !== "undefined");
        });

        _this.setState({
          issues: issues,
          pullRequests: pullRequests,
          freshnessLevel: _this.getFreshnessLevel(issues, pullRequests)
        });
      });
    } else {
      _this.setState({
        classes: "repo issuesDisabled"
      });
    }
  },

  passesFilters: function() {
    var repo = this.props.repo;

    // Freshness filter
    var passesFreshnessFilter;
    if (repo.has_issues) {
      var repoFreshnessIndex = this.state.freshnessLevel - 1;
      var filterFreshnessIndex = this.state.freshnessLevels.indexOf(this.props.filters.freshness);
      passesFreshnessFilter = (repoFreshnessIndex >= filterFreshnessIndex);
    } else {
      passesFreshnessFilter = true;
    }

    // Issues filter
    var passesIssuesFilter = false;
    if (this.props.filters.issues === "all") {
      passesIssuesFilter = true;
    } else if (repo.has_issues) {
      if (this.state.issues.length === 0) {
        passesIssuesFilter = (this.props.filters.issues === "none");
      } else {
        passesIssuesFilter = (this.props.filters.issues === "some");
      }
    } else {
      passesIssuesFilter = (this.props.filters.issues === "disabled");
    }

    // Pull requests filter
    var passesPullRequestsFilter = false;
    if (this.props.filters.pullRequests === "all") {
      passesPullRequestsFilter = true;
    } else if (this.state.pullRequests.length === 0) {
      passesPullRequestsFilter = (this.props.filters.pullRequests === "none");
    } else {
      passesPullRequestsFilter = (this.props.filters.pullRequests === "some");
    }

    return (passesFreshnessFilter && passesIssuesFilter && passesPullRequestsFilter);
  },

  getOwners: function() {
    this.props.repo.ref.once("value", function(snapshot) {
      var repoData = snapshot.val();
      if (repoData && repoData.owners) {
        var primaryOwnerName = repoData.owners.primary;
        var secondaryOwnerName = repoData.owners.secondary;
        this.setState({
          owners: {
            primary: this.props.members[primaryOwnerName],
            secondary: this.props.members[secondaryOwnerName]
          }
        });
      } else {
        this.setState({
          owners: undefined
        });
      }
    }, function(error) {
      console.log("Error retrieving repo owners from Firebase:", error);
    }, this);
  },

  getFreshnessLevel: function(issues, pullRequests) {
    // Get the average number of days since the issues and pull requests were last updated
    var averageDaysSinceIssuesUpdated = this.getAverageDaysSinceUpdated(issues);
    var averageDaysSincePullRequestsUpdated = this.getAverageDaysSinceUpdated(pullRequests);

    this.setState( {
      freshnessScore: averageDaysSinceIssuesUpdated
    });

    // Get the freshness
    var freshnessLevel;
    if (averageDaysSinceIssuesUpdated <= 3) {
      freshnessLevel = 1;
    } else if (averageDaysSinceIssuesUpdated <= 7) {
      freshnessLevel = 2;
    } else if (averageDaysSinceIssuesUpdated <= 14) {
      freshnessLevel = 3;
    } else if (averageDaysSinceIssuesUpdated <= 21) {
      freshnessLevel = 4;
    } else if (averageDaysSinceIssuesUpdated <= 30) {
      freshnessLevel = 5;
    } else if (averageDaysSinceIssuesUpdated <= 90) {
      freshnessLevel = 6;
    } else {
      freshnessLevel = 7;
    }

    return freshnessLevel;
  },

  getAverageDaysSinceUpdated: function(items) {
    // Get the current timestamp
    var now = Date.now();
    var msPerDay = 86400000;

    // Get the number of items
    var numItems = items.length;

    var totalDaysSinceUpdated = 0;
    items.map(function(item) {
      var msSinceUpdated = (now - new Date(item.updated_at).getTime());
      totalDaysSinceUpdated += (msSinceUpdated / msPerDay);

      // If the item has never been updated, give it a penalty
      if (item.updated_at === item.created_at) {
        totalDaysSinceUpdated += 2;
      }
    });

    return (numItems ? (totalDaysSinceUpdated / numItems) : 0);
  },

  getRepoClasses: function() {
    var classes = "repo ";
    if (this.props.repo.has_issues) {
      classes += "freshnessLevel" + this.state.freshnessLevel;
    } else {
      classes += " issuesDisabled";
    }

    if (this.props.tableView) {
      classes += " tableView";
    }
    return classes;
  },

  toggleEditMode: function() {
    this.setState({
      editing: !this.state.editing
    });
  },

  render: function() {
    if (this.props.members && !this.state.owners) {
      this.getOwners();
    }

    var repo = this.props.repo;

    var primaryOwner, secondaryOwner, repoOwners;
    if (this.props.members && this.state.owners) {
      primaryOwner = this.state.owners.primary;
      secondaryOwner = this.state.owners.secondary;
      if (secondaryOwner) {
        repoOwners =
          <div className="repoOwners">
            <a href={ primaryOwner.html_url }>
              <img className="primary" src={ primaryOwner.avatar_url } alt={ primaryOwner.name } title={ primaryOwner.name } />
            </a>
            <a href={ secondaryOwner.html_url }>
              <img className="secondary" src={ secondaryOwner.avatar_url } alt={ secondaryOwner.name } title={ secondaryOwner.name } />
            </a>
          </div>;
      } else {
        repoOwners =
          <div className="repoOwners">
            <a href={ primaryOwner.html_url }>
              <img className="primary" src={ primaryOwner.avatar_url } alt={ primaryOwner.name } title={ primaryOwner.name } />
            </a>
          </div>;
      }
    }

    var editButton;
    if (this.props.members) {
      editButton = <button className="editButton" onClick={ this.toggleEditMode }>Edit</button>;
    }

    if (this.passesFilters()) {
      if (this.state.editing) {
        primaryOwner = primaryOwner || { username: '' };
        secondaryOwner = secondaryOwner || { username: '' };
        return (
          <EditRepo classes={ this.getRepoClasses() } repo={ repo } repoOwners={ repoOwners } primaryOwner={ primaryOwner} secondaryOwner={ secondaryOwner } members={ this.props.members } toggleEditMode={ this.toggleEditMode } updateOwners={ this.getOwners } />
        );
      } else if (this.props.tableView) {
        var averageDaysSinceIssuesUpdated = Math.round(this.getAverageDaysSinceUpdated(this.state.issues));
        var averageDaysSincePullRequestsUpdated = Math.round(this.getAverageDaysSinceUpdated(this.state.pullRequests));

        var dayOrDays;
        var issuesAverageAgeString = "";
        if (averageDaysSinceIssuesUpdated) {
          dayOrDays = (averageDaysSinceIssuesUpdated === 1) ? "day" : "days";
          issuesAverageAgeString = "(" + averageDaysSinceIssuesUpdated + " " + dayOrDays + " average)";
        }

        var pullRequestsAverageAgeString = "";
        if (averageDaysSincePullRequestsUpdated) {
          dayOrDays = (averageDaysSincePullRequestsUpdated === 1) ? "day" : "days";
          pullRequestsAverageAgeString = "(" + averageDaysSincePullRequestsUpdated + " " + dayOrDays + " average)";
        }

        return (
          <div className={ this.getRepoClasses() }>
            <div>
              <p className="repoName"><a href={ this.props.repo.html_url }>{ this.props.repo.name }</a></p>
              { repoOwners }
            </div>
            <p className="numIssues">{ this.state.issues.length } Issues { issuesAverageAgeString }</p>
            <p className="numPullRequests">{ this.state.pullRequests.length } PRs { pullRequestsAverageAgeString }</p>
            { editButton }
          </div>
        );
      } else {
        // Create the JSX for each issue and pull request
        var issues = this.state.issues.map(function(issue, index) {
          return <Issue issue={ issue } key={ issue.id } />;
        });
        var pullRequests = this.state.pullRequests.map(function(pullRequest, index) {
          return <Issue issue={ pullRequest } key={ pullRequest.id } />;
        });

        if (!repo.has_issues) {
          issues = <div className="issues"><p>This repo has issues disabled.</p></div>;
        } else if (issues.length === 0) {
          issues = <div className="issues"><p>This repo has no open issues!</p></div>;
        } else {
          issues = (
            <div className="issues">
              <p>Issues</p>
              <ol className="issues">
                { issues }
              </ol>
            </div>
          );
        }

        if (pullRequests.length === 0) {
          pullRequests = <div className="pullRequests"><p>This repo has no open pull requests!</p></div>;
        } else {
          pullRequests = (
            <div className = "pullRequests">
              <p>Pull Requests</p>
              <ol>
                { pullRequests }
              </ol>
            </div>
          );
        }

        return (
          <div className={ this.getRepoClasses() }>
            <div className="clearfix">
              <p className="repoName"><a href={ this.props.repo.html_url }>{ this.props.repo.name }</a></p>
              { repoOwners }
            </div>
            { issues }
            { pullRequests }
            { editButton }
          </div>
        );
      }
    } else {
      return(<div></div>);
    }
  }
});
