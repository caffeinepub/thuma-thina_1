import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

module {
  // Old version of the UserProfile type without businessAreaId
  type OldUserProfile = {
    principal : Principal;
    displayName : Text;
    phone : Text;
    role : {
      #admin;
      #customer;
      #shopper;
      #driver;
      #operator;
    };
    registeredAt : Int;
    registrationStatus : {
      #pending;
      #active;
      #rejected;
      #updateNeeded;
    };
  };

  // Old actor type
  type OldActor = {
    users : Map.Map<Principal, OldUserProfile>;
  };

  // New UserProfile type with businessAreaId
  type NewUserProfile = {
    principal : Principal;
    displayName : Text;
    phone : Text;
    role : {
      #admin;
      #customer;
      #shopper;
      #driver;
      #operator;
    };
    businessAreaId : ?Text;
    registeredAt : Int;
    registrationStatus : {
      #pending;
      #active;
      #rejected;
      #updateNeeded;
    };
  };

  // New actor type
  type NewActor = {
    users : Map.Map<Principal, NewUserProfile>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newUsers = old.users.map<Principal, OldUserProfile, NewUserProfile>(
      func(_p, oldProfile) {
        { oldProfile with businessAreaId = null };
      }
    );
    { users = newUsers };
  };
};
