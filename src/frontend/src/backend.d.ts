import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    principal: Principal;
    displayName: string;
    role: AppUserRole;
    phone: string;
    registrationStatus: Variant_active_pending_updateNeeded_rejected;
    registeredAt: bigint;
    businessAreaId?: string;
}
export interface Town {
    id: string;
    province: string;
    name: string;
}
export interface RetailerProduct {
    id: string;
    inStock: boolean;
    name: string;
    description: string;
    imageEmoji: string;
    category: string;
    price: number;
    imagesJson?: string;
    retailerId: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ProductListing {
    id: string;
    productId: string;
    outOfStock: boolean;
    price: number;
    retailerId: string;
}
export interface PickupPoint {
    id: string;
    name: string;
    townId: string;
    address: string;
    profileImageUrl?: string;
}
export interface BusinessArea {
    id: string;
    name: string;
    townId: string;
    areaType: string;
}
export interface Product {
    id: string;
    suggestedBy?: string;
    inStock: boolean;
    isSuggestion: boolean;
    name: string;
    description: string;
    imageEmoji: string;
    approved: boolean;
    category: string;
    imagesJson?: string;
}
export interface Retailer {
    id: string;
    name: string;
    operatingHoursJson?: string;
    townId: string;
    address: string;
    businessAreaId: string;
}
export enum AppUserRole {
    admin = "admin",
    customer = "customer",
    operator = "operator",
    shopper = "shopper",
    driver = "driver"
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_pending_updateNeeded_rejected {
    active = "active",
    pending = "pending",
    updateNeeded = "updateNeeded",
    rejected = "rejected"
}
export interface backendInterface {
    addBusinessArea(id: string, name: string, townId: string, areaType: string): Promise<void>;
    addListing(id: string, productId: string, retailerId: string, price: number): Promise<void>;
    addPickupPoint(id: string, name: string, townId: string, address: string, profileImageUrl: string | null): Promise<void>;
    addProduct(id: string, name: string, description: string, category: string, imageEmoji: string, imagesJson: string | null): Promise<void>;
    addRetailer(id: string, name: string, townId: string, businessAreaId: string, address: string, operatingHoursJson: string | null): Promise<void>;
    addRetailerProduct(id: string, retailerId: string, name: string, description: string, category: string, price: number, imageEmoji: string, imagesJson: string | null): Promise<void>;
    /**
     * / *********************************************************
     * /    * Persistence API Endpoints
     * /   ***********************************************************
     */
    addTown(id: string, name: string, province: string): Promise<void>;
    approveSuggestion(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignShopperToRetailer(shopperPrincipal: Principal, retailerId: string): Promise<void>;
    deleteBusinessArea(id: string): Promise<void>;
    deleteListing(id: string): Promise<void>;
    deletePickupPoint(id: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    deleteRetailer(id: string): Promise<void>;
    deleteRetailerProduct(id: string): Promise<void>;
    deleteTown(id: string): Promise<void>;
    getAllShopperAssignments(): Promise<Array<[Principal, Array<string>]>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getBusinessAreas(): Promise<Array<BusinessArea>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getListings(): Promise<Array<ProductListing>>;
    getMyProfile(): Promise<UserProfile | null>;
    getPickupPoints(): Promise<Array<PickupPoint>>;
    getProducts(): Promise<Array<Product>>;
    getRetailerProducts(): Promise<Array<RetailerProduct>>;
    getRetailers(): Promise<Array<Retailer>>;
    getShopperRetailerIds(shopperPrincipal: Principal): Promise<Array<string>>;
    getStaffBusinessArea(staffPrincipal: Principal): Promise<string | null>;
    getTowns(): Promise<Array<Town>>;
    getUserCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAnyAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    registerUser(role: AppUserRole, displayName: string, phone: string, businessAreaId: string | null): Promise<void>;
    rejectSuggestion(id: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(displayName: string, phone: string, businessAreaId: string | null): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setListingStock(id: string, outOfStock: boolean): Promise<void>;
    setRetailerProductStock(id: string, inStock: boolean): Promise<void>;
    suggestProduct(id: string, name: string, description: string, category: string, imageEmoji: string, suggestedBy: string): Promise<void>;
    unassignShopperFromRetailer(shopperPrincipal: Principal, retailerId: string): Promise<void>;
    updateRetailerHours(id: string, operatingHoursJson: string): Promise<void>;
}
