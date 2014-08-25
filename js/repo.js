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
        access_token: "d838d4f13e7d8fd3b0446f7b1dac1e330b7b8d3d"
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

  getRepoClasses: function(issues) {
    var classes = "repo ";
    if (this.props.repo.has_issues) {
      classes += "freshnessLevel" + this.state.freshnessLevel;
    } else {
      classes += " issuesDisabled";
    }
    return classes;
  },

  render: function() {
    var repo = this.props.repo;

    if (this.passesFilters()) {
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
      };

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
          <p className="repoName"><a href={ this.props.repo.html_url }>{ this.props.repo.name }</a></p>
          { issues }
          { pullRequests }
        </div>
      );
    } else {
      return(<div></div>);
    }
  }
});