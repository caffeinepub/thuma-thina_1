import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:base/Time";
import Nat "mo:core/Nat";
import MixinStorage "blob-storage/Mixin";
import UserApproval "user-approval/approval";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



persistent actor {
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
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };

    switch (users.get(caller)) {
      case (?existingProfile) {
        if (existingProfile.role == #customer and (role == #shopper or role == #driver or role == #operator)) {
          let updatedProfile : UserProfile = {
            existingProfile with
            role = role;
            displayName = displayName;
            phone = phone;
            businessAreaId = businessAreaId;
            registrationStatus = #pending;
          };
          users.add(caller, updatedProfile);
          UserApproval.requestApproval(approvalState, caller);
          return ();
        } else {
          Runtime.trap("You are already registered!");
        };
      };
      case (null) {};
    };

    let isFirstUser = not hasAnyAdminInternal();

    if (isFirstUser) {
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
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return ();
    };

    switch (role) {
      case (#admin) {
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
        UserApproval.requestApproval(approvalState, caller);
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
        UserApproval.requestApproval(approvalState, caller);
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
        UserApproval.requestApproval(approvalState, caller);
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

  // Base product type -- isSpecial/serviceFee live in separate maps for upgrade compatibility
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

  // Extended product returned by getProducts -- merges isSpecial/serviceFee from separate maps
  type ProductExtended = {
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
    isSpecial : Bool;
    serviceFee : Float;
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
    assignments : Map.Map<Principal, [Text]>;
  };

  type Order = {
    id : Text;
    customerId : Text;
    customerName : Text;
    customerPhone : Text;
    itemsJson : Text;
    total : Float;
    status : Text;
    deliveryType : Text;
    pickupPointId : Text;
    pickupPointName : Text;
    homeAddress : ?Text;
    townId : Text;
    businessAreaId : Text;
    deliveryAreasJson : ?Text;
    shopperId : ?Text;
    shopperName : ?Text;
    driverId : ?Text;
    driverName : ?Text;
    createdAt : Text;
    updatedAt : Text;
    isWalkIn : Bool;
    parentOrderId : ?Text;
    dedicatedRetailerId : ?Text;
  };

  type OrderExtended = {
    id : Text;
    customerId : Text;
    customerName : Text;
    customerPhone : Text;
    itemsJson : Text;
    total : Float;
    status : Text;
    deliveryType : Text;
    pickupPointId : Text;
    pickupPointName : Text;
    homeAddress : ?Text;
    townId : Text;
    businessAreaId : Text;
    deliveryAreasJson : ?Text;
    shopperId : ?Text;
    shopperName : ?Text;
    driverId : ?Text;
    driverName : ?Text;
    createdAt : Text;
    updatedAt : Text;
    isWalkIn : Bool;
    parentOrderId : ?Text;
    dedicatedRetailerId : ?Text;
    shopperProofImagesJson : ?Text;
  };

  type NomayiniTransaction = {
    id : Text;
    txType : Text;
    amount : Float;
    description : Text;
    date : Text;
    unlockDate : ?Text;
  };

  type NomayiniBalance = {
    totalEarned : Float;
    unlockedBalance : Float;
    lockedShortTerm : Float;
    lockedLongTerm : Float;
  };

  let towns = Map.empty<Text, Town>();
  let businessAreas = Map.empty<Text, BusinessArea>();
  let pickupPoints = Map.empty<Text, PickupPoint>();
  let retailers = Map.empty<Text, Retailer>();
  let products = Map.empty<Text, Product>();
  let productListings = Map.empty<Text, ProductListing>();
  let retailerProducts = Map.empty<Text, RetailerProduct>();
  let shopperAssignments = Map.empty<Principal, [Text]>();
  let orders = Map.empty<Text, Order>();
  let nomayiniBalances = Map.empty<Text, NomayiniBalance>();
  let nomayiniTransactions = Map.empty<Text, [NomayiniTransaction]>();
  let categoriesList = Map.empty<Text, Bool>();
  // Separate maps for special product fields -- kept separate to avoid Product type migrations
  let productIsSpecial = Map.empty<Text, Bool>();
  let productServiceFee = Map.empty<Text, Float>();
  let orderProofImages = Map.empty<Text, Text>();



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

  public shared ({ caller }) func updatePickupPoint(id : Text, name : Text, address : Text, profileImageUrl : ?Text) : async () {
    let callerProfile = requireRegisteredCaller(caller);
    if (callerProfile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (pickupPoints.get(id)) {
      case (null) { Runtime.trap("PickupPoint not found") };
      case (?pp) {
        let updated = { pp with name; address; profileImageUrl };
        pickupPoints.add(id, updated);
      };
    };
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
  public shared ({ caller }) func addProduct(id : Text, name : Text, description : Text, category : Text, imageEmoji : Text, imagesJson : ?Text, isSpecial : Bool, serviceFee : Float) : async () {
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
    // Store special fields in separate persistent maps
    productIsSpecial.add(id, isSpecial);
    productServiceFee.add(id, serviceFee);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(id);
    productIsSpecial.remove(id);
    productServiceFee.remove(id);
  };

  public shared ({ caller }) func updateProduct(id : Text, name : Text, description : Text, category : Text, imageEmoji : Text, imagesJson : ?Text, isSpecial : Bool, serviceFee : Float) : async () {
    let callerProfile = requireRegisteredCaller(caller);
    if (callerProfile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updated = { product with name; description; category; imageEmoji; imagesJson };
        products.add(id, updated);
        productIsSpecial.add(id, isSpecial);
        productServiceFee.add(id, serviceFee);
      };
    };
  };

  // getProducts merges isSpecial/serviceFee from separate persistent maps into ProductExtended
  public query ({ caller }) func getProducts() : async [ProductExtended] {
    products.values().toArray().map(func(p : Product) : ProductExtended {
      let isSpecial = switch (productIsSpecial.get(p.id)) { case (?v) v; case (null) false };
      let serviceFee = switch (productServiceFee.get(p.id)) { case (?v) v; case (null) 0.0 };
      {
        id = p.id;
        name = p.name;
        description = p.description;
        category = p.category;
        imageEmoji = p.imageEmoji;
        imagesJson = p.imagesJson;
        inStock = p.inStock;
        isSuggestion = p.isSuggestion;
        suggestedBy = p.suggestedBy;
        approved = p.approved;
        isSpecial;
        serviceFee;
      }
    });
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

  public shared ({ caller }) func updateListingPrice(id : Text, price : Float) : async () {
    let callerProfile = requireRegisteredCaller(caller);
    if (callerProfile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (productListings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        let updated = { listing with price };
        productListings.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func setListingStock(id : Text, outOfStock : Bool) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot update listings");
    };
    let listing = switch (productListings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?l) { l };
    };
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

  public shared ({ caller }) func updateRetailerProduct(id : Text, name : Text, description : Text, category : Text, price : Float, imageEmoji : Text, imagesJson : ?Text) : async () {
    let callerProfile = requireRegisteredCaller(caller);
    if (callerProfile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (retailerProducts.get(id)) {
      case (null) { Runtime.trap("RetailerProduct not found") };
      case (?rp) {
        let updated = { rp with name; description; category; price; imageEmoji; imagesJson };
        retailerProducts.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func setRetailerProductStock(id : Text, inStock : Bool) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot update products");
    };
    let product = switch (retailerProducts.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
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

  // Orders
  public shared ({ caller }) func placeOrder(
    id : Text,
    customerId : Text,
    customerName : Text,
    customerPhone : Text,
    itemsJson : Text,
    total : Float,
    deliveryType : Text,
    pickupPointId : Text,
    pickupPointName : Text,
    homeAddress : ?Text,
    townId : Text,
    businessAreaId : Text,
    deliveryAreasJson : ?Text,
    createdAt : Text,
    isWalkIn : Bool,
    parentOrderId : ?Text,
    dedicatedRetailerId : ?Text,
  ) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot place orders");
    };

    let callerPrincipalText = caller.toText();
    let isAdmin = Authorization.hasPermission(accessControlState, caller, #admin);
    let isApprovedStaff = isCallerApprovedInternal(caller);

    if (isWalkIn) {
      if (not (isAdmin or isApprovedStaff)) {
        Runtime.trap("Unauthorized: Only admins or approved staff can place walk-in orders");
      };
    } else {
      if (customerId != callerPrincipalText and not (isAdmin or isApprovedStaff)) {
        Runtime.trap("Unauthorized: Cannot place orders for other customers");
      };
    };

    let order : Order = {
      id;
      customerId;
      customerName;
      customerPhone;
      itemsJson;
      total;
      status = "awaiting_payment";
      deliveryType;
      pickupPointId;
      pickupPointName;
      homeAddress;
      townId;
      businessAreaId;
      deliveryAreasJson;
      shopperId = null;
      shopperName = null;
      driverId = null;
      driverName = null;
      createdAt;
      updatedAt = createdAt;
      isWalkIn;
      parentOrderId;
      dedicatedRetailerId;
    };
    orders.add(id, order);
  };

  public shared ({ caller }) func addShopperProof(orderId : Text, proofImagesJson : Text) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot add proof");
    };
    let isApprovedStaff = isCallerApprovedInternal(caller);
    let isAdm = Authorization.hasPermission(accessControlState, caller, #admin);
    if (not (isApprovedStaff or isAdm)) {
      Runtime.trap("Unauthorized: Only approved staff can add proof images");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        orderProofImages.add(orderId, proofImagesJson);
      };
    };
  };

  func extendOrder(order : Order) : OrderExtended {
    let proof = orderProofImages.get(order.id);
    { order with shopperProofImagesJson = proof }
  };

  public query ({ caller }) func getOrders() : async [OrderExtended] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    orders.values().toArray().map(extendOrder);
  };

  public query ({ caller }) func getMyOrders(customerId : Text) : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    let callerPrincipalText = caller.toText();
    if (customerId != callerPrincipalText) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        order.customerId == customerId;
      }
    );
    filteredOrders.map(extendOrder);
  };

  public query ({ caller }) func getOrderById(id : Text) : async ?Order {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    switch (orders.get(id)) {
      case (null) { null };
      case (?order) {
        let isAdmin = Authorization.isAdmin(accessControlState, caller);
        let callerPrincipalText = caller.toText();
        let isOwner = order.customerId == callerPrincipalText;
        let isAssignedShopper = switch (order.shopperId) {
          case (null) { false };
          case (?shopperId) { shopperId == callerPrincipalText };
        };
        let isAssignedDriver = switch (order.driverId) {
          case (null) { false };
          case (?driverId) { driverId == callerPrincipalText };
        };
        let isAssignedStaff = isAssignedShopper or isAssignedDriver;
        if (not (isAdmin or isOwner or isAssignedStaff)) {
          Runtime.trap("Unauthorized: Not permitted to access this order");
        };
        ?order;
      };
    };
  };

  public query ({ caller }) func getOrdersByStatus(statusText : Text) : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    let isStaff = isCallerApprovedInternal(caller) or Authorization.isAdmin(accessControlState, caller);
    if (not isStaff) {
      Runtime.trap("Unauthorized: Only approved staff can access orders by status");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        order.status == statusText;
      }
    );
    filteredOrders.map(extendOrder);
  };

  public query ({ caller }) func getOrdersByArea(businessAreaId : Text) : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders by area");
    };
    let isAdmin = Authorization.isAdmin(accessControlState, caller);
    let isApprovedStaff = isCallerApprovedInternal(caller);
    if (not (isAdmin or isApprovedStaff)) {
      Runtime.trap("Unauthorized: Only admins or approved staff can access orders by area");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        order.businessAreaId == businessAreaId
      }
    );
    filteredOrders.map(extendOrder);
  };

  public shared ({ caller }) func updateOrderStatus(
    id : Text,
    statusText : Text,
    shopperId : ?Text,
    shopperName : ?Text,
    driverId : ?Text,
    driverName : ?Text,
    updatedAt : Text,
  ) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot update orders");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let isAdmin = Authorization.hasPermission(accessControlState, caller, #admin);
        let isRelevantStaff = isCallerApprovedInternal(caller);
        if (not (isAdmin or isRelevantStaff)) {
          Runtime.trap("Unauthorized: Only admins or approved staff can update orders");
        };
        let updatedOrder = {
          order with
          status = statusText;
          shopperId;
          shopperName;
          driverId;
          driverName;
          updatedAt;
        };
        orders.add(id, updatedOrder);

        if (statusText == "delivered") {
          let customerId = order.customerId;
          let earnedTokens = order.total * 0.1;
          let existingBalance = switch (nomayiniBalances.get(customerId)) {
            case (?b) { b };
            case (null) { { totalEarned = 0.0; unlockedBalance = 0.0; lockedShortTerm = 0.0; lockedLongTerm = 0.0 } };
          };
          let shortTermShare = earnedTokens * 0.5;
          let longTermShare = earnedTokens * 0.5;
          let newBalance = {
            totalEarned = existingBalance.totalEarned + earnedTokens;
            unlockedBalance = existingBalance.unlockedBalance;
            lockedShortTerm = existingBalance.lockedShortTerm + shortTermShare;
            lockedLongTerm = existingBalance.lockedLongTerm + longTermShare;
          };
          nomayiniBalances.add(customerId, newBalance);
          let existingTxs = switch (nomayiniTransactions.get(customerId)) {
            case (?txs) { txs };
            case (null) { [] };
          };
          let newTx : NomayiniTransaction = {
            id = "tx_" # id # "_" # updatedAt;
            txType = "earned";
            amount = earnedTokens;
            description = "10% reward on order #" # id;
            date = updatedAt;
            unlockDate = null;
          };
          nomayiniTransactions.add(customerId, existingTxs.concat([newTx]));
        };
      };
    };
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete orders");
    };
    orders.remove(id);
  };

  public query ({ caller }) func getOrdersByCustomerId(customerId : Text) : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    let isAdmin = Authorization.isAdmin(accessControlState, caller);
    let isStaff = isCallerApprovedInternal(caller);
    if (not (isAdmin or isStaff)) {
      Runtime.trap("Unauthorized: Only admins or approved staff can access customer orders");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        order.customerId == customerId;
      }
    );
    filteredOrders.map(extendOrder);
  };


  public query ({ caller }) func getOrdersByPickupPoint(pickupPointId : Text) : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    let isApprovedStaff = isCallerApprovedInternal(caller);
    let isAdm = Authorization.isAdmin(accessControlState, caller);
    if (not (isApprovedStaff or isAdm)) {
      Runtime.trap("Unauthorized: Only approved staff can access orders by pickup point");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        order.pickupPointId == pickupPointId
      }
    );
    filteredOrders.map(extendOrder);
  };

  // ─── Nomayini Wallet Functions ────────────────────────────────────────────────

  public query ({ caller }) func getNomayiniBalance() : async NomayiniBalance {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access wallet");
    };
    let key = caller.toText();
    switch (nomayiniBalances.get(key)) {
      case (?b) { b };
      case (null) { { totalEarned = 0.0; unlockedBalance = 0.0; lockedShortTerm = 0.0; lockedLongTerm = 0.0 } };
    };
  };

  public query ({ caller }) func getNomayiniTransactions() : async [NomayiniTransaction] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access wallet");
    };
    let key = caller.toText();
    switch (nomayiniTransactions.get(key)) {
      case (?txs) { txs };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func sendNomayiniTokens(recipientPhone : Text, amount : Float, now : Text) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot send tokens");
    };
    let senderKey = caller.toText();
    let senderBalance = switch (nomayiniBalances.get(senderKey)) {
      case (?b) { b };
      case (null) { { totalEarned = 0.0; unlockedBalance = 0.0; lockedShortTerm = 0.0; lockedLongTerm = 0.0 } };
    };
    if (amount <= 0.0 or amount > senderBalance.unlockedBalance) {
      Runtime.trap("Insufficient unlocked balance");
    };
    let newSenderBalance = {
      senderBalance with
      unlockedBalance = senderBalance.unlockedBalance - amount;
    };
    nomayiniBalances.add(senderKey, newSenderBalance);
    let txId = "tx_send_" # now;
    let existingSenderTxs = switch (nomayiniTransactions.get(senderKey)) {
      case (?txs) { txs };
      case (null) { [] };
    };
    nomayiniTransactions.add(senderKey, existingSenderTxs.concat([{
      id = txId;
      txType = "sent";
      amount;
      description = "Sent to " # recipientPhone;
      date = now;
      unlockDate = null;
    }]));
    let recipientOpt = users.entries().toArray().find(
      func(entry : (Principal, UserProfile)) : Bool {
        entry.1.phone == recipientPhone;
      }
    );
    switch (recipientOpt) {
      case (null) { };
      case (?(recipientPrincipal, _)) {
        let recipientKey = recipientPrincipal.toText();
        let recipientBalance = switch (nomayiniBalances.get(recipientKey)) {
          case (?b) { b };
          case (null) { { totalEarned = 0.0; unlockedBalance = 0.0; lockedShortTerm = 0.0; lockedLongTerm = 0.0 } };
        };
        let newRecipientBalance = {
          recipientBalance with
          unlockedBalance = recipientBalance.unlockedBalance + amount;
          totalEarned = recipientBalance.totalEarned + amount;
        };
        nomayiniBalances.add(recipientKey, newRecipientBalance);
        let existingRecipientTxs = switch (nomayiniTransactions.get(recipientKey)) {
          case (?txs) { txs };
          case (null) { [] };
        };
        nomayiniTransactions.add(recipientKey, existingRecipientTxs.concat([{
          id = txId # "_recv";
          txType = "received";
          amount;
          description = "Received tokens";
          date = now;
          unlockDate = null;
        }]));
      };
    };
  };


  // ─── Custom Categories ────────────────────────────────────────────────────

  public shared(msg) func addCategory(name : Text) : async () {
    let profile = requireRegisteredCaller(msg.caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can add categories");
    };
    categoriesList.add(name, true);
  };

  public shared(msg) func updateCategories(names : [Text]) : async () {
    let profile = requireRegisteredCaller(msg.caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can update categories");
    };
    // Clear existing and repopulate with new list
    for (name in names.vals()) {
      categoriesList.add(name, true);
    };
  };

  public query func getCategories() : async [Text] {
    categoriesList.keys().toArray()
  };


  // ─── Articles / Blog ─────────────────────────────────────────────────────

  type Article = {
    id : Text;
    title : Text;
    body : Text;
    categoryId : Text;
    imagesJson : ?Text;
    authorPrincipal : Principal;
    createdAt : Int;
    published : Bool;
  };

  type ArticleCategory = {
    id : Text;
    name : Text;
  };

  let articles = Map.empty<Text, Article>();
  let articleCategories = Map.empty<Text, ArticleCategory>();

  public shared ({ caller }) func addArticle(id : Text, title : Text, body : Text, categoryId : Text, imagesJson : ?Text, published : Bool) : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can publish articles");
    };
    articles.add(id, {
      id; title; body; categoryId; imagesJson;
      authorPrincipal = caller;
      createdAt = Time.now();
      published;
    });
  };

  public shared ({ caller }) func updateArticle(id : Text, title : Text, body : Text, categoryId : Text, imagesJson : ?Text, published : Bool) : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can update articles");
    };
    switch (articles.get(id)) {
      case (null) { Runtime.trap("Article not found") };
      case (?existing) {
        articles.add(id, { existing with title; body; categoryId; imagesJson; published });
      };
    };
  };

  public shared ({ caller }) func deleteArticle(id : Text) : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can delete articles");
    };
    ignore articles.remove(id);
  };

  public query ({ caller }) func getArticles() : async [Article] {
    let all = articles.values().toArray();
    if (not isAnonymous(caller)) {
      switch (users.get(caller)) {
        case (?p) {
          if (p.role == #admin) { return all };
        };
        case (null) {};
      };
    };
    // Non-admin: return only published
    all.filter(func(a : Article) : Bool { a.published })
  };

  public shared ({ caller }) func addArticleCategory(id : Text, name : Text) : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can add article categories");
    };
    articleCategories.add(id, { id; name });
  };

  public query func getArticleCategories() : async [ArticleCategory] {
    articleCategories.values().toArray()
  };

  // ─── Reviews & Likes/Dislikes ─────────────────────────────────────────────

  type Review = {
    id : Text;
    targetId : Text;
    targetType : Text;
    reviewerId : Principal;
    rating : Nat;
    comment : Text;
    orderId : Text;
    createdAt : Int;
  };

  type LikeDislike = {
    targetId : Text;
    targetType : Text;
    userId : Principal;
    isLike : Bool;
  };

  let reviews = Map.empty<Text, Review>();
  let likeDislikes = Map.empty<Text, LikeDislike>();

  public shared ({ caller }) func addReview(id : Text, targetId : Text, targetType : Text, rating : Nat, comment : Text, orderId : Text) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Must be logged in to review");
    };
    reviews.add(id, {
      id; targetId; targetType; rating; comment; orderId;
      reviewerId = caller;
      createdAt = 0;
    });
  };

  public query func getReviewsForTarget(targetId : Text) : async [Review] {
    let all = reviews.values().toArray();
    all.filter(func(r : Review) : Bool { r.targetId == targetId })
  };

  public shared ({ caller }) func setLikeDislike(targetId : Text, targetType : Text, isLike : Bool) : async () {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Must be logged in to like/dislike");
    };
    let key = targetId # "_" # caller.toText();
    likeDislikes.add(key, { targetId; targetType; userId = caller; isLike });
  };

  public query func getLikesDislikesForTarget(targetId : Text) : async [LikeDislike] {
    let all = likeDislikes.values().toArray();
    all.filter(func(l : LikeDislike) : Bool { l.targetId == targetId })
  };


  // ─── Admin Data Management ─────────────────────────────────────────────────

  public shared ({ caller }) func deleteUser(userPrincipal : Principal) : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    ignore users.remove(userPrincipal);
    let key = userPrincipal.toText();
    ignore nomayiniBalances.remove(key);
    ignore nomayiniTransactions.remove(key);
  };

  public query ({ caller }) func getAllNomayiniBalances() : async [(Text, NomayiniBalance)] {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can access all balances");
    };
    nomayiniBalances.entries().toArray()
  };

  public shared ({ caller }) func wipeAllOrders() : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can wipe data");
    };
    let ids = orders.keys().toArray();
    for (id in ids.vals()) {
      ignore orders.remove(id);
      ignore orderProofImages.remove(id);
    };
  };

  public shared ({ caller }) func wipeAllNomayini() : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can wipe data");
    };
    let bkeys = nomayiniBalances.keys().toArray();
    for (k in bkeys.vals()) { ignore nomayiniBalances.remove(k) };
    let tkeys = nomayiniTransactions.keys().toArray();
    for (k in tkeys.vals()) { ignore nomayiniTransactions.remove(k) };
  };

  public shared ({ caller }) func wipeAllUsers() : async () {
    let profile = requireRegisteredCaller(caller);
    if (profile.role != #admin) {
      Runtime.trap("Unauthorized: Only admins can wipe data");
    };
    let allUsersList = users.entries().toArray();
    for ((p, userProfile) in allUsersList.vals()) {
      if (userProfile.role != #admin) {
        ignore users.remove(p);
      };
    };
  };


  // Returns ALL orders where caller is the shopper (any status) -- for history
  public query ({ caller }) func getMyShopperOrders() : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    let callerPrincipalText = caller.toText();
    let isStaff = isCallerApprovedInternal(caller);
    let isAdm = Authorization.isAdmin(accessControlState, caller);
    if (not (isStaff or isAdm)) {
      Runtime.trap("Unauthorized: Only approved staff can access shopper orders");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        switch (order.shopperId) {
          case (null) { false };
          case (?sid) { sid == callerPrincipalText };
        }
      }
    );
    filteredOrders.map(extendOrder)
  };

  // Returns ALL orders where caller is the driver (any status) -- for history
  public query ({ caller }) func getMyDriverOrders() : async [OrderExtended] {
    if (isAnonymous(caller)) {
      Runtime.trap("Unauthorized: Anonymous users cannot access orders");
    };
    let callerPrincipalText = caller.toText();
    let isStaff = isCallerApprovedInternal(caller);
    let isAdm = Authorization.isAdmin(accessControlState, caller);
    if (not (isStaff or isAdm)) {
      Runtime.trap("Unauthorized: Only approved staff can access driver orders");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        switch (order.driverId) {
          case (null) { false };
          case (?did) { did == callerPrincipalText };
        }
      }
    );
    filteredOrders.map(extendOrder)
  };


};