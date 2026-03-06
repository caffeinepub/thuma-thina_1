import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppHeader } from "./components/AppHeader";
import { AppProvider, useApp } from "./context/AppContext";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { AdminApprovalsPage } from "./pages/admin/ApprovalsPage";
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
import { MyOrdersPage } from "./pages/customer/MyOrdersPage";
import { NomayiniWalletPage } from "./pages/customer/NomayiniWalletPage";
import { DriverAvailableDeliveriesPage } from "./pages/driver/AvailableDeliveriesPage";
import { DriverProfilePage } from "./pages/driver/DriverProfilePage";
import { DriverMyDeliveriesPage } from "./pages/driver/MyDeliveriesPage";
import { OperatorIncomingOrdersPage } from "./pages/operator/IncomingOrdersPage";
import { OperatorProfilePage } from "./pages/operator/OperatorProfilePage";
import { OperatorWalkInOrderPage } from "./pages/operator/WalkInOrderPage";
import { ShopperAvailableOrdersPage } from "./pages/shopper/AvailableOrdersPage";
import { ShopperMyOrdersPage } from "./pages/shopper/MyShopperOrdersPage";
import { SuggestProductPage } from "./pages/shopper/SuggestProductPage";

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
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const myOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-orders",
  component: MyOrdersPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: NomayiniWalletPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});

// Shopper
const shopperAvailableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/available",
  component: ShopperAvailableOrdersPage,
});

const shopperMyOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/my-orders",
  component: ShopperMyOrdersPage,
});

const shopperSuggestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shopper/suggest",
  component: SuggestProductPage,
});

// Driver
const driverAvailableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/available",
  component: DriverAvailableDeliveriesPage,
});

const driverMyDeliveriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/my-deliveries",
  component: DriverMyDeliveriesPage,
});

const driverProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver/profile",
  component: DriverProfilePage,
});

// Operator
const operatorIncomingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/incoming",
  component: OperatorIncomingOrdersPage,
});

const operatorWalkinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/walkin",
  component: OperatorWalkInOrderPage,
});

const operatorProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator/profile",
  component: OperatorProfilePage,
});

// Admin
const adminApprovalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/approvals",
  component: AdminApprovalsPage,
});

const adminLocationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/locations",
  component: AdminLocationsPage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/products",
  component: AdminProductsPage,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/orders",
  component: AdminOrdersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerCustomerRoute,
  registerStaffRoute,
  pendingApprovalRoute,
  catalogueRoute,
  cartRoute,
  checkoutRoute,
  myOrdersRoute,
  walletRoute,
  orderDetailRoute,
  shopperAvailableRoute,
  shopperMyOrdersRoute,
  shopperSuggestRoute,
  driverAvailableRoute,
  driverMyDeliveriesRoute,
  driverProfileRoute,
  operatorIncomingRoute,
  operatorWalkinRoute,
  operatorProfileRoute,
  adminApprovalsRoute,
  adminLocationsRoute,
  adminProductsRoute,
  adminOrdersRoute,
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
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AppProvider>
  );
}
