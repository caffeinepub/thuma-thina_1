import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "./components/AppHeader";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import { ArticleDetailPage } from "./pages/ArticleDetailPage";
// Pages
import { LandingPage } from "./pages/LandingPage";
import { NewsPage } from "./pages/NewsPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { AdminNewsPage } from "./pages/admin/AdminNewsPage";
import { AdminAnalyticsPage } from "./pages/admin/AnalyticsPage";
import { AdminApprovalsPage } from "./pages/admin/ApprovalsPage";
import { DataManagementPage } from "./pages/admin/DataManagementPage";
import { AdminLocationsPage } from "./pages/admin/LocationsPage";
import { AdminOrdersPage } from "./pages/admin/OrdersOverviewPage";
import { AdminProductsPage } from "./pages/admin/ProductsPage";
import { CustomerRegisterPage } from "./pages/auth/CustomerRegisterPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { PendingApprovalPage } from "./pages/auth/PendingApprovalPage";
import { StaffApplyPage } from "./pages/auth/StaffApplyPage";
import { CartPage } from "./pages/customer/CartPage";
import { CataloguePage } from "./pages/customer/CataloguePage";
import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { ListingDetailPage } from "./pages/customer/ListingDetailPage";
import { MyOrdersPage } from "./pages/customer/MyOrdersPage";
import { NomayiniWalletPage } from "./pages/customer/NomayiniWalletPage";
import { DriverAvailableDeliveriesPage } from "./pages/driver/AvailableDeliveriesPage";
import { DriverAnalyticsPage } from "./pages/driver/DriverAnalyticsPage";
import { DriverProfilePage } from "./pages/driver/DriverProfilePage";
import { DriverMyDeliveriesPage } from "./pages/driver/MyDeliveriesPage";
import { OperatorIncomingOrdersPage } from "./pages/operator/IncomingOrdersPage";
import { OperatorAnalyticsPage } from "./pages/operator/OperatorAnalyticsPage";
import { OperatorProfilePage } from "./pages/operator/OperatorProfilePage";
import { OperatorWalkInOrderPage } from "./pages/operator/WalkInOrderPage";
import { ShopperAvailableOrdersPage } from "./pages/shopper/AvailableOrdersPage";
import { ShopperMyOrdersPage } from "./pages/shopper/MyShopperOrdersPage";
import { ShopperAnalyticsPage } from "./pages/shopper/ShopperAnalyticsPage";
import { ShopperStockPage } from "./pages/shopper/ShopperStockPage";
import { SuggestProductPage } from "./pages/shopper/SuggestProductPage";

// ─── Sync auth user to app context ───────────────────────────────────────────

function UserSyncBridge() {
  const { userProfile, principalText } = useAuth();
  const { setCurrentUser } = useApp();

  useEffect(() => {
    if (userProfile) {
      setCurrentUser({
        id: principalText ?? userProfile.principal.toString(),
        name: userProfile.displayName,
        phone: userProfile.phone,
      });
    } else {
      setCurrentUser(null);
    }
  }, [userProfile, principalText, setCurrentUser]);

  return null;
}

// ─── Protected Route Wrapper ──────────────────────────────────────────────────

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, needsRegistration } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    throw redirect({ to: "/login" });
  }

  if (needsRegistration) {
    // Authenticated via II but no backend profile yet — go to registration
    throw redirect({ to: "/register/customer" });
  }

  return <>{children}</>;
}

// ─── Layout component ─────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerCustomerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register/customer",
  component: CustomerRegisterPage,
});

const registerStaffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register/staff",
  component: StaffApplyPage,
});

const pendingApprovalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pending-approval",
  component: PendingApprovalPage,
});

// Customer
const catalogueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalogue",
  component: CataloguePage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: () => (
    <ProtectedPage>
      <CartPage />
    </ProtectedPage>
  ),
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: () => (
    <ProtectedPage>
      <CheckoutPage />
    </ProtectedPage>
  ),
});

const myOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-orders",
  component: () => (
    <ProtectedPage>
      <MyOrdersPage />
    </ProtectedPage>
  ),
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: () => (
    <ProtectedPage>
      <NomayiniWalletPage />
    </ProtectedPage>
  ),
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: () => (
    <ProtectedPage>
      <OrderDetailPage />
    </ProtectedPage>
  ),
});

// Shopper
const shopperAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/analytics",
  component: () => (
    <ProtectedPage>
      <ShopperAnalyticsPage />
    </ProtectedPage>
  ),
});

const shopperAvailableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/available",
  component: () => (
    <ProtectedPage>
      <ShopperAvailableOrdersPage />
    </ProtectedPage>
  ),
});

const shopperMyOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/my-orders",
  component: () => (
    <ProtectedPage>
      <ShopperMyOrdersPage />
    </ProtectedPage>
  ),
});

const shopperSuggestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/suggest",
  component: () => (
    <ProtectedPage>
      <SuggestProductPage />
    </ProtectedPage>
  ),
});

const shopperStockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/stock",
  component: () => (
    <ProtectedPage>
      <ShopperStockPage />
    </ProtectedPage>
  ),
});

// Driver
const driverAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/analytics",
  component: () => (
    <ProtectedPage>
      <DriverAnalyticsPage />
    </ProtectedPage>
  ),
});

const driverAvailableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/available",
  component: () => (
    <ProtectedPage>
      <DriverAvailableDeliveriesPage />
    </ProtectedPage>
  ),
});

const driverMyDeliveriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/my-deliveries",
  component: () => (
    <ProtectedPage>
      <DriverMyDeliveriesPage />
    </ProtectedPage>
  ),
});

const driverProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/profile",
  component: () => (
    <ProtectedPage>
      <DriverProfilePage />
    </ProtectedPage>
  ),
});

// Operator
const operatorAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/analytics",
  component: () => (
    <ProtectedPage>
      <OperatorAnalyticsPage />
    </ProtectedPage>
  ),
});

const operatorIncomingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/incoming",
  component: () => (
    <ProtectedPage>
      <OperatorIncomingOrdersPage />
    </ProtectedPage>
  ),
});

const operatorWalkinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/walkin",
  component: () => (
    <ProtectedPage>
      <OperatorWalkInOrderPage />
    </ProtectedPage>
  ),
});

const operatorProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/profile",
  component: () => (
    <ProtectedPage>
      <OperatorProfilePage />
    </ProtectedPage>
  ),
});

// Admin
const adminApprovalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/approvals",
  component: () => (
    <ProtectedPage>
      <AdminApprovalsPage />
    </ProtectedPage>
  ),
});

const adminLocationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/locations",
  component: () => (
    <ProtectedPage>
      <AdminLocationsPage />
    </ProtectedPage>
  ),
});

const adminProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/products",
  component: () => (
    <ProtectedPage>
      <AdminProductsPage />
    </ProtectedPage>
  ),
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/orders",
  component: () => (
    <ProtectedPage>
      <AdminOrdersPage />
    </ProtectedPage>
  ),
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/analytics",
  component: () => (
    <ProtectedPage>
      <AdminAnalyticsPage />
    </ProtectedPage>
  ),
});

const adminDataManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/data-management",
  component: () => (
    <ProtectedPage>
      <DataManagementPage />
    </ProtectedPage>
  ),
});

const newsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/news",
  component: NewsPage,
});

const articleDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/news/$articleId",
  component: ArticleDetailPage,
});

const adminNewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/news",
  component: () => (
    <ProtectedPage>
      <AdminNewsPage />
    </ProtectedPage>
  ),
});

const listingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/listing/$listingId",
  component: ListingDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerCustomerRoute,
  registerStaffRoute,
  pendingApprovalRoute,
  catalogueRoute,
  listingDetailRoute,
  newsRoute,
  articleDetailRoute,
  adminNewsRoute,
  cartRoute,
  checkoutRoute,
  myOrdersRoute,
  walletRoute,
  orderDetailRoute,
  shopperAnalyticsRoute,
  shopperAvailableRoute,
  shopperMyOrdersRoute,
  shopperSuggestRoute,
  shopperStockRoute,
  driverAnalyticsRoute,
  driverAvailableRoute,
  driverMyDeliveriesRoute,
  driverProfileRoute,
  operatorAnalyticsRoute,
  operatorIncomingRoute,
  operatorWalkinRoute,
  operatorProfileRoute,
  adminApprovalsRoute,
  adminLocationsRoute,
  adminProductsRoute,
  adminOrdersRoute,
  adminAnalyticsRoute,
  adminDataManagementRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <UserSyncBridge />
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </AppProvider>
    </AuthProvider>
  );
}
