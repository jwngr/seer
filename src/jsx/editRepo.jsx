/** @jsx React.DOM */
var EditRepo = React.createClass({
  getInitialState: function() {
    return {
      owners: {
        primary: this.props.primaryOwner.username,
        secondary: this.props.secondaryOwner.username
      },
      inputValidation: {
        primary: true,
        secondary: true
      }
    };
  },

  getClassNames: function() {
    return this.props.classes + " edit";
  },

  updateOwner: function(event, role) {
    var _this = this;

    var otherRole = (role === "primary") ? "secondary" : "primary";
    var otherRoleUsername = this.state.owners[otherRole];

    var username = event.target.value;

    var newOwners = this.state.owners;
    newOwners[role] = username;
    this.setState({
      owners: newOwners
    });

    if (username === "" && otherRoleUsername && role === "primary") {
      // Prevent the primary username from being removed if the secondary exists
      this.setInputAsInvalid(role);
    } else if (username === "" && !otherRoleUsername) {
      // Delete the entire node if both inputs are empty
      this.props.repo.ref.remove(function(error) {
        if (error) {
          console.log("Error deleting data for the " + this.props.repo.name + " repo:", error);
        }

        _this.setInputAsValid(role);
        _this.setInputAsValid(otherRole);

        _this.props.updateOwners();
      });
    } else if (username === otherRoleUsername) {
      // Prevent the usernames from matching
      this.setInputAsInvalid(role);
    } else if (username === "" || this.props.members[username]) {
      // Only update the owner if the username is empty or a part of the organization
      this.props.repo.ref.child("owners").set(newOwners, function(error) {
        if (error) {
          console.log("Error updating " + role + " owner for the " + this.props.repo.name + " repo:", error);
        }

        _this.setInputAsValid(role);
        _this.setInputAsValid(otherRole);

        _this.props.updateOwners();
      });
    } else {
      this.setInputAsInvalid(role);
    }
  },

  setInputAsValid: function(role) {
    var newInputValidation = this.state.inputValidation;
    newInputValidation[role] = true;
    this.setState({
      inputValidation: newInputValidation
    });
  },

  setInputAsInvalid: function(role) {
    var newInputValidation = this.state.inputValidation;
    newInputValidation[role] = false;
    this.setState({
      inputValidation: newInputValidation
    });
  },

  updatePrimaryOwner: function(event) {
    this.updateOwner(event, "primary");
  },

  updateSecondaryOwner: function(event) {
    this.updateOwner(event, "secondary");
  },

  getInputClasses: function(role) {
    var classes = "ownerInput";
    if (!this.state.inputValidation[role]) {
      classes += " invalid";
    }
    return classes;
  },

  render: function() {
    var membersDatalistOptions = Object.keys(this.props.members).map(function(member, index) {
      return <option value={ member } key={ index }></option>;
    });

    var primaryOwner =
      <div className="ownerContainer">
        <label>Primary Owner:</label>
        <input className={ this.getInputClasses("primary") } type="text" value={ this.state.owners.primary } list="members" onChange={ this.updatePrimaryOwner } />
      </div>;

    var secondaryOwner;
    if (this.props.primaryOwner.username) {
      secondaryOwner=
        <div className="ownerContainer">
          <label>Secondary Owner:</label>
          <input className={ this.getInputClasses("secondary") } type="text" value={ this.state.owners.secondary } list="members" onChange={ this.updateSecondaryOwner } />
        </div>;
    }

    return(
      <div className={ this.getClassNames() }>
        <div className="clearfix">
          <p className="repoName"><a href={ this.props.repo.html_url }>{ this.props.repo.name }</a></p>
          { this.props.repoOwners }
        </div>

        <datalist id="members">
          { membersDatalistOptions }
        </datalist>

        { primaryOwner }

        { secondaryOwner }

        <button className="doneButton" onClick={ this.props.toggleEditMode }>Done</button>
      </div>
    );
  }
});
