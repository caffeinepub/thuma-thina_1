import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";
import UserApproval "user-approval/approval";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";
(with migration = Migration.run)
actor {
  include MixinStorage();

  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  public type AppUserRole = {
    #admin;
    #customer;
    #shopper;
    #driver;
    #operator;
  };

  type UserProfile = {
    principal : Principal;
    displayName : Text;
    phone : Text;
    role : AppUserRole;
    businessAreaId : ?Text;
    registeredAt : Int;
    registrationStatus : {
      #pending;
      #active;
      #rejected;
      #updateNeeded;
    };
  };

  let users = Map.empty<Principal, UserProfile>();

  func requireRegisteredCaller(caller : Principal) : UserProfile {
    switch (users.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: You are not registered") };
      case (?user) { user };
    };
  };

  func isAnonymous(p : Principal) : Bool {
    p.isAnonymous();
  };

  func hasAnyAdminInternal() : Bool {
    if (users.isEmpty()) {
      return false;
    };
    let iter = users.values();
    iter.any(
      func(profile) {
        profile.role == #admin;
      }
    );
  };

  func isCallerApprovedInternal(caller : Principal) : Bool {
    Authorization.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  func isShopperAssignedToRetailer(shopperPrincipal : Principal, retailerId : Text) : Bool {
    switch (shopperAssignments.get(shopperPrincipal)) {
      case (null) { false };
      case (?assignments) {
        assignments.any(func(id) { id == retailerId });
      };
    };
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    Authorization.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);

    switch (status) {
      case (#approved) {
        switch (users.get(user)) {
          case (null) { Runtime.trap("User not found to promote") };
          case (?profile) {
            let updatedProfile : UserProfile = {
              profile with registrationStatus = #active;
            };
            users.add(user, updatedProfile);
          };
        };
      };
      case (#rejected) {
        switch (users.get(user)) {
          case (null) { Runtime.trap("User not found") };
          case (?profile) {
            let updatedProfile : UserProfile = {
              profile with registrationStatus = #rejected;
            };
            users.add(user, updatedProfile);
          };
        };
      };
      case (#pending) {
        switch (users.get(user)) {
          case (null) { Runtime.trap("User not found") };
          case (?profile) {
            let updatedProfile : UserProfile = {
              profile with registrationStatus = #pending;
            };
            users.add(user, updatedProfile);
          };
        };
      };
    };
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(displayName : Text, phone : Text, businessAreaId : ?Text) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("Unauthorized: You must register first");
      };
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with
          displayName = displayName;
          phone = phone;
          businessAreaId = businessAreaId;
        };
        users.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getUserCount() : async Nat {
    users.size();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    users.values().toArray();
  };

  public query ({ caller }) func hasAnyAdmin() : async Bool {
    hasAnyAdminInternal();
  };

  public query ({ caller }) func getStaffBusinessArea(staffPrincipal : Principal) : async ?Text {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access business area info");
    };
    // Authorization: only the staff member themselves or an admin can access
    if (caller != staffPrincipal and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own business area or must be admin");
    };
    switch (users.get(staffPrincipal)) {
      case (null) { Runtime.trap("Profile not found for this principal") };
      case (?profile) {
        profile.businessAreaId;
      };
    };
  };

  public shared ({ caller }) func registerUser(
    role : AppUserRole,
    displayName : Text,
    phone : Text,
    businessAreaId : ?Text,
  ) : async () {
    // Prevent anonymous registration
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };

    // Prevent duplicate registration
    switch (users.get(caller)) {
      case (?_existingProfile) {
        Runtime.trap("You are already registered!");
      };
      case (null) {};
    };

    // Check if this is the first user (master admin logic)
    let isFirstUser = not hasAnyAdminInternal();

    if (isFirstUser) {
      // First user becomes admin regardless of requested role
      let adminProfile : UserProfile = {
        principal = caller;
        displayName;
        phone;
        role = #admin;
        businessAreaId = null;
        registeredAt = Int.abs(0);
        registrationStatus = #active;
      };
      users.add(caller, adminProfile);

      // Directly set admin role in access control state (no guard check for first user)
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return ();
    };

    // Subsequent users: handle based on requested role
    switch (role) {
      case (#admin) {
        // Non-first users cannot self-assign admin role
        Runtime.trap("Unauthorized: Cannot self-assign admin role");
      };
      case (#customer) {
        let customerProfile : UserProfile = {
          principal = caller;
          displayName;
          phone;
          role = #customer;
          businessAreaId = null;
          registeredAt = Int.abs(0);
          registrationStatus = #active;
        };
        users.add(caller, customerProfile);

        // Directly set user role in access control state (no guard check for customers)
        accessControlState.userRoles.add(caller, #user);
      };
      case (#shopper) {
        let shopperProfile : UserProfile = {
          principal = caller;
          displayName;
          phone;
          role = #shopper;
          businessAreaId;
          registeredAt = Int.abs(0);
          registrationStatus = #pending;
        };
        users.add(caller, shopperProfile);
        await requestApproval();
      };
      case (#driver) {
        let driverProfile : UserProfile = {
          principal = caller;
          displayName;
          phone;
          role = #driver;
          businessAreaId;
          registeredAt = Int.abs(0);
          registrationStatus = #pending;
        };
        users.add(caller, driverProfile);
        await requestApproval();
      };
      case (#operator) {
        let operatorProfile : UserProfile = {
          principal = caller;
          displayName;
          phone;
          role = #operator;
          businessAreaId;
          registeredAt = Int.abs(0);
          registrationStatus = #pending;
        };
        users.add(caller, operatorProfile);
        await requestApproval();
      };
    };
  };

  /***********************************************************
   * Persistent Entity Types and State
  ************************************************************/
  type Town = {
    id : Text;
    name : Text;
    province : Text;
  };

  type BusinessArea = {
    id : Text;
    name : Text;
    townId : Text;
    areaType : Text;
  };

  type PickupPoint = {
    id : Text;
    name : Text;
    townId : Text;
    address : Text;
    profileImageUrl : ?Text;
  };

  type Retailer = {
    id : Text;
    name : Text;
    townId : Text;
    businessAreaId : Text;
    address : Text;
    operatingHoursJson : ?Text;
  };

  type Product = {
    id : Text;
    name : Text;
    description : Text;
    category : Text;
    imageEmoji : Text;
    imagesJson : ?Text;
    inStock : Bool;
    isSuggestion : Bool;
    suggestedBy : ?Text;
    approved : Bool;
  };

  type ProductListing = {
    id : Text;
    productId : Text;
    retailerId : Text;
    price : Float;
    outOfStock : Bool;
  };

  type RetailerProduct = {
    id : Text;
    retailerId : Text;
    name : Text;
    description : Text;
    category : Text;
    price : Float;
    imageEmoji : Text;
    imagesJson : ?Text;
    inStock : Bool;
  };

  type ShopperRetailerAssignments = {
    // key is shopper principal, value is array of retailer IDs
    assignments : Map.Map<Principal, [Text]>;
  };

  let towns = Map.empty<Text, Town>();
  let businessAreas = Map.empty<Text, BusinessArea>();
  let pickupPoints = Map.empty<Text, PickupPoint>();
  let retailers = Map.empty<Text, Retailer>();
  let products = Map.empty<Text, Product>();
  let productListings = Map.empty<Text, ProductListing>();
  let retailerProducts = Map.empty<Text, RetailerProduct>();
  let shopperAssignments = Map.empty<Principal, [Text]>();

  /***********************************************************
   * Persistence API Endpoints
  ************************************************************/
  // Towns
  public shared ({ caller }) func addTown(id : Text, name : Text, province : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let town : Town = { id; name; province };
    towns.add(id, town);
  };

  public shared ({ caller }) func deleteTown(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    towns.remove(id);
  };

  public query ({ caller }) func getTowns() : async [Town] {
    towns.values().toArray();
  };

  // BusinessAreas
  public shared ({ caller }) func addBusinessArea(id : Text, name : Text, townId : Text, areaType : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let businessArea : BusinessArea = { id; name; townId; areaType };
    businessAreas.add(id, businessArea);
  };

  public shared ({ caller }) func deleteBusinessArea(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    businessAreas.remove(id);
  };

  public query ({ caller }) func getBusinessAreas() : async [BusinessArea] {
    businessAreas.values().toArray();
  };

  // PickupPoints
  public shared ({ caller }) func addPickupPoint(id : Text, name : Text, townId : Text, address : Text, profileImageUrl : ?Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let pickupPoint : PickupPoint = {
      id;
      name;
      townId;
      address;
      profileImageUrl;
    };
    pickupPoints.add(id, pickupPoint);
  };

  public shared ({ caller }) func deletePickupPoint(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    pickupPoints.remove(id);
  };

  public query ({ caller }) func getPickupPoints() : async [PickupPoint] {
    pickupPoints.values().toArray();
  };

  // Retailers
  public shared ({ caller }) func addRetailer(id : Text, name : Text, townId : Text, businessAreaId : Text, address : Text, operatingHoursJson : ?Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let retailer : Retailer = {
      id;
      name;
      townId;
      businessAreaId;
      address;
      operatingHoursJson;
    };
    retailers.add(id, retailer);
  };

  public shared ({ caller }) func updateRetailerHours(id : Text, operatingHoursJson : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (retailers.get(id)) {
      case (null) { Runtime.trap("Retailer not found") };
      case (?retailer) {
        let updatedRetailer = { retailer with operatingHoursJson = ?operatingHoursJson };
        retailers.add(id, updatedRetailer);
      };
    };
  };

  public shared ({ caller }) func deleteRetailer(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    retailers.remove(id);
  };

  public query ({ caller }) func getRetailers() : async [Retailer] {
    retailers.values().toArray();
  };

  // Products
  public shared ({ caller }) func addProduct(id : Text, name : Text, description : Text, category : Text, imageEmoji : Text, imagesJson : ?Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let product : Product = {
      id;
      name;
      description;
      category;
      imageEmoji;
      imagesJson;
      inStock = true;
      isSuggestion = false;
      suggestedBy = null;
      approved = true;
    };
    products.add(id, product);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(id);
  };

  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray();
  };

  public shared ({ caller }) func suggestProduct(id : Text, name : Text, description : Text, category : Text, imageEmoji : Text, suggestedBy : Text) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot suggest products");
    };
    let product : Product = {
      id;
      name;
      description;
      category;
      imageEmoji;
      imagesJson = null;
      inStock = true;
      isSuggestion = true;
      suggestedBy = ?suggestedBy;
      approved = false;
    };
    products.add(id, product);
  };

  public shared ({ caller }) func approveSuggestion(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updatedProduct = {
          product with
          approved = true;
          isSuggestion = false;
        };
        products.add(id, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func rejectSuggestion(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(id);
  };

  // ProductListings
  public shared ({ caller }) func addListing(id : Text, productId : Text, retailerId : Text, price : Float) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let listing : ProductListing = {
      id;
      productId;
      retailerId;
      price;
      outOfStock = false;
    };
    productListings.add(id, listing);
  };

  public shared ({ caller }) func deleteListing(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    productListings.remove(id);
  };

  public shared ({ caller }) func setListingStock(id : Text, outOfStock : Bool) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot update listings");
    };
    
    // Get the listing to check retailer
    let listing = switch (productListings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?l) { l };
    };
    
    // Check authorization: admin OR (approved shopper assigned to this retailer)
    let isAdmin = Authorization.hasPermission(accessControlState, caller, #admin);
    let isApprovedShopper = isCallerApprovedInternal(caller) and isShopperAssignedToRetailer(caller, listing.retailerId);
    
    if (not isAdmin and not isApprovedShopper) {
      Runtime.trap("Unauthorized: Only admins or approved shoppers assigned to this retailer can update listings");
    };
    
    let updatedListing = { listing with outOfStock };
    productListings.add(id, updatedListing);
  };

  public query ({ caller }) func getListings() : async [ProductListing] {
    productListings.values().toArray();
  };

  // RetailerProducts
  public shared ({ caller }) func addRetailerProduct(id : Text, retailerId : Text, name : Text, description : Text, category : Text, price : Float, imageEmoji : Text, imagesJson : ?Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let product : RetailerProduct = {
      id;
      retailerId;
      name;
      description;
      category;
      price;
      imageEmoji;
      imagesJson;
      inStock = true;
    };
    retailerProducts.add(id, product);
  };

  public shared ({ caller }) func deleteRetailerProduct(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    retailerProducts.remove(id);
  };

  public shared ({ caller }) func setRetailerProductStock(id : Text, inStock : Bool) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot update products");
    };
    
    // Get the product to check retailer
    let product = switch (retailerProducts.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
    
    // Check authorization: admin OR (approved shopper assigned to this retailer)
    let isAdmin = Authorization.hasPermission(accessControlState, caller, #admin);
    let isApprovedShopper = isCallerApprovedInternal(caller) and isShopperAssignedToRetailer(caller, product.retailerId);
    
    if (not isAdmin and not isApprovedShopper) {
      Runtime.trap("Unauthorized: Only admins or approved shoppers assigned to this retailer can update products");
    };
    
    let updatedProduct = { product with inStock };
    retailerProducts.add(id, updatedProduct);
  };

  public query ({ caller }) func getRetailerProducts() : async [RetailerProduct] {
    retailerProducts.values().toArray();
  };

  // ShopperRetailerAssignments
  public shared ({ caller }) func assignShopperToRetailer(shopperPrincipal : Principal, retailerId : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let existingAssignments = switch (shopperAssignments.get(shopperPrincipal)) {
      case (?assignments) { assignments };
      case (null) { [] };
    };
    let updatedAssignments = existingAssignments.concat([retailerId]);
    shopperAssignments.add(shopperPrincipal, updatedAssignments);
  };

  public shared ({ caller }) func unassignShopperFromRetailer(shopperPrincipal : Principal, retailerId : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let existingAssignments = switch (shopperAssignments.get(shopperPrincipal)) {
      case (?assignments) { assignments };
      case (null) { [] };
    };
    let updatedAssignments = existingAssignments.filter(
      func(id) {
        id != retailerId;
      }
    );
    shopperAssignments.add(shopperPrincipal, updatedAssignments);
  };

  public query ({ caller }) func getShopperRetailerIds(shopperPrincipal : Principal) : async [Text] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access assignments");
    };
    if (
      caller != shopperPrincipal and
      not Authorization.hasPermission(accessControlState, caller, #admin)
    ) {
      Runtime.trap("Unauthorized: Can only view your own assignments");
    };
    switch (shopperAssignments.get(shopperPrincipal)) {
      case (?assignments) { assignments };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getAllShopperAssignments() : async [(Principal, [Text])] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let iter = shopperAssignments.entries();
    iter.toArray();
  };
};
