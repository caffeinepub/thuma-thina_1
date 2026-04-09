import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BusinessArea {
    id: string;
    name: string;
    townId: string;
    areaType: string;
}
export interface Article {
    id: string;
    categoryId: string;
    title: string;
    body: string;
    published: boolean;
    createdAt: bigint;
    imagesJson?: string;
    authorPrincipal: Principal;
}
export interface Town {
    id: string;
    province: string;
    name: string;
}
export interface NomayiniBalance {
    totalEarned: number;
    unlockedBalance: number;
    lockedLongTerm: number;
    lockedShortTerm: number;
}
export interface ProductExtended {
    id: string;
    suggestedBy?: string;
    inStock: boolean;
    isSuggestion: boolean;
    name: string;
    description: string;
    imageEmoji: string;
    serviceFee: number;
    approved: boolean;
    category: string;
    imagesJson?: string;
    isSpecial: boolean;
}
export interface Order {
    id: string;
    customerName: string;
    status: string;
    driverId?: string;
    isWalkIn: boolean;
    total: number;
    customerPhone: string;
    pickupPointId: string;
    pickupPointName: string;
    dedicatedRetailerId?: string;
    createdAt: string;
    deliveryType: string;
    deliveryAreasJson?: string;
    parentOrderId?: string;
    updatedAt: string;
    homeAddress?: string;
    shopperId?: string;
    townId: string;
    customerId: string;
    itemsJson: string;
    driverName?: string;
    businessAreaId: string;
    shopperName?: string;
}
export interface RetailerProductExtended {
    id: string;
    availableColors?: string;
    inStock: boolean;
    outOfStockColors?: string;
    name: string;
    description: string;
    inheritedFrom?: string;
    outOfStockSizes?: string;
    outOfStockFlavors?: string;
    imageEmoji: string;
    availableWeights?: string;
    availableSizes?: string;
    category: string;
    price: number;
    imagesJson?: string;
    retailerId: string;
    availableFlavors?: string;
    outOfStockWeights?: string;
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
export interface ArticleCategory {
    id: string;
    name: string;
}
export interface NomayiniTransaction {
    id: string;
    unlockDate?: string;
    date: string;
    description: string;
    txType: string;
    amount: number;
}
export interface LikeDislike {
    userId: Principal;
    isLike: boolean;
    targetType: string;
    targetId: string;
}
export interface OrderExtended {
    id: string;
    customerName: string;
    status: string;
    driverId?: string;
    isWalkIn: boolean;
    shopperProofImagesJson?: string;
    total: number;
    customerPhone: string;
    pickupPointId: string;
    pickupPointName: string;
    dedicatedRetailerId?: string;
    createdAt: string;
    deliveryType: string;
    deliveryAreasJson?: string;
    parentOrderId?: string;
    updatedAt: string;
    homeAddress?: string;
    shopperId?: string;
    townId: string;
    customerId: string;
    itemsJson: string;
    driverName?: string;
    businessAreaId: string;
    shopperName?: string;
}
export interface RetailerExtended {
    id: string;
    name: string;
    parentRetailerId?: string;
    operatingHoursJson?: string;
    townId: string;
    address: string;
    businessAreaId: string;
}
export interface PickupPoint {
    id: string;
    name: string;
    townId: string;
    address: string;
    profileImageUrl?: string;
}
export interface Review {
    id: string;
    createdAt: bigint;
    reviewerId: Principal;
    orderId: string;
    comment: string;
    targetType: string;
    rating: bigint;
    targetId: string;
}
export interface UserProfile {
    principal: Principal;
    displayName: string;
    role: AppUserRole;
    phone: string;
    registrationStatus: Variant_active_pending_updateNeeded_rejected;
    registeredAt: bigint;
    businessAreaId?: string;
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
    addArticle(id: string, title: string, body: string, categoryId: string, imagesJson: string | null, published: boolean): Promise<void>;
    addArticleCategory(id: string, name: string): Promise<void>;
    addBusinessArea(id: string, name: string, townId: string, areaType: string): Promise<void>;
    addCategory(name: string): Promise<void>;
    addListing(id: string, productId: string, retailerId: string, price: number): Promise<void>;
    addPickupPoint(id: string, name: string, townId: string, address: string, profileImageUrl: string | null): Promise<void>;
    addProduct(id: string, name: string, description: string, category: string, imageEmoji: string, imagesJson: string | null, isSpecial: boolean, serviceFee: number): Promise<void>;
    addRetailer(id: string, name: string, townId: string, businessAreaId: string, address: string, operatingHoursJson: string | null): Promise<void>;
    addRetailerProduct(id: string, retailerId: string, name: string, description: string, category: string, price: number, imageEmoji: string, imagesJson: string | null, availableSizes: string | null, availableColors: string | null, availableFlavors: string | null, availableWeights: string | null): Promise<void>;
    addReview(id: string, targetId: string, targetType: string, rating: bigint, comment: string, orderId: string): Promise<void>;
    addShopperProof(orderId: string, proofImagesJson: string): Promise<void>;
    /**
     * / *********************************************************
     * /    * Persistence API Endpoints
     * /   ***********************************************************
     */
    addTown(id: string, name: string, province: string): Promise<void>;
    approveSuggestion(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignShopperToRetailer(shopperPrincipal: Principal, retailerId: string): Promise<void>;
    deleteArticle(id: string): Promise<void>;
    deleteArticleCategory(id: string): Promise<void>;
    deleteBusinessArea(id: string): Promise<void>;
    deleteCategory(name: string): Promise<void>;
    deleteListing(id: string): Promise<void>;
    deleteOrder(id: string): Promise<void>;
    deletePickupPoint(id: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    deleteProductAttributes(productId: string): Promise<void>;
    deleteRetailer(id: string): Promise<void>;
    deleteRetailerProduct(id: string): Promise<void>;
    deleteTown(id: string): Promise<void>;
    deleteUser(userPrincipal: Principal): Promise<void>;
    exportRetailerToTown(newId: string, sourceRetailerId: string, name: string, townId: string, businessAreaId: string, address: string): Promise<void>;
    getAllNomayiniBalances(): Promise<Array<[string, NomayiniBalance]>>;
    getAllShopperAssignments(): Promise<Array<[Principal, Array<string>]>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getArticleCategories(): Promise<Array<ArticleCategory>>;
    getArticles(): Promise<Array<Article>>;
    getBusinessAreas(): Promise<Array<BusinessArea>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<string>>;
    getLikesDislikesForTarget(targetId: string): Promise<Array<LikeDislike>>;
    getListings(): Promise<Array<ProductListing>>;
    getMyDriverOrders(): Promise<Array<OrderExtended>>;
    getMyOrders(customerId: string): Promise<Array<OrderExtended>>;
    getMyProfile(): Promise<UserProfile | null>;
    getMyShopperOrders(): Promise<Array<OrderExtended>>;
    getNomayiniBalance(): Promise<NomayiniBalance>;
    getNomayiniTransactions(): Promise<Array<NomayiniTransaction>>;
    getOrderById(id: string): Promise<Order | null>;
    getOrders(): Promise<Array<OrderExtended>>;
    getOrdersByArea(businessAreaId: string): Promise<Array<OrderExtended>>;
    getOrdersByCustomerId(customerId: string): Promise<Array<OrderExtended>>;
    getOrdersByPickupPoint(pickupPointId: string): Promise<Array<OrderExtended>>;
    getOrdersByStatus(statusText: string): Promise<Array<OrderExtended>>;
    getPickupPoints(): Promise<Array<PickupPoint>>;
    getProductAttributes(): Promise<Array<[string, string]>>;
    getProducts(): Promise<Array<ProductExtended>>;
    getRetailerProductOosOptions(id: string): Promise<{
        outOfStockColors?: string;
        outOfStockSizes?: string;
        outOfStockFlavors?: string;
        outOfStockWeights?: string;
    }>;
    getRetailerProducts(): Promise<Array<RetailerProductExtended>>;
    getRetailers(): Promise<Array<RetailerExtended>>;
    getReviewsForTarget(targetId: string): Promise<Array<Review>>;
    getShopperRetailerIds(shopperPrincipal: Principal): Promise<Array<string>>;
    getStaffBusinessArea(staffPrincipal: Principal): Promise<string | null>;
    getTowns(): Promise<Array<Town>>;
    getUserCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAnyAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    placeOrder(id: string, customerId: string, customerName: string, customerPhone: string, itemsJson: string, total: number, deliveryType: string, pickupPointId: string, pickupPointName: string, homeAddress: string | null, townId: string, businessAreaId: string, deliveryAreasJson: string | null, createdAt: string, isWalkIn: boolean, parentOrderId: string | null, dedicatedRetailerId: string | null): Promise<void>;
    registerUser(role: AppUserRole, displayName: string, phone: string, businessAreaId: string | null): Promise<void>;
    rejectSuggestion(id: string): Promise<void>;
    renameCategory(oldName: string, newName: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(displayName: string, phone: string, businessAreaId: string | null): Promise<void>;
    sendNomayiniTokens(recipientPhone: string, amount: number, now: string): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setLikeDislike(targetId: string, targetType: string, isLike: boolean): Promise<void>;
    setListingStock(id: string, outOfStock: boolean): Promise<void>;
    setProductAttributes(productId: string, attributesJson: string): Promise<void>;
    setRetailerProductAttributeStock(id: string, outOfStockSizes: string | null, outOfStockColors: string | null, outOfStockFlavors: string | null, outOfStockWeights: string | null): Promise<void>;
    setRetailerProductStock(id: string, inStock: boolean): Promise<void>;
    suggestProduct(id: string, name: string, description: string, category: string, imageEmoji: string, suggestedBy: string): Promise<void>;
    unassignShopperFromRetailer(shopperPrincipal: Principal, retailerId: string): Promise<void>;
    updateArticle(id: string, title: string, body: string, categoryId: string, imagesJson: string | null, published: boolean): Promise<void>;
    updateArticleCategory(id: string, name: string): Promise<void>;
    updateCategories(names: Array<string>): Promise<void>;
    updateListingPrice(id: string, price: number): Promise<void>;
    updateOrderStatus(id: string, statusText: string, shopperId: string | null, shopperName: string | null, driverId: string | null, driverName: string | null, updatedAt: string): Promise<void>;
    updatePickupPoint(id: string, name: string, address: string, profileImageUrl: string | null): Promise<void>;
    updateProduct(id: string, name: string, description: string, category: string, imageEmoji: string, imagesJson: string | null, isSpecial: boolean, serviceFee: number): Promise<void>;
    updateRetailerHours(id: string, operatingHoursJson: string): Promise<void>;
    updateRetailerProduct(id: string, name: string, description: string, category: string, price: number, imageEmoji: string, imagesJson: string | null, availableSizes: string | null, availableColors: string | null, availableFlavors: string | null, availableWeights: string | null): Promise<void>;
    wipeAllNomayini(): Promise<void>;
    wipeAllOrders(): Promise<void>;
    wipeAllUsers(): Promise<void>;
}
