import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";

module {
  type AppUserRole = {
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

  type OldActor = {
    users : Map.Map<Principal, UserProfile>;
    towns : Map.Map<Text, Town>;
    businessAreas : Map.Map<Text, BusinessArea>;
    pickupPoints : Map.Map<Text, PickupPoint>;
    retailers : Map.Map<Text, Retailer>;
    products : Map.Map<Text, Product>;
    productListings : Map.Map<Text, ProductListing>;
    retailerProducts : Map.Map<Text, RetailerProduct>;
    shopperAssignments : Map.Map<Principal, [Text]>;
  };

  type NewActor = {
    users : Map.Map<Principal, UserProfile>;
    towns : Map.Map<Text, Town>;
    businessAreas : Map.Map<Text, BusinessArea>;
    pickupPoints : Map.Map<Text, PickupPoint>;
    retailers : Map.Map<Text, Retailer>;
    products : Map.Map<Text, Product>;
    productListings : Map.Map<Text, ProductListing>;
    retailerProducts : Map.Map<Text, RetailerProduct>;
    shopperAssignments : Map.Map<Principal, [Text]>;
    orders : Map.Map<Text, Order>;
  };

  public func run(old : OldActor) : NewActor {
    let newOrders = Map.empty<Text, Order>();
    { old with orders = newOrders };
  };
};
