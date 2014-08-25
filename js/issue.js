/** @jsx React.DOM */
var Issue = React.createClass({
  getInitialState: function() {
    return {};
  },

  componentWillMount: function() {
    var issue = this.props.issue;

    // Use moment to get a text-based timestamp
    var timeSinceCreated = moment(issue.created_at).fromNow();
    var timeSinceUpdated = moment(issue.updated_at).fromNow();

    // Determine what the timestamp text should say
    var timestamp = "created " + timeSinceCreated + "; ";
    if (issue.created_at === issue.updated_at) {
      timestamp += "never updated";
    } else {
      timestamp += "updated " + timeSinceUpdated;
    }

    this.setState({
      timestamp: timestamp
    });
  },

  render: function() {
    var issue = this.props.issue;

    return (
      <li className="issue">
        <a href={ issue.html_url }>{ issue.title }</a> ({ this.state.timestamp })
      </li>
    );
  }
});